// src/database/BudgetRepository.ts
// ─────────────────────────────────────────────────────────────
import { getDb } from './Database';
import { Budget } from '../types/Budget';
import { v4 as uuid } from 'uuid';

export const BudgetRepository = {
  insert(b: Omit<Budget, 'id' | 'createdAt'>): Budget {
    const id = uuid();
    const now = Date.now();
    if (b.isActive) {
      getDb().execute(`UPDATE budgets SET is_active=0`);
    }
    getDb().execute(
      `INSERT INTO budgets (id,name,monthly_limit,currency,category_caps,exclude_transfers,exclude_refunds,is_active,created_at)
       VALUES(?,?,?,?,?,?,?,?,?)`,
      [
        id, b.name, b.monthlyLimit, b.currency,
        JSON.stringify(b.categoryCaps ?? {}),
        b.excludeTransfers ? 1 : 0, b.excludeRefunds ? 1 : 0,
        b.isActive ? 1 : 0, now,
      ],
    );
    return { ...b, id, createdAt: now };
  },

  getAll(): Budget[] {
    const { rows } = getDb().execute(`SELECT * FROM budgets ORDER BY is_active DESC, created_at DESC`);
    return (rows?._array ?? []).map(toBudget);
  },

  getActive(): Budget | null {
    const { rows } = getDb().execute(`SELECT * FROM budgets WHERE is_active=1 LIMIT 1`);
    const r = rows?._array?.[0];
    return r ? toBudget(r) : null;
  },

  update(id: string, fields: Partial<Omit<Budget, 'id' | 'createdAt'>>): void {
    const sets: string[] = []; const vals: any[] = [];
    if (fields.name !== undefined)             { sets.push('name=?');              vals.push(fields.name); }
    if (fields.monthlyLimit !== undefined)     { sets.push('monthly_limit=?');     vals.push(fields.monthlyLimit); }
    if (fields.currency !== undefined)         { sets.push('currency=?');          vals.push(fields.currency); }
    if (fields.categoryCaps !== undefined)     { sets.push('category_caps=?');     vals.push(JSON.stringify(fields.categoryCaps)); }
    if (fields.excludeTransfers !== undefined) { sets.push('exclude_transfers=?'); vals.push(fields.excludeTransfers ? 1 : 0); }
    if (fields.excludeRefunds !== undefined)   { sets.push('exclude_refunds=?');   vals.push(fields.excludeRefunds ? 1 : 0); }
    if (sets.length === 0) return;
    vals.push(id);
    getDb().execute(`UPDATE budgets SET ${sets.join(',')} WHERE id=?`, vals);
  },

  setActive(id: string): void {
    getDb().transaction(() => {
      getDb().execute(`UPDATE budgets SET is_active=0`);
      getDb().execute(`UPDATE budgets SET is_active=1 WHERE id=?`, [id]);
    });
  },

  delete(id: string): void {
    getDb().execute(`DELETE FROM budgets WHERE id=?`, [id]);
  },
};

function toBudget(r: any): Budget {
  let caps: any = {};
  try { caps = r.category_caps ? JSON.parse(r.category_caps) : {}; } catch { caps = {}; }
  return {
    id: r.id,
    name: r.name,
    monthlyLimit: r.monthly_limit,
    currency: r.currency ?? 'INR',
    categoryCaps: caps,
    excludeTransfers: r.exclude_transfers === 1,
    excludeRefunds: r.exclude_refunds === 1,
    isActive: r.is_active === 1,
    createdAt: r.created_at,
  };
}
