const JSONFormatter = require("./JSONFormatter");
const CSVFormatter = require("./CSVFormatter");
const MarkdownFormatter = require("./MarkdownFormatter");
const JiraFormatter = require("./JiraFormatter");
const SimpleFormatter = require("./SimpleFormatter");
const PDFFormatter = require("./PDFFormatter");
const HTMLFormatter = require("./HTMLFormatter");

/**
 * Formatter registry
 */
const formatters = {
  json: JSONFormatter,
  csv: CSVFormatter,
  markdown: MarkdownFormatter,
  md: MarkdownFormatter,
  jira: JiraFormatter,
  simple: SimpleFormatter,
  pdf: PDFFormatter,
  html: HTMLFormatter,
};

/**
 * Get formatter by name
 */
function getFormatter(name) {
  const FormatterClass = formatters[name.toLowerCase()];
  if (!FormatterClass) {
    throw new Error(
      `Unknown formatter: ${name}. Available: ${Object.keys(formatters).join(
        ", "
      )}`
    );
  }
  return new FormatterClass();
}

/**
 * List available formatters
 */
function listFormatters() {
  return Object.keys(formatters);
}

module.exports = {
  getFormatter,
  listFormatters,
  formatters,
};
