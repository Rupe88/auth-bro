"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AuthKit: () => AuthKit,
  SchemaGenerator: () => SchemaGenerator
});
module.exports = __toCommonJS(index_exports);
var import_express = require("express");
var import_express_rate_limit = __toESM(require("express-rate-limit"));

// src/services/jwt.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var JWTService = class {
  config;
  constructor(config) {
    this.config = {
      secret: config.secret || "",
      accessTokenExpiry: config.accessTokenExpiry || "15m",
      refreshTokenExpiry: config.refreshTokenExpiry || "7d",
      algorithm: config.algorithm || "HS256"
    };
  }
  /**
   * Generate access token
   */
  generateAccessToken(payload) {
    const options = {
      expiresIn: this.config.accessTokenExpiry,
      algorithm: this.config.algorithm
    };
    return import_jsonwebtoken.default.sign(payload, this.config.secret, options);
  }
  /**
   * Generate refresh token
   */
  generateRefreshToken(payload) {
    const options = {
      expiresIn: this.config.refreshTokenExpiry,
      algorithm: this.config.algorithm
    };
    return import_jsonwebtoken.default.sign(payload, this.config.secret, options);
  }
  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      const decoded = import_jsonwebtoken.default.verify(token, this.config.secret, {
        algorithms: [this.config.algorithm]
      });
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
    } catch (error) {
      return null;
    }
  }
  /**
   * Verify refresh token
   */
  verifyRefreshToken(token) {
    try {
      const decoded = import_jsonwebtoken.default.verify(token, this.config.secret, {
        algorithms: [this.config.algorithm]
      });
      return {
        userId: decoded.userId,
        tokenId: decoded.tokenId
      };
    } catch (error) {
      return null;
    }
  }
  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token) {
    try {
      return import_jsonwebtoken.default.decode(token);
    } catch (error) {
      return null;
    }
  }
  /**
   * Check if token is expired
   */
  isTokenExpired(token) {
    try {
      const decoded = import_jsonwebtoken.default.decode(token);
      if (!decoded || !decoded.exp) return true;
      return Date.now() >= decoded.exp * 1e3;
    } catch (error) {
      return true;
    }
  }
  /**
   * Generate token pair
   */
  generateTokenPair(user) {
    const tokenId = this.generateTokenId();
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    const refreshToken = this.generateRefreshToken({
      userId: user.id,
      tokenId
    });
    const accessTokenExpiry = this.calculateExpiry(this.config.accessTokenExpiry);
    const refreshTokenExpiry = this.calculateExpiry(this.config.refreshTokenExpiry);
    return {
      accessToken,
      refreshToken,
      accessTokenExpiry,
      refreshTokenExpiry
    };
  }
  /**
   * Generate unique token ID
   */
  generateTokenId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  /**
   * Calculate expiry timestamp from string
   */
  calculateExpiry(expiry) {
    const now = Date.now();
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return now + 15 * 60 * 1e3;
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
      case "s":
        return now + value * 1e3;
      case "m":
        return now + value * 60 * 1e3;
      case "h":
        return now + value * 60 * 60 * 1e3;
      case "d":
        return now + value * 24 * 60 * 60 * 1e3;
      default:
        return now + 15 * 60 * 1e3;
    }
  }
  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken(refreshToken, user) {
    const decoded = this.verifyRefreshToken(refreshToken);
    if (!decoded || decoded.userId !== user.id) {
      return null;
    }
    return this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
  }
};

// src/services/password.ts
var import_bcrypt = __toESM(require("bcrypt"));
var PasswordService = class {
  bcryptRounds;
  constructor(bcryptRounds = 12) {
    this.bcryptRounds = bcryptRounds;
  }
  /**
   * Hash a password
   */
  async hash(password) {
    return import_bcrypt.default.hash(password, this.bcryptRounds);
  }
  /**
   * Verify a password against its hash
   */
  async verify(password, hash) {
    return import_bcrypt.default.compare(password, hash);
  }
  /**
   * Validate password strength
   */
  validate(password, requirements) {
    const errors = [];
    const reqs = {
      uppercase: requirements?.uppercase ?? true,
      lowercase: requirements?.lowercase ?? true,
      numbers: requirements?.numbers ?? true,
      symbols: requirements?.symbols ?? false,
      minLength: 8
    };
    if (password.length < reqs.minLength) {
      errors.push(`Password must be at least ${reqs.minLength} characters long`);
    }
    if (reqs.uppercase && !/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (reqs.lowercase && !/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (reqs.numbers && !/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (reqs.symbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
  /**
   * Generate a secure random password
   */
  generateSecurePassword(length = 12) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)];
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    return password.split("").sort(() => Math.random() - 0.5).join("");
  }
  /**
   * Check if password needs rehashing (for migration purposes)
   */
  needsRehash(hash) {
    try {
      const hashInfo = import_bcrypt.default.getRounds(hash);
      return hashInfo < this.bcryptRounds;
    } catch (error) {
      return true;
    }
  }
  /**
   * Rehash a password if needed
   */
  async rehashIfNeeded(password, currentHash) {
    if (this.needsRehash(currentHash)) {
      return this.hash(password);
    }
    return currentHash;
  }
  /**
   * Get password strength score (0-4)
   * 0: Very weak
   * 1: Weak
   * 2: Fair
   * 3: Good
   * 4: Strong
   */
  getStrengthScore(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
    if (password.length >= 16 && score >= 4) score++;
    return Math.min(score, 4);
  }
  /**
   * Get strength label
   */
  getStrengthLabel(password) {
    const score = this.getStrengthScore(password);
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    return labels[score];
  }
};

// src/services/oauth.ts
var import_passport = __toESM(require("passport"));
var import_passport_google_oauth20 = require("passport-google-oauth20");
var import_passport_github2 = require("passport-github2");
var OAuthService = class {
  prisma;
  constructor(prisma) {
    this.prisma = prisma;
    this.initializePassport();
  }
  initializePassport() {
    import_passport.default.serializeUser((user, done) => {
      done(null, user.id);
    });
    import_passport.default.deserializeUser(async (id, done) => {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id }
        });
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });
  }
  /**
   * Configure Google OAuth strategy
   */
  configureGoogle(config) {
    if (!config.clientId || !config.clientSecret) {
      throw new Error("Google OAuth clientId and clientSecret are required");
    }
    import_passport.default.use(
      new import_passport_google_oauth20.Strategy(
        {
          clientID: config.clientId,
          clientSecret: config.clientSecret,
          callbackURL: config.callbackURL || "/api/auth/google/callback",
          scope: config.scope || ["profile", "email"]
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await this.handleOAuthCallback(
              "google",
              profile,
              accessToken,
              refreshToken
            );
            done(null, user);
          } catch (error) {
            done(error, void 0);
          }
        }
      )
    );
  }
  /**
   * Configure GitHub OAuth strategy
   */
  configureGitHub(config) {
    if (!config.clientId || !config.clientSecret) {
      throw new Error("GitHub OAuth clientId and clientSecret are required");
    }
    import_passport.default.use(
      new import_passport_github2.Strategy(
        {
          clientID: config.clientId,
          clientSecret: config.clientSecret,
          callbackURL: config.callbackURL || "/api/auth/github/callback",
          scope: config.scope || ["user:email"]
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await this.handleOAuthCallback(
              "github",
              profile,
              accessToken,
              refreshToken
            );
            done(null, user);
          } catch (error) {
            done(error, void 0);
          }
        }
      )
    );
  }
  /**
   * Handle OAuth callback and create/update user
   */
  async handleOAuthCallback(provider, profile, accessToken, refreshToken) {
    const providerAccountId = profile.id;
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName || profile.username;
    const avatar = profile.photos?.[0]?.value;
    let account = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId
        }
      },
      include: { user: true }
    });
    if (account) {
      await this.prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: this.calculateTokenExpiry()
        }
      });
      if (account.user.name !== name || account.user.avatar !== avatar) {
        await this.prisma.user.update({
          where: { id: account.user.id },
          data: { name, avatar }
        });
      }
      return account.user;
    }
    let user = email ? await this.prisma.user.findUnique({
      where: { email }
    }) : null;
    if (user) {
      await this.prisma.account.create({
        data: {
          userId: user.id,
          type: "oauth",
          provider,
          providerAccountId,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: this.calculateTokenExpiry()
        }
      });
      await this.prisma.user.update({
        where: { id: user.id },
        data: { name, avatar }
      });
      return user;
    }
    user = await this.prisma.user.create({
      data: {
        email,
        name,
        avatar,
        accounts: {
          create: {
            type: "oauth",
            provider,
            providerAccountId,
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: this.calculateTokenExpiry()
          }
        }
      }
    });
    return user;
  }
  /**
   * Calculate token expiry (default 1 hour)
   */
  calculateTokenExpiry() {
    return Math.floor(Date.now() / 1e3) + 3600;
  }
  /**
   * Get OAuth redirect URLs
   */
  getOAuthUrls(baseUrl = "") {
    return {
      google: {
        login: `${baseUrl}/api/auth/google`,
        callback: `${baseUrl}/api/auth/google/callback`
      },
      github: {
        login: `${baseUrl}/api/auth/github`,
        callback: `${baseUrl}/api/auth/github/callback`
      }
    };
  }
  /**
   * Middleware for OAuth authentication
   */
  authenticate(provider, options = {}) {
    return import_passport.default.authenticate(provider, {
      session: false,
      ...options
    });
  }
  /**
   * Get passport instance
   */
  getPassport() {
    return import_passport.default;
  }
};

// src/services/email.ts
var import_nodemailer = __toESM(require("nodemailer"));
var EmailService = class {
  config;
  transporter;
  constructor(config) {
    this.config = config;
    this.transporter = this.createTransporter();
  }
  /**
   * Create email transporter
   */
  createTransporter() {
    if (this.config.provider === "resend") {
      return import_nodemailer.default.createTransport({
        host: "smtp.resend.com",
        port: 587,
        secure: false,
        auth: {
          user: "resend",
          pass: this.config.apiKey
        }
      });
    }
    if (this.config.provider === "nodemailer") {
      return import_nodemailer.default.createTransport(this.config.apiKey);
    }
    throw new Error("Email provider not configured");
  }
  /**
   * Send email verification
   */
  async sendEmailVerification(user, token, baseUrl = "") {
    try {
      const verificationUrl = `${baseUrl}/api/auth/verify-email/${token}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ${process.env.APP_NAME || "Our App"}!</h2>
          <p>Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background-color: #007bff; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      `;
      const text = `
        Welcome to ${process.env.APP_NAME || "Our App"}!

        Please verify your email address by clicking this link:
        ${verificationUrl}

        This link will expire in 24 hours.

        If you didn't create an account, please ignore this email.
      `;
      await this.sendEmail({
        to: user.email,
        subject: `Verify your email - ${process.env.APP_NAME || "Our App"}`,
        html,
        text
      });
      return true;
    } catch (error) {
      console.error("Failed to send email verification:", error);
      return false;
    }
  }
  /**
   * Send password reset email
   */
  async sendPasswordReset(user, token, baseUrl = "") {
    try {
      const resetUrl = `${baseUrl}/api/auth/reset-password/${token}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset your password. Click the button below to create a new password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #dc3545; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
      `;
      const text = `
        Reset Your Password

        We received a request to reset your password. Click this link to create a new password:
        ${resetUrl}

        This link will expire in 1 hour.

        If you didn't request a password reset, please ignore this email.
      `;
      await this.sendEmail({
        to: user.email,
        subject: `Reset your password - ${process.env.APP_NAME || "Our App"}`,
        html,
        text
      });
      return true;
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      return false;
    }
  }
  /**
   * Send magic link email
   */
  async sendMagicLink(user, token, baseUrl = "") {
    try {
      const loginUrl = `${baseUrl}/api/auth/magic-link/verify/${token}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Sign In to ${process.env.APP_NAME || "Our App"}</h2>
          <p>Click the link below to sign in to your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}"
               style="background-color: #28a745; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Sign In
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${loginUrl}</p>
          <p>This link will expire in 15 minutes.</p>
          <p>If you didn't request this sign-in link, please ignore this email.</p>
        </div>
      `;
      const text = `
        Sign In to ${process.env.APP_NAME || "Our App"}

        Click this link to sign in to your account:
        ${loginUrl}

        This link will expire in 15 minutes.

        If you didn't request this sign-in link, please ignore this email.
      `;
      await this.sendEmail({
        to: user.email,
        subject: `Sign in to ${process.env.APP_NAME || "Our App"}`,
        html,
        text
      });
      return true;
    } catch (error) {
      console.error("Failed to send magic link email:", error);
      return false;
    }
  }
  /**
   * Send generic email
   */
  async sendEmail(options) {
    await this.transporter.sendMail({
      from: this.config.from || "noreply@yourapp.com",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    });
  }
  /**
   * Generate verification token
   */
  static generateToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  /**
   * Validate email format
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};

// src/utils/schema-generator.ts
var SchemaGenerator = class {
  /**
   * Generate complete Prisma schema for authentication
   */
  static generate(provider) {
    const datasourceConfig = this.getDatasourceConfig(provider);
    return `// This file was generated by AuthKit
// Do not edit manually - regenerate using: npx authkit generate-schema

${datasourceConfig}

model User {
  id            String    @id @default(cuid())
  email         String?   @unique
  emailVerified Boolean   @default(false)
  phone         String?   @unique
  phoneVerified Boolean   @default(false)
  password      String?

  // Profile
  name          String?
  avatar        String?
  role          Role      @default(USER)

  // Security
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret  String?

  // Metadata
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?

  // Relations
  accounts      Account[]
  sessions      Session[]
  verificationTokens VerificationToken[]

  @@index([email])
  @@index([phone])
  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String  // oauth, email
  provider          String  // google, github, credentials
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  refreshToken String   @unique
  userAgent    String?
  ipAddress    String?
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([refreshToken])
  @@map("sessions")
}

model VerificationToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  type      TokenType
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@map("verification_tokens")
}

enum Role {
  USER
  ADMIN
  MODERATOR
  @@map("roles")
}

enum TokenType {
  EMAIL_VERIFICATION
  PASSWORD_RESET
  PHONE_VERIFICATION
  TWO_FACTOR
  MAGIC_LINK
  @@map("token_types")
}`;
  }
  /**
   * Get datasource configuration for different providers
   */
  static getDatasourceConfig(provider) {
    const configs = {
      postgresql: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`,
      mysql: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}`,
      sqlite: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`,
      sqlserver: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}`,
      mongodb: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}`,
      cockroachdb: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "cockroachdb"
  url      = env("DATABASE_URL")
}`
    };
    return configs[provider] || configs.postgresql;
  }
  /**
   * Generate environment variables template
   */
  static generateEnvTemplate(provider) {
    const dbUrls = {
      postgresql: "postgresql://username:password@localhost:5432/authkit_db?schema=public",
      mysql: "mysql://username:password@localhost:3306/authkit_db",
      sqlite: "./dev.db",
      sqlserver: "sqlserver://localhost:1433;database=authkit_db;user=username;password=password",
      mongodb: "mongodb://localhost:27017/authkit_db",
      cockroachdb: "postgresql://username:password@localhost:26257/authkit_db?schema=public"
    };
    return `# Database
DATABASE_URL="${dbUrls[provider]}"

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Email Provider (optional)
RESEND_API_KEY=""
EMAIL_FROM="noreply@yourapp.com"

# Phone/SMS Provider (optional)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# App Configuration
NODE_ENV="development"
APP_URL="http://localhost:3000"`;
  }
  /**
   * Generate Docker Compose configuration
   */
  static generateDockerCompose(provider) {
    const services = {
      postgresql: `version: '3.8'
services:
  db:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: authkit_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:`,
      mysql: `version: '3.8'
services:
  db:
    image: mysql:8
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: authkit_db
      MYSQL_USER: user
      MYSQL_PASSWORD: password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:`,
      sqlite: `# SQLite doesn't need Docker Compose
# Database file will be created automatically`,
      sqlserver: `version: '3.8'
services:
  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    restart: always
    environment:
      ACCEPT_EULA: Y
      SA_PASSWORD: StrongPassword123!
      MSSQL_DB: authkit_db
    ports:
      - "1433:1433"
    volumes:
      - sqlserver_data:/var/opt/mssql

volumes:
  sqlserver_data:`,
      mongodb: `version: '3.8'
services:
  db:
    image: mongo:7
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: authkit_db
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:`,
      cockroachdb: `version: '3.8'
services:
  db:
    image: cockroachdb/cockroach:v23.1.0
    restart: always
    command: start-single-node --insecure --listen-addr=0.0.0.0:26257 --http-addr=0.0.0.0:8080
    ports:
      - "26257:26257"
      - "8080:8080"
    volumes:
      - cockroach_data:/cockroach/cockroach-data

volumes:
  cockroach_data:`
    };
    return services[provider];
  }
  /**
   * List all supported providers
   */
  static getSupportedProviders() {
    return ["postgresql", "mysql", "sqlite", "sqlserver", "mongodb", "cockroachdb"];
  }
  /**
   * Validate provider
   */
  static isValidProvider(provider) {
    return this.getSupportedProviders().includes(provider);
  }
};

// src/index.ts
var AuthKit = class {
  prisma;
  jwt;
  password;
  oauth;
  email;
  config;
  router;
  constructor(config) {
    this.prisma = config.prisma;
    this.config = {
      jwt: {
        secret: config.secret,
        accessTokenExpiry: "15m",
        refreshTokenExpiry: "7d",
        algorithm: "HS256",
        ...config.jwt
      },
      strategies: {
        local: true,
        ...config.strategies
      },
      security: {
        bcryptRounds: 12,
        rateLimiting: {
          enabled: true,
          maxAttempts: 5,
          windowMs: 15 * 60 * 1e3
        },
        sessionMaxAge: 7 * 24 * 60 * 60 * 1e3,
        cookieSettings: {
          httpOnly: true,
          secure: false,
          sameSite: "lax"
        },
        ...config.security
      },
      ...config
    };
    this.jwt = new JWTService(this.config.jwt);
    this.password = new PasswordService(this.config.security.bcryptRounds);
    this.oauth = new OAuthService(this.prisma);
    if (this.config.email) {
      this.email = new EmailService(this.config.email);
    }
    this.router = (0, import_express.Router)();
    this.setupOAuthStrategies();
    this.setupRoutes();
  }
  /**
   * Get the Express router with all auth routes
   */
  getRouter() {
    return this.router;
  }
  /**
   * Register a new user
   */
  async register(data) {
    try {
      const passwordValidation = this.password.validate(data.password);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: passwordValidation.errors.join(", ")
        };
      }
      const hashedPassword = await this.password.hash(data.password);
      const user = await this.prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          password: hashedPassword,
          name: data.name,
          phone: data.phone
        }
      });
      const tokens = this.jwt.generateTokenPair(user);
      await this.createSession(user.id, tokens.refreshToken);
      if (this.config.hooks?.onUserCreated) {
        await this.config.hooks.onUserCreated(user);
      }
      return {
        success: true,
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    } catch (error) {
      if (error.code === "P2002") {
        return {
          success: false,
          error: "User with this email already exists"
        };
      }
      return {
        success: false,
        error: "Registration failed"
      };
    }
  }
  /**
   * Login user
   */
  async login(credentials) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase() }
      });
      if (!user || !user.password) {
        return {
          success: false,
          error: "Invalid credentials"
        };
      }
      const isValidPassword = await this.password.verify(credentials.password, user.password);
      if (!isValidPassword) {
        return {
          success: false,
          error: "Invalid credentials"
        };
      }
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: /* @__PURE__ */ new Date() }
      });
      const tokens = this.jwt.generateTokenPair(user);
      await this.createSession(user.id, tokens.refreshToken);
      if (this.config.hooks?.onLogin) {
        const session = await this.getSessionByRefreshToken(tokens.refreshToken);
        await this.config.hooks.onLogin(user, session);
      }
      return {
        success: true,
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    } catch (error) {
      return {
        success: false,
        error: "Login failed"
      };
    }
  }
  /**
   * Verify JWT token and get user
   */
  async verifyToken(token) {
    try {
      const decoded = this.jwt.verifyAccessToken(token);
      if (!decoded) return null;
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId }
      });
      return user;
    } catch (error) {
      return null;
    }
  }
  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const session = await this.getSessionByRefreshToken(refreshToken);
      if (!session || session.expiresAt < /* @__PURE__ */ new Date()) {
        return {
          success: false,
          error: "Invalid or expired refresh token"
        };
      }
      const user = await this.prisma.user.findUnique({
        where: { id: session.userId }
      });
      if (!user) {
        return {
          success: false,
          error: "User not found"
        };
      }
      const tokens = this.jwt.generateTokenPair(user);
      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + this.config.security.sessionMaxAge)
        }
      });
      return {
        success: true,
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    } catch (error) {
      return {
        success: false,
        error: "Token refresh failed"
      };
    }
  }
  /**
   * Logout user (invalidate session)
   */
  async logout(refreshToken) {
    try {
      const session = await this.getSessionByRefreshToken(refreshToken);
      if (session) {
        await this.prisma.session.delete({
          where: { id: session.id }
        });
        if (this.config.hooks?.onLogout) {
          await this.config.hooks.onLogout(session.userId);
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }
  /**
   * Middleware: Require authentication
   */
  requireAuth(options = {}) {
    return (req, res, next) => {
      (async () => {
        try {
          const token = this.extractToken(req);
          if (!token) {
            res.status(401).json({ error: "No token provided" });
            return;
          }
          const user = await this.verifyToken(token);
          if (!user) {
            res.status(401).json({ error: "Invalid token" });
            return;
          }
          if (options.role && user.role !== options.role) {
            res.status(403).json({ error: "Insufficient permissions" });
            return;
          }
          if (options.roles && !options.roles.includes(user.role)) {
            res.status(403).json({ error: "Insufficient permissions" });
            return;
          }
          if (options.emailVerified && !user.emailVerified) {
            res.status(403).json({ error: "Email not verified" });
            return;
          }
          req.user = user;
          next();
        } catch (error) {
          res.status(401).json({ error: "Authentication failed" });
        }
      })();
    };
  }
  /**
   * Middleware: Optional authentication
   */
  optionalAuth() {
    return (req, res, next) => {
      (async () => {
        try {
          const token = this.extractToken(req);
          if (token) {
            const user = await this.verifyToken(token);
            if (user) {
              req.user = user;
            }
          }
          next();
        } catch (error) {
          next();
        }
      })();
    };
  }
  /**
   * Extract token from request
   */
  extractToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }
    const cookieToken = req.cookies?.accessToken;
    if (cookieToken) {
      return cookieToken;
    }
    return null;
  }
  /**
   * Create session
   */
  async createSession(userId, refreshToken) {
    await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt: new Date(Date.now() + this.config.security.sessionMaxAge),
        userAgent: "API",
        // TODO: Extract from request
        ipAddress: "127.0.0.1"
        // TODO: Extract from request
      }
    });
  }
  /**
   * Get session by refresh token
   */
  async getSessionByRefreshToken(refreshToken) {
    return this.prisma.session.findUnique({
      where: { refreshToken }
    });
  }
  /**
   * Setup OAuth strategies
   */
  setupOAuthStrategies() {
    if (this.config.strategies?.google && typeof this.config.strategies.google === "object") {
      this.oauth.configureGoogle(this.config.strategies.google);
    }
    if (this.config.strategies?.github && typeof this.config.strategies.github === "object") {
      this.oauth.configureGitHub(this.config.strategies.github);
    }
  }
  /**
   * Setup Express routes
   */
  setupRoutes() {
    if (this.config.security?.rateLimiting?.enabled) {
      const limiter = (0, import_express_rate_limit.default)({
        windowMs: this.config.security.rateLimiting.windowMs,
        max: this.config.security.rateLimiting.maxAttempts,
        message: { error: "Too many requests, please try again later" }
      });
      this.router.use("/login", limiter);
      this.router.use("/register", limiter);
    }
    this.router.post("/register", async (req, res) => {
      const result = await this.register(req.body);
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json({ error: result.error });
      }
    });
    this.router.post("/login", async (req, res) => {
      const result = await this.login(req.body);
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json({ error: result.error });
      }
    });
    this.router.post("/refresh", async (req, res) => {
      const { refreshToken } = req.body;
      const result = await this.refreshToken(refreshToken);
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json({ error: result.error });
      }
    });
    this.router.post("/logout", async (req, res) => {
      const { refreshToken } = req.body;
      const success = await this.logout(refreshToken);
      res.status(success ? 200 : 400).json({ success });
    });
    this.router.get("/me", this.requireAuth(), async (req, res) => {
      const authReq = req;
      res.json({ user: authReq.user });
    });
    if (this.email) {
      this.router.post("/verify-email/send", this.requireAuth(), async (req, res) => {
        const authReq = req;
        const user = authReq.user;
        if (user.emailVerified) {
          res.status(400).json({ error: "Email already verified" });
          return;
        }
        const token = EmailService.generateToken();
        await this.prisma.verificationToken.create({
          data: {
            userId: user.id,
            token,
            type: "EMAIL_VERIFICATION",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1e3)
            // 24 hours
          }
        });
        const success = await this.email.sendEmailVerification(user, token);
        res.json({ success });
      });
      this.router.get("/verify-email/:token", async (req, res) => {
        const { token } = req.params;
        const verificationToken = await this.prisma.verificationToken.findUnique({
          where: { token },
          include: { user: true }
        });
        if (!verificationToken || verificationToken.type !== "EMAIL_VERIFICATION") {
          res.status(400).json({ error: "Invalid token" });
          return;
        }
        if (verificationToken.expiresAt < /* @__PURE__ */ new Date()) {
          res.status(400).json({ error: "Token expired" });
          return;
        }
        await this.prisma.user.update({
          where: { id: verificationToken.userId },
          data: { emailVerified: true }
        });
        await this.prisma.verificationToken.delete({
          where: { id: verificationToken.id }
        });
        if (this.config.hooks?.onEmailVerified) {
          await this.config.hooks.onEmailVerified(verificationToken.user);
        }
        res.json({ success: true, message: "Email verified successfully" });
      });
      this.router.post("/forgot-password", async (req, res) => {
        const { email } = req.body;
        if (!EmailService.isValidEmail(email)) {
          res.status(400).json({ error: "Invalid email format" });
          return;
        }
        const user = await this.prisma.user.findUnique({
          where: { email }
        });
        if (!user) {
          res.json({ success: true, message: "If the email exists, a reset link has been sent" });
          return;
        }
        const token = EmailService.generateToken();
        await this.prisma.verificationToken.create({
          data: {
            userId: user.id,
            token,
            type: "PASSWORD_RESET",
            expiresAt: new Date(Date.now() + 60 * 60 * 1e3)
            // 1 hour
          }
        });
        const success = await this.email.sendPasswordReset(user, token);
        res.json({ success });
      });
      this.router.post("/reset-password", async (req, res) => {
        const { token, password } = req.body;
        const verificationToken = await this.prisma.verificationToken.findUnique({
          where: { token },
          include: { user: true }
        });
        if (!verificationToken || verificationToken.type !== "PASSWORD_RESET") {
          res.status(400).json({ error: "Invalid token" });
          return;
        }
        if (verificationToken.expiresAt < /* @__PURE__ */ new Date()) {
          res.status(400).json({ error: "Token expired" });
          return;
        }
        const passwordValidation = this.password.validate(password);
        if (!passwordValidation.valid) {
          res.status(400).json({ error: passwordValidation.errors.join(", ") });
          return;
        }
        const hashedPassword = await this.password.hash(password);
        await this.prisma.user.update({
          where: { id: verificationToken.userId },
          data: { password: hashedPassword }
        });
        await this.prisma.verificationToken.delete({
          where: { id: verificationToken.id }
        });
        res.json({ success: true, message: "Password reset successfully" });
      });
    }
    if (this.config.strategies?.google && typeof this.config.strategies.google === "object") {
      this.router.get("/google", this.oauth.authenticate("google"));
      this.router.get(
        "/google/callback",
        this.oauth.authenticate("google", { session: false }),
        this.handleOAuthCallback.bind(this)
      );
    }
    if (this.config.strategies?.github && typeof this.config.strategies.github === "object") {
      this.router.get("/github", this.oauth.authenticate("github"));
      this.router.get(
        "/github/callback",
        this.oauth.authenticate("github", { session: false }),
        this.handleOAuthCallback.bind(this)
      );
    }
  }
  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(req, res) {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: "OAuth authentication failed" });
        return;
      }
      const tokens = this.jwt.generateTokenPair(user);
      await this.createSession(user.id, tokens.refreshToken);
      if (this.config.hooks?.onLogin) {
        const session = await this.getSessionByRefreshToken(tokens.refreshToken);
        await this.config.hooks.onLogin(user, session);
      }
      res.json({
        success: true,
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } catch (error) {
      res.status(500).json({ error: "OAuth callback failed" });
    }
  }
  // Static methods for schema generation
  static generateSchema(provider) {
    if (!SchemaGenerator.isValidProvider(provider)) {
      throw new Error(`Unsupported database provider: ${provider}`);
    }
    return SchemaGenerator.generate(provider);
  }
  static generateEnv(provider) {
    if (!SchemaGenerator.isValidProvider(provider)) {
      throw new Error(`Unsupported database provider: ${provider}`);
    }
    return SchemaGenerator.generateEnvTemplate(provider);
  }
  static generateDockerCompose(provider) {
    if (!SchemaGenerator.isValidProvider(provider)) {
      throw new Error(`Unsupported database provider: ${provider}`);
    }
    return SchemaGenerator.generateDockerCompose(provider);
  }
  static getSupportedDatabases() {
    return SchemaGenerator.getSupportedProviders();
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthKit,
  SchemaGenerator
});
//# sourceMappingURL=index.js.map