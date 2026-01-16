const CommitAnalyzer = require('../../../src/core/CommitAnalyzer');

describe('CommitAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new CommitAnalyzer();
  });

  describe('extractTickets', () => {
    it('should extract Jira ticket format', () => {
      const message = 'PROJ-123: Fix bug';
      const tickets = analyzer.extractTickets(message);
      expect(tickets).toContain('PROJ-123');
    });

    it('should extract Linear ticket format', () => {
      const message = 'PROJ-456: Add feature';
      const tickets = analyzer.extractTickets(message);
      expect(tickets).toContain('PROJ-456');
    });

    it('should extract GitHub issue format', () => {
      const message = 'Fix issue #789';
      const tickets = analyzer.extractTickets(message);
      expect(tickets.length).toBeGreaterThan(0);
    });

    it('should extract multiple tickets', () => {
      const message = 'PROJ-123 and PROJ-456: Related fixes';
      const tickets = analyzer.extractTickets(message);
      expect(tickets.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array for no tickets', () => {
      const message = 'Regular commit message';
      const tickets = analyzer.extractTickets(message);
      expect(tickets).toEqual([]);
    });

    it('should deduplicate tickets', () => {
      const message = 'PROJ-123 PROJ-123: Duplicate ticket';
      const tickets = analyzer.extractTickets(message);
      expect(tickets.filter(t => t === 'PROJ-123').length).toBe(1);
    });
  });

  describe('categorizeProject', () => {
    it('should categorize from branch name', () => {
      const commit = {
        hash: 'abc123',
        branches: ['feature/project-name'],
        message: 'test',
      };

      const project = analyzer.categorizeProject(commit);
      expect(project).toBe('project-name');
    });

    it('should categorize from configured branch patterns', () => {
      const config = {
        projects: {
          'frontend': {
            branches: ['feature/frontend/*', 'fix/frontend/*'],
          },
        },
      };
      const analyzerWithConfig = new CommitAnalyzer(config);

      const commit = {
        hash: 'abc123',
        branches: ['feature/frontend/new-feature'],
        message: 'test',
      };

      const project = analyzerWithConfig.categorizeProject(commit);
      expect(project).toBe('frontend');
    });

    it('should categorize from file paths', () => {
      const config = {
        projects: {
          'backend': {
            files: ['src/backend/**', 'api/**'],
          },
        },
      };
      const analyzerWithConfig = new CommitAnalyzer(config);

      const commit = {
        hash: 'abc123',
        branches: [],
        message: 'test',
        fileStats: [
          { filePath: 'src/backend/service.js', additions: 10, deletions: 5 },
        ],
      };

      const project = analyzerWithConfig.categorizeProject(commit);
      expect(project).toBe('backend');
    });

    it('should categorize from commit message keywords', () => {
      const config = {
        projects: {
          'mobile': {
            keywords: ['mobile', 'ios', 'android'],
          },
        },
      };
      const analyzerWithConfig = new CommitAnalyzer(config);

      const commit = {
        hash: 'abc123',
        branches: [],
        message: 'mobile: Add new feature',
        fileStats: [],
      };

      const project = analyzerWithConfig.categorizeProject(commit);
      expect(project).toBe('mobile');
    });

    it('should return null when no project matches', () => {
      const commit = {
        hash: 'abc123',
        branches: [],
        message: 'test',
        fileStats: [],
      };

      const project = analyzer.categorizeProject(commit);
      expect(project).toBeNull();
    });
  });

  describe('analyzeFileTypes', () => {
    it('should categorize frontend files', () => {
      const fileStats = [
        { filePath: 'src/components/Button.tsx', additions: 10, deletions: 5 },
        { filePath: 'src/styles.css', additions: 20, deletions: 0 },
      ];

      const result = analyzer.analyzeFileTypes(fileStats);
      expect(result.frontend.length).toBeGreaterThan(0);
    });

    it('should categorize backend files', () => {
      const fileStats = [
        { filePath: 'src/api/service.py', additions: 10, deletions: 5 },
      ];

      const result = analyzer.analyzeFileTypes(fileStats);
      expect(result.backend.length).toBeGreaterThan(0);
    });

    it('should categorize test files', () => {
      const fileStats = [
        { filePath: 'src/components/Button.test.js', additions: 10, deletions: 5 },
      ];

      const result = analyzer.analyzeFileTypes(fileStats);
      expect(result.tests.length).toBeGreaterThan(0);
    });

    it('should categorize documentation files', () => {
      const fileStats = [
        { filePath: 'README.md', additions: 10, deletions: 5 },
      ];

      const result = analyzer.analyzeFileTypes(fileStats);
      expect(result.docs.length).toBeGreaterThan(0);
    });

    it('should categorize config files', () => {
      const fileStats = [
        { filePath: 'package.json', additions: 10, deletions: 5 },
        { filePath: 'config.yaml', additions: 5, deletions: 2 },
      ];

      const result = analyzer.analyzeFileTypes(fileStats);
      expect(result.config.length).toBeGreaterThan(0);
    });

    it('should categorize unknown files as other', () => {
      const fileStats = [
        { filePath: 'unknown.xyz', additions: 10, deletions: 5 },
      ];

      const result = analyzer.analyzeFileTypes(fileStats);
      expect(result.other.length).toBeGreaterThan(0);
    });
  });

  describe('analyze', () => {
    it('should analyze a single commit', () => {
      const commit = {
        hash: 'abc123',
        date: new Date('2024-01-01T09:00:00Z'),
        authorName: 'Test User',
        authorEmail: 'test@example.com',
        message: 'PROJ-123: Fix bug',
        branches: ['main'],
        fileStats: [],
      };

      const result = analyzer.analyze(commit);
      expect(result).toHaveProperty('tickets');
      expect(result).toHaveProperty('project');
      expect(result).toHaveProperty('fileTypes');
      expect(result.tickets).toContain('PROJ-123');
    });
  });

  describe('analyzeBatch', () => {
    it('should analyze multiple commits', () => {
      const commits = [
        {
          hash: 'abc123',
          date: new Date('2024-01-01T09:00:00Z'),
          message: 'PROJ-123: First',
          fileStats: [],
        },
        {
          hash: 'def456',
          date: new Date('2024-01-01T10:00:00Z'),
          message: 'PROJ-456: Second',
          fileStats: [],
        },
      ];

      const results = analyzer.analyzeBatch(commits);
      expect(results).toHaveLength(2);
      expect(results[0].tickets).toContain('PROJ-123');
      expect(results[1].tickets).toContain('PROJ-456');
    });
  });
});

