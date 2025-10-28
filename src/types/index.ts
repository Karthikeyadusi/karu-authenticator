export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthAccount {
  id: string;
  accountIdentifier?: string; // e.g., "naren@gmail.com" from QR code
  issuer: string;
  secret: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: number;
  period: number;
  type: 'totp' | 'hotp';
  counter?: number; // for HOTP
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accounts: AuthAccount[];
  developerMode: boolean;
}

export interface OTPDisplay {
  code: string;
  timeRemaining: number;
  progress: number;
}

// Utility function to generate display name for accounts
export const getAccountDisplayName = (account: AuthAccount): string => {
  if (account.accountIdentifier) {
    return `${account.issuer} (${account.accountIdentifier})`;
  }
  return account.issuer;
};

// Utility function to get short display name for cards
export const getAccountShortName = (account: AuthAccount): string => {
  return account.issuer;
};

// Utility function to get account subtitle  
export const getAccountSubtitle = (account: AuthAccount): string | undefined => {
  return account.accountIdentifier;
};

export interface FutureOTP {
  code: string;
  timestamp: number;
  timeString: string;
}

export interface DeveloperModeData {
  futureOTPs: FutureOTP[];
  currentTimestamp: number;
  nextRefresh: number;
}

export interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AddAccountForm {
  accountIdentifier: string;
  issuer: string;
  secret: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: number;
  period: number;
}