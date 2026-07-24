import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { DARK, formatINR, getExperience } from "@/constants/experiences";
import { startPayment } from "@/lib/razorpay";
import { supabase } from "@/lib/supabase";
import { WebEnquiryScreen } from "@/components/web-enquiry-screen";
import { whatsappCategoryFromOccasion } from "@/lib/whatsapp";
import { firebaseAuth } from "@/firebase/config";
import { createMomentraBooking } from "@/lib/supabase/bookings";
import { createPaymentOrder } from "@/lib/supabase/payments";

const KITTY_PARTY_IMAGE = require("../assets/kitty-party.png");

function parseJsonParam(value?: string) {
  if (!value) return undefined;

  try {
    return JSON.parse(value);
  } catch (error) {
    console.error("BOOKING SPLIT JSON PARSE ERROR:", JSON.stringify(error, null, 2));
    return undefined;
  }
}

function isSplitBookingSchemaError(error: unknown) {
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

export default function BookingSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    experienceId?: string;
    addOns?: string;
    capacity?: string;
    date?: string;
    experienceTitle?: string;
    guests?: string;
    invitedGuests?: string;
    minimumGuestThreshold?: string;
    organizerName?: string;
    paymentDeadline?: string;
    price?: string;
    request?: string;
    splitBooking?: string;
    time?: string;
    venue?: string;
  }>();
  const theme = DARK;
  const [saving, setSaving] = useState(false);
  const experience = getExperience(params.experienceId);
  const selectedAddOns = useMemo(() => {
    const selected = params.addOns ? params.addOns.split(",").filter(Boolean) : [];
    return experience.addOns.filter((addOn) => selected.includes(addOn.id));
  }, [experience.addOns, params.addOns]);
  const addOnTotal = selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
  const experiencePrice = Number.parseFloat(params.price ?? "") || experience.price;
  const total = experiencePrice + addOnTotal;
  const date = params.date ?? "12 May 2026";
  const time = params.time ?? "8:00 PM";
  const guests = Number.parseInt(params.guests ?? "", 10) || experience.capacity;
  const experienceTitle = params.experienceTitle ?? experience.title;
  const venue = params.venue ?? experience.venue;
  const request = params.request ?? "";

  if (Platform.OS === "web") {
    return (
      <WebEnquiryScreen
        primaryLabel="Request Availability"
        subtitle="This web experience is set up for guided discovery right now. Send your preferred date, time, guest count, and any special requests, and Momentra will help you shape the plan."
        summary={[
          { label: "Experience", value: experienceTitle },
          { label: "Venue", value: venue },
          { label: "Date", value: date },
          { label: "Time", value: time },
          { label: "Guests", value: `${guests} People` },
          { label: "Estimated Plan", value: formatINR(total) },
        ]}
        title="Plan This Experience"
        trackingPayload={{
          addOns: selectedAddOns.map((addOn) => addOn.name),
          bookingDate: date,
          bookingTime: time,
          enquiryType: "experience_booking_request",
          estimatedTotal: total,
          experienceId: experience.id,
          experienceTitle,
          guests,
          notes: request,
          occasionId: experience.occasionId,
          source: "booking_summary_web",
          venue,
        }}
        whatsappCategory={whatsappCategoryFromOccasion(experience.occasionId)}
      />
    );
  }

  async function confirmBooking() {
    if (saving) return;

    setSaving(true);
    const userPhone = firebaseAuth.currentUser?.phoneNumber ?? "unknown";
    const addons = [
      ...selectedAddOns.map((addOn) => addOn.name),
      ...(request ? [`Request: ${request}`] : []),
    ].join(", ");
    const isSplitBooking = params.splitBooking === "true";
    const payment = isSplitBooking
      ? { payment_id: "split_group_pending", payment_status: "pending" }
      : await startPayment({
          amount: total,
          customerPhone: userPhone,
          description: experienceTitle,
        });
    const basePayload: Record<string, unknown> = {
      addons,
      booking_date: date,
      booking_time: time,
      experience_id: experience.id,
      experience_title: experienceTitle,
      guests,
      payment_id: payment.payment_id,
      payment_status: payment.payment_status,
      status: isSplitBooking ? "pending_group_payment" : "confirmed",
      total_amount: total,
      user_phone: userPhone,
      venue,
    };
    const payload: Record<string, unknown> = { ...basePayload };

    if (isSplitBooking) {
      const minimumGuestThreshold = Number.parseInt(params.minimumGuestThreshold ?? "", 10);
      const invitedGuests = parseJsonParam(params.invitedGuests);

      payload.split_booking = true;

      if (params.organizerName?.trim()) {
        payload.organizer_name = params.organizerName.trim();
      }

      if (Number.isFinite(minimumGuestThreshold) && minimumGuestThreshold > 0) {
        payload.minimum_guest_threshold = minimumGuestThreshold;
      }

      if (params.paymentDeadline?.trim()) {
        payload.payment_deadline = params.paymentDeadline.trim();
      }

      if (invitedGuests !== undefined) {
        payload.invited_guests = invitedGuests;
      }

    }

    let { error } = await supabase.from("bookings").insert(payload);

    if (error && isSplitBooking && isSplitBookingSchemaError(error)) {
      console.error("BOOKING SPLIT SCHEMA ERROR:", JSON.stringify(error, null, 2));
      const retry = await supabase.from("bookings").insert(basePayload);
      error = retry.error;
    }

    if (error) {
      console.error("BOOKING SAVE ERROR FULL:", JSON.stringify(error, null, 2));
      setSaving(false);
      return;
    }

    try {
      const newBooking = await createMomentraBooking({
        bookingDate: date,
        bookingTime: time,
        city: experience.city ?? "Vizag",
        estimatedTotal: total,
        guests,
        metadata: {
          legacyStatus: isSplitBooking ? "pending_group_payment" : "confirmed",
          request,
          source: "booking_summary",
        },
        packageId: undefined,
        selectedAddons: selectedAddOns.map((addOn) => addOn.name),
        selectedRequirements: experience.requirements ?? [],
        status: isSplitBooking ? "pending_payment" : "confirmed",
        title: experienceTitle,
      }, firebaseAuth.currentUser);

      await createPaymentOrder({
        amount: total,
        bookingId: newBooking.id,
        metadata: {
          legacyPaymentId: payment.payment_id,
          legacyPaymentStatus: payment.payment_status,
          splitBooking: isSplitBooking,
        },
        provider: isSplitBooking ? "manual" : "razorpay",
        providerOrderId: payment.payment_id,
        status: payment.payment_status === "paid" ? "paid" : "created",
      }, firebaseAuth.currentUser);
    } catch (backendError) {
      console.error("MOMENTRA OPERATIONAL BOOKING SAVE ERROR:", JSON.stringify(backendError, null, 2));
    }

    router.replace({
      pathname: "/booking-confirmation",
      params: {
        bookingId: `MN-${Date.now().toString().slice(-6)}`,
        date,
        experienceTitle,
        guests: String(guests),
        paymentId: payment.payment_id,
        paymentStatus: payment.payment_status,
        status: isSplitBooking ? "pending_group_payment" : "confirmed",
        time,
        total: String(total),
        venue,
      },
    } as never);
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.backText, { color: theme.gold }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Booking Summary</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View style={[styles.expCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Image
            source={getExperienceImage(experience.id, experience.image)}
            style={styles.expImage}
          />
          <View style={styles.expInfo}>
            <Text style={[styles.expTitle, { color: theme.text }]}>{experienceTitle}</Text>
            <Text style={[styles.expVenue, { color: theme.text2 }]}>{venue}</Text>
            <Text style={[styles.expPrice, { color: theme.gold }]}>{formatINR(experiencePrice)}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SummaryRow label="Date" value={date} icon="📅" />
          <SummaryRow label="Time" value={time} icon="⏰" />
          <SummaryRow label="Guests" value={`${guests} People`} icon="👥" />
        </View>

        {selectedAddOns.length ? (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardHeading, { color: theme.text }]}>Add-ons</Text>
            {selectedAddOns.map((addOn) => (
              <SummaryRow
                key={addOn.id}
                label={addOn.name}
                value={formatINR(addOn.price)}
                icon={addOn.icon}
              />
            ))}
          </View>
        ) : null}

        {request ? (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardHeading, { color: theme.text }]}>Special Request</Text>
            <Text style={[styles.requestText, { color: theme.text2 }]}>{request}</Text>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SummaryRow label="Experience Price" value={formatINR(experiencePrice)} />
          {addOnTotal ? <SummaryRow label="Add-ons" value={formatINR(addOnTotal)} /> : null}
          <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Total Amount</Text>
            <Text style={[styles.totalValue, { color: theme.red }]}>{formatINR(total)}</Text>
          </View>
        </View>

        <View style={[styles.note, { borderColor: theme.border }]}>
          <Text style={styles.noteIcon}>🔒</Text>
          <View>
            <Text style={[styles.noteTitle, { color: theme.text }]}>Secure Checkout</Text>
            <Text style={[styles.noteSub, { color: theme.text2 }]}>
              Your booking details will be saved securely.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
        <Pressable
          onPress={confirmBooking}
          style={[styles.cta, { backgroundColor: theme.red }]}
        >
          <Text style={styles.ctaText}>{saving ? "Processing..." : "Pay Now"}</Text>
          <Text style={styles.ctaPrice}>{formatINR(total)}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        {icon ? <Text>{icon}</Text> : null}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function getExperienceImage(id: string, image: string): ImageSourcePropType {
  return id === "kitty-brunch" ? KITTY_PARTY_IMAGE : { uri: image };
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { alignItems: "center", borderBottomWidth: 1, flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  back: { alignItems: "center", borderRadius: 18, borderWidth: 1, height: 36, justifyContent: "center", width: 36 },
  backText: { fontSize: 26, lineHeight: 28 },
  title: { flex: 1, fontSize: 21, fontWeight: "700", textAlign: "center" },
  headerSpacer: { width: 36 },
  body: { flexGrow: 1, padding: 14, paddingBottom: 164 },
  expCard: { alignItems: "center", borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 12, marginBottom: 12, padding: 12 },
  expImage: { borderRadius: 11, height: 72, width: 72 },
  expInfo: { flex: 1 },
  expTitle: { fontSize: 15, fontWeight: "800" },
  expVenue: { fontSize: 10, marginVertical: 4 },
  expPrice: { fontSize: 15, fontWeight: "800" },
  card: { borderRadius: 15, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  cardHeading: { fontSize: 16, fontWeight: "800", padding: 14, paddingBottom: 4 },
  row: { alignItems: "center", borderBottomColor: "rgba(201,151,90,0.14)", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: 14 },
  rowLeft: { alignItems: "center", flexDirection: "row", gap: 9 },
  rowLabel: { color: "rgba(242,232,217,0.62)", fontSize: 12 },
  rowValue: { color: "#F2E8D9", fontSize: 12, fontWeight: "800", maxWidth: "55%", textAlign: "right" },
  requestText: { fontSize: 12, lineHeight: 18, padding: 14, paddingTop: 4 },
  totalRow: { alignItems: "center", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: 14 },
  totalLabel: { fontSize: 15, fontWeight: "900" },
  totalValue: { fontSize: 18, fontWeight: "900" },
  note: { alignItems: "center", backgroundColor: "rgba(201,151,90,0.05)", borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 12, padding: 13 },
  noteIcon: { fontSize: 19 },
  noteTitle: { fontSize: 13, fontWeight: "900" },
  noteSub: { fontSize: 11, marginTop: 2 },
  footer: { borderTopWidth: 1, bottom: 0, left: 0, padding: 16, paddingBottom: 22, position: "absolute", right: 0 },
  cta: { alignItems: "center", borderRadius: 15, flexDirection: "row", justifyContent: "space-between", padding: 16 },
  ctaText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  ctaPrice: { color: "rgba(255,255,255,0.84)", fontSize: 15, fontWeight: "900" },
});
