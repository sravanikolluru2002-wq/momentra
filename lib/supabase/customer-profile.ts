import type { User as FirebaseUser } from "firebase/auth";

import { normalizeIndianPhoneNumber } from "@/lib/phone";
import { supabase } from "@/lib/supabase";

export type CustomerProfileRow = {
  city: string | null;
  created_at: string | null;
  firebase_uid: string | null;
  full_name: string | null;
  id: string;
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
const PROFILE_SELECT = "id,firebase_uid,phone_number,full_name,city,created_at";

export function isMissingUserColumnError(error: SupabaseProfileError | Error | unknown) {
  const text = error instanceof Error
    ? error.message
    : typeof error === "object" && error
      ? `${(error as SupabaseProfileError).message ?? ""} ${(error as SupabaseProfileError).details ?? ""}`
      : String(error ?? "");

  return /column|schema cache|Could not find|does not exist/i.test(text);
}

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

function isDuplicateRowError(error: SupabaseProfileError | null | undefined) {
  return error?.code === "23505" || /duplicate key|already exists/i.test(`${error?.message ?? ""} ${error?.details ?? ""}`);
}

export function getFirebaseProfileIdentity(user: FirebaseUser, phoneOverride?: string | null) {
  const phoneNumber = normalizeIndianPhoneNumber(phoneOverride ?? user.phoneNumber);

  return {
    firebaseUid: user.uid,
    phoneNumber,
  };
}

export async function findCustomerProfile(firebaseUid: string, phoneNumber?: string | null) {
  const normalizedPhone = normalizeIndianPhoneNumber(phoneNumber);
  const lookups = [
    { column: "firebase_uid", value: firebaseUid },
    { column: "phone_number", value: normalizedPhone },
  ].filter((lookup) => lookup.value);

  for (const lookup of lookups) {
    const result = await supabase
      .from(PROFILE_TABLE)
      .select(PROFILE_SELECT)
      .eq(lookup.column, lookup.value)
      .limit(1);

    if (result.error) {
      logSupabaseProfileError(`${lookup.column} lookup failed`, result.error, {
        firebase_uid: firebaseUid,
        phone_number: normalizedPhone,
      });
      throw result.error;
    }

    const row = result.data?.[0] as CustomerProfileRow | undefined;

    if (row) return row;
  }

  return null;
}

async function writeCustomerProfile(existingId: string | null, payload: ProfilePayload) {
  const now = new Date().toISOString();
  const insertPayload = cleanPayload({ ...payload, created_at: now });
  const updatePayload = cleanPayload(payload);

  if (existingId) {
    return supabase
      .from(PROFILE_TABLE)
      .update(updatePayload)
      .eq("id", existingId)
      .select(PROFILE_SELECT)
      .maybeSingle();
  }

  return supabase
    .from(PROFILE_TABLE)
    .insert(insertPayload)
    .select(PROFILE_SELECT)
    .maybeSingle();
}

export async function ensureCustomerProfile(
  user: FirebaseUser,
  fields: Partial<Omit<ProfilePayload, "firebase_uid" | "last_login" | "phone_number">> = {},
  phoneOverride?: string | null
) {
  const { firebaseUid, phoneNumber } = getFirebaseProfileIdentity(user, phoneOverride);

  if (!phoneNumber) {
    throw new Error("Firebase user does not have a phone number.");
  }

  const now = new Date().toISOString();
  const existing = await findCustomerProfile(firebaseUid, phoneNumber);
  const fullPayload: ProfilePayload = {
    ...fields,
    firebase_uid: firebaseUid,
    last_login: now,
    phone_number: phoneNumber,
  };
  const basePayload: ProfilePayload = {
    city: fields.city,
    firebase_uid: firebaseUid,
    full_name: fields.full_name,
    last_login: now,
    phone_number: phoneNumber,
  };

  let write = await writeCustomerProfile(existing?.id ?? null, fullPayload);

  if (write.error && isMissingUserColumnError(write.error)) {
    logSupabaseProfileError("full profile write failed; retrying required profile columns only", write.error, {
      firebase_uid: firebaseUid,
      phone_number: phoneNumber,
      attemptedColumns: Object.keys(cleanPayload(fullPayload)),
    });

    write = await writeCustomerProfile(existing?.id ?? null, basePayload);
  }

  if (write.error && !existing && isDuplicateRowError(write.error)) {
    logSupabaseProfileError("profile insert hit duplicate row; retrying lookup and update", write.error, {
      firebase_uid: firebaseUid,
      phone_number: phoneNumber,
    });

    const duplicate = await findCustomerProfile(firebaseUid, phoneNumber);

    if (duplicate?.id) {
      write = await writeCustomerProfile(duplicate.id, fullPayload);

      if (write.error && isMissingUserColumnError(write.error)) {
        logSupabaseProfileError("duplicate-row update failed; retrying required profile columns only", write.error, {
          firebase_uid: firebaseUid,
          phone_number: phoneNumber,
          attemptedColumns: Object.keys(cleanPayload(fullPayload)),
        });

        write = await writeCustomerProfile(duplicate.id, basePayload);
      }
    }
  }

  if (write.error) {
    logSupabaseProfileError("profile write failed", write.error, {
      existingId: existing?.id ?? null,
      firebase_uid: firebaseUid,
      phone_number: phoneNumber,
      attemptedColumns: Object.keys(cleanPayload(write.error && isMissingUserColumnError(write.error) ? basePayload : fullPayload)),
    });
    throw write.error;
  }

  if (write.data) return write.data as CustomerProfileRow;

  const repaired = await findCustomerProfile(firebaseUid, phoneNumber);
  if (repaired) return repaired;

  throw new Error("Supabase profile write returned no user row.");
}
