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
      cache: false, // Disable caching in tests
    });
    fetch.mockReset(); // Reset mocks completely between tests
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
      const mockCommitsPage1 = Array(2).fill(null).map((_, i) => ({
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

      // Mock initial commits list with pagination link
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name) => name === 'link' ? '<https://api.github.com/repos/test-owner/test-repo/commits?page=2>; rel="next"' : null,
        },
        json: async () => mockCommitsPage1,
      });

      // Mock second page (empty) - this is fetched by _fetchAllPages from _request
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => null,
        },
        json: async () => [],
      });

      // Mock commit details for each commit in page 1 (getCommits fetches details for each commit)
      mockCommitsPage1.forEach((commit, i) => {
        fetch.mockResolvedValueOnce({
          ok: true,
          headers: { get: () => null },
          json: async () => ({
            sha: commit.sha,
            commit: {
              author: { 
                name: commit.commit.author.name, 
                email: commit.commit.author.email, 
                date: commit.commit.author.date 
              },
              message: commit.commit.message,
            },
            files: [],
          }),
        });
      });

      const commits = await adapter.getCommits();
      // Initial page + second page (from _fetchAllPages) + commit details (2) = 4 calls
      expect(fetch).toHaveBeenCalledTimes(4);
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
      expect(fetch).toHaveBeenCalled();
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
      // Mock the initial request that fails
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: { get: () => null },
        json: async () => ({ message: 'Not Found' }),
      });

      await expect(adapter.getCommits()).rejects.toThrow('GitHub API error');
    });

    it('should handle rate limiting (429)', async () => {
      // Mock the fetch call for initial attempt and retries (maxRetries = 3, so 4 total attempts)
      const errorResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: { 
          get: (name) => name === 'retry-after' ? null : null 
        },
        json: async () => Promise.resolve({ message: 'API rate limit exceeded' }),
      };
      
      // Mock for initial attempt + retries (up to 4 calls)
      for (let i = 0; i < 4; i++) {
        fetch.mockResolvedValueOnce(errorResponse);
      }

      await expect(adapter.getCommits()).rejects.toThrow(/API rate limit|rate limit exceeded/i);
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
      expect(fetch).toHaveBeenCalled();
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
      expect(fetch).toHaveBeenCalled();
    });
  });
});

