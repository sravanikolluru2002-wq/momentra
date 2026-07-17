import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
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
import { hasSupabaseEnv, supabase } from "@/lib/supabase";

const DARK = {
  bg: "#0D0905",
  panel: "rgba(255,255,255,0.05)",
  panelBorder: "rgba(201,151,90,0.18)",
  text: "#F2E8D9",
  text2: "rgba(242,232,217,0.68)",
  muted: "rgba(242,232,217,0.42)",
  field: "rgba(255,255,255,0.06)",
  fieldBorder: "rgba(201,151,90,0.22)",
  featureBg: "rgba(168,111,42,0.12)",
  featureBorder: "rgba(201,151,90,0.16)",
  red2: "#8E332A",
  gold: "#C9975A",
  shadow: "#000000",
  red: "#C0392B",
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
  featureBg: "#FBF2E6",
  featureBorder: "#E3D0BE",
  red2: "#8E332A",
  gold: "#947C6C",
  shadow: "#4B241C",
  red: "#7B2E26",
};

export default function AdminLoginScreen() {
  const { isDark } = useMomentraTheme();
  const theme = isDark ? DARK : LIGHT;
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canContinue = useMemo(() => Boolean(email.trim() && role.trim()), [email, role]);

  async function continueToAdminDashboard() {
    if (!canContinue || loading) return;

    if (!hasSupabaseEnv) {
      setError("Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: upsertError } = await supabase
        .from("admin_profiles")
        .upsert(
          {
            email: email.trim().toLowerCase(),
            full_name: fullName.trim() || null,
            role: role.trim(),
          },
          { onConflict: "email" }
        )
        .select("id")
        .single();

      if (upsertError) throw upsertError;

      router.push({ params: { adminId: data.id }, pathname: "/admin-dashboard" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not continue to admin dashboard.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.bg }]}>
      <LinearGradient
        colors={isDark ? ["#2A1409", "#160907", "#050302"] : ["#FFF8F2", "#F6E9DD", "#FFFDFB"]}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[
          styles.backgroundGlow,
          { backgroundColor: isDark ? "rgba(168,111,42,0.18)" : "rgba(168,111,42,0.08)" },
        ]}
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.replace("/")} style={[styles.backPill, { borderColor: theme.fieldBorder, backgroundColor: theme.field }]}>
              <Text style={[styles.backPillText, { color: theme.gold }]}>Back to home</Text>
            </Pressable>
          </View>

          <View style={styles.brandBlock}>
            <Image resizeMode="contain" source={require("../assets/logo.png")} style={styles.logoImage} />
            <Text style={[styles.phonetic, { color: theme.gold }]}>ADMIN ACCESS</Text>
            <Text style={[styles.tagline, { color: theme.text }]}>
              This admin login now persists a real admin profile before opening the live operations dashboard.
            </Text>
          </View>

          <View style={[styles.panel, { backgroundColor: theme.panel, borderColor: theme.panelBorder, shadowColor: theme.shadow }]}>
            <View style={styles.features}>
              {[
                "Create a real admin profile in Supabase",
                "Open admin operations, finance, and support views on live data",
                "Review partner updates in realtime without mock arrays",
              ].map((feature, index) => (
                <View key={feature} style={[styles.feature, { backgroundColor: theme.featureBg, borderColor: theme.featureBorder }]}>
                  <Text style={[styles.featureIcon, { color: theme.red2 }]}>{String(index + 1).padStart(2, "0")}</Text>
                  <Text style={[styles.featureText, { color: theme.text }]}>{feature}</Text>
                </View>
              ))}
            </View>

            <View style={styles.form}>
              <Field label="Admin email" onChangeText={setEmail} placeholder="ops@momentra.in" theme={theme} value={email} />
              <Field label="Role" onChangeText={setRole} placeholder="Operations Manager / Finance Admin" theme={theme} value={role} />
              <Field label="Full name (optional)" onChangeText={setFullName} placeholder="Ananya Kapoor" theme={theme} value={fullName} />

              {error ? <Text style={[styles.feedback, { color: theme.red }]}>{error}</Text> : null}

              <View style={styles.ctaStack}>
                <Pressable
                  disabled={!canContinue || loading}
                  onPress={continueToAdminDashboard}
                  style={[styles.primaryButton, { backgroundColor: theme.red2 }, (!canContinue || loading) && styles.disabledButton]}
                >
                  <Text style={styles.primaryButtonText}>{loading ? "Saving admin..." : "Continue to admin dashboard"}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  onChangeText,
  placeholder,
  theme,
  value,
}: {
  label: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  theme: typeof DARK | typeof LIGHT;
  value: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: theme.text2 }]}>{label}</Text>
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        style={[styles.input, { backgroundColor: theme.field, borderColor: theme.fieldBorder, color: theme.text }]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F2EC" },
  backgroundGlow: { borderRadius: 180, height: 360, position: "absolute", right: -140, top: -80, width: 360 },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 34 },
  headerRow: { alignItems: "flex-start", marginBottom: 12 },
  backPill: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 },
  backPillText: { fontSize: 12, fontWeight: "800" },
  brandBlock: { alignItems: "center", marginBottom: 30 },
  logoImage: { height: 128, marginBottom: 10, width: 306 },
  phonetic: { fontSize: 13, fontWeight: "800", letterSpacing: 2.2, marginBottom: 12, textAlign: "center" },
  tagline: { alignSelf: "center", fontSize: 16, lineHeight: 24, maxWidth: 430, textAlign: "center" },
  panel: { borderRadius: 28, borderWidth: 1, padding: 24, shadowOffset: { height: 18, width: 0 }, shadowOpacity: 0.18, shadowRadius: 28, width: "100%" },
  features: { gap: 10, marginBottom: 22 },
  feature: { alignItems: "center", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 12, padding: 14 },
  featureIcon: { fontSize: 13, fontWeight: "800", letterSpacing: 1 },
  featureText: { flex: 1, fontSize: 13, fontWeight: "600" },
  form: { gap: 14 },
  fieldWrap: { gap: 8 },
  label: { fontSize: 10, fontWeight: "700", letterSpacing: 1.6, textTransform: "uppercase" },
  input: { borderRadius: 15, borderWidth: 1, fontSize: 16, height: 52, paddingHorizontal: 16 },
  primaryButton: { alignItems: "center", borderRadius: 16, height: 54, justifyContent: "center", marginTop: 4 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  disabledButton: { opacity: 0.58 },
  ctaStack: { gap: 10, marginTop: 6 },
  feedback: { fontSize: 12, fontWeight: "700", lineHeight: 18, textAlign: "center" },
});
