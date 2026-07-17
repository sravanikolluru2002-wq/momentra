import type { User as FirebaseUser } from "firebase/auth";

import { normalizeIndianPhoneNumber } from "@/lib/phone";
import { supabase } from "@/lib/supabase";

export type CustomerProfileRow = {
  city: string | null;
  created_at: string | null;
  firebase_uid: string | null;
  full_name: string | null;
  id: string;
  last_login: string | null;
  phone_number: string | null;
};

export type SupabaseProfileError = {
  code?: string | null;
  details?: string | null;
  hint?: string | null;
  message?: string;
};

type ProfilePayload = {
  budget?: string | null;
  celebration_goal?: string | null;
  city?: string | null;
  date_time_preference?: string | null;
  firebase_uid: string;
  full_name?: string | null;
  guest_count?: string | null;
  last_login: string;
  occasion_type?: string | null;
  phone_number: string;
  preferred_vibe?: string | null;
  referral_code?: string | null;
};

const PROFILE_TABLE = "profiles";
const PROFILE_SELECT = "id,firebase_uid,phone_number,full_name,city,created_at,last_login";

export function logSupabaseProfileError(context: string, error: SupabaseProfileError | Error | unknown, extra?: Record<string, unknown>) {
  const supabaseError = error as SupabaseProfileError;

  console.error(`[Momentra users] ${context}`, {
    code: supabaseError?.code ?? null,
    details: supabaseError?.details ?? null,
    hint: supabaseError?.hint ?? null,
    message: supabaseError?.message ?? (error instanceof Error ? error.message : "Unknown Supabase error"),
    ...extra,
  });
}

function cleanPayload<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

export function getFirebaseProfileIdentity(user: FirebaseUser, phoneOverride?: string | null) {
  const phoneNumber = normalizeIndianPhoneNumber(phoneOverride ?? user.phoneNumber);

  return {
    firebaseUid: user.uid,
    phoneNumber,
  };
}

export async function ensureCustomerProfile(
  user: FirebaseUser,
  fields: Partial<Omit<ProfilePayload, "firebase_uid" | "last_login" | "phone_number">> = {},
  phoneOverride?: string | null
) {
  const { firebaseUid, phoneNumber: normalizedPhone } = getFirebaseProfileIdentity(user, phoneOverride);

  if (!normalizedPhone) {
    throw new Error("Firebase user does not have a phone number.");
  }

  const payload = cleanPayload({
    firebase_uid: firebaseUid,
    phone_number: normalizedPhone,
    last_login: new Date().toISOString(),
    ...fields,
  });

  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .upsert(payload, {
      onConflict: "firebase_uid",
    })
    .select(PROFILE_SELECT)
    .single();

  if (error) {
    console.error("[Momentra profile] upsert failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw error;
  }

  return data as CustomerProfileRow;
}
