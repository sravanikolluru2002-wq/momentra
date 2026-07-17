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
import { estimateRegistrationFee, formatCurrency } from "@/lib/portal";
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
  featureBg: "rgba(192,57,43,0.12)",
  featureBorder: "rgba(201,151,90,0.16)",
  amberBg: "rgba(201,151,90,0.14)",
  amberBorder: "rgba(201,151,90,0.26)",
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
  amberBg: "#FBF2E6",
  amberBorder: "#E3D0BE",
  red: "#7B2E26",
  red2: "#8E332A",
  gold: "#947C6C",
  green: "#1D7A4A",
  shadow: "#4B241C",
};

export default function PartnerLoginScreen() {
  const { isDark } = useMomentraTheme();
  const theme = isDark ? DARK : LIGHT;
  const [partnerName, setPartnerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizedPhone = phone.replace(/\D/g, "");
  const canSubmit = useMemo(() => {
    return Boolean(
      partnerName.trim() &&
      businessName.trim() &&
      /^\d{10}$/.test(normalizedPhone) &&
      city.trim() &&
      category.trim()
    );
  }, [businessName, category, city, normalizedPhone, partnerName]);

  const fee = estimateRegistrationFee(category);

  async function continueToDashboard() {
    if (!canSubmit || loading) return;

    if (!hasSupabaseEnv) {
      setError("Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        business_name: businessName.trim(),
        category: category.trim(),
        city: city.trim(),
        full_name: partnerName.trim(),
        kyc_note: "Partner profile submitted from app login flow.",
        kyc_status: "submitted",
        payment_status: "pending",
        payment_total: fee,
        phone_number: normalizedPhone,
        status: "submitted",
        status_note: "Awaiting operations review.",
        visibility_status: "draft",
      };

      const { data, error: upsertError } = await supabase
        .from("partner_profiles")
        .upsert(payload, { onConflict: "phone_number" })
        .select("id")
        .single();

      if (upsertError) throw upsertError;

      await ensurePartnerSupportTicket(data.id, partnerName.trim(), businessName.trim());
      await ensurePartnerPayoutBatch(data.id, fee);

      router.push({ params: { partnerId: data.id }, pathname: "/partner-dashboard" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not continue to partner dashboard.";
      setError(message);
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
          { backgroundColor: isDark ? "rgba(192,57,43,0.18)" : "rgba(192,57,43,0.08)" },
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
            <Text style={[styles.phonetic, { color: theme.gold }]}>PARTNER ACCESS</Text>
            <Text style={[styles.tagline, { color: theme.text }]}>
              This partner login now creates or updates a real backend record before opening the live dashboard.
            </Text>
          </View>

          <View style={[styles.panel, { backgroundColor: theme.panel, borderColor: theme.panelBorder, shadowColor: theme.shadow }]}>
            <View style={styles.features}>
              {[
                "Create a real partner profile in Supabase",
                "Open a dashboard backed by live status, tickets, and payouts",
                "Keep partner progress synced with admin actions in realtime",
              ].map((feature, index) => (
                <View key={feature} style={[styles.feature, { backgroundColor: theme.featureBg, borderColor: theme.featureBorder }]}>
                  <Text style={[styles.featureIcon, { color: theme.red2 }]}>{String(index + 1).padStart(2, "0")}</Text>
                  <Text style={[styles.featureText, { color: theme.text }]}>{feature}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.noteCard, { backgroundColor: theme.amberBg, borderColor: theme.amberBorder }]}>
              <Text style={[styles.noteTitle, { color: theme.text }]}>Registration fee</Text>
              <Text style={[styles.noteText, { color: theme.text2 }]}>
                The current category maps to an onboarding fee of {formatCurrency(fee)}. This value is stored with the partner profile.
              </Text>
            </View>

            <View style={styles.form}>
              <Field label="Partner name" onChangeText={setPartnerName} placeholder="Your full name" theme={theme} value={partnerName} />
              <Field label="Business / venue name" onChangeText={setBusinessName} placeholder="Sea View Terrace, Kapoor Events..." theme={theme} value={businessName} />
              <Field keyboardType="number-pad" label="Mobile number" onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))} placeholder="10-digit number" theme={theme} value={phone} />
              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Field label="City" onChangeText={setCity} placeholder="Vizag" theme={theme} value={city} />
                </View>
                <View style={styles.rowItem}>
                  <Field label="Partner category" onChangeText={setCategory} placeholder="Venue / Decor / Photo" theme={theme} value={category} />
                </View>
              </View>

              {error ? <Text style={[styles.feedback, { color: theme.red }]}>{error}</Text> : null}

              <View style={styles.ctaStack}>
                <Pressable
                  disabled={!canSubmit || loading}
                  onPress={continueToDashboard}
                  style={[styles.primaryButton, { backgroundColor: theme.red2 }, (!canSubmit || loading) && styles.disabledButton]}
                >
                  <Text style={styles.primaryButtonText}>{loading ? "Saving partner..." : "Continue to dashboard"}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

async function ensurePartnerSupportTicket(partnerProfileId: string, partnerName: string, businessName: string) {
  const existing = await supabase
    .from("support_tickets")
    .select("id")
    .eq("partner_profile_id", partnerProfileId)
    .limit(1)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data?.id) return;

  const { error } = await supabase.from("support_tickets").insert({
    owner_name: "Onboarding desk",
    partner_profile_id: partnerProfileId,
    priority: "amber",
    status: "open",
    summary: `Initial onboarding created for ${partnerName} at ${businessName}.`,
  });

  if (error) throw error;
}

async function ensurePartnerPayoutBatch(partnerProfileId: string, amount: number) {
  const existing = await supabase
    .from("payout_batches")
    .select("id")
    .eq("partner_profile_id", partnerProfileId)
    .limit(1)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data?.id) return;

  const { error } = await supabase.from("payout_batches").insert({
    amount,
    partner_profile_id: partnerProfileId,
    release_eta: "Pending first approved booking",
    status: "held",
  });

  if (error) throw error;
}

function Field({
  keyboardType,
  label,
  onChangeText,
  placeholder,
  theme,
  value,
}: {
  keyboardType?: "default" | "number-pad";
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
        keyboardType={keyboardType}
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
  noteCard: { borderRadius: 18, borderWidth: 1, marginBottom: 18, padding: 16 },
  noteTitle: { fontSize: 14, fontWeight: "800", marginBottom: 6 },
  noteText: { fontSize: 13, lineHeight: 20 },
  form: { gap: 14 },
  fieldWrap: { gap: 8 },
  label: { fontSize: 10, fontWeight: "700", letterSpacing: 1.6, textTransform: "uppercase" },
  input: { borderRadius: 15, borderWidth: 1, fontSize: 16, height: 52, paddingHorizontal: 16 },
  row: { flexDirection: "row", gap: 12 },
  rowItem: { flex: 1 },
  primaryButton: { alignItems: "center", borderRadius: 16, height: 54, justifyContent: "center", marginTop: 4 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  disabledButton: { opacity: 0.58 },
  ctaStack: { gap: 10, marginTop: 6 },
  feedback: { fontSize: 12, fontWeight: "700", lineHeight: 18, textAlign: "center" },
});
