import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Image, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";

import { DARK, LIGHT } from "@/constants/experiences";
import { findKittyPackage, findKittyVenue, kittyTotal } from "@/constants/kitty";
import { useMomentraTheme } from "@/contexts/momentra-theme";
import { supabase } from "@/lib/supabase";
import { WebEnquiryScreen } from "@/components/web-enquiry-screen";
import { firebaseAuth } from "@/firebase/config";

export default function KittyInvitePreviewScreen() {
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
    splitBooking?: string;
    venueId?: string;
  }>();
  const { isDark } = useMomentraTheme();
  const [creatingBooking, setCreatingBooking] = useState(false);
  const T = isDark ? DARK : LIGHT;
  const selectedPackage = findKittyPackage(params.packageId);
  const venue = findKittyVenue(params.venueId);
  const organizerName = params.organizerName || "Sunitha";
  const guestName = getFirstGuestName(params.invitedGuests);
  const guestCount = Number.parseInt(params.guests ?? "8", 10) || 8;
  const minimum = Number.parseInt(params.minimumGuestThreshold ?? "1", 10) || 1;
  const total = kittyTotal(selectedPackage.perHead, guestCount);

  if (Platform.OS === "web") {
    return (
      <WebEnquiryScreen
        primaryLabel="Talk to Momentra"
        secondaryHref="/kitty"
        secondaryLabel="Back to Kitty Circle"
        subtitle="Guest invite and payment collection tools are being kept private on web for now. Momentra can still help you coordinate invites, availability, and group readiness."
        summary={[
          { label: "Venue", value: venue.name },
          { label: "Package", value: selectedPackage.name },
          { label: "Date", value: params.bookingDate ?? "Preferred date" },
          { label: "Time", value: params.bookingTime ?? "Preferred time" },
          { label: "Guests", value: `${guestCount} guests` },
          { label: "Minimum", value: `${minimum} guests` },
        ]}
        title="Coordinate Your Circle"
        whatsappCategory="kitty"
      />
    );
  }

  async function createPendingSplitBooking() {
    if (creatingBooking) return;

    setCreatingBooking(true);

    const userPhone = firebaseAuth.currentUser?.phoneNumber ?? "unknown";
    const basePayload: Record<string, unknown> = {
      addons: `Kitty split payment; Package: ${selectedPackage.name}; Per head: ₹${selectedPackage.perHead.toLocaleString("en-IN")}; Minimum guests: ${minimum}`,
      booking_date: params.bookingDate ?? "",
      booking_time: params.bookingTime ?? "",
      experience_id: "kitty-brunch",
      experience_title: `${selectedPackage.name} Kitty Circle`,
      guests: guestCount,
      payment_id: "split_group_pending",
      payment_status: "pending",
      status: "pending_group_payment",
      total_amount: total,
      user_phone: userPhone,
      venue: venue.location,
    };
    const payload: Record<string, unknown> = {
      ...basePayload,
      split_booking: true,
    };
    const invitedGuests = parseJsonParam(params.invitedGuests);

    if (minimum > 0) {
      payload.minimum_guest_threshold = minimum;
    }

    if (organizerName.trim()) {
      payload.organizer_name = organizerName.trim();
    }

    if (params.paymentDeadline?.trim()) {
      payload.payment_deadline = params.paymentDeadline.trim();
    }

    if (invitedGuests !== undefined) {
      payload.invited_guests = invitedGuests;
    }

    let { data, error } = await supabase.from("bookings").insert(payload).select("id").single();

    if (error && isOptionalSplitSchemaError(error)) {
      console.warn("BOOKING SPLIT OPTIONAL COLUMNS SKIPPED:", JSON.stringify(error, null, 2));
      const retry = await supabase.from("bookings").insert(basePayload).select("id").single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("BOOKING SAVE ERROR FULL:", JSON.stringify(error, null, 2));
      setCreatingBooking(false);
      return;
    }

    router.replace({
      pathname: "/kitty/payment-tracker",
      params: {
        ...params,
        splitBookingId: data?.id ? String(data.id) : "",
      },
    } as never);
  }

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.header, { borderBottomColor: T.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: T.border }]}>
          <Text style={[styles.backTxt, { color: T.gold }]}>←</Text>
        </Pressable>
        <View>
          <Text style={[styles.title, { color: T.text }]}>Invitation Preview</Text>
          <Text style={[styles.sub, { color: T.text3 }]}>This is what each guest receives</Text>
        </View>
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
            <Text style={[styles.hosted, { color: T.text2 }]}>{organizerName} has reserved your spot at</Text>
            <View style={[styles.detailBox, { borderColor: T.border }]}>
              <InviteRow icon="🌸" value={selectedPackage.name} />
              <InviteRow icon="📅" value={`${params.bookingDate} · ${params.bookingTime}`} />
              <InviteRow icon="📍" value={venue.location} />
              <InviteRow icon="👯" value={`${guestCount} women invited`} />
            </View>
            <Text style={[styles.message, { borderLeftColor: T.gold, color: T.text2 }]}>“{params.organizerMessage}”</Text>
            <Text style={[styles.payLabel, { color: T.text3 }]}>Your share</Text>
            <Text style={[styles.payAmount, { color: T.gold }]}>₹{selectedPackage.perHead.toLocaleString("en-IN")}</Text>
            <Text style={[styles.paySub, { color: T.text3 }]}>Secure payment via Momentra · Refundable if threshold is not met</Text>
            <Pressable
              onPress={() => router.push({ pathname: "/kitty/guest-payment", params } as never)}
              style={[styles.innerPayBtn, { backgroundColor: T.red }]}
            >
              <Text style={styles.innerPayTxt}>Pay & Confirm Spot →</Text>
            </Pressable>
            <Text style={[styles.deadline, { color: T.gold }]}>Deadline: {params.paymentDeadline} · Minimum {params.minimumGuestThreshold} guests</Text>
          </View>
        </View>

        <View style={[styles.whatsapp, { backgroundColor: T.card, borderColor: T.border }]}>
          <View style={styles.whatsappHead}>
            <View style={styles.whatsappIcon}><Text>📞</Text></View>
            <Text style={[styles.whatsappTitle, { color: T.text }]}>WhatsApp preview</Text>
          </View>
          <Text style={[styles.whatsappBubble, { color: T.text2 }]}>
            Hi {guestName}! {organizerName} has invited you to a Kitty Circle celebration on Momentra. Your share is ₹{selectedPackage.perHead.toLocaleString("en-IN")}. Pay and confirm your spot securely. Full refund if the minimum group is not reached.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: T.bg, borderTopColor: T.border }]}>
        <Pressable
          onPress={createPendingSplitBooking}
          style={[styles.cta, { backgroundColor: T.red }]}
        >
          <Text style={styles.ctaTxt}>{creatingBooking ? "Creating tracker..." : "Send Invitations Now"}</Text>
          <Text style={styles.ctaSub}>{guestCount} guests via WhatsApp →</Text>
        </Pressable>
      </View>
    </View>
  );
}

function parseJsonParam(value?: string) {
  if (!value) return undefined;

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("BOOKING SPLIT JSON SKIPPED:", JSON.stringify(error, null, 2));
    return undefined;
  }
}

function isOptionalSplitSchemaError(error: unknown) {
  const message = JSON.stringify(error);
  return [
    "invited_guests",
    "split_booking",
    "organizer_name",
    "minimum_guest_threshold",
    "payment_deadline",
    "schema cache",
  ].some((field) => message.includes(field));
}

function getFirstGuestName(value?: string) {
  try {
    const guests = value ? JSON.parse(value) as { name?: string }[] : [];
    return guests[0]?.name?.split(" ")[0] || "Priya";
  } catch {
    return "Priya";
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

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: Platform.OS === "ios" ? 52 : 32 },
  header: { alignItems: "center", borderBottomWidth: 1, flexDirection: "row", gap: 12, padding: 16 },
  backBtn: { alignItems: "center", borderRadius: 17, borderWidth: 1, height: 34, justifyContent: "center", width: 34 },
  backTxt: { fontSize: 15, fontWeight: "800" },
  title: { fontSize: 20, fontWeight: "800" },
  sub: { fontSize: 11, marginTop: 2 },
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
  paySub: { fontSize: 10, marginBottom: 12, textAlign: "center" },
  innerPayBtn: { alignItems: "center", borderRadius: 13, padding: 14 },
  innerPayTxt: { color: "#fff", fontSize: 13, fontWeight: "800" },
  deadline: { fontSize: 11, marginTop: 10, textAlign: "center" },
  whatsapp: { borderRadius: 15, borderWidth: 1, marginTop: 14, padding: 14 },
  whatsappHead: { alignItems: "center", flexDirection: "row", gap: 8, marginBottom: 10 },
  whatsappIcon: { alignItems: "center", backgroundColor: "rgba(37,211,102,0.16)", borderRadius: 16, height: 32, justifyContent: "center", width: 32 },
  whatsappTitle: { fontSize: 12, fontWeight: "800" },
  whatsappBubble: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, fontSize: 11, lineHeight: 18, padding: 12 },
  footer: { borderTopWidth: 1, bottom: 0, left: 0, padding: 18, paddingBottom: Platform.OS === "ios" ? 28 : 18, position: "absolute", right: 0 },
  cta: { alignItems: "center", borderRadius: 15, flexDirection: "row", justifyContent: "space-between", padding: 15 },
  ctaTxt: { color: "#fff", fontSize: 14, fontWeight: "800" },
  ctaSub: { color: "rgba(255,255,255,0.82)", fontSize: 12, fontWeight: "800" },
});
