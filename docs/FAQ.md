# Frequently Asked Questions

## General

### What is this tool?

A command-line tool that automatically generates timesheets from git commits with intelligent time estimation.

### How does it estimate time?

It uses multiple factors:
- Commit gaps (time between commits)
- File complexity (lines of code changed)
- Commit message hints (refactor, quick fix, etc.)
- Session grouping (logical work blocks)

### What makes it "intelligent"?

- Groups commits into logical work sessions
- Estimates actual work time, not just commit time
- Learns from your work patterns
- Handles multiple repositories
- Supports various output formats

## Usage

### How do I generate a timesheet?

```bash
timesheet generate --date-range last-week
```

### Can I use it with GitHub/GitLab?

Yes:
```bash
timesheet generate --github owner/repo --date-range last-week
timesheet generate --gitlab project-id --date-range last-week
```

### How do I export to Jira/Linear/Toggl?

```bash
timesheet generate --format jira --date-range last-week
timesheet generate --format linear --date-range last-week
timesheet generate --format toggl --date-range last-week
```

### Can I customize work hours?

Yes, in `.timesheetrc`:
```json
{
  "defaults": {
    "workHours": {
      "start": "10:00",
      "end": "18:00"
    }
  }
}
```

## Configuration

### Where is the config file?

`.timesheetrc` in your project root or home directory.

### Can I exclude weekends?

Yes, set `excludeWeekends: true` in config (default).

### Can I exclude holidays?

Yes, set `excludeHolidays: true` and configure `holidayCountry`.

### How do I map projects?

Add to `.timesheetrc`:
```json
{
  "projects": {
    "project-name": {
      "branches": ["feature/project-name/*"],
      "files": ["src/project-name/**"],
      "keywords": ["project"]
    }
  }
}
```

## Technical

### What Node.js version is required?

Node.js 18+ (for native fetch API).

### Can I use it programmatically?

Yes, import the modules:
```javascript
const TimesheetGenerator = require('timesheet-generator/core/TimesheetGenerator');
```

### Is there an API?

Yes, via MCP server for AI tools.

### How do I add a custom formatter?

Extend `OutputFormatter` base class and register in `formatters/index.js`.

## Troubleshooting

### Why are sessions empty?

Check:
- Work hours configuration
- Weekend/holiday exclusion
- Gap threshold
- Commit date validity

### Why is time estimation wrong?

Adjust:
- `gapThreshold` (default: 30 minutes)
- `baseTimePerCommit` (default: 10 minutes)
- `minSessionDuration` / `maxSessionDuration`

### How do I debug issues?

Run with `DEBUG=1`:
```bash
DEBUG=1 timesheet generate --date-range last-week
```

## Integrations

### How do I connect to Linear?

Set `LINEAR_API_KEY` environment variable.

### How do I connect to Toggl?

Set `TOGGL_API_TOKEN` environment variable.

### How do I connect to Jira?

Set `JIRA_EMAIL`, `JIRA_API_TOKEN`, and `JIRA_BASE_URL`.

### Can I use multiple integrations?

Yes, generate once and export to multiple formats.

## Advanced

### Can I learn work patterns?

Yes, enable `learnPatterns: true` in config.

### Can I customize time estimation?

Yes, adjust `timeEstimation` config section.

### Can I process multiple repos?

Yes:
```bash
timesheet generate --multi-repo ./repo1 ./repo2 ./repo3
```

### Can I cache API responses?

Yes, caching is enabled by default for GitHub/GitLab adapters.

