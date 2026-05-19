import type { SupabaseClient, User } from "@supabase/supabase-js";

type SyncResult = {
  error?: string;
  ok: boolean;
};

function isSchemaError(message: string) {
  return /column|schema cache|Could not find|does not exist/i.test(message);
}

async function tryUpdateThenInsert(
  supabase: SupabaseClient,
  matchColumn: string,
  matchValue: string,
  payload: Record<string, string>
) {
  const update = await supabase
    .from("users")
    .update(payload)
    .eq(matchColumn, matchValue)
    .select("id")
    .limit(1);

  if (update.error) {
    return { error: update.error.message, schemaError: isSchemaError(update.error.message) };
  }

  if ((update.data ?? []).length > 0) {
    return { ok: true };
  }

  const insert = await supabase.from("users").insert(payload).select("id").limit(1);

  if (insert.error) {
    return { error: insert.error.message, schemaError: isSchemaError(insert.error.message) };
  }

  return { ok: true };
}

export async function syncCustomerUser(
  supabase: SupabaseClient,
  user: User,
  contact: { email?: string; phone?: string }
): Promise<SyncResult> {
  const now = new Date().toISOString();
  const email = contact.email ?? user.email ?? "";
  const phone = contact.phone ?? user.phone ?? "";
  const payloads: Array<Record<string, string>> = [
    {
      auth_user_id: user.id,
      email,
      id: user.id,
      last_login_at: now,
      phone,
      updated_at: now,
      user_phone: phone,
    },
    {
      auth_user_id: user.id,
      email,
      id: user.id,
      updated_at: now,
    },
    {
      email,
      id: user.id,
      updated_at: now,
    },
    {
      email,
      updated_at: now,
    },
    {
      id: user.id,
      updated_at: now,
    },
    {
      phone,
      updated_at: now,
    },
    {
      user_phone: phone,
    },
  ];

  const matchColumns = ["id", "auth_user_id", "email", "phone", "user_phone"];
  let lastError = "";

  for (const payload of payloads) {
    const cleanPayload = Object.fromEntries(Object.entries(payload).filter(([, value]) => value));

    for (const column of matchColumns) {
      if (!(column in cleanPayload)) continue;

      const matchValue = cleanPayload[column];

      if (!matchValue) continue;

      const result = await tryUpdateThenInsert(supabase, column, matchValue, cleanPayload);

      if (result.ok) {
        return { ok: true };
      }

      lastError = result.error ?? lastError;

      if (!result.schemaError) {
        break;
      }
    }
  }

  return {
    error: lastError || "Could not sync user profile. Check the users table columns.",
    ok: false,
  };
}
