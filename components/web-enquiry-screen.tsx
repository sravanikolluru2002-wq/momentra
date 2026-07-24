import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { DARK } from "@/constants/experiences";
import { firebaseAuth } from "@/firebase/config";
import { createMomentraEnquiry, MomentraEnquiryPayload } from "@/lib/supabase/enquiries";
import { openWhatsApp, WhatsAppCategory } from "@/lib/whatsapp";

type SummaryItem = {
  label: string;
  value: string;
};

type WebEnquiryScreenProps = {
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  subtitle: string;
  summary?: SummaryItem[];
  title: string;
  trackingPayload?: MomentraEnquiryPayload;
  whatsappCategory?: WhatsAppCategory;
};

export function WebEnquiryScreen({
  primaryLabel = "Talk to Momentra",
  secondaryHref = "/explore",
  secondaryLabel = "Browse Experiences",
  subtitle,
  summary = [],
  title,
  trackingPayload,
  whatsappCategory = "general",
}: WebEnquiryScreenProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  async function handlePrimaryAction() {
    if (saving) return;

    setSaving(true);
    setSavedMessage("");

    try {
      await createMomentraEnquiry({
        enquiryType: trackingPayload?.enquiryType ?? whatsappCategory,
        source: trackingPayload?.source ?? "web_enquiry",
        summary: Object.fromEntries(summary.map((item) => [item.label, item.value])),
        ...trackingPayload,
      }, firebaseAuth.currentUser);
      setSavedMessage("Request saved. Opening WhatsApp for faster coordination.");
    } catch (error) {
      console.error("[Momentra enquiry] save failed", error);
      setSavedMessage("WhatsApp will open now. We could not save the request yet.");
    } finally {
      setSaving(false);
      openWhatsApp(whatsappCategory, "WEB ENQUIRY WHATSAPP ERROR");
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: DARK.bg }]}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.kicker}>
          <Text style={styles.kickerText}>MOMENTRA</Text>
        </View>
        <Text style={[styles.title, { color: DARK.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: DARK.text2 }]}>{subtitle}</Text>

        {summary.length ? (
          <View style={[styles.card, { backgroundColor: DARK.surface, borderColor: DARK.border }]}>
            {summary.map((item) => (
              <View key={item.label} style={styles.row}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={[styles.promise, { borderColor: DARK.border }]}>
          <Text style={styles.promiseTitle}>GUIDED PLANNING</Text>
          <Text style={[styles.promiseText, { color: DARK.text2 }]}>
            Momentra coordinates the experience end-to-end. Share your date, group size, budget, and preferences, and our team will help confirm availability before anything is finalized.
          </Text>
        </View>
        {savedMessage ? <Text style={styles.savedMessage}>{savedMessage}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: DARK.bg, borderTopColor: DARK.border }]}>
        <Pressable onPress={handlePrimaryAction} style={[styles.primary, { backgroundColor: DARK.red }]}>
          <Text style={styles.primaryText}>{saving ? "Saving request..." : primaryLabel}</Text>
        </Pressable>
        <Pressable onPress={() => router.push(secondaryHref as never)} style={[styles.secondary, { borderColor: DARK.border }]}>
          <Text style={[styles.secondaryText, { color: DARK.gold }]}>{secondaryLabel}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { alignItems: "center", flexGrow: 1, justifyContent: "center", padding: 22, paddingBottom: 174 },
  kicker: { borderColor: "rgba(201,151,90,0.24)", borderRadius: 999, borderWidth: 1, marginBottom: 14, paddingHorizontal: 14, paddingVertical: 7 },
  kickerText: { color: "#C9975A", fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  title: { fontSize: 30, fontWeight: "900", lineHeight: 36, marginBottom: 10, maxWidth: 560, textAlign: "center" },
  subtitle: { fontSize: 14, lineHeight: 22, marginBottom: 22, maxWidth: 620, textAlign: "center" },
  card: { borderRadius: 18, borderWidth: 1, marginBottom: 16, maxWidth: 620, overflow: "hidden", width: "100%" },
  row: { alignItems: "center", borderBottomColor: "rgba(201,151,90,0.14)", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: 14 },
  rowLabel: { color: "rgba(242,232,217,0.62)", flex: 1, fontSize: 12 },
  rowValue: { color: "#F2E8D9", flex: 1.4, fontSize: 12, fontWeight: "900", textAlign: "right" },
  promise: { backgroundColor: "rgba(201,151,90,0.06)", borderRadius: 16, borderWidth: 1, maxWidth: 620, padding: 16, width: "100%" },
  promiseTitle: { color: "rgba(242,232,217,0.36)", fontSize: 10, fontWeight: "900", letterSpacing: 2, marginBottom: 8 },
  promiseText: { fontSize: 12, lineHeight: 20 },
  savedMessage: { color: "#C9975A", fontSize: 12, fontWeight: "800", marginTop: 12, maxWidth: 620, textAlign: "center" },
  footer: { borderTopWidth: 1, bottom: 0, gap: 10, left: 0, padding: 18, position: "absolute", right: 0 },
  primary: { alignItems: "center", borderRadius: 16, padding: 16 },
  primaryText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  secondary: { alignItems: "center", borderRadius: 16, borderWidth: 1, padding: 15 },
  secondaryText: { fontSize: 14, fontWeight: "900" },
});
