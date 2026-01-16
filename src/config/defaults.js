const { execSync } = require("child_process");

/**
 * Get smart defaults by auto-detecting from environment
 */
function getDefaults() {
  // Auto-detect author from git config
  let author = null;
  try {
    const name = execSync("git config user.name", { encoding: "utf8" }).trim();
    const email = execSync("git config user.email", {
      encoding: "utf8",
    }).trim();
    author = email || name || null;
  } catch (e) {
    // Git not available or not configured
  }

  // Auto-detect timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    defaults: {
      author: author || "auto",
      dateRange: "last-week",
      branches: "all",
      excludeMerges: true,
      workHours: {
        start: "09:00",
        end: "17:00",
        timezone: timezone,
      },
      excludeWeekends: true,
      excludeNonWorkHours: false, // Don't filter by work hours by default
      excludeHolidays: false, // Don't exclude holidays by default
      holidayCountry: "US", // Default country for holiday detection
      holidayState: null, // Optional state for US holidays
      customHolidays: [], // Custom holidays array
    },
    timeEstimation: {
      method: "intelligent",
      gapThreshold: 30, // minutes
      minSessionDuration: 15, // minutes
      maxSessionDuration: 480, // minutes (8 hours)
      baseTimePerCommit: 10, // minutes
    },
    output: {
      format: "json",
      includeStats: true,
      includeFileChanges: false, // Default to false
      groupBy: "day",
    },
  };
}

module.exports = { getDefaults };
