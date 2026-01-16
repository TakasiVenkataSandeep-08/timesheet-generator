const {
  normalizeCommit,
  sortCommitsByDate,
  deduplicateCommits,
} = require('../../../src/utils/commitUtils');

describe('commitUtils', () => {
  describe('normalizeCommit', () => {
    it('should normalize valid commit', () => {
      const commit = {
        hash: 'abc123',
        authorName: 'Test User',
        authorEmail: 'test@example.com',
        date: new Date('2024-01-01T09:00:00Z'),
        message: 'Test commit',
        branches: ['main'],
        fileStats: [],
      };

      const result = normalizeCommit(commit);
      expect(result).toHaveProperty('hash', 'abc123');
      expect(result).toHaveProperty('authorName', 'Test User');
      expect(result).toHaveProperty('authorEmail', 'test@example.com');
      expect(result).toHaveProperty('date');
      expect(result.date).toBeInstanceOf(Date);
      expect(result).toHaveProperty('message', 'Test commit');
    });

    it('should handle date as string', () => {
      const commit = {
        hash: 'abc123',
        date: '2024-01-01T09:00:00Z',
        message: 'Test',
      };

      const result = normalizeCommit(commit);
      expect(result.date).toBeInstanceOf(Date);
    });

    it('should handle date as number', () => {
      const commit = {
        hash: 'abc123',
        date: new Date('2024-01-01T09:00:00Z').getTime(),
        message: 'Test',
      };

      const result = normalizeCommit(commit);
      expect(result.date).toBeInstanceOf(Date);
    });

    it('should return null for commit without hash', () => {
      const commit = {
        authorName: 'Test User',
        date: new Date('2024-01-01T09:00:00Z'),
        message: 'Test',
      };

      const result = normalizeCommit(commit);
      expect(result).toBeNull();
    });

    it('should return null for commit with invalid date', () => {
      const commit = {
        hash: 'abc123',
        date: 'invalid-date',
        message: 'Test',
      };

      const result = normalizeCommit(commit);
      expect(result).toBeNull();
    });

    it('should return null for null commit', () => {
      const result = normalizeCommit(null);
      expect(result).toBeNull();
    });

    it('should provide default values for missing fields', () => {
      const commit = {
        hash: 'abc123',
        date: new Date('2024-01-01T09:00:00Z'),
      };

      const result = normalizeCommit(commit);
      expect(result.authorName).toBe('');
      expect(result.authorEmail).toBe('');
      expect(result.message).toBe('');
      expect(result.branches).toEqual([]);
      expect(result.fileStats).toEqual([]);
    });
  });

  describe('sortCommitsByDate', () => {
    it('should sort commits by date (newest first)', () => {
      const commits = [
        {
          hash: 'abc123',
          date: new Date('2024-01-01T09:00:00Z'),
          message: 'First',
        },
        {
          hash: 'def456',
          date: new Date('2024-01-02T09:00:00Z'),
          message: 'Second',
        },
        {
          hash: 'ghi789',
          date: new Date('2024-01-01T10:00:00Z'),
          message: 'Third',
        },
      ];

      const result = sortCommitsByDate(commits);
      expect(result[0].hash).toBe('def456');
      expect(result[1].hash).toBe('ghi789');
      expect(result[2].hash).toBe('abc123');
    });

    it('should not mutate original array', () => {
      const commits = [
        {
          hash: 'abc123',
          date: new Date('2024-01-01T09:00:00Z'),
          message: 'First',
        },
        {
          hash: 'def456',
          date: new Date('2024-01-02T09:00:00Z'),
          message: 'Second',
        },
      ];

      const original = [...commits];
      sortCommitsByDate(commits);
      expect(commits).toEqual(original);
    });
  });

  describe('deduplicateCommits', () => {
    it('should remove duplicate commits by hash', () => {
      const commits = [
        {
          hash: 'abc123',
          date: new Date('2024-01-01T09:00:00Z'),
          message: 'First',
        },
        {
          hash: 'def456',
          date: new Date('2024-01-02T09:00:00Z'),
          message: 'Second',
        },
        {
          hash: 'abc123',
          date: new Date('2024-01-01T09:00:00Z'),
          message: 'Duplicate',
        },
      ];

      const result = deduplicateCommits(commits);
      expect(result).toHaveLength(2);
      expect(result.map(c => c.hash)).toEqual(['abc123', 'def456']);
    });

    it('should keep first occurrence of duplicate', () => {
      const commits = [
        {
          hash: 'abc123',
          date: new Date('2024-01-01T09:00:00Z'),
          message: 'First',
        },
        {
          hash: 'abc123',
          date: new Date('2024-01-01T09:00:00Z'),
          message: 'Second',
        },
      ];

      const result = deduplicateCommits(commits);
      expect(result).toHaveLength(1);
      expect(result[0].message).toBe('First');
    });

    it('should return empty array for empty input', () => {
      const result = deduplicateCommits([]);
      expect(result).toEqual([]);
    });

    it('should return same array for no duplicates', () => {
      const commits = [
        {
          hash: 'abc123',
          date: new Date('2024-01-01T09:00:00Z'),
          message: 'First',
        },
        {
          hash: 'def456',
          date: new Date('2024-01-02T09:00:00Z'),
          message: 'Second',
        },
      ];

      const result = deduplicateCommits(commits);
      expect(result).toHaveLength(2);
    });
  });
});

