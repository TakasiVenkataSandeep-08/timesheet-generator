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
}

module.exports = VCSAdapter;
