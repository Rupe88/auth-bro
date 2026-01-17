import { PrismaClient } from '@prisma/client';
import { Router, Request, Response, NextFunction } from 'express';

interface User {
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
declare enum Role {
    USER = "USER",
    ADMIN = "ADMIN",
    MODERATOR = "MODERATOR"
}
interface AuthConfig {
    prisma: PrismaClient;
    secret: string;
    jwt?: JWTConfig;
    strategies?: StrategiesConfig;
    email?: EmailConfig;
    security?: SecurityConfig;
    hooks?: HooksConfig;
    redirects?: RedirectConfig;
}
interface JWTConfig {
    secret: string;
    accessTokenExpiry?: string;
    refreshTokenExpiry?: string;
    algorithm?: string;
}
interface StrategiesConfig {
    local?: LocalStrategyConfig | boolean;
    google?: OAuthStrategyConfig | boolean;
    github?: OAuthStrategyConfig | boolean;
    phone?: PhoneStrategyConfig | boolean;
    magicLink?: MagicLinkConfig | boolean;
}
interface LocalStrategyConfig {
    enabled?: boolean;
    requireEmailVerification?: boolean;
    passwordMinLength?: number;
    passwordRequirements?: PasswordRequirements;
}
interface PasswordRequirements {
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
}
interface OAuthStrategyConfig {
    enabled?: boolean;
    clientId?: string;
    clientSecret?: string;
    callbackURL?: string;
    scope?: string[];
}
interface PhoneStrategyConfig {
    enabled?: boolean;
    provider?: 'twilio' | 'aws-sns';
    config?: any;
    otpLength?: number;
    otpExpiry?: string;
}
interface MagicLinkConfig {
    enabled?: boolean;
    tokenExpiry?: string;
}
interface EmailConfig {
    provider?: 'resend' | 'nodemailer' | 'sendgrid';
    apiKey?: string;
    from?: string;
    templates?: EmailTemplates;
}
interface EmailTemplates {
    verification?: string;
    passwordReset?: string;
    magicLink?: string;
}
interface SecurityConfig {
    bcryptRounds?: number;
    rateLimiting?: RateLimitConfig;
    sessionMaxAge?: number;
    cookieSettings?: CookieSettings;
}
interface RateLimitConfig {
    enabled?: boolean;
    maxAttempts?: number;
    windowMs?: number;
}
interface CookieSettings {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
}
interface HooksConfig {
    onUserCreated?: (user: User) => Promise<void> | void;
    onLogin?: (user: User, session: any) => Promise<void> | void;
    onLogout?: (userId: string) => Promise<void> | void;
    onEmailVerified?: (user: User) => Promise<void> | void;
}
interface RedirectConfig {
    afterLogin?: string;
    afterLogout?: string;
    afterRegister?: string;
}
interface AuthMiddlewareOptions {
    role?: Role | Role[];
    roles?: Role[];
    emailVerified?: boolean;
    optional?: boolean;
}
interface AuthResult {
    success: boolean;
    user?: User;
    accessToken?: string;
    refreshToken?: string;
    error?: string;
}
type DatabaseProvider = 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' | 'mongodb' | 'cockroachdb';

declare class SchemaGenerator {
    /**
     * Generate complete Prisma schema for authentication
     */
    static generate(provider: DatabaseProvider): string;
    /**
     * Get datasource configuration for different providers
     */
    private static getDatasourceConfig;
    /**
     * Generate environment variables template
     */
    static generateEnvTemplate(provider: DatabaseProvider): string;
    /**
     * Generate Docker Compose configuration
     */
    static generateDockerCompose(provider: DatabaseProvider): string;
    /**
     * List all supported providers
     */
    static getSupportedProviders(): DatabaseProvider[];
    /**
     * Validate provider
     */
    static isValidProvider(provider: string): provider is DatabaseProvider;
}

declare class AuthKit {
    private prisma;
    private jwt;
    private password;
    private oauth;
    private email?;
    private config;
    private router;
    constructor(config: AuthConfig);
    /**
     * Get the Express router with all auth routes
     */
    getRouter(): Router;
    /**
     * Register a new user
     */
    register(data: {
        email: string;
        password: string;
        name?: string;
        phone?: string;
    }): Promise<AuthResult>;
    /**
     * Login user
     */
    login(credentials: {
        email: string;
        password: string;
    }): Promise<AuthResult>;
    /**
     * Verify JWT token and get user
     */
    verifyToken(token: string): Promise<User | null>;
    /**
     * Refresh access token
     */
    refreshToken(refreshToken: string): Promise<AuthResult>;
    /**
     * Logout user (invalidate session)
     */
    logout(refreshToken: string): Promise<boolean>;
    /**
     * Middleware: Require authentication
     */
    requireAuth(options?: AuthMiddlewareOptions): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Middleware: Optional authentication
     */
    optionalAuth(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Extract token from request
     */
    private extractToken;
    /**
     * Create session
     */
    private createSession;
    /**
     * Get session by refresh token
     */
    private getSessionByRefreshToken;
    /**
     * Setup OAuth strategies
     */
    private setupOAuthStrategies;
    /**
     * Setup Express routes
     */
    private setupRoutes;
    /**
     * Handle OAuth callback
     */
    private handleOAuthCallback;
    static generateSchema(provider: string): string;
    static generateEnv(provider: string): string;
    static generateDockerCompose(provider: string): string;
    static getSupportedDatabases(): DatabaseProvider[];
}

export { AuthKit, SchemaGenerator };
