import { useLocalSearchParams, useRouter } from "expo-router";
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";

import { DARK, LIGHT } from "@/constants/experiences";
import { findKittyPackage } from "@/constants/kitty";
import { useMomentraTheme } from "@/contexts/momentra-theme";
import { WebEnquiryScreen } from "@/components/web-enquiry-screen";

type GuestStatus = { name: string; phone: string; status: "paid" | "pending" | "declined" };

export default function KittyPaymentTrackerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingDate?: string;
    bookingTime?: string;
    guests?: string;
    invitedGuests?: string;
    minimumGuestThreshold?: string;
    organizerMessage?: string;
    organizerName?: string;
    packageId?: string;
    paymentDeadline?: string;
    paidGuestCount?: string;
    paidGuestName?: string;
    paidPaymentId?: string;
    splitBookingId?: string;
    splitStatus?: string;
    splitBooking?: string;
    venueId?: string;
  }>();
  const { isDark } = useMomentraTheme();
  const T = isDark ? DARK : LIGHT;
  const selectedPackage = findKittyPackage(params.packageId);
  const guests = parseGuestStatus(params.invitedGuests, params.paidGuestName);
  const paid = guests.filter((guest) => guest.status === "paid");
  const pending = guests.filter((guest) => guest.status === "pending");
  const declined = guests.filter((guest) => guest.status === "declined");
  const minimum = Number.parseInt(params.minimumGuestThreshold ?? "1", 10) || 1;
  const collected = paid.length * selectedPackage.perHead;
  const total = guests.length * selectedPackage.perHead;
  const progress = guests.length ? Math.round((paid.length / guests.length) * 100) : 0;
  const thresholdReached = params.splitStatus === "confirmed" || paid.length >= minimum;

  if (Platform.OS === "web") {
    return (
      <WebEnquiryScreen
        primaryLabel="Talk to Momentra"
        secondaryHref="/kitty"
        secondaryLabel="Back to Kitty Circle"
        subtitle="The live payment tracker is not public on web right now. Momentra can help coordinate confirmations, reminders, and availability directly."
        summary={[
          { label: "Package", value: selectedPackage.name },
          { label: "Date", value: params.bookingDate ?? "Preferred date" },
          { label: "Time", value: params.bookingTime ?? "Preferred time" },
          { label: "Invited", value: `${guests.length} guests` },
          { label: "Minimum", value: `${minimum} guests` },
        ]}
        title="Circle Coordination"
        whatsappCategory="kitty"
      />
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.header, { backgroundColor: T.card, borderBottomColor: T.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: T.text }]}>Circle Tracker</Text>
          <Text style={[styles.headerMeta, { color: T.text3 }]}>{params.organizerName || "Organizer"} · {params.bookingDate}</Text>
        </View>
        <View style={styles.progressRow}>
          <View style={[styles.progressCircle, { borderColor: T.gold }]}>
            <Text style={[styles.progressPct, { color: T.gold }]}>{paid.length}/{guests.length}</Text>
            <Text style={[styles.progressLbl, { color: T.text3 }]}>paid</Text>
          </View>
          <View style={styles.progressMeta}>
            <Stat color="#27ae60" label="Paid" value={`${paid.length} guests`} />
            <Stat color={T.gold} label="Pending" value={`${pending.length} guests`} />
            <Stat color={T.red} label="Declined" value={`${declined.length} guests`} />
            <Stat color={T.text3} label="Progress" value={`${progress}%`} />
            <Stat color={thresholdReached ? "#27ae60" : T.gold} label="Status" value={thresholdReached ? "Confirmed" : "Waiting"} />
            {params.paidPaymentId ? <Stat color="#27ae60" label="Last payment" value={params.paidPaymentId} /> : null}
          </View>
        </View>
        <View style={[styles.collectedBar, { borderColor: "rgba(39,174,96,0.2)" }]}>
          <View>
            <Text style={[styles.colLabel, { color: T.text2 }]}>Total collected so far</Text>
            <Text style={[styles.colSub, { color: T.text3 }]}>₹{(total - collected).toLocaleString("en-IN")} pending</Text>
          </View>
          <Text style={styles.colVal}>₹{collected.toLocaleString("en-IN")}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={[styles.remindAll, { borderColor: "rgba(37,211,102,0.22)" }]}>
          <Text style={styles.remindIcon}>📞</Text>
          <Text style={[styles.remindTitle, { color: T.text }]}>Remind all {pending.length} pending guests</Text>
          <Text style={styles.remindSend}>Send →</Text>
        </Pressable>

        <View style={[styles.threshold, { borderColor: T.border }]}>
          <Text style={styles.thresholdIcon}>🎯</Text>
          <Text style={[styles.thresholdText, { color: T.text2 }]}>
            {thresholdReached
              ? `Minimum pax reached. This Kitty booking is ready to be confirmed by Momentra.`
              : `${Math.max(minimum - paid.length, 0)} more payment${Math.max(minimum - paid.length, 0) === 1 ? "" : "s"} needed to reach your minimum threshold of ${minimum}. Full refunds apply if the threshold is not reached by ${params.paymentDeadline}.`}
          </Text>
        </View>

        <Section title={`Paid — ${paid.length} guests`}>
          {paid.map((guest) => <GuestRow key={guest.name} guest={guest} perHead={selectedPackage.perHead} />)}
        </Section>
        <Section title={`Pending — ${pending.length} guests`}>
          {pending.map((guest) => <GuestRow key={guest.name} guest={guest} perHead={selectedPackage.perHead} />)}
        </Section>
        {declined.length ? (
          <Section title={`Cannot make it — ${declined.length} guest`}>
            {declined.map((guest) => <GuestRow key={guest.name} guest={guest} perHead={selectedPackage.perHead} />)}
          </Section>
        ) : null}

        <View style={[styles.trust, { borderColor: T.border }]}>
          <Text style={[styles.trustTitle, { color: T.text }]}>Momentra-managed coordination</Text>
          <Text style={[styles.trustText, { color: T.text2 }]}>Secure payments, refund protection if minimum guests are not reached, and host support for reminders and collection tracking.</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: T.bg, borderTopColor: T.border }]}>
        <Pressable
          onPress={() => router.push({ pathname: "/kitty/guest-payment", params } as never)}
          style={[styles.cta, { backgroundColor: thresholdReached ? "#27ae60" : T.red }]}
        >
          <Text style={styles.ctaTxt}>{thresholdReached ? "Minimum Reached · Confirmed" : `Booking Confirms at ${minimum} Guests`}</Text>
          <Text style={styles.ctaSub}>{paid.length}/{minimum} paid →</Text>
        </Pressable>
      </View>
    </View>
  );
}

function parseGuestStatus(value?: string, paidGuestName?: string): GuestStatus[] {
  try {
    const parsed = value ? JSON.parse(value) as { name?: string; phone?: string }[] : [];
    const guests = parsed.length
      ? parsed
      : [{ name: "Priya Mehta", phone: "98765 43210" }];

    return guests.map((guest) => ({
      name: guest.name || "Guest",
      phone: guest.phone || "",
      status: paidGuestName && guest.name === paidGuestName ? "paid" : "pending",
    }));
  } catch {
    return [{ name: "Priya Mehta", phone: "98765 43210", status: "pending" }];
  }
}

function Stat({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function GuestRow({ guest, perHead }: { guest: GuestStatus; perHead: number }) {
  const color = guest.status === "paid" ? "#27ae60" : guest.status === "declined" ? "#C0392B" : "#C9975A";
  return (
    <View style={styles.guestRow}>
      <View style={[styles.avatar, { borderColor: color }]}><Text style={styles.avatarTxt}>{guest.name.charAt(0) || "G"}</Text></View>
      <View style={styles.guestInfo}>
        <Text style={styles.guestName}>{guest.name || "Guest"}</Text>
        <Text style={styles.guestSub}>{guest.status === "paid" ? "Paid securely" : guest.status === "declined" ? "Declined invite" : "Payment pending"}</Text>
      </View>
      <Text style={[styles.amount, { color }]}>{guest.status === "paid" ? `₹${perHead.toLocaleString("en-IN")}` : guest.status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: Platform.OS === "ios" ? 52 : 32 },
  header: { borderBottomWidth: 1, padding: 18 },
  headerTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  title: { fontSize: 22, fontWeight: "800" },
  headerMeta: { fontSize: 10 },
  progressRow: { alignItems: "center", flexDirection: "row", gap: 16 },
  progressCircle: { alignItems: "center", borderRadius: 36, borderWidth: 5, height: 72, justifyContent: "center", width: 72 },
  progressPct: { fontSize: 17, fontWeight: "900" },
  progressLbl: { fontSize: 8 },
  progressMeta: { flex: 1 },
  stat: { alignItems: "center", flexDirection: "row", gap: 8, marginBottom: 5 },
  statDot: { borderRadius: 4, height: 8, width: 8 },
  statLabel: { color: "rgba(242,232,217,0.5)", flex: 1, fontSize: 11 },
  statValue: { fontSize: 11, fontWeight: "800" },
  collectedBar: { alignItems: "center", backgroundColor: "rgba(39,174,96,0.07)", borderRadius: 11, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 12, padding: 12 },
  colLabel: { fontSize: 11 },
  colSub: { fontSize: 9, marginTop: 2 },
  colVal: { color: "#27ae60", fontSize: 20, fontWeight: "900" },
  content: { padding: 18, paddingBottom: 126 },
  remindAll: { alignItems: "center", backgroundColor: "rgba(37,211,102,0.07)", borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 14, padding: 12 },
  remindIcon: { fontSize: 17 },
  remindTitle: { flex: 1, fontSize: 12, fontWeight: "800" },
  remindSend: { color: "#25D366", fontSize: 11, fontWeight: "800" },
  threshold: { alignItems: "flex-start", backgroundColor: "rgba(201,151,90,0.06)", borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 14, padding: 12 },
  thresholdIcon: { fontSize: 18 },
  thresholdText: { flex: 1, fontSize: 11, lineHeight: 17 },
  section: { marginBottom: 14 },
  sectionTitle: { color: "rgba(242,232,217,0.36)", fontSize: 9, fontWeight: "800", letterSpacing: 2, marginBottom: 9, textTransform: "uppercase" },
  guestRow: { alignItems: "center", backgroundColor: "#1A0E08", borderColor: "rgba(201,151,90,0.16)", borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 12, marginBottom: 8, padding: 11 },
  avatar: { alignItems: "center", borderRadius: 19, borderWidth: 2, height: 38, justifyContent: "center", width: 38 },
  avatarTxt: { color: "#F2E8D9", fontSize: 15, fontWeight: "800" },
  guestInfo: { flex: 1 },
  guestName: { color: "#F2E8D9", fontSize: 13, fontWeight: "800" },
  guestSub: { color: "rgba(242,232,217,0.36)", fontSize: 10, marginTop: 2 },
  amount: { fontSize: 12, fontWeight: "900", textTransform: "capitalize" },
  trust: { backgroundColor: "rgba(201,151,90,0.06)", borderRadius: 12, borderWidth: 1, padding: 12 },
  trustTitle: { fontSize: 12, fontWeight: "800", marginBottom: 4 },
  trustText: { fontSize: 11, lineHeight: 17 },
  footer: { borderTopWidth: 1, bottom: 0, left: 0, padding: 18, paddingBottom: Platform.OS === "ios" ? 28 : 18, position: "absolute", right: 0 },
  cta: { alignItems: "center", borderRadius: 15, flexDirection: "row", justifyContent: "space-between", padding: 15 },
  ctaTxt: { color: "#fff", fontSize: 13, fontWeight: "800" },
  ctaSub: { color: "rgba(255,255,255,0.82)", fontSize: 12, fontWeight: "800" },
});
