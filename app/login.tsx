import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ConfirmationResult,
  User,
  onAuthStateChanged,
  signInWithPhoneNumber,
} from "firebase/auth";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useMomentraTheme } from "@/contexts/momentra-theme";
import { firebaseAuth, hasFirebaseEnv } from "@/firebase/config";
import {
  ensureRecaptchaVerifier,
  getRecaptchaVerifier,
  initializeRecaptchaVerifier,
  resetRecaptchaVerifier,
} from "@/lib/firebase/recaptcha";
import { normalizeIndianPhoneNumber } from "@/lib/phone";
import {
  ensureCustomerProfile,
  logSupabaseProfileError,
} from "@/lib/supabase/customer-profile";

const DARK = {
  bg: "#0D0905",
  panel: "rgba(255,255,255,0.05)",
  panelBorder: "rgba(201,151,90,0.18)",
  text: "#F2E8D9",
  text2: "rgba(242,232,217,0.62)",
  muted: "rgba(242,232,217,0.42)",
  field: "rgba(255,255,255,0.06)",
  fieldBorder: "rgba(201,151,90,0.22)",
  featureBg: "rgba(192,57,43,0.12)",
  featureBorder: "rgba(201,151,90,0.16)",
  red: "#C0392B",
  red2: "#8E332A",
  gold: "#C9975A",
  green: "#27AE60",
  shadow: "#000000",
};

const LIGHT = {
  bg: "#F8F2EC",
  panel: "#FFFDFB",
  panelBorder: "#E8DDD4",
  text: "#33211A",
  text2: "#705F55",
  muted: "#9B897C",
  field: "#FDF9F5",
  fieldBorder: "#DED1C7",
  featureBg: "#F8F2EC",
  featureBorder: "#EEE4DB",
  red: "#7B2E26",
  red2: "#8E332A",
  gold: "#947C6C",
  green: "#1D7A4A",
  shadow: "#4B241C",
};

type AuthMode = "login" | "signup";
type LoginStep = "phone" | "otp" | "welcome";
type SupabaseLoginError = {
  code?: string | null;
  details?: string | null;
  hint?: string | null;
  message?: string;
  status?: number | string | null;
};
type FirebaseLoginError = {
  code?: string | null;
  customData?: unknown;
  message?: string;
  name?: string;
};

function getSupabaseLoginError(error: unknown) {
  const supabaseError = error as SupabaseLoginError;

  return {
    message: supabaseError?.message ?? (error instanceof Error ? error.message : "Unknown Supabase error"),
    code: supabaseError?.code ?? null,
    details: supabaseError?.details ?? null,
    hint: supabaseError?.hint ?? null,
    status: supabaseError?.status ?? null,
  };
}

function formatDevelopmentSupabaseError(error: ReturnType<typeof getSupabaseLoginError>) {
  return [
    "Supabase profile error",
    `message: ${error.message}`,
    `code: ${error.code ?? "n/a"}`,
    `details: ${error.details ?? "n/a"}`,
    `hint: ${error.hint ?? "n/a"}`,
    `status: ${error.status ?? "n/a"}`,
  ].join("\n");
}

function getFirebaseLoginError(error: unknown) {
  const firebaseError = error as FirebaseLoginError;

  return {
    message: firebaseError?.message ?? (error instanceof Error ? error.message : "Unknown Firebase error"),
    code: firebaseError?.code ?? null,
    name: firebaseError?.name ?? (error instanceof Error ? error.name : null),
    customData: firebaseError?.customData ?? null,
  };
}

function formatDevelopmentFirebaseError(prefix: string, error: ReturnType<typeof getFirebaseLoginError>) {
  return [
    prefix,
    `message: ${error.message}`,
    `code: ${error.code ?? "n/a"}`,
    `name: ${error.name ?? "n/a"}`,
  ].join("\n");
}

export default function LoginScreen() {
  const { isDark } = useMomentraTheme();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<LoginStep>("phone");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const otpRequestInFlightRef = useRef(false);
  const otpVerifyInFlightRef = useRef(false);
  const loginLookupInFlightRef = useRef(false);
  const profileSyncUidRef = useRef<string | null>(null);
  const theme = isDark ? DARK : LIGHT;

  const normalizedPhone = phone.replace(/\D/g, "");
  const fullPhone = useMemo(() => normalizeIndianPhoneNumber(normalizedPhone), [normalizedPhone]);
  const phoneValid = /^\d{10}$/.test(normalizedPhone);
  const otpValid = /^\d{6}$/.test(otp);

  const showError = useCallback((text: string) => {
    setError(text);
    setMessage("");
    if (Platform.OS !== "web") {
      Alert.alert("Momentra login", text);
    }
  }, []);

  const loginExistingUser = useCallback(
    async (user: User) => {
      const phoneNumber = normalizeIndianPhoneNumber(user.phoneNumber ?? fullPhone);

      if (!phoneNumber) {
        showError("Firebase did not return a phone number. Please try again.");
        return;
      }

      if (loginLookupInFlightRef.current || profileSyncUidRef.current === user.uid) return;
      loginLookupInFlightRef.current = true;
      profileSyncUidRef.current = user.uid;
      setLoading(true);
      setError("");

      try {
        await ensureCustomerProfile(user, {}, phoneNumber);
        setMessage("Welcome back");
        setStep("welcome");
        setTimeout(() => router.replace("/profile"), 650);
      } catch (err) {
        const supabaseError = getSupabaseLoginError(err);

        console.error("[Momentra login] profile ensure failed", {
          message: supabaseError.message,
          code: supabaseError.code,
          details: supabaseError.details,
          hint: supabaseError.hint,
          status: supabaseError.status,
        });

        logSupabaseProfileError("login profile ensure failed", err, {
          rawError: err,
        });

        showError(
          process.env.NODE_ENV === "development"
            ? formatDevelopmentSupabaseError(supabaseError)
            : "We could not verify your account. Please try again."
        );
      } finally {
        loginLookupInFlightRef.current = false;
        profileSyncUidRef.current = null;
        setLoading(false);
      }
    },
    [fullPhone, showError]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      console.log("[Momentra auth] Firebase login auth state", {
        hasUser: Boolean(user),
        phone: user?.phoneNumber ?? null,
        uid: user?.uid ?? null,
      });

      setCheckingSession(false);

      if (authMode === "login" && step === "phone" && !confirmation && user?.phoneNumber) {
        loginExistingUser(user);
      }
    });

    return unsubscribe;
  }, [authMode, confirmation, loginExistingUser, step]);

  useEffect(() => {
    if (typeof window === "undefined" || Platform.OS !== "web" || !hasFirebaseEnv) return;

    try {
      void ensureRecaptchaVerifier(firebaseAuth);
    } catch (err) {
      console.error("[Momentra auth] Firebase reCAPTCHA init failed", err);
    }
  }, []);

  function switchMode(nextMode: AuthMode) {
    setAuthMode(nextMode);
    setStep("phone");
    setOtp("");
    setMessage("");
    setError("");
    setConfirmation(null);
    profileSyncUidRef.current = null;
  }

  async function sendOTP() {
    if (loading || otpRequestInFlightRef.current) return;

    setError("");
    setMessage("");

    if (!phoneValid) {
      showError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!hasFirebaseEnv) {
      showError("Firebase is not configured. Add the EXPO_PUBLIC_FIREBASE_* env vars in Vercel and locally.");
      return;
    }

    if (Platform.OS !== "web") {
      showError("Firebase phone OTP is currently enabled for the Momentra web/PWA experience.");
      return;
    }

    otpRequestInFlightRef.current = true;
    setLoading(true);

    try {
      const verifier = initializeRecaptchaVerifier(firebaseAuth) || getRecaptchaVerifier();
      let verifier;

      try {
        verifier = getRecaptchaVerifier();
        await verifier.render();
      } catch {
        verifier = await ensureRecaptchaVerifier(firebaseAuth);
      }
      const result = await signInWithPhoneNumber(firebaseAuth, fullPhone, verifier);
      setConfirmation(result);
      setStep("otp");
      setMessage(`OTP sent to ${fullPhone}`);
    } catch (err) {
      const firebaseError = getFirebaseLoginError(err);

      console.error("[Momentra auth] Firebase OTP send failed", {
        message: firebaseError.message,
        code: firebaseError.code,
        name: firebaseError.name,
        customData: firebaseError.customData,
      });

      resetRecaptchaVerifier();
      setConfirmation(null);
      try {
        await ensureRecaptchaVerifier(firebaseAuth);
      } catch (recaptchaError) {
        console.error("[Momentra auth] Firebase reCAPTCHA re-init failed", recaptchaError);
      }

      showError(
        process.env.NODE_ENV === "development"
          ? formatDevelopmentFirebaseError("Firebase OTP send failed", firebaseError)
          : "Could not send OTP. Please wait a moment and try again."
      );
    } finally {
      otpRequestInFlightRef.current = false;
      setLoading(false);
    }
  }

  async function confirmFirebaseCode() {
    if (loading || otpVerifyInFlightRef.current) return;

    setError("");
    setMessage("");

    if (!otpValid) {
      showError("Enter the 6-digit OTP.");
      return;
    }

    if (!confirmation) {
      showError("Please request a fresh OTP first.");
      setStep("phone");
      setOtp("");
      return;
    }

    otpVerifyInFlightRef.current = true;
    setLoading(true);

    try {
      const { user } = await confirmation.confirm(otp);

      if (authMode === "signup") {
        setConfirmation(null);
        router.replace("/onboarding");
        return;
      }

      await loginExistingUser(user);
      setConfirmation(null);
    } catch (err) {
      const firebaseError = getFirebaseLoginError(err);

      console.error("[Momentra auth] Firebase OTP verify failed", {
        message: firebaseError.message,
        code: firebaseError.code,
        name: firebaseError.name,
        customData: firebaseError.customData,
      });

      showError(
        process.env.NODE_ENV === "development"
          ? formatDevelopmentFirebaseError("Firebase OTP verification failed", firebaseError)
          : "OTP verification failed. Please check the code or request a new OTP."
      );
    } finally {
      otpVerifyInFlightRef.current = false;
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.bg }]}>
      <LinearGradient
        colors={isDark ? ["#3A0906", "#160907", "#050302"] : ["#FFF8F2", "#F7E7DA", "#FFFDFB"]}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[
          styles.backgroundGlow,
          { backgroundColor: isDark ? "rgba(192,57,43,0.18)" : "rgba(192,57,43,0.08)" },
        ]}
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.brandBlock}>
            <Image resizeMode="contain" source={require("../assets/logo.png")} style={styles.logoImage} />
            <Text style={[styles.phonetic, { color: theme.gold }]}>{"/'moh-men-truh/"}</Text>
            <Text style={[styles.tagline, { color: theme.text }]}>
              Curated celebration venues, experiences, and details in a single beautiful booking flow.
            </Text>
          </View>

          <View style={[styles.panel, { backgroundColor: theme.panel, borderColor: theme.panelBorder, shadowColor: theme.shadow }]}>
            <View style={styles.features}>
              {["Verified celebration venues", "Curated add-ons and experiences", "Instant booking with secure checkout"].map((feature, index) => (
                <View
                  key={feature}
                  style={[styles.feature, { backgroundColor: theme.featureBg, borderColor: theme.featureBorder }]}
                >
                  <Text style={[styles.featureIcon, { color: theme.red2 }]}>{String(index + 1).padStart(2, "0")}</Text>
                  <Text style={[styles.featureText, { color: theme.text }]}>{feature}</Text>
                </View>
              ))}
            </View>

            {step === "phone" ? (
              <View style={[styles.modeRow, { borderColor: theme.fieldBorder }]}>
                {(["login", "signup"] as AuthMode[]).map((mode) => {
                  const selected = authMode === mode;
                  return (
                    <Pressable
                      key={mode}
                      onPress={() => switchMode(mode)}
                      style={[styles.modeButton, { backgroundColor: selected ? theme.red2 : "transparent" }]}
                    >
                      <Text style={[styles.modeText, { color: selected ? "#FFFFFF" : theme.text2 }]}>
                        {mode === "login" ? "Login" : "Sign up"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {step === "phone" ? (
              <Pressable
                onPress={() => router.push("/partner-login")}
                style={[styles.partnerEntry, { backgroundColor: theme.featureBg, borderColor: theme.featureBorder }]}
              >
                <View style={styles.partnerCopy}>
                  <Text style={[styles.partnerEntryTitle, { color: theme.text }]}>Partner login</Text>
                  <Text style={[styles.partnerEntryText, { color: theme.text2 }]}>
                    Venue and service partners now open a live backend-backed dashboard profile.
                  </Text>
                </View>
                <Text style={[styles.partnerEntryAction, { color: theme.gold }]}>Open</Text>
              </Pressable>
            ) : null}

            {step === "phone" ? (
              <View style={styles.form}>
                {checkingSession ? (
                  <Text style={[styles.otpHint, { color: theme.text2 }]}>Checking your saved session...</Text>
                ) : null}
                <Text style={[styles.otpHint, { color: theme.text2 }]}>
                  {authMode === "login"
                    ? "Login checks your existing Momentra account after OTP."
                    : "Sign up verifies your number first, then opens Momentra onboarding."}
                </Text>
                <Text style={[styles.label, { color: theme.text2 }]}>Mobile number</Text>

                <View style={styles.phoneRow}>
                  <View style={[styles.countryBox, { backgroundColor: theme.field, borderColor: theme.fieldBorder }]}>
                    <Text style={[styles.countryText, { color: theme.text }]}>+91</Text>
                  </View>

                  <TextInput
                    keyboardType="number-pad"
                    maxLength={10}
                    onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
                    placeholder="Enter 10-digit number"
                    placeholderTextColor={theme.muted}
                    style={[styles.input, { backgroundColor: theme.field, borderColor: theme.fieldBorder, color: theme.text }]}
                    textContentType="telephoneNumber"
                    value={phone}
                  />
                </View>

                <Pressable
                  android_ripple={{ color: "rgba(255,255,255,0.14)" }}
                  disabled={loading || checkingSession}
                  onPress={sendOTP}
                  style={[styles.primaryButton, { backgroundColor: theme.red2 }, (loading || checkingSession) && styles.disabledButton]}
                >
                  <Text style={styles.primaryButtonText}>
                    {checkingSession ? "Checking..." : loading ? "Sending OTP..." : "Continue"}
                  </Text>
                </Pressable>
              </View>
            ) : step === "otp" ? (
              <View style={styles.form}>
                <Text style={[styles.otpTitle, { color: theme.text }]}>Verify your number</Text>
                <Text style={[styles.otpHint, { color: theme.text2 }]}>We sent a 6-digit OTP to +91 {phone.slice(0, 5)}XXXXX</Text>

                <TextInput
                  keyboardType="number-pad"
                  maxLength={6}
                  onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ""))}
                  placeholder="000000"
                  placeholderTextColor={theme.muted}
                  style={[styles.otpInput, { backgroundColor: theme.field, borderColor: theme.fieldBorder, color: theme.text }]}
                  value={otp}
                />

                <Pressable
                  android_ripple={{ color: "rgba(255,255,255,0.14)" }}
                  disabled={loading}
                  onPress={confirmFirebaseCode}
                  style={[styles.primaryButton, { backgroundColor: theme.red2 }, loading && styles.disabledButton]}
                >
                  <Text style={styles.primaryButtonText}>{loading ? "Verifying..." : authMode === "signup" ? "Verify and sign up" : "Verify and enter"}</Text>
                </Pressable>

                <View style={styles.otpActions}>
                  <Pressable disabled={loading} onPress={sendOTP}>
                    <Text style={[styles.resend, { color: theme.red }]}>Resend OTP</Text>
                  </Pressable>
                  <Pressable
                    disabled={loading}
                    onPress={() => {
                      setStep("phone");
                      setOtp("");
                      setConfirmation(null);
                    }}
                  >
                    <Text style={[styles.resend, { color: theme.gold }]}>Change number</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={[styles.otpTitle, { color: theme.text }]}>Welcome back</Text>
                <Text style={[styles.otpHint, { color: theme.text2 }]}>Taking you to your Momentra profile.</Text>
              </View>
            )}

            {error ? <Text style={[styles.feedback, { color: theme.red }]}>{error}</Text> : null}
            {message ? <Text style={[styles.feedback, { color: theme.green }]}>{message}</Text> : null}

            <Text style={[styles.disclaimer, { color: theme.muted }]}>
              By continuing you agree to the Momentra Terms and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F2EC" },
  backgroundGlow: { borderRadius: 180, height: 360, position: "absolute", right: -140, top: -80, width: 360 },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 34 },
  brandBlock: { alignItems: "center", marginBottom: 30 },
  logoImage: { height: 128, marginBottom: 10, width: 306 },
  phonetic: { fontSize: 13, fontWeight: "600", marginBottom: 12, textAlign: "center" },
  tagline: { alignSelf: "center", fontSize: 16, lineHeight: 24, maxWidth: 330, textAlign: "center" },
  panel: { borderRadius: 28, borderWidth: 1, padding: 24, shadowOffset: { height: 18, width: 0 }, shadowOpacity: 0.18, shadowRadius: 28, width: "100%" },
  features: { gap: 10, marginBottom: 24 },
  feature: { alignItems: "center", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 12, padding: 14 },
  featureIcon: { fontSize: 13, fontWeight: "800", letterSpacing: 1 },
  featureText: { flex: 1, fontSize: 13, fontWeight: "600" },
  modeRow: { borderRadius: 16, borderWidth: 1, flexDirection: "row", marginBottom: 18, overflow: "hidden", padding: 4 },
  modeButton: { alignItems: "center", borderRadius: 12, flex: 1, paddingVertical: 11 },
  modeText: { fontSize: 13, fontWeight: "800" },
  partnerEntry: { alignItems: "center", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 14, justifyContent: "space-between", marginBottom: 18, padding: 16 },
  partnerCopy: { flex: 1, gap: 4 },
  partnerEntryTitle: { fontSize: 14, fontWeight: "800" },
  partnerEntryText: { fontSize: 12, lineHeight: 18 },
  partnerEntryAction: { fontSize: 13, fontWeight: "800" },
  form: { gap: 14 },
  label: { fontSize: 10, fontWeight: "700", letterSpacing: 1.6, textTransform: "uppercase" },
  phoneRow: { flexDirection: "row", gap: 10 },
  countryBox: { alignItems: "center", borderRadius: 15, borderWidth: 1, height: 52, justifyContent: "center", width: 76 },
  countryText: { fontSize: 15, fontWeight: "700" },
  input: { borderRadius: 15, borderWidth: 1, flex: 1, fontSize: 16, height: 52, paddingHorizontal: 16 },
  primaryButton: { alignItems: "center", borderRadius: 16, height: 54, justifyContent: "center", marginTop: 4 },
  disabledButton: { opacity: 0.58 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  otpTitle: { fontSize: 22, fontWeight: "700" },
  otpHint: { fontSize: 13, lineHeight: 20 },
  otpInput: { borderRadius: 15, borderWidth: 1, fontSize: 22, fontWeight: "700", height: 56, letterSpacing: 8, paddingHorizontal: 16, textAlign: "center" },
  otpActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  resend: { fontSize: 13, fontWeight: "700" },
  feedback: { fontSize: 12, fontWeight: "700", lineHeight: 18, marginTop: 14, textAlign: "center" },
  disclaimer: { fontSize: 11, lineHeight: 17, marginTop: 18, textAlign: "center" },
});
