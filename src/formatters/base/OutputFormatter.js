/**
 * Base Output Formatter Interface
 * All output formatters must extend this class
 */
class OutputFormatter {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Format timesheet data
   * @param {object} timesheet - Timesheet data
   * @returns {Promise<string|Buffer>} Formatted output
   */
  async format(timesheet) {
    throw new Error("format() must be implemented by subclass");
  }

  /**
   * Validate formatter options
   * @param {object} options - Formatter options
   * @returns {boolean}
   */
  validate(options) {
    return true;
  }

  /**
   * Get formatter name
   */
  get name() {
    return this.constructor.name.replace("Formatter", "").toLowerCase();
  }
}

module.exports = OutputFormatter;
