// src/services/CrashLogger.ts
// ─────────────────────────────────────────────────────────────
// Local crash logging. Writes crashes to disk; user shares manually if they want.
// No network, no auto-upload — privacy-first.
// ─────────────────────────────────────────────────────────────
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

const CRASH_DIR = `${RNFS.DocumentDirectoryPath}/crashes`;
const APP_VERSION = '1.0.0';

export interface CrashEntry {
  id: string;       // file basename without extension
  filename: string; // full filename
  path: string;
  ts: number;
  size: number;
  source: 'js' | 'native' | 'unknown';
}

let installed = false;

async function ensureDir(): Promise<void> {
  try {
    const exists = await RNFS.exists(CRASH_DIR);
    if (!exists) await RNFS.mkdir(CRASH_DIR);
  } catch {}
}

function tsName(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${Date.now() % 1000}`;
}

function header(kind: string, isFatal?: boolean): string {
  return [
    `=== Somus crash log ===`,
    `kind:    ${kind}`,
    `fatal:   ${isFatal ?? 'unknown'}`,
    `version: ${APP_VERSION}`,
    `os:      ${Platform.OS} ${Platform.Version}`,
    `time:    ${new Date().toISOString()}`,
    ``,
  ].join('\n');
}

async function writeCrash(kind: 'js' | 'native', body: string, isFatal?: boolean): Promise<string | null> {
  try {
    await ensureDir();
    const filename = `crash-${kind}-${tsName()}.log`;
    const path = `${CRASH_DIR}/${filename}`;
    await RNFS.writeFile(path, header(kind, isFatal) + body, 'utf8');
    return path;
  } catch {
    return null;
  }
}

export const CrashLogger = {
  /** Install global JS error handler. Idempotent. Call once at app start. */
  init(): void {
    if (installed) return;
    installed = true;
    ensureDir();

    const g = (global as any);
    const ErrorUtils = g.ErrorUtils;
    if (!ErrorUtils?.setGlobalHandler) return;

    const prev = ErrorUtils.getGlobalHandler ? ErrorUtils.getGlobalHandler() : null;

    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      try {
        const body = [
          `name:    ${error?.name ?? 'Error'}`,
          `message: ${error?.message ?? '(no message)'}`,
          ``,
          `stack:`,
          (error?.stack ?? '(no stack)').toString(),
        ].join('\n');
        // Synchronous best-effort write before the runtime tears down
        writeCrash('js', body, isFatal);
      } catch {}
      // Always defer to RN's red-box / default handler so dev experience is unchanged
      if (prev) prev(error, isFatal);
    });

    // Catch unhandled promise rejections that bypass ErrorUtils
    const tracking = require('promise/setimmediate/rejection-tracking');
    if (tracking?.enable) {
      tracking.enable({
        allRejections: true,
        onUnhandled: (id: number, error: any) => {
          const e: Error = error instanceof Error ? error : new Error(String(error));
          const body = [
            `unhandledRejection: ${id}`,
            `name:    ${e.name}`,
            `message: ${e.message}`,
            ``,
            `stack:`,
            (e.stack ?? '(no stack)').toString(),
          ].join('\n');
          writeCrash('js', body, false);
        },
        onHandled: () => {},
      });
    }
  },

  async list(): Promise<CrashEntry[]> {
    try {
      await ensureDir();
      const items = await RNFS.readDir(CRASH_DIR);
      return items
        .filter((it) => it.isFile() && it.name.endsWith('.log'))
        .map((it): CrashEntry => {
          const id = it.name.replace(/\.log$/, '');
          const source: CrashEntry['source'] =
            it.name.startsWith('crash-js-') ? 'js' :
            it.name.startsWith('crash-native-') ? 'native' : 'unknown';
          return {
            id,
            filename: it.name,
            path: it.path,
            ts: Number(it.mtime ? new Date(it.mtime).getTime() : Date.now()),
            size: it.size,
            source,
          };
        })
        .sort((a, b) => b.ts - a.ts);
    } catch {
      return [];
    }
  },

  async read(id: string): Promise<string> {
    const path = `${CRASH_DIR}/${id}.log`;
    try { return await RNFS.readFile(path, 'utf8'); }
    catch { return '(crash file unreadable)'; }
  },

  async delete(id: string): Promise<void> {
    const path = `${CRASH_DIR}/${id}.log`;
    try { await RNFS.unlink(path); } catch {}
  },

  async clearAll(): Promise<number> {
    const list = await this.list();
    for (const c of list) {
      try { await RNFS.unlink(c.path); } catch {}
    }
    return list.length;
  },

  async share(id: string): Promise<void> {
    const path = `${CRASH_DIR}/${id}.log`;
    await Share.open({
      url: 'file://' + path,
      type: 'text/plain',
      filename: `${id}.log`,
      failOnCancel: false,
    } as any).catch(() => {});
  },

  /** Test helper to verify the pipeline works on real device. */
  async _testWrite(): Promise<string | null> {
    return writeCrash('js', 'message: synthetic test crash\n\nstack: (none — test entry)', false);
  },
};
