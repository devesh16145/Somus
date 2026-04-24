// src/types/Budget.ts
// ─────────────────────────────────────────────────────────────
import { TxCategory } from '../modules/LeapModule';

export interface Budget {
  id: string;
  name: string;
  monthlyLimit: number;
  currency: string;
  categoryCaps: Partial<Record<TxCategory, number>>;
  excludeTransfers: boolean;
  excludeRefunds: boolean;
  isActive: boolean;
  createdAt: number;
}

export type PaceStatus = 'on_track' | 'overspending' | 'underspending';
export type CapStatus = 'under' | 'near' | 'over';

export interface CategoryStatus {
  category: TxCategory;
  spent: number;
  cap: number | null;
  percentUsed: number;
  status: CapStatus;
}

export interface BudgetStatus {
  spent: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  daysElapsed: number;
  daysInMonth: number;
  percentTimeElapsed: number;
  pace: PaceStatus;
  perDayAvailable: number;
  perCategory: CategoryStatus[];
}

export const PACE_TOLERANCE = 5;
export const CAP_NEAR_THRESHOLD = 80;
