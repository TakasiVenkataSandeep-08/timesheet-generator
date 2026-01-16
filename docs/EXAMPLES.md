# Examples

Comprehensive examples for common use cases.

## Basic Usage

### Generate Last Week's Timesheet

```bash
timesheet generate --date-range last-week
```

### Generate This Month's Timesheet

```bash
timesheet generate --date-range this-month
```

### Custom Date Range

```bash
timesheet generate --since 2024-01-01 --until 2024-01-31
```

---

## Output Formats

### JSON Output

```bash
# Default format
timesheet generate --date-range last-week

# Save to file
timesheet generate --date-range last-week --output weekly.json

# Pretty print
timesheet generate --date-range last-week | jq .
```

### CSV Output

```bash
timesheet generate --format csv --output timesheet.csv
```

### Markdown Report

```bash
timesheet generate --format markdown --output report.md
```

### Simple Text (Quick View)

```bash
timesheet generate --simple --date-range last-week
```

### PDF Report

```bash
timesheet generate --format pdf --output timesheet.pdf
```

### HTML Dashboard

```bash
timesheet generate --format html --output dashboard.html
open dashboard.html  # macOS
```

---

## Branch Filtering

### Single Branch

```bash
timesheet generate --branch main --date-range last-week
```

### Branch Pattern

```bash
# Feature branches
timesheet generate --branch "feature/*" --date-range last-week

# Bugfix branches
timesheet generate --branch "bugfix/**" --date-range last-week

# All branches
timesheet generate --all-branches --date-range last-week
```

---

## Author Filtering

### Filter by Author Name

```bash
timesheet generate --author "John Doe" --date-range last-week
```

### Filter by Email

```bash
timesheet generate --author "john@example.com" --date-range last-week
```

### Auto-detect (Default)

```bash
timesheet generate --author auto --date-range last-week
```

---

## Repository Options

### Local Repository

```bash
# Current directory (default)
timesheet generate --date-range last-week

# Specific path
timesheet generate --repo /path/to/repo --date-range last-week
```

### GitHub Repository

```bash
# Using environment variable
export GITHUB_TOKEN=your-token
timesheet generate --github owner/repo --date-range last-week

# Using --token flag
timesheet generate --github owner/repo --token $GITHUB_TOKEN --date-range last-week
```

### GitLab Repository

```bash
# Using environment variable
export GITLAB_TOKEN=your-token
timesheet generate --gitlab owner/repo --date-range last-week

# Custom GitLab instance
timesheet generate --gitlab owner/repo --gitlab-url https://gitlab.example.com --date-range last-week
```

### Multiple Repositories

```bash
timesheet generate --multi-repo ./repo1 ./repo2 ./repo3 --date-range last-week
```

---

## Time Tracking Integrations

### Linear Integration

```bash
export LINEAR_API_KEY=your-key
timesheet generate --format linear --date-range last-week

# Dry run (preview)
timesheet generate --format linear --date-range last-week --dry-run
```

### Toggl Integration

```bash
export TOGGL_API_TOKEN=your-token
export TOGGL_WORKSPACE_ID=workspace-id  # Optional
timesheet generate --format toggl --date-range last-week
```

### Clockify Integration

```bash
export CLOCKIFY_API_KEY=your-key
export CLOCKIFY_WORKSPACE_ID=workspace-id  # Optional
timesheet generate --format clockify --date-range last-week
```

### Jira Integration

```bash
# CSV export
timesheet generate --format jira --output jira-import.csv

# Direct API (requires env vars)
export JIRA_EMAIL=your-email
export JIRA_API_TOKEN=your-token
export JIRA_BASE_URL=https://your-domain.atlassian.net
timesheet generate --format jira --date-range last-week
```

---

## Advanced Usage

### Include File Statistics

```bash
timesheet generate --include-stats --date-range last-week
```

### Exclude Merge Commits

```bash
timesheet generate --no-merges --date-range last-week
```

### Interactive Mode

```bash
timesheet generate --interactive
```

### Configuration Wizard

```bash
timesheet config
```

### Validate Repository

```bash
timesheet validate
timesheet validate --repo /path/to/repo
```

---

## Workflows

### Weekly Timesheet Workflow

```bash
#!/bin/bash
# Generate weekly timesheet and email it

timesheet generate \
  --date-range last-week \
  --format markdown \
  --output weekly-report.md

# Email the report
mail -s "Weekly Timesheet - $(date +%Y-%m-%d)" team@example.com < weekly-report.md
```

### Monthly Report Workflow

```bash
#!/bin/bash
# Generate monthly report with multiple formats

DATE=$(date +%Y-%m-%d)
timesheet generate \
  --date-range last-month \
  --format json \
  --output "monthly-${DATE}.json"

timesheet generate \
  --date-range last-month \
  --format markdown \
  --output "monthly-${DATE}.md"

timesheet generate \
  --date-range last-month \
  --format pdf \
  --output "monthly-${DATE}.pdf"
```

### Multi-Repository Aggregation

```bash
#!/bin/bash
# Aggregate timesheets from multiple repositories

timesheet generate \
  --multi-repo \
    ./frontend \
    ./backend \
    ./api \
    ./mobile \
  --date-range last-week \
  --format json \
  --output combined-timesheet.json
```

### Project-Specific Analysis

```bash
#!/bin/bash
# Analyze specific project branch

timesheet generate \
  --branch "feature/frontend/*" \
  --date-range last-week \
  --format json \
  --output frontend-timesheet.json
```

### Batch Processing

```bash
#!/bin/bash
# Generate timesheets for multiple weeks

for week in 1 2 3 4; do
  START_DATE=$(date -v-${week}w -v+Mon +%Y-%m-%d)
  END_DATE=$(date -v-${week}w -v+Sun +%Y-%m-%d)
  
  timesheet generate \
    --since $START_DATE \
    --until $END_DATE \
    --format json \
    --output "week-${week}.json"
done
```

---

## Integration Examples

### CI/CD Integration

```yaml
# GitHub Actions example
name: Generate Timesheet

on:
  schedule:
    - cron: '0 0 * * 1'  # Every Monday

jobs:
  timesheet:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g timesheet-generator
      - run: |
          timesheet generate \
            --date-range last-week \
            --format markdown \
            --output weekly-report.md
      - uses: actions/upload-artifact@v3
        with:
          name: weekly-timesheet
          path: weekly-report.md
```

### Script Integration

```javascript
// Node.js script
const { execSync } = require('child_process');
const fs = require('fs');

// Generate timesheet
const output = execSync(
  'timesheet generate --date-range last-week --format json',
  { encoding: 'utf-8' }
);

const timesheet = JSON.parse(output);

// Process data
console.log(`Total hours: ${timesheet.totalHours}`);
console.log(`Total commits: ${timesheet.totalCommits}`);

// Save processed data
fs.writeFileSync('processed-timesheet.json', JSON.stringify(timesheet, null, 2));
```

### Python Integration

```python
import subprocess
import json

# Generate timesheet
result = subprocess.run(
    ['timesheet', 'generate', '--date-range', 'last-week', '--format', 'json'],
    capture_output=True,
    text=True
)

timesheet = json.loads(result.stdout)

# Process data
print(f"Total hours: {timesheet['totalHours']}")
print(f"Total commits: {timesheet['totalCommits']}")

# Process sessions
for session in timesheet['sessions']:
    print(f"{session['date']}: {session['duration']}h")
```

---

## Data Processing Examples

### Extract Total Hours

```bash
timesheet generate --format json | jq '.totalHours'
```

### List All Sessions

```bash
timesheet generate --format json | jq '.sessions[] | "\(.date): \(.duration)h"'
```

### Group by Project

```bash
timesheet generate --format json | jq '.byProject'
```

### Filter by Date

```bash
timesheet generate --format json | jq '.sessions[] | select(.date == "2024-01-01")'
```

### Count Commits per Day

```bash
timesheet generate --format json | jq '.sessions | group_by(.date) | map({date: .[0].date, count: length})'
```

---

## Troubleshooting Examples

### Debug Mode

```bash
DEBUG=1 timesheet generate --date-range last-week
```

### Validate Before Generating

```bash
timesheet validate
timesheet generate --date-range last-week
```

### Check Configuration

```bash
cat .timesheetrc
timesheet config  # Interactive update
```

---

## See Also

- [CLI Reference](CLI_REFERENCE.md) - Complete command reference
- [Formatters Guide](FORMATTERS.md) - All output formats
- [Configuration Guide](CONFIGURATION.md) - Configuration options
- [Integrations](INTEGRATIONS.md) - Integration guides

