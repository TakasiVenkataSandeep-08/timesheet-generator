# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2025-01-16

### Added

#### Core Features

- **Intelligent Time Estimation** - Multi-factor algorithm estimating actual work time from commit patterns

  - Gap analysis (time between commits)
  - Complexity scoring (lines of code, file types, file count)
  - Commit message hints (refactor, quick fix, etc.)
  - Session grouping based on time gaps

- **Zero-Config Operation** - Works out-of-the-box with smart defaults
  - Auto-detects author from git config
  - Auto-detects timezone
  - Auto-detects work hours from commit patterns
  - Smart defaults for all settings

#### VCS Adapters

- **Local Git Adapter** - Analyze commits from local repositories
- **GitHub Adapter** - Fetch commits via GitHub API
- **GitLab Adapter** - Fetch commits via GitLab API
- **Multi-Repository Support** - Aggregate timesheets from multiple repos in parallel

#### Output Formatters

- **JSON Formatter** - Structured JSON output with full timesheet data
- **CSV Formatter** - Jira-compatible CSV format
- **Markdown Formatter** - Human-readable markdown reports
- **Simple Formatter** - Plain text, no-nonsense output (numbered list)
- **Jira Formatter** - CSV format optimized for Jira time tracking import
- **PDF Formatter** - Professional PDF reports with charts
- **HTML Formatter** - Interactive HTML dashboard with filtering and charts

#### Time Tracking Integrations

- **Linear Integration** - Direct API integration for time entry creation
- **Toggl Integration** - Direct API integration for time tracking
- **Clockify Integration** - Direct API integration for time tracking
- **Jira Integration** - CSV export and direct Cloud API integration

#### CLI Commands

- `timesheet generate` - Generate timesheets with extensive options
- `timesheet config` - Interactive configuration wizard
- `timesheet validate` - Validate repository and configuration
- `timesheet mcp-server` - Start MCP server for AI tool integration

#### CLI Features

- Date range presets (last-week, this-week, last-month, this-month)
- Branch filtering (single branch, patterns, all branches)
- Author filtering
- Interactive mode with prompts
- Multi-repository support
- GitHub/GitLab repository support

#### Intelligence Features

- **Session Grouping** - Groups commits into logical work sessions
- **Ticket Extraction** - Automatically extracts Jira/Linear/GitHub issue IDs
- **Project Categorization** - Categorizes work by branch/file/keyword patterns
- **Holiday Detection** - Excludes holidays from work sessions (configurable by country/state)
- **Work Pattern Learning** - Auto-detects work hours from historical patterns

#### MCP Server

- Model Context Protocol server for AI tool integration
- Three tools: `generateTimesheet`, `getWorkSessions`, `estimateTime`
- Integration with Claude Desktop and Cursor

#### Developer Experience

- Comprehensive documentation (11 docs files)
- Example configurations (`.timesheetrc.example`)
- Debug mode with structured logging
- Progress indicators for long operations
- Error handling with retry logic
- API response caching

### Technical Details

- **Node.js Requirement:** 18+ (for native fetch API)
- **Package Size:** ~54 KB (tarball), ~215 KB (unpacked)
- **Test Coverage:** Unit, integration, and performance tests
- **License:** MIT

### Documentation

- Complete CLI reference
- API documentation
- Configuration guide
- Integration guides (Jira, Linear, Toggl, Clockify, GitHub, GitLab)
- MCP integration guide
- Troubleshooting guide
- FAQ
- Contributing guidelines
- Comprehensive examples

---

[0.0.1]: https://github.com/TakasiVenkataSandeep-08/timesheet-generator/releases/tag/v0.0.1
