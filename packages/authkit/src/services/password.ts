import bcrypt from 'bcrypt';
import { PasswordRequirements } from '../types';

export class PasswordService {
  private bcryptRounds: number;

  constructor(bcryptRounds: number = 12) {
    this.bcryptRounds = bcryptRounds;
  }

  /**
   * Hash a password
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.bcryptRounds);
  }

  /**
   * Verify a password against its hash
   */
  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   */
  validate(password: string, requirements?: PasswordRequirements): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Default requirements
    const reqs = {
      uppercase: requirements?.uppercase ?? true,
      lowercase: requirements?.lowercase ?? true,
      numbers: requirements?.numbers ?? true,
      symbols: requirements?.symbols ?? false,
      minLength: 8,
    };

    // Check minimum length
    if (password.length < reqs.minLength) {
      errors.push(`Password must be at least ${reqs.minLength} characters long`);
    }

    // Check uppercase requirement
    if (reqs.uppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check lowercase requirement
    if (reqs.lowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check numbers requirement
    if (reqs.numbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Check symbols requirement
    if (reqs.symbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate a secure random password
   */
  generateSecurePassword(length: number = 12): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';

    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // symbol

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Check if password needs rehashing (for migration purposes)
   */
  needsRehash(hash: string): boolean {
    try {
      const hashInfo = bcrypt.getRounds(hash);
      return hashInfo < this.bcryptRounds;
    } catch (error) {
      // If we can't parse the hash, assume it needs rehashing
      return true;
    }
  }

  /**
   * Rehash a password if needed
   */
  async rehashIfNeeded(password: string, currentHash: string): Promise<string> {
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
  getStrengthScore(password: string): number {
    let score = 0;

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Character variety
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

    // Complexity bonus
    if (password.length >= 16 && score >= 4) score++;

    return Math.min(score, 4);
  }

  /**
   * Get strength label
   */
  getStrengthLabel(password: string): string {
    const score = this.getStrengthScore(password);
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[score];
  }
}
