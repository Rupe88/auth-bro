# Create AuthKit - Project Bootstrapper

Interactive CLI tool to create AuthKit-powered applications in seconds.

## 🚀 Installation

```bash
npm install -g create-authkit
# or
npx create-authkit@latest
```

## 📋 Usage

### Interactive Mode

```bash
npx create-authkit my-app
```

The CLI will ask you:
- Framework (Express, Fastify, Next.js)
- Database (PostgreSQL, MySQL, SQLite, MongoDB)
- Authentication strategies (Email, Google, GitHub)
- Features (Email verification, rate limiting, etc.)
- Package manager (npm, yarn, pnpm)
- Docker setup

### Programmatic Usage

```bash
# Create Express app with PostgreSQL
npx create-authkit my-app --framework express --database postgresql

# Create with specific features
npx create-authkit my-app --strategies email,google --features email-verification
```

## 🎯 What It Creates

The CLI generates a complete, production-ready application with:

### 📁 Project Structure
```
my-app/
├── src/
│   ├── index.ts                 # Server entry point
│   ├── routes/
│   │   ├── auth.ts             # AuthKit routes
│   │   └── api.ts              # Your API routes
│   └── middleware/
│       └── auth.ts             # AuthKit middleware
├── prisma/
│   └── schema.prisma           # Auto-generated schema
├── .env                        # Environment variables
├── .env.example               # Environment template
├── docker-compose.yml         # Database container (optional)
├── package.json               # Dependencies configured
├── tsconfig.json              # TypeScript config
└── README.md                  # Setup instructions
```

### 🔧 Auto-Configured Features

- ✅ **TypeScript** setup
- ✅ **Prisma** schema for your database
- ✅ **AuthKit** integration
- ✅ **Environment variables** template
- ✅ **Docker Compose** (if selected)
- ✅ **Package manager** dependencies
- ✅ **Development scripts**

### 🚀 Ready-to-Run

After creation, just run:

```bash
cd my-app
npm install
npm run dev
```

Your app will be running with full authentication at `http://localhost:3000`

## 📖 Examples

### Express + PostgreSQL + Email Auth

```bash
npx create-authkit my-blog
# Select: Express, PostgreSQL, Email/Password, Email verification
```

### Next.js + MongoDB + OAuth

```bash
npx create-authkit my-saas
# Select: Next.js, MongoDB, Email + Google + GitHub, All features
```

### Fastify + SQLite + Basic Auth

```bash
npx create-authkit my-api
# Select: Fastify, SQLite, Email/Password, Rate limiting
```

## 🔧 Options

| Option | Description | Default |
|--------|-------------|---------|
| `--framework` | Framework to use | Interactive |
| `--database` | Database provider | Interactive |
| `--strategies` | Auth strategies (comma-separated) | Interactive |
| `--features` | Features to enable (comma-separated) | Interactive |
| `--docker` | Generate Docker Compose | Interactive |
| `--package-manager` | Package manager | Interactive |

### Supported Frameworks

- **Express** - Fast, unopinionated web framework
- **Fastify** - Fast and low overhead web framework
- **Next.js** - Full-stack React framework

### Supported Databases

- **PostgreSQL** - Advanced open source RDBMS
- **MySQL** - Popular relational database
- **SQLite** - Embedded database (no setup required)
- **MongoDB** - Document database

### Authentication Strategies

- **local** - Email/password authentication
- **google** - Google OAuth 2.0
- **github** - GitHub OAuth 2.0
- **magic-link** - Passwordless authentication (coming soon)
- **phone** - SMS/OTP authentication (coming soon)

### Features

- **email-verification** - Email verification flow
- **password-reset** - Password reset functionality
- **rate-limiting** - API rate limiting
- **roles** - Role-based access control
- **2fa** - Two-factor authentication (coming soon)

## 🐳 Docker Support

When you select Docker, the CLI generates:

```yaml
# docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: authkit_db
    ports:
      - "5432:5432"
```

Start your database:
```bash
docker compose up -d
```

## 📦 Package Managers

The CLI supports:
- **npm** - Node package manager
- **yarn** - Fast, reliable dependency management
- **pnpm** - Fast, disk space efficient package manager

## 🎨 Customization

### Custom Templates

Create custom project templates:

```bash
# Fork the repository
git clone https://github.com/authkit/create-authkit.git
cd create-authkit

# Add your template in src/templates/
# Modify the prompts in src/create-app.ts
```

### Environment Variables

The CLI generates `.env` with required variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/myapp"

# JWT
JWT_SECRET="your-super-secret-key"

# OAuth (if selected)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Email (if email features selected)
RESEND_API_KEY=""
```

## 🐛 Troubleshooting

### Common Issues

**"Command not found"**
```bash
# Install globally
npm install -g create-authkit

# Or use npx
npx create-authkit@latest my-app
```

**Database connection failed**
```bash
# For Docker databases
docker compose up -d

# For local databases, update DATABASE_URL in .env
```

**OAuth not working**
```bash
# Set callback URLs in OAuth provider settings:
/api/auth/google/callback
/api/auth/github/callback
```

### Getting Help

- **GitHub Issues**: [Report bugs](https://github.com/authkit/create-authkit/issues)
- **Discord**: [Join community](https://discord.gg/authkit)
- **Documentation**: [CLI Guide](https://authkit.dev/cli)

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](../CONTRIBUTING.md)

## 📄 License

MIT
