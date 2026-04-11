// src/types/Transaction.ts
// ─────────────────────────────────────────────────────────────
import { TxCategory } from '../modules/LeapModule';
export interface Transaction {
  id: string; smsId: string; amount: number; currencyCode: string;
  merchant: string; category: TxCategory; type: 'DEBIT' | 'CREDIT';
  accountReference: string | null; balance: number | null;
  balanceCurrencyCode: string | null; confidence: number;
  rawSms: string; sender: string; smsDate: number; createdAt: number;
  userVerified: boolean; userCategory: TxCategory | null;
}
export const effectiveCategory = (t: Transaction): TxCategory =>
  t.userCategory ?? t.category;

export const CATEGORY_LABELS: Record<TxCategory, string> = {
  FOOD_DINING: 'Food & Dining', TRANSPORT: 'Transport', SHOPPING: 'Shopping',
  GROCERIES: 'Groceries', UTILITIES: 'Utilities', ENTERTAINMENT: 'Entertainment',
  HEALTH_MEDICAL: 'Health', TRAVEL: 'Travel', EDUCATION: 'Education',
  FUEL: 'Fuel', ATM_CASH: 'ATM / Cash', TRANSFER: 'Transfer',
  SUBSCRIPTION: 'Subscription', INSURANCE: 'Insurance', RENT: 'Rent', OTHER: 'Other',
};

export const CATEGORY_EMOJI: Record<TxCategory, string> = {
  FOOD_DINING: '🍽️', TRANSPORT: '🚌', SHOPPING: '🛍️', GROCERIES: '🛒',
  UTILITIES: '💡', ENTERTAINMENT: '🎬', HEALTH_MEDICAL: '💊', TRAVEL: '✈️',
  EDUCATION: '📚', FUEL: '⛽', ATM_CASH: '💵', TRANSFER: '↔️',
  SUBSCRIPTION: '📱', INSURANCE: '🛡️', RENT: '🏠', OTHER: '📋',
};


