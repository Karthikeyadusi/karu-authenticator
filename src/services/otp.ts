import CryptoJS from 'crypto-js';
import type { AuthAccount, OTPDisplay } from '../types';

export class OTPService {
  private static instance: OTPService;

  static getInstance(): OTPService {
    if (!OTPService.instance) {
      OTPService.instance = new OTPService();
    }
    return OTPService.instance;
  }

  // Convert base32 to hex
  private base32ToHex(base32: string): string {
    const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    let hex = '';

    base32 = base32.replace(/=+$/, '');

    for (let i = 0; i < base32.length; i++) {
      const val = base32chars.indexOf(base32.charAt(i).toUpperCase());
      if (val === -1) throw new Error('Invalid base32 character in key');
      bits += val.toString(2).padStart(5, '0');
    }

    for (let i = 0; i + 8 <= bits.length; i += 8) {
      const chunk = bits.substr(i, 8);
      hex += parseInt(chunk, 2).toString(16).padStart(2, '0');
    }

    return hex;
  }

  // Generate HMAC-based OTP
  private generateHOTP(secret: string, counter: number, digits: number = 6, algorithm: string = 'SHA1'): string {
    const key = CryptoJS.enc.Hex.parse(this.base32ToHex(secret));
    const counterBytes = CryptoJS.enc.Hex.parse(counter.toString(16).padStart(16, '0'));
    
    let hmac;
    switch (algorithm) {
      case 'SHA256':
        hmac = CryptoJS.HmacSHA256(counterBytes, key);
        break;
      case 'SHA512':
        hmac = CryptoJS.HmacSHA512(counterBytes, key);
        break;
      default:
        hmac = CryptoJS.HmacSHA1(counterBytes, key);
    }

    const hmacHex = hmac.toString(CryptoJS.enc.Hex);
    const offset = parseInt(hmacHex.substring(hmacHex.length - 1), 16);
    const code = (
      ((parseInt(hmacHex.substr(offset * 2, 2), 16) & 0x7f) << 24) |
      ((parseInt(hmacHex.substr(offset * 2 + 2, 2), 16) & 0xff) << 16) |
      ((parseInt(hmacHex.substr(offset * 2 + 4, 2), 16) & 0xff) << 8) |
      (parseInt(hmacHex.substr(offset * 2 + 6, 2), 16) & 0xff)
    ) % Math.pow(10, digits);

    return code.toString().padStart(digits, '0');
  }

  // Generate Time-based OTP
  generateTOTP(account: AuthAccount, timestamp?: number): string {
    const now = timestamp || Math.floor(Date.now() / 1000);
    const counter = Math.floor(now / account.period);
    return this.generateHOTP(account.secret, counter, account.digits, account.algorithm);
  }

  // Generate TOTP for specific future time
  generateTOTPAt(account: AuthAccount, futureTimestamp: number): string {
    const counter = Math.floor(futureTimestamp / account.period);
    return this.generateHOTP(account.secret, counter, account.digits, account.algorithm);
  }

  // Get future OTPs (like your Python script)
  getFutureOTPs(account: AuthAccount, count: number = 5): Array<{code: string, timestamp: number, timeString: string}> {
    const now = Math.floor(Date.now() / 1000);
    const currentPeriod = Math.floor(now / account.period);
    const futureOTPs = [];

    for (let i = 1; i <= count; i++) {
      const futureTimestamp = (currentPeriod + i) * account.period;
      const code = this.generateTOTPAt(account, futureTimestamp);
      const timeString = new Date(futureTimestamp * 1000).toLocaleTimeString();
      
      futureOTPs.push({
        code,
        timestamp: futureTimestamp,
        timeString,
      });
    }

    return futureOTPs;
  }

  // Verify if an OTP is valid for current time window
  verifyTOTP(account: AuthAccount, inputCode: string, windowSize: number = 1): boolean {
    const now = Math.floor(Date.now() / 1000);
    const currentCounter = Math.floor(now / account.period);

    // Check current time window and adjacent windows for clock skew
    for (let i = -windowSize; i <= windowSize; i++) {
      const testCounter = currentCounter + i;
      const validCode = this.generateHOTP(account.secret, testCounter, account.digits, account.algorithm);
      if (validCode === inputCode) {
        return true;
      }
    }

    return false;
  }

  // Get OTP with time remaining and progress
  getOTPDisplay(account: AuthAccount): OTPDisplay {
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = account.period - (now % account.period);
    const progress = ((account.period - timeRemaining) / account.period) * 100;

    return {
      code: this.generateTOTP(account, now),
      timeRemaining,
      progress
    };
  };

  // Format OTP code with spaces for better readability
  formatOTPCode(code: string): string {
    if (code.length === 6) {
      return `${code.slice(0, 3)} ${code.slice(3)}`;
    }
    if (code.length === 8) {
      return `${code.slice(0, 4)} ${code.slice(4)}`;
    }
    return code;
  }

  // Validate secret key
  validateSecret(secret: string): boolean {
    try {
      // Remove any spaces and convert to uppercase
      const cleanSecret = secret.replace(/\s/g, '').toUpperCase();
      
      // Check if it's valid base32
      const base32Regex = /^[A-Z2-7]+=*$/;
      if (!base32Regex.test(cleanSecret)) {
        return false;
      }

      // Try to generate an OTP to validate
      this.base32ToHex(cleanSecret);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Parse otpauth URI
  parseOTPAuthURI(uri: string): Partial<AuthAccount> | null {
    try {
      const url = new URL(uri);
      if (url.protocol !== 'otpauth:') return null;

      const type = url.hostname;
      if (type !== 'totp' && type !== 'hotp') return null;

      const pathParts = url.pathname.substring(1).split(':');
      const issuer = pathParts.length > 1 ? pathParts[0] : url.searchParams.get('issuer') || 'Unknown';
      const name = pathParts.length > 1 ? pathParts[1] : pathParts[0];

      const secret = url.searchParams.get('secret');
      if (!secret) return null;

      return {
        accountIdentifier: name,
        issuer,
        secret,
        type: type as 'totp' | 'hotp',
        algorithm: (url.searchParams.get('algorithm') as 'SHA1' | 'SHA256' | 'SHA512') || 'SHA1',
        digits: parseInt(url.searchParams.get('digits') || '6'),
        period: parseInt(url.searchParams.get('period') || '30'),
        counter: type === 'hotp' ? parseInt(url.searchParams.get('counter') || '0') : undefined
      };
    } catch (error) {
      console.error('Error parsing OTP URI:', error);
      return null;
    }
  }
}