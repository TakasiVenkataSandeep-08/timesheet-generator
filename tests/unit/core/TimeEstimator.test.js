const TimeEstimator = require('../../../src/core/TimeEstimator');

describe('TimeEstimator', () => {
  let estimator;

  beforeEach(() => {
    estimator = new TimeEstimator();
  });

  describe('estimateSession', () => {
    it('should estimate time for a single commit session', () => {
      const session = {
        start: new Date('2024-01-01T09:00:00Z'),
        end: new Date('2024-01-01T09:00:00Z'),
        commits: [
          {
            hash: 'abc123',
            date: new Date('2024-01-01T09:00:00Z'),
            message: 'Initial commit',
            fileStats: [],
          },
        ],
      };

      const result = estimator.estimateSession(session);
      expect(result).toHaveProperty('startTime');
      expect(result).toHaveProperty('endTime');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('durationMinutes');
      expect(result).toHaveProperty('commits', 1);
      expect(result).toHaveProperty('confidence');
      expect(result.durationMinutes).toBeGreaterThanOrEqual(15); // min duration
      expect(result.durationMinutes).toBeLessThanOrEqual(480); // max duration
    });

    it('should estimate time for multiple commits', () => {
      const session = {
        start: new Date('2024-01-01T09:00:00Z'),
        end: new Date('2024-01-01T10:00:00Z'),
        commits: [
          {
            hash: 'abc123',
            date: new Date('2024-01-01T09:00:00Z'),
            message: 'First commit',
            fileStats: [],
          },
          {
            hash: 'def456',
            date: new Date('2024-01-01T09:30:00Z'),
            message: 'Second commit',
            fileStats: [],
          },
        ],
      };

      const result = estimator.estimateSession(session);
      expect(result.commits).toBe(2);
      expect(result.durationMinutes).toBeGreaterThanOrEqual(15);
    });

    it('should apply complexity multipliers for refactoring', () => {
      const session = {
        start: new Date('2024-01-01T09:00:00Z'),
        end: new Date('2024-01-01T09:00:00Z'),
        commits: [
          {
            hash: 'abc123',
            date: new Date('2024-01-01T09:00:00Z'),
            message: 'refactor: major restructuring',
            fileStats: [],
          },
        ],
      };

      const result = estimator.estimateSession(session);
      expect(result.durationMinutes).toBeGreaterThan(15);
    });

    it('should apply complexity multipliers for quick fixes', () => {
      const session = {
        start: new Date('2024-01-01T09:00:00Z'),
        end: new Date('2024-01-01T09:00:00Z'),
        commits: [
          {
            hash: 'abc123',
            date: new Date('2024-01-01T09:00:00Z'),
            message: 'quick fix: typo',
            fileStats: [],
          },
        ],
      };

      const result = estimator.estimateSession(session);
      expect(result.durationMinutes).toBeLessThan(30);
    });

    it('should calculate confidence based on commit count', () => {
      const session = {
        start: new Date('2024-01-01T09:00:00Z'),
        end: new Date('2024-01-01T09:00:00Z'),
        commits: Array(6).fill(null).map((_, i) => ({
          hash: `abc${i}`,
          date: new Date('2024-01-01T09:00:00Z'),
          message: `Commit ${i}`,
          fileStats: [],
        })),
      };

      const result = estimator.estimateSession(session);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should handle sessions with file stats', () => {
      const session = {
        start: new Date('2024-01-01T09:00:00Z'),
        end: new Date('2024-01-01T09:00:00Z'),
        commits: [
          {
            hash: 'abc123',
            date: new Date('2024-01-01T09:00:00Z'),
            message: 'Add feature',
            fileStats: [
              { filePath: 'src/file.js', additions: 100, deletions: 10 },
            ],
          },
        ],
      };

      const result = estimator.estimateSession(session);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should respect min and max duration constraints', () => {
      const session = {
        start: new Date('2024-01-01T09:00:00Z'),
        end: new Date('2024-01-01T09:00:00Z'),
        commits: [
          {
            hash: 'abc123',
            date: new Date('2024-01-01T09:00:00Z'),
            message: 'tiny change',
            fileStats: [],
          },
        ],
      };

      const result = estimator.estimateSession(session);
      expect(result.durationMinutes).toBeGreaterThanOrEqual(15);
      expect(result.durationMinutes).toBeLessThanOrEqual(480);
    });

    it('should throw error for invalid dates', () => {
      const session = {
        start: new Date('invalid'),
        end: new Date('2024-01-01T09:00:00Z'),
        commits: [
          {
            hash: 'abc123',
            date: new Date('2024-01-01T09:00:00Z'),
            message: 'test',
            fileStats: [],
          },
        ],
      };

      expect(() => estimator.estimateSession(session)).toThrow();
    });
  });

  describe('estimateSessions', () => {
    it('should estimate time for multiple sessions', () => {
      const sessions = [
        {
          start: new Date('2024-01-01T09:00:00Z'),
          end: new Date('2024-01-01T09:00:00Z'),
          commits: [
            {
              hash: 'abc123',
              date: new Date('2024-01-01T09:00:00Z'),
              message: 'First',
              fileStats: [],
            },
          ],
        },
        {
          start: new Date('2024-01-01T10:00:00Z'),
          end: new Date('2024-01-01T10:00:00Z'),
          commits: [
            {
              hash: 'def456',
              date: new Date('2024-01-01T10:00:00Z'),
              message: 'Second',
              fileStats: [],
            },
          ],
        },
      ];

      const results = estimator.estimateSessions(sessions);
      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('duration');
      expect(results[1]).toHaveProperty('duration');
    });
  });

  describe('custom config', () => {
    it('should use custom config values', () => {
      const customEstimator = new TimeEstimator({
        minSessionDuration: 30,
        maxSessionDuration: 240,
        baseTimePerCommit: 20,
      });

      const session = {
        start: new Date('2024-01-01T09:00:00Z'),
        end: new Date('2024-01-01T09:00:00Z'),
        commits: [
          {
            hash: 'abc123',
            date: new Date('2024-01-01T09:00:00Z'),
            message: 'test',
            fileStats: [],
          },
        ],
      };

      const result = customEstimator.estimateSession(session);
      expect(result.durationMinutes).toBeGreaterThanOrEqual(30);
      expect(result.durationMinutes).toBeLessThanOrEqual(240);
    });
  });
});

