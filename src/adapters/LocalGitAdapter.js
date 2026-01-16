const VCSAdapter = require("./base/VCSAdapter");
const { getCommits: getCommitsFromGit } = require("../index");
const { normalizeCommit } = require("../utils/commitUtils");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

/**
 * Local Git Adapter - uses local git repository
 */
class LocalGitAdapter extends VCSAdapter {
  constructor(repoPath) {
    super();
    this.repoPath = repoPath || process.cwd();
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
        `DEBUG LocalGitAdapter: Got ${commits.length} raw commits from getCommitsFromGit`
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
          `DEBUG LocalGitAdapter: After normalization: ${valid.length} valid, ${skipped} filtered out`
        );
      } else {
        console.warn(
          `DEBUG LocalGitAdapter: All ${valid.length} commits normalized successfully`
        );
      }
    }

    return valid;
  }

  async getBranches() {
    try {
      const { stdout } = await execAsync(
        `git -C "${this.repoPath}" branch -r --format="%(refname:short)"`
      );
      const branches = stdout
        .split("\n")
        .map((b) => b.trim())
        .filter(Boolean)
        .map((b) => b.replace(/^origin\//, ""));

      // Also get local branches
      const { stdout: localBranches } = await execAsync(
        `git -C "${this.repoPath}" branch --format="%(refname:short)"`
      );
      const local = localBranches
        .split("\n")
        .map((b) => b.trim())
        .filter(Boolean);

      // Combine and deduplicate
      const allBranches = [...new Set([...branches, ...local])];
      return allBranches;
    } catch (error) {
      // Fallback to local branches only
      try {
        const { stdout } = await execAsync(
          `git -C "${this.repoPath}" branch --format="%(refname:short)"`
        );
        return stdout
          .split("\n")
          .map((b) => b.trim())
          .filter(Boolean);
      } catch (e) {
        return [];
      }
    }
  }

  async getRepoInfo() {
    try {
      const { stdout: remoteUrl } = await execAsync(
        `git -C "${this.repoPath}" config --get remote.origin.url`
      ).catch(() => ({ stdout: "" }));

      const { stdout: repoName } = await execAsync(
        `git -C "${this.repoPath}" rev-parse --show-toplevel`
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
