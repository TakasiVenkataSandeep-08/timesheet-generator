/**
 * Tests for branch utilities
 */

const { matchesPattern, filterBranches, extractProjectFromBranch } = require('../../../src/utils/branchUtils');

describe('branchUtils', () => {
  describe('matchesPattern', () => {
    test('should match simple patterns', () => {
      expect(matchesPattern('feature/test', 'feature/*')).toBe(true);
      expect(matchesPattern('bugfix/issue-123', 'bugfix/*')).toBe(true);
      expect(matchesPattern('main', 'main')).toBe(true);
    });

    test('should match complex patterns', () => {
      expect(matchesPattern('feature/PROJ-123-test', 'feature/*-test')).toBe(true);
      expect(matchesPattern('release/v1.2.3', 'release/v*.*.*')).toBe(true);
      expect(matchesPattern('hotfix/2024-01-15', 'hotfix/????-??-??')).toBe(true);
    });

    test('should handle character classes', () => {
      expect(matchesPattern('feature/A-123', 'feature/[A-Z]-*')).toBe(true);
      expect(matchesPattern('feature/a-123', 'feature/[A-Z]-*')).toBe(false);
      expect(matchesPattern('feature/1-123', 'feature/[0-9]-*')).toBe(true);
    });

    test('should handle double asterisk', () => {
      expect(matchesPattern('feature/sub/feature/test', 'feature/**')).toBe(true);
      expect(matchesPattern('feature/test', 'feature/**')).toBe(true);
      expect(matchesPattern('bugfix/test', 'feature/**')).toBe(false);
    });

    test('should handle groups', () => {
      expect(matchesPattern('feature/test', '(feature|bugfix)/*')).toBe(true);
      expect(matchesPattern('bugfix/test', '(feature|bugfix)/*')).toBe(true);
      expect(matchesPattern('release/test', '(feature|bugfix)/*')).toBe(false);
    });

    test('should handle "all" pattern', () => {
      expect(matchesPattern('any-branch', 'all')).toBe(true);
      expect(matchesPattern('any-branch', null)).toBe(true);
      expect(matchesPattern('any-branch', '')).toBe(true);
    });

    test('should handle negation in filterBranches', () => {
      const branches = ['feature/test', 'feature/prod', 'bugfix/issue', 'main'];
      
      // Include only feature branches
      const featureOnly = filterBranches(branches, 'feature/*');
      expect(featureOnly).toEqual(['feature/test', 'feature/prod']);
      
      // Include all but main
      const notMain = filterBranches(branches, ['!main']);
      expect(notMain).toEqual(['feature/test', 'feature/prod', 'bugfix/issue']);
      
      // Include feature but not prod
      const featureNotProd = filterBranches(branches, ['feature/*', '!feature/prod']);
      expect(featureNotProd).toEqual(['feature/test']);
    });
  });

  describe('filterBranches', () => {
    test('should filter single pattern', () => {
      const branches = ['feature/test', 'bugfix/issue', 'main', 'develop'];
      const filtered = filterBranches(branches, 'feature/*');
      expect(filtered).toEqual(['feature/test']);
    });

    test('should filter multiple patterns', () => {
      const branches = ['feature/test', 'bugfix/issue', 'main', 'develop'];
      const filtered = filterBranches(branches, ['feature/*', 'main']);
      expect(filtered).toEqual(['feature/test', 'main']);
    });

    test('should handle "all" pattern', () => {
      const branches = ['feature/test', 'bugfix/issue', 'main'];
      const filtered = filterBranches(branches, 'all');
      expect(filtered).toEqual(branches);
    });

    test('should handle empty patterns', () => {
      const branches = ['feature/test', 'bugfix/issue', 'main'];
      const filtered = filterBranches(branches, null);
      expect(filtered).toEqual(branches);
    });

    test('should handle negation patterns', () => {
      const branches = ['feature/test', 'feature/prod', 'bugfix/issue', 'main'];
      const filtered = filterBranches(branches, ['feature/*', '!feature/prod']);
      expect(filtered).toEqual(['feature/test']);
    });
  });

  describe('extractProjectFromBranch', () => {
    test('should extract project from feature branches', () => {
      expect(extractProjectFromBranch('feature/PROJ-123-test')).toBe('PROJ-123');
      expect(extractProjectFromBranch('feature/ABC-456-fix')).toBe('ABC-456');
    });

    test('should extract project from bugfix branches', () => {
      expect(extractProjectFromBranch('bugfix/PROJ-789-issue')).toBe('PROJ-789');
      expect(extractProjectFromBranch('bugfix/XYZ-999-bug')).toBe('XYZ-999');
    });

    test('should extract project from standalone patterns', () => {
      expect(extractProjectFromBranch('PROJ-123-feature')).toBe('PROJ-123');
      expect(extractProjectFromBranch('ABC-456-hotfix')).toBe('ABC-456');
    });

    test('should handle simple branch names', () => {
      expect(extractProjectFromBranch('feature/test')).toBe('feature');
      expect(extractProjectFromBranch('develop')).toBe('develop');
    });

    test('should return null for no match', () => {
      expect(extractProjectFromBranch('random-branch')).toBe(null);
      expect(extractProjectFromBranch('')).toBe(null);
    });
  });
});
