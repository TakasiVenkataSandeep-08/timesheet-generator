/**
 * Base VCS Adapter Interface
 * All VCS adapters must extend this class
 */
class VCSAdapter {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Get commits from repository
   * @param {object} options - Commit options
   * @returns {Promise<Array>} Array of normalized commit objects
   */
  async getCommits(options) {
    throw new Error("getCommits() must be implemented by subclass");
  }

  /**
   * Get list of branches
   * @returns {Promise<Array>} Array of branch names
   */
  async getBranches() {
    throw new Error("getBranches() must be implemented by subclass");
  }

  /**
   * Get repository information
   * @returns {Promise<object>} Repo info (name, url, etc.)
   */
  async getRepoInfo() {
    throw new Error("getRepoInfo() must be implemented by subclass");
  }

  /**
   * Get adapter name
   */
  get name() {
    return this.constructor.name;
  }

  /**
   * Deduplicate commits by hash across branches
   * @param {Array} commits - Array of commit objects
   * @returns {Array} Deduplicated commits with merged branch info
   */
  _deduplicateByHash(commits) {
    const seen = new Map();
    return commits.filter((commit) => {
      if (seen.has(commit.hash)) {
        // Merge branch info if commit exists on multiple branches
        const existing = seen.get(commit.hash);
        existing.branches = [
          ...new Set([...existing.branches, ...commit.branches]),
        ];
        return false;
      }
      seen.set(commit.hash, commit);
      return true;
    });
  }
}

module.exports = VCSAdapter;
