// src/database/TransactionRepository.ts
// ─────────────────────────────────────────────────────────────
import { getDb } from './Database';
import { Transaction } from '../types/Transaction';
import { TxCategory } from '../modules/LeapModule';
import { v4 as uuid } from 'uuid';

export const TransactionRepository = {
  insert(t: Omit<Transaction, 'id' | 'createdAt'>): Transaction | null {
    const id = uuid(), now = Date.now();
    try {
      getDb().execute(
        `INSERT OR IGNORE INTO transactions
         (id,sms_id,amount,currency_code,merchant,category,type,
          account_reference,balance,balance_currency_code,confidence,
          raw_sms,sender,sms_date,created_at,user_verified,user_category)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [id, t.smsId, t.amount, t.currencyCode, t.merchant, t.category,
         t.type, t.accountReference ?? null, t.balance ?? null,
         t.balanceCurrencyCode ?? null, t.confidence, t.rawSms,
         t.sender, t.smsDate, now, t.userVerified ? 1 : 0, t.userCategory ?? null]
      );
      return { ...t, id, createdAt: now };
    } catch { return null; }
  },

  insertBatch(items: Omit<Transaction, 'id' | 'createdAt'>[]): number {
    let n = 0;
    getDb().transaction(() => {
      for (const t of items) { if (TransactionRepository.insert(t)) n++; }
    });
    return n;
  },

  getAll(limit = 100, offset = 0): Transaction[] {
    const { rows } = getDb().execute(
      `SELECT * FROM transactions ORDER BY sms_date DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return (rows?._array ?? []).map(toTx);
  },

  getByDateRange(start: number, end: number): Transaction[] {
    const { rows } = getDb().execute(
      `SELECT * FROM transactions WHERE sms_date >= ? AND sms_date <= ? ORDER BY sms_date DESC`,
      [start, end]
    );
    return (rows?._array ?? []).map(toTx);
  },

  getTotalSpentByCategory(start: number, end: number): Record<string, number> {
    const { rows } = getDb().execute(
      `SELECT COALESCE(user_category, category) as cat, SUM(amount) as total
       FROM transactions WHERE sms_date >= ? AND sms_date <= ? AND type='DEBIT'
       GROUP BY cat`,
      [start, end]
    );
    const r: Record<string, number> = {};
    for (const row of rows?._array ?? []) r[row.cat] = row.total;
    return r;
  },

  updateCategory(id: string, category: TxCategory): void {
    getDb().execute(
      `UPDATE transactions SET user_category=?, user_verified=1 WHERE id=?`,
      [category, id]
    );
  },

  update(id: string, fields: Partial<Pick<Transaction,
    'amount' | 'merchant' | 'category' | 'userCategory' | 'type' |
    'currencyCode' | 'smsDate' | 'sender' | 'rawSms'
  >>): void {
    const sets: string[] = [];
    const vals: any[] = [];
    if (fields.amount !== undefined)       { sets.push('amount=?');         vals.push(fields.amount); }
    if (fields.merchant !== undefined)     { sets.push('merchant=?');       vals.push(fields.merchant); }
    if (fields.category !== undefined)     { sets.push('category=?');       vals.push(fields.category); }
    if (fields.userCategory !== undefined) { sets.push('user_category=?');  vals.push(fields.userCategory); }
    if (fields.type !== undefined)         { sets.push('type=?');           vals.push(fields.type); }
    if (fields.currencyCode !== undefined) { sets.push('currency_code=?');  vals.push(fields.currencyCode); }
    if (fields.smsDate !== undefined)      { sets.push('sms_date=?');       vals.push(fields.smsDate); }
    if (fields.sender !== undefined)       { sets.push('sender=?');         vals.push(fields.sender); }
    if (fields.rawSms !== undefined)       { sets.push('raw_sms=?');        vals.push(fields.rawSms); }
    sets.push('user_verified=1');
    if (sets.length === 1) return;
    vals.push(id);
    getDb().execute(`UPDATE transactions SET ${sets.join(',')} WHERE id=?`, vals);
  },

  getById(id: string): Transaction | null {
    const { rows } = getDb().execute(`SELECT * FROM transactions WHERE id=? LIMIT 1`, [id]);
    const r = rows?._array?.[0];
    return r ? toTx(r) : null;
  },

  delete(id: string): void {
    getDb().execute(`DELETE FROM transactions WHERE id=?`, [id]);
  },

  deleteMultiple(ids: string[]): number {
    if (ids.length === 0) return 0;
    let deleted = 0;
    getDb().transaction(() => {
      for (const id of ids) {
        getDb().execute(`DELETE FROM transactions WHERE id=?`, [id]);
        deleted++;
      }
    });
    return deleted;
  },

  deleteAll(): number {
    const count = TransactionRepository.getCount();
    getDb().execute(`DELETE FROM transactions`);
    return count;
  },

  getCount(): number {
    const { rows } = getDb().execute(`SELECT COUNT(*) as c FROM transactions`);
    return rows?._array?.[0]?.c ?? 0;
  },

  getAllTimeTotals(): { totalSpend: number; totalIncome: number } {
    const { rows } = getDb().execute(
      `SELECT type, SUM(amount) as total FROM transactions GROUP BY type`
    );
    let totalSpend = 0, totalIncome = 0;
    for (const r of rows?._array ?? []) {
      if (r.type === 'DEBIT') totalSpend = r.total ?? 0;
      else if (r.type === 'CREDIT') totalIncome = r.total ?? 0;
    }
    return { totalSpend, totalIncome };
  },

  getLatestByCategory(category: TxCategory): Transaction | null {
    const { rows } = getDb().execute(
      `SELECT * FROM transactions
       WHERE COALESCE(user_category, category) = ?
       ORDER BY sms_date DESC LIMIT 1`,
      [category]
    );
    const r = rows?._array?.[0];
    return r ? toTx(r) : null;
  },

  getMonthlyTotals(months: number = 6): { month: string; spend: number; income: number }[] {
    const result: { month: string; spend: number; income: number }[] = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const y = new Date(now.getFullYear(), now.getMonth() - i, 1).getFullYear();
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1).getMonth();
      const start = new Date(y, m, 1).getTime();
      const end = new Date(y, m + 1, 0, 23, 59, 59, 999).getTime();
      const { rows } = getDb().execute(
        `SELECT type, SUM(amount) as total FROM transactions
         WHERE sms_date >= ? AND sms_date <= ? GROUP BY type`,
        [start, end],
      );
      let spend = 0, income = 0;
      for (const r of rows?._array ?? []) {
        if (r.type === 'DEBIT') spend = r.total ?? 0;
        else if (r.type === 'CREDIT') income = r.total ?? 0;
      }
      const label = new Date(y, m).toLocaleDateString('en', { month: 'short' });
      result.push({ month: label, spend, income });
    }
    return result;
  },

  getSyncState(): { lastSyncTs: number; totalProcessed: number } {
    const { rows } = getDb().execute(`SELECT * FROM sync_state WHERE id=1`);
    const r = rows?._array?.[0];
    return { lastSyncTs: r?.last_sync_ts ?? 0, totalProcessed: r?.total_processed ?? 0 };
  },

  updateSyncState(ts: number, added: number): void {
    getDb().execute(
      `UPDATE sync_state SET last_sync_ts=?, total_processed=total_processed+? WHERE id=1`,
      [ts, added]
    );
  },
};

function toTx(r: any): Transaction {
  return {
    id: r.id, smsId: r.sms_id, amount: r.amount, currencyCode: r.currency_code,
    merchant: r.merchant ?? '', category: r.category, type: r.type,
    accountReference: r.account_reference ?? null, balance: r.balance ?? null,
    balanceCurrencyCode: r.balance_currency_code ?? null, confidence: r.confidence ?? 0,
    rawSms: r.raw_sms, sender: r.sender ?? '', smsDate: r.sms_date,
    createdAt: r.created_at, userVerified: r.user_verified === 1,
    userCategory: r.user_category ?? null,
  };
}


