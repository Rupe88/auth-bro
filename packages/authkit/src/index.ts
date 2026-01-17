import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import { AuthConfig, AuthRequest, AuthMiddlewareOptions, User, Role, AuthResult } from './types';
import { JWTService } from './services/jwt';
import { PasswordService } from './services/password';
import { OAuthService } from './services/oauth';
import { EmailService } from './services/email';
import { SchemaGenerator } from './utils/schema-generator';

export class AuthKit {
  private prisma: PrismaClient;
  private jwt: JWTService;
  private password: PasswordService;
  private oauth: OAuthService;
  private email?: EmailService;
  private config: AuthConfig;
  private router: Router;

  constructor(config: AuthConfig) {
    this.prisma = config.prisma;
    this.config = {
      jwt: {
        secret: config.secret,
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '7d',
        algorithm: 'HS256',
        ...config.jwt,
      },
      strategies: {
        local: true,
        ...config.strategies,
      },
      security: {
        bcryptRounds: 12,
        rateLimiting: {
          enabled: true,
          maxAttempts: 5,
          windowMs: 15 * 60 * 1000,
        },
        sessionMaxAge: 7 * 24 * 60 * 60 * 1000,
        cookieSettings: {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
        },
        ...config.security,
      },
      ...config,
    };

    this.jwt = new JWTService(this.config.jwt!);
    this.password = new PasswordService(this.config.security!.bcryptRounds);
    this.oauth = new OAuthService(this.prisma);

    if (this.config.email) {
      this.email = new EmailService(this.config.email);
    }

    this.router = Router();

    this.setupOAuthStrategies();
    this.setupRoutes();
  }

  /**
   * Get the Express router with all auth routes
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Register a new user
   */
  async register(data: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
  }): Promise<AuthResult> {
    try {
      // Validate password
      const passwordValidation = this.password.validate(data.password);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: passwordValidation.errors.join(', '),
        };
      }

      // Hash password
      const hashedPassword = await this.password.hash(data.password);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          password: hashedPassword,
          name: data.name,
          phone: data.phone,
        },
      });

      // Generate tokens
      const tokens = this.jwt.generateTokenPair(user);

      // Create session
      await this.createSession(user.id, tokens.refreshToken);

      // Call hook
      if (this.config.hooks?.onUserCreated) {
        await this.config.hooks.onUserCreated(user);
      }

      return {
        success: true,
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        return {
          success: false,
          error: 'User with this email already exists',
        };
      }

      return {
        success: false,
        error: 'Registration failed',
      };
    }
  }

  /**
   * Login user
   */
  async login(credentials: { email: string; password: string }): Promise<AuthResult> {
    try {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase() },
      });

      if (!user || !user.password) {
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Verify password
      const isValidPassword = await this.password.verify(credentials.password, user.password);
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate tokens
      const tokens = this.jwt.generateTokenPair(user);

      // Create session
      await this.createSession(user.id, tokens.refreshToken);

      // Call hook
      if (this.config.hooks?.onLogin) {
        const session = await this.getSessionByRefreshToken(tokens.refreshToken);
        await this.config.hooks.onLogin(user, session);
      }

      return {
        success: true,
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Login failed',
      };
    }
  }

  /**
   * Verify JWT token and get user
   */
  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = this.jwt.verifyAccessToken(token);
      if (!decoded) return null;

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const session = await this.getSessionByRefreshToken(refreshToken);
      if (!session || session.expiresAt < new Date()) {
        return {
          success: false,
          error: 'Invalid or expired refresh token',
        };
      }

      const user = await this.prisma.user.findUnique({
        where: { id: session.userId },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Generate new tokens
      const tokens = this.jwt.generateTokenPair(user);

      // Update session with new refresh token
      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + this.config.security!.sessionMaxAge!),
        },
      });

      return {
        success: true,
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Token refresh failed',
      };
    }
  }

  /**
   * Logout user (invalidate session)
   */
  async logout(refreshToken: string): Promise<boolean> {
    try {
      const session = await this.getSessionByRefreshToken(refreshToken);
      if (session) {
        await this.prisma.session.delete({
          where: { id: session.id },
        });

        // Call hook
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
  requireAuth(options: AuthMiddlewareOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      (async () => {
        try {
          const token = this.extractToken(req);
          if (!token) {
            res.status(401).json({ error: 'No token provided' });
            return;
          }

          const user = await this.verifyToken(token);
          if (!user) {
            res.status(401).json({ error: 'Invalid token' });
            return;
          }

          // Check role requirements
          if (options.role && user.role !== options.role) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
          }

          if (options.roles && !options.roles.includes(user.role!)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
          }

          // Check email verification requirement
          if (options.emailVerified && !user.emailVerified) {
            res.status(403).json({ error: 'Email not verified' });
            return;
          }

          (req as any).user = user;
          next();
        } catch (error) {
          res.status(401).json({ error: 'Authentication failed' });
        }
      })();
    };
  }

  /**
   * Middleware: Optional authentication
   */
  optionalAuth(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      (async () => {
        try {
          const token = this.extractToken(req);
          if (token) {
            const user = await this.verifyToken(token);
            if (user) {
              (req as any).user = user;
            }
          }
          next();
        } catch (error) {
          // Ignore auth errors for optional auth
          next();
        }
      })();
    };
  }

  /**
   * Extract token from request
   */
  private extractToken(req: Request): string | null {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check cookies
    const cookieToken = req.cookies?.accessToken;
    if (cookieToken) {
      return cookieToken;
    }

    return null;
  }

  /**
   * Create session
   */
  private async createSession(userId: string, refreshToken: string): Promise<void> {
    await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt: new Date(Date.now() + this.config.security!.sessionMaxAge!),
        userAgent: 'API', // TODO: Extract from request
        ipAddress: '127.0.0.1', // TODO: Extract from request
      },
    });
  }

  /**
   * Get session by refresh token
   */
  private async getSessionByRefreshToken(refreshToken: string) {
    return this.prisma.session.findUnique({
      where: { refreshToken },
    });
  }

  /**
   * Setup OAuth strategies
   */
  private setupOAuthStrategies(): void {
    if (this.config.strategies?.google && typeof this.config.strategies.google === 'object') {
      this.oauth.configureGoogle(this.config.strategies.google);
    }

    if (this.config.strategies?.github && typeof this.config.strategies.github === 'object') {
      this.oauth.configureGitHub(this.config.strategies.github);
    }
  }

  /**
   * Setup Express routes
   */
  private setupRoutes(): void {
    // Rate limiting
    if (this.config.security?.rateLimiting?.enabled) {
      const limiter = rateLimit({
        windowMs: this.config.security.rateLimiting.windowMs,
        max: this.config.security.rateLimiting.maxAttempts,
        message: { error: 'Too many requests, please try again later' },
      });
      this.router.use('/login', limiter);
      this.router.use('/register', limiter);
    }

    // Auth routes
    this.router.post('/register', async (req: Request, res: Response) => {
      const result = await this.register(req.body);
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json({ error: result.error });
      }
    });

    this.router.post('/login', async (req: Request, res: Response) => {
      const result = await this.login(req.body);
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json({ error: result.error });
      }
    });

    this.router.post('/refresh', async (req: Request, res: Response) => {
      const { refreshToken } = req.body;
      const result = await this.refreshToken(refreshToken);
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json({ error: result.error });
      }
    });

    this.router.post('/logout', async (req: Request, res: Response) => {
      const { refreshToken } = req.body;
      const success = await this.logout(refreshToken);
      res.status(success ? 200 : 400).json({ success });
    });

    this.router.get('/me', this.requireAuth(), async (req: Request, res: Response) => {
      const authReq = req as AuthRequest;
      res.json({ user: authReq.user });
    });

    // Email verification routes
    if (this.email) {
      this.router.post('/verify-email/send', this.requireAuth(), async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const user = authReq.user!;
        if (user.emailVerified) {
          res.status(400).json({ error: 'Email already verified' });
          return;
        }

        const token = EmailService.generateToken();
        await this.prisma.verificationToken.create({
          data: {
            userId: user.id,
            token,
            type: 'EMAIL_VERIFICATION',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          },
        });

        const success = await this.email!.sendEmailVerification(user, token);
        res.json({ success });
      });

      this.router.get('/verify-email/:token', async (req: Request, res: Response) => {
        const { token } = req.params;

        const verificationToken = await this.prisma.verificationToken.findUnique({
          where: { token },
          include: { user: true },
        });

        if (!verificationToken || verificationToken.type !== 'EMAIL_VERIFICATION') {
          res.status(400).json({ error: 'Invalid token' });
          return;
        }

        if (verificationToken.expiresAt < new Date()) {
          res.status(400).json({ error: 'Token expired' });
          return;
        }

        // Mark email as verified
        await this.prisma.user.update({
          where: { id: verificationToken.userId },
          data: { emailVerified: true },
        });

        // Delete token
        await this.prisma.verificationToken.delete({
          where: { id: verificationToken.id },
        });

        // Call hook
        if (this.config.hooks?.onEmailVerified) {
          await this.config.hooks.onEmailVerified(verificationToken.user);
        }

        res.json({ success: true, message: 'Email verified successfully' });
      });

      // Password reset routes
      this.router.post('/forgot-password', async (req: Request, res: Response) => {
        const { email } = req.body;

        if (!EmailService.isValidEmail(email)) {
          res.status(400).json({ error: 'Invalid email format' });
          return;
        }

        const user = await this.prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // Don't reveal if email exists
          res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
          return;
        }

        const token = EmailService.generateToken();
        await this.prisma.verificationToken.create({
          data: {
            userId: user.id,
            token,
            type: 'PASSWORD_RESET',
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          },
        });

        const success = await this.email!.sendPasswordReset(user, token);
        res.json({ success });
      });

      this.router.post('/reset-password', async (req: Request, res: Response) => {
        const { token, password } = req.body;

        const verificationToken = await this.prisma.verificationToken.findUnique({
          where: { token },
          include: { user: true },
        });

        if (!verificationToken || verificationToken.type !== 'PASSWORD_RESET') {
          res.status(400).json({ error: 'Invalid token' });
          return;
        }

        if (verificationToken.expiresAt < new Date()) {
          res.status(400).json({ error: 'Token expired' });
          return;
        }

        // Validate new password
        const passwordValidation = this.password.validate(password);
        if (!passwordValidation.valid) {
          res.status(400).json({ error: passwordValidation.errors.join(', ') });
          return;
        }

        // Hash new password
        const hashedPassword = await this.password.hash(password);

        // Update password
        await this.prisma.user.update({
          where: { id: verificationToken.userId },
          data: { password: hashedPassword },
        });

        // Delete token
        await this.prisma.verificationToken.delete({
          where: { id: verificationToken.id },
        });

        res.json({ success: true, message: 'Password reset successfully' });
      });
    }

    // OAuth routes
    if (this.config.strategies?.google && typeof this.config.strategies.google === 'object') {
      this.router.get('/google', this.oauth.authenticate('google'));
      this.router.get('/google/callback',
        this.oauth.authenticate('google', { session: false }),
        this.handleOAuthCallback.bind(this)
      );
    }

    if (this.config.strategies?.github && typeof this.config.strategies.github === 'object') {
      this.router.get('/github', this.oauth.authenticate('github'));
      this.router.get('/github/callback',
        this.oauth.authenticate('github', { session: false }),
        this.handleOAuthCallback.bind(this)
      );
    }
  }

  /**
   * Handle OAuth callback
   */
  private async handleOAuthCallback(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user as User;
      if (!user) {
        res.status(401).json({ error: 'OAuth authentication failed' });
        return;
      }

      // Generate tokens
      const tokens = this.jwt.generateTokenPair(user);

      // Create session
      await this.createSession(user.id, tokens.refreshToken);

      // Call hook
      if (this.config.hooks?.onLogin) {
        const session = await this.getSessionByRefreshToken(tokens.refreshToken);
        await this.config.hooks.onLogin(user, session);
      }

      res.json({
        success: true,
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      res.status(500).json({ error: 'OAuth callback failed' });
    }
  }

  // Static methods for schema generation
  static generateSchema(provider: string) {
    if (!SchemaGenerator.isValidProvider(provider)) {
      throw new Error(`Unsupported database provider: ${provider}`);
    }
    return SchemaGenerator.generate(provider as any);
  }

  static generateEnv(provider: string) {
    if (!SchemaGenerator.isValidProvider(provider)) {
      throw new Error(`Unsupported database provider: ${provider}`);
    }
    return SchemaGenerator.generateEnvTemplate(provider as any);
  }

  static generateDockerCompose(provider: string) {
    if (!SchemaGenerator.isValidProvider(provider)) {
      throw new Error(`Unsupported database provider: ${provider}`);
    }
    return SchemaGenerator.generateDockerCompose(provider as any);
  }

  static getSupportedDatabases() {
    return SchemaGenerator.getSupportedProviders();
  }
}

// Export utilities
export { SchemaGenerator };
