import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 15000,
    hookTimeout: 15000,
    reporters: ['verbose'],
    sequence: {
      // run test files sequentially so shared state (created IDs) is predictable
      concurrent: false,
    },
  },
});
