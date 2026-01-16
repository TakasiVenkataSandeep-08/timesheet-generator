const CommitAnalyzer = require("./CommitAnalyzer");
const SessionGrouper = require("./SessionGrouper");
const TimeEstimator = require("./TimeEstimator");
const { deduplicateCommits, sortCommitsByDate, normalizeCommit } = require("../utils/commitUtils");
const { formatDate } = require("../utils/dateUtils");

/**
 * Main Timesheet Generator - orchestrates the entire process
 */
class TimesheetGenerator {
  constructor(config = {}) {
    this.config = config;
    this.commitAnalyzer = new CommitAnalyzer(config);
    this.sessionGrouper = new SessionGrouper(config.timeEstimation || {});
    this.timeEstimator = new TimeEstimator(config.timeEstimation || {});
  }

  /**
   * Generate timesheet from commits
   */
  async generate(commits, options = {}) {
    // 1. Normalize and deduplicate commits
    // Filter out commits with invalid dates during normalization
    let processedCommits = commits
      .map((c) => normalizeCommit(c))
      .filter((c) => c !== null && c.date !== null);
    
    if (processedCommits.length === 0) {
      throw new Error("No valid commits found after normalization. Check commit dates.");
    }
    
    processedCommits = deduplicateCommits(processedCommits);
    processedCommits = sortCommitsByDate(processedCommits);

    // 2. Analyze commits (extract tickets, projects, etc.)
    processedCommits = this.commitAnalyzer.analyzeBatch(processedCommits);

    // 3. Group into sessions
    const sessions = this.sessionGrouper.groupIntoSessions(processedCommits);
    const mergedSessions = this.sessionGrouper.mergeAdjacentSessions(sessions, 60);

    // 4. Estimate time for each session
    const timeEstimates = this.timeEstimator.estimateSessions(mergedSessions);

    // 5. Build timesheet structure
    const timesheet = this._buildTimesheet(timeEstimates, processedCommits, options);

    return timesheet;
  }

  /**
   * Build timesheet data structure
   */
  _buildTimesheet(timeEstimates, commits, options) {
    const period = options.period || this._extractPeriod(commits);
    const totalHours = timeEstimates.reduce((sum, est) => sum + est.duration, 0);

    // Group by date
    const byDate = {};
    for (const estimate of timeEstimates) {
      const date = formatDate(estimate.startTime);
      if (!byDate[date]) {
        byDate[date] = [];
      }
      byDate[date].push(estimate);
    }

    // Group by project
    const byProject = {};
    for (const commit of commits) {
      if (commit.project) {
        byProject[commit.project] = (byProject[commit.project] || 0) + 1;
      }
    }

    // Group by ticket
    const byTicket = {};
    for (const commit of commits) {
      for (const ticket of commit.tickets || []) {
        byTicket[ticket] = (byTicket[ticket] || 0) + 1;
      }
    }

    // Calculate hours by project (rough estimate)
    const hoursByProject = {};
    for (const estimate of timeEstimates) {
      // Find commits in this session
      const sessionCommits = commits.filter(
        (c) =>
          c.date >= estimate.startTime &&
          c.date <= estimate.endTime
      );
      for (const commit of sessionCommits) {
        if (commit.project) {
          const timePerCommit = estimate.duration / estimate.commits;
          hoursByProject[commit.project] =
            (hoursByProject[commit.project] || 0) + timePerCommit;
        }
      }
    }

    // Extract repository information from commits
    const repositories = new Set();
    const repoTypes = {};
    for (const commit of commits) {
      if (commit.repo) {
        repositories.add(commit.repo);
        if (commit.repoType) {
          repoTypes[commit.repo] = commit.repoType;
        }
      }
    }
    const repositoryInfo = {
      repositories: Array.from(repositories),
      repoTypes: Object.keys(repoTypes).length > 0 ? repoTypes : null,
      // For single repo, provide a convenient field
      repository: repositories.size === 1 ? Array.from(repositories)[0] : null,
      repoType: repositories.size === 1 && repoTypes[Array.from(repositories)[0]] 
        ? repoTypes[Array.from(repositories)[0]] 
        : null,
    };

    return {
      period,
      totalHours: Math.round(totalHours * 100) / 100,
      totalSessions: timeEstimates.length,
      totalCommits: commits.length,
      repositories: repositoryInfo,
      commits: commits, // Include commits for simple formatter
      sessions: timeEstimates.map((est, idx) => {
        // Validate dates before formatting
        const startTime = est.startTime instanceof Date ? est.startTime : new Date(est.startTime);
        const endTime = est.endTime instanceof Date ? est.endTime : new Date(est.endTime);
        
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          throw new Error(`Invalid date in time estimate: startTime=${est.startTime}, endTime=${est.endTime}`);
        }

        return {
          id: idx + 1,
          date: formatDate(startTime),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: Math.round(est.duration * 100) / 100,
          durationMinutes: est.durationMinutes,
          commits: est.commits,
          confidence: Math.round(est.confidence * 100) / 100,
          // Extract projects and tickets from commits in this session
          projects: this._extractSessionProjects(commits, est),
          tickets: this._extractSessionTickets(commits, est),
          summary: this._generateSummary(commits, est),
        };
      }),
      byDate,
      byProject: Object.keys(byProject).length > 0 ? byProject : null,
      byTicket: Object.keys(byTicket).length > 0 ? byTicket : null,
      hoursByProject: Object.keys(hoursByProject).length > 0 ? hoursByProject : null,
    };
  }

  /**
   * Extract period from commits
   */
  _extractPeriod(commits) {
    if (commits.length === 0) {
      return { start: null, end: null };
    }

    const dates = commits.map((c) => c.date).sort((a, b) => a - b);
    return {
      start: formatDate(dates[0]),
      end: formatDate(dates[dates.length - 1]),
    };
  }

  /**
   * Extract projects from session commits
   */
  _extractSessionProjects(commits, estimate) {
    const startTime = estimate.startTime instanceof Date ? estimate.startTime : new Date(estimate.startTime);
    const endTime = estimate.endTime instanceof Date ? estimate.endTime : new Date(estimate.endTime);
    const sessionCommits = commits.filter(
      (c) => c.date >= startTime && c.date <= endTime
    );
    const projects = new Set();
    for (const commit of sessionCommits) {
      if (commit.project) {
        projects.add(commit.project);
      }
    }
    return Array.from(projects);
  }

  /**
   * Extract tickets from session commits
   */
  _extractSessionTickets(commits, estimate) {
    const startTime = estimate.startTime instanceof Date ? estimate.startTime : new Date(estimate.startTime);
    const endTime = estimate.endTime instanceof Date ? estimate.endTime : new Date(estimate.endTime);
    const sessionCommits = commits.filter(
      (c) => c.date >= startTime && c.date <= endTime
    );
    const tickets = new Set();
    for (const commit of sessionCommits) {
      for (const ticket of commit.tickets || []) {
        tickets.add(ticket);
      }
    }
    return Array.from(tickets);
  }

  /**
   * Generate summary for session
   */
  _generateSummary(commits, estimate) {
    const startTime = estimate.startTime instanceof Date ? estimate.startTime : new Date(estimate.startTime);
    const endTime = estimate.endTime instanceof Date ? estimate.endTime : new Date(estimate.endTime);
    const sessionCommits = commits.filter(
      (c) => c.date >= startTime && c.date <= endTime
    );

    if (sessionCommits.length === 0) {
      return "No commits";
    }

    // Extract first line of each commit message (no truncation - show full messages)
    const messages = sessionCommits.map((commit) => {
      const firstLine = commit.message.split("\n")[0].trim();
      return firstLine; // Return full message, no truncation
    });

    // If only one commit, return it directly
    if (messages.length === 1) {
      return messages[0];
    }

    // For multiple commits, show all messages
    // Limit to first 5 messages to avoid overly long summaries
    const maxMessages = 5;
    const messagesToShow = messages.slice(0, maxMessages);
    const remainingCount = messages.length - maxMessages;

    let summary = messagesToShow.join("; ");
    
    // Add indicator if there are more commits
    if (remainingCount > 0) {
      summary += ` (+${remainingCount} more)`;
    }

    // Don't truncate the summary - show full messages
    // Users can see the full commit messages in the commits array if needed
    return summary;
  }
}

module.exports = TimesheetGenerator;

