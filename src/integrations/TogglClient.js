const { retryWithBackoff, ERROR_CATEGORIES } = require('../utils/errorHandler');

/**
 * Toggl API Client
 */
class TogglClient {
  constructor(options = {}) {
    this.apiToken = options.apiToken || process.env.TOGGL_API_TOKEN;
    this.apiUrl = options.apiUrl || 'https://api.track.toggl.com/api/v9';

    if (!this.apiToken) {
      throw new Error('Toggl API token is required. Set TOGGL_API_TOKEN environment variable.');
    }

    // Encode token for Basic Auth
    const tokenBuffer = Buffer.from(`${this.apiToken}:api_token`);
    this.authHeader = `Basic ${tokenBuffer.toString('base64')}`;
  }

  /**
   * Make authenticated API request
   */
  async _request(endpoint, options = {}) {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': this.authHeader,
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
          throw new Error(`Toggl API error: ${error.message || response.statusText}`);
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
    return this._request('/me/workspaces');
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
  async createTimeEntry(options) {
    const {
      workspaceId,
      description,
      duration, // in seconds
      start,
      projectId,
      tags,
      billable,
    } = options;

    const timeEntry = {
      workspace_id: workspaceId,
      description: description || '',
      duration: Math.round(duration), // Toggl expects seconds
      start: start instanceof Date ? start.toISOString() : start,
      created_with: 'timesheet-generator',
      ...(projectId && { project_id: projectId }),
      ...(tags && tags.length > 0 && { tags }),
      ...(billable !== undefined && { billable }),
    };

    return this._request('/me/time_entries', {
      method: 'POST',
      body: JSON.stringify({ time_entry: timeEntry }),
    });
  }

  /**
   * Batch create time entries
   */
  async createTimeEntries(entries) {
    const results = [];
    const errors = [];

    for (const entry of entries) {
      try {
        const result = await this.createTimeEntry(entry);
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
    return this._request('/me');
  }
}

module.exports = TogglClient;

