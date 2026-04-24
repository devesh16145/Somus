// src/services/BudgetEngine.ts
// ─────────────────────────────────────────────────────────────
import { Budget, BudgetStatus, CategoryStatus, CapStatus, PaceStatus, PACE_TOLERANCE, CAP_NEAR_THRESHOLD } from '../types/Budget';
import { Transaction, effectiveCategory } from '../types/Transaction';
import { TxCategory } from '../modules/LeapModule';
import { TransactionRepository } from '../database/TransactionRepository';

export const BudgetEngine = {
  computeStatus(budget: Budget, transactions: Transaction[], now: Date = new Date()): BudgetStatus {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();

    const eligible = transactions.filter(tx => {
      if (tx.smsDate < monthStart || tx.smsDate > monthEnd) return false;
      const cat = effectiveCategory(tx);
      if (tx.type === 'DEBIT') {
        if (budget.excludeTransfers && cat === 'TRANSFER') return false;
        return true;
      }
      return false;
    });

    const perCatSpent: Partial<Record<TxCategory, number>> = {};
    let spent = 0;
    for (const tx of eligible) {
      spent += tx.amount;
      const cat = effectiveCategory(tx);
      perCatSpent[cat] = (perCatSpent[cat] ?? 0) + tx.amount;
    }

    const remaining = Math.max(0, budget.monthlyLimit - spent);
    const percentUsed = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;
    const percentTimeElapsed = (daysElapsed / daysInMonth) * 100;
    const pace: PaceStatus =
      percentUsed > percentTimeElapsed + PACE_TOLERANCE ? 'overspending' :
      percentUsed < percentTimeElapsed - PACE_TOLERANCE ? 'underspending' :
      'on_track';
    const daysLeft = Math.max(1, daysInMonth - daysElapsed);
    const perDayAvailable = remaining / daysLeft;

    const perCategory: CategoryStatus[] = Object.entries(perCatSpent)
      .map(([cat, amount]) => {
        const c = cat as TxCategory;
        const cap = budget.categoryCaps[c] ?? null;
        const pct = cap && cap > 0 ? ((amount as number) / cap) * 100 : 0;
        const status: CapStatus =
          !cap ? 'under' :
          pct > 100 ? 'over' :
          pct > CAP_NEAR_THRESHOLD ? 'near' : 'under';
        return { category: c, spent: amount as number, cap, percentUsed: pct, status };
      })
      .sort((a, b) => b.spent - a.spent);

    return {
      spent, limit: budget.monthlyLimit, remaining,
      percentUsed, daysElapsed, daysInMonth, percentTimeElapsed,
      pace, perDayAvailable, perCategory,
    };
  },

  suggestFromHistory(monthsBack: number = 3): number {
    const totals = TransactionRepository.getMonthlyTotals(monthsBack + 1);
    const prior = totals.slice(0, -1).filter(m => m.spend > 0);
    if (prior.length === 0) return 0;
    const avg = prior.reduce((s, m) => s + m.spend, 0) / prior.length;
    return Math.round(avg / 500) * 500;
  },

  suggestCategoryCaps(monthsBack: number = 3, budgetLimit: number): Partial<Record<TxCategory, number>> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1).getTime();
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
    const perCat = TransactionRepository.getTotalSpentByCategory(start, end);
    const caps: Partial<Record<TxCategory, number>> = {};
    const scale = monthsBack > 0 ? monthsBack : 1;
    for (const [cat, total] of Object.entries(perCat)) {
      const monthly = total / scale;
      if (monthly >= budgetLimit * 0.08) {
        caps[cat as TxCategory] = Math.round(monthly / 100) * 100;
      }
    }
    return caps;
  },
};
