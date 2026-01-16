const { minutesBetween, isWeekend, isWorkHour } = require("../utils/dateUtils");
const { isHoliday } = require("../utils/holidayUtils");

/**
 * Session Grouper - groups commits into work sessions
 */
class SessionGrouper {
  constructor(config = {}) {
    this.config = {
      gapThreshold: config.gapThreshold || 30, // minutes
      excludeWeekends: config.excludeWeekends !== false,
      excludeHolidays: config.excludeHolidays || false,
      holidayCountry: config.holidayCountry || 'US',
      holidayState: config.holidayState || null,
      customHolidays: config.customHolidays || [],
      workHours: config.workHours || { start: "09:00", end: "17:00" },
      learnPatterns: config.learnPatterns || false,
      ...config,
    };

    // Initialize pattern learner if enabled
    if (this.config.learnPatterns) {
      this.patternLearner = new WorkPatternLearner();
    }
  }

  /**
   * Group commits into sessions based on time gaps
   */
  groupIntoSessions(commits, gapThreshold = null) {
    // Learn patterns if enabled
    if (this.patternLearner && commits.length > 0) {
      const learnedPattern = this.patternLearner.learnFromHistory(commits);
      if (learnedPattern && learnedPattern.confidence > 0.5) {
        // Override config with learned patterns
        if (learnedPattern.workHours) {
          this.config.workHours = learnedPattern.workHours;
        }
        if (learnedPattern.gapThreshold) {
          this.config.gapThreshold = learnedPattern.gapThreshold;
        }
        if (learnedPattern.excludeWeekends !== undefined) {
          this.config.excludeWeekends = learnedPattern.excludeWeekends;
        }
      }
    }

    const threshold = gapThreshold || this.config.gapThreshold;
    const sortedCommits = [...commits].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    if (sortedCommits.length === 0) {
      return [];
    }

    // Validate first commit date
    const firstCommit = sortedCommits[0];
    if (!firstCommit.date || !(firstCommit.date instanceof Date)) {
      throw new Error(`Invalid commit date: ${firstCommit.date}`);
    }
    if (isNaN(firstCommit.date.getTime())) {
      throw new Error(`Invalid commit date value: ${firstCommit.date}`);
    }

    const sessions = [];
    let currentSession = {
      commits: [firstCommit],
      start: firstCommit.date,
      end: firstCommit.date,
    };

    for (let i = 1; i < sortedCommits.length; i++) {
      const prevCommit = sortedCommits[i - 1];
      const currentCommit = sortedCommits[i];
      const gap = minutesBetween(prevCommit.date, currentCommit.date);

      // Check if we should start a new session
      const isHolidayDate = this.config.excludeHolidays && isHoliday(currentCommit.date, {
        country: this.config.holidayCountry,
        state: this.config.holidayState,
        customHolidays: this.config.customHolidays,
      });

      const shouldStartNewSession =
        gap > threshold ||
        (this.config.excludeWeekends && isWeekend(currentCommit.date)) ||
        isHolidayDate ||
        this._isDifferentDay(prevCommit.date, currentCommit.date);

      if (shouldStartNewSession) {
        // Finalize current session
        sessions.push(currentSession);

        // Start new session
        currentSession = {
          commits: [currentCommit],
          start: currentCommit.date,
          end: currentCommit.date,
        };
      } else {
        // Add to current session
        currentSession.commits.push(currentCommit);
        currentSession.end = currentCommit.date;
      }
    }

    // Add final session
    if (currentSession.commits.length > 0) {
      sessions.push(currentSession);
    }

    // Filter out sessions outside work hours if configured
    // Only filter if explicitly enabled and not just checking weekends
    if (this.config.workHours && this.config.excludeNonWorkHours) {
      return sessions.filter((session) => {
        if (this.config.excludeWeekends && isWeekend(session.start)) {
          return false;
        }
        if (this.config.excludeHolidays && isHoliday(session.start, {
          country: this.config.holidayCountry,
          state: this.config.holidayState,
          customHolidays: this.config.customHolidays,
        })) {
          return false;
        }
        return (
          isWorkHour(session.start, this.config) ||
          isWorkHour(session.end, this.config)
        );
      });
    }

    // Filter weekends and holidays if configured
    if (this.config.excludeWeekends || this.config.excludeHolidays) {
      return sessions.filter((session) => {
        if (this.config.excludeWeekends && isWeekend(session.start)) {
          return false;
        }
        if (this.config.excludeHolidays && isHoliday(session.start, {
          country: this.config.holidayCountry,
          state: this.config.holidayState,
          customHolidays: this.config.customHolidays,
        })) {
          return false;
        }
        return true;
      });
    }

    return sessions;
  }

  /**
   * Check if two dates are on different days
   */
  _isDifferentDay(date1, date2) {
    return (
      date1.getFullYear() !== date2.getFullYear() ||
      date1.getMonth() !== date2.getMonth() ||
      date1.getDate() !== date2.getDate()
    );
  }

  /**
   * Merge adjacent sessions on the same day
   */
  mergeAdjacentSessions(sessions, maxGap = 60) {
    if (sessions.length <= 1) {
      return sessions;
    }

    const merged = [];
    let current = sessions[0];

    for (let i = 1; i < sessions.length; i++) {
      const next = sessions[i];
      const gap = minutesBetween(current.end, next.start);

      const sameDay =
        current.start.getDate() === next.start.getDate() &&
        current.start.getMonth() === next.start.getMonth() &&
        current.start.getFullYear() === next.start.getFullYear();

      if (sameDay && gap <= maxGap) {
        // Merge sessions
        current.commits.push(...next.commits);
        current.end = next.end;
      } else {
        merged.push(current);
        current = next;
      }
    }

    merged.push(current);
    return merged;
  }
}

module.exports = SessionGrouper;
