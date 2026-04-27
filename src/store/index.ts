// src/store/index.ts
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { Transaction } from '../types/Transaction';
import { Goal } from '../types/Goal';
import { Budget } from '../types/Budget';
import { TxCategory } from '../modules/LeapModule';
import { ThemeMode } from '../theme';

interface Store {
  transactions: Transaction[];
  setTransactions: (t: Transaction[]) => void;
  prependTransaction: (t: Transaction) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
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

  importPhase: 'idle' | 'counting' | 'reading' | 'processing' | 'done' | 'error' | 'aborted';
  importSmsTotal: number;
  importSmsRead: number;
  importProcessed: number;
  importTxFound: number;
  importErrorMsg: string | null;
  importAbort: boolean;
  importStartMs: number | null;
  importEndMs: number | null;
  setImportPhase: (v: Store['importPhase']) => void;
  setImportSmsTotal: (v: number) => void;
  setImportSmsRead: (v: number) => void;
  setImportProcessed: (v: number) => void;
  setImportTxFound: (v: number) => void;
  setImportErrorMsg: (v: string | null) => void;
  setImportAbort: (v: boolean) => void;
  setImportRange: (start: number | null, end: number | null) => void;
  resetImportState: () => void;

  themeMode: ThemeMode;
  setThemeMode: (v: ThemeMode) => void;

  goals: Goal[];
  setGoals: (g: Goal[]) => void;

  activeBudget: Budget | null;
  setActiveBudget: (b: Budget | null) => void;
}

export const useStore = create<Store>((set) => ({
  transactions: [],
  setTransactions: (transactions) => set({ transactions }),
  prependTransaction: (t) => set((s) => ({ transactions: [t, ...s.transactions] })),
  updateTransaction: (id, patch) => set((s) => ({
    transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch, userVerified: true } : t)),
  })),
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

  importPhase: 'idle',
  importSmsTotal: 0,
  importSmsRead: 0,
  importProcessed: 0,
  importTxFound: 0,
  importErrorMsg: null,
  importAbort: false,
  importStartMs: null,
  importEndMs: null,
  setImportPhase: (importPhase) => set({ importPhase }),
  setImportSmsTotal: (importSmsTotal) => set({ importSmsTotal }),
  setImportSmsRead: (importSmsRead) => set({ importSmsRead }),
  setImportProcessed: (importProcessed) => set({ importProcessed }),
  setImportTxFound: (importTxFound) => set({ importTxFound }),
  setImportErrorMsg: (importErrorMsg) => set({ importErrorMsg }),
  setImportAbort: (importAbort) => set({ importAbort }),
  setImportRange: (importStartMs, importEndMs) => set({ importStartMs, importEndMs }),
  resetImportState: () => set({
    importPhase: 'idle',
    importSmsTotal: 0,
    importSmsRead: 0,
    importProcessed: 0,
    importTxFound: 0,
    importErrorMsg: null,
    importAbort: false,
    importStartMs: null,
    importEndMs: null,
  }),

  themeMode: 'light' as ThemeMode,
  setThemeMode: (themeMode) => set({ themeMode }),

  goals: [],
  setGoals: (goals) => set({ goals }),

  activeBudget: null,
  setActiveBudget: (activeBudget) => set({ activeBudget }),
}));
