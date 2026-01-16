const OutputFormatter = require('./base/OutputFormatter');
const TogglClient = require('../integrations/TogglClient');

/**
 * Toggl Formatter - creates time entries in Toggl
 */
class TogglFormatter extends OutputFormatter {
  constructor(options = {}) {
    super(options);
    this.client = options.client || new TogglClient({
      apiToken: options.apiToken || process.env.TOGGL_API_TOKEN,
    });
    this.workspaceId = options.workspaceId || process.env.TOGGL_WORKSPACE_ID;
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
        throw new Error('No Toggl workspaces found');
      }
      workspaceId = workspaces[0].id;
    }

    const entries = this._prepareTimeEntries(timesheet, workspaceId);
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

  _prepareTimeEntries(timesheet, workspaceId) {
    const entries = [];

    for (const session of timesheet.sessions) {
      const startDate = new Date(session.startTime);
      const durationSeconds = Math.round(session.duration * 3600); // Convert hours to seconds

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
        workspaceId,
        description: session.summary || 'Work session',
        duration: durationSeconds,
        start: startDate.toISOString(),
        projectId,
        tags,
        billable: this.options.billable || false,
      });
    }

    return entries;
  }

  _formatDryRun(timesheet) {
    const entries = this._prepareTimeEntries(timesheet, 0);
    return {
      dryRun: true,
      entries: entries.map(entry => ({
        description: entry.description,
        duration: `${(entry.duration / 3600).toFixed(2)}h`,
        start: entry.start,
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

module.exports = TogglFormatter;

