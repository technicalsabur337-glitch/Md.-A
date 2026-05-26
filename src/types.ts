/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  password?: string;
  name: string;
  shopName: string;
  status: 'active' | 'pending';
  registeredAt?: string;
}

export interface DayBalances {
  cash: number;
  bkash: number;
  rocket: number;
  nagad: number;
  load1: number;
  load2: number;
  other: number;
}

export interface CustomItem {
  id: string | number;
  label: string;
  amount: number;
}

export interface Product {
  id: number;
  name: string;
  buyPrice: number;
  sellPrice: number;
  qty: number;
  details?: string;
  image?: string; // base64 string
}

export interface Sale {
  id: number;
  date: string;
  prodId: number | null;
  prodName: string;
  qty: number;
  method: string;
  desc: string;
  amount: number;
  profit: number;
}

export interface Ledger {
  id: number;
  date: string;
  name: string;
  phone: string;
  amount: number;
}

export interface Expense {
  id: number;
  date: string;
  category: string;
  method: string;
  desc: string;
  amount: number;
}

export interface AppDatabase {
  dayStart: Record<string, DayBalances>; // date -> DayBalances
  dayEnd: Record<string, DayBalances>; // date -> DayBalances
  pawona: Record<string, CustomItem[]>; // date -> items
  porishod: Record<string, CustomItem[]>; // date -> items
  products: Product[];
  sales: Sale[];
  ledgers: Ledger[];
  expenses: Expense[];
}
