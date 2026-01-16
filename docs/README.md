# Documentation Index

Complete documentation for Timesheet Generator.

## 📖 Getting Started

1. **[README](../README.md)** - Start here! Overview, quick start, and features
2. **[CLI Reference](CLI_REFERENCE.md)** - Complete command-line reference
3. **[Examples](EXAMPLES.md)** - Practical examples for common use cases
4. **[Configuration Guide](CONFIGURATION.md)** - Configuration options and `.timesheetrc`

## 🎯 Core Documentation

### [CLI Reference](CLI_REFERENCE.md)
Complete reference for all CLI commands:
- `timesheet generate` - Generate timesheets
- `timesheet config` - Configuration wizard
- `timesheet validate` - Validate setup
- `timesheet mcp-server` - MCP server for AI tools
- All options and flags explained
- Common workflows and tips

### [API Reference](API.md)
Programmatic API usage:
- Core classes (`TimesheetGenerator`, `TimeEstimator`, `SessionGrouper`)
- VCS Adapters (Local Git, GitHub, GitLab)
- Output Formatters
- Utilities (date, commit, error handling)
- MCP Server API

### [Formatters Guide](FORMATTERS.md)
Complete guide to all output formats:
- JSON (default)
- CSV (Jira-compatible)
- Markdown
- Simple (plain text)
- Jira CSV
- PDF
- HTML Dashboard
- Linear API
- Toggl API
- Clockify API
- Programmatic usage
- Custom formatters

### [Configuration Guide](CONFIGURATION.md)
Configuration options:
- `.timesheetrc` file structure
- Default options
- Time estimation settings
- Output preferences
- Project mappings
- Environment variables
- CLI overrides

### [Examples](EXAMPLES.md)
Practical examples:
- Basic usage
- Output formats
- Branch filtering
- Author filtering
- Repository options
- Time tracking integrations
- Advanced usage
- Workflows
- CI/CD integration
- Script integration
- Data processing

## 🔌 Integrations

### [Integrations Guide](INTEGRATIONS.md)
Integration with external services:
- Linear
- Toggl
- Clockify
- Jira (CSV and API)
- GitHub
- GitLab
- Project mapping

### [MCP Integration](MCP_INTEGRATION.md)
AI tool integration:
- Claude Desktop setup
- Cursor setup
- Available tools
- Usage examples
- Troubleshooting

## 🛠️ Troubleshooting & Support

### [Troubleshooting](TROUBLESHOOTING.md)
Common issues and solutions:
- No commits found
- Invalid date errors
- API authentication errors
- Rate limiting
- Zero hours/sessions
- PDF generation fails
- MCP server issues
- Performance issues
- Debug mode

### [FAQ](FAQ.md)
Frequently asked questions:
- General questions
- Usage questions
- Configuration questions
- Technical questions
- Integration questions
- Advanced questions

### [Contributing](CONTRIBUTING.md)
Contributing guidelines:
- Development setup
- Code style
- Testing
- Pull request process

## 📚 Documentation Structure

```
docs/
├── README.md              # This file - documentation index
├── CLI_REFERENCE.md       # Complete CLI command reference
├── API.md                 # Programmatic API reference
├── CONFIGURATION.md       # Configuration guide
├── FORMATTERS.md          # All output formats explained
├── EXAMPLES.md            # Practical examples
├── INTEGRATIONS.md        # External service integrations
├── MCP_INTEGRATION.md     # AI tool integration (MCP)
├── TROUBLESHOOTING.md     # Common issues and solutions
├── FAQ.md                 # Frequently asked questions
└── CONTRIBUTING.md        # Contributing guidelines
```

## 🚀 Quick Links

### For Users
- **New to the tool?** → [README](../README.md) → [Quick Start](../README.md#-quick-start)
- **Need command help?** → [CLI Reference](CLI_REFERENCE.md)
- **Looking for examples?** → [Examples](EXAMPLES.md)
- **Configuring?** → [Configuration Guide](CONFIGURATION.md)
- **Having issues?** → [Troubleshooting](TROUBLESHOOTING.md) → [FAQ](FAQ.md)

### For Developers
- **Using programmatically?** → [API Reference](API.md)
- **Creating formatters?** → [Formatters Guide](FORMATTERS.md)
- **Integrating services?** → [Integrations Guide](INTEGRATIONS.md)
- **Contributing?** → [Contributing](CONTRIBUTING.md)

### For AI Tools
- **Claude Desktop?** → [MCP Integration](MCP_INTEGRATION.md#claude-desktop)
- **Cursor?** → [MCP Integration](MCP_INTEGRATION.md#cursor)
- **Other MCP clients?** → [MCP Integration](MCP_INTEGRATION.md)

## 📋 Documentation Coverage

### ✅ Covered Topics

- [x] Installation and setup
- [x] All CLI commands and options
- [x] All output formats
- [x] Configuration options
- [x] API reference
- [x] Integration guides
- [x] MCP server setup
- [x] Examples and workflows
- [x] Troubleshooting
- [x] FAQ
- [x] Contributing guidelines

### 📝 Feature Documentation

- [x] Time estimation algorithms
- [x] Session grouping
- [x] Commit analysis
- [x] Ticket extraction
- [x] Project categorization
- [x] Multi-repository support
- [x] Holiday detection
- [x] Work pattern learning
- [x] Interactive CLI
- [x] Debug mode

## 🔍 Finding Information

### By Task

**I want to...**
- **Generate a timesheet** → [CLI Reference](CLI_REFERENCE.md#timesheet-generate)
- **Configure the tool** → [Configuration Guide](CONFIGURATION.md)
- **Export to Jira** → [Formatters Guide](FORMATTERS.md#jira-formatter)
- **Use with GitHub** → [Integrations Guide](INTEGRATIONS.md#github-integration)
- **Integrate with AI tools** → [MCP Integration](MCP_INTEGRATION.md)
- **Use programmatically** → [API Reference](API.md)
- **Troubleshoot issues** → [Troubleshooting](TROUBLESHOOTING.md)
- **See examples** → [Examples](EXAMPLES.md)

### By Format

**I need...**
- **JSON output** → [Formatters Guide](FORMATTERS.md#json-formatter-default)
- **CSV output** → [Formatters Guide](FORMATTERS.md#csv-formatter)
- **PDF report** → [Formatters Guide](FORMATTERS.md#pdf-formatter)
- **HTML dashboard** → [Formatters Guide](FORMATTERS.md#html-formatter)
- **Simple text** → [Formatters Guide](FORMATTERS.md#simple-formatter)

### By Integration

**I want to integrate with...**
- **Linear** → [Integrations Guide](INTEGRATIONS.md#linear-integration)
- **Toggl** → [Integrations Guide](INTEGRATIONS.md#toggl-integration)
- **Clockify** → [Integrations Guide](INTEGRATIONS.md#clockify-integration)
- **Jira** → [Integrations Guide](INTEGRATIONS.md#jira-integration)
- **GitHub** → [Integrations Guide](INTEGRATIONS.md#github-integration)
- **GitLab** → [Integrations Guide](INTEGRATIONS.md#gitlab-integration)
- **Claude/Cursor** → [MCP Integration](MCP_INTEGRATION.md)

## 💡 Tips

- Use `--help` flag for quick command reference: `timesheet generate --help`
- Enable debug mode for detailed logs: `DEBUG=1 timesheet generate`
- Check [Examples](EXAMPLES.md) for common workflows
- See [Troubleshooting](TROUBLESHOOTING.md) for common issues
- Review [FAQ](FAQ.md) for quick answers

## 📞 Getting Help

1. Check [Troubleshooting](TROUBLESHOOTING.md) for common issues
2. Review [FAQ](FAQ.md) for frequently asked questions
3. Enable debug mode: `DEBUG=1 timesheet generate`
4. Check GitHub issues
5. Review configuration: `timesheet validate`

---

**Last Updated:** Documentation covers all features as of v1.0.0

