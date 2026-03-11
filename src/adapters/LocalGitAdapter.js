const VCSAdapter = require("./base/VCSAdapter");
const { getCommits: getCommitsFromGit } = require("../index");
const { normalizeCommit } = require("../utils/commitUtils");
const { exec } = require("child_process");
const { promisify } = require("util");
const { getCache } = require("../utils/cache");
const fs = require("fs");

const execAsync = promisify(exec);

/**
 * Local Git Adapter - uses local git repository
 */
class LocalGitAdapter extends VCSAdapter {
  constructor(repoPath) {
    super();
    this.repoPath = repoPath || process.cwd();
    this.cache = getCache({ defaultTTL: 1800000 }); // 30 minutes for branches
  }

  async getCommits(options = {}) {
    const { branches, ...otherOptions } = options;

    // Validate repository path exists
    if (!fs.existsSync(this.repoPath)) {
      throw new Error(`Repository path does not exist: ${this.repoPath}`);
    }

    // Validate repository is a git repository
    try {
      await execAsync(`git -C "${this.repoPath}" rev-parse --git-dir`);
    } catch (error) {
      throw new Error(`Not a git repository: ${this.repoPath}`);
    }

    // If no branches specified or only one branch, use the original approach
    if (!branches || branches.length <= 1) {
      try {
        const commits = await getCommitsFromGit({
          repoPath: this.repoPath,
          branches,
          ...otherOptions,
        });

        if (process.env.DEBUG) {
          console.warn(
            `DEBUG LocalGitAdapter: Got ${commits.length} raw commits from getCommitsFromGit`,
          );
          if (commits.length > 0) {
            console.warn(`DEBUG LocalGitAdapter: Sample commit:`, {
              hash: commits[0].hash?.substring(0, 7),
              date: commits[0].date,
              dateType: typeof commits[0].date,
              author: commits[0].authorName,
            });
          }
        }

        // Normalize commits and filter out invalid ones
        const normalized = commits.map((c) => normalizeCommit(c));
        const valid = normalized.filter((c) => c !== null);

        if (process.env.DEBUG) {
          const skipped = commits.length - valid.length;
          if (skipped > 0) {
            console.warn(
              `DEBUG LocalGitAdapter: After normalization: ${valid.length} valid, ${skipped} filtered out`,
            );
          } else {
            console.warn(
              `DEBUG LocalGitAdapter: All ${valid.length} commits normalized successfully`,
            );
          }
        }

        return valid;
      } catch (error) {
        // For single branch, if branch doesn't exist, throw an error
        if (branches && branches.length === 1) {
          throw new Error(
            `Branch '${branches[0]}' does not exist in repository ${this.repoPath}`,
          );
        }
        throw error;
      }
    }

    // For multiple branches, fetch from each branch separately and deduplicate
    const allCommits = [];
    const failedBranches = [];

    for (const branch of branches) {
      try {
        const commits = await getCommitsFromGit({
          repoPath: this.repoPath,
          branches: [branch],
          ...otherOptions,
        });

        allCommits.push(...commits);
      } catch (error) {
        // Skip non-existing branches and continue with others
        failedBranches.push(branch);
        if (process.env.DEBUG) {
          console.warn(
            `DEBUG LocalGitAdapter: Skipping branch '${branch}' - ${error.message}`,
          );
        }
      }
    }

    // Log warning about skipped branches if any
    if (failedBranches.length > 0) {
      console.warn(
        `Warning: Skipped ${failedBranches.length} non-existent branches: ${failedBranches.join(", ")}`,
      );
    }

    if (process.env.DEBUG) {
      console.warn(
        `DEBUG LocalGitAdapter: Total raw commits from all branches: ${allCommits.length}`,
      );
    }

    // Normalize commits and filter out invalid ones
    const normalized = allCommits.map((c) => normalizeCommit(c));
    const valid = normalized.filter((c) => c !== null);

    // Deduplicate by hash and merge branch information
    const commitMap = new Map();
    for (const commit of valid) {
      if (commitMap.has(commit.hash)) {
        // Merge branches from duplicate commits
        const existing = commitMap.get(commit.hash);
        existing.branches = [
          ...new Set([...existing.branches, ...commit.branches]),
        ];
      } else {
        commitMap.set(commit.hash, { ...commit });
      }
    }

    const deduplicated = Array.from(commitMap.values());

    if (process.env.DEBUG) {
      const skipped = allCommits.length - valid.length;
      const duplicates = valid.length - deduplicated.length;
      console.warn(
        `DEBUG LocalGitAdapter: After processing: ${deduplicated.length} unique commits (${duplicates} duplicates removed, ${skipped} invalid filtered out)`,
      );
    }

    return deduplicated;
  }

  async getBranches(options = {}) {
    // Check cache first
    const cacheKey = this.cache.generateBranchCacheKey(
      this.name,
      this.repoPath,
    );
    const cachedBranches = this.cache.get(cacheKey);
    if (cachedBranches) {
      return cachedBranches;
    }

    const branches = new Set();

    // Fetch all branch types systematically
    const branchTypes = [
      { cmd: "branch -r", prefix: "origin/" },
      { cmd: "branch", prefix: "" },
    ];

    for (const { cmd, prefix } of branchTypes) {
      try {
        const { stdout } = await execAsync(
          `git -C "${this.repoPath}" ${cmd} --format="%(refname:short)"`,
        );
        stdout
          .split("\n")
          .map((b) => b.trim())
          .filter(Boolean)
          .forEach((b) => {
            // Remove the prefix and clean up the branch name
            let cleanBranch = b.replace(new RegExp(`^${prefix}`), "");
            // Handle special cases like HEAD -> master
            cleanBranch = cleanBranch.replace(/^HEAD -> /, "");
            if (cleanBranch && !cleanBranch.includes("->")) {
              branches.add(cleanBranch);
            }
          });
      } catch (error) {
        if (process.env.DEBUG) {
          console.warn(`Failed to fetch branches with ${cmd}:`, error.message);
        }
      }
    }

    let branchList = Array.from(branches);

    // If prioritizing recent branches (for --all-branches), sort by recent activity
    if (options.prioritizeRecent) {
      branchList = await this.sortBranchesByRecentActivity(branchList);

      // Limit to a reasonable number of recent branches (default 50)
      const maxBranches = options.maxBranches || 50;
      if (branchList.length > maxBranches) {
        branchList = branchList.slice(0, maxBranches);
        if (process.env.DEBUG) {
          console.warn(
            `DEBUG LocalGitAdapter: Limited to ${maxBranches} most recent branches`,
          );
        }
      }
    }

    // Cache the result
    this.cache.set(cacheKey, branchList, 1800000); // 30 minutes

    return branchList;
  }

  async sortBranchesByRecentActivity(branches) {
    const branchActivity = [];

    for (const branch of branches) {
      try {
        // Get the date of the latest commit on each branch
        const { stdout } = await execAsync(
          `git -C "${this.repoPath}" log -1 --format="%ct" ${branch}`,
          { timeout: 5000 }, // 5 second timeout per branch
        );
        const timestamp = parseInt(stdout.trim()) * 1000; // Convert to milliseconds
        branchActivity.push({ branch, timestamp });
      } catch (error) {
        // If we can't get the commit date, put it at the end
        branchActivity.push({ branch, timestamp: 0 });
      }
    }

    // Sort by timestamp (most recent first)
    branchActivity.sort((a, b) => b.timestamp - a.timestamp);

    return branchActivity.map((item) => item.branch);
  }

  async getRepoInfo() {
    try {
      const { stdout: remoteUrl } = await execAsync(
        `git -C "${this.repoPath}" config --get remote.origin.url`,
      ).catch(() => ({ stdout: "" }));

      const { stdout: repoName } = await execAsync(
        `git -C "${this.repoPath}" rev-parse --show-toplevel`,
      ).catch(() => ({ stdout: this.repoPath }));

      return {
        path: this.repoPath,
        name: repoName.trim().split("/").pop() || "unknown",
        url: remoteUrl.trim() || null,
        type: "local",
      };
    } catch (error) {
      return {
        path: this.repoPath,
        name: "unknown",
        url: null,
        type: "local",
      };
    }
  }
}

module.exports = LocalGitAdapter;
