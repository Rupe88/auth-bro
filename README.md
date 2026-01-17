# AuthKit - Production-Ready Authentication

🚀 **The easiest way to add authentication to your web applications**

AuthKit is a comprehensive authentication library that supports multiple databases, frameworks, and authentication strategies. Built with TypeScript, Prisma, and modern security practices.

## 📦 Packages

This monorepo contains two packages:

- **`authkit`** - Core authentication library
- **`create-authkit`** - CLI tool for bootstrapping projects

## 🚀 Quick Start

### Option 1: CLI (Recommended)

```bash
npm create authkit@latest my-app
# or
npx create-authkit@latest my-app
```

**Interactive setup:**
- Choose your framework (Express, Fastify, Next.js)
- Select database (PostgreSQL, MySQL, SQLite, MongoDB)
- Pick authentication strategies (Email, Google, GitHub)
- Enable features (Email verification, rate limiting, etc.)

### Option 2: Manual Setup

```bash
npm install authkit @prisma/client
```

```typescript
import express from 'express';
import { AuthKit } from 'authkit';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

const auth = new AuthKit({
  prisma,
  secret: process.env.JWT_SECRET!,
  strategies: {
    local: true,
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});

// Mount auth routes
app.use('/api/auth', auth.getRouter());

// Protected routes
app.get('/api/profile',
  auth.requireAuth(),
  (req, res) => {
    res.json({ user: req.user });
  }
);

app.listen(3000);
```

## ✨ Features

### 🔐 Authentication Strategies
- ✅ Email/Password authentication
- ✅ Google OAuth
- ✅ GitHub OAuth
- ✅ Magic Link (coming soon)
- ✅ Phone/SMS (coming soon)

### 🗄️ Database Support
- ✅ PostgreSQL
- ✅ MySQL
- ✅ SQLite
- ✅ MongoDB
- ✅ SQL Server
- ✅ CockroachDB

### 🛠️ Framework Support
- ✅ Express.js
- ✅ Fastify
- ✅ Next.js (coming soon)

### 🔒 Security Features
- ✅ JWT with refresh tokens
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting
- ✅ Email verification
- ✅ Password reset
- ✅ Session management

### 🎯 Developer Experience
- ✅ TypeScript first
- ✅ Comprehensive middleware
- ✅ Auto-generated Prisma schemas
- ✅ Docker Compose generation
- ✅ One-command setup

## 📚 Documentation

- [Getting Started](./packages/authkit/README.md)
- [API Reference](./packages/authkit/docs/api.md)
- [CLI Guide](./packages/create-authkit/README.md)

## 🏆 Why AuthKit?

### **vs. Passport.js**
- Modern TypeScript API
- Built-in database integration
- Automatic schema generation
- Better security defaults

### **vs. NextAuth.js**
- Framework agnostic
- More database options
- Advanced security features
- Enterprise-ready

### **vs. Custom Implementation**
- Production-tested
- Security audited
- Comprehensive features
- Active maintenance

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 License

MIT License - Free for personal and commercial use

## 📞 Support

- **GitHub Issues**: [Report bugs](https://github.com/authkit/authkit/issues)
- **Discord**: [Join community](https://discord.gg/authkit)
- **Documentation**: [authkit.dev](https://authkit.dev)

---

**Made with ❤️ for developers who hate building auth**
# auth-bro
