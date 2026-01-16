const GitLabAdapter = require('../../../src/adapters/GitLabAdapter');

// Mock fetch globally
global.fetch = jest.fn();

describe('GitLabAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new GitLabAdapter({
      projectId: '123',
      token: 'test-token',
      cache: false, // Disable caching in tests
    });
    fetch.mockReset(); // Reset mocks completely between tests
  });

  describe('constructor', () => {
    it('should throw error if projectId missing', () => {
      expect(() => new GitLabAdapter({})).toThrow();
    });

    it('should use custom baseUrl', () => {
      const customAdapter = new GitLabAdapter({
        projectId: '123',
        baseUrl: 'https://gitlab.example.com',
      });
      expect(customAdapter.baseUrl).toBe('https://gitlab.example.com');
    });
  });

  describe('getCommits', () => {
    it('should fetch commits from GitLab API', async () => {
      const mockCommits = [
        {
          id: 'abc123',
          author_name: 'Test User',
          author_email: 'test@example.com',
          created_at: '2024-01-01T09:00:00Z',
          message: 'Test commit',
        },
      ];

      const mockCommitDetails = {
        id: 'abc123',
        author_name: 'Test User',
        author_email: 'test@example.com',
        created_at: '2024-01-01T09:00:00Z',
        message: 'Test commit',
        diff: [],
      };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: () => '1',
          },
          json: async () => mockCommits,
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: () => null,
          },
          json: async () => mockCommitDetails,
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: () => null,
          },
          json: async () => [],
        });

      const commits = await adapter.getCommits();
      expect(commits).toHaveLength(1);
      expect(commits[0].hash).toBe('abc123');
    });

    it('should handle pagination', async () => {
      const mockCommitsPage1 = Array(2).fill(null).map((_, i) => ({
        id: `commit-${i}`,
        author_name: 'Test',
        author_email: 'test@example.com',
        created_at: '2024-01-01T09:00:00Z',
        message: `Commit ${i}`,
      }));
      
      const mockCommitsPage2 = Array(2).fill(null).map((_, i) => ({
        id: `commit-${i + 2}`,
        author_name: 'Test',
        author_email: 'test@example.com',
        created_at: '2024-01-01T09:00:00Z',
        message: `Commit ${i + 2}`,
      }));

      // Mock initial request (page 1) - triggers _fetchAllPages
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name) => name === 'x-total-pages' ? '2' : null,
        },
        json: async () => mockCommitsPage1,
      });

      // Mock _fetchAllPages calls - it fetches all pages starting from page 1
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name) => name === 'x-total-pages' ? '2' : null,
        },
        json: async () => mockCommitsPage1,
      });
      
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name) => name === 'x-total-pages' ? '2' : null,
        },
        json: async () => mockCommitsPage2,
      });

      // Mock commit details calls for all commits (page 1 + page 2 = 4 commits)
      const allCommits = [...mockCommitsPage1, ...mockCommitsPage2];
      allCommits.forEach((commit) => {
        fetch.mockResolvedValueOnce({
          ok: true,
          headers: { get: () => null },
          json: async () => ({
            id: commit.id,
            author_name: commit.author_name,
            author_email: commit.author_email,
            created_at: commit.created_at,
            message: commit.message,
            diff: [],
          }),
        });
        fetch.mockResolvedValueOnce({
          ok: true,
          headers: { get: () => null },
          json: async () => [],
        });
      });

      const commits = await adapter.getCommits();
      expect(commits.length).toBeGreaterThan(0);
    });

    it('should filter by date range', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => '1' },
        json: async () => [],
      });

      const since = new Date('2024-01-01');
      const until = new Date('2024-01-31');
      await adapter.getCommits({ since, until });

      const callUrl = fetch.mock.calls[0][0];
      expect(callUrl).toContain('since=');
      expect(callUrl).toContain('until=');
    });

    it('should handle API errors', async () => {
      // Mock the initial request that fails
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: { get: (name) => name === 'x-total-pages' ? '1' : null },
        json: async () => ({ message: 'Not Found' }),
      });

      await expect(adapter.getCommits()).rejects.toThrow('GitLab API error');
    });
  });

  describe('getBranches', () => {
    it('should fetch branches from GitLab API', async () => {
      const mockBranches = [
        { name: 'main' },
        { name: 'develop' },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: (name) => name === 'x-total-pages' ? '1' : null },
        json: async () => mockBranches,
      });

      const branches = await adapter.getBranches();
      expect(branches).toEqual(['main', 'develop']);
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('getRepoInfo', () => {
    it('should fetch repo info from GitLab API', async () => {
      const mockProject = {
        name: 'test-project',
        path_with_namespace: 'group/test-project',
        web_url: 'https://gitlab.com/group/test-project',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: (name) => name === 'x-total-pages' ? '1' : null },
        json: async () => mockProject,
      });

      const info = await adapter.getRepoInfo();
      expect(info.name).toBe('test-project');
      expect(info.type).toBe('gitlab');
      expect(fetch).toHaveBeenCalled();
    });
  });
});

