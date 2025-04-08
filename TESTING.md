# Testing Guide

This document provides information about the test suite for the `serverless-aws-glue-workflows` plugin.

## Overview

The test suite uses Jest to test the core functionality of the plugin, including:

- Workflow validation
- Job resource generation
- Crawler resource generation
- Trigger creation and configuration
- Resource ID normalization
- Plugin lifecycle hooks

## Running Tests

To run the tests, use the following commands:

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch
```

## Test Structure

The tests are organized by component:

- `index.test.js` - Tests for the main plugin class and lifecycle hooks
- `workflow-manager.test.js` - Tests for workflow validation
- `job-manager.test.js` - Tests for job resource generation and trigger creation
- `crawler-manager.test.js` - Tests for crawler resource generation and trigger creation
- `resource-generator.test.js` - Tests for CloudFormation resource generation

## Coverage

The test suite aims to provide coverage of the plugin's functionality. Coverage reports are generated when running `npm run test:coverage` and can be found in the `coverage` directory.

## Continuous Integration

Tests are automatically run on GitHub Actions for every push and pull request to the main branch. The workflow configuration can be found in `.github/workflows/test.yml`.

## Contributing

When contributing new features or fixing bugs, please add or update tests to ensure the changes work as expected and don't introduce regressions.

For new features:
1. Add tests that verify the feature works correctly
2. Ensure existing tests still pass
3. Check that code coverage remains high

For bug fixes:
1. Add a test that reproduces the bug
2. Fix the bug
3. Verify that the test now passes