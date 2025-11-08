# Contributing to Vedika JavaScript SDK

Thank you for your interest in contributing to the Vedika JavaScript SDK! We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, error messages)
- **Describe the behavior you observed** and what you expected
- **Include your environment details** (Node.js version, OS, SDK version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful** to most users
- **List some examples** of how it would be used

### Pull Requests

We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code follows the style guide
6. Submit your pull request!

## Development Setup

### Prerequisites

- Node.js 14.0.0 or higher
- npm or yarn
- TypeScript

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/vedika-sdk-javascript.git
cd vedika-sdk-javascript

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Project Structure

```
vedika-sdk-javascript/
├── src/                 # TypeScript source files
│   ├── index.ts         # Main exports
│   ├── client.ts        # VedikaClient class
│   ├── types.ts         # Type definitions
│   └── exceptions.ts    # Custom exceptions
├── dist/                # Compiled JavaScript (generated)
├── tests/               # Test suite
├── examples/            # Example scripts
├── package.json         # Package configuration
└── tsconfig.json        # TypeScript configuration
```

## Pull Request Process

1. **Update documentation**: If you've changed APIs or added features, update the README.md and JSDoc comments
2. **Add tests**: Ensure your changes are covered by tests
3. **Run tests**: Make sure all tests pass
4. **Update CHANGELOG.md**: Add a note about your changes under "Unreleased"
5. **Follow code style**: Use Prettier for formatting, ESLint for linting
6. **Write clear commit messages**: Use conventional commit format

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(client): add support for batch queries
fix(types): handle null values in birth chart response
docs(readme): update installation instructions
```

## Style Guide

### TypeScript Code Style

We follow standard TypeScript best practices:

- **Formatting**: Use [Prettier](https://prettier.io/)
- **Linting**: Use [ESLint](https://eslint.org/)
- **Type safety**: Enable strict mode in tsconfig.json
- **Documentation**: Use JSDoc comments for all public APIs

### Code Formatting

```bash
# Format code with Prettier
npm run format

# Lint with ESLint
npm run lint

# Build TypeScript
npm run build
```

### Example Code

```typescript
/**
 * Brief description of the function
 *
 * Longer description if needed.
 *
 * @param param1 - Description of param1
 * @param param2 - Description of param2
 * @param param3 - Description of param3 (optional)
 * @returns Description of return value
 * @throws {ValueError} When param2 is negative
 *
 * @example
 * ```typescript
 * const result = exampleFunction('test', 42);
 * console.log(result); // 'test-42'
 * ```
 */
export function exampleFunction(
  param1: string,
  param2: number,
  param3?: Record<string, any>
): string {
  if (param2 < 0) {
    throw new Error('param2 must be non-negative');
  }

  return `${param1}-${param2}`;
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- test/client.test.ts

# Watch mode
npm test -- --watch
```

### Writing Tests

- Use Jest for testing
- Aim for >90% code coverage
- Test both success and failure cases
- Use mocks for external API calls

Example test:

```typescript
import { VedikaClient } from '../src';
import { AuthenticationError } from '../src/exceptions';

describe('VedikaClient', () => {
  it('should require API key', () => {
    expect(() => {
      new VedikaClient({ apiKey: '' });
    }).toThrow(AuthenticationError);
  });

  it('should ask question successfully', async () => {
    const client = new VedikaClient({ apiKey: 'vk_test_key' });

    const response = await client.askQuestion({
      question: 'Test question',
      birthDetails: {
        datetime: '1990-06-15T14:30:00+05:30',
        latitude: 28.6139,
        longitude: 77.2090
      }
    });

    expect(response.answer).toBeDefined();
    expect(response.confidence).toBeGreaterThan(0);
  });
});
```

## Documentation

### JSDoc Guidelines

Use JSDoc format for all public APIs:

```typescript
/**
 * Brief description (one line)
 *
 * Longer description if needed (can be multiple paragraphs).
 *
 * @param arg1 - Description of arg1
 * @param arg2 - Description of arg2
 * @returns Description of return value
 * @throws {ValueError} When arguments are invalid
 *
 * @example
 * ```typescript
 * const result = functionName('test', 42);
 * console.log(result); // true
 * ```
 */
export function functionName(arg1: string, arg2: number): boolean {
  // Implementation
}
```

### README Updates

If you add new features:

1. Update the feature list in README.md
2. Add code examples showing usage
3. Update the table of contents if needed

## Questions?

- Open an issue for questions
- Email support@vedika.io
- Join our community discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Vedika! 🙏
