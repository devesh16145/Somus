// src/services/SmsOrchestrator.ts
// -────────────────────────────────────────────────────────────
import { SmsModule, RawSms } from '../modules/SmsModule';
import { LeapModule, TxResult } from '../modules/LeapModule';
import { TransactionRepository } from '../database/TransactionRepository';
import { Transaction } from '../types/Transaction';
import { TxCategory } from '../modules/LeapModule';

const SIX_MONTHS = 6 * 30 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

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
    let processed = 0;
    let found = 0;
    for (const msg of msgs) {
      try {
        const result = await LeapModule.processSms(msg.sender, msg.body, msg.date);
        if (result) {
          const saved = TransactionRepository.insert(txResultToInsert(result));
          if (saved) found++;
        }
      } catch (e) {
        // Skip failed messages, continue with the rest
      }
      processed++;
      callbacks?.onProcessed?.(processed, msgs.length, found);
    }

    TransactionRepository.updateSyncState(Date.now(), found);
    return found;
  },

  handleLiveTransaction(tx: TxResult): Transaction | null {
    return TransactionRepository.insert(txResultToInsert(tx));
  },
};

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
