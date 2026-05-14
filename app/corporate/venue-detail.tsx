import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Image, Linking, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";

import { corporateTotal, findCorporateEventType, findCorporateVenue } from "@/constants/corporate";
import { DARK, LIGHT } from "@/constants/experiences";
import { useMomentraTheme } from "@/contexts/momentra-theme";

export default function CorporateVenueDetailScreen() {
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
  const total = corporateTotal(venue.perHead, guests);

  function openWhatsApp() {
    const message = encodeURIComponent(`Hi Momentra! I need help with a corporate ${eventType.label} at ${venue.name}.`);
    Linking.openURL(`https://wa.me/919876543210?text=${message}`).catch((error) => {
      console.error("CORPORATE WHATSAPP OPEN ERROR:", error);
    });
  }

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.hero}>
        <Image source={{ uri: venue.image }} style={styles.heroImage} />
        <LinearGradient colors={["transparent", "rgba(13,9,5,0.96)"]} style={StyleSheet.absoluteFill} />
        <View style={styles.heroTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backTxt}>←</Text></Pressable>
          <View style={styles.available}><Text style={styles.availableTxt}>GST Ready · Available</Text></View>
        </View>
        <View style={styles.heroBottom}>
          <Text style={styles.title}>{venue.name}</Text>
          <Text style={styles.location}>📍 {venue.location}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
          {venue.gallery.map((image, index) => (
            <Image key={image} source={{ uri: image }} style={[styles.galleryImage, index === 0 && { borderColor: T.gold }]} />
          ))}
        </ScrollView>

        <View style={styles.statsRow}>
          {[
            [String(venue.rating), "Rating"],
            [String(venue.reviewCount), "Reviews"],
            [venue.capacity.replace("Up to ", ""), "Max guests"],
            ["GST", "Invoice ready"],
          ].map(([value, label]) => (
            <View key={label} style={[styles.stat, { backgroundColor: T.card, borderColor: T.border }]}>
              <Text style={[styles.statVal, { color: label === "Invoice ready" ? "#27ae60" : T.gold }]}>{value}</Text>
              <Text style={[styles.statLbl, { color: T.text3 }]}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.slotCard, { backgroundColor: T.card, borderColor: T.border }]}>
          <Slot label="Event" value={eventType.label} />
          <Slot label="Date" value={params.date ?? "Selected date"} />
          <Slot label="Time" value={params.time ?? "Selected time"} />
        </View>

        <Section title="About this venue">
          <Text style={[styles.desc, { color: T.text2 }]}>{venue.desc}</Text>
        </Section>

        <Section title="Facilities & AV">
          <View style={styles.amenityGrid}>
            {venue.amenities.map((item) => (
              <View key={item} style={[styles.amenity, { borderColor: T.border }]}>
                <Text style={[styles.amenityTxt, { color: T.text2 }]}>✓ {item}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="GST invoice trust block">
          <View style={[styles.trustCard, { backgroundColor: T.card, borderColor: T.border }]}>
            {[
              "Venue availability confirmed before payment",
              "Dedicated Momentra coordinator present throughout",
              "GST invoice issued within 24 hours of event close",
              "Formal quote can be shared with finance or manager",
              "Refund or alternate arrangement if promised setup cannot be delivered",
            ].map((item) => (
              <View key={item} style={styles.trustRow}>
                <Text style={[styles.trustCheck, { color: T.gold }]}>✓</Text>
                <Text style={[styles.trustTxt, { color: T.text2 }]}>{item}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="What companies say">
          {venue.reviews.map((review) => (
            <View key={`${review.name}-${review.date}`} style={[styles.review, { backgroundColor: T.card, borderColor: T.border }]}>
              <View style={styles.reviewTop}>
                <View>
                  <Text style={[styles.reviewName, { color: T.text }]}>{review.name}</Text>
                  <Text style={[styles.reviewMeta, { color: T.text3 }]}>{review.date} · {review.company} · {review.event}</Text>
                </View>
                <Text style={[styles.reviewStars, { color: T.gold }]}>{review.rating}★</Text>
              </View>
              <Text style={[styles.reviewQuote, { color: T.text2 }]}>{review.text}</Text>
            </View>
          ))}
        </Section>

        <Pressable onPress={openWhatsApp} style={styles.whatsApp}>
          <Text style={styles.whatsAppIcon}>📞</Text>
          <View style={styles.whatsAppCopy}>
            <Text style={[styles.whatsAppTitle, { color: T.text }]}>Need a custom quote?</Text>
            <Text style={[styles.whatsAppSub, { color: T.text2 }]}>Chat directly with the Momentra corporate team.</Text>
          </View>
          <Text style={styles.whatsAppArrow}>›</Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: T.bg, borderTopColor: T.border }]}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/corporate/confirm",
              params: { ...params, venueId: venue.id },
            } as never)
          }
          style={[styles.cta, { backgroundColor: T.red }]}
        >
          <Text style={styles.ctaTxt}>Confirm & Book Directly</Text>
          <Text style={styles.ctaSub}>₹{total.toLocaleString("en-IN")} →</Text>
        </Pressable>
        <Text style={[styles.gstLine, { color: T.text3 }]}>Includes GST estimate · Subtotal ₹{subtotal.toLocaleString("en-IN")}</Text>
      </View>
    </View>
  );
}

function Slot({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.slotItem}>
      <Text style={styles.slotLabel}>{label}</Text>
      <Text style={styles.slotValue}>{value}</Text>
    </View>
  );
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: Platform.OS === "ios" ? 52 : 32 },
  hero: { height: 260, overflow: "hidden", position: "relative" },
  heroImage: { ...StyleSheet.absoluteFillObject, opacity: 0.68 },
  heroTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", left: 16, position: "absolute", right: 16, top: 16 },
  backBtn: { alignItems: "center", backgroundColor: "rgba(13,9,5,0.65)", borderRadius: 17, height: 34, justifyContent: "center", width: 34 },
  backTxt: { color: "#C9975A", fontWeight: "800" },
  available: { backgroundColor: "rgba(39,174,96,0.18)", borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4 },
  availableTxt: { color: "#25D366", fontSize: 9, fontWeight: "800" },
  heroBottom: { bottom: 16, left: 16, position: "absolute", right: 16 },
  title: { color: "#F2E8D9", fontSize: 24, fontWeight: "800" },
  location: { color: "rgba(242,232,217,0.62)", fontSize: 11, marginTop: 4 },
  content: { paddingBottom: 154 },
  gallery: { gap: 8, paddingHorizontal: 16, paddingTop: 14 },
  galleryImage: { borderColor: "rgba(201,151,90,0.18)", borderRadius: 10, borderWidth: 1.5, height: 62, width: 82 },
  statsRow: { flexDirection: "row", gap: 8, padding: 16 },
  stat: { alignItems: "center", borderRadius: 11, borderWidth: 1, flex: 1, padding: 10 },
  statVal: { fontSize: 18, fontWeight: "800" },
  statLbl: { fontSize: 8.5, marginTop: 2, textAlign: "center" },
  slotCard: { borderRadius: 14, borderWidth: 1, flexDirection: "row", marginHorizontal: 16, marginBottom: 8 },
  slotItem: { flex: 1, padding: 12 },
  slotLabel: { color: "rgba(242,232,217,0.36)", fontSize: 9, fontWeight: "800", marginBottom: 4, textTransform: "uppercase" },
  slotValue: { color: "#F2E8D9", fontSize: 11.5, fontWeight: "800" },
  section: { paddingHorizontal: 16, paddingTop: 10 },
  sectionTitle: { color: "#F2E8D9", fontSize: 17, fontWeight: "800", marginBottom: 10 },
  desc: { fontSize: 12, lineHeight: 20 },
  amenityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  amenity: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 9, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  amenityTxt: { fontSize: 11 },
  trustCard: { borderRadius: 14, borderWidth: 1, padding: 12 },
  trustRow: { alignItems: "flex-start", flexDirection: "row", gap: 9, paddingVertical: 5 },
  trustCheck: { fontSize: 12, fontWeight: "900", lineHeight: 18 },
  trustTxt: { flex: 1, fontSize: 11.5, lineHeight: 18 },
  review: { borderRadius: 14, borderWidth: 1, marginBottom: 10, padding: 13 },
  reviewTop: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
  reviewName: { fontSize: 12, fontWeight: "800" },
  reviewMeta: { fontSize: 9.5, lineHeight: 14, marginTop: 2 },
  reviewStars: { fontSize: 12, fontWeight: "900" },
  reviewQuote: { fontSize: 11.5, lineHeight: 18 },
  whatsApp: { alignItems: "center", backgroundColor: "rgba(37,211,102,0.08)", borderColor: "rgba(37,211,102,0.22)", borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 11, margin: 16, padding: 13 },
  whatsAppIcon: { fontSize: 20 },
  whatsAppCopy: { flex: 1 },
  whatsAppTitle: { fontSize: 12, fontWeight: "800" },
  whatsAppSub: { fontSize: 10.5, marginTop: 2 },
  whatsAppArrow: { color: "rgba(37,211,102,0.6)", fontSize: 16 },
  footer: { borderTopWidth: 1, bottom: 0, left: 0, padding: 18, paddingBottom: Platform.OS === "ios" ? 28 : 18, position: "absolute", right: 0 },
  cta: { alignItems: "center", borderRadius: 15, flexDirection: "row", justifyContent: "space-between", padding: 15 },
  ctaTxt: { color: "#fff", fontSize: 14, fontWeight: "800" },
  ctaSub: { color: "rgba(255,255,255,0.82)", fontSize: 13, fontWeight: "800" },
  gstLine: { fontSize: 10, marginTop: 7, textAlign: "center" },
});
