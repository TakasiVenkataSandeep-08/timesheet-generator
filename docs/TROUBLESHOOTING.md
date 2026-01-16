# Troubleshooting Guide

## Common Issues

### No Commits Found

**Problem:** Tool reports "No commits found"

**Solutions:**
1. Check date range: `timesheet generate --date-range last-week --since 2024-01-01`
2. Verify repository path: `timesheet generate --repo /path/to/repo`
3. Check branch filter: `timesheet generate --all-branches`
4. Verify author filter: `timesheet generate --author "Your Name"`
5. Run with DEBUG: `DEBUG=1 timesheet generate`

### Invalid Date Errors

**Problem:** "Invalid time value" or "Invalid Date" errors

**Solutions:**
1. Check git log output: `git log --since="2024-01-01" --until="2024-01-31"`
2. Verify commit dates are valid
3. Check timezone settings
4. Run with DEBUG for details

### API Authentication Errors

**Problem:** GitHub/GitLab API authentication fails

**Solutions:**
1. Verify token is set: `echo $GITHUB_TOKEN`
2. Check token permissions (repo access for GitHub)
3. Verify token hasn't expired
4. For GitHub, use format: `ghp_...`
5. For GitLab, use format: `glpat-...`

### Rate Limiting

**Problem:** API rate limit exceeded

**Solutions:**
1. Wait a few minutes before retrying
2. Use caching (enabled by default)
3. Reduce date range
4. Use local git adapter instead

### Zero Hours/Sessions

**Problem:** Timesheet shows 0 hours despite commits

**Solutions:**
1. Check work hours configuration
2. Verify `excludeNonWorkHours` is false if commits are outside 9-5
3. Check weekend exclusion: `excludeWeekends: false`
4. Verify gap threshold isn't too small
5. Check commit dates are valid

### PDF Generation Fails

**Problem:** PDF formatter errors

**Solutions:**
1. Ensure output file is specified: `--output report.pdf`
2. Check write permissions
3. Verify pdfkit is installed: `npm list pdfkit`

### MCP Server Not Starting

**Problem:** MCP server fails to start

**Solutions:**
1. Verify Node.js 18+ is installed: `node --version`
2. Check MCP SDK is installed: `npm list @modelcontextprotocol/sdk`
3. Verify command: `timesheet mcp-server`
4. Check stdio communication

### Simple Mode Shows [object Object]

**Problem:** Simple formatter shows object instead of messages

**Solutions:**
1. Ensure commits have message property
2. Check commit normalization
3. Run with DEBUG: `DEBUG=1 timesheet generate --simple`

## Debug Mode

Enable debug logging:

```bash
DEBUG=1 timesheet generate --date-range last-week
```

This shows:
- Raw commit parsing
- Normalization steps
- Session grouping details
- Time estimation calculations

## Performance Issues

### Slow Processing

**Solutions:**
1. Reduce date range
2. Filter by branch
3. Exclude file stats: `--no-include-stats`
4. Use caching (enabled by default)
5. Process fewer repos at once

### Memory Issues

**Solutions:**
1. Process repos sequentially instead of parallel
2. Reduce date range
3. Filter commits before processing
4. Disable file stats

## Getting Help

1. Check error messages carefully
2. Run with DEBUG=1 for detailed logs
3. Review documentation
4. Check GitHub issues
5. Verify configuration file format

