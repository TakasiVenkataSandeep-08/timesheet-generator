const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const { generateTimesheet, getWorkSessions, estimateTime } = require("./tools");

/**
 * MCP Server for Timesheet Generator
 */
class TimesheetMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "timesheet-generator",
        version: "0.0.1",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "generateTimesheet",
          description:
            "Generate timesheet from git commits with intelligent time estimation",
          inputSchema: {
            type: "object",
            properties: {
              dateRange: {
                type: "string",
                description:
                  "Date range (last-week, this-week, last-month, this-month)",
                enum: ["last-week", "this-week", "last-month", "this-month"],
              },
              since: {
                type: "string",
                description: "Start date (YYYY-MM-DD)",
              },
              until: {
                type: "string",
                description: "End date (YYYY-MM-DD)",
              },
              branch: {
                type: "string",
                description: "Branch name or pattern",
              },
              allBranches: {
                type: "boolean",
                description: "Include all branches",
                default: false,
              },
              author: {
                type: "string",
                description: "Filter by author name or email",
              },
              repo: {
                type: "string",
                description: "Repository path (for local git)",
              },
              github: {
                type: "string",
                description: "GitHub repository (owner/repo)",
              },
              gitlab: {
                type: "string",
                description: "GitLab project ID or path",
              },
              format: {
                type: "string",
                description: "Output format",
                enum: ["json", "csv", "markdown", "jira", "simple"],
                default: "json",
              },
            },
          },
        },
        {
          name: "getWorkSessions",
          description:
            "Get grouped work sessions with time estimates from git commits",
          inputSchema: {
            type: "object",
            properties: {
              dateRange: {
                type: "string",
                description:
                  "Date range (last-week, this-week, last-month, this-month)",
                enum: ["last-week", "this-week", "last-month", "this-month"],
              },
              since: {
                type: "string",
                description: "Start date (YYYY-MM-DD)",
              },
              until: {
                type: "string",
                description: "End date (YYYY-MM-DD)",
              },
              branch: {
                type: "string",
                description: "Branch name or pattern",
              },
              author: {
                type: "string",
                description: "Filter by author name or email",
              },
              repo: {
                type: "string",
                description: "Repository path (for local git)",
              },
            },
          },
        },
        {
          name: "estimateTime",
          description: "Estimate work time for a set of commits",
          inputSchema: {
            type: "object",
            properties: {
              commits: {
                type: "array",
                description: "Array of commit objects",
                items: {
                  type: "object",
                  properties: {
                    hash: { type: "string" },
                    date: { type: "string" },
                    message: { type: "string" },
                    authorName: { type: "string" },
                    authorEmail: { type: "string" },
                    fileStats: { type: "array" },
                  },
                  required: ["hash", "date", "message"],
                },
              },
            },
            required: ["commits"],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result;

        switch (name) {
          case "generateTimesheet":
            result = await generateTimesheet(args || {});
            break;

          case "getWorkSessions":
            result = await getWorkSessions(args || {});
            break;

          case "estimateTime":
            result = await estimateTime(args || {});
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error: error.message,
                  stack: process.env.DEBUG ? error.stack : undefined,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

module.exports = TimesheetMCPServer;
