# 🚀 Auth-Bro - Authentication Made Simple & Cool

**Tired of building auth from scratch?** Meet Auth-Bro - your new authentication best friend! 🦸‍♂️

Auth-Bro handles all the boring, complex auth stuff so you can focus on building awesome features. It's like having a senior auth engineer who never sleeps, complains, or asks for coffee breaks.

**Why developers love Auth-Bro:**
- ⚡ **5-minute setup** - Get auth working faster than making coffee
- 🛡️ **Battle-tested security** - JWT, bcrypt, rate limiting included
- 🎯 **Framework friendly** - Express, Fastify, Next.js support
- 🗄️ **Database flexible** - PostgreSQL, MySQL, SQLite, MongoDB
- 🔑 **OAuth ready** - Google, GitHub login out of the box
- 📱 **API-first** - Perfect for SPAs, mobile apps, PWAs
- 🎨 **TypeScript native** - Full type safety, zero guesswork

## 📦 What's Inside

**Two packages that work together like peanut butter and jelly:**

### 🔧 `auth-bro` - The Core Engine
The powerhouse library that does all the heavy lifting. Handles users, passwords, tokens, OAuth, and all the security stuff.

### ⚡ `create-auth-bro` - The Magic CLI
Think `create-react-app` but for authentication. One command gives you a complete auth-ready app. No more "which auth library should I use?" debates.

## 🚀 Get Started - Choose Your Adventure

### 🌟 Option 1: The Magic CLI (Recommended for beginners)
Perfect if you want auth working in 5 minutes without thinking about databases or OAuth setup.

```bash
npx create-auth-bro@latest my-awesome-app
```

**What happens next?** The CLI asks you friendly questions:
- 🤔 **"What framework?"** → Express, Fastify, or Next.js
- 🗄️ **"Which database?"** → PostgreSQL, MySQL, SQLite, or MongoDB
- 🔐 **"How should users log in?"** → Email/password, Google, GitHub, or all of them!
- ⚙️ **"Extra features?"** → Email verification, password reset, rate limiting

**Result:** A complete, running app with authentication! Just `npm run dev` and you're done.

### 🔧 Option 2: Manual Setup (For experienced devs)
If you have an existing project and want to add auth to it.

```bash
npm install @rupeshe/auth-bro @prisma/client
```

```typescript
// That's it! Really!
import express from 'express';
import { AuthKit } from '@rupeshe/auth-bro';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

// 🪄 One line does everything!
const auth = new AuthKit({
  prisma,
  secret: process.env.JWT_SECRET!, // Your JWT secret
  strategies: {
    local: true, // Enable email/password auth
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});

// 🎯 Mount all auth routes automatically
app.use('/api/auth', auth.getRouter());

// 🛡️ Protect any route with one line
app.get('/api/profile', auth.requireAuth(), (req, res) => {
  res.json({ user: req.user }); // Fully typed! 🎉
});

app.listen(3000, () => {
  console.log('🚀 Auth-Bro ready at http://localhost:3000');
});
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
