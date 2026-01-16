const { retryWithBackoff, ERROR_CATEGORIES } = require('../utils/errorHandler');

/**
 * Clockify API Client
 */
class ClockifyClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.CLOCKIFY_API_KEY;
    this.apiUrl = options.apiUrl || 'https://api.clockify.me/api/v1';

    if (!this.apiKey) {
      throw new Error('Clockify API key is required. Set CLOCKIFY_API_KEY environment variable.');
    }
  }

  /**
   * Make authenticated API request
   */
  async _request(endpoint, options = {}) {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Api-Key': this.apiKey,
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
          throw new Error(`Clockify API error: ${error.message || response.statusText}`);
        }

        return response.json();
      },
      {
        retryableErrors: [ERROR_CATEGORIES.NETWORK, ERROR_CATEGORIES.RATE_LIMIT],
      }
    );
  }

  /**
   * Get workspace ID (required for time entries)
   */
  async getWorkspaces() {
    return this._request('/workspaces');
  }

  /**
   * Get projects in workspace
   */
  async getProjects(workspaceId) {
    return this._request(`/workspaces/${workspaceId}/projects`);
  }

  /**
   * Create time entry
   */
  async createTimeEntry(workspaceId, options) {
    const {
      description,
      start,
      end,
      projectId,
      tags,
      billable,
    } = options;

    const timeEntry = {
      description: description || '',
      start: start instanceof Date ? start.toISOString() : start,
      end: end instanceof Date ? end.toISOString() : end,
      ...(projectId && { projectId }),
      ...(tags && tags.length > 0 && { tagIds: tags }),
      ...(billable !== undefined && { billable }),
    };

    return this._request(`/workspaces/${workspaceId}/time-entries`, {
      method: 'POST',
      body: JSON.stringify(timeEntry),
    });
  }

  /**
   * Batch create time entries
   */
  async createTimeEntries(workspaceId, entries) {
    const results = [];
    const errors = [];

    for (const entry of entries) {
      try {
        const result = await this.createTimeEntry(workspaceId, entry);
        results.push(result);
      } catch (error) {
        errors.push({ entry, error: error.message });
      }
    }

    return { results, errors };
  }

  /**
   * Get current user info
   */
  async getMe() {
    return this._request('/user');
  }
}

module.exports = ClockifyClient;

