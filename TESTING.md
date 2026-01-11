# Testing Guide

## Overview

This project uses **Vitest** for testing, following SonicJS patterns. The test suite includes:

- ✅ **API Endpoint Tests** - Test all REST API routes
- ✅ **Database Operation Tests** - Test data storage and retrieval
- ✅ **Utility Function Tests** - Test helper functions
- ✅ **Integration Tests** - Test complete workflows
- ✅ **Validation Tests** - Test input validation

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode (during development)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run specific test suite
npm run test:api      # API tests only
npm run test:db       # Database tests only

# Run with coverage
npm run test:coverage
```

## Test Structure

```
tests/
├── api/
│   ├── sessions.test.ts        # Session management endpoints
│   ├── sensor-data.test.ts     # Sensor data ingestion
│   └── analytics.test.ts       # Analytics and export
├── utils/
│   └── helpers.test.ts         # Utility functions
├── fixtures/
│   └── mock-data.ts            # Test fixtures and mocks
├── integration.test.ts         # End-to-end workflows
└── setup.ts                    # Test configuration
```

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something', () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

### Testing API Endpoints

```typescript
import { Hono } from 'hono';
import { createMockEnv } from '../fixtures/mock-data';
import myRoute from '../../src/routes/my-route';

describe('API - My Route', () => {
  let app: Hono;
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = createMockEnv();
    app = new Hono();
    app.route('/api/my-route', myRoute);
  });

  it('should handle POST request', async () => {
    const req = new Request('http://localhost/api/my-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'test' })
    });

    const res = await app.fetch(req, mockEnv);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
```

### Using Test Fixtures

```typescript
import { 
  mockSession, 
  mockSensorReading, 
  mockBatchReadings 
} from '../fixtures/mock-data';

// Use pre-built test data
const session = mockSession;
const reading = mockSensorReading;
```

### Testing Database Operations

```typescript
import { createMockEnv } from '../fixtures/mock-data';

const mockEnv = createMockEnv();

// Insert test data
mockEnv.DB.insertSession(mockSession);
mockEnv.DB.insertReading(mockSensorReading);

// Verify data
const sessions = mockEnv.DB.getSessions();
expect(sessions).toHaveLength(1);
```

## Test Coverage

### Current Coverage

Run `npm run test:coverage` to see detailed coverage report.

Target coverage:
- ✅ Statements: >80%
- ✅ Branches: >75%
- ✅ Functions: >80%
- ✅ Lines: >80%

### Coverage Reports

After running `npm run test:coverage`:
- HTML report: `coverage/index.html`
- JSON report: `coverage/coverage-final.json`
- Text summary in terminal

```bash
# Open HTML coverage report
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

## Continuous Integration

### GitHub Actions

Tests run automatically on:
- ✅ Every push to `main` or `develop`
- ✅ Every pull request
- ✅ Multiple Node.js versions (18.x, 20.x)

Workflow file: `.github/workflows/test.yml`

### CI/CD Pipeline

1. **Lint** - Check code style
2. **Build** - Compile TypeScript
3. **Test** - Run all tests
4. **Coverage** - Upload to Codecov

## Test Commands Reference

```bash
# Basic
npm test                    # Run all tests once
npm run test:watch          # Watch mode for development
npm run test:ui             # Visual test interface

# Specific Tests
npm run test:api            # API endpoint tests
npm run test:db             # Database tests
vitest run path/to/test.ts  # Single test file

# Coverage
npm run test:coverage       # Generate coverage report

# Debugging
DEBUG=* npm test            # Verbose output
node --inspect-brk node_modules/.bin/vitest  # Debug in Chrome
```

## Best Practices

### 1. Test Organization

```typescript
describe('Component/Feature', () => {
  describe('Method/Endpoint', () => {
    it('should handle success case', () => {});
    it('should handle error case', () => {});
    it('should validate input', () => {});
  });
});
```

### 2. Test Naming

✅ **Good**:
```typescript
it('should create session with valid data')
it('should reject session without name')
it('should return 404 for non-existent session')
```

❌ **Bad**:
```typescript
it('test 1')
it('works')
it('should do stuff')
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should calculate average temperature', () => {
  // Arrange - Set up test data
  const readings = [20, 22, 24];

  // Act - Execute the code
  const avg = calculateAverage(readings);

  // Assert - Verify result
  expect(avg).toBe(22);
});
```

### 4. Mock External Dependencies

```typescript
// Use createMockEnv() for D1 database
const mockEnv = createMockEnv();

// Mock time-dependent functions
vi.useFakeTimers();
vi.setSystemTime(new Date('2024-01-01'));
```

### 5. Clean Up After Tests

```typescript
afterEach(() => {
  // Clear database
  mockEnv.DB.clear();
  
  // Restore mocks
  vi.restoreAllMocks();
});
```

## Common Test Scenarios

### Testing Sessions

```typescript
// Create session
const startReq = new Request('/api/sessions/start', {
  method: 'POST',
  body: JSON.stringify({ name: 'Test Session' })
});
const res = await app.fetch(startReq, mockEnv);
const { session } = await res.json();

// Stop session
const stopReq = new Request(`/api/sessions/${session.id}/stop`, {
  method: 'POST'
});
await app.fetch(stopReq, mockEnv);
```

### Testing Sensor Data

```typescript
// Single reading
const dataReq = new Request('/api/sensor-data', {
  method: 'POST',
  body: JSON.stringify(mockSensorReading)
});
const res = await app.fetch(dataReq, mockEnv);

// Batch readings
const batchReq = new Request('/api/sensor-data/batch', {
  method: 'POST',
  body: JSON.stringify({ readings: mockBatchReadings })
});
const res = await app.fetch(batchReq, mockEnv);
```

### Testing Analytics

```typescript
const analyticsReq = new Request(`/api/analytics/sessions/${sessionId}`);
const res = await app.fetch(analyticsReq, mockEnv);
const data = await res.json();

expect(data.statistics.temp_avg).toBeDefined();
expect(data.statistics.temp_min).toBeLessThan(data.statistics.temp_max);
```

## Debugging Tests

### VS Code Launch Configuration

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test:watch"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Chrome DevTools

```bash
# Start test with inspector
node --inspect-brk ./node_modules/.bin/vitest

# Open chrome://inspect in Chrome
# Click "inspect" next to the process
```

### Console Logging

```typescript
it('should do something', () => {
  console.log('Debug info:', variable);
  // Test code
});
```

## Adding New Tests

1. **Create test file** in appropriate directory:
   - API tests: `tests/api/`
   - Utils tests: `tests/utils/`
   - Integration: `tests/`

2. **Follow naming convention**: `*.test.ts`

3. **Import dependencies**:
   ```typescript
   import { describe, it, expect, beforeEach } from 'vitest';
   ```

4. **Use fixtures** from `tests/fixtures/mock-data.ts`

5. **Run tests**: `npm run test:watch`

6. **Verify coverage**: `npm run test:coverage`

## Troubleshooting

### Tests Hanging

```bash
# Increase timeout in vitest.config.ts
testTimeout: 30000  // 30 seconds
```

### Mock Database Not Working

```typescript
// Ensure you're using createMockEnv()
const mockEnv = createMockEnv();

// Clear between tests
afterEach(() => {
  mockEnv.DB.clear();
});
```

### Type Errors

```bash
# Rebuild TypeScript
npm run build

# Check tsconfig.json includes test files
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Hono Testing Guide](https://hono.dev/getting-started/testing)
- [Cloudflare Workers Testing](https://developers.cloudflare.com/workers/testing/)
- [Testing Best Practices](https://testingjavascript.com/)

## Contributing Tests

When adding new features:

1. ✅ Write tests for new endpoints
2. ✅ Add integration tests for workflows
3. ✅ Update test fixtures if needed
4. ✅ Maintain >80% coverage
5. ✅ Ensure all tests pass in CI

```bash
# Before submitting PR
npm test
npm run lint
npm run build
```

---

**Happy Testing!** 🧪

For questions or issues, please open a GitHub issue.
