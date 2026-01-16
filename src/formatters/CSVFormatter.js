const OutputFormatter = require("./base/OutputFormatter");
const { formatDate, formatTime } = require("../utils/dateUtils");

/**
 * CSV Formatter - outputs timesheet as CSV (Jira-compatible)
 */
class CSVFormatter extends OutputFormatter {
  async format(timesheet) {
    const lines = [];

    // Add repository information as comments (CSV doesn't support headers well, so use comments)
    if (timesheet.repositories && timesheet.repositories.repository) {
      lines.push(`# Repository: ${timesheet.repositories.repository}`);
      if (timesheet.repositories.repoType) {
        lines.push(`# Repository Type: ${timesheet.repositories.repoType}`);
      }
    } else if (timesheet.repositories && timesheet.repositories.repositories && timesheet.repositories.repositories.length > 0) {
      lines.push(`# Repositories: ${timesheet.repositories.repositories.join(", ")}`);
    }

    // Header
    lines.push(
      "Date,Start Time,End Time,Duration (hours),Description,Issue Key,Project,Repository"
    );

    // Sessions
    for (const session of timesheet.sessions) {
      const date = session.date;
      const startTime = formatTime(new Date(session.startTime));
      const endTime = formatTime(new Date(session.endTime));
      const duration = session.duration;
      const description = this._escapeCSV(session.summary);
      const issueKey = session.tickets.length > 0 ? session.tickets[0] : "";
      const project = session.projects.length > 0 ? session.projects[0] : "";
      const repository = timesheet.repositories && timesheet.repositories.repository 
        ? timesheet.repositories.repository 
        : "";

      lines.push(
        `${date},${startTime},${endTime},${duration},"${description}","${issueKey}","${project}","${repository}"`
      );
    }

    return lines.join("\n");
  }

  _escapeCSV(str) {
    if (!str) return "";
    return str.replace(/"/g, '""');
  }
}

module.exports = CSVFormatter;
