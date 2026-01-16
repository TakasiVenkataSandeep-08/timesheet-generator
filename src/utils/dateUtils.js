// Using native Date methods for compatibility, date-fns can be added later if needed
// const { parse, format, startOfWeek, endOfWeek, subDays, subWeeks, startOfMonth, endOfMonth } = require("date-fns");

/**
 * Parse date range string to start and end dates
 * @param {string} range - Date range string (e.g., "last-week", "this-month")
 * @returns {{start: Date, end: Date}}
 */
function parseDateRange(range) {
  const now = new Date();

  switch (range) {
    case "last-week": {
      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 7);
      const start = new Date(lastWeek);
      start.setDate(lastWeek.getDate() - (lastWeek.getDay() || 7) + 1); // Monday
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "this-week": {
      const start = new Date(now);
      start.setDate(now.getDate() - (now.getDay() || 7) + 1); // Monday
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "last-month": {
      const lastMonth = new Date(now);
      lastMonth.setMonth(now.getMonth() - 1);
      const start = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      const end = new Date(
        lastMonth.getFullYear(),
        lastMonth.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      return { start, end };
    }
    case "this-month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      return { start, end };
    }
    default:
      // Handle "YYYY-MM-DD to YYYY-MM-DD" format
      if (range.includes(" to ")) {
        const parts = range.split(" to ").map((s) => s.trim());
        if (parts.length === 2) {
          return {
            start: new Date(parts[0] + "T00:00:00"),
            end: new Date(parts[1] + "T23:59:59"),
          };
        }
      }
      // Handle "YYYY-MM-DD-YYYY-MM-DD" format (no separator, just two dates)
      if (range.match(/^\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}$/)) {
        const parts = [range.substring(0, 10), range.substring(11)];
        return {
          start: new Date(parts[0] + "T00:00:00"),
          end: new Date(parts[1] + "T23:59:59"),
        };
      }
      throw new Error(`Invalid date range: ${range}`);
  }
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
function formatDate(date) {
  if (!date) {
    return null;
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return null;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format time to HH:mm
 */
function formatTime(date) {
  if (!date) {
    return "00:00";
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return "00:00";
  }
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Check if date is a weekend
 */
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Check if date is within work hours
 * Uses UTC time for comparison (git commits typically use UTC)
 */
function isWorkHour(date, config = {}) {
  const { start = "09:00", end = "17:00" } = config.workHours || {};

  const d = new Date(date);
  // Use UTC methods since git commits typically store dates in UTC
  const hour = d.getUTCHours();
  const minute = d.getUTCMinutes();
  const time = hour * 60 + minute;

  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  return time >= startTime && time <= endTime;
}

/**
 * Calculate minutes between two dates
 */
function minutesBetween(date1, date2) {
  return Math.abs(date2 - date1) / (1000 * 60);
}

module.exports = {
  parseDateRange,
  formatDate,
  formatTime,
  isWeekend,
  isWorkHour,
  minutesBetween,
};
