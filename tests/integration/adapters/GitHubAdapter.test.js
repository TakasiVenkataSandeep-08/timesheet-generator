const GitHubAdapter = require('../../../src/adapters/GitHubAdapter');

// Mock fetch globally
global.fetch = jest.fn();

describe('GitHubAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new GitHubAdapter({
      owner: 'test-owner',
      repo: 'test-repo',
      token: 'test-token',
    });
    fetch.mockClear();
  });

  describe('constructor', () => {
    it('should throw error if owner or repo missing', () => {
      expect(() => new GitHubAdapter({ owner: 'test' })).toThrow();
      expect(() => new GitHubAdapter({ repo: 'test' })).toThrow();
    });

    it('should use token from options or env', () => {
      const adapter1 = new GitHubAdapter({
        owner: 'test',
        repo: 'test',
        token: 'custom-token',
      });
      expect(adapter1.token).toBe('custom-token');
    });
  });

  describe('getCommits', () => {
    it('should fetch commits from GitHub API', async () => {
      const mockCommits = [
        {
          sha: 'abc123',
          commit: {
            author: {
              name: 'Test User',
              email: 'test@example.com',
              date: '2024-01-01T09:00:00Z',
            },
            message: 'Test commit',
          },
        },
      ];

      const mockCommitDetails = {
        sha: 'abc123',
        commit: {
          author: {
            name: 'Test User',
            email: 'test@example.com',
            date: '2024-01-01T09:00:00Z',
          },
          message: 'Test commit',
        },
        files: [],
      };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: () => null,
          },
          json: async () => mockCommits,
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: () => null,
          },
          json: async () => mockCommitDetails,
        });

      const commits = await adapter.getCommits();
      expect(commits).toHaveLength(1);
      expect(commits[0].hash).toBe('abc123');
      expect(fetch).toHaveBeenCalled();
    });

    it('should handle pagination', async () => {
      const mockCommitsPage1 = Array(100).fill(null).map((_, i) => ({
        sha: `commit-${i}`,
        commit: {
          author: {
            name: 'Test',
            email: 'test@example.com',
            date: '2024-01-01T09:00:00Z',
          },
          message: `Commit ${i}`,
        },
      }));

      fetch
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: () => '<https://api.github.com/repos/test-owner/test-repo/commits?page=2>; rel="next"',
          },
          json: async () => mockCommitsPage1,
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: () => null,
          },
          json: async () => [],
        });

      const commits = await adapter.getCommits();
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should filter by date range', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        json: async () => [],
      });

      const since = new Date('2024-01-01');
      const until = new Date('2024-01-31');
      await adapter.getCommits({ since, until });

      const callUrl = fetch.mock.calls[0][0];
      expect(callUrl).toContain('since=');
      expect(callUrl).toContain('until=');
    });

    it('should filter by author', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        json: async () => [],
      });

      await adapter.getCommits({ author: 'test-user' });
      const callUrl = fetch.mock.calls[0][0];
      expect(callUrl).toContain('author=test-user');
    });

    it('should handle API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
        json: async () => ({ message: 'Not Found' }),
      });

      await expect(adapter.getCommits()).rejects.toThrow();
    });

    it('should handle rate limiting (429)', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ message: 'API rate limit exceeded' }),
      });

      await expect(adapter.getCommits()).rejects.toThrow('API rate limit');
    });
  });

  describe('getBranches', () => {
    it('should fetch branches from GitHub API', async () => {
      const mockBranches = [
        { name: 'main' },
        { name: 'develop' },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        json: async () => mockBranches,
      });

      const branches = await adapter.getBranches();
      expect(branches).toEqual(['main', 'develop']);
    });
  });

  describe('getRepoInfo', () => {
    it('should fetch repo info from GitHub API', async () => {
      const mockRepo = {
        name: 'test-repo',
        html_url: 'https://github.com/test-owner/test-repo',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        json: async () => mockRepo,
      });

      const info = await adapter.getRepoInfo();
      expect(info.name).toBe('test-repo');
      expect(info.type).toBe('github');
    });
  });
});

