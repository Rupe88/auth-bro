import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

// Base user type (extendable)
export interface User {
  id: string;
  email?: string;
  emailVerified?: boolean;
  phone?: string;
  phoneVerified?: boolean;
  password?: string;
  name?: string;
  avatar?: string;
  role?: Role;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
}

// Role enum
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

// Auth configuration
export interface AuthConfig {
  prisma: PrismaClient;
  secret: string;
  jwt?: JWTConfig;
  strategies?: StrategiesConfig;
  email?: EmailConfig;
  security?: SecurityConfig;
  hooks?: HooksConfig;
  redirects?: RedirectConfig;
}

// JWT configuration
export interface JWTConfig {
  secret: string;
  accessTokenExpiry?: string;
  refreshTokenExpiry?: string;
  algorithm?: string;
}

// Authentication strategies
export interface StrategiesConfig {
  local?: LocalStrategyConfig | boolean;
  google?: OAuthStrategyConfig | boolean;
  github?: OAuthStrategyConfig | boolean;
  phone?: PhoneStrategyConfig | boolean;
  magicLink?: MagicLinkConfig | boolean;
}

// Local strategy (email/password)
export interface LocalStrategyConfig {
  enabled?: boolean;
  requireEmailVerification?: boolean;
  passwordMinLength?: number;
  passwordRequirements?: PasswordRequirements;
}

export interface PasswordRequirements {
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
}

// OAuth strategy
export interface OAuthStrategyConfig {
  enabled?: boolean;
  clientId?: string;
  clientSecret?: string;
  callbackURL?: string;
  scope?: string[];
}

// Phone strategy
export interface PhoneStrategyConfig {
  enabled?: boolean;
  provider?: 'twilio' | 'aws-sns';
  config?: any;
  otpLength?: number;
  otpExpiry?: string;
}

// Magic link strategy
export interface MagicLinkConfig {
  enabled?: boolean;
  tokenExpiry?: string;
}

// Email configuration
export interface EmailConfig {
  provider?: 'resend' | 'nodemailer' | 'sendgrid';
  apiKey?: string;
  from?: string;
  templates?: EmailTemplates;
}

export interface EmailTemplates {
  verification?: string;
  passwordReset?: string;
  magicLink?: string;
}

// Security configuration
export interface SecurityConfig {
  bcryptRounds?: number;
  rateLimiting?: RateLimitConfig;
  sessionMaxAge?: number;
  cookieSettings?: CookieSettings;
}

export interface RateLimitConfig {
  enabled?: boolean;
  maxAttempts?: number;
  windowMs?: number;
}

export interface CookieSettings {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

// Hooks/events
export interface HooksConfig {
  onUserCreated?: (user: User) => Promise<void> | void;
  onLogin?: (user: User, session: any) => Promise<void> | void;
  onLogout?: (userId: string) => Promise<void> | void;
  onEmailVerified?: (user: User) => Promise<void> | void;
}

// Redirect configuration
export interface RedirectConfig {
  afterLogin?: string;
  afterLogout?: string;
  afterRegister?: string;
}

// Extended Express types
export interface AuthRequest extends Request {
  user?: User;
  session?: any;
}

export interface AuthResponse extends Response {
  // Custom methods can be added here
}

// Middleware options
export interface AuthMiddlewareOptions {
  role?: Role | Role[];
  roles?: Role[];
  emailVerified?: boolean;
  optional?: boolean;
}

// API response types
export interface AuthResult {
  success: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface OAuthCallbackData {
  code: string;
  state?: string;
}

// Database types (aligned with Prisma schema)
export type DatabaseProvider = 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' | 'mongodb' | 'cockroachdb';

export interface DatabaseConfig {
  provider: DatabaseProvider;
  url: string;
}

// CLI types
export interface CLIOptions {
  framework: 'express' | 'fastify' | 'nextjs';
  database: DatabaseProvider;
  strategies: string[];
  features: string[];
  docker: boolean;
  typescript: boolean;
}

// Template types
export interface TemplateConfig {
  name: string;
  framework: string;
  database: DatabaseProvider;
  features: string[];
}
