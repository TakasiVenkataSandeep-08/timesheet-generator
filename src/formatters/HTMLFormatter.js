const OutputFormatter = require('./base/OutputFormatter');
const fs = require('fs');
const path = require('path');

/**
 * HTML Formatter - generates interactive HTML dashboard
 */
class HTMLFormatter extends OutputFormatter {
  async format(timesheet) {
    // Read template
    const templatePath = path.join(__dirname, 'templates', 'dashboard.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    // Inject timesheet data
    const dataJson = JSON.stringify(timesheet, null, 2);
    template = template.replace('{{TIMESHEET_DATA}}', dataJson);

    return template;
  }
}

module.exports = HTMLFormatter;

