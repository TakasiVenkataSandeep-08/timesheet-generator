/**
 * Integration tests for --all-branches functionality
 */

const { getAdapter } = require("../../src/adapters");
const { filterBranches } = require("../../src/utils/branchUtils");
const path = require("path");
const fs = require("fs");

describe("--all-branches Integration Tests", () => {
  const testRepoPath = path.join(__dirname, "../fixtures/test-repo");

  beforeAll(() => {
    // Create a test repository if it doesn't exist
    if (!fs.existsSync(testRepoPath)) {
      fs.mkdirSync(testRepoPath, { recursive: true });

      // Initialize git repo and create branches
      const { execSync } = require("child_process");
      execSync("git init", { cwd: testRepoPath });
      execSync('git config user.name "Test User"', { cwd: testRepoPath });
      execSync('git config user.email "test@example.com"', {
        cwd: testRepoPath,
      });

      // Create initial commit on master
      fs.writeFileSync(path.join(testRepoPath, "file1.txt"), "content1");
      execSync("git add .", { cwd: testRepoPath });
      execSync('git commit -m "Initial commit"', { cwd: testRepoPath });

      // Create feature branch
      execSync("git checkout -b feature/test", { cwd: testRepoPath });
      fs.writeFileSync(path.join(testRepoPath, "file2.txt"), "content2");
      execSync("git add .", { cwd: testRepoPath });
      execSync('git commit -m "Feature commit"', { cwd: testRepoPath });

      // Return to master
      execSync("git checkout master", { cwd: testRepoPath });
    }
  });

  describe("LocalGitAdapter", () => {
    let adapter;

    beforeEach(() => {
      adapter = getAdapter("local", testRepoPath);
    });

    test("should fetch all branches", async () => {
      const branches = await adapter.getBranches();
      expect(branches).toContain("master");
      expect(branches).toContain("feature/test");
    });

    test("should get commits from all branches", async () => {
      const commits = await adapter.getCommits({
        branches: ["master", "feature/test"],
      });

      expect(commits.length).toBeGreaterThan(0);

      // Should have commits from all branches
      const commitMessages = commits.map((c) => c.message);
      expect(commitMessages.some((m) => m.includes("Initial commit"))).toBe(
        true,
      );
      expect(commitMessages.some((m) => m.includes("Feature commit"))).toBe(
        true,
      );
    });

    test("should handle branch filtering", async () => {
      const allBranches = await adapter.getBranches();
      const featureBranches = filterBranches(allBranches, "feature/*");

      expect(featureBranches).toContain("feature/test");
      expect(featureBranches).not.toContain("master");
    });

    test("should handle negation patterns", async () => {
      const allBranches = await adapter.getBranches();
      const notMasterBranches = filterBranches(allBranches, ["!master"]);

      expect(notMasterBranches).toContain("feature/test");
      expect(notMasterBranches).not.toContain("master");
    });

    test("should deduplicate commits across branches", async () => {
      // The initial commit should appear on all branches but only be returned once
      const commits = await adapter.getCommits({
        branches: ["master", "feature/test"],
      });

      const initialCommits = commits.filter((c) =>
        c.message.includes("Initial commit"),
      );
      expect(initialCommits).toHaveLength(1);

      // The initial commit should have all branches in its branch list
      const initialCommit = initialCommits[0];
      expect(initialCommit.branches).toContain("master");
      expect(initialCommit.branches).toContain("feature/test");
    });
  });

  describe("Multi-branch Performance", () => {
    test("should handle many branches efficiently", async () => {
      const adapter = getAdapter("local", testRepoPath);

      // Simulate many branches
      const startTime = Date.now();
      const branches = await adapter.getBranches();
      const commits = await adapter.getCommits({ branches });
      const endTime = Date.now();

      // Should complete within reasonable time (5 seconds for test repo)
      expect(endTime - startTime).toBeLessThan(5000);
      expect(commits.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid repository path", async () => {
      const adapter = getAdapter("local", "/non/existent/path");

      // Should return empty branches for invalid path
      const branches = await adapter.getBranches();
      expect(branches).toEqual([]);

      // Should throw for getCommits on invalid path
      await expect(adapter.getCommits()).rejects.toThrow();
    });

    test("should handle non-existent branches gracefully", async () => {
      const adapter = getAdapter("local", testRepoPath);

      // Should throw for non-existent branch when using single branch
      await expect(
        adapter.getCommits({
          branches: ["non-existent-branch"],
        }),
      ).rejects.toThrow("non-existent-branch");
    });
  });

  describe("Branch Caching", () => {
    test("should cache branch results", async () => {
      const adapter = getAdapter("local", testRepoPath);

      // First call should fetch from git
      const startTime1 = Date.now();
      const branches1 = await adapter.getBranches();
      const endTime1 = Date.now();

      // Second call should be faster (from cache) or at least not slower
      const startTime2 = Date.now();
      const branches2 = await adapter.getBranches();
      const endTime2 = Date.now();

      expect(branches1).toEqual(branches2);
      // Cache should be faster or at least not significantly slower
      expect(endTime2 - startTime2).toBeLessThanOrEqual(
        endTime1 - startTime1 + 50,
      ); // Allow small variance
    });
  });
});
