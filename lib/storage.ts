// ============================================================
// Fast local storage wrapper.
// Uses react-native-mmkv when available (dev/prod builds),
// falls back to an in-memory map (Expo Go / web / tests).
// ============================================================

interface KV {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  getBoolean(key: string): boolean | undefined;
}

function createStorage(): KV {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV } = require('react-native-mmkv');
    const mmkv = new MMKV({ id: 'narvara-braingame' });
    return {
      getString: (k) => mmkv.getString(k),
      set: (k, v) => mmkv.set(k, v),
      delete: (k) => mmkv.delete(k),
      getBoolean: (k) => mmkv.getBoolean(k),
    };
  } catch {
    const mem = new Map<string, string>();
    return {
      getString: (k) => mem.get(k),
      set: (k, v) => mem.set(k, v),
      delete: (k) => mem.delete(k),
      getBoolean: (k) => (mem.has(k) ? mem.get(k) === 'true' : undefined),
    };
  }
}

export const storage = createStorage();

export const json = {
  get<T>(key: string): T | null {
    const raw = storage.getString(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown): void {
    storage.set(key, JSON.stringify(value));
  },
};
