// src/types/Goal.ts
// ─────────────────────────────────────────────────────────────

export type GoalTemplate = 'custom' | 'loan' | 'travel' | 'emergency' | 'purchase';
export type GoalPriority = 'high' | 'medium' | 'low';
export type GoalCurrency = 'INR' | 'USD' | 'EUR' | 'AED' | 'GBP' | 'JPY' | 'SGD' | 'AUD' | 'CAD' | 'CHF';

export const CURRENCY_OPTIONS: { code: GoalCurrency; symbol: string; label: string }[] = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', label: 'Swiss Franc' },
];

export function currencySymbolFor(code: GoalCurrency): string {
  return CURRENCY_OPTIONS.find(c => c.code === code)?.symbol ?? code;
}

export interface Goal {
  id: string;
  name: string;
  template: GoalTemplate;
  targetAmount: number;
  savedAmount: number;
  currency: GoalCurrency;
  priority: GoalPriority;
  isPrimary: boolean;
  icon: string;
  metadata: string | null; // JSON string for template-specific data
  createdAt: number;
  completedAt: number | null;
}

// Template-specific metadata shapes
export interface LoanMeta {
  loanType: 'home' | 'education' | 'car' | 'personal' | 'other';
  principal: number;
  interestRate: number;
  emiAmount: number;
  tenureMonths: number;
  monthsPaid: number;
}

export interface TravelMeta {
  destination: string;
  tripDate: string; // ISO date string
  breakdown: string; // freeform notes
}

export interface EmergencyMeta {
  monthlyExpenses: number;
  bufferMonths: number;
}

export interface PurchaseMeta {
  itemName: string;
  monthlySavingsPlan: number;
}

export const GOAL_TEMPLATES: { key: GoalTemplate; label: string; icon: string; desc: string }[] = [
  { key: 'custom',    label: 'Custom',         icon: 'disc',   desc: 'Any personal savings goal' },
  { key: 'loan',      label: 'Loan Payoff',    icon: 'home',   desc: 'Track EMI, interest & tenure' },
  { key: 'travel',    label: 'Travel',         icon: 'plane',  desc: 'Dream vacation fund' },
  { key: 'emergency', label: 'Emergency Fund', icon: 'shield', desc: 'Safety net for rainy days' },
  { key: 'purchase',  label: 'Major Purchase', icon: 'bag',    desc: 'Save up for a big buy' },
];

export const LOAN_TYPES: { key: LoanMeta['loanType']; label: string }[] = [
  { key: 'home', label: 'Home Loan' },
  { key: 'education', label: 'Education' },
  { key: 'car', label: 'Car Loan' },
  { key: 'personal', label: 'Personal' },
  { key: 'other', label: 'Other' },
];

// Popular travel destinations
export const TRAVEL_DESTINATIONS = [
  'Japan', 'Thailand', 'Bali', 'Maldives', 'Dubai', 'Singapore',
  'Europe Tour', 'Switzerland', 'Paris', 'London', 'New York',
  'Australia', 'New Zealand', 'Goa', 'Kashmir', 'Ladakh',
];

export function computeLoanRemaining(meta: LoanMeta): number {
  const totalPaid = meta.emiAmount * meta.monthsPaid;
  return Math.max(0, meta.principal - totalPaid);
}

export function computeLoanProgress(meta: LoanMeta): number {
  if (meta.principal <= 0) return 0;
  const paid = meta.emiAmount * meta.monthsPaid;
  return Math.min(100, Math.round((paid / meta.principal) * 100));
}
