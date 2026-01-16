const TimesheetGenerator = require('../core/TimesheetGenerator');
const { getAdapter } = require('../adapters');
const { parseDateRange } = require('../utils/dateUtils');
const ConfigLoader = require('../config/loader');

/**
 * MCP Tool implementations
 */

/**
 * Generate timesheet from git commits
 */
async function generateTimesheet(args) {
  const {
    dateRange = 'last-week',
    since,
    until,
    branch,
    allBranches = false,
    author,
    repo,
    github,
    gitlab,
    format = 'json',
  } = args;

  // Load config
  const configLoader = new ConfigLoader();
  const config = configLoader.load();

  // Parse date range
  let startDate, endDate;
  if (since && until) {
    startDate = new Date(since);
    endDate = new Date(until);
  } else {
    const range = parseDateRange(dateRange);
    startDate = range.start;
    endDate = range.end;
  }

  // Create adapter
  let adapter;
  if (github) {
    const [owner, repoName] = github.split('/');
    adapter = getAdapter('github', {
      owner,
      repo: repoName,
      token: process.env.GITHUB_TOKEN,
    });
  } else if (gitlab) {
    adapter = getAdapter('gitlab', {
      projectId: gitlab,
      token: process.env.GITLAB_TOKEN,
    });
  } else {
    adapter = getAdapter('local', repo || process.cwd());
  }

  // Get commits
  const commits = await adapter.getCommits({
    since: startDate,
    until: endDate,
    author: author || (config.defaults.author !== 'auto' ? config.defaults.author : null),
    branches: allBranches ? null : (branch ? [branch] : null),
    noMerges: config.defaults.excludeMerges,
  });

  if (commits.length === 0) {
    return {
      success: false,
      message: 'No commits found for the specified criteria',
      timesheet: null,
    };
  }

  // Generate timesheet
  const generator = new TimesheetGenerator(config);
  const timesheet = await generator.generate(commits, {
    period: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    },
  });

  return {
    success: true,
    timesheet,
    summary: {
      totalHours: timesheet.totalHours,
      totalSessions: timesheet.totalSessions,
      totalCommits: timesheet.totalCommits,
      period: timesheet.period,
    },
  };
}

/**
 * Get work sessions with time estimates
 */
async function getWorkSessions(args) {
  const {
    dateRange = 'last-week',
    since,
    until,
    branch,
    author,
    repo,
  } = args;

  const result = await generateTimesheet({
    dateRange,
    since,
    until,
    branch,
    author,
    repo,
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    sessions: result.timesheet.sessions,
    summary: result.summary,
  };
}

/**
 * Estimate time for commits
 */
async function estimateTime(args) {
  const { commits } = args;

  if (!commits || !Array.isArray(commits) || commits.length === 0) {
    return {
      success: false,
      message: 'No commits provided',
      estimate: null,
    };
  }

  const configLoader = new ConfigLoader();
  const config = configLoader.load();

  const generator = new TimesheetGenerator(config);
  const timesheet = await generator.generate(commits);

  return {
    success: true,
    estimate: {
      totalHours: timesheet.totalHours,
      totalSessions: timesheet.totalSessions,
      sessions: timesheet.sessions,
    },
  };
}

module.exports = {
  generateTimesheet,
  getWorkSessions,
  estimateTime,
};

