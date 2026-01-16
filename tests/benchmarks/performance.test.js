const TimeEstimator = require('../../src/core/TimeEstimator');
const SessionGrouper = require('../../src/core/SessionGrouper');
const TimesheetGenerator = require('../../src/core/TimesheetGenerator');

describe('Performance Benchmarks', () => {
  describe('Time Estimation Performance', () => {
    it('should estimate time for large commit sets quickly', () => {
      const estimator = new TimeEstimator();
      const sessions = Array(100).fill(null).map((_, i) => ({
        start: new Date(`2024-01-01T${9 + (i % 8)}:00:00Z`),
        end: new Date(`2024-01-01T${9 + (i % 8) + 1}:00:00Z`),
        commits: Array(5).fill(null).map((_, j) => ({
          hash: `commit-${i}-${j}`,
          date: new Date(`2024-01-01T${9 + (i % 8)}:${j * 10}:00Z`),
          message: `Commit ${i}-${j}`,
          fileStats: [
            { filePath: `file-${j}.js`, additions: 10, deletions: 5 },
          ],
        })),
      }));

      const start = Date.now();
      const estimates = estimator.estimateSessions(sessions);
      const duration = Date.now() - start;

      expect(estimates).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete in <1s
    });
  });

  describe('Session Grouping Performance', () => {
    it('should group large commit sets quickly', () => {
      const grouper = new SessionGrouper();
      const commits = Array(1000).fill(null).map((_, i) => ({
        hash: `commit-${i}`,
        date: new Date(`2024-01-01T${9 + (i % 8)}:${i % 60}:00Z`),
        message: `Commit ${i}`,
        branches: ['main'],
      }));

      const start = Date.now();
      const sessions = grouper.groupIntoSessions(commits);
      const duration = Date.now() - start;

      expect(sessions.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(500); // Should complete in <500ms
    });
  });

  describe('Timesheet Generation Performance', () => {
    it('should generate timesheet for large commit sets quickly', async () => {
      const generator = new TimesheetGenerator();
      const commits = Array(500).fill(null).map((_, i) => ({
        hash: `commit-${i}`,
        authorName: 'Test User',
        authorEmail: 'test@example.com',
        date: new Date(`2024-01-01T${9 + (i % 8)}:${i % 60}:00Z`),
        message: `Commit ${i}: PROJ-${i % 10}`,
        branches: ['main'],
        fileStats: [],
      }));

      const start = Date.now();
      const timesheet = await generator.generate(commits, {
        period: {
          start: '2024-01-01',
          end: '2024-01-31',
        },
      });
      const duration = Date.now() - start;

      expect(timesheet.totalCommits).toBe(500);
      expect(duration).toBeLessThan(2000); // Should complete in <2s
    });
  });

  describe('Multi-Repo Performance', () => {
    it('should process multiple repos efficiently', async () => {
      // This is a placeholder test - actual multi-repo testing would require
      // mocking adapters or using real repos
      const generator = new TimesheetGenerator();
      const commits = Array(200).fill(null).map((_, i) => ({
        hash: `commit-${i}`,
        authorName: 'Test User',
        authorEmail: 'test@example.com',
        date: new Date(`2024-01-01T${9 + (i % 8)}:${i % 60}:00Z`),
        message: `Commit ${i}`,
        branches: ['main'],
        fileStats: [],
        repo: `repo-${i % 5}`,
      }));

      const start = Date.now();
      const timesheet = await generator.generate(commits);
      const duration = Date.now() - start;

      expect(timesheet.totalCommits).toBe(200);
      expect(duration).toBeLessThan(1000); // Should complete in <1s
    });
  });
});

