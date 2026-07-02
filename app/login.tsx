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
  getRecaptchaVerifier,
  initializeRecaptchaVerifier,
} from "@/lib/firebase/recaptcha";
import { normalizeIndianPhoneNumber } from "@/lib/phone";
import { supabase } from "@/lib/supabase";

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

const USER_SELECT = "id,firebase_uid,phone_number";

function isMissingColumnError(message: string) {
  return /column|schema cache|Could not find|does not exist/i.test(message);
}

type SupabaseUserError = {
  code?: string | null;
  details?: string | null;
  hint?: string | null;
  message?: string;
};

function logSupabaseUserError(context: string, error: SupabaseUserError, extra?: Record<string, unknown>) {
  console.error(`[Momentra auth] ${context}`, {
    code: error.code ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
    message: error.message ?? "Unknown Supabase error",
    ...extra,
  });
}

async function findExistingUser(user: User, phoneNumber: string) {
  const byFirebase = await supabase
    .from("users")
    .select(USER_SELECT)
    .eq("firebase_uid", user.uid)
    .limit(1);

  if (byFirebase.error) {
    logSupabaseUserError("firebase_uid lookup failed", byFirebase.error, {
      firebase_uid: user.uid,
      phone_number: phoneNumber,
    });
    throw byFirebase.error;
  }

  const firebaseRow = byFirebase.data?.[0] ?? null;

  if (firebaseRow) return firebaseRow;

  const byPhone = await supabase
    .from("users")
    .select(USER_SELECT)
    .eq("phone_number", phoneNumber)
    .limit(1);

  if (byPhone.error) {
    logSupabaseUserError("phone_number lookup failed", byPhone.error, {
      firebase_uid: user.uid,
      phone_number: phoneNumber,
    });
    throw byPhone.error;
  }

  return byPhone.data?.[0] ?? null;
}

async function updateExistingUserLogin(user: User, phoneNumber: string, userId: string) {
  const { error } = await supabase
    .from("users")
    .update({
      firebase_uid: user.uid,
      last_login: new Date().toISOString(),
      phone_number: phoneNumber,
    })
    .eq("id", userId);

  if (error) {
    logSupabaseUserError("last_login update failed", error, {
      firebase_uid: user.uid,
      id: userId,
      phone_number: phoneNumber,
    });
    throw error;
  }
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

      if (loginLookupInFlightRef.current) return;
      loginLookupInFlightRef.current = true;
      setLoading(true);
      setError("");

      try {
        const existingUser = await findExistingUser(user, phoneNumber);

        if (!existingUser) {
          showError("No account found. Please sign up first.");
          setStep("phone");
          return;
        }

        await updateExistingUserLogin(user, phoneNumber, existingUser.id);
        setMessage("Welcome back");
        setStep("welcome");
        setTimeout(() => router.replace("/profile"), 650);
      } catch (err) {
        const supabaseError = err as SupabaseUserError;
        const text = supabaseError?.message ?? (err instanceof Error ? err.message : "Could not check your Momentra account.");
        logSupabaseUserError("Supabase login lookup failed", supabaseError, {
          rawError: err,
        });

        if (isMissingColumnError(text)) {
          showError("Supabase users table needs phone_number, firebase_uid, and last_login columns.");
        } else {
          showError("We could not verify your account. Please try again.");
        }
      } finally {
        loginLookupInFlightRef.current = false;
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

      if (authMode === "login" && user?.phoneNumber) {
        loginExistingUser(user);
      }
    });

    return unsubscribe;
  }, [authMode, loginExistingUser]);

  useEffect(() => {
    if (typeof window === "undefined" || Platform.OS !== "web" || !hasFirebaseEnv) return;

    try {
      initializeRecaptchaVerifier(firebaseAuth);
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
      const verifier = getRecaptchaVerifier();
      const result = await signInWithPhoneNumber(firebaseAuth, fullPhone, verifier);
      setConfirmation(result);
      setStep("otp");
      setMessage(`OTP sent to ${fullPhone}`);
    } catch (err) {
      console.error("[Momentra auth] Firebase OTP send failed", err);
      showError("Could not send OTP. Please wait a moment and try again.");
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
      return;
    }

    otpVerifyInFlightRef.current = true;
    setLoading(true);

    try {
      const { user } = await confirmation.confirm(otp);

      if (authMode === "signup") {
        router.replace("/onboarding");
        return;
      }

      await loginExistingUser(user);
    } catch (err) {
      console.error("[Momentra auth] Firebase OTP verify failed", err);
      showError("OTP verification failed. Please check the code or request a new OTP.");
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
                  <Pressable disabled={loading} onPress={() => setStep("phone")}>
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
