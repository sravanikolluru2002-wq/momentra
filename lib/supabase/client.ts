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

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseEnv) {
  console.warn(
    "[Momentra data] Missing Supabase env vars. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export function getSupabaseBrowserClient() {
  return createClient(supabaseUrl ?? "https://missing-supabase-url.supabase.co", supabaseAnonKey ?? "missing-supabase-anon-key", {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
    },
  });
}
