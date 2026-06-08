import type { AppState } from "./types";

export type StorageDriver = "local" | "supabase";

export interface RuntimeConfig {
  storageDriver: StorageDriver;
  teamId: string;
  teamName: string;
  supabaseUrl: string;
  supabasePublishableKey: string;
  supabaseSchema: string;
  supabaseTablePrefix: string;
}

export interface AppStorageAdapter {
  load(): Promise<AppState | null>;
  save(state: AppState): Promise<void>;
}

export function createLocalStorageAdapter(storageKey: string): AppStorageAdapter {
  return {
    async load() {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) as AppState : null;
    },
    async save(state) {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    }
  };
}

export function createSupabaseAdapter(config: RuntimeConfig): AppStorageAdapter {
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    throw new Error("Supabase URL and publishable key are required.");
  }

  return {
    async load() {
      throw new Error("Use the browser Supabase table adapter in assets/app.js for the static deployment.");
    },
    async save(_state) {
      throw new Error("Use the browser Supabase table adapter in assets/app.js for the static deployment.");
    }
  };
}
