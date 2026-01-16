# Integration Guides

## Linear Integration

### Setup

1. Get Linear API key from Linear settings
2. Set environment variable: `export LINEAR_API_KEY=your-key`

### Usage

```bash
timesheet generate --format linear --date-range last-week
```

Or programmatically:

```javascript
const LinearFormatter = require('timesheet-generator/formatters/LinearFormatter');

const formatter = new LinearFormatter({
  apiKey: 'your-key',
  dryRun: false, // Set to true to preview
});
const result = await formatter.format(timesheet);
```

## Toggl Integration

### Setup

1. Get Toggl API token from Toggl profile settings
2. Set environment variable: `export TOGGL_API_TOKEN=your-token`
3. Optional: Set workspace ID: `export TOGGL_WORKSPACE_ID=workspace-id`

### Usage

```bash
timesheet generate --format toggl --date-range last-week
```

## Clockify Integration

### Setup

1. Get Clockify API key from Clockify settings
2. Set environment variable: `export CLOCKIFY_API_KEY=your-key`
3. Optional: Set workspace ID: `export CLOCKIFY_WORKSPACE_ID=workspace-id`

### Usage

```bash
timesheet generate --format clockify --date-range last-week
```

## Jira Integration

### CSV Export

```bash
timesheet generate --format jira --date-range last-week --output jira-import.csv
```

### Direct API Import

1. Get Jira API token from Atlassian account settings
2. Set environment variables:
   ```bash
   export JIRA_EMAIL=your-email
   export JIRA_API_TOKEN=your-token
   export JIRA_BASE_URL=https://your-domain.atlassian.net
   ```

3. Use API format:
   ```bash
   timesheet generate --format jira --date-range last-week --jira-api
   ```

Or programmatically:

```javascript
const JiraFormatter = require('timesheet-generator/formatters/JiraFormatter');

const formatter = new JiraFormatter({
  useAPI: true,
  email: 'your-email',
  apiToken: 'your-token',
  baseUrl: 'https://your-domain.atlassian.net',
});
const result = await formatter.format(timesheet);
```

## GitHub Integration

### Setup

1. Create GitHub Personal Access Token
2. Set environment variable: `export GITHUB_TOKEN=your-token`

### Usage

```bash
timesheet generate --github owner/repo --date-range last-week
```

## GitLab Integration

### Setup

1. Create GitLab Personal Access Token
2. Set environment variable: `export GITLAB_TOKEN=your-token`

### Usage

```bash
timesheet generate --gitlab project-id --date-range last-week
```

## Project Mapping

Configure project mappings in `.timesheetrc`:

```json
{
  "projects": {
    "frontend": {
      "branches": ["feature/frontend/*"],
      "files": ["src/components/**"],
      "keywords": ["ui", "component"]
    }
  }
}
```

This enables automatic project categorization from branch names, file paths, and commit messages.

