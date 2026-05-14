import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";

import { DARK, LIGHT } from "@/constants/experiences";
import { findKittyPackage, findKittyVenue, kittyTotal } from "@/constants/kitty";
import { useMomentraTheme } from "@/contexts/momentra-theme";
import { WebEnquiryScreen } from "@/components/web-enquiry-screen";

export default function KittyConfirmScreen() {
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
  const T = isDark ? DARK : LIGHT;
  const selectedPackage = findKittyPackage(params.packageId);
  const venue = findKittyVenue(params.venueId);
  const guests = Number.parseInt(params.guests ?? "12", 10) || 12;
  const bookingDate = params.bookingDate ?? "";
  const bookingTime = params.bookingTime ?? "11:30 AM - 2:30 PM";
  const total = kittyTotal(selectedPackage.perHead, guests);
  const splitSummary = params.splitBooking === "true"
    ? `; Split booking: yes; Organizer: ${params.organizerName}; Minimum guests: ${params.minimumGuestThreshold}; Deadline: ${params.paymentDeadline}`
    : "";

  if (Platform.OS === "web") {
    return (
      <WebEnquiryScreen
        primaryLabel="Request Availability"
        secondaryHref="/kitty"
        secondaryLabel="Back to Kitty Circle"
        subtitle="Kitty bookings on web are handled as guided enquiries for now. Share your details and Momentra will help confirm availability and coordinate your group."
        summary={[
          { label: "Venue", value: venue.name },
          { label: "Package", value: selectedPackage.name },
          { label: "Date", value: bookingDate || "Preferred date" },
          { label: "Time", value: bookingTime },
          { label: "Guests", value: `${guests} guests` },
          { label: "Estimated Plan", value: `₹${total.toLocaleString("en-IN")}` },
        ]}
        title="Plan Your Kitty Circle"
        whatsappCategory="kitty"
      />
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.header, { borderBottomColor: T.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: T.border }]}>
          <Text style={[styles.backTxt, { color: T.gold }]}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: T.text }]}>Confirm Your Circle</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.venueCard, { backgroundColor: T.card, borderColor: T.border }]}>
          <Image source={{ uri: venue.image }} style={styles.venueImage} />
          <View style={styles.venueInfo}>
            <Text style={[styles.venueName, { color: T.text }]}>{venue.name}</Text>
            <Text style={[styles.venueLoc, { color: T.text2 }]}>📍 {venue.location}</Text>
            <Text style={[styles.packageChip, { color: T.gold }]}>👯 {selectedPackage.name} Package</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
          <Row label="Date" value={bookingDate || "Select a date"} />
          <Row label="Time" value={bookingTime} />
          <Row label="Guests" value={`${guests} Women`} />
          <Row label="Package" value={selectedPackage.name} />
          <Row label="Venue" value={venue.name} />
        </View>

        <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
          <Row label="Price per head" value={`₹${selectedPackage.perHead.toLocaleString("en-IN")}`} />
          <Row label="Package price" value={`₹${selectedPackage.perHead.toLocaleString("en-IN")} × ${guests}`} />
          <Row label="Subtotal" value={`₹${total.toLocaleString("en-IN")}`} />
          <Row label="Momentra service fee" value="₹0" />
          <View style={[styles.totalRow, { borderTopColor: T.border }]}>
            <Text style={[styles.totalLbl, { color: T.text }]}>Total</Text>
            <Text style={[styles.totalVal, { color: T.red }]}>₹{total.toLocaleString("en-IN")}</Text>
          </View>
        </View>

        <View style={[styles.promise, { borderColor: T.border }]}>
          <Text style={[styles.promiseTitle, { color: T.text3 }]}>BOOKING SUMMARY</Text>
          <Text style={[styles.promiseTxt, { color: T.text2 }]}>
            You are booking {selectedPackage.name} at {venue.name} for {guests} guests. The package includes curated setup, food and hosting support, with your selected date and time saved into the booking.
          </Text>
        </View>

        <View style={[styles.promise, { borderColor: T.border }]}>
          <Text style={[styles.promiseTitle, { color: T.text3 }]}>THE MOMENTRA PROMISE</Text>
          <Text style={[styles.promiseTxt, { color: T.text2 }]}>📸 Setup photo sent 2 hrs before · ✓ Availability pre-confirmed · 🎯 Host present throughout</Text>
        </View>
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: T.bg, borderTopColor: T.border }]}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/booking-summary",
              params: {
                date: bookingDate,
                experienceId: "kitty-brunch",
                experienceTitle: `${selectedPackage.name} Kitty Circle`,
                guests: String(guests),
                invitedGuests: params.invitedGuests,
                minimumGuestThreshold: params.minimumGuestThreshold,
                organizerName: params.organizerName,
                paymentDeadline: params.paymentDeadline,
                price: String(total),
                request: `Kitty Circle package: ${selectedPackage.name}; Venue: ${venue.name}; Per head: ₹${selectedPackage.perHead.toLocaleString("en-IN")}${splitSummary}`,
                splitBooking: params.splitBooking,
                time: bookingTime,
                venue: venue.location,
              },
            } as never)
          }
          style={[styles.cta, { backgroundColor: T.red }]}
        >
          <Text style={styles.ctaTxt}>Confirm & Pay</Text>
          <Text style={styles.ctaSub}>₹{total.toLocaleString("en-IN")} →</Text>
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
  backTxt: { fontSize: 15, fontWeight: "700" },
  title: { flex: 1, fontSize: 20, fontWeight: "600", textAlign: "center" },
  content: { padding: 16, paddingBottom: 120 },
  venueCard: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 12, marginBottom: 12, padding: 12 },
  venueImage: { borderRadius: 10, height: 66, width: 66 },
  venueInfo: { flex: 1 },
  venueName: { fontSize: 16, fontWeight: "600" },
  venueLoc: { fontSize: 10, marginVertical: 4 },
  packageChip: { fontSize: 10, fontWeight: "700" },
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  row: { alignItems: "center", borderBottomColor: "rgba(201,151,90,0.14)", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: 12 },
  rowLabel: { color: "rgba(242,232,217,0.62)", fontSize: 12 },
  rowValue: { color: "#F2E8D9", flex: 1, fontSize: 12, fontWeight: "700", textAlign: "right" },
  totalRow: { alignItems: "center", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: 14 },
  totalLbl: { fontSize: 15, fontWeight: "800" },
  totalVal: { fontSize: 18, fontWeight: "900" },
  promise: { backgroundColor: "rgba(201,151,90,0.06)", borderRadius: 13, borderWidth: 1, padding: 13 },
  promiseTitle: { fontSize: 9.5, fontWeight: "600", letterSpacing: 2, marginBottom: 8 },
  promiseTxt: { fontSize: 11, lineHeight: 18 },
  footer: { borderTopWidth: 1, bottom: 0, left: 0, padding: 18, paddingBottom: Platform.OS === "ios" ? 28 : 18, position: "absolute", right: 0 },
  cta: { alignItems: "center", borderRadius: 15, flexDirection: "row", justifyContent: "space-between", padding: 15 },
  ctaTxt: { color: "#fff", fontSize: 14, fontWeight: "700" },
  ctaSub: { color: "rgba(255,255,255,0.82)", fontSize: 13, fontWeight: "700" },
});
