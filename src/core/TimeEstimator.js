const { minutesBetween } = require("../utils/dateUtils");

/**
 * Time Estimator - estimates work time from commit patterns
 */
class TimeEstimator {
  constructor(config = {}) {
    this.config = {
      minSessionDuration: config.minSessionDuration || 15, // minutes
      maxSessionDuration: config.maxSessionDuration || 480, // minutes (8 hours)
      baseTimePerCommit: config.baseTimePerCommit || 10, // minutes
      complexityMultipliers: {
        test: 0.5,
        doc: 0.3,
        config: 0.2,
        feature: 1.5,
        refactor: 2.0,
        bugfix: 1.0,
        ...config.complexityMultipliers,
      },
    };
  }

  /**
   * Estimate time for a single session
   */
  estimateSession(session) {
    const baseTime = this._calculateBaseTime(session);
    const complexityMultiplier = this._assessComplexity(session);
    const messageHint = this._extractTimeHint(session.commits);
    const gapTime = this._calculateGapTime(session);

    // Combine factors
    let estimatedMinutes =
      baseTime * complexityMultiplier * messageHint + gapTime;

    // Apply min/max constraints
    estimatedMinutes = Math.max(
      this.config.minSessionDuration,
      Math.min(this.config.maxSessionDuration, estimatedMinutes)
    );

    const confidence = this._calculateConfidence(session);

    // Validate dates
    const startTime = session.start instanceof Date && !isNaN(session.start.getTime()) 
      ? session.start 
      : new Date(session.start);
    const endTime = session.end instanceof Date && !isNaN(session.end.getTime()) 
      ? session.end 
      : new Date(session.end);

    // Final validation
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error(`Invalid date in session: start=${session.start}, end=${session.end}`);
    }

    return {
      startTime,
      endTime,
      duration: estimatedMinutes / 60, // Convert to hours
      durationMinutes: estimatedMinutes,
      commits: session.commits.length,
      confidence,
    };
  }

  /**
   * Estimate time for multiple sessions
   */
  estimateSessions(sessions) {
    return sessions.map((session) => this.estimateSession(session));
  }

  /**
   * Calculate base time from commit count and gaps
   */
  _calculateBaseTime(session) {
    const commitCount = session.commits.length;
    const timeSpan = minutesBetween(session.start, session.end);

    // Base time: at least X minutes per commit, or actual time span if longer
    return Math.max(
      commitCount * this.config.baseTimePerCommit,
      timeSpan || commitCount * this.config.baseTimePerCommit
    );
  }

  /**
   * Assess complexity from file changes
   */
  _assessComplexity(session) {
    let totalAdditions = 0;
    let totalDeletions = 0;
    let fileCount = 0;
    let hasTests = false;
    let hasDocs = false;
    let hasConfig = false;

    for (const commit of session.commits) {
      if (commit.fileStats) {
        for (const stat of commit.fileStats) {
          totalAdditions += stat.additions || 0;
          totalDeletions += stat.deletions || 0;
          fileCount++;

          const path = stat.filePath.toLowerCase();
          if (path.includes(".test.") || path.includes(".spec.")) {
            hasTests = true;
          }
          if (path.endsWith(".md") || path.endsWith(".rst")) {
            hasDocs = true;
          }
          if (
            path.endsWith(".json") ||
            path.endsWith(".yaml") ||
            path.endsWith(".yml")
          ) {
            hasConfig = true;
          }
        }
      }
    }

    // Complexity based on LOC
    const totalLOC = totalAdditions + totalDeletions;
    let complexity = 1.0;

    if (totalLOC > 1000) {
      complexity = 2.0;
    } else if (totalLOC > 500) {
      complexity = 1.5;
    } else if (totalLOC > 100) {
      complexity = 1.2;
    } else if (totalLOC < 10) {
      complexity = 0.5;
    }

    // Adjust for file types
    if (hasTests && fileCount === 1) {
      complexity *= this.config.complexityMultipliers.test;
    }
    if (hasDocs && fileCount === 1) {
      complexity *= this.config.complexityMultipliers.doc;
    }
    if (hasConfig && fileCount === 1) {
      complexity *= this.config.complexityMultipliers.config;
    }

    return complexity;
  }

  /**
   * Extract time hint from commit messages
   */
  _extractTimeHint(commits) {
    const messages = commits.map((c) => c.message.toLowerCase()).join(" ");

    // Quick fixes
    if (
      messages.includes("quick fix") ||
      messages.includes("typo") ||
      messages.includes("fix typo") ||
      messages.includes("minor")
    ) {
      return 0.5;
    }

    // Refactoring
    if (
      messages.includes("refactor") ||
      messages.includes("restructure") ||
      messages.includes("cleanup")
    ) {
      return this.config.complexityMultipliers.refactor;
    }

    // Features
    if (
      messages.includes("feature") ||
      messages.includes("implement") ||
      messages.includes("add")
    ) {
      return this.config.complexityMultipliers.feature;
    }

    // Bug fixes
    if (messages.includes("fix") || messages.includes("bug")) {
      return this.config.complexityMultipliers.bugfix;
    }

    return 1.0; // Default
  }

  /**
   * Calculate time from gaps between commits
   */
  _calculateGapTime(session) {
    if (session.commits.length < 2) {
      return 0;
    }

    let totalGap = 0;
    for (let i = 1; i < session.commits.length; i++) {
      const gap = minutesBetween(
        session.commits[i - 1].date,
        session.commits[i].date
      );
      // Only count gaps up to 2 hours (likely actual work time)
      if (gap <= 120) {
        totalGap += gap * 0.3; // Only count 30% of gap as work time
      }
    }

    return totalGap;
  }

  /**
   * Calculate confidence score (0-1)
   */
  _calculateConfidence(session) {
    let confidence = 0.5; // Base confidence

    // More commits = higher confidence
    if (session.commits.length > 5) {
      confidence += 0.2;
    } else if (session.commits.length > 2) {
      confidence += 0.1;
    }

    // File stats available = higher confidence
    const hasFileStats = session.commits.some((c) => c.fileStats && c.fileStats.length > 0);
    if (hasFileStats) {
      confidence += 0.2;
    }

    // Reasonable time span = higher confidence
    const timeSpan = minutesBetween(session.start, session.end);
    if (timeSpan > 30 && timeSpan < 480) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }
}

module.exports = TimeEstimator;

