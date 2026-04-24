// src/database/GoalRepository.ts
// ─────────────────────────────────────────────────────────────
import { getDb } from './Database';
import { Goal } from '../types/Goal';
import { v4 as uuid } from 'uuid';

export const GoalRepository = {
  insert(g: Omit<Goal, 'id' | 'createdAt' | 'completedAt'>): Goal {
    const id = uuid();
    const now = Date.now();
    getDb().execute(
      `INSERT INTO goals (id,name,template,target_amount,saved_amount,currency,priority,is_primary,icon,metadata,created_at)
       VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
      [id, g.name, g.template, g.targetAmount, g.savedAmount, g.currency, g.priority, g.isPrimary ? 1 : 0, g.icon, g.metadata, now]
    );
    return { ...g, id, createdAt: now, completedAt: null };
  },

  getAll(): Goal[] {
    const { rows } = getDb().execute(`SELECT * FROM goals ORDER BY is_primary DESC, created_at DESC`);
    return (rows?._array ?? []).map(toGoal);
  },

  update(id: string, fields: Partial<Pick<Goal, 'name' | 'targetAmount' | 'savedAmount' | 'priority' | 'icon' | 'metadata' | 'currency'>>): void {
    const sets: string[] = [];
    const vals: any[] = [];
    if (fields.name !== undefined)         { sets.push('name=?');          vals.push(fields.name); }
    if (fields.targetAmount !== undefined)  { sets.push('target_amount=?'); vals.push(fields.targetAmount); }
    if (fields.savedAmount !== undefined)   { sets.push('saved_amount=?');  vals.push(fields.savedAmount); }
    if (fields.priority !== undefined)      { sets.push('priority=?');      vals.push(fields.priority); }
    if (fields.icon !== undefined)          { sets.push('icon=?');          vals.push(fields.icon); }
    if (fields.metadata !== undefined)      { sets.push('metadata=?');      vals.push(fields.metadata); }
    if (fields.currency !== undefined)      { sets.push('currency=?');      vals.push(fields.currency); }
    if (sets.length === 0) return;
    vals.push(id);
    getDb().execute(`UPDATE goals SET ${sets.join(',')} WHERE id=?`, vals);
  },

  addFunds(id: string, amount: number): void {
    getDb().execute(`UPDATE goals SET saved_amount = saved_amount + ? WHERE id=?`, [amount, id]);
  },

  setPrimary(id: string): void {
    getDb().execute(`UPDATE goals SET is_primary=0`);
    getDb().execute(`UPDATE goals SET is_primary=1 WHERE id=?`, [id]);
  },

  markComplete(id: string): void {
    getDb().execute(`UPDATE goals SET completed_at=? WHERE id=?`, [Date.now(), id]);
  },

  delete(id: string): void {
    getDb().execute(`DELETE FROM goals WHERE id=?`, [id]);
  },

  getCount(): number {
    const { rows } = getDb().execute(`SELECT COUNT(*) as c FROM goals`);
    return rows?._array?.[0]?.c ?? 0;
  },
};

function toGoal(r: any): Goal {
  return {
    id: r.id,
    name: r.name,
    template: r.template,
    targetAmount: r.target_amount,
    savedAmount: r.saved_amount,
    currency: r.currency ?? 'INR',
    priority: r.priority ?? 'medium',
    isPrimary: r.is_primary === 1,
    icon: r.icon ?? 'disc',
    metadata: r.metadata ?? null,
    createdAt: r.created_at,
    completedAt: r.completed_at ?? null,
  };
}
