// src/services/BackupService.ts
// ─────────────────────────────────────────────────────────────
// Local-only backup/restore. Privacy-first: no network, no cloud.
// User picks where to save via Android share sheet, picks file to import.
//
// Two formats:
//   - CSV  → portable to other finance apps (Excel, YNAB, Money Manager, ...)
//   - JSON → full round-trip (transactions + goals + budgets, schema-versioned)
// ─────────────────────────────────────────────────────────────
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { pick, keepLocalCopy } from '@react-native-documents/picker';
import { v4 as uuid } from 'uuid';

import { TransactionRepository } from '../database/TransactionRepository';
import { GoalRepository } from '../database/GoalRepository';
import { BudgetRepository } from '../database/BudgetRepository';
import { getDb } from '../database/Database';
import type { Transaction } from '../types/Transaction';
import type { Goal } from '../types/Goal';
import type { Budget } from '../types/Budget';
import type { TxCategory } from '../modules/LeapModule';

export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupBundle {
  schemaVersion: number;
  exportedAt: number;
  appVersion: string;
  transactions: Transaction[];
  goals: Goal[];
  budgets: Budget[];
}

export interface ImportResult {
  added: number;
  skipped: number;
  errors: string[];
  totals: { transactions: number; goals: number; budgets: number };
}

const VALID_CATEGORIES: TxCategory[] = [
  'FOOD_DINING','TRANSPORT','SHOPPING','GROCERIES','UTILITIES','ENTERTAINMENT',
  'HEALTH_MEDICAL','TRAVEL','EDUCATION','FUEL','ATM_CASH','TRANSFER',
  'SUBSCRIPTION','INSURANCE','RENT','OTHER',
];

function ts(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function csvEscape(v: any): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildCsv(txs: Transaction[]): string {
  const header = ['date','iso_date','merchant','amount','type','category','currency','sender','sms_id','notes'];
  const lines = [header.join(',')];
  for (const t of txs) {
    const d = new Date(t.smsDate);
    const cat = t.userCategory ?? t.category;
    lines.push([
      d.getTime(),
      d.toISOString(),
      csvEscape(t.merchant),
      t.amount,
      t.type,
      cat,
      t.currencyCode,
      csvEscape(t.sender),
      csvEscape(t.smsId),
      csvEscape(t.rawSms ?? ''),
    ].join(','));
  }
  return lines.join('\n');
}

// ---------- EXPORT ----------

export const BackupService = {
  async exportJson(): Promise<{ path: string; bytes: number; counts: { tx: number; goals: number; budgets: number } }> {
    const txs = TransactionRepository.getAll(100000);
    const goals = GoalRepository.getAll();
    const budgets = BudgetRepository.getAll();
    const bundle: BackupBundle = {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: Date.now(),
      appVersion: '1.0.0',
      transactions: txs,
      goals,
      budgets,
    };
    const json = JSON.stringify(bundle, null, 2);
    const path = `${RNFS.CachesDirectoryPath}/somus-backup-${ts()}.json`;
    await RNFS.writeFile(path, json, 'utf8');
    await Share.open({
      url: 'file://' + path,
      type: 'application/json',
      filename: `somus-backup-${ts()}.json`,
      failOnCancel: false,
      saveToFiles: true,
    } as any).catch(() => { /* user cancelled — file still in cache */ });
    return { path, bytes: json.length, counts: { tx: txs.length, goals: goals.length, budgets: budgets.length } };
  },

  async exportCsv(): Promise<{ path: string; bytes: number; rows: number }> {
    const txs = TransactionRepository.getAll(100000);
    const csv = buildCsv(txs);
    const path = `${RNFS.CachesDirectoryPath}/somus-transactions-${ts()}.csv`;
    await RNFS.writeFile(path, csv, 'utf8');
    await Share.open({
      url: 'file://' + path,
      type: 'text/csv',
      filename: `somus-transactions-${ts()}.csv`,
      failOnCancel: false,
      saveToFiles: true,
    } as any).catch(() => {});
    return { path, bytes: csv.length, rows: txs.length };
  },

  // ---------- IMPORT ----------

  async pickAndImport(): Promise<ImportResult> {
    const [picked] = await pick({
      type: ['application/json', 'text/csv', 'text/comma-separated-values', '*/*'],
      allowMultiSelection: false,
    });
    if (!picked?.uri) throw new Error('No file selected');

    // Copy content URI into app cache so we can read it reliably
    const [local] = await keepLocalCopy({
      files: [{
        uri: picked.uri,
        fileName: picked.name ?? 'somus-import',
      }],
      destination: 'cachesDirectory',
    });
    if (local.status !== 'success') throw new Error('Failed to read file');
    const localPath = local.localUri.replace('file://', '');
    const content = await RNFS.readFile(localPath, 'utf8');

    const name = (picked.name ?? '').toLowerCase();
    const looksJson = name.endsWith('.json') || content.trimStart().startsWith('{');
    if (looksJson) return importJsonContent(content);
    return importCsvContent(content);
  },
};

// ---------- IMPORT IMPL ----------

function importJsonContent(content: string): ImportResult {
  const result: ImportResult = {
    added: 0, skipped: 0, errors: [],
    totals: { transactions: 0, goals: 0, budgets: 0 },
  };
  let bundle: BackupBundle;
  try { bundle = JSON.parse(content); }
  catch (e: any) { throw new Error('Invalid JSON: ' + (e?.message ?? '')); }

  if (typeof bundle.schemaVersion !== 'number') throw new Error('Missing schemaVersion');
  if (bundle.schemaVersion > BACKUP_SCHEMA_VERSION) {
    throw new Error(`Backup schema v${bundle.schemaVersion} is newer than this app (v${BACKUP_SCHEMA_VERSION}). Please update Somus.`);
  }

  const db = getDb();
  // Existing keys for dedup
  const existingTxSmsIds = new Set<string>();
  const existingGoalIds = new Set<string>();
  const existingBudgetIds = new Set<string>();
  for (const r of (db.execute(`SELECT sms_id FROM transactions`).rows?._array ?? [])) existingTxSmsIds.add(r.sms_id);
  for (const r of (db.execute(`SELECT id FROM goals`).rows?._array ?? [])) existingGoalIds.add(r.id);
  for (const r of (db.execute(`SELECT id FROM budgets`).rows?._array ?? [])) existingBudgetIds.add(r.id);

  db.transaction(() => {
    for (const t of bundle.transactions ?? []) {
      result.totals.transactions++;
      if (!t.smsId || !t.amount || !t.category || !t.type) { result.skipped++; continue; }
      if (existingTxSmsIds.has(t.smsId)) { result.skipped++; continue; }
      try {
        const id = t.id || uuid();
        db.execute(
          `INSERT OR IGNORE INTO transactions
           (id,sms_id,amount,currency_code,merchant,category,type,
            account_reference,balance,balance_currency_code,confidence,
            raw_sms,sender,sms_date,created_at,user_verified,user_category)
           VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [id, t.smsId, t.amount, t.currencyCode ?? 'INR', t.merchant ?? '',
           t.category, t.type, t.accountReference ?? null, t.balance ?? null,
           t.balanceCurrencyCode ?? null, t.confidence ?? 0, t.rawSms ?? '',
           t.sender ?? '', t.smsDate ?? Date.now(), t.createdAt ?? Date.now(),
           t.userVerified ? 1 : 0, t.userCategory ?? null]
        );
        existingTxSmsIds.add(t.smsId);
        result.added++;
      } catch (e: any) {
        result.errors.push(`tx ${t.smsId}: ${e?.message ?? e}`);
      }
    }

    for (const g of bundle.goals ?? []) {
      result.totals.goals++;
      if (!g.name || !g.targetAmount) { result.skipped++; continue; }
      if (existingGoalIds.has(g.id)) { result.skipped++; continue; }
      try {
        db.execute(
          `INSERT INTO goals (id,name,template,target_amount,saved_amount,currency,priority,is_primary,icon,metadata,created_at,completed_at)
           VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
          [g.id || uuid(), g.name, g.template ?? 'custom', g.targetAmount, g.savedAmount ?? 0,
           g.currency ?? 'INR', g.priority ?? 'medium', g.isPrimary ? 1 : 0,
           g.icon ?? 'disc', g.metadata ?? null, g.createdAt ?? Date.now(), g.completedAt ?? null]
        );
        result.added++;
      } catch (e: any) {
        result.errors.push(`goal ${g.id}: ${e?.message ?? e}`);
      }
    }

    for (const b of bundle.budgets ?? []) {
      result.totals.budgets++;
      if (!b.name || !b.monthlyLimit) { result.skipped++; continue; }
      if (existingBudgetIds.has(b.id)) { result.skipped++; continue; }
      try {
        if (b.isActive) db.execute(`UPDATE budgets SET is_active=0`);
        db.execute(
          `INSERT INTO budgets (id,name,monthly_limit,currency,category_caps,exclude_transfers,exclude_refunds,is_active,created_at)
           VALUES(?,?,?,?,?,?,?,?,?)`,
          [b.id || uuid(), b.name, b.monthlyLimit, b.currency ?? 'INR',
           JSON.stringify(b.categoryCaps ?? {}),
           b.excludeTransfers ? 1 : 0, b.excludeRefunds ? 1 : 0,
           b.isActive ? 1 : 0, b.createdAt ?? Date.now()]
        );
        result.added++;
      } catch (e: any) {
        result.errors.push(`budget ${b.id}: ${e?.message ?? e}`);
      }
    }
  });

  return result;
}

function importCsvContent(content: string): ImportResult {
  const result: ImportResult = {
    added: 0, skipped: 0, errors: [],
    totals: { transactions: 0, goals: 0, budgets: 0 },
  };
  const rows = parseCsv(content);
  if (rows.length < 2) throw new Error('CSV is empty');

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (k: string) => header.indexOf(k);
  const iDate = idx('date') !== -1 ? idx('date') : idx('iso_date');
  const iIso = idx('iso_date');
  const iMerch = idx('merchant');
  const iAmt = idx('amount');
  const iType = idx('type');
  const iCat = idx('category');
  const iCur = idx('currency');
  const iSender = idx('sender');
  const iSmsId = idx('sms_id');
  const iNotes = idx('notes');

  if (iAmt === -1 || iCat === -1) throw new Error('CSV missing required columns: amount, category');

  const db = getDb();
  const existingTxSmsIds = new Set<string>();
  for (const r of (db.execute(`SELECT sms_id FROM transactions`).rows?._array ?? [])) existingTxSmsIds.add(r.sms_id);

  db.transaction(() => {
    for (let r = 1; r < rows.length; r++) {
      const cols = rows[r];
      if (!cols || cols.length === 0 || (cols.length === 1 && !cols[0])) continue;
      result.totals.transactions++;

      const amt = parseFloat(cols[iAmt]);
      if (!isFinite(amt) || amt <= 0) { result.skipped++; continue; }

      const rawCat = (cols[iCat] ?? 'OTHER').toUpperCase().trim();
      const cat: TxCategory = (VALID_CATEGORIES.includes(rawCat as TxCategory) ? rawCat : 'OTHER') as TxCategory;

      const rawType = (cols[iType] ?? 'DEBIT').toUpperCase().trim();
      const type: 'DEBIT' | 'CREDIT' = rawType === 'CREDIT' ? 'CREDIT' : 'DEBIT';

      let date = 0;
      if (iIso !== -1 && cols[iIso]) date = Date.parse(cols[iIso]);
      if (!date && iDate !== -1 && cols[iDate]) {
        const v = cols[iDate].trim();
        const n = parseInt(v, 10);
        date = (n > 1e11) ? n : Date.parse(v);
      }
      if (!isFinite(date) || !date) date = Date.now();

      const smsId = (iSmsId !== -1 && cols[iSmsId]) ? cols[iSmsId] : `csv-${date}-${amt}-${(cols[iMerch] ?? '').slice(0, 20)}`;
      if (existingTxSmsIds.has(smsId)) { result.skipped++; continue; }

      try {
        const id = uuid();
        db.execute(
          `INSERT OR IGNORE INTO transactions
           (id,sms_id,amount,currency_code,merchant,category,type,
            account_reference,balance,balance_currency_code,confidence,
            raw_sms,sender,sms_date,created_at,user_verified,user_category)
           VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [id, smsId, amt, (iCur !== -1 ? cols[iCur] : '') || 'INR',
           iMerch !== -1 ? (cols[iMerch] ?? '') : '',
           cat, type, null, null, null, 1.0,
           iNotes !== -1 ? (cols[iNotes] ?? '') : '',
           iSender !== -1 ? (cols[iSender] ?? '') : 'CSV_IMPORT',
           date, Date.now(), 1, null]
        );
        existingTxSmsIds.add(smsId);
        result.added++;
      } catch (e: any) {
        result.errors.push(`row ${r}: ${e?.message ?? e}`);
      }
    }
  });

  return result;
}

// Minimal RFC4180 CSV parser (handles quoted fields, escaped quotes, CRLF)
function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (inQ) {
      if (c === '"') {
        if (input[i + 1] === '"') { cur += '"'; i++; }
        else { inQ = false; }
      } else { cur += c; }
    } else {
      if (c === '"') { inQ = true; }
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (c === '\r') { /* skip */ }
      else { cur += c; }
    }
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
