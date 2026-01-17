# Auth-Bro - Production-Ready Authentication Library

Auth-Bro is a comprehensive authentication solution that provides secure user management, OAuth integration, and JWT-based session handling. Built with TypeScript for full type safety and designed for modern web applications.

## Features

- **Complete Authentication System** - User registration, login, password reset, and email verification
- **Multi-Database Support** - PostgreSQL, MySQL, SQLite, MongoDB, SQL Server, CockroachDB
- **OAuth Integration** - Google and GitHub authentication providers
- **Framework Agnostic** - Compatible with Express, Fastify, and Next.js
- **Security First** - JWT tokens, bcrypt password hashing, and rate limiting
- **TypeScript Native** - Complete type definitions and IntelliSense support
- **Developer Experience** - Clear error messages and comprehensive documentation

## Packages

This monorepo contains two packages:

### `@rupeshe/auth-bro` - Core Authentication Library
The main library that provides all authentication functionality including user management, OAuth providers, JWT handling, and security features.

### `@rupeshe/create-auth-bro` - CLI Tool
A command-line interface that bootstraps new projects with authentication already configured. Similar to `create-react-app` but for authentication.

## Installation

### Option 1: CLI Tool (Recommended)
For new projects, use the CLI to bootstrap a complete application with authentication:

```bash
npx @rupeshe/create-auth-bro@latest my-app
```

The CLI will prompt you to select:
- Framework (Express, Fastify, Next.js)
- Database (PostgreSQL, MySQL, SQLite, MongoDB)
- Authentication strategies (Email/Password, Google, GitHub)
- Additional features (Email verification, password reset, rate limiting)

### Option 2: Manual Installation
For existing projects, install the core library:

```bash
npm install @rupeshe/auth-bro @prisma/client
```

## Quick Start

```typescript
import express from 'express';
import { AuthKit } from '@rupeshe/auth-bro';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

// Initialize AuthKit with your configuration
const auth = new AuthKit({
  prisma,
  secret: process.env.JWT_SECRET!,
  strategies: {
    local: true, // Enable email/password authentication
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});

// Mount authentication routes
app.use('/api/auth', auth.getRouter());

// Protect routes with authentication middleware
app.get('/api/profile', auth.requireAuth(), (req, res) => {
  res.json({ user: req.user }); // Fully typed
});

app.listen(3000);
```

## API Reference

### Authentication Routes

All authentication routes are automatically mounted under `/api/auth`:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/github` - GitHub OAuth login

### Middleware

```typescript
// Require authentication
app.get('/protected', auth.requireAuth(), (req, res) => {
  // Only authenticated users can access
});

// Require specific role
app.get('/admin', auth.requireAuth(['admin']), (req, res) => {
  // Only admin users can access
});
```

## 📚 Documentation

- [Getting Started](./packages/authkit/README.md)
- [API Reference](./packages/authkit/docs/api.md)
- [CLI Guide](./packages/create-authkit/README.md)

## Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/authkit"

# Email Service (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### AuthKit Configuration

```typescript
const auth = new AuthKit({
  prisma: new PrismaClient(),
  secret: process.env.JWT_SECRET!,

  // Authentication strategies
  strategies: {
    local: true, // Email/password
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },

  // Email configuration
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASS!,
    },
  },

  // Security settings
  security: {
    rateLimit: { windowMs: 15 * 60 * 1000, max: 100 },
    bcryptRounds: 12,
  },
});
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/Rupe88/auth-bro/issues)
- **Documentation**: Comprehensive API docs available in package READMEs
