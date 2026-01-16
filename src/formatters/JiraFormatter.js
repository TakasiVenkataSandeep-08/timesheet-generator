const CSVFormatter = require("./CSVFormatter");
const JiraClient = require("../integrations/JiraClient");

/**
 * Jira Formatter - outputs timesheet as Jira-compatible CSV or imports directly via API
 */
class JiraFormatter extends CSVFormatter {
  constructor(options = {}) {
    super(options);
    this.useAPI = options.useAPI || false;
    this.client = this.useAPI ? (options.client || new JiraClient({
      email: options.email || process.env.JIRA_EMAIL,
      apiToken: options.apiToken || process.env.JIRA_API_TOKEN,
      baseUrl: options.baseUrl || process.env.JIRA_BASE_URL,
    })) : null;
    this.dryRun = options.dryRun || false;
  }

  async format(timesheet) {
    if (this.useAPI && this.client) {
      return this._importToJira(timesheet);
    }
    
    // Default: CSV export
    const csv = await super.format(timesheet);
    return csv;
  }

  async _importToJira(timesheet) {
    if (this.dryRun) {
      return this._formatDryRun(timesheet);
    }

    const worklogs = this._prepareWorklogs(timesheet);
    const results = await this.client.addWorklogs(worklogs);

    return {
      success: results.errors.length === 0,
      created: results.results.length,
      failed: results.errors.length,
      results: results.results,
      errors: results.errors,
      summary: {
        totalHours: timesheet.totalHours,
        totalSessions: timesheet.totalSessions,
        worklogsCreated: results.results.length,
      },
    };
  }

  _prepareWorklogs(timesheet) {
    const worklogs = [];

    for (const session of timesheet.sessions) {
      // Extract ticket IDs from session commits
      const tickets = new Set();
      for (const commit of timesheet.commits || []) {
        if (commit.tickets && commit.tickets.length > 0) {
          commit.tickets.forEach(ticket => tickets.add(ticket));
        }
      }

      // If no tickets found, try to extract from summary
      if (tickets.size === 0 && session.tickets && session.tickets.length > 0) {
        session.tickets.forEach(ticket => tickets.add(ticket));
      }

      // Create worklog for each ticket
      if (tickets.size > 0) {
        for (const ticket of tickets) {
          const timeSpent = this.client.formatDuration(session.duration);
          worklogs.push({
            issueKey: ticket,
            timeSpent,
            started: new Date(session.startTime).toISOString(),
            comment: session.summary || 'Work session',
          });
        }
      }
    }

    return worklogs;
  }

  _formatDryRun(timesheet) {
    const worklogs = this._prepareWorklogs(timesheet);
    return {
      dryRun: true,
      worklogs: worklogs.map(worklog => ({
        issueKey: worklog.issueKey,
        timeSpent: worklog.timeSpent,
        started: worklog.started,
        comment: worklog.comment,
      })),
      summary: {
        totalWorklogs: worklogs.length,
        totalHours: timesheet.totalHours,
      },
    };
  }
}

module.exports = JiraFormatter;
