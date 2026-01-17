import fs from 'fs-extra';
import path from 'path';
import handlebars from 'handlebars';
import { ProjectConfig } from './create-app';

const templates = {
  express: {
    'package.json': `{
  "name": "{{name}}",
  "version": "1.0.0",
  "description": "AuthKit-powered Express app",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "express": "^4.19.2",
    "auth-bro": "^1.0.0",
    "@prisma/client": "^6.1.0",
    "prisma": "^6.1.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "dotenv": "^16.4.5"{{#if (includes strategies 'google')}},
    "passport-google-oauth20": "^2.0.0"{{/if}}{{#if (includes strategies 'github')}},
    "passport-github2": "^0.1.12"{{/if}}
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.12.7",
    "tsx": "^4.7.1"
  }
}`,
    'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`,
    'src/index.ts': `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { AuthKit } from 'auth-bro';
import { PrismaClient } from '@prisma/client';
import { authRouter } from './routes/auth';
import { apiRouter } from './routes/api';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize AuthKit
const auth = new AuthKit({
  prisma,
  secret: process.env.JWT_SECRET!,
{{#if (includes strategies 'google')}}
  strategies: {
    local: true,
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
{{#if (includes strategies 'github')}}
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
{{/if}}
  },
{{/if}}
});

// Routes
app.use('/api/auth', auth.router());
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(\`🚀 Server running on http://localhost:\${PORT}\`);
});`,
    'src/routes/auth.ts': `import { Router } from 'express';

const router = Router();

// AuthKit handles all auth routes automatically
// This file can be extended with custom auth logic if needed

export { router as authRouter };`,
    'src/routes/api.ts': `import { Router } from 'express';
import { auth } from '../middleware/auth';

const router = Router();

// Example protected routes
router.get('/profile', auth.requireAuth(), (req, res) => {
  res.json({
    user: req.user,
    message: 'This is a protected route!',
  });
});

router.get('/admin', auth.requireAuth({ role: 'ADMIN' }), (req, res) => {
  res.json({
    message: 'Welcome to the admin panel!',
    user: req.user,
  });
});

// Public routes
router.get('/public', (req, res) => {
  res.json({
    message: 'This is a public route',
    user: req.user, // Will be null if not authenticated
  });
});

export { router as apiRouter };`,
    'src/middleware/auth.ts': `import { AuthKit } from 'auth-bro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = new AuthKit({
  prisma,
  secret: process.env.JWT_SECRET!,
  // AuthKit config is shared with main app
});`,
  },
  fastify: {
    'package.json': `{
  "name": "{{name}}",
  "version": "1.0.0",
  "description": "AuthKit-powered Fastify app",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "fastify": "^4.24.0",
    "@fastify/cors": "^8.5.0",
    "@fastify/helmet": "^11.1.1",
    "auth-bro": "^1.0.0",
    "@prisma/client": "^6.1.0",
    "prisma": "^6.1.0",
    "dotenv": "^16.4.5"{{#if (includes strategies 'google')}},
    "passport-google-oauth20": "^2.0.0"{{/if}}{{#if (includes strategies 'github')}},
    "passport-github2": "^0.1.12"{{/if}}
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^20.12.7",
    "tsx": "^4.7.1"
  }
}`,
    'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`,
    'src/index.ts': `import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import dotenv from 'dotenv';
import { AuthKit } from 'auth-bro';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

// Register plugins
await fastify.register(cors);
await fastify.register(helmet);

// Initialize AuthKit
const auth = new AuthKit({
  prisma,
  secret: process.env.JWT_SECRET!,
{{#if (includes strategies 'google')}}
  strategies: {
    local: true,
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
{{#if (includes strategies 'github')}}
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
{{/if}}
  },
{{/if}}
});

// Register auth routes
fastify.register(auth.getRouter().bind(auth), { prefix: '/api/auth' });

// Routes
fastify.get('/api/profile', {
  preHandler: auth.requireAuth(),
  handler: async (request, reply) => {
    return { user: request.user };
  }
});

fastify.get('/api/admin', {
  preHandler: auth.requireAuth({ role: 'ADMIN' }),
  handler: async (request, reply) => {
    return { message: 'Welcome to admin panel!', user: request.user };
  }
});

// Public routes
fastify.get('/api/public', async (request, reply) => {
  return { message: 'This is a public route', user: request.user };
});

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'OK', timestamp: new Date().toISOString() };
});

// Start server
const PORT = process.env.PORT || 3000;

fastify.listen({ port: Number(PORT), host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(\`🚀 Server running on \${address}\`);
});`,
    'src/routes/auth.ts': `// Auth routes are handled by AuthKit
export const authRoutes = {};`,
    'src/routes/api.ts': `// Additional API routes can be added here
export const apiRoutes = {};`,
  },
  nextjs: {
    'package.json': `{
  "name": "{{name}}",
  "version": "1.0.0",
  "description": "AuthKit-powered Next.js app",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "auth-bro": "^1.0.0",
    "@prisma/client": "^6.1.0",
    "prisma": "^6.1.0",
    "dotenv": "^16.4.5"{{#if (includes strategies 'google')}},
    "passport-google-oauth20": "^2.0.0"{{/if}}{{#if (includes strategies 'github')}},
    "passport-github2": "^0.1.12"{{/if}}
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^20.12.7",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.0.0"
  }
}`,
    'src/app/api/auth/[...nextauth]/route.ts': `import { AuthKit } from 'auth-bro';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

const auth = new AuthKit({
  prisma,
  secret: process.env.JWT_SECRET!,
});

export async function GET(req: NextRequest) {
  // AuthKit handles Next.js API routes
  return NextResponse.json({ message: 'AuthKit Next.js integration' });
}`,
  }
};

export async function generateTemplate(
  projectPath: string,
  config: Omit<ProjectConfig, 'name'>,
  projectName: string
): Promise<void> {
  const template = templates[config.framework];

  if (!template) {
    throw new Error(`Unsupported framework: ${config.framework}`);
  }

  // Register Handlebars helpers
  handlebars.registerHelper('includes', (array: string[], value: string) => {
    return array && array.includes(value);
  });

  // Generate files
  for (const [filePath, content] of Object.entries(template)) {
    const fullPath = path.join(projectPath, filePath);
    await fs.ensureDir(path.dirname(fullPath));

    const templateFn = handlebars.compile(content);
    const rendered = templateFn({ ...config, name: projectName });

    await fs.writeFile(fullPath, rendered);
  }

  // Create additional directories
  await fs.ensureDir(path.join(projectPath, 'prisma'));
  await fs.ensureDir(path.join(projectPath, 'src', 'routes'));
  await fs.ensureDir(path.join(projectPath, 'src', 'middleware'));

  // Create README
  await createReadme(projectPath, { ...config, name: projectName });
}

async function createReadme(projectPath: string, config: ProjectConfig & { name: string }): Promise<void> {
  const readme = `# ${config.name}

A ${config.framework} application with AuthKit authentication.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up your database:
   \`\`\`bash
   ${config.docker ? 'docker compose up -d' : ''}
   npm run db:migrate
   \`\`\`

3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication Features

${config.strategies.map(strategy => `- ${strategy}`).join('\n')}

## Available Routes

- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user
- GET /api/auth/me - Get current user
- POST /api/auth/logout - Logout user
- GET /api/profile - Protected route example
- GET /api/admin - Admin-only route example

## Environment Variables

Copy \`.env.example\` to \`.env\` and fill in your values:

\`\`\`env
DATABASE_URL="your-database-url"
JWT_SECRET="your-jwt-secret"
${config.strategies.includes('google') ? 'GOOGLE_CLIENT_ID="your-google-client-id"\nGOOGLE_CLIENT_SECRET="your-google-client-secret"' : ''}
${config.strategies.includes('github') ? 'GITHUB_CLIENT_ID="your-github-client-id"\nGITHUB_CLIENT_SECRET="your-github-client-secret"' : ''}
\`\`\`

## Learn More

- [Auth-Bro Documentation](https://auth-bro.dev)
- [${config.framework} Documentation](https://${config.framework}.js.org)
`;

  await fs.writeFile(path.join(projectPath, 'README.md'), readme);
}
