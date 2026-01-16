# Output Formatters

Complete guide to all output formats and formatters.

## Available Formatters

### JSON Formatter (default)

**Format:** `json`

**Description:** Structured JSON output with full timesheet data.

**Usage:**

```bash
timesheet generate --format json
timesheet generate  # JSON is default
```

**Output Structure:**

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
    "repoType": "local",
    "repositories": ["my-project"],
    "repoTypes": { "my-project": "local" }
  },
  "sessions": [
    {
      "date": "2024-01-01",
      "startTime": "2024-01-01T09:15:00Z",
      "endTime": "2024-01-01T12:30:00Z",
      "duration": 3.25,
      "commits": [
        {
          "hash": "abc123",
          "message": "Implemented user authentication",
          "date": "2024-01-01T09:15:00Z"
        }
      ],
      "summary": "Implemented user authentication",
      "tickets": ["PROJ-123"],
      "projects": ["frontend"]
    }
  ],
  "byDate": {
    "2024-01-01": 8.5,
    "2024-01-02": 7.0
  },
  "byProject": {
    "frontend": 20.0,
    "backend": 12.5
  },
  "byTicket": {
    "PROJ-123": 8.0,
    "PROJ-124": 5.5
  },
  "hoursByProject": {
    "frontend": {
      "2024-01-01": 4.0,
      "2024-01-02": 3.5
    }
  }
}
```

**Use Cases:**

- Programmatic processing
- Data analysis
- Integration with other tools
- API responses

---

### CSV Formatter

**Format:** `csv`

**Description:** Comma-separated values format, compatible with Jira and Excel.

**Usage:**

```bash
timesheet generate --format csv --output timesheet.csv
```

**Output Structure:**

```csv
# Repository: my-project
# Repository Type: local

Date,Start Time,End Time,Duration (hours),Description,Issue Key,Project,Repository
2024-01-01,09:15,12:30,3.25,"Implemented user authentication","PROJ-123","frontend","my-project"
2024-01-01,14:00,17:30,3.5,"Refactored API endpoints","PROJ-124","backend","my-project"
```

**Columns:**

- `Date` - Session date (YYYY-MM-DD)
- `Start Time` - Session start time (HH:mm)
- `End Time` - Session end time (HH:mm)
- `Duration (hours)` - Session duration in hours
- `Description` - Session summary (commit messages)
- `Issue Key` - First ticket ID found
- `Project` - First project category
- `Repository` - Repository name

**Use Cases:**

- Jira time tracking import
- Excel/spreadsheet analysis
- Accounting systems
- Time tracking tools

---

### Markdown Formatter

**Format:** `markdown`

**Description:** Human-readable Markdown report with sections and formatting.

**Usage:**

```bash
timesheet generate --format markdown --output report.md
```

**Output Structure:**

```markdown
# Timesheet: 2024-01-01 to 2024-01-07

**Repository:** my-project
**Repository Type:** local

**Total Hours:** 32.5h
**Total Sessions:** 12
**Total Commits:** 45

## Summary by Date

| Date       | Hours |
| ---------- | ----- |
| 2024-01-01 | 8.5h  |
| 2024-01-02 | 7.0h  |

## Sessions

### 2024-01-01

**09:15 - 12:30** (3.25h)

- Implemented user authentication
- Fixed login bug

**Tickets:** PROJ-123
**Projects:** frontend
```

**Use Cases:**

- Documentation
- Reports
- GitHub/GitLab README
- Email reports
- Team communication

---

### Simple Formatter

**Format:** `simple`

**Description:** Plain text, no-nonsense output.

**Usage:**

```bash
timesheet generate --format simple
timesheet generate --simple  # Alias
```

**Output Structure:**

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

3. 2024-01-02 09:00 - 12:00 (3.0h)
   - Fixed critical bug
   - Added tests
```

**Features:**

- Numbered list of sessions
- Full commit messages (no truncation)
- Minimal formatting
- Easy to read in terminal

**Use Cases:**

- Quick terminal viewing
- Simple reports
- Copy-paste friendly
- No-nonsense users

---

### Jira Formatter

**Format:** `jira`

**Description:** Jira-compatible CSV format for time tracking import.

**Usage:**

```bash
timesheet generate --format jira --output jira-import.csv
```

**Output Structure:**

```csv
Date,Start Time,End Time,Duration (hours),Description,Issue Key,Project
2024-01-01,09:15,12:30,3.25,"Implemented user authentication","PROJ-123","frontend"
```

**Jira Import Steps:**

1. Generate CSV: `timesheet generate --format jira --output jira.csv`
2. Go to Jira → Project → Time Tracking
3. Import CSV file
4. Map columns if needed

**Use Cases:**

- Jira time tracking
- Project management
- Client billing
- Sprint reporting

---

### PDF Formatter

**Format:** `pdf`

**Description:** Professional PDF report with charts and formatting.

**Usage:**

```bash
timesheet generate --format pdf --output timesheet.pdf
```

**Output Features:**

- Title page with summary
- Session details
- Charts and graphs
- Professional formatting
- Print-ready

**Requirements:**

- `pdfkit` package (included in dependencies)
- Write permissions for output file

**Use Cases:**

- Official reports
- Client deliverables
- Archival
- Printing
- Professional documentation

---

### HTML Formatter

**Format:** `html`

**Description:** Interactive HTML dashboard with charts and filters.

**Usage:**

```bash
timesheet generate --format html --output dashboard.html
```

**Output Features:**

- Interactive dashboard
- Charts (Chart.js)
- Date filtering
- Project filtering
- Responsive design
- Export capabilities

**Opening:**

```bash
# Generate HTML
timesheet generate --format html --output dashboard.html

# Open in browser
open dashboard.html  # macOS
xdg-open dashboard.html  # Linux
start dashboard.html  # Windows
```

**Use Cases:**

- Visual analysis
- Team presentations
- Interactive exploration
- Web sharing
- Dashboard embedding

---

### Linear Formatter

**Format:** `linear`

**Description:** Direct API integration with Linear for time tracking.

**Usage:**

```bash
export LINEAR_API_KEY=your-key
timesheet generate --format linear --date-range last-week
```

**Configuration:**

```bash
export LINEAR_API_KEY=lin_api_xxxxxxxxxxxxx
```

**Features:**

- Direct API integration
- Automatic time entry creation
- Issue linking
- Dry-run mode for preview

**Dry Run:**

```bash
# Preview without creating entries
timesheet generate --format linear --date-range last-week --dry-run
```

**Use Cases:**

- Linear time tracking
- Issue management
- Team synchronization
- Automated logging

---

### Toggl Formatter

**Format:** `toggl`

**Description:** Direct API integration with Toggl for time tracking.

**Usage:**

```bash
export TOGGL_API_TOKEN=your-token
export TOGGL_WORKSPACE_ID=workspace-id  # Optional
timesheet generate --format toggl --date-range last-week
```

**Configuration:**

```bash
export TOGGL_API_TOKEN=xxxxxxxxxxxxx
export TOGGL_WORKSPACE_ID=12345678  # Optional
```

**Features:**

- Direct API integration
- Automatic time entry creation
- Project tagging
- Workspace support

**Use Cases:**

- Toggl time tracking
- Personal time management
- Client billing
- Productivity analysis

---

### Clockify Formatter

**Format:** `clockify`

**Description:** Direct API integration with Clockify for time tracking.

**Usage:**

```bash
export CLOCKIFY_API_KEY=your-key
export CLOCKIFY_WORKSPACE_ID=workspace-id  # Optional
timesheet generate --format clockify --date-range last-week
```

**Configuration:**

```bash
export CLOCKIFY_API_KEY=xxxxxxxxxxxxx
export CLOCKIFY_WORKSPACE_ID=12345678  # Optional
```

**Features:**

- Direct API integration
- Automatic time entry creation
- Project assignment
- Workspace support

**Use Cases:**

- Clockify time tracking
- Team time management
- Client billing
- Resource planning

---

## Formatter Comparison

| Formatter | Output Type     | Best For             | Interactive | Charts |
| --------- | --------------- | -------------------- | ----------- | ------ |
| JSON      | Structured data | APIs, automation     | ❌          | ❌     |
| CSV       | Tabular data    | Excel, Jira          | ❌          | ❌     |
| Markdown  | Documentation   | Reports, docs        | ❌          | ❌     |
| Simple    | Plain text      | Terminal, quick view | ❌          | ❌     |
| Jira      | CSV import      | Jira integration     | ❌          | ❌     |
| PDF       | Document        | Official reports     | ❌          | ✅     |
| HTML      | Dashboard       | Visual analysis      | ✅          | ✅     |
| Linear    | API             | Linear integration   | ❌          | ❌     |
| Toggl     | API             | Toggl integration    | ❌          | ❌     |
| Clockify  | API             | Clockify integration | ❌          | ❌     |

---

## Programmatic Usage

### Get Formatter

```javascript
const { getFormatter } = require("timesheet-generator/formatters");

// Basic formatter
const formatter = getFormatter("json");
const output = await formatter.format(timesheet);

// Formatter with options
const linearFormatter = getFormatter("linear", {
  apiKey: "your-key",
  dryRun: false,
});
const result = await linearFormatter.format(timesheet);
```

### Custom Formatter

```javascript
const {
  OutputFormatter,
} = require("timesheet-generator/formatters/base/OutputFormatter");

class CustomFormatter extends OutputFormatter {
  async format(timesheet) {
    // Your formatting logic
    return formattedOutput;
  }
}

// Register formatter
const { registerFormatter } = require("timesheet-generator/formatters");
registerFormatter("custom", CustomFormatter);
```

---

## Tips

### Combine Formats

```bash
# Generate multiple formats
timesheet generate --format json --output data.json
timesheet generate --format markdown --output report.md
timesheet generate --format pdf --output report.pdf
```

### Format Conversion

```bash
# JSON to CSV (using jq)
timesheet generate --format json | jq -r '.sessions[] | [.date, .duration] | @csv'
```

### Format Validation

```bash
# Validate JSON output
timesheet generate --format json | jq .

# Validate CSV
timesheet generate --format csv | csvlint
```

---

## See Also

- [CLI Reference](CLI_REFERENCE.md) - Command-line usage
- [API Reference](API.md) - Programmatic API
- [Integrations](INTEGRATIONS.md) - Integration guides
