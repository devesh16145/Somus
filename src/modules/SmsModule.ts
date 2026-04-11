// src/modules/SmsModule.ts
// ─────────────────────────────────────────────────────────────
import { NativeModules, NativeEventEmitter } from 'react-native';
const { SmsModule: Native } = NativeModules;
const emitter = new NativeEventEmitter(Native);

export interface RawSms {
  id: string; sender: string; body: string; date: number;
}
export const SmsModule = {
  fetchPeriod: (s: number, e: number, n = 500): Promise<RawSms[]> =>
    Native.fetchPeriod(s, e, n),
  fetchSince: (ms: number): Promise<RawSms[]> => Native.fetchSince(ms),
  fetchPeriodWithProgress: (s: number, e: number): Promise<number> =>
    Native.fetchPeriodWithProgress(s, e),
  countInPeriod: (s: number, e: number): Promise<number> =>
    Native.countInPeriod(s, e),
  hasPermission: (): Promise<boolean> => Native.hasPermission(),
  onProgress: (cb: (e: any) => void) => emitter.addListener('SmsProgress', cb),
  onBatch: (cb: (e: any) => void) => emitter.addListener('SmsBatch', cb),
};


