/**
 * Linear API Client
 */
class LinearClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.LINEAR_API_KEY;
    this.apiUrl = options.apiUrl || 'https://api.linear.app/graphql';

    if (!this.apiKey) {
      throw new Error('Linear API key is required. Set LINEAR_API_KEY environment variable.');
    }
  }

  /**
   * Make GraphQL request to Linear API
   */
  async _request(query, variables = {}) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Linear API error: ${error.message || response.statusText}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(`Linear API error: ${result.errors[0].message}`);
    }

    return result.data;
  }

  /**
   * Create time entry in Linear
   */
  async createTimeEntry(options) {
    const {
      issueId,
      duration,
      description,
      date,
    } = options;

    const mutation = `
      mutation CreateTimeEntry($input: TimeEntryCreateInput!) {
        timeEntryCreate(input: $input) {
          success
          timeEntry {
            id
            duration
            description
            createdAt
          }
        }
      }
    `;

    const variables = {
      input: {
        issueId,
        duration: Math.round(duration * 60), // Convert hours to minutes
        description: description || '',
        date: date || new Date().toISOString().split('T')[0],
      },
    };

    const result = await this._request(mutation, variables);
    return result.timeEntryCreate.timeEntry;
  }

  /**
   * Get issue by identifier (e.g., PROJ-123)
   */
  async getIssue(identifier) {
    const query = `
      query GetIssue($identifier: String!) {
        issue(id: $identifier) {
          id
          identifier
          title
          state {
            name
          }
        }
      }
    `;

    const result = await this._request(query, { identifier });
    return result.issue;
  }

  /**
   * Search issues by identifier pattern
   */
  async searchIssues(query) {
    const graphqlQuery = `
      query SearchIssues($query: String!) {
        issues(filter: { title: { contains: $query } }) {
          nodes {
            id
            identifier
            title
          }
        }
      }
    `;

    const result = await this._request(graphqlQuery, { query });
    return result.issues.nodes;
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
}

module.exports = LinearClient;

