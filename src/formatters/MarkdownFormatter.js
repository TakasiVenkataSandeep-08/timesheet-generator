const OutputFormatter = require("./base/OutputFormatter");
const { formatDate, formatTime } = require("../utils/dateUtils");

/**
 * Markdown Formatter - outputs timesheet as Markdown
 */
class MarkdownFormatter extends OutputFormatter {
  async format(timesheet) {
    const lines = [];

    // Header
    lines.push(`# Timesheet: ${timesheet.period.start} to ${timesheet.period.end}`);
    lines.push("");
    
    // Repository information
    if (timesheet.repositories && timesheet.repositories.repository) {
      lines.push(`**Repository:** ${timesheet.repositories.repository}`);
      if (timesheet.repositories.repoType) {
        lines.push(`**Repository Type:** ${timesheet.repositories.repoType}`);
      }
      lines.push("");
    } else if (timesheet.repositories && timesheet.repositories.repositories && timesheet.repositories.repositories.length > 0) {
      lines.push(`**Repositories:** ${timesheet.repositories.repositories.join(", ")}`);
      lines.push("");
    }
    
    lines.push(`**Total Hours:** ${timesheet.totalHours}h`);
    lines.push(`**Total Sessions:** ${timesheet.totalSessions}`);
    lines.push(`**Total Commits:** ${timesheet.totalCommits}`);
    lines.push("");

    // Group by date
    const byDate = {};
    for (const session of timesheet.sessions) {
      if (!byDate[session.date]) {
        byDate[session.date] = [];
      }
      byDate[session.date].push(session);
    }

    // Daily breakdown
    for (const [date, sessions] of Object.entries(byDate).sort()) {
      const dayTotal = sessions.reduce((sum, s) => sum + s.duration, 0);
      lines.push(`## ${date} (${dayTotal.toFixed(2)}h)`);
      lines.push("");

      for (const session of sessions) {
        const startTime = formatTime(new Date(session.startTime));
        const endTime = formatTime(new Date(session.endTime));
        const duration = session.duration;

        lines.push(`### ${startTime} - ${endTime} (${duration.toFixed(2)}h)`);
        lines.push("");
        lines.push(`- **Summary:** ${session.summary}`);
        
        if (session.projects.length > 0) {
          lines.push(`- **Projects:** ${session.projects.join(", ")}`);
        }
        
        if (session.tickets.length > 0) {
          lines.push(`- **Tickets:** ${session.tickets.join(", ")}`);
        }
        
        lines.push(`- **Commits:** ${session.commits}`);
        lines.push(`- **Confidence:** ${(session.confidence * 100).toFixed(0)}%`);
        lines.push("");
      }
    }

    // Summary by project
    if (timesheet.hoursByProject) {
      lines.push("## Summary by Project");
      lines.push("");
      for (const [project, hours] of Object.entries(timesheet.hoursByProject)) {
        lines.push(`- **${project}:** ${hours.toFixed(2)}h`);
      }
      lines.push("");
    }

    // Summary by ticket
    if (timesheet.byTicket) {
      lines.push("## Summary by Ticket");
      lines.push("");
      for (const [ticket, count] of Object.entries(timesheet.byTicket)) {
        lines.push(`- **${ticket}:** ${count} commits`);
      }
      lines.push("");
    }

    return lines.join("\n");
  }
}

module.exports = MarkdownFormatter;

