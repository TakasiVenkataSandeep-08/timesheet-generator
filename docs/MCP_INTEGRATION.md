# MCP Integration Guide

The Timesheet Generator includes a Model Context Protocol (MCP) server for seamless integration with AI tools like Claude Desktop and Cursor.

## Overview

The MCP server exposes three main tools:
- `generateTimesheet` - Generate complete timesheet from git commits
- `getWorkSessions` - Get grouped work sessions with time estimates
- `estimateTime` - Estimate work time for a set of commits

## Installation

The MCP server is included with the timesheet-generator package. No additional installation is required.

## Starting the MCP Server

### Command Line

```bash
timesheet mcp-server
```

The server runs on stdio and communicates via JSON-RPC.

## Tool Reference

### generateTimesheet

Generate a complete timesheet from git commits with intelligent time estimation.

**Parameters:**
- `dateRange` (string, optional): Date range preset (`last-week`, `this-week`, `last-month`, `this-month`)
- `since` (string, optional): Start date in YYYY-MM-DD format
- `until` (string, optional): End date in YYYY-MM-DD format
- `branch` (string, optional): Branch name or pattern to filter commits
- `allBranches` (boolean, optional): Include all branches (default: false)
- `author` (string, optional): Filter by author name or email
- `repo` (string, optional): Repository path for local git (default: current directory)
- `github` (string, optional): GitHub repository in `owner/repo` format
- `gitlab` (string, optional): GitLab project ID or path
- `format` (string, optional): Output format (`json`, `csv`, `markdown`, `jira`, `simple`)

**Returns:**
```json
{
  "success": true,
  "timesheet": {
    "period": { "start": "2024-01-01", "end": "2024-01-07" },
    "totalHours": 32.5,
    "totalSessions": 8,
    "totalCommits": 45,
    "sessions": [...],
    "byDate": {...},
    "byProject": {...}
  },
  "summary": {
    "totalHours": 32.5,
    "totalSessions": 8,
    "totalCommits": 45
  }
}
```

**Example:**
```json
{
  "name": "generateTimesheet",
  "arguments": {
    "dateRange": "last-week",
    "branch": "main",
    "format": "json"
  }
}
```

### getWorkSessions

Get grouped work sessions with time estimates without full timesheet generation.

**Parameters:**
- `dateRange` (string, optional): Date range preset
- `since` (string, optional): Start date
- `until` (string, optional): End date
- `branch` (string, optional): Branch filter
- `author` (string, optional): Author filter
- `repo` (string, optional): Repository path

**Returns:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": 1,
      "date": "2024-01-01",
      "startTime": "2024-01-01T09:15:00Z",
      "endTime": "2024-01-01T12:30:00Z",
      "duration": 3.25,
      "commits": 5,
      "confidence": 0.85,
      "summary": "Implemented user authentication"
    }
  ],
  "summary": {
    "totalHours": 32.5,
    "totalSessions": 8,
    "totalCommits": 45
  }
}
```

### estimateTime

Estimate work time for a provided set of commits.

**Parameters:**
- `commits` (array, required): Array of commit objects

**Commit Object Format:**
```json
{
  "hash": "abc123",
  "date": "2024-01-01T09:00:00Z",
  "message": "feat: Add feature",
  "authorName": "John Doe",
  "authorEmail": "john@example.com",
  "fileStats": [
    {
      "filePath": "src/file.js",
      "additions": 100,
      "deletions": 10
    }
  ]
}
```

**Returns:**
```json
{
  "success": true,
  "estimate": {
    "totalHours": 8.5,
    "totalSessions": 3,
    "sessions": [...]
  }
}
```

## Claude Desktop Integration

### Configuration

Add to your Claude Desktop configuration file (usually `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "timesheet-generator": {
      "command": "npx",
      "args": ["timesheet-generator", "mcp-server"],
      "env": {
        "GITHUB_TOKEN": "your-github-token-here",
        "GITLAB_TOKEN": "your-gitlab-token-here"
      }
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "timesheet-generator": {
      "command": "timesheet",
      "args": ["mcp-server"]
    }
  }
}
```

### Usage in Claude

Once configured, you can ask Claude:

- "Generate a timesheet for last week from my main repository"
- "What were my work sessions last month?"
- "Estimate the time for these commits: [paste commits]"

## Cursor Integration

### Configuration

Add to your Cursor settings (`.cursor/mcp.json` or Cursor settings):

```json
{
  "mcpServers": {
    "timesheet-generator": {
      "command": "npx",
      "args": ["timesheet-generator", "mcp-server"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

### Usage in Cursor

The MCP tools are available in Cursor's AI chat interface. You can:

- Ask Cursor to generate timesheets
- Get work session summaries
- Estimate time for code changes

## Example Workflows

### Weekly Timesheet Generation

```json
{
  "name": "generateTimesheet",
  "arguments": {
    "dateRange": "last-week",
    "format": "json"
  }
}
```

### Project-Specific Analysis

```json
{
  "name": "getWorkSessions",
  "arguments": {
    "dateRange": "this-month",
    "branch": "feature/project-name"
  }
}
```

### GitHub Repository Analysis

```json
{
  "name": "generateTimesheet",
  "arguments": {
    "github": "owner/repo",
    "dateRange": "last-week",
    "format": "markdown"
  }
}
```

## Environment Variables

The MCP server respects the same environment variables as the CLI:

- `GITHUB_TOKEN` - GitHub API token
- `GITLAB_TOKEN` - GitLab API token
- `DEBUG` - Enable debug logging

## Error Handling

All tools return a consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "stack": "Stack trace (if DEBUG enabled)"
}
```

## Troubleshooting

### Server Not Starting

- Ensure Node.js 18+ is installed
- Check that timesheet-generator is installed: `npm list -g timesheet-generator`
- Try running directly: `timesheet mcp-server`

### Authentication Errors

- Set `GITHUB_TOKEN` or `GITLAB_TOKEN` environment variables
- Verify tokens have necessary permissions

### No Commits Found

- Check date range is correct
- Verify repository path or GitHub/GitLab identifier
- Ensure you have access to the repository

## Advanced Usage

### Custom Configuration

The MCP server uses the same `.timesheetrc` configuration file as the CLI. Place it in your project root or home directory.

### Programmatic Access

You can also use the MCP server programmatically:

```javascript
const { TimesheetMCPServer } = require('timesheet-generator/mcp');
const server = new TimesheetMCPServer();
await server.start();
```

## Support

For issues or questions:
- Check the main README.md
- Review TROUBLESHOOTING.md
- Open an issue on GitHub

