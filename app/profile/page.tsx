"use client";

import Image from "next/image";
import Link from "next/link";
import { Fingerprint, Loader2, LogOut, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    async function loadProfile() {
      if (!hasSupabaseEnv) {
        setError("Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
        setLoading(false);
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error: sessionError } = await supabase.auth.getSession();

        console.log("[Momentra auth] profile route session state", {
          error: sessionError?.message ?? null,
          hasSession: Boolean(data.session),
          phone: data.session?.user.phone ?? null,
          userId: data.session?.user.id ?? null,
        });

        if (sessionError) throw sessionError;

        if (!data.session?.user) {
          router.replace("/login");
          return;
        }

        if (mounted) {
          setUser(data.session.user);
          setLoading(false);
        }

        const authListener = supabase.auth.onAuthStateChange((event, session) => {
          console.log("[Momentra auth] profile route auth state change", {
            event,
            hasSession: Boolean(session),
            phone: session?.user.phone ?? null,
            userId: session?.user.id ?? null,
          });

          if (!mounted) return;

          if (!session?.user) {
            setUser(null);
            router.replace("/login");
            return;
          }

          setUser(session.user);
        });

        subscription = authListener.data.subscription;
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Could not load profile.");
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [router]);

  async function logout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <main className="profile-page">
      <style jsx global>{profileCss}</style>
      <header className="profile-nav">
        <Link className="brand" href="/">
          <Image alt="Momentra" height={38} src="/logo.png" width={62} />
          <span>Momentra</span>
        </Link>
        <Link href="/login">Login</Link>
      </header>

      <section className="profile-card">
        {loading ? (
          <div className="loading"><Loader2 className="spin" size={22} /> Checking your session...</div>
        ) : error ? (
          <div className="error-box">{error}</div>
        ) : user ? (
          <>
            <div className="avatar"><UserRound size={34} /></div>
            <p className="eyebrow">Customer Profile</p>
            <h1>Your Momentra account</h1>
            <div className="detail-grid">
              <div>
                <Phone size={18} />
                <span>Phone number</span>
                <strong>{user.phone ?? "Not available"}</strong>
              </div>
              <div>
                <ShieldCheck size={18} />
                <span>Auth status</span>
                <strong>Logged in</strong>
              </div>
              <div>
                <Fingerprint size={18} />
                <span>Supabase user ID</span>
                <strong>{user.id}</strong>
              </div>
            </div>
            <button className="logout-btn" onClick={logout} type="button">
              <LogOut size={17} />
              Logout
            </button>
          </>
        ) : null}
      </section>
    </main>
  );
}

const profileCss = `
.profile-page{--bg:#0d0905;--card:#fffaf2;--text:#1a1208;--muted:#7a684d;--gold:#C9975A;--red:#C0392B;--red2:#8B1A10;min-height:100vh;background:radial-gradient(circle at top,rgba(201,151,90,.22),transparent 34%),linear-gradient(135deg,#0d0905,#1a0e08);font-family:'DM Sans',system-ui,sans-serif;color:var(--text);padding:24px}.profile-nav{height:58px;max-width:1080px;margin:0 auto 34px;display:flex;align-items:center;justify-content:space-between}.profile-nav a{color:#F2E8D9;text-decoration:none;font-size:14px}.brand{display:flex;align-items:center;gap:10px}.brand img{object-fit:contain}.brand span{font-family:'Cormorant Garamond',serif;font-size:20px;font-style:italic}.profile-card{width:min(100%,720px);margin:0 auto;background:var(--card);border:1px solid rgba(201,151,90,.25);border-radius:28px;padding:36px;box-shadow:0 30px 90px rgba(0,0,0,.36);text-align:center}.avatar{width:74px;height:74px;border-radius:50%;display:grid;place-items:center;margin:0 auto 18px;background:rgba(192,57,43,.08);border:1px solid rgba(192,57,43,.18);color:var(--red)}.eyebrow{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-weight:800}.profile-card h1{font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:300;margin:8px 0 24px}.detail-grid{display:grid;gap:14px;text-align:left;margin:24px 0}.detail-grid div{border:1px solid rgba(170,130,70,.22);background:#edeae3;border-radius:16px;padding:16px;display:grid;gap:6px}.detail-grid svg{color:var(--red)}.detail-grid span{font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:var(--muted)}.detail-grid strong{font-size:15px;overflow-wrap:anywhere}.logout-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:14px;padding:13px 24px;background:linear-gradient(135deg,var(--red),var(--red2));color:#fff;font-weight:800;cursor:pointer}.loading,.error-box{display:flex;align-items:center;justify-content:center;gap:9px;min-height:220px;color:var(--muted)}.error-box{color:var(--red);background:rgba(192,57,43,.08);border:1px solid rgba(192,57,43,.18);border-radius:16px;min-height:auto;padding:14px}.spin{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:640px){.profile-card{padding:26px}.profile-card h1{font-size:31px}}
`;
