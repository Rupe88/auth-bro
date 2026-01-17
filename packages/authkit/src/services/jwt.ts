import jwt from 'jsonwebtoken';
import { User, JWTConfig } from '../types';

export class JWTService {
  private config: Required<Pick<JWTConfig, 'secret' | 'accessTokenExpiry' | 'refreshTokenExpiry' | 'algorithm'>>;

  constructor(config: JWTConfig) {
    this.config = {
      secret: config.secret || '',
      accessTokenExpiry: config.accessTokenExpiry || '15m',
      refreshTokenExpiry: config.refreshTokenExpiry || '7d',
      algorithm: config.algorithm || 'HS256',
    };
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload: { userId: string; email?: string; role?: string }): string {
    return jwt.sign(payload, this.config.secret, {
      expiresIn: this.config.accessTokenExpiry,
      algorithm: this.config.algorithm as jwt.Algorithm,
    } as any);
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: { userId: string; tokenId: string }): string {
    return jwt.sign(payload, this.config.secret, {
      expiresIn: this.config.refreshTokenExpiry,
      algorithm: this.config.algorithm as jwt.Algorithm,
    } as any);
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): { userId: string; email?: string; role?: string } | null {
    try {
      const decoded = jwt.verify(token, this.config.secret, {
        algorithms: [this.config.algorithm as jwt.Algorithm],
      }) as any;
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): { userId: string; tokenId: string } | null {
    try {
      const decoded = jwt.verify(token, this.config.secret, {
        algorithms: [this.config.algorithm as jwt.Algorithm],
      }) as any;
      return {
        userId: decoded.userId,
        tokenId: decoded.tokenId,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;
      return Date.now() >= decoded.exp * 1000;
    } catch (error) {
      return true;
    }
  }

  /**
   * Generate token pair
   */
  generateTokenPair(user: User): {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: number;
    refreshTokenExpiry: number;
  } {
    const tokenId = this.generateTokenId();
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = this.generateRefreshToken({
      userId: user.id,
      tokenId,
    });

    // Calculate expiry timestamps
    const accessTokenExpiry = this.calculateExpiry(this.config.accessTokenExpiry!);
    const refreshTokenExpiry = this.calculateExpiry(this.config.refreshTokenExpiry!);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiry,
      refreshTokenExpiry,
    };
  }

  /**
   * Generate unique token ID
   */
  private generateTokenId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Calculate expiry timestamp from string
   */
  private calculateExpiry(expiry: string): number {
    // Simple implementation - in production you might want more robust parsing
    const now = Date.now();
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return now + 15 * 60 * 1000; // Default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return now + value * 1000;
      case 'm': return now + value * 60 * 1000;
      case 'h': return now + value * 60 * 60 * 1000;
      case 'd': return now + value * 24 * 60 * 60 * 1000;
      default: return now + 15 * 60 * 1000;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken(refreshToken: string, user: User): string | null {
    const decoded = this.verifyRefreshToken(refreshToken);
    if (!decoded || decoded.userId !== user.id) {
      return null;
    }

    return this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  }
}
