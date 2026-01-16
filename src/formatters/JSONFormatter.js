const OutputFormatter = require("./base/OutputFormatter");

/**
 * JSON Formatter - outputs timesheet as JSON
 */
class JSONFormatter extends OutputFormatter {
  async format(timesheet) {
    return JSON.stringify(timesheet, null, 2);
  }
}

module.exports = JSONFormatter;

