import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ConfirmationResult,
  RecaptchaVerifier,
  onAuthStateChanged,
  signInWithPhoneNumber,
} from "firebase/auth";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { supabase } from "@/lib/supabase";
import { syncFirebaseCustomerUser } from "@/lib/supabase/user-sync";

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
  divider: "rgba(201,151,90,0.14)",
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
  divider: "#E9DDD4",
  red: "#7B2E26",
  red2: "#8E332A",
  gold: "#947C6C",
  green: "#1D7A4A",
  shadow: "#4B241C",
};

type LoginStep = "phone" | "otp";

export default function LoginScreen() {
  const { isDark } = useMomentraTheme();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<LoginStep>("phone");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);
  const theme = isDark ? DARK : LIGHT;

  const normalizedPhone = phone.replace(/\D/g, "");
  const fullPhone = useMemo(() => `+91${normalizedPhone}`, [normalizedPhone]);
  const phoneValid = /^\d{10}$/.test(normalizedPhone);
  const otpValid = /^\d{6}$/.test(otp);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      console.log("[Momentra auth] Firebase login auth state", {
        hasUser: Boolean(user),
        phone: user?.phoneNumber ?? null,
        uid: user?.uid ?? null,
      });

      if (user) {
        router.replace("/profile");
      }
    });

    return unsubscribe;
  }, []);

  function showError(text: string) {
    setError(text);
    setMessage("");
    if (Platform.OS !== "web") {
      Alert.alert("Momentra login", text);
    }
  }

  async function sendOTP() {
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

    setLoading(true);

    try {
      if (!recaptchaVerifier.current) {
        recaptchaVerifier.current = new RecaptchaVerifier(firebaseAuth, "firebase-recaptcha-container", {
          size: "invisible",
        });
      }

      const result = await signInWithPhoneNumber(firebaseAuth, fullPhone, recaptchaVerifier.current);

      console.log("[Momentra auth] Firebase OTP sent successfully", { phone: fullPhone });
      setConfirmation(result);
      setStep("otp");
      setMessage(`OTP sent to ${fullPhone}`);
    } catch (err) {
      console.error("[Momentra auth] Firebase OTP send failed", err);
      recaptchaVerifier.current?.clear();
      recaptchaVerifier.current = null;
      showError(err instanceof Error ? err.message : "Could not send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOTP() {
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

    setLoading(true);

    try {
      const credential = await confirmation.confirm(otp);
      const user = credential.user;

      console.log("[Momentra auth] Firebase OTP verified successfully", {
        phone: user.phoneNumber ?? fullPhone,
        uid: user.uid,
      });

      const sync = await syncFirebaseCustomerUser(supabase, user);
      if (!sync.ok) {
        console.warn("[Momentra auth] Supabase Firebase user sync warning", sync.error);
      }

      router.replace("/profile");
    } catch (err) {
      console.error("[Momentra auth] Firebase OTP verify failed", err);
      showError(err instanceof Error ? err.message : "Could not verify OTP.");
    } finally {
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
          {
            backgroundColor: isDark ? "rgba(192,57,43,0.18)" : "rgba(192,57,43,0.08)",
          },
        ]}
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandBlock}>
            <Image resizeMode="contain" source={require("../assets/logo.png")} style={styles.logoImage} />
            <Text style={[styles.phonetic, { color: theme.gold }]}>{"/'moh-men-truh/"}</Text>
            <Text style={[styles.tagline, { color: theme.text }]}>
              Curated celebration venues, experiences, and details in a single beautiful booking flow.
            </Text>
          </View>

          <View
            style={[
              styles.panel,
              {
                backgroundColor: theme.panel,
                borderColor: theme.panelBorder,
                shadowColor: theme.shadow,
              },
            ]}
          >
            <View style={styles.features}>
              {["Verified celebration venues", "Curated add-ons and experiences", "Instant booking with secure checkout"].map(
                (feature, index) => (
                  <View
                    key={feature}
                    style={[
                      styles.feature,
                      {
                        backgroundColor: theme.featureBg,
                        borderColor: theme.featureBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.featureIcon, { color: theme.red2 }]}>
                      {String(index + 1).padStart(2, "0")}
                    </Text>
                    <Text style={[styles.featureText, { color: theme.text }]}>{feature}</Text>
                  </View>
                )
              )}
            </View>

            {step === "phone" ? (
              <View style={styles.form}>
                <Text style={[styles.label, { color: theme.text2 }]}>Mobile number</Text>

                <View style={styles.phoneRow}>
                  <View
                    style={[
                      styles.countryBox,
                      {
                        backgroundColor: theme.field,
                        borderColor: theme.fieldBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.countryText, { color: theme.text }]}>+91</Text>
                  </View>

                  <TextInput
                    keyboardType="number-pad"
                    maxLength={10}
                    onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
                    placeholder="Enter 10-digit number"
                    placeholderTextColor={theme.muted}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.field,
                        borderColor: theme.fieldBorder,
                        color: theme.text,
                      },
                    ]}
                    textContentType="telephoneNumber"
                    value={phone}
                  />
                </View>

                <Pressable
                  android_ripple={{ color: "rgba(255,255,255,0.14)" }}
                  disabled={loading}
                  onPress={sendOTP}
                  style={[styles.primaryButton, { backgroundColor: theme.red2 }, loading && styles.disabledButton]}
                >
                  <Text style={styles.primaryButtonText}>{loading ? "Sending OTP..." : "Continue"}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={[styles.otpTitle, { color: theme.text }]}>Verify your number</Text>
                <Text style={[styles.otpHint, { color: theme.text2 }]}>
                  We sent a 6-digit OTP to +91 {phone.slice(0, 5)}XXXXX
                </Text>

                <TextInput
                  keyboardType="number-pad"
                  maxLength={6}
                  onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ""))}
                  placeholder="000000"
                  placeholderTextColor={theme.muted}
                  style={[
                    styles.otpInput,
                    {
                      backgroundColor: theme.field,
                      borderColor: theme.fieldBorder,
                      color: theme.text,
                    },
                  ]}
                  value={otp}
                />

                <Pressable
                  android_ripple={{ color: "rgba(255,255,255,0.14)" }}
                  disabled={loading}
                  onPress={verifyOTP}
                  style={[styles.primaryButton, { backgroundColor: theme.red2 }, loading && styles.disabledButton]}
                >
                  <Text style={styles.primaryButtonText}>{loading ? "Verifying..." : "Verify and enter"}</Text>
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
            )}

            {error ? <Text style={[styles.feedback, { color: theme.red }]}>{error}</Text> : null}
            {message ? <Text style={[styles.feedback, { color: theme.green }]}>{message}</Text> : null}
            <View nativeID="firebase-recaptcha-container" style={styles.recaptchaBox} />

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
  screen: {
    flex: 1,
    backgroundColor: "#F8F2EC",
  },
  backgroundGlow: {
    borderRadius: 180,
    height: 360,
    position: "absolute",
    right: -140,
    top: -80,
    width: 360,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 34,
  },
  brandBlock: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoImage: {
    height: 128,
    marginBottom: 10,
    width: 306,
  },
  phonetic: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  tagline: {
    alignSelf: "center",
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 330,
    textAlign: "center",
  },
  panel: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    width: "100%",
  },
  features: {
    gap: 10,
    marginBottom: 24,
  },
  feature: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  featureIcon: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  form: {
    gap: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  phoneRow: {
    flexDirection: "row",
    gap: 10,
  },
  countryBox: {
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 76,
  },
  countryText: {
    fontSize: 15,
    fontWeight: "700",
  },
  input: {
    borderRadius: 15,
    borderWidth: 1,
    flex: 1,
    fontSize: 16,
    height: 52,
    paddingHorizontal: 16,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 54,
    justifyContent: "center",
    marginTop: 4,
  },
  disabledButton: {
    opacity: 0.58,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  otpTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  otpHint: {
    fontSize: 13,
    lineHeight: 20,
  },
  otpInput: {
    borderRadius: 15,
    borderWidth: 1,
    fontSize: 22,
    fontWeight: "700",
    height: 56,
    letterSpacing: 8,
    paddingHorizontal: 16,
    textAlign: "center",
  },
  otpActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  resend: {
    fontSize: 13,
    fontWeight: "700",
  },
  feedback: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 14,
    textAlign: "center",
  },
  recaptchaBox: {
    height: 1,
    opacity: 0,
    width: 1,
  },
  disclaimer: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: 18,
    textAlign: "center",
  },
});
