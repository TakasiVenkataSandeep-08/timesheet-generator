const OutputFormatter = require("./base/OutputFormatter");
const { formatDate } = require("../utils/dateUtils");

/**
 * Simple Formatter - plain text output
 * Groups commits by date and lists them simply (no-nonsense mode)
 */
class SimpleFormatter extends OutputFormatter {
  async format(timesheet) {
    const output = [];

    // Add repository information at the top
    if (timesheet.repositories && timesheet.repositories.repository) {
      output.push(`Repository: ${timesheet.repositories.repository}`);
      if (timesheet.repositories.repoType) {
        output.push(`Type: ${timesheet.repositories.repoType}`);
      }
      output.push("");
    } else if (
      timesheet.repositories &&
      timesheet.repositories.repositories &&
      timesheet.repositories.repositories.length > 0
    ) {
      output.push(
        `Repositories: ${timesheet.repositories.repositories.join(", ")}`
      );
      output.push("");
    }

    // Group commits by date
    const commitsByDate = new Map();

    // Debug: Check what we're getting
    if (process.env.DEBUG && timesheet.commits) {
      console.warn(
        `DEBUG SimpleFormatter: timesheet.commits length: ${timesheet.commits.length}`
      );
      if (timesheet.commits.length > 0) {
        console.warn(
          `DEBUG SimpleFormatter: First commit keys:`,
          Object.keys(timesheet.commits[0] || {})
        );
        console.warn(
          `DEBUG SimpleFormatter: First commit has message:`,
          "message" in (timesheet.commits[0] || {})
        );
      }
    }

    // Use actual commits if available, but fall back to session summaries if messages are empty
    if (
      timesheet.commits &&
      Array.isArray(timesheet.commits) &&
      timesheet.commits.length > 0
    ) {
      // Check if commits have valid messages
      const commitsWithMessages = timesheet.commits.filter(
        (c) => c.message && c.message.trim()
      );

      if (commitsWithMessages.length > 0) {
        // Use commits with messages
        for (const commit of commitsWithMessages) {
          const commitDate = formatDate(commit.date);
          if (!commitDate) continue;

          if (!commitsByDate.has(commitDate)) {
            commitsByDate.set(commitDate, []);
          }
          commitsByDate.get(commitDate).push(commit);
        }
      } else {
        // Commits don't have messages, use session summaries instead
        if (process.env.DEBUG) {
          console.warn(
            `DEBUG SimpleFormatter: Commits have empty messages, using session summaries instead`
          );
        }
        for (const session of timesheet.sessions || []) {
          const date = session.date;
          if (!commitsByDate.has(date)) {
            commitsByDate.set(date, []);
          }
          // Split summary by semicolon to get individual messages
          const messages = session.summary
            .split("; ")
            .map((m) => {
              // Clean up message (remove "+X more" indicators)
              return m.replace(/\s*\(\+\d+\s+more\)\s*$/, "").trim();
            })
            .filter((m) => m);
          commitsByDate.get(date).push(...messages);
        }
      }
    } else {
      // Fallback: extract from session summaries
      for (const session of timesheet.sessions || []) {
        const date = session.date;
        if (!commitsByDate.has(date)) {
          commitsByDate.set(date, []);
        }
        // Split summary by semicolon to get individual messages
        const messages = session.summary
          .split("; ")
          .map((m) => {
            // Clean up message (remove "+X more" indicators)
            return m.replace(/\s*\(\+\d+\s+more\)\s*$/, "").trim();
          })
          .filter((m) => m);
        commitsByDate.get(date).push(...messages);
      }
    }

    // Sort dates
    const sortedDates = Array.from(commitsByDate.keys()).sort();

    // Format output (with numbered list)
    for (const date of sortedDates) {
      output.push(`\n--- Commits on ${date} ---`);
      const items = commitsByDate.get(date);

      items.forEach((item, index) => {
        let message = null;

        // If it's a commit object, get the first line of the message
        if (typeof item === "object" && item !== null) {
          // Check for message property (use 'in' operator to check existence, not truthiness)
          if (
            "message" in item &&
            typeof item.message === "string" &&
            item.message.trim()
          ) {
            message = item.message.split("\n")[0].trim();
          } else if (
            "summary" in item &&
            typeof item.summary === "string" &&
            item.summary.trim()
          ) {
            // Fallback to summary if message doesn't exist
            message = item.summary.split("\n")[0].trim();
          } else {
            // Debug: log what we got if message extraction fails
            if (process.env.DEBUG) {
              console.warn(
                `DEBUG SimpleFormatter: Could not extract message from item at index ${index}:`,
                {
                  type: typeof item,
                  keys: Object.keys(item || {}),
                  hasMessage: "message" in item,
                  messageValue: item.message,
                  hasSummary: "summary" in item,
                  summaryValue: item.summary,
                }
              );
            }
            // Skip items without messages
            return;
          }
        } else if (typeof item === "string") {
          // If it's already a string, use it directly
          message = item.trim();
        } else {
          // Skip non-string, non-object items
          if (process.env.DEBUG) {
            console.warn(
              `DEBUG SimpleFormatter: Skipping item of type ${typeof item}:`,
              item
            );
          }
          return;
        }

        if (message) {
          output.push(`  ${index + 1}. ${message}`);
        }
      });
    }

    // Optional: Add summary at the end (can be disabled via options)
    if (!this.options.hideSummary && timesheet.totalCommits > 0) {
      output.push(`\n--- Summary ---`);
      output.push(`Total commits: ${timesheet.totalCommits}`);
      if (timesheet.totalSessions > 0) {
        output.push(`Total sessions: ${timesheet.totalSessions}`);
      }
      if (timesheet.totalHours > 0) {
        output.push(`Total hours: ${timesheet.totalHours.toFixed(2)}h`);
      }
    }

    return output.join("\n");
  }
}

module.exports = SimpleFormatter;
