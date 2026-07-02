import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { DARK, formatINR } from "@/constants/experiences";
import { WebEnquiryScreen } from "@/components/web-enquiry-screen";

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId?: string;
    date?: string;
    experienceTitle?: string;
    guests?: string;
    status?: string;
    time?: string;
    total?: string;
    venue?: string;
  }>();
  const total = Number.parseFloat(params.total ?? "") || 0;

  if (Platform.OS === "web") {
    return (
      <WebEnquiryScreen
        primaryLabel="Talk to Momentra"
        subtitle="Your web enquiry details are ready to share. Momentra will help verify availability, refine the plan, and coordinate the experience end-to-end."
        summary={[
          { label: "Experience", value: params.experienceTitle ?? "Momentra Experience" },
          { label: "Venue", value: params.venue ?? "Momentra Venue" },
          { label: "Date", value: params.date ?? "-" },
          { label: "Time", value: params.time ?? "-" },
          { label: "Guests", value: `${params.guests ?? "1"} People` },
          { label: "Estimated Plan", value: formatINR(total) },
        ]}
        title="Request Shared"
        whatsappCategory="general"
      />
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: DARK.bg }]}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={[styles.successCircle, { borderColor: DARK.border }]}>
          <Text style={styles.successIcon}>✓</Text>
        </View>

        <Text style={[styles.title, { color: DARK.text }]}>Booking Confirmed</Text>
        <Text style={[styles.subtitle, { color: DARK.text2 }]}>
          Your Momentra experience is reserved.
        </Text>

        <View style={[styles.card, { backgroundColor: DARK.surface, borderColor: DARK.border }]}>
          <SummaryRow label="Booking ID" value={`#${params.bookingId ?? "MN-BOOKED"}`} />
          <SummaryRow label="Experience" value={params.experienceTitle ?? "Momentra Experience"} />
          <SummaryRow label="Venue" value={params.venue ?? "Momentra Venue"} />
          <SummaryRow label="Date" value={params.date ?? "-"} />
          <SummaryRow label="Time" value={params.time ?? "-"} />
          <SummaryRow label="Guests" value={`${params.guests ?? "1"} People`} />
          <SummaryRow label="Total Amount" value={formatINR(total)} />
          <SummaryRow label="Status" value={params.status ?? "confirmed"} accent />
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: DARK.bg, borderTopColor: DARK.border }]}>
        <Pressable onPress={() => router.replace("/moments" as never)} style={[styles.primaryBtn, { backgroundColor: DARK.red }]}>
          <Text style={styles.primaryTxt}>View My Bookings</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/home" as never)} style={[styles.secondaryBtn, { borderColor: DARK.border }]}>
          <Text style={[styles.secondaryTxt, { color: DARK.gold }]}>Back to Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value, accent }: { accent?: boolean; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, accent && { color: DARK.gold, textTransform: "capitalize" }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { alignItems: "center", flexGrow: 1, justifyContent: "center", padding: 20, paddingBottom: 178 },
  successCircle: { alignItems: "center", borderRadius: 46, borderWidth: 1, height: 92, justifyContent: "center", marginBottom: 22, width: 92 },
  successIcon: { color: "#C9975A", fontSize: 46, fontWeight: "900" },
  title: { fontSize: 28, fontWeight: "900", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 13, lineHeight: 20, marginBottom: 22, textAlign: "center" },
  card: { borderRadius: 18, borderWidth: 1, overflow: "hidden", width: "100%" },
  row: { alignItems: "center", borderBottomColor: "rgba(201,151,90,0.14)", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: 14 },
  rowLabel: { color: "rgba(242,232,217,0.62)", flex: 1, fontSize: 12 },
  rowValue: { color: "#F2E8D9", flex: 1.2, fontSize: 12, fontWeight: "900", textAlign: "right" },
  footer: { borderTopWidth: 1, bottom: 0, gap: 10, left: 0, padding: 16, paddingBottom: 24, position: "absolute", right: 0 },
  primaryBtn: { alignItems: "center", borderRadius: 15, padding: 16 },
  primaryTxt: { color: "#fff", fontSize: 14, fontWeight: "900" },
  secondaryBtn: { alignItems: "center", borderRadius: 15, borderWidth: 1, padding: 15 },
  secondaryTxt: { fontSize: 14, fontWeight: "900" },
});
