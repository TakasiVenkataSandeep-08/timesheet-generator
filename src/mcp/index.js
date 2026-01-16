#!/usr/bin/env node

const TimesheetMCPServer = require('./server');

/**
 * MCP Server Entry Point
 */
async function main() {
  const server = new TimesheetMCPServer();
  await server.start();
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('MCP Server error:', error);
    process.exit(1);
  });
}

module.exports = { TimesheetMCPServer };

