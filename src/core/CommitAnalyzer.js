const { extractProjectFromBranch } = require("../utils/branchUtils");
const { getProjectMappings, learnFromBranch, learnFromFilePath } = require("../config/projectMappings");

/**
 * Commit Analyzer - extracts metadata from commits
 */
class CommitAnalyzer {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Extract ticket IDs from commit message
   * Supports: Jira (PROJ-123), Linear (PROJ-123), GitHub (#123)
   */
  extractTickets(message) {
    const tickets = [];
    const patterns = [
      // Jira/Linear: PROJ-123, PROJECT-456
      /\b([A-Z][A-Z0-9]*-[0-9]+)\b/g,
      // GitHub: #123, owner/repo#123
      /(?:^|\s)(?:#|GH-)(\d+)/gi,
    ];

    for (const pattern of patterns) {
      const matches = message.matchAll(pattern);
      for (const match of matches) {
        tickets.push(match[1] || match[0].trim());
      }
    }

    return [...new Set(tickets)];
  }

  /**
   * Categorize project from commit
   */
  categorizeProject(commit, config = {}) {
    // Load project mappings (user-defined + defaults)
    const projects = config.projects || getProjectMappings(config.configPath);

    // 1. Check branch name
    if (commit.branches && commit.branches.length > 0) {
      for (const branch of commit.branches) {
        // Try configured project patterns first
        for (const [projectName, projectConfig] of Object.entries(projects)) {
          if (
            projectConfig.branches &&
            projectConfig.branches.some((pattern) =>
              this._matchesPattern(branch, pattern)
            )
          ) {
            return projectName;
          }
        }

        // Try learning from branch pattern (prefer learnFromBranch for feature/* patterns)
        const projectFromBranch = learnFromBranch(branch) || extractProjectFromBranch(branch);
        if (projectFromBranch) {
          return projectFromBranch;
        }
      }
    }

    // 2. Check file paths
    if (commit.fileStats && commit.fileStats.length > 0) {
      // Try configured project patterns first
      for (const [projectName, projectConfig] of Object.entries(projects)) {
        if (projectConfig.files) {
          for (const filePattern of projectConfig.files) {
            if (
              commit.fileStats.some((stat) =>
                this._matchesPattern(stat.filePath, filePattern)
              )
            ) {
              return projectName;
            }
          }
        }
      }

      // Try learning from file paths
      for (const stat of commit.fileStats) {
        const projectFromPath = learnFromFilePath(stat.filePath);
        if (projectFromPath) {
          return projectFromPath;
        }
      }
    }

    // 3. Check commit message keywords
    if (commit.message) {
      for (const [projectName, projectConfig] of Object.entries(projects)) {
        if (projectConfig.keywords) {
          const messageLower = commit.message.toLowerCase();
          if (
            projectConfig.keywords.some((keyword) =>
              messageLower.includes(keyword.toLowerCase())
            )
          ) {
            return projectName;
          }
        }
      }
    }

    return null;
  }

  /**
   * Analyze file types in commit
   */
  analyzeFileTypes(fileStats) {
    const categories = {
      frontend: [],
      backend: [],
      tests: [],
      docs: [],
      config: [],
      other: [],
    };

    const frontendExtensions = [
      ".tsx",
      ".jsx",
      ".ts",
      ".js",
      ".css",
      ".scss",
      ".vue",
      ".svelte",
    ];
    const backendExtensions = [
      ".py",
      ".java",
      ".go",
      ".rs",
      ".rb",
      ".php",
      ".cpp",
      ".c",
    ];
    const testExtensions = [
      ".test.",
      ".spec.",
      ".test.js",
      ".spec.js",
      ".test.ts",
      ".spec.ts",
    ];
    const docExtensions = [".md", ".rst", ".txt", ".adoc"];
    const configExtensions = [
      ".json",
      ".yaml",
      ".yml",
      ".toml",
      ".ini",
      ".conf",
    ];

    for (const stat of fileStats) {
      const ext = stat.filePath.toLowerCase();
      // Check test files first (before frontend/backend)
      if (testExtensions.some((e) => ext.includes(e))) {
        categories.tests.push(stat.filePath);
      } else if (frontendExtensions.some((e) => ext.includes(e))) {
        categories.frontend.push(stat.filePath);
      } else if (backendExtensions.some((e) => ext.includes(e))) {
        categories.backend.push(stat.filePath);
      } else if (docExtensions.some((e) => ext.includes(e))) {
        categories.docs.push(stat.filePath);
      } else if (configExtensions.some((e) => ext.includes(e))) {
        categories.config.push(stat.filePath);
      } else {
        categories.other.push(stat.filePath);
      }
    }

    return categories;
  }

  /**
   * Analyze a single commit
   */
  analyze(commit) {
    const tickets = this.extractTickets(commit.message);
    const project = this.categorizeProject(commit, this.config);
    const fileTypes = commit.fileStats
      ? this.analyzeFileTypes(commit.fileStats)
      : null;

    return {
      ...commit,
      tickets,
      project,
      fileTypes,
    };
  }

  /**
   * Analyze multiple commits
   */
  analyzeBatch(commits) {
    return commits.map((commit) => this.analyze(commit));
  }

  _matchesPattern(str, pattern) {
    const regexPattern = pattern.replace(/\*/g, ".*").replace(/\?/g, ".");
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(str);
  }
}

module.exports = CommitAnalyzer;
