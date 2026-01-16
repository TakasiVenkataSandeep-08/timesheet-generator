const VCSAdapter = require("./base/VCSAdapter");
const { normalizeCommit } = require("../utils/commitUtils");
const { retryWithBackoff, ERROR_CATEGORIES } = require("../utils/errorHandler");
const { getCache } = require("../utils/cache");

/**
 * GitLab Adapter - uses GitLab API
 */
class GitLabAdapter extends VCSAdapter {
  constructor(options = {}) {
    super(options);
    this.projectId = options.projectId;
    this.baseUrl = options.baseUrl || "https://gitlab.com";
    this.token = options.token || process.env.GITLAB_TOKEN;
    this.cache = options.cache !== false ? getCache({ defaultTTL: 3600000 }) : null; // 1 hour default
    this.cacheEnabled = options.cache !== false;

    if (!this.projectId) {
      throw new Error("GitLab adapter requires projectId");
    }

    this.apiBase = `${this.baseUrl}/api/v4`;
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
      "Content-Type": "application/json",
      ...(this.token && { "PRIVATE-TOKEN": this.token }),
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
              `GitLab API rate limit exceeded. Status: ${response.status}`
            );
          }

          const error = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(`GitLab API error: ${error.message || response.statusText}`);
        }

        // Handle pagination
        const totalPages = response.headers.get("x-total-pages");
        if (totalPages && parseInt(totalPages) > 1) {
          return this._fetchAllPages(url, headers, parseInt(totalPages));
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
  async _fetchAllPages(url, headers, totalPages) {
    const allData = [];
    const baseUrl = new URL(url);

    for (let page = 1; page <= totalPages; page++) {
      baseUrl.searchParams.set("page", page.toString());
      const response = await fetch(baseUrl.toString(), { headers });

      if (!response.ok) {
        throw new Error(`GitLab API error: ${response.statusText}`);
      }

      const data = await response.json();
      allData.push(...(Array.isArray(data) ? data : [data]));
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

      // Add ref_name (branch) if specified
      if (options.branches && options.branches.length > 0) {
        params.append("ref_name", options.branches[0]);
      }

      const endpoint = `/projects/${encodeURIComponent(this.projectId)}/repository/commits?${params}`;

      try {
        const data = await this._request(endpoint);

        if (!Array.isArray(data) || data.length === 0) {
          hasMore = false;
          break;
        }

        // Fetch detailed commit info (including file stats)
        for (const commitData of data) {
          const detailedCommit = await this._getCommitDetails(commitData.id);
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
      filteredCommits = filteredCommits.filter((c) => !c.message.startsWith("Merge"));
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
      const commit = await this._request(
        `/projects/${encodeURIComponent(this.projectId)}/repository/commits/${sha}`
      );
      
      // Get diff stats
      const diff = await this._request(
        `/projects/${encodeURIComponent(this.projectId)}/repository/commits/${sha}/diff`
      ).catch(() => []);

      return {
        ...commit,
        diff,
      };
    } catch (error) {
      // Fallback to basic commit info
      return await this._request(
        `/projects/${encodeURIComponent(this.projectId)}/repository/commits/${sha}`
      );
    }
  }

  /**
   * Normalize GitLab commit to standard format
   */
  _normalizeCommit(commitData) {
    const commit = {
      hash: commitData.id,
      authorName: commitData.author_name,
      authorEmail: commitData.author_email,
      date: new Date(commitData.created_at),
      message: commitData.message,
      branches: [],
      fileStats: [],
      diff: null,
    };

    // Extract file stats from diff if available
    if (commitData.diff && Array.isArray(commitData.diff)) {
      commit.fileStats = commitData.diff.map((file) => {
        const additions = (file.diff.match(/^\+/gm) || []).length;
        const deletions = (file.diff.match(/^-/gm) || []).length;
        return {
          filePath: file.new_path || file.old_path,
          additions,
          deletions,
        };
      });
    }

    return normalizeCommit(commit);
  }

  async getBranches() {
    try {
      const branches = await this._request(
        `/projects/${encodeURIComponent(this.projectId)}/repository/branches`
      );
      return branches.map((branch) => branch.name);
    } catch (error) {
      throw new Error(`Failed to fetch branches: ${error.message}`);
    }
  }

  async getRepoInfo() {
    try {
      const project = await this._request(
        `/projects/${encodeURIComponent(this.projectId)}`
      );
      return {
        path: project.path_with_namespace,
        name: project.name,
        url: project.web_url,
        type: "gitlab",
        projectId: this.projectId,
      };
    } catch (error) {
      throw new Error(`Failed to fetch repo info: ${error.message}`);
    }
  }
}

module.exports = GitLabAdapter;

