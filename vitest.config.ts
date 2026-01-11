import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],  // Only include unit tests
    exclude: [
      'node_modules/**',
      'dist/**',
      '**/*.spec.ts',  // Exclude Playwright specs
      '**/e2e/**'      // Exclude E2E directory
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'node_modules/**',
        'dist/**'
      ]
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
