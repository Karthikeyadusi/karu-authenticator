import CryptoJS from 'crypto-js';
import type { User, AuthAccount } from '../types';

const STORAGE_KEY = 'karu_auth';
const ACCOUNTS_KEY = 'karu_accounts';
const SECRET_KEY = 'karu_secret_2024'; // In production, this should be more secure

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

  // Authentication methods
  login(email: string, password: string): boolean {
    // Simple demo authentication - in production, this would be server-side
    const demoUsers = [
      { email: 'demo@gmail.com', password: 'password123' },
      { email: 'user@example.com', password: 'demo123' }
    ];

    const user = demoUsers.find(u => u.email === email && u.password === password);
    if (user) {
      const userData: User = {
        id: Date.now().toString(),
        email: user.email,
        name: user.email.split('@')[0]
      };
      
      localStorage.setItem(STORAGE_KEY, this.encrypt(userData));
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACCOUNTS_KEY);
  }

  getCurrentUser(): User | null {
    const encryptedData = localStorage.getItem(STORAGE_KEY);
    if (encryptedData) {
      return this.decrypt(encryptedData);
    }
    return null;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Account management methods
  getAccounts(): AuthAccount[] {
    const encryptedData = localStorage.getItem(ACCOUNTS_KEY);
    if (encryptedData) {
      const accounts = this.decrypt(encryptedData);
      return accounts || [];
    }
    return [];
  }

  saveAccounts(accounts: AuthAccount[]): void {
    localStorage.setItem(ACCOUNTS_KEY, this.encrypt(accounts));
  }

  addAccount(account: Omit<AuthAccount, 'id'>): AuthAccount {
    const accounts = this.getAccounts();
    const newAccount: AuthAccount = {
      ...account,
      id: Date.now().toString()
    };
    accounts.push(newAccount);
    this.saveAccounts(accounts);
    return newAccount;
  }

  updateAccount(id: string, updates: Partial<AuthAccount>): boolean {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(acc => acc.id === id);
    if (index !== -1) {
      accounts[index] = { ...accounts[index], ...updates };
      this.saveAccounts(accounts);
      return true;
    }
    return false;
  }

  deleteAccount(id: string): boolean {
    const accounts = this.getAccounts();
    const filteredAccounts = accounts.filter(acc => acc.id !== id);
    if (filteredAccounts.length !== accounts.length) {
      this.saveAccounts(filteredAccounts);
      return true;
    }
    return false;
  }
}