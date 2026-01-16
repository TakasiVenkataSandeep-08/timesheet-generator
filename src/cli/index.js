#!/usr/bin/env node

const { Command } = require("commander");
const ConfigLoader = require("../config/loader");
const { getAdapter, createAdapterFromUrl } = require("../adapters");
const TimesheetGenerator = require("../core/TimesheetGenerator");
const { getFormatter } = require("../formatters");
const { parseDateRange } = require("../utils/dateUtils");
const { filterBranches } = require("../utils/branchUtils");
const { deduplicateCommits } = require("../utils/commitUtils");
const { handleError } = require("../utils/errorHandler");
const { withProgress, withItemProgress } = require("../utils/progress");
const fs = require("fs");
const path = require("path");

const program = new Command();

program
  .name("timesheet")
  .description("Auto-generate timesheets from git commits")
  .version("0.0.1");

program
  .command("generate")
  .alias("gen")
  .description("Generate timesheet from git commits")
  .option("--since <date>", "Start date (YYYY-MM-DD)")
  .option("--until <date>", "End date (YYYY-MM-DD)")
  .option(
    "--date-range <range>",
    "Date range (last-week, this-week, last-month, this-month)"
  )
  .option("--branch <branch>", "Branch name or pattern (e.g., 'feature/*')")
  .option("--all-branches", "Include all branches")
  .option("--author <author>", "Filter by author name or email")
  .option(
    "--format <format>",
    "Output format (json, csv, markdown, jira, simple, pdf, html)",
    "json"
  )
  .option("--simple", "Alias for --format simple (no-nonsense mode)")
  .option("--output <file>", "Output file path")
  .option("--repo <path>", "Repository path (default: current directory)")
  .option("--github <owner/repo>", "GitHub repository (e.g., 'owner/repo')")
  .option(
    "--gitlab <project-id>",
    "GitLab project ID or path (e.g., 'owner/repo')"
  )
  .option(
    "--gitlab-url <url>",
    "GitLab instance URL (default: https://gitlab.com)"
  )
  .option(
    "--token <token>",
    "API token (or use GITHUB_TOKEN/GITLAB_TOKEN env var)"
  )
  .option(
    "--multi-repo <paths...>",
    "Multiple repository paths (space-separated)"
  )
  .option("--no-merges", "Exclude merge commits")
  .option("--include-stats", "Include file statistics")
  .option("--interactive", "Interactive mode with prompts")
  .action(async (options) => {
    try {
      // Interactive mode
      if (options.interactive) {
        const inquirer = require("inquirer");
        const interactiveAnswers = await inquirer.prompt([
          {
            type: "list",
            name: "dateRange",
            message: "Date range:",
            choices: [
              "last-week",
              "this-week",
              "last-month",
              "this-month",
              "custom",
            ],
            default: "last-week",
          },
          {
            type: "input",
            name: "since",
            message: "Start date (YYYY-MM-DD):",
            when: (answers) => answers.dateRange === "custom",
          },
          {
            type: "input",
            name: "until",
            message: "End date (YYYY-MM-DD):",
            when: (answers) => answers.dateRange === "custom",
          },
          {
            type: "list",
            name: "format",
            message: "Output format:",
            choices: [
              "json",
              "csv",
              "markdown",
              "jira",
              "simple",
              "pdf",
              "html",
            ],
            default: "json",
          },
          {
            type: "input",
            name: "output",
            message: "Output file (optional, press Enter to skip):",
          },
        ]);

        // Merge interactive answers
        if (interactiveAnswers.dateRange !== "custom") {
          options.dateRange = interactiveAnswers.dateRange;
        } else {
          options.since = interactiveAnswers.since;
          options.until = interactiveAnswers.until;
        }
        options.format = interactiveAnswers.format;
        if (interactiveAnswers.output) {
          options.output = interactiveAnswers.output;
        }
      }

      // Load config
      const configLoader = new ConfigLoader();
      const config = configLoader.load();

      // Handle --simple flag (alias for --format simple)
      const format = options.simple
        ? "simple"
        : options.format || config.output?.format || "json";

      // Merge CLI options with config
      const mergedConfig = {
        ...config,
        defaults: {
          ...config.defaults,
          ...(options.author && { author: options.author }),
          ...(options.branch && { branches: options.branch }),
          ...(options.allBranches && { branches: "all" }),
          ...(options.noMerges !== undefined && {
            excludeMerges: options.noMerges,
          }),
        },
        output: {
          ...config.output,
          format: format,
          ...(options.includeStats !== undefined && {
            includeStats: options.includeStats,
          }),
        },
      };

      // Parse date range
      let since, until;
      if (options.dateRange) {
        const range = parseDateRange(options.dateRange);
        since = range.start;
        until = range.end;
      } else if (options.since || options.until) {
        since = options.since ? new Date(options.since) : null;
        until = options.until ? new Date(options.until) : null;
      } else {
        // Use default from config
        const range = parseDateRange(mergedConfig.defaults.dateRange);
        since = range.start;
        until = range.end;
      }

      // Determine adapter type and create adapters
      const adapters = [];
      const repoInfos = [];

      // Validate inputs
      if (options.github && !options.github.includes("/")) {
        throw new Error("GitHub repository must be in format 'owner/repo'");
      }

      if (options.github) {
        // GitHub adapter
        const [owner, repo] = options.github.split("/");
        if (!owner || !repo) {
          throw new Error("GitHub repository must be in format 'owner/repo'");
        }
        const adapter = getAdapter("github", {
          owner,
          repo,
          token: options.token || process.env.GITHUB_TOKEN,
        });
        adapters.push(adapter);
        repoInfos.push(await adapter.getRepoInfo());
      } else if (options.gitlab) {
        // GitLab adapter
        const adapter = getAdapter("gitlab", {
          projectId: options.gitlab,
          token: options.token || process.env.GITLAB_TOKEN,
          baseUrl: options.gitlabUrl || "https://gitlab.com",
        });
        adapters.push(adapter);
        repoInfos.push(await adapter.getRepoInfo());
      } else if (options.multiRepo && options.multiRepo.length > 0) {
        // Multiple local repos
        for (const repoPath of options.multiRepo) {
          const adapter = getAdapter("local", repoPath);
          adapters.push(adapter);
          repoInfos.push(await adapter.getRepoInfo());
        }
      } else {
        // Single local repo (default)
        const repoPath = options.repo || process.cwd();
        const adapter = getAdapter("local", repoPath);
        adapters.push(adapter);
        repoInfos.push(await adapter.getRepoInfo());
      }

      // Collect commits from all adapters
      let allCommits = [];

      // Use progress indicator for fetching commits
      const { results, errors } = await withItemProgress(
        adapters,
        async (adapter, index) => {
          const repoInfo = repoInfos[index];

          // Get branches
          let branches = null;
          if (options.branch && !options.allBranches) {
            const allBranches = await adapter.getBranches().catch(() => []);
            branches = filterBranches(allBranches, options.branch);
          } else if (
            options.allBranches ||
            mergedConfig.defaults.branches === "all"
          ) {
            branches = null;
          } else if (
            mergedConfig.defaults.branches &&
            mergedConfig.defaults.branches !== "all"
          ) {
            const allBranches = await adapter.getBranches().catch(() => []);
            branches = filterBranches(
              allBranches,
              mergedConfig.defaults.branches
            );
          }

          // Get commits
          const commits = await adapter.getCommits({
            since,
            until,
            author:
              mergedConfig.defaults.author !== "auto"
                ? mergedConfig.defaults.author
                : null,
            branches,
            noMerges: mergedConfig.defaults.excludeMerges,
            includeFileStats: mergedConfig.output.includeFileChanges,
          });

          // Add repo info to commits for multi-repo tracking
          commits.forEach((commit) => {
            commit.repo = repoInfo.name || repoInfo.path;
            commit.repoType = repoInfo.type;
          });

          return commits;
        },
        {
          itemText: "repository",
          totalText: "Fetching commits",
          showItemName: false,
        }
      );

      // Collect successful results
      results.forEach((commits) => {
        allCommits.push(...commits);
      });

      // Log errors
      errors.forEach(({ item: adapter, error }) => {
        const repoInfo = repoInfos[adapters.indexOf(adapter)];
        const formattedError = handleError(error, { log: false });
        console.warn(
          `⚠️  Warning: Failed to fetch commits from ${
            repoInfo.name || repoInfo.path
          }: ${formattedError.message}`
        );
        if (process.env.DEBUG) {
          console.error("Full error:", error);
          console.error("Stack:", error?.stack);
        }
      });

      // Deduplicate commits across repos
      const commits = deduplicateCommits(allCommits);

      if (commits.length === 0) {
        console.log("No commits found for the specified criteria.");
        // If multi-repo and some repos failed, show summary
        if (adapters.length > 1) {
          console.log(
            "\n💡 Tip: Some repositories may have failed. Check warnings above or run with DEBUG=1 for details."
          );
        }
        process.exit(0);
      }

      console.log(
        `Found ${commits.length} commits from ${adapters.length} repository(ies).`
      );

      // Generate timesheet with progress indicator
      const generator = new TimesheetGenerator(mergedConfig);
      const timesheet = await withProgress("Generating timesheet", async () => {
        return await generator.generate(commits, {
          period: {
            start: since ? since.toISOString().split("T")[0] : null,
            end: until ? until.toISOString().split("T")[0] : null,
          },
        });
      });

      // Format output
      const formatter = getFormatter(mergedConfig.output.format);
      const output = await formatter.format(timesheet);

      // Write to file or stdout
      if (options.output) {
        // Handle binary formats (PDF)
        if (format === "pdf" && Buffer.isBuffer(output)) {
          fs.writeFileSync(options.output, output);
        } else {
          fs.writeFileSync(options.output, output, "utf8");
        }
        console.log(`\nTimesheet written to: ${options.output}`);
        console.log(`Total hours: ${timesheet.totalHours}h`);
        console.log(`Total sessions: ${timesheet.totalSessions}`);
      } else {
        // For binary formats, must specify output file
        if (format === "pdf" && Buffer.isBuffer(output)) {
          console.error("PDF format requires --output option");
          process.exit(1);
        }
        console.log(output);
      }
    } catch (error) {
      const formattedError = handleError(error, {
        includeStack: !!process.env.DEBUG,
      });
      process.exit(1);
    }
  });

program
  .command("mcp-server")
  .description("Start MCP server for AI tool integration")
  .action(async () => {
    try {
      const { TimesheetMCPServer } = require("../mcp");
      const server = new TimesheetMCPServer();
      await server.start();
    } catch (error) {
      console.error("Error starting MCP server:", error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command("config")
  .description("Interactive configuration wizard")
  .action(async () => {
    try {
      const { configWizard } = require("./commands/config");
      await configWizard();
    } catch (error) {
      console.error("Error in config wizard:", error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command("validate")
  .description("Validate configuration and setup")
  .option("--repo <path>", "Repository path to validate")
  .action(async (options) => {
    try {
      const { validate } = require("./commands/validate");
      await validate(options);
    } catch (error) {
      console.error("Validation error:", error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
