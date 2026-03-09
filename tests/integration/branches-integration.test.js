/**
 * Integration tests for --all-branches functionality
 */

const { getAdapter } = require('../../src/adapters');
const { filterBranches } = require('../../src/utils/branchUtils');
const path = require('path');
const fs = require('fs');

describe('--all-branches Integration Tests', () => {
  const testRepoPath = path.join(__dirname, '../fixtures/test-repo');
  
  beforeAll(() => {
    // Create a test repository if it doesn't exist
    if (!fs.existsSync(testRepoPath)) {
      fs.mkdirSync(testRepoPath, { recursive: true });
      
      // Initialize git repo and create branches
      const { execSync } = require('child_process');
      execSync('git init', { cwd: testRepoPath });
      execSync('git config user.name "Test User"', { cwd: testRepoPath });
      execSync('git config user.email "test@example.com"', { cwd: testRepoPath });
      
      // Create initial commit
      fs.writeFileSync(path.join(testRepoPath, 'file1.txt'), 'content1');
      execSync('git add .', { cwd: testRepoPath });
      execSync('git commit -m "Initial commit"', { cwd: testRepoPath });
      
      // Create feature branch with commits
      execSync('git checkout -b feature/test', { cwd: testRepoPath });
      fs.writeFileSync(path.join(testRepoPath, 'file2.txt'), 'content2');
      execSync('git add .', { cwd: testRepoPath });
      execSync('git commit -m "Feature commit"', { cwd: testRepoPath });
      
      // Create bugfix branch
      execSync('git checkout main', { cwd: testRepoPath });
      execSync('git checkout -b bugfix/issue-123', { cwd: testRepoPath });
      fs.writeFileSync(path.join(testRepoPath, 'file3.txt'), 'content3');
      execSync('git add .', { cwd: testRepoPath });
      execSync('git commit -m "Bugfix commit"', { cwd: testRepoPath });
      
      // Return to main
      execSync('git checkout main', { cwd: testRepoPath });
    }
  });

  describe('LocalGitAdapter', () => {
    let adapter;
    
    beforeEach(() => {
      adapter = getAdapter('local', testRepoPath);
    });

    test('should fetch all branches', async () => {
      const branches = await adapter.getBranches();
      expect(branches).toContain('main');
      expect(branches).toContain('feature/test');
      expect(branches).toContain('bugfix/issue-123');
    });

    test('should get commits from all branches', async () => {
      const commits = await adapter.getCommits({ branches: ['main', 'feature/test', 'bugfix/issue-123'] });
      
      expect(commits.length).toBeGreaterThan(0);
      
      // Should have commits from all branches
      const commitMessages = commits.map(c => c.message);
      expect(commitMessages.some(m => m.includes('Initial commit'))).toBe(true);
      expect(commitMessages.some(m => m.includes('Feature commit'))).toBe(true);
      expect(commitMessages.some(m => m.includes('Bugfix commit'))).toBe(true);
    });

    test('should handle branch filtering', async () => {
      const allBranches = await adapter.getBranches();
      const featureBranches = filterBranches(allBranches, 'feature/*');
      
      expect(featureBranches).toContain('feature/test');
      expect(featureBranches).not.toContain('main');
      expect(featureBranches).not.toContain('bugfix/issue-123');
    });

    test('should handle negation patterns', async () => {
      const allBranches = await adapter.getBranches();
      const notMainBranches = filterBranches(allBranches, ['!main']);
      
      expect(notMainBranches).toContain('feature/test');
      expect(notMainBranches).toContain('bugfix/issue-123');
      expect(notMainBranches).not.toContain('main');
    });

    test('should deduplicate commits across branches', async () => {
      // The initial commit should appear on all branches but only be returned once
      const commits = await adapter.getCommits({ branches: ['main', 'feature/test', 'bugfix/issue-123'] });
      
      const initialCommits = commits.filter(c => c.message.includes('Initial commit'));
      expect(initialCommits).toHaveLength(1);
      
      // The initial commit should have all branches in its branch list
      const initialCommit = initialCommits[0];
      expect(initialCommit.branches).toContain('main');
      expect(initialCommit.branches).toContain('feature/test');
      expect(initialCommit.branches).toContain('bugfix/issue-123');
    });
  });

  describe('Multi-branch Performance', () => {
    test('should handle many branches efficiently', async () => {
      const adapter = getAdapter('local', testRepoPath);
      
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

  describe('Error Handling', () => {
    test('should handle invalid repository path', async () => {
      const adapter = getAdapter('local', '/invalid/path');
      
      await expect(adapter.getBranches()).rejects.toThrow();
      await expect(adapter.getCommits()).rejects.toThrow();
    });

    test('should handle non-existent branches', async () => {
      const adapter = getAdapter('local', testRepoPath);
      
      // Should not throw, but return empty commits
      const commits = await adapter.getCommits({ branches: ['non-existent-branch'] });
      expect(commits).toHaveLength(0);
    });
  });

  describe('Branch Caching', () => {
    test('should cache branch results', async () => {
      const adapter = getAdapter('local', testRepoPath);
      
      // First call should fetch from git
      const startTime1 = Date.now();
      const branches1 = await adapter.getBranches();
      const endTime1 = Date.now();
      
      // Second call should be faster (from cache)
      const startTime2 = Date.now();
      const branches2 = await adapter.getBranches();
      const endTime2 = Date.now();
      
      expect(branches1).toEqual(branches2);
      expect(endTime2 - startTime2).toBeLessThan(endTime1 - startTime1);
    });
  });
});
