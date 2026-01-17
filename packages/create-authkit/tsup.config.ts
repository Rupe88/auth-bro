import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'es2022',
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  external: [/node_modules/],
  banner: {
    js: '#!/usr/bin/env node',
  },
});
