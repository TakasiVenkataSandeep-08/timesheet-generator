const VCSAdapter = require("./base/VCSAdapter");
const { normalizeCommit } = require("../utils/commitUtils");
const { retryWithBackoff, ERROR_CATEGORIES } = require("../utils/errorHandler");
const { getCache } = require("../utils/cache");

/**
 * GitHub Adapter - uses GitHub API
 */
class GitHubAdapter extends VCSAdapter {
  constructor(options = {}) {
    super(options);
    this.owner = options.owner;
    this.repo = options.repo;
    this.token = options.token || process.env.GITHUB_TOKEN;
    this.cache = options.cache !== false ? getCache({ defaultTTL: 3600000 }) : null; // 1 hour default
    this.cacheEnabled = options.cache !== false;

    if (!this.owner || !this.repo) {
      throw new Error("GitHub adapter requires owner and repo");
    }

    // Use fetch API (available in Node 18+) or require node-fetch
    this.apiBase = "https://api.github.com";
  }

  /**
   * Make authenticated API request with retry logic and caching
   */
  async _request(endpoint, options = {}) {
    const url = `${this.apiBase}${endpoint}`;
    const cacheKey = this.cache ? this.cache.generateKey(url, options) : null;

    // Check cache first (only for GET requests)
    if (this.cacheEnabled && this.cache && (!options.method || options.method === 'GET')) {
      const cached = this.cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    const headers = {
      Accept: "application/vnd.github.v3+json",
      ...(this.token && { Authorization: `token ${this.token}` }),
      ...options.headers,
    };

    const result = await retryWithBackoff(
      async () => {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        if (!response.ok) {
          // Handle rate limiting
          if (response.status === 429) {
            const retryAfter = response.headers.get("retry-after");
            if (retryAfter) {
              await new Promise((resolve) =>
                setTimeout(resolve, parseInt(retryAfter) * 1000)
              );
            }
            throw new Error(
              `GitHub API rate limit exceeded. Status: ${response.status}`
            );
          }

          const error = await response
            .json()
            .catch(() => ({ message: response.statusText }));
          throw new Error(
            `GitHub API error: ${error.message || response.statusText}`
          );
        }

        // Handle pagination
        if (response.headers.get("link")) {
          return this._fetchAllPages(url, headers);
        }

        return response.json();
      },
      {
        retryableErrors: [ERROR_CATEGORIES.NETWORK, ERROR_CATEGORIES.RATE_LIMIT],
      }
    );

    // Cache result (only for GET requests)
    if (this.cacheEnabled && this.cache && cacheKey && (!options.method || options.method === 'GET')) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Fetch all pages for paginated responses
   */
  async _fetchAllPages(url, headers) {
    const allData = [];
    let currentUrl = url;
    let page = 1;

    while (currentUrl) {
      const response = await fetch(currentUrl, { headers });
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const data = await response.json();
      allData.push(...(Array.isArray(data) ? data : [data]));

      // Check for next page
      const linkHeader = response.headers.get("link");
      if (linkHeader) {
        const nextMatch = linkHeader.match(/<([^>]+)>; rel="next"/);
        currentUrl = nextMatch ? nextMatch[1] : null;
      } else {
        currentUrl = null;
      }
      page++;
    }

    return allData;
  }

  async getCommits(options = {}) {
    const commits = [];
    let page = 1;
    const perPage = 100;
    let hasMore = true;

    while (hasMore) {
      const params = new URLSearchParams({
        per_page: perPage.toString(),
        page: page.toString(),
      });

      if (options.since) {
        params.append("since", options.since.toISOString());
      }
      if (options.until) {
        params.append("until", options.until.toISOString());
      }
      if (options.author) {
        params.append("author", options.author);
      }

      // Add branch/sha if specified
      let endpoint = `/repos/${this.owner}/${this.repo}/commits?${params}`;
      if (options.branches && options.branches.length > 0) {
        // GitHub API uses sha parameter for branch
        endpoint = `/repos/${this.owner}/${this.repo}/commits?sha=${options.branches[0]}&${params}`;
      }

      try {
        const data = await this._request(endpoint);

        if (!Array.isArray(data) || data.length === 0) {
          hasMore = false;
          break;
        }

        // Fetch detailed commit info (including file stats)
        for (const commitData of data) {
          const detailedCommit = await this._getCommitDetails(commitData.sha);
          commits.push(this._normalizeCommit(detailedCommit));
        }

        if (data.length < perPage) {
          hasMore = false;
        } else {
          page++;
        }
      } catch (error) {
        if (error.message.includes("404")) {
          hasMore = false;
        } else {
          throw error;
        }
      }
    }

    // Filter by options
    let filteredCommits = commits;

    if (options.noMerges) {
      filteredCommits = filteredCommits.filter(
        (c) => !c.message.startsWith("Merge")
      );
    }

    if (options.maxCount) {
      filteredCommits = filteredCommits.slice(0, options.maxCount);
    }

    return filteredCommits;
  }

  /**
   * Get detailed commit information including file stats
   */
  async _getCommitDetails(sha) {
    try {
      return await this._request(
        `/repos/${this.owner}/${this.repo}/commits/${sha}`
      );
    } catch (error) {
      // Fallback to basic commit info if detailed fetch fails
      return await this._request(
        `/repos/${this.owner}/${this.repo}/commits/${sha}`
      );
    }
  }

  /**
   * Normalize GitHub commit to standard format
   */
  _normalizeCommit(commitData) {
    const commit = {
      hash: commitData.sha,
      authorName: commitData.commit.author.name,
      authorEmail: commitData.commit.author.email,
      date: new Date(commitData.commit.author.date),
      message: commitData.commit.message,
      branches: [],
      fileStats: [],
      diff: null,
    };

    // Extract branches from refs if available
    if (commitData.refs) {
      commit.branches = commitData.refs
        .filter((ref) => ref.startsWith("refs/heads/"))
        .map((ref) => ref.replace("refs/heads/", ""));
    }

    // Extract file stats if available
    if (commitData.files && Array.isArray(commitData.files)) {
      commit.fileStats = commitData.files.map((file) => ({
        filePath: file.filename,
        additions: file.additions || 0,
        deletions: file.deletions || 0,
      }));
    }

    return normalizeCommit(commit);
  }

  async getBranches() {
    try {
      const branches = await this._request(
        `/repos/${this.owner}/${this.repo}/branches`
      );
      return branches.map((branch) => branch.name);
    } catch (error) {
      throw new Error(`Failed to fetch branches: ${error.message}`);
    }
  }

  async getRepoInfo() {
    try {
      const repo = await this._request(`/repos/${this.owner}/${this.repo}`);
      return {
        path: `${this.owner}/${this.repo}`,
        name: repo.name,
        url: repo.html_url,
        type: "github",
        owner: this.owner,
        repo: this.repo,
      };
    } catch (error) {
      throw new Error(`Failed to fetch repo info: ${error.message}`);
    }
  }
}

module.exports = GitHubAdapter;
