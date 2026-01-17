import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    '@prisma/client',
    'prisma',
    'express',
    'bcrypt',
    'jsonwebtoken',
    'zod',
    'express-rate-limit',
    'passport',
    'passport-google-oauth20',
    'passport-github2',
    'passport-jwt',
    'nodemailer'
  ]
});
