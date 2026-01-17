import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { PrismaClient } from '@prisma/client';
import { OAuthStrategyConfig, User } from '../types';

export class OAuthService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.initializePassport();
  }

  private initializePassport(): void {
    // Serialize user for session
    passport.serializeUser((user: any, done) => {
      done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id },
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
  configureGoogle(config: OAuthStrategyConfig): void {
    if (!config.clientId || !config.clientSecret) {
      throw new Error('Google OAuth clientId and clientSecret are required');
    }

    passport.use(
      new GoogleStrategy(
        {
          clientID: config.clientId,
          clientSecret: config.clientSecret,
          callbackURL: config.callbackURL || '/api/auth/google/callback',
          scope: config.scope || ['profile', 'email'],
        },
        async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
          try {
            const user = await this.handleOAuthCallback(
              'google',
              profile,
              accessToken,
              refreshToken
            );
            done(null, user);
          } catch (error) {
            done(error as Error, undefined);
          }
        }
      )
    );
  }

  /**
   * Configure GitHub OAuth strategy
   */
  configureGitHub(config: OAuthStrategyConfig): void {
    if (!config.clientId || !config.clientSecret) {
      throw new Error('GitHub OAuth clientId and clientSecret are required');
    }

    passport.use(
      new GitHubStrategy(
        {
          clientID: config.clientId,
          clientSecret: config.clientSecret,
          callbackURL: config.callbackURL || '/api/auth/github/callback',
          scope: config.scope || ['user:email'],
        },
        async (accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: User | undefined) => void) => {
          try {
            const user = await this.handleOAuthCallback(
              'github',
              profile,
              accessToken,
              refreshToken
            );
            done(null, user);
          } catch (error) {
            done(error, undefined);
          }
        }
      )
    );
  }

  /**
   * Handle OAuth callback and create/update user
   */
  private async handleOAuthCallback(
    provider: string,
    profile: Profile | any,
    accessToken: string,
    refreshToken?: string
  ): Promise<User> {
    const providerAccountId = profile.id;
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName || profile.username;
    const avatar = profile.photos?.[0]?.value;

    // Check if account already exists
    let account = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      include: { user: true },
    });

    if (account) {
      // Update account tokens and return existing user
      await this.prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: this.calculateTokenExpiry(),
        },
      });

      // Update user profile if needed
      if (account.user.name !== name || account.user.avatar !== avatar) {
        await this.prisma.user.update({
          where: { id: account.user.id },
          data: { name, avatar },
        });
      }

      return account.user;
    }

    // Check if user with this email already exists
    let user = email ? await this.prisma.user.findUnique({
      where: { email },
    }) : null;

    if (user) {
      // Link the account to existing user
      await this.prisma.account.create({
        data: {
          userId: user.id,
          type: 'oauth',
          provider,
          providerAccountId,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: this.calculateTokenExpiry(),
        },
      });

      // Update user profile
      await this.prisma.user.update({
        where: { id: user.id },
        data: { name, avatar },
      });

      return user;
    }

    // Create new user
    user = await this.prisma.user.create({
      data: {
        email,
        name,
        avatar,
        accounts: {
          create: {
            type: 'oauth',
            provider,
            providerAccountId,
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: this.calculateTokenExpiry(),
          },
        },
      },
    });

    return user;
  }

  /**
   * Calculate token expiry (default 1 hour)
   */
  private calculateTokenExpiry(): number {
    return Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  }

  /**
   * Get OAuth redirect URLs
   */
  getOAuthUrls(baseUrl: string = ''): {
    google: { login: string; callback: string };
    github: { login: string; callback: string };
  } {
    return {
      google: {
        login: `${baseUrl}/api/auth/google`,
        callback: `${baseUrl}/api/auth/google/callback`,
      },
      github: {
        login: `${baseUrl}/api/auth/github`,
        callback: `${baseUrl}/api/auth/github/callback`,
      },
    };
  }

  /**
   * Middleware for OAuth authentication
   */
  authenticate(provider: string, options: any = {}) {
    return passport.authenticate(provider, {
      session: false,
      ...options,
    });
  }

  /**
   * Get passport instance
   */
  getPassport(): typeof passport {
    return passport;
  }
}
