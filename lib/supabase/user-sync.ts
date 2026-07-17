import type { User as FirebaseUser } from "firebase/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeIndianPhoneNumber } from "@/lib/phone";

type SyncResult = {
  error?: string;
  ok: boolean;
};

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

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, {
      onConflict: "firebase_uid",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[Momentra profile] sync upsert failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    return { error: error.message, ok: false };
  }

  return { ok: true };
}
