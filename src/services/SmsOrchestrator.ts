// src/services/SmsOrchestrator.ts
// -────────────────────────────────────────────────────────────
import { SmsModule, RawSms } from '../modules/SmsModule';
import { LeapModule, TxResult } from '../modules/LeapModule';
import { TransactionRepository } from '../database/TransactionRepository';
import { Transaction } from '../types/Transaction';
import { TxCategory } from '../modules/LeapModule';

const SIX_MONTHS = 6 * 30 * 24 * 60 * 60 * 1000;

const FINANCIAL_KEYWORDS = [
  // English
  'debited', 'credited', 'spent', 'payment', 'transaction',
  'withdraw', 'deposit', 'transfer', 'balance', 'purchase',
  'charged', 'txn', 'upi', 'atm', 'neft', 'imps',
  // Arabic
  'خصم', 'إيداع', 'رصيد', 'تحويل',
  // Chinese
  '消费', '转账', '余额', '付款', '扣款',
  // Spanish
  'débito', 'crédito', 'pago', 'saldo',
  // French
  'débit', 'crédit', 'paiement', 'solde',
  // German
  'abbuchung', 'gutschrift', 'zahlung', 'kontostand',
  // Japanese
  '引き落とし', '入金', '振込', '残高',
  // Korean
  '출금', '입금', '결제', '이체', '잔액',
  // Symbols
  '₹', '$', '€', '£', '¥', '₩', 'aed', 'kes', 'php',
];

function isLikelyFinancial(body: string): boolean {
  const lower = body.toLowerCase();
  return FINANCIAL_KEYWORDS.some((k) => lower.includes(k));
}

export interface SyncCallbacks {
  onSmsCount?: (total: number) => void;
  onSmsRead?: (read: number, total: number) => void;
  onProcessed?: (processed: number, total: number, found: number) => void;
}

export const SmsOrchestrator = {
  async syncPeriod(
    startMs: number, endMs: number,
    callbacks?: SyncCallbacks,
  ): Promise<number> {
    const [hasPerm, isReady] = await Promise.all([
      SmsModule.hasPermission(), LeapModule.isModelLoaded(),
    ]);
    if (!hasPerm) throw new Error('SMS permission required');
    if (!isReady) throw new Error('AI model not loaded');

    const cappedStart = Math.max(startMs, Date.now() - SIX_MONTHS);

    // Step 1: Count SMS
    const total = await SmsModule.countInPeriod(cappedStart, endMs);
    callbacks?.onSmsCount?.(total);
    if (!total) return 0;

    // Step 2: Read SMS from inbox
    callbacks?.onSmsRead?.(0, total);
    const msgs = await SmsModule.fetchPeriod(cappedStart, endMs, total);
    callbacks?.onSmsRead?.(msgs.length, total);

    // Step 3: Process each SMS through AI one at a time for real-time progress
    const found = await runInference(msgs, callbacks);

    TransactionRepository.updateSyncState(Date.now(), found);
    return found;
  },

  /**
   * List SMS that have arrived since the last successful sync and look
   * financial. Cheap — no inference. Used to populate the "N new" badge.
   */
  async getPendingSms(): Promise<RawSms[]> {
    const hasPerm = await SmsModule.hasPermission();
    if (!hasPerm) return [];

    const { lastSyncTs } = TransactionRepository.getSyncState();
    // Never synced yet — the user should run a historical import from Settings
    // before we start tracking "new" messages.
    if (!lastSyncTs) return [];

    const raw = await SmsModule.fetchSince(lastSyncTs);
    return raw.filter((m) => isLikelyFinancial(m.body));
  },

  async getPendingCount(): Promise<number> {
    return (await SmsOrchestrator.getPendingSms()).length;
  },

  /**
   * Process all SMS that have arrived since lastSyncTs. Runs full inference
   * (slow). Only invoke from a user tap — never on app open.
   */
  async syncPending(callbacks?: SyncCallbacks): Promise<number> {
    const isReady = await LeapModule.isModelLoaded();
    if (!isReady) throw new Error('AI model not loaded');

    // Capture "now" before fetching so SMS arriving during inference are
    // still caught on the next sync (instead of being skipped by a bookmark
    // set to the end-of-inference time).
    const bookmark = Date.now();

    const msgs = await SmsOrchestrator.getPendingSms();
    callbacks?.onSmsCount?.(msgs.length);
    callbacks?.onSmsRead?.(msgs.length, msgs.length);
    if (!msgs.length) {
      TransactionRepository.updateSyncState(bookmark, 0);
      return 0;
    }

    const found = await runInference(msgs, callbacks);
    TransactionRepository.updateSyncState(bookmark, found);
    return found;
  },
};

async function runInference(
  msgs: RawSms[],
  callbacks?: SyncCallbacks,
): Promise<number> {
  let processed = 0;
  let found = 0;
  for (const msg of msgs) {
    try {
      const result = await LeapModule.processSms(msg.sender, msg.body, msg.date);
      if (result) {
        const saved = TransactionRepository.insert(txResultToInsert(result));
        if (saved) found++;
      }
    } catch {
      // Skip failed messages, continue with the rest
    }
    processed++;
    callbacks?.onProcessed?.(processed, msgs.length, found);
  }
  return found;
}

function txResultToInsert(r: TxResult): Omit<Transaction, 'id' | 'createdAt'> {
  return {
    smsId: `${r.sender}_${r.smsDate}`,
    amount: r.amount, currencyCode: r.currencyCode, merchant: r.merchant,
    category: r.category as TxCategory, type: r.type,
    accountReference: r.accountReference, balance: r.balance,
    balanceCurrencyCode: r.balanceCurrencyCode, confidence: r.confidence,
    rawSms: r.rawSms, sender: r.sender, smsDate: r.smsDate,
    userVerified: false, userCategory: null,
  };
}
