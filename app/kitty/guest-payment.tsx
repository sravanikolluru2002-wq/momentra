import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Image, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";

import { DARK, LIGHT } from "@/constants/experiences";
import { findKittyPackage, findKittyVenue } from "@/constants/kitty";
import { useMomentraTheme } from "@/contexts/momentra-theme";
import { startPayment } from "@/lib/razorpay";
import { supabase } from "@/lib/supabase";
import { WebEnquiryScreen } from "@/components/web-enquiry-screen";

export default function KittyGuestPaymentScreen() {
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
    paidGuestName?: string;
    splitBookingId?: string;
    splitBooking?: string;
    venueId?: string;
  }>();
  const { isDark } = useMomentraTheme();
  const [processing, setProcessing] = useState(false);
  const T = isDark ? DARK : LIGHT;
  const selectedPackage = findKittyPackage(params.packageId);
  const venue = findKittyVenue(params.venueId);
  const fullGuestName = getFullGuestName(params.invitedGuests);
  const guestName = fullGuestName.split(" ")[0] || "Priya";
  const minimum = Number.parseInt(params.minimumGuestThreshold ?? "1", 10) || 1;

  if (Platform.OS === "web") {
    return (
      <WebEnquiryScreen
        primaryLabel="Talk to Momentra"
        secondaryHref="/kitty"
        secondaryLabel="Back to Kitty Circle"
        subtitle="Guest share payment is not public on web yet. Use this page to contact Momentra and confirm the next step for your invite."
        summary={[
          { label: "Guest", value: fullGuestName },
          { label: "Venue", value: venue.name },
          { label: "Package", value: selectedPackage.name },
          { label: "Date", value: params.bookingDate ?? "Preferred date" },
          { label: "Time", value: params.bookingTime ?? "Preferred time" },
          { label: "Per-person plan", value: `₹${selectedPackage.perHead.toLocaleString("en-IN")}` },
        ]}
        title="Reserve Your Spot"
        whatsappCategory="kitty"
      />
    );
  }

  async function payShare() {
    if (processing) return;

    setProcessing(true);
    let payment;

    try {
      payment = await startPayment({
        amount: selectedPackage.perHead,
        customerName: fullGuestName,
        customerPhone: getGuestPhone(params.invitedGuests),
        description: `${selectedPackage.name} Kitty Circle share`,
      });
    } catch (error) {
      console.error("KITTY GUEST RAZORPAY ERROR:", JSON.stringify(error, null, 2));
      setProcessing(false);
      return;
    }
    let paidGuests = getPaidGuests(params.invitedGuests, fullGuestName);
    let paidGuestCount = paidGuests.filter((guest) => guest.status === "paid").length;
    let bookingStatus = paidGuestCount >= minimum ? "confirmed" : "pending_group_payment";

    if (params.splitBookingId) {
      const update = await updateSplitBookingPayment({
        bookingId: params.splitBookingId,
        fallbackGuests: paidGuests,
        paidGuestName: fullGuestName,
        paymentId: payment.payment_id,
        threshold: minimum,
      });
      paidGuests = update.invitedGuests;
      paidGuestCount = update.paidGuestCount;
      bookingStatus = update.bookingStatus;
    }

    router.replace({
      pathname: "/kitty/payment-tracker",
      params: {
        ...params,
        invitedGuests: JSON.stringify(paidGuests),
        paidGuestName: fullGuestName,
        paidGuestCount: String(paidGuestCount),
        paidPaymentId: payment.payment_id,
        splitStatus: bookingStatus,
      },
    } as never);
  }

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.headerLite}>
        <View style={styles.miniLogo}><Text style={styles.miniLogoTxt}>M</Text></View>
        <Text style={[styles.headerText, { color: T.text2 }]}>Momentra · Payment Request</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.inviteCard, { borderColor: T.border2 }]}>
          <LinearGradient colors={["#1C0A10", "#0D0905", "#141008"]} style={StyleSheet.absoluteFill} />
          <View style={styles.ornamentRow}>
            <View style={styles.ornLine} />
            <Text style={[styles.brand, { color: T.gold }]}>Momentra</Text>
            <View style={styles.ornLine} />
          </View>
          <Image source={{ uri: venue.image }} style={styles.inviteImage} />
          <LinearGradient colors={["transparent", "rgba(13,9,5,0.96)"]} style={styles.imageFade} />
          <View style={styles.inviteContent}>
            <Text style={[styles.inviteKicker, { color: T.gold }]}>YOU ARE INVITED</Text>
            <Text style={[styles.guestName, { color: T.text }]}>{guestName},</Text>
            <Text style={[styles.hosted, { color: T.text2 }]}>{params.organizerName || "Your host"} has reserved your spot</Text>
            <View style={[styles.detailBox, { borderColor: T.border }]}>
              <InviteRow icon="🌸" value={selectedPackage.name} />
              <InviteRow icon="📅" value={`${params.bookingDate} · ${params.bookingTime}`} />
              <InviteRow icon="📍" value={venue.location} />
              <InviteRow icon="👯" value={`${params.guests} women · minimum ${params.minimumGuestThreshold} to confirm`} />
            </View>
            <Text style={[styles.message, { borderLeftColor: T.gold, color: T.text2 }]}>“{params.organizerMessage}”</Text>
            <Text style={[styles.payLabel, { color: T.text3 }]}>Amount due</Text>
            <Text style={[styles.payAmount, { color: T.gold }]}>₹{selectedPackage.perHead.toLocaleString("en-IN")}</Text>
            <Text style={[styles.paySub, { color: T.text3 }]}>Secure payment · Refund guarantee if event is cancelled</Text>
          </View>
        </View>

        <View style={styles.trustChips}>
          <TrustChip text="Secure payment" />
          <TrustChip text="Full refund if minimum not met" />
          <TrustChip text="Momentra-managed coordination" />
        </View>

        <View style={[styles.guarantee, { borderColor: T.border }]}>
          <Text style={[styles.guaranteeTitle, { color: T.text }]}>Refund protection</Text>
          <Text style={[styles.guaranteeText, { color: T.text2 }]}>If the minimum guest threshold is not reached by {params.paymentDeadline}, every guest payment is refunded. No awkward collection follow-ups, no manual accounting.</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: T.bg, borderTopColor: T.border }]}>
        <Pressable
          onPress={payShare}
          style={[styles.cta, { backgroundColor: T.red }]}
        >
          <Text style={styles.ctaTxt}>{processing ? "Processing..." : "Pay My Share"}</Text>
          <Text style={styles.ctaSub}>₹{selectedPackage.perHead.toLocaleString("en-IN")} →</Text>
        </Pressable>
      </View>
    </View>
  );
}

async function updateSplitBookingPayment({
  bookingId,
  fallbackGuests,
  paidGuestName,
  paymentId,
  threshold,
}: {
  bookingId: string;
  fallbackGuests: { name: string; phone: string; status: "paid" | "pending" }[];
  paidGuestName: string;
  paymentId: string;
  threshold: number;
}) {
  let invitedGuests = fallbackGuests;
  const existing = await supabase
    .from("bookings")
    .select("invited_guests")
    .eq("id", bookingId)
    .maybeSingle();

  if (!existing.error && Array.isArray(existing.data?.invited_guests)) {
    invitedGuests = markGuestPaid(existing.data.invited_guests, paidGuestName);
  } else if (existing.error && !isOptionalSplitSchemaError(existing.error)) {
    console.warn("BOOKING SPLIT PAYMENT FETCH WARNING:", JSON.stringify(existing.error, null, 2));
  }

  const paidGuestCount = invitedGuests.filter((guest) => guest.status === "paid").length;
  const thresholdReached = paidGuestCount >= threshold;
  const bookingStatus = thresholdReached ? "confirmed" : "pending_group_payment";
  const safePayload = {
    payment_id: paymentId,
    payment_status: thresholdReached ? "paid" : "partial",
    status: bookingStatus,
  };
  const payload = {
    ...safePayload,
    invited_guests: invitedGuests,
    paid_guest_count: paidGuestCount,
  };
  let { error } = await supabase.from("bookings").update(payload).eq("id", bookingId);

  if (error && isOptionalSplitSchemaError(error)) {
    console.warn("BOOKING SPLIT PAYMENT OPTIONAL COLUMNS SKIPPED:", JSON.stringify(error, null, 2));
    const retry = await supabase.from("bookings").update(safePayload).eq("id", bookingId);
    error = retry.error;
  }

  if (error) {
    console.error("BOOKING SPLIT PAYMENT UPDATE ERROR:", JSON.stringify(error, null, 2));
  }

  return {
    bookingStatus,
    invitedGuests,
    paidGuestCount,
  };
}

function getPaidGuests(value: string | undefined, paidGuestName: string) {
  try {
    const guests = value ? JSON.parse(value) as { name?: string; phone?: string; status?: string }[] : [];
    return markGuestPaid(guests, paidGuestName);
  } catch {
    return [{ name: paidGuestName, phone: "", status: "paid" as const }];
  }
}

function markGuestPaid(guests: { name?: string; phone?: string; status?: string }[], paidGuestName: string) {
  return guests.map((guest) => ({
    name: guest.name || "Guest",
    phone: guest.phone || "",
    status: guest.name === paidGuestName || guest.status === "paid" ? "paid" as const : "pending" as const,
  }));
}

function getGuestPhone(value?: string) {
  try {
    const guests = value ? JSON.parse(value) as { phone?: string }[] : [];
    return guests[0]?.phone || "";
  } catch {
    return "";
  }
}

function isOptionalSplitSchemaError(error: unknown) {
  const message = JSON.stringify(error);
  return [
    "invited_guests",
    "paid_guest_count",
    "schema cache",
  ].some((field) => message.includes(field));
}

function getFullGuestName(value?: string) {
  try {
    const guests = value ? JSON.parse(value) as { name?: string }[] : [];
    return guests[0]?.name || "Priya Mehta";
  } catch {
    return "Priya Mehta";
  }
}

function InviteRow({ icon, value }: { icon: string; value: string }) {
  return (
    <View style={styles.inviteRow}>
      <Text style={styles.inviteIcon}>{icon}</Text>
      <Text style={styles.inviteValue}>{value}</Text>
    </View>
  );
}

function TrustChip({ text }: { text: string }) {
  return (
    <View style={styles.trustChip}>
      <Text style={styles.trustChipText}>✓ {text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: Platform.OS === "ios" ? 52 : 32 },
  headerLite: { alignItems: "center", flexDirection: "row", gap: 8, paddingHorizontal: 18, paddingTop: 10 },
  miniLogo: { alignItems: "center", backgroundColor: "rgba(192,57,43,0.15)", borderColor: "rgba(192,57,43,0.25)", borderRadius: 12, borderWidth: 1, height: 24, justifyContent: "center", width: 24 },
  miniLogoTxt: { color: "#F2E8D9", fontSize: 11, fontWeight: "800" },
  headerText: { fontSize: 11 },
  content: { padding: 18, paddingBottom: 128 },
  inviteCard: { borderRadius: 20, borderWidth: 1, overflow: "hidden", position: "relative" },
  ornamentRow: { alignItems: "center", flexDirection: "row", gap: 10, padding: 18, paddingBottom: 10 },
  ornLine: { backgroundColor: "rgba(201,151,90,0.26)", flex: 1, height: 1 },
  brand: { fontSize: 12, fontStyle: "italic", letterSpacing: 1.2 },
  inviteImage: { height: 124, opacity: 0.46, width: "100%" },
  imageFade: { bottom: 0, height: 160, left: 0, position: "absolute", right: 0, top: 84 },
  inviteContent: { padding: 20, paddingTop: 12 },
  inviteKicker: { fontSize: 9.5, fontWeight: "800", letterSpacing: 2.4, marginBottom: 6, textAlign: "center" },
  guestName: { fontSize: 28, fontStyle: "italic", fontWeight: "300", textAlign: "center" },
  hosted: { fontSize: 11, marginBottom: 14, marginTop: 4, textAlign: "center" },
  detailBox: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 13, borderWidth: 1, marginBottom: 14, padding: 12 },
  inviteRow: { alignItems: "center", flexDirection: "row", gap: 9, paddingVertical: 5 },
  inviteIcon: { fontSize: 14, width: 24 },
  inviteValue: { color: "#F2E8D9", flex: 1, fontSize: 12, fontWeight: "700" },
  message: { backgroundColor: "rgba(255,255,255,0.04)", borderLeftWidth: 2, borderRadius: 10, fontSize: 11, fontStyle: "italic", lineHeight: 17, marginBottom: 14, padding: 10 },
  payLabel: { fontSize: 10, letterSpacing: 1, textAlign: "center" },
  payAmount: { fontSize: 38, fontWeight: "300", textAlign: "center" },
  paySub: { fontSize: 10, textAlign: "center" },
  trustChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  trustChip: { backgroundColor: "rgba(201,151,90,0.08)", borderColor: "rgba(201,151,90,0.18)", borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  trustChipText: { color: "#C9975A", fontSize: 10, fontWeight: "700" },
  guarantee: { backgroundColor: "rgba(201,151,90,0.06)", borderRadius: 12, borderWidth: 1, marginTop: 14, padding: 13 },
  guaranteeTitle: { fontSize: 13, fontWeight: "800", marginBottom: 5 },
  guaranteeText: { fontSize: 11.5, lineHeight: 18 },
  footer: { borderTopWidth: 1, bottom: 0, left: 0, padding: 18, paddingBottom: Platform.OS === "ios" ? 28 : 18, position: "absolute", right: 0 },
  cta: { alignItems: "center", borderRadius: 15, flexDirection: "row", justifyContent: "space-between", padding: 15 },
  ctaTxt: { color: "#fff", fontSize: 13, fontWeight: "800" },
  ctaSub: { color: "rgba(255,255,255,0.82)", fontSize: 12, fontWeight: "800" },
});
