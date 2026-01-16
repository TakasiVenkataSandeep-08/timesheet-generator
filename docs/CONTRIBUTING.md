# Contributing Guide

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Run with coverage: `npm run test:coverage`

## Code Style

- Use ES6+ features
- Follow existing code patterns
- Add JSDoc comments for public methods
- Keep functions focused and small

## Testing

- Write tests for new features
- Maintain >80% coverage
- Test edge cases
- Mock external APIs

## Adding Features

### New Formatter

1. Create formatter class extending `OutputFormatter`
2. Implement `format(timesheet)` method
3. Register in `src/formatters/index.js`
4. Add tests

### New Adapter

1. Create adapter class extending `VCSAdapter`
2. Implement required methods
3. Register in `src/adapters/index.js`
4. Add tests

### New Utility

1. Create utility file in `src/utils/`
2. Export functions
3. Add tests
4. Document usage

## Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Update documentation
6. Submit PR with description

## Commit Messages

Use conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `test:` for tests
- `refactor:` for refactoring

## Questions?

Open an issue or discussion on GitHub.

