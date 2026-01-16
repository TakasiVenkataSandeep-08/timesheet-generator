const OutputFormatter = require('./base/OutputFormatter');
const ClockifyClient = require('../integrations/ClockifyClient');

/**
 * Clockify Formatter - creates time entries in Clockify
 */
class ClockifyFormatter extends OutputFormatter {
  constructor(options = {}) {
    super(options);
    this.client = options.client || new ClockifyClient({
      apiKey: options.apiKey || process.env.CLOCKIFY_API_KEY,
    });
    this.workspaceId = options.workspaceId || process.env.CLOCKIFY_WORKSPACE_ID;
    this.dryRun = options.dryRun || false;
    this.projectMapping = options.projectMapping || {};
    this.tagMapping = options.tagMapping || {};
  }

  async format(timesheet) {
    if (this.dryRun) {
      return this._formatDryRun(timesheet);
    }

    // Get workspace ID if not provided
    let workspaceId = this.workspaceId;
    if (!workspaceId) {
      const workspaces = await this.client.getWorkspaces();
      if (workspaces.length === 0) {
        throw new Error('No Clockify workspaces found');
      }
      workspaceId = workspaces[0].id;
    }

    const entries = this._prepareTimeEntries(timesheet);
    const results = await this.client.createTimeEntries(workspaceId, entries);

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
      const startDate = new Date(session.startTime);
      const endDate = new Date(session.endTime);

      // Map project if available
      let projectId = null;
      if (session.projects && session.projects.length > 0) {
        const projectName = session.projects[0];
        projectId = this.projectMapping[projectName];
      }

      // Map tags from tickets
      const tags = [];
      if (session.tickets && session.tickets.length > 0) {
        session.tickets.forEach(ticket => {
          const tag = this.tagMapping[ticket] || ticket;
          tags.push(tag);
        });
      }

      entries.push({
        description: session.summary || 'Work session',
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        projectId,
        tags,
        billable: this.options.billable || false,
      });
    }

    return entries;
  }

  _formatDryRun(timesheet) {
    const entries = this._prepareTimeEntries(timesheet);
    return {
      dryRun: true,
      entries: entries.map(entry => ({
        description: entry.description,
        start: entry.start,
        end: entry.end,
        projectId: entry.projectId || '(no project)',
        tags: entry.tags || [],
      })),
      summary: {
        totalEntries: entries.length,
        totalHours: timesheet.totalHours,
      },
    };
  }
}

module.exports = ClockifyFormatter;

