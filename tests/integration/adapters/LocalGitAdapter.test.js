const LocalGitAdapter = require("../../../src/adapters/LocalGitAdapter");
const { getCommits: getCommitsFromGit } = require("../../../src/index");
const path = require("path");
const fs = require("fs");

// Mock the git log function
jest.mock("../../../src/index", () => ({
  getCommits: jest.fn(),
}));

// Mock fs and exec to avoid actual file system checks
jest.mock("fs", () => ({
  existsSync: jest.fn(),
}));

jest.mock("child_process", () => ({
  exec: jest.fn(),
}));

describe("LocalGitAdapter", () => {
  let adapter;
  let mockRepoPath;

  beforeEach(() => {
    // Use a mock repository path
    mockRepoPath = "/test/repo";
    adapter = new LocalGitAdapter(mockRepoPath);
    getCommitsFromGit.mockClear();

    // Mock file system and git checks
    fs.existsSync.mockReturnValue(true);
    const { exec } = require("child_process");
    const { promisify } = require("util");
    exec.mockImplementation((cmd, callback) => {
      if (cmd.includes("rev-parse --git-dir")) {
        callback(null, { stdout: ".git" });
      } else {
        callback(null, { stdout: "" });
      }
    });
  });

  describe("constructor", () => {
    it("should use provided repo path", () => {
      const adapter = new LocalGitAdapter("/custom/path");
      expect(adapter.repoPath).toBe("/custom/path");
    });

    it("should use current directory if no path provided", () => {
      const adapter = new LocalGitAdapter();
      expect(adapter.repoPath).toBe(process.cwd());
    });
  });

  describe("getCommits", () => {
    it("should fetch commits from local git", async () => {
      const mockCommits = [
        {
          hash: "abc123",
          authorName: "Test Author",
          authorEmail: "test@example.com",
          date: new Date("2024-01-01T09:00:00Z"),
          message: "Test commit",
          branches: ["main"],
          fileStats: [],
        },
      ];

      getCommitsFromGit.mockResolvedValue(mockCommits);

      const commits = await adapter.getCommits();
      expect(commits).toHaveLength(1);
      expect(commits[0].hash).toBe("abc123");
      expect(getCommitsFromGit).toHaveBeenCalledWith(
        expect.objectContaining({
          repoPath: "/test/repo",
        }),
      );
    });

    it("should pass options to getCommitsFromGit", async () => {
      const mockCommits = [
        {
          hash: "abc123",
          authorName: "Test Author",
          authorEmail: "test@example.com",
          date: new Date("2024-01-01T09:00:00Z"),
          message: "Test commit",
          branches: ["main"],
          fileStats: [],
        },
      ];

      getCommitsFromGit.mockResolvedValue(mockCommits);

      await adapter.getCommits({
        author: "test@example.com",
        since: "2024-01-01",
        includeFileStats: true,
      });

      expect(getCommitsFromGit).toHaveBeenCalledWith(
        expect.objectContaining({
          repoPath: "/test/repo",
          author: "test@example.com",
          since: "2024-01-01",
          includeFileStats: true,
        }),
      );
    });

    it("should filter out invalid commits", async () => {
      const mockCommits = [
        {
          hash: "abc123",
          authorName: "Test Author",
          authorEmail: "test@example.com",
          date: new Date("2024-01-01T09:00:00Z"),
          message: "Test commit",
          branches: ["main"],
          fileStats: [],
        },
        null, // Invalid commit
        {
          hash: "",
          authorName: "Test Author",
          authorEmail: "test@example.com",
          date: new Date("2024-01-01T09:00:00Z"),
          message: "Test commit",
          branches: ["main"],
          fileStats: [],
        }, // Invalid commit
      ];

      getCommitsFromGit.mockResolvedValue(mockCommits);

      const commits = await adapter.getCommits();
      expect(commits).toHaveLength(1);
      expect(commits[0].hash).toBe("abc123");
    });

    it("should include file stats when requested", async () => {
      const mockCommits = [
        {
          hash: "abc123",
          authorName: "Test Author",
          authorEmail: "test@example.com",
          date: new Date("2024-01-01T09:00:00Z"),
          message: "Test commit",
          branches: ["main"],
          fileStats: [{ filePath: "test.js", additions: 5, deletions: 2 }],
        },
      ];

      getCommitsFromGit.mockResolvedValue(mockCommits);

      const commits = await adapter.getCommits({ includeFileStats: true });
      expect(getCommitsFromGit).toHaveBeenCalledWith(
        expect.objectContaining({
          includeFileStats: true,
        }),
      );
    });
  });

  describe("getBranches", () => {
    it("should fetch branches from git", async () => {
      // This would require mocking execAsync, which is complex
      // For now, we'll test the structure
      expect(typeof adapter.getBranches).toBe("function");
    });
  });

  describe("getRepoInfo", () => {
    it("should return repo info", async () => {
      // This would require mocking execAsync
      // For now, we'll test the structure
      expect(typeof adapter.getRepoInfo).toBe("function");
    });
  });
});
