# AuthKit - Core Authentication Library

A production-ready authentication library with TypeScript, Prisma, and multi-database support.

## 📦 Installation

```bash
npm install authkit @prisma/client
# Also install your database driver
npm install prisma
```

## 🚀 Quick Start

```typescript
import express from 'express';
import { AuthKit } from 'authkit';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

// Initialize AuthKit
const auth = new AuthKit({
  prisma,
  secret: process.env.JWT_SECRET!,
  strategies: {
    local: true, // Email/password
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});

// Mount auth routes (auto-generated)
app.use('/api/auth', auth.getRouter());

// Protected route example
app.get('/api/profile',
  auth.requireAuth(),
  (req, res) => {
    res.json({ user: req.user });
  }
);

app.listen(3000);
```

## 🗄️ Database Setup

AuthKit supports multiple databases via Prisma. Generate your schema:

```typescript
import { AuthKit } from 'authkit';

// Generate Prisma schema for PostgreSQL
const schema = AuthKit.generateSchema('postgresql');

// Generate environment variables template
const envTemplate = AuthKit.generateEnv('postgresql');

// Generate Docker Compose
const dockerCompose = AuthKit.generateDockerCompose('postgresql');
```

Supported databases: PostgreSQL, MySQL, SQLite, MongoDB, SQL Server, CockroachDB

## 🔐 Authentication Strategies

### Email/Password

```typescript
const auth = new AuthKit({
  prisma,
  secret: 'your-jwt-secret',
  strategies: {
    local: {
      enabled: true,
      requireEmailVerification: true,
    },
  },
  email: {
    provider: 'resend',
    apiKey: process.env.RESEND_API_KEY,
    from: 'noreply@yourapp.com',
  },
});
```

### Google OAuth

```typescript
const auth = new AuthKit({
  prisma,
  secret: 'your-jwt-secret',
  strategies: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/api/auth/google/callback',
    },
  },
});
```

### GitHub OAuth

```typescript
const auth = new AuthKit({
  prisma,
  secret: 'your-jwt-secret',
  strategies: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scope: ['user:email'],
    },
  },
});
```

## 🛡️ Middleware

### Require Authentication

```typescript
app.get('/api/profile',
  auth.requireAuth(),
  (req, res) => {
    res.json({ user: req.user });
  }
);
```

### Role-Based Access

```typescript
app.delete('/api/users/:id',
  auth.requireAuth({ role: 'ADMIN' }),
  (req, res) => {
    // Only admins
  }
);

// Multiple roles
app.post('/api/moderate',
  auth.requireAuth({ roles: ['ADMIN', 'MODERATOR'] }),
  (req, res) => {
    // Admins or Moderators
  }
);
```

### Optional Authentication

```typescript
app.get('/api/posts',
  auth.optionalAuth(),
  (req, res) => {
    const posts = req.user
      ? getUserPosts(req.user.id)
      : getPublicPosts();
    res.json(posts);
  }
);
```

## 📧 Email Configuration

### Resend

```typescript
const auth = new AuthKit({
  prisma,
  email: {
    provider: 'resend',
    apiKey: process.env.RESEND_API_KEY,
    from: 'noreply@yourapp.com',
  },
});
```

### Nodemailer (SMTP)

```typescript
const auth = new AuthKit({
  prisma,
  email: {
    provider: 'nodemailer',
    apiKey: {
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
    from: 'noreply@yourapp.com',
  },
});
```

## 🔒 Security Configuration

```typescript
const auth = new AuthKit({
  prisma,
  secret: process.env.JWT_SECRET!,
  security: {
    bcryptRounds: 12,
    rateLimiting: {
      enabled: true,
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    sessionMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
});
```

## 📡 API Endpoints

AuthKit automatically creates these endpoints:

```
POST   /api/auth/register          - Register user
POST   /api/auth/login             - Login user
POST   /api/auth/logout            - Logout user
POST   /api/auth/refresh           - Refresh token
GET    /api/auth/me                - Get current user

# Email Verification
POST   /api/auth/verify-email/send - Send verification email
GET    /api/auth/verify-email/:token - Verify email

# Password Reset
POST   /api/auth/forgot-password   - Send reset email
POST   /api/auth/reset-password    - Reset password

# OAuth
GET    /api/auth/google            - Google OAuth
GET    /api/auth/google/callback   - Google callback
GET    /api/auth/github            - GitHub OAuth
GET    /api/auth/github/callback   - GitHub callback
```

## 🎯 Advanced Usage

### Custom Hooks

```typescript
const auth = new AuthKit({
  prisma,
  secret: 'your-jwt-secret',
  hooks: {
    onUserCreated: async (user) => {
      console.log('New user:', user.email);
      // Send welcome email, create profile, etc.
    },
    onLogin: async (user, session) => {
      console.log('User logged in:', user.email);
      // Track analytics, send notifications
    },
    onLogout: async (userId) => {
      console.log('User logged out:', userId);
      // Clean up sessions, update status
    },
    onEmailVerified: async (user) => {
      console.log('Email verified:', user.email);
      // Grant access, send confirmation
    },
  },
});
```

### Custom User Fields

Extend the Prisma User model:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String?   @unique
  emailVerified Boolean   @default(false)
  password      String?

  // Your custom fields
  firstName     String?
  lastName      String?
  avatar        String?
  role          Role      @default(USER)

  // AuthKit required fields
  accounts      Account[]
  sessions      Session[]
  verificationTokens VerificationToken[]

  @@index([email])
}
```

## 🔧 TypeScript Support

AuthKit is written in TypeScript and provides full type safety:

```typescript
import type { User, AuthResult } from 'authkit';

app.get('/api/profile',
  auth.requireAuth(),
  (req, res) => {
    const user: User = req.user; // Fully typed
    res.json({ user });
  }
);
```

## 🐛 Error Handling

AuthKit provides structured error responses:

```typescript
try {
  const result = await auth.register(userData);
  if (result.success) {
    res.status(201).json(result);
  } else {
    res.status(400).json({ error: result.error });
  }
} catch (error) {
  res.status(500).json({ error: 'Internal server error' });
}
```

## 📚 Examples

See the [examples](./examples) directory for complete applications.

## 🤝 Contributing

Contributions welcome! Please see the main [CONTRIBUTING.md](../CONTRIBUTING.md)

## 📄 License

MIT
