const { isWeekend, isWorkHour } = require('../utils/dateUtils');

/**
 * Work Pattern Learner - analyzes commit patterns to detect work hours
 */
class WorkPatternLearner {
  constructor() {
    this.patterns = {
      commitTimes: [],
      commitDays: [],
      gaps: [],
    };
  }

  /**
   * Analyze commits to learn work patterns
   */
  analyzeCommits(commits) {
    if (!commits || commits.length === 0) {
      return null;
    }

    const commitTimes = [];
    const commitDays = [];
    const gaps = [];

    // Sort commits by date
    const sortedCommits = [...commits].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    for (let i = 0; i < sortedCommits.length; i++) {
      const commit = sortedCommits[i];
      const hour = commit.date.getHours();
      const dayOfWeek = commit.date.getDay();

      commitTimes.push(hour);
      commitDays.push(dayOfWeek);

      // Calculate gap from previous commit
      if (i > 0) {
        const gap = (commit.date - sortedCommits[i - 1].date) / (1000 * 60); // minutes
        gaps.push(gap);
      }
    }

    this.patterns.commitTimes = commitTimes;
    this.patterns.commitDays = commitDays;
    this.patterns.gaps = gaps;

    return this._detectPatterns();
  }

  /**
   * Detect work patterns from analyzed data
   */
  _detectPatterns() {
    if (this.patterns.commitTimes.length === 0) {
      return null;
    }

    // Detect work hours (most common commit hours)
    const hourFrequency = {};
    this.patterns.commitTimes.forEach(hour => {
      hourFrequency[hour] = (hourFrequency[hour] || 0) + 1;
    });

    const sortedHours = Object.entries(hourFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(([hour]) => parseInt(hour));

    const startHour = Math.min(...sortedHours.slice(0, Math.ceil(sortedHours.length * 0.3)));
    const endHour = Math.max(...sortedHours.slice(0, Math.ceil(sortedHours.length * 0.3)));

    // Detect work days (exclude weekends if no commits)
    const dayFrequency = {};
    this.patterns.commitDays.forEach(day => {
      dayFrequency[day] = (dayFrequency[day] || 0) + 1;
    });

    const workDays = Object.keys(dayFrequency)
      .map(Number)
      .filter(day => day !== 0 && day !== 6); // Exclude Sunday (0) and Saturday (6)

    // Detect typical gap (median gap)
    const sortedGaps = [...this.patterns.gaps].sort((a, b) => a - b);
    const medianGap = sortedGaps.length > 0
      ? sortedGaps[Math.floor(sortedGaps.length / 2)]
      : 30;

    return {
      workHours: {
        start: `${String(startHour).padStart(2, '0')}:00`,
        end: `${String(Math.max(endHour + 1, startHour + 8)).padStart(2, '0')}:00`,
      },
      workDays: workDays.length > 0 ? workDays : [1, 2, 3, 4, 5], // Default to Mon-Fri
      typicalGap: Math.round(medianGap),
      confidence: this._calculateConfidence(),
    };
  }

  /**
   * Calculate confidence score for detected patterns
   */
  _calculateConfidence() {
    const commitCount = this.patterns.commitTimes.length;
    
    if (commitCount < 10) {
      return 0.3; // Low confidence with few commits
    } else if (commitCount < 50) {
      return 0.6; // Medium confidence
    } else {
      return 0.8; // High confidence with many commits
    }
  }

  /**
   * Learn from historical data and return recommended config
   */
  learnFromHistory(commits) {
    const patterns = this.analyzeCommits(commits);
    
    if (!patterns) {
      return null;
    }

    return {
      workHours: patterns.workHours,
      excludeWeekends: patterns.workDays.length < 7,
      gapThreshold: patterns.typicalGap,
      confidence: patterns.confidence,
    };
  }

  /**
   * Check if time matches learned pattern
   */
  matchesPattern(date, learnedPattern) {
    if (!learnedPattern) {
      return true;
    }

    // Check work hours
    if (learnedPattern.workHours) {
      const hour = date.getHours();
      const startHour = parseInt(learnedPattern.workHours.start.split(':')[0]);
      const endHour = parseInt(learnedPattern.workHours.end.split(':')[0]);
      
      if (hour < startHour || hour >= endHour) {
        return false;
      }
    }

    // Check work days
    if (learnedPattern.excludeWeekends) {
      if (isWeekend(date)) {
        return false;
      }
    }

    return true;
  }
}

module.exports = WorkPatternLearner;

