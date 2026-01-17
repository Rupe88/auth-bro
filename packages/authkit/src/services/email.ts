import nodemailer from 'nodemailer';
import { EmailConfig, User } from '../types';

export class EmailService {
  private config: EmailConfig;
  private transporter: any;

  constructor(config: EmailConfig) {
    this.config = config;
    this.transporter = this.createTransporter();
  }

  /**
   * Create email transporter
   */
  private createTransporter() {
    if (this.config.provider === 'resend') {
      return nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 587,
        secure: false,
        auth: {
          user: 'resend',
          pass: this.config.apiKey,
        },
      });
    }

    if (this.config.provider === 'nodemailer') {
      // For custom SMTP configuration
      return nodemailer.createTransport(this.config.apiKey as any);
    }

    // Default - throw error if no provider configured
    throw new Error('Email provider not configured');
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(user: User, token: string, baseUrl: string = ''): Promise<boolean> {
    try {
      const verificationUrl = `${baseUrl}/api/auth/verify-email/${token}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ${process.env.APP_NAME || 'Our App'}!</h2>
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
        Welcome to ${process.env.APP_NAME || 'Our App'}!

        Please verify your email address by clicking this link:
        ${verificationUrl}

        This link will expire in 24 hours.

        If you didn't create an account, please ignore this email.
      `;

      await this.sendEmail({
        to: user.email!,
        subject: `Verify your email - ${process.env.APP_NAME || 'Our App'}`,
        html,
        text,
      });

      return true;
    } catch (error) {
      console.error('Failed to send email verification:', error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(user: User, token: string, baseUrl: string = ''): Promise<boolean> {
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
        to: user.email!,
        subject: `Reset your password - ${process.env.APP_NAME || 'Our App'}`,
        html,
        text,
      });

      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  /**
   * Send magic link email
   */
  async sendMagicLink(user: User, token: string, baseUrl: string = ''): Promise<boolean> {
    try {
      const loginUrl = `${baseUrl}/api/auth/magic-link/verify/${token}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Sign In to ${process.env.APP_NAME || 'Our App'}</h2>
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
        Sign In to ${process.env.APP_NAME || 'Our App'}

        Click this link to sign in to your account:
        ${loginUrl}

        This link will expire in 15 minutes.

        If you didn't request this sign-in link, please ignore this email.
      `;

      await this.sendEmail({
        to: user.email!,
        subject: `Sign in to ${process.env.APP_NAME || 'Our App'}`,
        html,
        text,
      });

      return true;
    } catch (error) {
      console.error('Failed to send magic link email:', error);
      return false;
    }
  }

  /**
   * Send generic email
   */
  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.from || 'noreply@yourapp.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }

  /**
   * Generate verification token
   */
  static generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
