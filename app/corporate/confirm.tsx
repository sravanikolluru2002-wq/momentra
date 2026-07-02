import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";

import { CORPORATE_REQUIREMENTS, corporateTotal, findCorporateEventType, findCorporateVenue } from "@/constants/corporate";
import { DARK, LIGHT } from "@/constants/experiences";
import { useMomentraTheme } from "@/contexts/momentra-theme";
import { openWhatsApp as openMomentraWhatsApp } from "@/lib/whatsapp";

export default function CorporateConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    billingAddress?: string;
    budget?: string;
    company?: string;
    contactName?: string;
    date?: string;
    email?: string;
    eventTypeId?: string;
    gstNumber?: string;
    guests?: string;
    notes?: string;
    phone?: string;
    requirements?: string;
    role?: string;
    time?: string;
    venueId?: string;
  }>();
  const { isDark } = useMomentraTheme();
  const T = isDark ? DARK : LIGHT;
  const eventType = findCorporateEventType(params.eventTypeId);
  const venue = findCorporateVenue(params.venueId);
  const guests = Number.parseInt(params.guests ?? "20", 10) || 20;
  const subtotal = venue.perHead * guests;
  const gst = Math.round(subtotal * 0.18);
  const total = corporateTotal(venue.perHead, guests);
  const requirementLabels = (params.requirements ?? "")
    .split(",")
    .filter(Boolean)
    .map((id) => CORPORATE_REQUIREMENTS.find((item) => item.id === id)?.label)
    .filter(Boolean);
  const request = [
    `Corporate event: ${eventType.label}`,
    `Company: ${params.company || "Not provided"}`,
    `Contact: ${params.contactName || "Not provided"}${params.role ? ` (${params.role})` : ""}`,
    `Budget/head: ${params.budget || "Not provided"}`,
    `Requirements: ${requirementLabels.join(", ") || "None"}`,
    `GST: ${params.gstNumber || "Not provided"}`,
    `Billing: ${params.billingAddress || "Not provided"}`,
    params.notes ? `Notes: ${params.notes}` : "",
  ].filter(Boolean).join("; ");

  function requestCorporatePlan() {
    openMomentraWhatsApp("corporate", "CORPORATE WEB WHATSAPP ERROR");
  }

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.header, { borderBottomColor: T.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: T.border }]}>
          <Text style={[styles.backTxt, { color: T.gold }]}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: T.text }]}>Confirm Booking</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.venueCard, { backgroundColor: T.card, borderColor: T.border }]}>
          <Image source={{ uri: venue.image }} style={styles.venueImage} />
          <View style={styles.venueInfo}>
            <Text style={[styles.venueName, { color: T.text }]}>{venue.name}</Text>
            <Text style={[styles.venueLoc, { color: T.text2 }]}>📍 {venue.location}</Text>
            <Text style={styles.eventChip}>💼 {eventType.label}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
          <Row label="Date" value={params.date ?? "Selected date"} />
          <Row label="Time" value={params.time ?? "Selected time"} />
          <Row label="Guests" value={`${guests} people`} />
          <Row label="Requirements" value={requirementLabels.join(", ") || "None"} />
        </View>

        <View style={[styles.gstCard, { borderColor: "rgba(39,174,96,0.2)" }]}>
          <Text style={styles.gstTitle}>🧾 GST Invoice Details</Text>
          <Row label="Company" value={params.company || "To be collected"} />
          <Row label="GST Number" value={params.gstNumber || "To be collected"} />
          <Row label="Billing Address" value={params.billingAddress || "To be collected"} />
          <Text style={styles.gstNote}>Invoice issued within 24 hours of event close.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
          <Row label={`₹${venue.perHead.toLocaleString("en-IN")} × ${guests} guests`} value={`₹${subtotal.toLocaleString("en-IN")}`} />
          <Row label="Projector / AV coordination" value="Included" />
          <Row label="Momentra coordinator" value="Included" />
          <Row label="GST estimate (18%)" value={`₹${gst.toLocaleString("en-IN")}`} />
          <View style={[styles.totalRow, { borderTopColor: T.border }]}>
            <Text style={[styles.totalLbl, { color: T.text }]}>Total incl. GST</Text>
            <Text style={[styles.totalVal, { color: T.red }]}>₹{total.toLocaleString("en-IN")}</Text>
          </View>
        </View>

        <View style={[styles.promise, { borderColor: T.border }]}>
          <Text style={[styles.promiseTitle, { color: T.text3 }]}>THE MOMENTRA PROMISE</Text>
          <Text style={[styles.promiseTxt, { color: T.text2 }]}>📸 Setup photo sent 2 hrs before · ✓ Availability confirmed · 🎯 Dedicated coordinator present · 🧾 GST invoice within 24 hrs</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: T.bg, borderTopColor: T.border }]}>
        <Pressable
          onPress={() => {
            if (Platform.OS === "web") {
              requestCorporatePlan();
              return;
            }

            router.push({
              pathname: "/booking-summary",
              params: {
                date: params.date ?? "",
                experienceId: "corporate-dinner",
                experienceTitle: `${eventType.label} · ${venue.name}`,
                guests: String(guests),
                price: String(total),
                request,
                time: params.time ?? "",
                venue: venue.location,
              },
            } as never);
          }}
          style={[styles.cta, { backgroundColor: T.red }]}
        >
          <Text style={styles.ctaTxt}>{Platform.OS === "web" ? "Request Formal Quote" : "Confirm & Pay"}</Text>
          <Text style={styles.ctaSub}>{Platform.OS === "web" ? "Talk to Momentra" : `₹${total.toLocaleString("en-IN")} →`}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: Platform.OS === "ios" ? 52 : 32 },
  header: { alignItems: "center", borderBottomWidth: 1, flexDirection: "row", gap: 12, padding: 16 },
  backBtn: { alignItems: "center", borderRadius: 17, borderWidth: 1, height: 34, justifyContent: "center", width: 34 },
  backTxt: { fontSize: 15, fontWeight: "800" },
  title: { flex: 1, fontSize: 20, fontWeight: "800", textAlign: "center" },
  content: { padding: 16, paddingBottom: 128 },
  venueCard: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 12, marginBottom: 12, padding: 12 },
  venueImage: { borderRadius: 10, height: 66, width: 66 },
  venueInfo: { flex: 1 },
  venueName: { fontSize: 16, fontWeight: "800" },
  venueLoc: { fontSize: 10, marginVertical: 4 },
  eventChip: { color: "#4BAFD6", fontSize: 10, fontWeight: "800" },
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  row: { alignItems: "center", borderBottomColor: "rgba(201,151,90,0.14)", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: 12 },
  rowLabel: { color: "rgba(242,232,217,0.62)", fontSize: 12 },
  rowValue: { color: "#F2E8D9", flex: 1, fontSize: 12, fontWeight: "800", textAlign: "right" },
  gstCard: { backgroundColor: "rgba(39,174,96,0.05)", borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  gstTitle: { color: "#27ae60", fontSize: 10, fontWeight: "800", letterSpacing: 1.6, padding: 12, textTransform: "uppercase" },
  gstNote: { color: "rgba(39,174,96,0.72)", fontSize: 10, padding: 12, paddingTop: 0 },
  totalRow: { alignItems: "center", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: 14 },
  totalLbl: { fontSize: 15, fontWeight: "900" },
  totalVal: { fontSize: 18, fontWeight: "900" },
  promise: { backgroundColor: "rgba(201,151,90,0.06)", borderRadius: 13, borderWidth: 1, padding: 13 },
  promiseTitle: { fontSize: 9.5, fontWeight: "800", letterSpacing: 2, marginBottom: 8 },
  promiseTxt: { fontSize: 11, lineHeight: 18 },
  footer: { borderTopWidth: 1, bottom: 0, left: 0, padding: 18, paddingBottom: Platform.OS === "ios" ? 28 : 18, position: "absolute", right: 0 },
  cta: { alignItems: "center", borderRadius: 15, flexDirection: "row", justifyContent: "space-between", padding: 15 },
  ctaTxt: { color: "#fff", fontSize: 14, fontWeight: "800" },
  ctaSub: { color: "rgba(255,255,255,0.82)", fontSize: 13, fontWeight: "800" },
});
