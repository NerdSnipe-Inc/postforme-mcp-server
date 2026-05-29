import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  // Root explicitly to this directory so Vite doesn't walk up into the
  // parent Next.js project and pick up its postcss/tailwind config.
  root: resolve(__dirname),
  test: {
    environment: 'node',
    globals: true,
    restoreMocks: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
    },
  },
});
