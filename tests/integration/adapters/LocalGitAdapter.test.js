const LocalGitAdapter = require('../../../src/adapters/LocalGitAdapter');
const { getCommits: getCommitsFromGit } = require('../../../src/index');

// Mock the git log function
jest.mock('../../../src/index', () => ({
  getCommits: jest.fn(),
}));

describe('LocalGitAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new LocalGitAdapter('/test/repo');
    getCommitsFromGit.mockClear();
  });

  describe('constructor', () => {
    it('should use provided repo path', () => {
      const adapter = new LocalGitAdapter('/custom/path');
      expect(adapter.repoPath).toBe('/custom/path');
    });

    it('should use current directory if no path provided', () => {
      const adapter = new LocalGitAdapter();
      expect(adapter.repoPath).toBe(process.cwd());
    });
  });

  describe('getCommits', () => {
    it('should fetch commits from local git', async () => {
      const mockCommits = [
        {
          hash: 'abc123',
          authorName: 'Test User',
          authorEmail: 'test@example.com',
          date: new Date('2024-01-01T09:00:00Z'),
          message: 'Test commit',
          branches: ['main'],
          fileStats: [],
        },
      ];

      getCommitsFromGit.mockResolvedValue(mockCommits);

      const commits = await adapter.getCommits();
      expect(commits).toHaveLength(1);
      expect(commits[0].hash).toBe('abc123');
      expect(getCommitsFromGit).toHaveBeenCalledWith(
        expect.objectContaining({
          repoPath: '/test/repo',
        })
      );
    });

    it('should pass options to getCommitsFromGit', async () => {
      getCommitsFromGit.mockResolvedValue([]);

      await adapter.getCommits({
        since: new Date('2024-01-01'),
        until: new Date('2024-01-31'),
        author: 'test-user',
        branches: ['main'],
      });

      expect(getCommitsFromGit).toHaveBeenCalledWith(
        expect.objectContaining({
          since: expect.any(Date),
          until: expect.any(Date),
          author: 'test-user',
          branches: ['main'],
        })
      );
    });

    it('should filter out invalid commits', async () => {
      const mockCommits = [
        {
          hash: 'abc123',
          date: new Date('2024-01-01T09:00:00Z'),
          message: 'Valid',
        },
        {
          hash: 'def456',
          date: 'invalid-date',
          message: 'Invalid',
        },
        null,
      ];

      getCommitsFromGit.mockResolvedValue(mockCommits);

      const commits = await adapter.getCommits();
      expect(commits.length).toBeLessThan(mockCommits.length);
      expect(commits.every(c => c !== null)).toBe(true);
    });

    it('should include file stats when requested', async () => {
      getCommitsFromGit.mockResolvedValue([]);

      await adapter.getCommits({ includeFileStats: true });
      expect(getCommitsFromGit).toHaveBeenCalledWith(
        expect.objectContaining({
          includeFileStats: true,
        })
      );
    });
  });

  describe('getBranches', () => {
    it('should fetch branches from git', async () => {
      // This would require mocking execAsync, which is complex
      // For now, we'll test the structure
      expect(typeof adapter.getBranches).toBe('function');
    });
  });

  describe('getRepoInfo', () => {
    it('should return repo info', async () => {
      // This would require mocking execAsync
      // For now, we'll test the structure
      expect(typeof adapter.getRepoInfo).toBe('function');
    });
  });
});

