# API Reference

## Core Classes

### TimesheetGenerator

Main class for generating timesheets from commits.

```javascript
const TimesheetGenerator = require('timesheet-generator/core/TimesheetGenerator');

const generator = new TimesheetGenerator(config);
const timesheet = await generator.generate(commits, options);
```

**Methods:**

- `generate(commits, options)` - Generate timesheet from commits
  - `commits` (array): Array of commit objects
  - `options` (object): Generation options
    - `period` (object): Period information
      - `start` (string): Start date (YYYY-MM-DD)
      - `end` (string): End date (YYYY-MM-DD)

**Returns:** Timesheet object

### TimeEstimator

Estimates work time from commit patterns.

```javascript
const TimeEstimator = require('timesheet-generator/core/TimeEstimator');

const estimator = new TimeEstimator(config);
const estimate = estimator.estimateSession(session);
```

**Methods:**

- `estimateSession(session)` - Estimate time for a session
- `estimateSessions(sessions)` - Estimate time for multiple sessions

### SessionGrouper

Groups commits into work sessions.

```javascript
const SessionGrouper = require('timesheet-generator/core/SessionGrouper');

const grouper = new SessionGrouper(config);
const sessions = grouper.groupIntoSessions(commits);
```

**Methods:**

- `groupIntoSessions(commits, gapThreshold)` - Group commits into sessions
- `mergeAdjacentSessions(sessions, maxGap)` - Merge adjacent sessions

### CommitAnalyzer

Extracts metadata from commits.

```javascript
const CommitAnalyzer = require('timesheet-generator/core/CommitAnalyzer');

const analyzer = new CommitAnalyzer(config);
const analyzed = analyzer.analyze(commit);
```

**Methods:**

- `analyze(commit)` - Analyze a single commit
- `analyzeBatch(commits)` - Analyze multiple commits
- `extractTickets(message)` - Extract ticket IDs from message
- `categorizeProject(commit, config)` - Categorize project from commit

## Adapters

### LocalGitAdapter

```javascript
const { getAdapter } = require('timesheet-generator/adapters');

const adapter = getAdapter('local', '/path/to/repo');
const commits = await adapter.getCommits(options);
```

### GitHubAdapter

```javascript
const adapter = getAdapter('github', {
  owner: 'owner',
  repo: 'repo',
  token: 'token',
});
const commits = await adapter.getCommits(options);
```

### GitLabAdapter

```javascript
const adapter = getAdapter('gitlab', {
  projectId: 'project-id',
  token: 'token',
});
const commits = await adapter.getCommits(options);
```

## Formatters

### JSONFormatter

```javascript
const { getFormatter } = require('timesheet-generator/formatters');

const formatter = getFormatter('json');
const output = await formatter.format(timesheet);
```

### CSVFormatter

```javascript
const formatter = getFormatter('csv');
const output = await formatter.format(timesheet);
```

### PDFFormatter

```javascript
const formatter = getFormatter('pdf');
const output = await formatter.format(timesheet); // Returns Buffer
```

### HTMLFormatter

```javascript
const formatter = getFormatter('html');
const output = await formatter.format(timesheet);
```

### LinearFormatter

```javascript
const formatter = getFormatter('linear', {
  apiKey: 'linear-api-key',
  dryRun: false,
});
const result = await formatter.format(timesheet);
```

### TogglFormatter

```javascript
const formatter = getFormatter('toggl', {
  apiToken: 'toggl-token',
  workspaceId: 'workspace-id',
});
const result = await formatter.format(timesheet);
```

### JiraFormatter

```javascript
// CSV export
const formatter = getFormatter('jira');
const csv = await formatter.format(timesheet);

// Direct API import
const formatter = getFormatter('jira', {
  useAPI: true,
  email: 'email',
  apiToken: 'token',
  baseUrl: 'https://your-domain.atlassian.net',
});
const result = await formatter.format(timesheet);
```

## Utilities

### Date Utilities

```javascript
const {
  parseDateRange,
  formatDate,
  formatTime,
  isWeekend,
  isWorkHour,
  minutesBetween,
} = require('timesheet-generator/utils/dateUtils');
```

### Commit Utilities

```javascript
const {
  normalizeCommit,
  sortCommitsByDate,
  deduplicateCommits,
} = require('timesheet-generator/utils/commitUtils');
```

### Error Handler

```javascript
const { handleError, retryWithBackoff } = require('timesheet-generator/utils/errorHandler');

try {
  // operation
} catch (error) {
  handleError(error);
}
```

### Cache

```javascript
const { getCache } = require('timesheet-generator/utils/cache');

const cache = getCache({ defaultTTL: 3600000 });
cache.set('key', value);
const value = cache.get('key');
```

## MCP Server

```javascript
const { TimesheetMCPServer } = require('timesheet-generator/mcp');

const server = new TimesheetMCPServer();
await server.start();
```

## Configuration

See [CONFIGURATION.md](CONFIGURATION.md) for detailed configuration options.

