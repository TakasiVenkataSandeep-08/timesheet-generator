# Timesheet Generator

[![npm version](https://img.shields.io/npm/v/timesheet-generator.svg)](https://www.npmjs.com/package/timesheet-generator)
[![Node.js Version](https://img.shields.io/node/v/timesheet-generator.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](https://github.com/TakasiVenkataSandeep-08/timesheet-generator)

**Best-in-class automated timesheet generation from git commits with intelligent time estimation**

> 🚀 **Zero-config, plug-and-play timesheet automation**

## 🚀 Features

- ✅ **Intelligent Time Estimation** - Estimates actual work time from commit patterns using gap analysis, complexity scoring, and message hints
- ✅ **Zero-Config** - Works out-of-the-box with smart defaults (auto-detects author, timezone, work hours)
- ✅ **Multiple Output Formats** - JSON, CSV, Markdown, Jira-compatible CSV, PDF, HTML, Simple mode
- ✅ **Plugin Architecture** - Extensible VCS adapters (Local Git, GitHub, GitLab) and formatters
- ✅ **Smart Session Grouping** - Groups commits into logical work sessions based on time gaps
- ✅ **Ticket Extraction** - Automatically extracts Jira/Linear/GitHub issue IDs from commit messages
- ✅ **Project Categorization** - Categorizes work by project/branch/file patterns with auto-detection
- ✅ **Multi-Repository Support** - Aggregate timesheets from multiple repositories in parallel
- ✅ **Time Tracking Integrations** - Direct API integration with Jira, Linear, Toggl, Clockify
- ✅ **MCP Server** - Model Context Protocol server for AI tool integration (Claude, Cursor)
- ✅ **Holiday Detection** - Excludes holidays from work sessions (configurable by country/state)
- ✅ **Work Pattern Learning** - Auto-detects work hours from historical commit patterns
- ✅ **Interactive CLI** - Configuration wizard and validation tools
- ✅ **Structured Logging** - Debug-friendly logging with file output option

## 📦 Installation

**Requirements:** Node.js 18+ (for fetch API support)

```bash
npm install -g timesheet-generator
```

Or use locally:

```bash
npm install
npm link
```

## 🎯 Quick Start

### Zero-Config (Auto-detects everything)

```bash
# Generate timesheet for last week (default)
timesheet generate

# Or use presets
timesheet generate --date-range last-week
timesheet generate --date-range this-month
```

### Custom Date Range

```bash
timesheet generate --since 2024-01-01 --until 2024-01-31
```

### Branch Filtering

```bash
# Single branch
timesheet generate --branch main

# Branch pattern
timesheet generate --branch "feature/*"

# All branches
timesheet generate --all-branches
```

### Output Formats

```bash
# JSON (default)
timesheet generate --format json > timesheet.json

# CSV (Jira-compatible)
timesheet generate --format csv > timesheet.csv

# Markdown
timesheet generate --format markdown > timesheet.md

# Jira import format
timesheet generate --format jira > jira-import.csv
```

### Save to File

```bash
timesheet generate --output timesheet.json
timesheet generate --format markdown --output report.md
```

### GitHub Repository

```bash
# Using GitHub API (requires GITHUB_TOKEN env var or --token)
timesheet generate --github owner/repo --date-range last-week

# With explicit token
timesheet generate --github owner/repo --token $GITHUB_TOKEN
```

### GitLab Repository

```bash
# Using GitLab API (requires GITLAB_TOKEN env var or --token)
timesheet generate --gitlab owner/repo --date-range last-week

# Custom GitLab instance
timesheet generate --gitlab owner/repo --gitlab-url https://gitlab.example.com
```

### Multiple Repositories

```bash
# Multiple local repos
timesheet generate --multi-repo ./project1 ./project2 ./project3

# Mix of local and remote (use multiple commands and merge results)
```

### Interactive Mode

```bash
# Interactive prompts for all options
timesheet generate --interactive
```

### Configuration Wizard

```bash
# Interactive configuration setup
timesheet config
```

### Validation

```bash
# Validate your setup and configuration
timesheet validate

# Validate specific repository
timesheet validate --repo ./my-project
```

### PDF Output

```bash
# Generate PDF report (requires --output)
timesheet generate --format pdf --output timesheet.pdf
```

### HTML Dashboard

```bash
# Generate interactive HTML dashboard
timesheet generate --format html --output dashboard.html
```

### Simple Mode (No-Nonsense)

```bash
# Simple numbered list output
timesheet generate --simple
# or
timesheet generate --format simple
```

### Time Tracking Integrations

```bash
# Export directly to Jira (requires JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN)
timesheet generate --format jira --mode api

# Export to Toggl (requires TOGGL_API_TOKEN, TOGGL_WORKSPACE_ID)
timesheet generate --format toggl

# Export to Clockify (requires CLOCKIFY_API_KEY, CLOCKIFY_WORKSPACE_ID)
timesheet generate --format clockify

# Export to Linear (requires LINEAR_API_KEY)
timesheet generate --format linear
```

### MCP Server

```bash
# Start MCP server for AI tool integration
timesheet mcp-server
```

## ⚙️ Configuration

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
    "excludeWeekends": true
  },
  "timeEstimation": {
    "method": "intelligent",
    "gapThreshold": 30,
    "minSessionDuration": 15,
    "maxSessionDuration": 480
  },
  "output": {
    "format": "json",
    "includeStats": true,
    "groupBy": "day"
  },
  "projects": {
    "frontend": {
      "branches": ["feature/frontend/*"],
      "files": ["src/frontend/**"],
      "keywords": ["ui", "component"]
    }
  }
}
```

## 📊 Output Examples

### Simple Mode Output

```
1. 2024-01-15 09:15 - Fix authentication bug (PROJ-123)
2. 2024-01-15 09:30 - Add user profile endpoint (PROJ-124)
3. 2024-01-15 10:00 - Update documentation
```

### PDF Report

Generates a professional PDF with:

- Title page with summary statistics
- Hours by project and ticket breakdown
- Daily breakdown with session details
- All sessions with full commit messages

### HTML Dashboard

Interactive dashboard includes:

- Summary cards (total hours, commits, sessions)
- Charts (hours by day, hours by project)
- Filterable session table (by date, project, ticket)
- Export to PDF functionality

## 📊 Output Examples

### JSON Format

```json
{
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-07"
  },
  "totalHours": 32.5,
  "totalSessions": 8,
  "totalCommits": 45,
  "sessions": [
    {
      "id": 1,
      "date": "2024-01-01",
      "startTime": "2024-01-01T09:15:00Z",
      "endTime": "2024-01-01T12:30:00Z",
      "duration": 3.25,
      "commits": 5,
      "confidence": 0.85,
      "projects": ["frontend"],
      "tickets": ["PROJ-123"],
      "summary": "Implemented user authentication"
    }
  ],
  "byProject": {
    "frontend": 18.5,
    "backend": 14.0
  }
}
```

### CSV Format (Jira Import)

```csv
Date,Start Time,End Time,Duration (hours),Description,Issue Key,Project
2024-01-01,09:15,12:30,3.25,"Implemented user authentication","PROJ-123","frontend"
```

## 🧠 How Time Estimation Works

The tool uses a multi-factor algorithm to estimate work time:

1. **Session Grouping** - Commits within 30 minutes are grouped into sessions
2. **Gap Analysis** - Gaps >30 minutes indicate new work sessions
3. **Complexity Scoring** - Based on LOC changes, file types, file count
4. **Message Hints** - Extracts time hints from commit messages ("quick fix", "refactor", etc.)
5. **Work Hours** - Respects configured work hours (9-5, excludes weekends)

## 🔧 CLI Commands

### `timesheet generate` (alias: `gen`)

Generate timesheet from git commits.

**Options:**

- `--since <date>` - Start date (YYYY-MM-DD)
- `--until <date>` - End date (YYYY-MM-DD)
- `--date-range <range>` - Date range (last-week, this-week, last-month, this-month)
- `--branch <branch>` - Branch name or pattern (e.g., 'feature/\*')
- `--all-branches` - Include all branches
- `--author <author>` - Filter by author name or email
- `--format <format>` - Output format (json, csv, markdown, jira, simple, pdf, html)
- `--simple` - Alias for --format simple (no-nonsense mode)
- `--output <file>` - Output file path
- `--repo <path>` - Repository path (default: current directory)
- `--github <owner/repo>` - GitHub repository (e.g., 'owner/repo')
- `--gitlab <project-id>` - GitLab project ID or path
- `--gitlab-url <url>` - GitLab instance URL (default: https://gitlab.com)
- `--token <token>` - API token (or use GITHUB_TOKEN/GITLAB_TOKEN env var)
- `--multi-repo <paths...>` - Multiple repository paths (space-separated)
- `--no-merges` - Exclude merge commits
- `--include-stats` - Include file statistics
- `--interactive` - Interactive mode with prompts
- `-h, --help` - Display help

### `timesheet config`

Interactive configuration wizard to create/update `.timesheetrc` file.

### `timesheet validate`

Validate repository and configuration.

**Options:**

- `--repo <path>` - Repository path to validate

### `timesheet mcp-server`

Start the Model Context Protocol (MCP) server for AI tool integration.

**See:** [CLI Reference](docs/CLI_REFERENCE.md) for complete documentation.

## 🏗️ Architecture

The tool uses a plugin-based architecture:

- **VCS Adapters** - Local Git (current), GitHub, GitLab (planned)
- **Output Formatters** - JSON, CSV, Markdown, Jira (PDF, HTML planned)
- **Core Intelligence** - Time estimation, session grouping, commit analysis

## 📝 Examples

### Weekly Timesheet

```bash
timesheet generate --date-range last-week --format json > weekly.json
```

### Monthly Report

```bash
timesheet generate --date-range last-month --format markdown > monthly.md
```

### Jira Import

```bash
timesheet generate --date-range last-week --format jira > jira-import.csv
# Then import CSV into Jira Time Tracking
```

### Project-Specific

```bash
timesheet generate --branch "feature/frontend/*" --format json
```

### Simple Mode (Quick View)

```bash
timesheet generate --simple --date-range last-week
```

### Multiple Repositories

```bash
timesheet generate --multi-repo ./repo1 ./repo2 ./repo3 --date-range last-week
```

### GitHub Repository

```bash
export GITHUB_TOKEN=your-token
timesheet generate --github owner/repo --date-range last-week
```

### Interactive Mode

```bash
timesheet generate --interactive
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

## 📚 Documentation

- **[CLI Reference](docs/CLI_REFERENCE.md)** - Complete CLI command reference with all options
- **[API Reference](docs/API.md)** - Programmatic API usage
- **[Configuration Guide](docs/CONFIGURATION.md)** - Configuration options and `.timesheetrc`
- **[Formatters Guide](docs/FORMATTERS.md)** - All output formats explained (JSON, CSV, Markdown, PDF, HTML, Simple, Jira, Linear, Toggl, Clockify)
- **[Examples](docs/EXAMPLES.md)** - Comprehensive examples for common use cases
- **[Integrations](docs/INTEGRATIONS.md)** - Integration with external services
- **[MCP Integration](docs/MCP_INTEGRATION.md)** - AI tool integration (Claude, Cursor)
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[FAQ](docs/FAQ.md)** - Frequently asked questions
- **[Contributing](docs/CONTRIBUTING.md)** - Contributing guidelines

## 🐛 Troubleshooting

### No commits found

**Problem:** `timesheet generate` returns "No commits found"

**Solutions:**

1. Check your date range: `timesheet generate --since 2024-01-01 --until 2024-01-31`
2. Verify you're in a Git repository: `git status`
3. Check author filter: `timesheet generate --author "your-email@example.com"`
4. Try with `--all-branches`: `timesheet generate --all-branches`
5. Enable debug mode: `DEBUG=1 timesheet generate`

### Invalid date errors

**Problem:** `Error generating timesheet: Invalid time value`

**Solutions:**

1. Use correct date format: `YYYY-MM-DD` (e.g., `2024-01-15`)
2. Check your system date/time settings
3. Verify Git commit dates: `git log --format="%ai %s"`

### GitHub API errors

**Problem:** `GitHub API error (401)` or `GitHub API error (403)`

**Solutions:**

1. Set your GitHub token: `export GITHUB_TOKEN=your_token`
2. Or pass token: `timesheet generate --github owner/repo --token your_token`
3. Verify token has `repo` scope (for private repos)
4. Check rate limits: GitHub allows 5000 requests/hour for authenticated users

### GitLab API errors

**Problem:** `GitLab API error (401)` or `GitLab API error (403)`

**Solutions:**

1. Set your GitLab token: `export GITLAB_TOKEN=your_token`
2. Or pass token: `timesheet generate --gitlab project-id --token your_token`
3. For self-hosted GitLab: `timesheet generate --gitlab project-id --gitlab-url https://gitlab.example.com`

### Zero hours in output

**Problem:** `totalHours: 0` despite having commits

**Solutions:**

1. Check work hours filter: Default excludes non-work hours. Set `excludeNonWorkHours: false` in `.timesheetrc`
2. Check weekend filter: Default excludes weekends. Set `excludeWeekends: false` in `.timesheetrc`
3. Check holiday filter: If enabled, verify holiday configuration
4. Review gap threshold: Commits too far apart may create invalid sessions

### PDF/HTML requires --output

**Problem:** `PDF format requires --output option`

**Solution:** Always specify output file for binary formats:

```bash
timesheet generate --format pdf --output report.pdf
timesheet generate --format html --output dashboard.html
```

### Performance issues with large repos

**Problem:** Tool is slow with many commits

**Solutions:**

1. Use date range filters: `--since` and `--until`
2. Filter by branch: `--branch main`
3. Exclude merges: `--no-merges`
4. Disable file stats: Remove `includeFileChanges: true` from config

### MCP server not starting

**Problem:** `Error starting MCP server`

**Solutions:**

1. Verify MCP SDK installed: `npm list @modelcontextprotocol/sdk`
2. Check Node.js version: Requires Node.js 18+
3. Review MCP client configuration (Claude Desktop, Cursor)
4. Enable debug: `DEBUG=1 timesheet mcp-server`

## 🚧 Roadmap

### Phase 1 ✅ COMPLETE

- Core time estimation
- Local Git support
- JSON, CSV, Markdown output
- Config system
- CLI

### Phase 2 ✅ COMPLETE

- GitHub API adapter
- GitLab API adapter
- Multi-repo support
- Error handling & retry logic
- Progress indicators
- API caching

### Phase 3 ✅ COMPLETE

- MCP server for AI integration
- PDF/HTML output
- Linear/Toggl/Clockify integration
- Jira Cloud API integration
- Holiday detection
- Work pattern learning
- Interactive CLI
- Structured logging

### Phase 4 (Future)

- Team analytics dashboard
- Web UI
- Calendar integration (Google Calendar, Outlook)
- Slack/Teams notifications
- Custom time estimation models
- Machine learning improvements

## 📚 Documentation

- [API Reference](docs/API.md) - Complete API documentation
- [Configuration Guide](docs/CONFIGURATION.md) - Detailed configuration options
- [Integrations](docs/INTEGRATIONS.md) - Time tracking integrations setup
- [MCP Integration](docs/MCP_INTEGRATION.md) - AI tool integration guide
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [FAQ](docs/FAQ.md) - Frequently asked questions
- [Contributing](docs/CONTRIBUTING.md) - Development guide

## 🤝 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.

### Development Setup

```bash
# Clone repository
git clone https://github.com/TakasiVenkataSandeep-08/timesheet-generator.git
cd timesheet-generator

# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Link locally for testing
npm link
```

### Plugin Development

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for:

- Creating custom VCS adapters
- Creating custom output formatters
- Adding new time estimation algorithms
- Testing guidelines

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Built with ❤️ for developers who hate manual timesheet entry
- Inspired by the need for accurate, automated time tracking
- Powered by Git commit history

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/TakasiVenkataSandeep-08/timesheet-generator/issues)
- **Discussions:** [GitHub Discussions](https://github.com/TakasiVenkataSandeep-08/timesheet-generator/discussions)
- **Email:** venkatasandeeptakasi@gmail.com

---

**Made with ❤️ by developers, for developers**
