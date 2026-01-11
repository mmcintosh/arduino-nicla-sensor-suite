// Test setup file
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Global test setup
beforeAll(() => {
  console.log('🧪 Starting test suite...');
});

afterAll(() => {
  console.log('✅ Test suite completed');
});

// Reset state before each test
beforeEach(() => {
  // Could add global mocks or state resets here
});

afterEach(() => {
  // Cleanup after each test
});

// Mock environment variables for testing
process.env.ENVIRONMENT = 'test';
