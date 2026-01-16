# Configuration Guide

## Configuration File

Create a `.timesheetrc` file in your project root or home directory:

```json
{
  "defaults": {
    "author": "auto",
    "dateRange": "last-week",
    "branches": "all",
    "excludeMerges": true,
    "workHours": {
      "start": "09:00",
      "end": "17:00",
      "timezone": "auto"
    },
    "excludeWeekends": true,
    "excludeNonWorkHours": false,
    "excludeHolidays": false,
    "holidayCountry": "US",
    "holidayState": null,
    "customHolidays": []
  },
  "timeEstimation": {
    "method": "intelligent",
    "gapThreshold": 30,
    "minSessionDuration": 15,
    "maxSessionDuration": 480,
    "baseTimePerCommit": 10
  },
  "output": {
    "format": "json",
    "includeStats": false,
    "includeFileChanges": false,
    "groupBy": "day"
  },
  "projects": {
    "frontend": {
      "branches": ["feature/frontend/*"],
      "files": ["src/components/**"],
      "keywords": ["ui", "component"]
    }
  }
}
```

## Options

### Defaults

- `author` - Author filter ("auto" to detect from git config)
- `dateRange` - Default date range (last-week, this-week, last-month, this-month)
- `branches` - Branch filter ("all" or pattern)
- `excludeMerges` - Exclude merge commits
- `workHours` - Work hours configuration
  - `start` - Start time (HH:mm)
  - `end` - End time (HH:mm)
  - `timezone` - Timezone ("auto" or specific)
- `excludeWeekends` - Exclude weekends from sessions
- `excludeNonWorkHours` - Exclude commits outside work hours
- `excludeHolidays` - Exclude holidays
- `holidayCountry` - Country code for holiday detection (e.g., "US", "GB")
- `holidayState` - State code for US holidays (optional)
- `customHolidays` - Array of custom holiday dates

### Time Estimation

- `method` - Estimation method ("intelligent")
- `gapThreshold` - Gap threshold in minutes for session grouping
- `minSessionDuration` - Minimum session duration in minutes
- `maxSessionDuration` - Maximum session duration in minutes
- `baseTimePerCommit` - Base time per commit in minutes

### Output

- `format` - Output format (json, csv, markdown, jira, simple, pdf, html)
- `includeStats` - Include file statistics
- `includeFileChanges` - Include file change details
- `groupBy` - Grouping method (day, week, month)

### Projects

Define project mappings for automatic categorization:

```json
{
  "projects": {
    "project-name": {
      "branches": ["feature/project-name/*"],
      "files": ["src/project-name/**"],
      "keywords": ["project", "feature"]
    }
  }
}
```

## Environment Variables

- `GITHUB_TOKEN` - GitHub API token
- `GITLAB_TOKEN` - GitLab API token
- `LINEAR_API_KEY` - Linear API key
- `TOGGL_API_TOKEN` - Toggl API token
- `CLOCKIFY_API_KEY` - Clockify API key
- `JIRA_EMAIL` - Jira email
- `JIRA_API_TOKEN` - Jira API token
- `JIRA_BASE_URL` - Jira base URL
- `DEBUG` - Enable debug logging

## CLI Overrides

All config options can be overridden via CLI flags:

```bash
timesheet generate --date-range this-week --branch main --format csv
```

