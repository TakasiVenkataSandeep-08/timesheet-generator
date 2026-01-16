# CLI Reference

Complete reference for all CLI commands and options.

## Commands

### `timesheet generate` (alias: `gen`)

Generate timesheet from git commits.

#### Basic Usage

```bash
# Generate for last week (default)
timesheet generate

# Using alias
timesheet gen --date-range last-week
```

#### Date Options

```bash
# Date range presets
timesheet generate --date-range last-week
timesheet generate --date-range this-week
timesheet generate --date-range last-month
timesheet generate --date-range this-month

# Custom date range
timesheet generate --since 2024-01-01 --until 2024-01-31
```

#### Branch Filtering

```bash
# Single branch
timesheet generate --branch main

# Branch pattern (glob)
timesheet generate --branch "feature/*"
timesheet generate --branch "bugfix/**"

# All branches
timesheet generate --all-branches
```

#### Author Filtering

```bash
# Filter by author name
timesheet generate --author "John Doe"

# Filter by email
timesheet generate --author "john@example.com"

# Auto-detect from git config (default)
timesheet generate --author auto
```

#### Output Formats

```bash
# JSON (default)
timesheet generate --format json

# CSV (Jira-compatible)
timesheet generate --format csv

# Markdown
timesheet generate --format markdown

# Jira CSV format
timesheet generate --format jira

# Simple text (no-nonsense mode)
timesheet generate --format simple
timesheet generate --simple  # Alias

# PDF report
timesheet generate --format pdf

# HTML dashboard
timesheet generate --format html

# Save to file
timesheet generate --format markdown --output report.md
timesheet generate --format pdf --output timesheet.pdf
```

#### Repository Options

```bash
# Local repository (default: current directory)
timesheet generate --repo /path/to/repo

# GitHub repository
timesheet generate --github owner/repo --date-range last-week

# GitLab repository
timesheet generate --gitlab owner/repo --date-range last-week

# Custom GitLab instance
timesheet generate --gitlab owner/repo --gitlab-url https://gitlab.example.com

# Multiple repositories
timesheet generate --multi-repo ./repo1 ./repo2 ./repo3
```

#### API Authentication

```bash
# Using environment variables (recommended)
export GITHUB_TOKEN=your-token
export GITLAB_TOKEN=your-token
timesheet generate --github owner/repo

# Using --token flag
timesheet generate --github owner/repo --token $GITHUB_TOKEN
```

#### Commit Filtering

```bash
# Exclude merge commits
timesheet generate --no-merges

# Include file statistics
timesheet generate --include-stats
```

#### Interactive Mode

```bash
# Interactive prompts for all options
timesheet generate --interactive
```

#### Complete Example

```bash
timesheet generate \
  --date-range last-week \
  --branch "feature/*" \
  --format markdown \
  --output weekly-report.md \
  --include-stats \
  --no-merges
```

---

### `timesheet config`

Interactive configuration wizard to create/update `.timesheetrc` file.

```bash
timesheet config
```

**What it does:**
- Prompts for all configuration options
- Creates `.timesheetrc` in current directory or home directory
- Validates configuration before saving
- Shows current configuration values

**Example flow:**
```
? Default date range: (Use arrow keys)
  > last-week
    this-week
    last-month
    this-month

? Work hours start: (09:00)
? Work hours end: (17:00)
? Exclude weekends? (Y/n)
...
```

---

### `timesheet validate`

Validate repository and configuration.

```bash
# Validate current repository
timesheet validate

# Validate specific repository
timesheet validate --repo /path/to/repo
```

**What it checks:**
- Git repository validity
- Configuration file format
- Date range validity
- Branch existence
- API token availability (if using GitHub/GitLab)
- Output format support

**Output:**
```
✓ Git repository found
✓ Configuration loaded
✓ Date range valid
✓ Branch 'main' exists
✓ Output format 'json' supported
```

---

### `timesheet mcp-server`

Start the Model Context Protocol (MCP) server for AI tool integration.

```bash
timesheet mcp-server
```

**Usage:**
- Used by AI tools (Claude Desktop, Cursor) to integrate timesheet generation
- Communicates via stdio
- See [MCP Integration Guide](MCP_INTEGRATION.md) for setup

**Note:** This command is typically invoked by AI tools, not directly by users.

---

## Global Options

### `--version` / `-V`

Show version number.

```bash
timesheet --version
```

### `--help` / `-h`

Show help for command or global help.

```bash
timesheet --help
timesheet generate --help
timesheet config --help
```

---

## Environment Variables

### API Tokens

```bash
# GitHub
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxx

# GitLab
export GITLAB_TOKEN=glpat-xxxxxxxxxxxxx

# Linear
export LINEAR_API_KEY=lin_api_xxxxxxxxxxxxx

# Toggl
export TOGGL_API_TOKEN=xxxxxxxxxxxxx
export TOGGL_WORKSPACE_ID=12345678  # Optional

# Clockify
export CLOCKIFY_API_KEY=xxxxxxxxxxxxx
export CLOCKIFY_WORKSPACE_ID=12345678  # Optional

# Jira
export JIRA_EMAIL=your-email@example.com
export JIRA_API_TOKEN=xxxxxxxxxxxxx
export JIRA_BASE_URL=https://your-domain.atlassian.net
```

### Debug Mode

```bash
# Enable debug logging
export DEBUG=1
timesheet generate --date-range last-week
```

### Output Formatting

```bash
# JSON output (default)
timesheet generate | jq .

# CSV output
timesheet generate --format csv > timesheet.csv

# Markdown output
timesheet generate --format markdown | less
```

---

## Common Workflows

### Weekly Timesheet

```bash
timesheet generate --date-range last-week --format json > weekly.json
```

### Monthly Report

```bash
timesheet generate --date-range last-month --format markdown --output monthly.md
```

### Jira Import

```bash
timesheet generate --date-range last-week --format jira --output jira-import.csv
# Then import CSV into Jira Time Tracking
```

### Multiple Repositories

```bash
timesheet generate \
  --multi-repo ./frontend ./backend ./api \
  --date-range last-week \
  --format json \
  --output combined-timesheet.json
```

### GitHub Repository

```bash
export GITHUB_TOKEN=your-token
timesheet generate \
  --github owner/repo \
  --date-range last-week \
  --format markdown \
  --output github-timesheet.md
```

### Project-Specific Branch

```bash
timesheet generate \
  --branch "feature/frontend/*" \
  --date-range last-week \
  --format json
```

### Simple Mode (Quick View)

```bash
timesheet generate --simple --date-range last-week
```

### Interactive Setup

```bash
# First time setup
timesheet config

# Then generate with prompts
timesheet generate --interactive
```

---

## Output Examples

### JSON Output

```json
{
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-07"
  },
  "totalHours": 32.5,
  "totalSessions": 12,
  "totalCommits": 45,
  "repositories": {
    "repository": "my-project",
    "repoType": "local"
  },
  "sessions": [
    {
      "date": "2024-01-01",
      "startTime": "2024-01-01T09:15:00Z",
      "endTime": "2024-01-01T12:30:00Z",
      "duration": 3.25,
      "commits": [...],
      "summary": "Implemented user authentication",
      "tickets": ["PROJ-123"],
      "projects": ["frontend"]
    }
  ]
}
```

### CSV Output

```csv
Date,Start Time,End Time,Duration (hours),Description,Issue Key,Project,Repository
2024-01-01,09:15,12:30,3.25,"Implemented user authentication","PROJ-123","frontend","my-project"
```

### Simple Output

```
Repository: my-project
Type: local

1. 2024-01-01 09:15 - 12:30 (3.25h)
   - Implemented user authentication
   - Fixed login bug
   - Added password reset

2. 2024-01-01 14:00 - 17:30 (3.5h)
   - Refactored API endpoints
   - Updated documentation
```

---

## Tips & Tricks

### Combine with Other Tools

```bash
# Filter by author and format
timesheet generate --author "John" --format csv | grep "2024-01"

# Count commits
timesheet generate --format json | jq '.totalCommits'

# Get total hours
timesheet generate --format json | jq '.totalHours'

# List all sessions
timesheet generate --format json | jq '.sessions[] | .date + ": " + (.duration | tostring) + "h"'
```

### Batch Processing

```bash
# Generate for multiple weeks
for week in 1 2 3 4; do
  timesheet generate --since "2024-01-$((week*7-6))" --until "2024-01-$((week*7))" --output "week-$week.json"
done
```

### Integration with Scripts

```bash
#!/bin/bash
# Generate weekly report and email it
timesheet generate --date-range last-week --format markdown --output weekly.md
mail -s "Weekly Timesheet" team@example.com < weekly.md
```

---

## Error Handling

### Common Errors

**No commits found:**
```bash
# Check date range
timesheet generate --since 2024-01-01 --until 2024-01-31

# Check branch
timesheet generate --all-branches

# Enable debug
DEBUG=1 timesheet generate
```

**API authentication failed:**
```bash
# Verify token
echo $GITHUB_TOKEN

# Use --token flag
timesheet generate --github owner/repo --token $GITHUB_TOKEN
```

**Invalid date:**
```bash
# Use proper format: YYYY-MM-DD
timesheet generate --since 2024-01-01 --until 2024-01-31
```

---

## See Also

- [Configuration Guide](CONFIGURATION.md) - Detailed configuration options
- [API Reference](API.md) - Programmatic API usage
- [Integrations](INTEGRATIONS.md) - Integration with external services
- [MCP Integration](MCP_INTEGRATION.md) - AI tool integration
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions
- [FAQ](FAQ.md) - Frequently asked questions

