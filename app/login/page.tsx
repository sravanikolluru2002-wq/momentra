"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, LogIn, Phone, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase/client";
import { syncCustomerUser } from "@/lib/supabase/user-sync";

type LoginStep = "phone" | "otp";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<LoginStep>("phone");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(hasSupabaseEnv);

  const normalizedPhone = phone.replace(/\D/g, "");
  const fullPhone = useMemo(() => `${countryCode}${normalizedPhone}`, [countryCode, normalizedPhone]);
  const phoneValid = /^\d{10}$/.test(normalizedPhone);
  const otpValid = /^\d{6}$/.test(otp);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      console.log("[Momentra auth] login route session state", {
        error: sessionError?.message ?? null,
        hasSession: Boolean(data.session),
        phone: data.session?.user.phone ?? null,
        userId: data.session?.user.id ?? null,
      });
      setSessionUser(data.session?.user ?? null);
      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Momentra auth] login route auth state change", {
        event,
        hasSession: Boolean(session),
        phone: session?.user.phone ?? null,
        userId: session?.user.id ?? null,
      });
      setSessionUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function sendOtp() {
    setError("");
    setStatus("");

    if (!hasSupabaseEnv) {
      setError("Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
      return;
    }

    if (!phoneValid) {
      setError("Enter a valid 10 digit Indian phone number.");
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      });

      if (signInError) {
        console.error("[Momentra auth] OTP send failed", signInError);
        throw signInError;
      }

      console.log("[Momentra auth] OTP sent successfully", { phone: fullPhone });
      setStep("otp");
      setStatus(`OTP sent to ${fullPhone}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError("");
    setStatus("");

    if (!otpValid) {
      setError("Enter the 6 digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otp,
        type: "sms",
      });

      if (verifyError) {
        console.error("[Momentra auth] OTP verify failed", verifyError);
        throw verifyError;
      }

      console.log("[Momentra auth] OTP verified successfully", {
        hasSession: Boolean(data.session),
        phone: data.user?.phone ?? fullPhone,
        userId: data.user?.id ?? null,
      });

      if (data.user) {
        const sync = await syncCustomerUser(supabase, data.user, { phone: fullPhone });

        if (!sync.ok) {
          console.warn("Momentra user sync warning:", sync.error);
        }
      }

      router.replace("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setSessionUser(null);
    setStatus("");
    setError("");
    setLoading(false);
  }

  return (
    <main className="customer-auth-page">
      <style jsx global>{customerAuthCss}</style>
      <section className="auth-card">
        <div className="brand-panel">
          <Image alt="Momentra" height={80} priority src="/logo.png" width={126} />
          <div>
            <p className="eyebrow">Momentra Customer Login</p>
            <h1>Plan celebrations with ease.</h1>
            <p>Sign in with your phone OTP to view bookings, profile details, and upcoming moments.</p>
          </div>
        </div>

        <div className="form-panel">
          <Link className="quiet-link" href="/">Back to home</Link>
          <div className="form-heading">
            <div className="icon-chip"><LogIn size={18} /></div>
            <div>
              <h2>{step === "phone" ? "Login with phone OTP" : "Verify OTP"}</h2>
              <p>{step === "phone" ? "We will send a real SMS OTP using Supabase Auth." : `Enter the code sent to ${fullPhone}.`}</p>
            </div>
          </div>

          {!hasSupabaseEnv ? (
            <div className="env-box">
              <strong>Supabase env missing</strong>
              <span>Create `/Users/apple/momentra-web/.env.local` with:</span>
              <code>NEXT_PUBLIC_SUPABASE_URL=your-project-url</code>
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key</code>
              <span>Add the same keys in Vercel Project Settings.</span>
            </div>
          ) : null}

          {checkingSession ? (
            <div className="auth-success">Checking your saved Momentra session...</div>
          ) : sessionUser ? (
            <div className="signed-in-box">
              <span>Signed in as</span>
              <strong>{sessionUser.phone ?? fullPhone}</strong>
              <Link className="primary-btn" href="/profile">
                Go to profile <ArrowRight size={15} />
              </Link>
              <button className="secondary-btn" disabled={loading} onClick={logout} type="button">
                {loading ? <Loader2 className="spin" size={17} /> : null}
                Logout
              </button>
            </div>
          ) : step === "phone" ? (
            <div className="phone-form">
              <label className="label">Phone number</label>
              <div className="phone-row">
                <select aria-label="Country code" onChange={(event) => setCountryCode(event.target.value)} value={countryCode}>
                  <option value="+91">+91</option>
                </select>
                <input
                  autoComplete="tel-national"
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
                  placeholder="98765 43210"
                  type="tel"
                  value={phone}
                />
              </div>
              <button className="primary-btn" disabled={loading || !hasSupabaseEnv} onClick={sendOtp} type="button">
                {loading ? <Loader2 className="spin" size={17} /> : <Phone size={17} />}
                Send OTP
              </button>
            </div>
          ) : (
            <div className="phone-form">
              <label className="label">6 digit OTP</label>
              <input
                className="otp-input"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                value={otp}
              />
              <button className="primary-btn" disabled={loading} onClick={verifyOtp} type="button">
                {loading ? <Loader2 className="spin" size={17} /> : <CheckCircle2 size={17} />}
                Verify OTP
              </button>
              <div className="resend-row">
                <button disabled={loading} onClick={sendOtp} type="button">Resend OTP</button>
                <button disabled={loading} onClick={() => { setStep("phone"); setOtp(""); setStatus(""); setError(""); }} type="button">Change number</button>
              </div>
            </div>
          )}

          {error ? <div className="auth-error">{error}</div> : null}
          {status ? <div className="auth-success">{status}</div> : null}

          <div className="trust-row">
            <ShieldCheck size={16} />
            Secure Supabase phone OTP · No password needed
          </div>

          <Link className="profile-link" href="/profile">
            Go to profile <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  );
}

const customerAuthCss = `
.customer-auth-page{--bg:#0d0905;--bg2:#1a0e08;--card:#fffaf2;--text:#1a1208;--muted:#7a684d;--gold:#C9975A;--red:#C0392B;--red2:#8B1A10;min-height:100vh;background:radial-gradient(circle at 20% 10%,rgba(201,151,90,.20),transparent 32%),linear-gradient(135deg,#0d0905,#1a0e08);display:flex;align-items:center;justify-content:center;padding:28px;font-family:'DM Sans',system-ui,sans-serif;color:var(--text)}.auth-card{width:min(100%,980px);display:grid;grid-template-columns:.95fr 1.05fr;border:1px solid rgba(201,151,90,.24);border-radius:28px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.42);background:var(--card)}.brand-panel{min-height:590px;padding:36px;background:linear-gradient(155deg,rgba(13,9,5,.96),rgba(26,14,8,.90)),url('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80');background-size:cover;background-position:center;display:flex;flex-direction:column;justify-content:space-between;color:#F2E8D9}.brand-panel img{object-fit:contain;filter:drop-shadow(0 12px 30px rgba(0,0,0,.35))}.eyebrow{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-weight:800;margin-bottom:10px}.brand-panel h1{font-family:'Cormorant Garamond',serif;font-size:44px;font-weight:300;line-height:1.04;margin-bottom:12px}.brand-panel p:last-child{max-width:330px;font-size:14px;line-height:1.75;color:rgba(242,232,217,.68)}.form-panel{padding:38px;display:flex;flex-direction:column;justify-content:center}.quiet-link{align-self:flex-start;color:var(--muted);font-size:13px;text-decoration:none;margin-bottom:24px}.form-heading{display:flex;gap:14px;align-items:flex-start;margin-bottom:24px}.icon-chip{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:rgba(192,57,43,.09);color:var(--red);border:1px solid rgba(192,57,43,.15)}.form-heading h2{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:300;margin-bottom:4px}.form-heading p{font-size:13px;line-height:1.65;color:var(--muted)}.label{display:block;font-size:10px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:var(--muted);margin-bottom:8px}.phone-row{display:flex;gap:9px;margin-bottom:16px}.phone-row select,.phone-row input,.otp-input{height:48px;border-radius:13px;border:1.5px solid rgba(170,130,70,.28);background:#edeae3;color:var(--text);font:inherit;outline:none;padding:0 14px}.phone-row select{width:86px;appearance:none;text-align:center}.phone-row input{flex:1;min-width:0}.phone-row select:focus,.phone-row input:focus,.otp-input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(201,151,90,.12);background:#fffaf2}.otp-input{width:100%;font-size:22px;letter-spacing:8px;text-align:center;margin-bottom:16px}.primary-btn{width:100%;height:50px;border:0;border-radius:14px;display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,var(--red),var(--red2));color:#fff;font-weight:800;cursor:pointer;box-shadow:0 10px 24px rgba(192,57,43,.28);text-decoration:none}.primary-btn:disabled{opacity:.55;cursor:not-allowed}.secondary-btn{width:100%;height:48px;border-radius:14px;border:1.5px solid rgba(170,130,70,.28);display:flex;align-items:center;justify-content:center;gap:8px;background:transparent;color:var(--muted);font-weight:800;cursor:pointer}.resend-row{display:flex;justify-content:space-between;margin-top:14px}.resend-row button{border:0;background:transparent;color:var(--red);font-weight:700;cursor:pointer}.auth-error,.auth-success,.env-box{margin-top:16px;border-radius:14px;padding:12px 14px;font-size:13px;line-height:1.55}.auth-error{background:rgba(192,57,43,.08);border:1px solid rgba(192,57,43,.20);color:var(--red)}.auth-success{background:rgba(42,122,74,.10);border:1px solid rgba(42,122,74,.20);color:#2a7a4a}.signed-in-box{display:flex;flex-direction:column;gap:12px;border:1px solid rgba(42,122,74,.20);border-radius:16px;background:rgba(42,122,74,.08);padding:16px;margin-bottom:8px}.signed-in-box span{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);font-weight:800}.signed-in-box strong{font-size:15px;color:var(--text)}.env-box{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;background:rgba(201,151,90,.10);border:1px solid rgba(201,151,90,.25);color:var(--muted)}.env-box strong{color:var(--text)}.env-box code{background:rgba(13,9,5,.08);border-radius:8px;padding:7px;color:var(--text);font-size:12px}.trust-row{margin-top:18px;display:flex;align-items:center;justify-content:center;gap:7px;color:var(--muted);font-size:12px}.profile-link{margin-top:18px;display:inline-flex;align-self:center;align-items:center;gap:5px;color:var(--red);font-weight:800;text-decoration:none}.spin{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:820px){.auth-card{grid-template-columns:1fr}.brand-panel{min-height:260px}.form-panel{padding:26px}.brand-panel h1{font-size:34px}}
`;
