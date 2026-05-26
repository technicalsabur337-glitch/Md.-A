/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppDatabase, User } from '../types';

export const DB_KEY = 'it_zone_v3_db';
export const USERS_KEY = 'it_zone_users_v1';
export const SESSION_KEY = 'it_zone_session_v1';

export const DEFAULT_USERS: User[] = [
  { id: '25800', password: '123456', name: 'মোঃ আব্দুর সবুর', shopName: 'আইটি জোন', status: 'active' },
  { id: 'admin', password: '123456', name: 'Admin', shopName: 'আইটি জোন', status: 'active' }
];

export function getInitialDatabase(): AppDatabase {
  return {
    dayStart: {},
    dayEnd: {},
    pawona: {},
    porishod: {},
    products: [],
    sales: [],
    ledgers: [],
    expenses: []
  };
}

export function loadDatabase(): AppDatabase {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (!data) return getInitialDatabase();
    
    const parsed = JSON.parse(data);
    return {
      dayStart: parsed.dayStart || {},
      dayEnd: parsed.dayEnd || {},
      pawona: parsed.pawona || {},
      porishod: parsed.porishod || {},
      products: parsed.products || [],
      sales: parsed.sales || [],
      ledgers: parsed.ledgers || [],
      expenses: parsed.expenses || []
    };
  } catch (error) {
    console.error('Error loading database:', error);
    return getInitialDatabase();
  }
}

export function saveDatabase(db: AppDatabase): void {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

export function loadUsers(): User[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
}

export function saveUsers(users: User[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

export function getActiveSession(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setActiveSession(userId: string | null): void {
  if (userId) {
    localStorage.setItem(SESSION_KEY, userId);
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function isUserAdmin(userId: string): boolean {
  return userId === '25800' || userId === 'admin';
}

export const PAYMENT_METHODS: Record<string, string> = {
  cash: 'ক্যাশ (টাকা)',
  bkash: 'বিকাশ',
  rocket: 'রকেট',
  nagad: 'নগদ',
  load1: 'লোড ২০২২৩৪৭১',
  load2: 'লোড ২০২২৯৮০৬',
  other: 'অন্যান্য'
};

export const PAYMENT_KEYS: Array<keyof import('../types').DayBalances> = [
  'cash',
  'bkash',
  'rocket',
  'nagad',
  'load1',
  'load2',
  'other'
];

export function getTodayDateString(): string {
  // Return YYYY-MM-DD local time adjusted for Bangladesh
  const date = new Date();
  
  // Convert UTC to Bangladesh local time (UTC+6)
  const tzOffset = 6 * 60; // offset in minutes
  const localTime = new Date(date.getTime() + tzOffset * 60000);
  
  return localTime.toISOString().slice(0, 10);
}

export function getCurrentMonthString(): string {
  const date = new Date();
  const tzOffset = 6 * 60;
  const localTime = new Date(date.getTime() + tzOffset * 60000);
  return localTime.toISOString().slice(0, 7); // YYYY-MM
}
