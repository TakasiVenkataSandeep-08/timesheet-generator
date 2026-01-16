const SessionGrouper = require('../../../src/core/SessionGrouper');

describe('SessionGrouper', () => {
  let grouper;

  beforeEach(() => {
    grouper = new SessionGrouper();
  });

  describe('groupIntoSessions', () => {
    it('should return empty array for empty commits', () => {
      const result = grouper.groupIntoSessions([]);
      expect(result).toEqual([]);
    });

    it('should create single session for single commit', () => {
      const commits = [
        {
          hash: 'abc123',
          date: new Date('2024-01-01T09:00:00Z'),
          message: 'test',
        },
      ];

      const result = grouper.groupIntoSessions(commits);
      expect(result).toHaveLength(1);
      expect(result[0].commits).toHaveLength(1);
    });

    it('should group commits within gap threshold', () => {
      const commits = [
        {
          hash: 'abc123',
          date: new Date('2024-01-01T09:00:00Z'),
          message: 'first',
        },
        {
          hash: 'def456',
          date: new Date('2024-01-01T09:15:00Z'), // 15 min gap
          message: 'second',
        },
      ];

      const result = grouper.groupIntoSessions(commits, 30);
      expect(result).toHaveLength(1);
      expect(result[0].commits).toHaveLength(2);
    });

    it('should split sessions when gap exceeds threshold', () => {
      const commits = [
        {
          hash: 'abc123',
          date: new Date('2024-01-01T09:00:00Z'),
          message: 'first',
        },
        {
          hash: 'def456',
          date: new Date('2024-01-01T10:00:00Z'), // 60 min gap
          message: 'second',
        },
      ];

      const result = grouper.groupIntoSessions(commits, 30);
      expect(result).toHaveLength(2);
      expect(result[0].commits).toHaveLength(1);
      expect(result[1].commits).toHaveLength(1);
    });

    it('should split sessions on different days', () => {
      const commits = [
        {
          hash: 'abc123',
          date: new Date('2024-01-01T09:00:00Z'),
          message: 'first',
        },
        {
          hash: 'def456',
          date: new Date('2024-01-02T09:00:00Z'),
          message: 'second',
        },
      ];

      const result = grouper.groupIntoSessions(commits);
      expect(result).toHaveLength(2);
    });

    it('should exclude weekends when configured', () => {
      const grouperWithWeekends = new SessionGrouper({
        excludeWeekends: true,
      });

      const commits = [
        {
          hash: 'abc123',
          date: new Date('2024-01-06T09:00:00Z'), // Saturday
          message: 'weekend commit',
        },
      ];

      const result = grouperWithWeekends.groupIntoSessions(commits);
      expect(result).toHaveLength(0);
    });

    it('should handle unsorted commits', () => {
      const commits = [
        {
          hash: 'def456',
          date: new Date('2024-01-01T10:00:00Z'),
          message: 'second',
        },
        {
          hash: 'abc123',
          date: new Date('2024-01-01T09:00:00Z'),
          message: 'first',
        },
      ];

      const result = grouper.groupIntoSessions(commits);
      expect(result).toHaveLength(1);
      expect(result[0].commits[0].hash).toBe('abc123');
    });

    it('should throw error for invalid commit date', () => {
      const commits = [
        {
          hash: 'abc123',
          date: null,
          message: 'invalid',
        },
      ];

      expect(() => grouper.groupIntoSessions(commits)).toThrow();
    });
  });

  describe('mergeAdjacentSessions', () => {
    it('should merge sessions on same day within max gap', () => {
      const sessions = [
        {
          start: new Date('2024-01-01T09:00:00Z'),
          end: new Date('2024-01-01T09:30:00Z'),
          commits: [{ hash: 'abc123', date: new Date('2024-01-01T09:00:00Z') }],
        },
        {
          start: new Date('2024-01-01T10:00:00Z'),
          end: new Date('2024-01-01T10:30:00Z'),
          commits: [{ hash: 'def456', date: new Date('2024-01-01T10:00:00Z') }],
        },
      ];

      const result = grouper.mergeAdjacentSessions(sessions, 60);
      expect(result).toHaveLength(1);
      expect(result[0].commits).toHaveLength(2);
    });

    it('should not merge sessions on different days', () => {
      const sessions = [
        {
          start: new Date('2024-01-01T09:00:00Z'),
          end: new Date('2024-01-01T09:30:00Z'),
          commits: [{ hash: 'abc123', date: new Date('2024-01-01T09:00:00Z') }],
        },
        {
          start: new Date('2024-01-02T09:00:00Z'),
          end: new Date('2024-01-02T09:30:00Z'),
          commits: [{ hash: 'def456', date: new Date('2024-01-02T09:00:00Z') }],
        },
      ];

      const result = grouper.mergeAdjacentSessions(sessions, 60);
      expect(result).toHaveLength(2);
    });

    it('should not merge sessions exceeding max gap', () => {
      const sessions = [
        {
          start: new Date('2024-01-01T09:00:00Z'),
          end: new Date('2024-01-01T09:30:00Z'),
          commits: [{ hash: 'abc123', date: new Date('2024-01-01T09:00:00Z') }],
        },
        {
          start: new Date('2024-01-01T11:00:00Z'), // 90 min gap
          end: new Date('2024-01-01T11:30:00Z'),
          commits: [{ hash: 'def456', date: new Date('2024-01-01T11:00:00Z') }],
        },
      ];

      const result = grouper.mergeAdjacentSessions(sessions, 60);
      expect(result).toHaveLength(2);
    });

    it('should return single session unchanged', () => {
      const sessions = [
        {
          start: new Date('2024-01-01T09:00:00Z'),
          end: new Date('2024-01-01T09:30:00Z'),
          commits: [{ hash: 'abc123', date: new Date('2024-01-01T09:00:00Z') }],
        },
      ];

      const result = grouper.mergeAdjacentSessions(sessions);
      expect(result).toHaveLength(1);
    });
  });
});

