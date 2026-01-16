const { retryWithBackoff, ERROR_CATEGORIES } = require('../utils/errorHandler');

/**
 * Jira Cloud API Client
 */
class JiraClient {
  constructor(options = {}) {
    this.email = options.email || process.env.JIRA_EMAIL;
    this.apiToken = options.apiToken || process.env.JIRA_API_TOKEN;
    this.baseUrl = options.baseUrl || process.env.JIRA_BASE_URL;

    if (!this.email || !this.apiToken || !this.baseUrl) {
      throw new Error(
        'Jira credentials required. Set JIRA_EMAIL, JIRA_API_TOKEN, and JIRA_BASE_URL environment variables.'
      );
    }

    // Encode for Basic Auth
    const tokenBuffer = Buffer.from(`${this.email}:${this.apiToken}`);
    this.authHeader = `Basic ${tokenBuffer.toString('base64')}`;
    this.apiUrl = `${this.baseUrl}/rest/api/3`;
  }

  /**
   * Make authenticated API request
   */
  async _request(endpoint, options = {}) {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': this.authHeader,
      'Accept': 'application/json',
      ...options.headers,
    };

    return retryWithBackoff(
      async () => {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(`Jira API error: ${error.message || response.statusText}`);
        }

        return response.json();
      },
      {
        retryableErrors: [ERROR_CATEGORIES.NETWORK, ERROR_CATEGORIES.RATE_LIMIT],
      }
    );
  }

  /**
   * Get issue by key (e.g., PROJ-123)
   */
  async getIssue(issueKey) {
    return this._request(`/issue/${issueKey}`);
  }

  /**
   * Add worklog entry to issue
   */
  async addWorklog(issueKey, options) {
    const {
      timeSpent, // e.g., "2h 30m" or "150m"
      started, // ISO date string
      comment,
    } = options;

    const worklog = {
      timeSpent,
      started,
      ...(comment && { comment: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: comment }] }] } }),
    };

    return this._request(`/issue/${issueKey}/worklog`, {
      method: 'POST',
      body: JSON.stringify(worklog),
    });
  }

  /**
   * Batch add worklogs
   */
  async addWorklogs(worklogs) {
    const results = [];
    const errors = [];

    for (const worklog of worklogs) {
      try {
        const result = await this.addWorklog(worklog.issueKey, worklog);
        results.push(result);
      } catch (error) {
        errors.push({ worklog, error: error.message });
      }
    }

    return { results, errors };
  }

  /**
   * Format duration for Jira (e.g., "2h 30m")
   */
  formatDuration(hours) {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (h > 0 && m > 0) {
      return `${h}h ${m}m`;
    } else if (h > 0) {
      return `${h}h`;
    } else {
      return `${m}m`;
    }
  }
}

module.exports = JiraClient;

