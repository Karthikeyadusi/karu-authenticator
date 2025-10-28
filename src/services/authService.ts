import CryptoJS from 'crypto-js';
import type { User, AuthAccount } from '../types';

const STORAGE_KEY = 'karu_auth';
const ACCOUNTS_KEY = 'karu_accounts';
const USERS_KEY = 'karu_users';
const SECRET_KEY = 'karu_secret_2024'; // In production, this should be more secure

export interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

export class AuthService {
  private static instance: AuthService;
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Encrypt data before storing
  private encrypt(data: any): string {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
  }

  // Decrypt data after retrieving
  private decrypt(encryptedData: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  // Hash password for secure storage
  private hashPassword(password: string, salt: string): string {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: 256/32,
      iterations: 1000
    }).toString();
  }

  // Generate random salt
  private generateSalt(): string {
    return CryptoJS.lib.WordArray.random(128/8).toString();
  }

  // Get stored users
  private getStoredUsers(): any[] {
    try {
      const encryptedUsers = localStorage.getItem(USERS_KEY);
      if (encryptedUsers) {
        return this.decrypt(encryptedUsers) || [];
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  // Store users
  private storeUsers(users: any[]): void {
    localStorage.setItem(USERS_KEY, this.encrypt(users));
  }

  // Validate email format
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  private isValidPassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { valid: false, message: 'Password must contain uppercase, lowercase, and numbers' };
    }
    return { valid: true };
  }

  // Sign up new user
  signup(data: SignupData): { success: boolean; message?: string; user?: User } {
    const { email, password, confirmPassword, name } = data;

    // Validation
    if (!this.isValidEmail(email)) {
      return { success: false, message: 'Invalid email format' };
    }

    if (password !== confirmPassword) {
      return { success: false, message: 'Passwords do not match' };
    }

    const passwordValidation = this.isValidPassword(password);
    if (!passwordValidation.valid) {
      return { success: false, message: passwordValidation.message };
    }

    if (!name.trim()) {
      return { success: false, message: 'Name is required' };
    }

    // Check if user already exists
    const users = this.getStoredUsers();
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return { success: false, message: 'An account with this email already exists' };
    }

    // Create new user
    const salt = this.generateSalt();
    const hashedPassword = this.hashPassword(password, salt);
    const userId = Date.now().toString();

    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      name: name.trim(),
      password: hashedPassword,
      salt: salt,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    // Store user
    users.push(newUser);
    this.storeUsers(users);

    // Create user session
    const userData: User = {
      id: userId,
      email: newUser.email,
      name: newUser.name
    };

    localStorage.setItem(STORAGE_KEY, this.encrypt(userData));

    return { success: true, user: userData };
  }

  // Login user
  login(email: string, password: string): { success: boolean; message?: string; user?: User } {
    if (!this.isValidEmail(email)) {
      return { success: false, message: 'Invalid email format' };
    }

    const users = this.getStoredUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return { success: false, message: 'Invalid email or password' };
    }

    // Verify password
    const hashedPassword = this.hashPassword(password, user.salt);
    if (hashedPassword !== user.password) {
      return { success: false, message: 'Invalid email or password' };
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    this.storeUsers(users);

    // Create session
    const userData: User = {
      id: user.id,
      email: user.email,
      name: user.name
    };

    localStorage.setItem(STORAGE_KEY, this.encrypt(userData));

    return { success: true, user: userData };
  }

  // Get current user
  getCurrentUser(): User | null {
    try {
      const encryptedUser = localStorage.getItem(STORAGE_KEY);
      if (encryptedUser) {
        return this.decrypt(encryptedUser);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Logout user
  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Get user accounts (encrypted)
  getUserAccounts(): AuthAccount[] {
    try {
      const user = this.getCurrentUser();
      if (!user) return [];

      const userAccountsKey = `${ACCOUNTS_KEY}_${user.id}`;
      const encryptedAccounts = localStorage.getItem(userAccountsKey);
      if (encryptedAccounts) {
        return this.decrypt(encryptedAccounts) || [];
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  // Store user accounts (encrypted)
  storeUserAccounts(accounts: AuthAccount[]): void {
    try {
      const user = this.getCurrentUser();
      if (!user) return;

      const userAccountsKey = `${ACCOUNTS_KEY}_${user.id}`;
      localStorage.setItem(userAccountsKey, this.encrypt(accounts));
    } catch (error) {
      console.error('Failed to store accounts:', error);
    }
  }

  // Delete user account and all data
  deleteAccount(): boolean {
    try {
      const user = this.getCurrentUser();
      if (!user) return false;

      // Remove user from users list
      const users = this.getStoredUsers();
      const updatedUsers = users.filter(u => u.id !== user.id);
      this.storeUsers(updatedUsers);

      // Remove user's accounts
      const userAccountsKey = `${ACCOUNTS_KEY}_${user.id}`;
      localStorage.removeItem(userAccountsKey);

      // Remove session
      this.logout();

      return true;
    } catch (error) {
      return false;
    }
  }

  // Change password
  changePassword(oldPassword: string, newPassword: string): { success: boolean; message?: string } {
    const user = this.getCurrentUser();
    if (!user) {
      return { success: false, message: 'Not authenticated' };
    }

    const users = this.getStoredUsers();
    const userRecord = users.find(u => u.id === user.id);
    if (!userRecord) {
      return { success: false, message: 'User not found' };
    }

    // Verify old password
    const hashedOldPassword = this.hashPassword(oldPassword, userRecord.salt);
    if (hashedOldPassword !== userRecord.password) {
      return { success: false, message: 'Current password is incorrect' };
    }

    // Validate new password
    const passwordValidation = this.isValidPassword(newPassword);
    if (!passwordValidation.valid) {
      return { success: false, message: passwordValidation.message };
    }

    // Update password
    const newSalt = this.generateSalt();
    userRecord.password = this.hashPassword(newPassword, newSalt);
    userRecord.salt = newSalt;

    this.storeUsers(users);

    return { success: true };
  }
}