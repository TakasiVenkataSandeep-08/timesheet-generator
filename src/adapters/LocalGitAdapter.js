const VCSAdapter = require("./base/VCSAdapter");
const { getCommits: getCommitsFromGit } = require("../index");
const { normalizeCommit } = require("../utils/commitUtils");
const { exec } = require("child_process");
const { promisify } = require("util");
const { getCache } = require("../utils/cache");

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
    const commits = await getCommitsFromGit({
      repoPath: this.repoPath,
      since: options.since,
      until: options.until,
      author: options.author,
      committer: options.committer,
      grep: options.grep,
      branches: options.branches,
      filePaths: options.filePaths,
      maxCount: options.maxCount,
      skip: options.skip,
      noMerges: options.noMerges,
      firstParent: options.firstParent,
      // Only include file stats if explicitly requested (default to false)
      includeFileStats: options.includeFileStats === true,
      includeDiff: options.includeDiff === true,
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
  }

  async getBranches() {
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
      { cmd: "branch -a", prefix: "refs/heads/" },
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
            branches.add(b.replace(new RegExp(`^${prefix}`), ""));
          });
      } catch (error) {
        if (process.env.DEBUG) {
          console.warn(`Failed to fetch branches with ${cmd}:`, error.message);
        }
      }
    }

    const branchList = Array.from(branches);

    // Cache the result
    this.cache.set(cacheKey, branchList, 1800000); // 30 minutes

    return branchList;
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
