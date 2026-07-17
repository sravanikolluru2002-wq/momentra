import type { User as FirebaseUser } from "firebase/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeIndianPhoneNumber } from "@/lib/phone";

type SyncResult = {
  error?: string;
  ok: boolean;
};

async function tryUpdateThenInsert(
  supabase: SupabaseClient,
  matchColumn: string,
  matchValue: string,
  payload: Record<string, string>
) {
  const update = await supabase
    .from("profiles")
    .update(payload)
    .eq(matchColumn, matchValue)
    .select("id")
    .limit(1);

  if (update.error) {
    return { error: update.error.message };
  }

  if ((update.data ?? []).length > 0) {
    return { ok: true };
  }

  const insert = await supabase.from("profiles").insert(payload).select("id").limit(1);

  if (insert.error) {
    return { error: insert.error.message };
  }

  return { ok: true };
}

export async function syncFirebaseCustomerUser(
  supabase: SupabaseClient,
  user: FirebaseUser
): Promise<SyncResult> {
  const now = new Date().toISOString();
  const phoneNumber = normalizeIndianPhoneNumber(user.phoneNumber);

  if (!phoneNumber) {
    return { error: "Firebase user does not have a phone number.", ok: false };
  }

  const payload = {
    firebase_uid: user.uid,
    last_login: now,
    phone_number: phoneNumber,
    updated_at: now,
  };

  for (const [matchColumn, matchValue] of [
    ["firebase_uid", user.uid],
    ["phone_number", phoneNumber],
  ] as const) {
    const result = await tryUpdateThenInsert(supabase, matchColumn, matchValue, payload);

    if (result.ok) return { ok: true };
  }

  return {
    error: "Could not sync Firebase user profile.",
    ok: false,
  };
}
