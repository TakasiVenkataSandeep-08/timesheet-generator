const OutputFormatter = require('./base/OutputFormatter');
const LinearClient = require('../integrations/LinearClient');

/**
 * Linear Formatter - creates time entries in Linear
 */
class LinearFormatter extends OutputFormatter {
  constructor(options = {}) {
    super(options);
    this.client = options.client || new LinearClient({
      apiKey: options.apiKey || process.env.LINEAR_API_KEY,
    });
    this.dryRun = options.dryRun || false;
  }

  async format(timesheet) {
    if (this.dryRun) {
      return this._formatDryRun(timesheet);
    }

    const entries = this._prepareTimeEntries(timesheet);
    const results = await this.client.createTimeEntries(entries);

    return {
      success: results.errors.length === 0,
      created: results.results.length,
      failed: results.errors.length,
      results: results.results,
      errors: results.errors,
      summary: {
        totalHours: timesheet.totalHours,
        totalSessions: timesheet.totalSessions,
        entriesCreated: results.results.length,
      },
    };
  }

  _prepareTimeEntries(timesheet) {
    const entries = [];

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

      // Create entry for each ticket, or one entry if no tickets
      if (tickets.size > 0) {
        for (const ticket of tickets) {
          entries.push({
            issueId: ticket, // Linear uses issue identifiers
            duration: session.duration,
            description: session.summary || 'Work session',
            date: session.date,
          });
        }
      } else {
        // Create entry without ticket (will need manual linking)
        entries.push({
          issueId: null,
          duration: session.duration,
          description: session.summary || 'Work session',
          date: session.date,
        });
      }
    }

    return entries;
  }

  _formatDryRun(timesheet) {
    const entries = this._prepareTimeEntries(timesheet);
    return {
      dryRun: true,
      entries: entries.map(entry => ({
        issueId: entry.issueId || '(no ticket)',
        duration: `${entry.duration.toFixed(2)}h`,
        description: entry.description,
        date: entry.date,
      })),
      summary: {
        totalEntries: entries.length,
        totalHours: timesheet.totalHours,
      },
    };
  }
}

module.exports = LinearFormatter;

