import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const expoExtra = (Constants.expoConfig?.extra ?? {}) as {
  supabaseAnonKey?: string;
  supabaseUrl?: string;
};

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  expoExtra.supabaseUrl;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  expoExtra.supabaseAnonKey;

type AsyncStorageLike = {
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
  setItem: (key: string, value: string) => Promise<void>;
};
const asyncStorageModule = AsyncStorage as unknown as Partial<AsyncStorageLike> & {
  default?: AsyncStorageLike;
};
const asyncStorage = asyncStorageModule.getItem
  ? (asyncStorageModule as AsyncStorageLike)
  : asyncStorageModule.default;
const fallbackStorage = new Map<string, string>();

async function getStoredItem(key: string) {
  try {
    return await asyncStorage?.getItem(key) ?? fallbackStorage.get(key) ?? null;
  } catch {
    return fallbackStorage.get(key) ?? null;
  }
}

async function setStoredItem(key: string, value: string) {
  fallbackStorage.set(key, value);

  try {
    await asyncStorage?.setItem(key, value);
  } catch {
    // Keep the in-memory fallback for non-native test/runtime contexts.
  }
}

async function removeStoredItem(key: string) {
  fallbackStorage.delete(key);

  try {
    await asyncStorage?.removeItem(key);
  } catch {
    // Keep removal successful for non-native test/runtime contexts.
  }
}

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(
      `Missing ${name}. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your Expo/Vercel environment before using Supabase.`
    );
  }

  return value;
}

export const supabase = createClient(
  requireEnv("EXPO_PUBLIC_SUPABASE_URL", supabaseUrl),
  requireEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY", supabaseAnonKey),
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
      storage: {
        getItem: getStoredItem,
        removeItem: removeStoredItem,
        setItem: setStoredItem,
      },
    },
  }
);

export async function testSupabaseConnection() {
  try {
    const { error } = await supabase.from("users").select("*").limit(1);

    if (error) {
      return { error: error.message, ok: false };
    }

    return { ok: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown Supabase connection error",
      ok: false,
    };
  }
}
