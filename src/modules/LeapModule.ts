// src/modules/LeapModule.ts
// ─────────────────────────────────────────────────────────────
import { NativeModules, NativeEventEmitter } from 'react-native';
const { LeapModule: NativeLeap } = NativeModules;
const leapEmitter = new NativeEventEmitter(NativeLeap);

export type TxCategory =
  | 'FOOD_DINING' | 'TRANSPORT' | 'SHOPPING' | 'GROCERIES'
  | 'UTILITIES' | 'ENTERTAINMENT' | 'HEALTH_MEDICAL' | 'TRAVEL'
  | 'EDUCATION' | 'FUEL' | 'ATM_CASH' | 'TRANSFER'
  | 'SUBSCRIPTION' | 'INSURANCE' | 'RENT' | 'OTHER';

export interface TxResult {
  sender: string; amount: number; currencyCode: string;
  merchant: string; category: TxCategory; type: 'DEBIT' | 'CREDIT';
  accountReference: string | null; confidence: number;
  rawSms: string; smsDate: number;
}

export const LeapModule = {
  downloadAndLoadModel: (slug: string, quant: string): Promise<boolean> =>
    NativeLeap.downloadAndLoadModel(slug, quant),
  processSms: (sender: string, body: string, ts: number): Promise<TxResult | null> =>
    NativeLeap.processSms(sender, body, ts),
  processBatch: (msgs: Array<{ sender: string; body: string; date: number }>): Promise<TxResult[]> =>
    NativeLeap.processBatch(msgs),
  isModelLoaded: (): Promise<boolean> => NativeLeap.isModelLoaded(),
  unloadModel: (): Promise<boolean> => NativeLeap.unloadModel(),
  onModelProgress: (cb: (e: { progress: number }) => void) =>
    leapEmitter.addListener('LeapModelProgress', cb),
  onBatchProgress: (cb: (e: { processed: number; total: number }) => void) =>
    leapEmitter.addListener('LeapBatchProgress', cb),
  onLiveTransaction: (cb: (e: { dedupKey: string; transaction: TxResult }) => void) =>
    leapEmitter.addListener('LeapLiveTransaction', cb),
};

export const MODELS = {
  DEFAULT: { slug: 'somus-lfm-1.2b-sms', quant: 'q4_k_m', sizeMb: 700 },
} as const;


