"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase/client";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(hasSupabaseEnv);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data, error }) => {
      console.log("[Momentra auth] home route session state", {
        error: error?.message ?? null,
        hasSession: Boolean(data.session),
        phone: data.session?.user.phone ?? null,
        userId: data.session?.user.id ?? null,
      });
      setUser(data.session?.user ?? null);
      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Momentra auth] home route auth state change", {
        event,
        hasSession: Boolean(session),
        phone: session?.user.phone ?? null,
        userId: session?.user.id ?? null,
      });
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function logout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d0905] px-6 text-[#F2E8D9]">
      <div className="max-w-xl text-center">
        <div className="mb-4 inline-flex rounded-full border border-[#C9975A]/40 bg-[#C9975A]/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[2px] text-[#C9975A]">
          UPDATED MOMENTRA VENDOR PORTAL V3
        </div>
        <h1 className="font-serif text-4xl italic">Momentra Vendor Portal</h1>
        <p className="mt-3 text-sm text-[#F2E8D9]/60">Customer phone OTP login is now available alongside the vendor prototype.</p>
        {checkingSession ? (
          <p className="mt-4 text-xs uppercase tracking-[2px] text-[#C9975A]/70">Checking session...</p>
        ) : user ? (
          <p className="mt-4 text-xs uppercase tracking-[2px] text-[#C9975A]">Signed in: {user.phone}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {user ? (
            <>
              <Link className="inline-flex rounded-xl bg-gradient-to-r from-[#C0392B] to-[#8B1A10] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-950/30" href="/profile">
                Profile
              </Link>
              <button className="inline-flex rounded-xl border border-[#C9975A]/40 px-5 py-3 text-sm font-semibold text-[#C9975A]" onClick={logout} type="button">
                Logout
              </button>
            </>
          ) : (
            <Link className="inline-flex rounded-xl bg-gradient-to-r from-[#C0392B] to-[#8B1A10] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-950/30" href="/login">
              Customer Login
            </Link>
          )}
          <Link className="inline-flex rounded-xl bg-gradient-to-r from-[#C0392B] to-[#8B1A10] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-950/30" href="/vendor/onboarding">
            Apply as Vendor
          </Link>
          <Link className="inline-flex rounded-xl border border-[#C9975A]/40 px-5 py-3 text-sm font-semibold text-[#C9975A]" href="/vendor/login">
            Already a Vendor
          </Link>
          <Link className="inline-flex rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/70" href="/vendor">
            Open Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
