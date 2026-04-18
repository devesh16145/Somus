// src/store/index.ts
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { Transaction } from '../types/Transaction';
import { TxCategory } from '../modules/LeapModule';
import { ThemeMode } from '../theme';

interface Store {
  transactions: Transaction[];
  setTransactions: (t: Transaction[]) => void;
  prependTransaction: (t: Transaction) => void;
  updateCategory: (id: string, cat: TxCategory) => void;
  deleteTransaction: (id: string) => void;
  deleteTransactions: (ids: string[]) => void;

  modelLoaded: boolean;
  downloading: boolean;
  downloadProgress: number;
  setModelLoaded: (v: boolean) => void;
  setDownloading: (v: boolean) => void;
  setDownloadProgress: (v: number) => void;

  syncing: boolean;
  syncProgress: { processed: number; total: number } | null;
  smsReadCount: number;
  smsTotalCount: number;
  txFoundCount: number;
  pendingCount: number;
  setSyncing: (v: boolean) => void;
  setSyncProgress: (v: { processed: number; total: number } | null) => void;
  setSmsReadCount: (v: number) => void;
  setSmsTotalCount: (v: number) => void;
  setTxFoundCount: (v: number) => void;
  setPendingCount: (v: number) => void;

  themeMode: ThemeMode;
  setThemeMode: (v: ThemeMode) => void;
}

export const useStore = create<Store>((set) => ({
  transactions: [],
  setTransactions: (transactions) => set({ transactions }),
  prependTransaction: (t) => set((s) => ({ transactions: [t, ...s.transactions] })),
  updateCategory: (id, cat) => set((s) => ({
    transactions: s.transactions.map((t) =>
      t.id === id ? { ...t, userCategory: cat, userVerified: true } : t
    ),
  })),
  deleteTransaction: (id) => set((s) => ({
    transactions: s.transactions.filter((t) => t.id !== id),
  })),
  deleteTransactions: (ids) => set((s) => ({
    transactions: s.transactions.filter((t) => !ids.includes(t.id)),
  })),

  modelLoaded: false, downloading: false, downloadProgress: 0,
  setModelLoaded: (modelLoaded) => set({ modelLoaded }),
  setDownloading: (downloading) => set({ downloading }),
  setDownloadProgress: (downloadProgress) => set({ downloadProgress }),

  syncing: false, syncProgress: null, smsReadCount: 0, smsTotalCount: 0, txFoundCount: 0,
  pendingCount: 0,
  setSyncing: (syncing) => set({ syncing }),
  setSyncProgress: (syncProgress) => set({ syncProgress }),
  setSmsReadCount: (smsReadCount) => set({ smsReadCount }),
  setSmsTotalCount: (smsTotalCount) => set({ smsTotalCount }),
  setTxFoundCount: (txFoundCount) => set({ txFoundCount }),
  setPendingCount: (pendingCount) => set({ pendingCount }),

  themeMode: 'dark' as ThemeMode,
  setThemeMode: (themeMode) => set({ themeMode }),
}));
