import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";

import { DARK, LIGHT } from "@/constants/experiences";
import { findKittyPackage, findKittyVenue } from "@/constants/kitty";
import { useMomentraTheme } from "@/contexts/momentra-theme";
import { openWhatsApp as openMomentraWhatsApp } from "@/lib/whatsapp";

export default function KittyVenueDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingDate?: string; bookingTime?: string; guests?: string; packageId?: string; venueId?: string }>();
  const { isDark } = useMomentraTheme();
  const T = isDark ? DARK : LIGHT;
  const selectedPackage = findKittyPackage(params.packageId);
  const venue = findKittyVenue(params.venueId);
  const guests = Number.parseInt(params.guests ?? "12", 10) || 12;
  const bookingDate = params.bookingDate ?? "";
  const bookingTime = params.bookingTime ?? "11:30 AM - 2:30 PM";

  function openWhatsApp() {
    openMomentraWhatsApp("venue", "KITTY WHATSAPP OPEN ERROR");
  }

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.hero}>
        <Image source={{ uri: venue.image }} style={styles.heroImage} />
        <LinearGradient colors={["transparent", "rgba(13,9,5,0.96)"]} style={StyleSheet.absoluteFill} />
        <View style={styles.heroTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backTxt}>←</Text></Pressable>
          <View style={styles.available}><Text style={styles.availableTxt}>Available this weekend</Text></View>
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
            [String(venue.reviews), "Reviews"],
            [venue.capacity.replace("Up to ", ""), "Max guests"],
            [venue.duration, "Duration"],
          ].map(([value, label]) => (
            <View key={label} style={[styles.stat, { backgroundColor: T.card, borderColor: T.border }]}>
              <Text style={[styles.statVal, { color: T.gold }]}>{value}</Text>
              <Text style={[styles.statLbl, { color: T.text3 }]}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.slotCard, { backgroundColor: T.card, borderColor: T.border }]}>
          <View style={styles.slotItem}>
            <Text style={[styles.slotLabel, { color: T.text3 }]}>Selected Date</Text>
            <Text style={[styles.slotValue, { color: T.text }]}>{bookingDate || "Date selected earlier"}</Text>
          </View>
          <View style={[styles.slotDivider, { backgroundColor: T.border }]} />
          <View style={styles.slotItem}>
            <Text style={[styles.slotLabel, { color: T.text3 }]}>Selected Time</Text>
            <Text style={[styles.slotValue, { color: T.text }]}>{bookingTime}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: T.text }]}>About this place</Text>
          <Text style={[styles.desc, { color: T.text2 }]}>{venue.desc}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: T.text }]}>Amenities</Text>
          <View style={styles.amenityGrid}>
            {venue.amenities.map((item) => (
              <View key={item} style={[styles.amenity, { borderColor: T.border }]}>
                <Text style={[styles.amenityTxt, { color: T.text2 }]}>✓ {item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: T.text }]}>What is Included — {selectedPackage.name}</Text>
          <Text style={[styles.desc, { color: T.text2 }]}>{selectedPackage.desc}</Text>
          <View style={styles.inclusionList}>
            {selectedPackage.includes.map((item) => (
              <View key={item.name} style={[styles.inclusionCard, { backgroundColor: T.card, borderColor: T.border }]}>
                <Text style={styles.inclusionIcon}>{item.icon}</Text>
                <View style={styles.inclusionCopy}>
                  <Text style={[styles.inclusionName, { color: T.text }]}>{item.name}</Text>
                  <Text style={[styles.inclusionDesc, { color: T.text2 }]}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: T.text }]}>Momentra Managed</Text>
          <View style={[styles.reliabilityCard, { backgroundColor: T.card, borderColor: T.border }]}>
            {[
              "Setup photo sent 2 hours before event",
              "Venue availability confirmed before payment",
              "Momentra host monitors setup",
              "Late setup escalation handled by Momentra",
              "Refund or alternate arrangement if promised setup cannot be delivered",
            ].map((item) => (
              <View key={item} style={styles.reliabilityRow}>
                <Text style={[styles.reliabilityCheck, { color: T.gold }]}>✓</Text>
                <Text style={[styles.reliabilityTxt, { color: T.text2 }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: T.text }]}>Reviews from Kitty Circles</Text>
          {venue.reviewList.map((review) => (
            <View key={`${review.name}-${review.date}`} style={[styles.review, { backgroundColor: T.card, borderColor: T.border }]}>
              <View style={styles.reviewTop}>
                <Text style={[styles.reviewName, { color: T.text }]}>{review.name}</Text>
                <Text style={[styles.reviewStars, { color: T.gold }]}>{review.rating}★</Text>
              </View>
              <Text style={[styles.reviewMeta, { color: T.text3 }]}>{review.date} · {review.group}</Text>
              <Text style={[styles.reviewQuote, { color: T.text2 }]}>{review.text}</Text>
            </View>
          ))}
        </View>

        <Pressable onPress={openWhatsApp} style={styles.whatsApp}>
          <Text style={styles.whatsAppIcon}>📞</Text>
          <View style={styles.whatsAppCopy}>
            <Text style={[styles.whatsAppTitle, { color: T.text }]}>Have questions about this venue?</Text>
            <Text style={[styles.whatsAppSub, { color: T.text2 }]}>Chat with the Momentra team before booking.</Text>
          </View>
          <Text style={styles.whatsAppArrow}>›</Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: T.bg, borderTopColor: T.border }]}>
        <Pressable
          onPress={() => {
            if (Platform.OS === "web") {
              openWhatsApp();
              return;
            }

            router.push({
              pathname: "/kitty/split",
              params: {
                bookingDate,
                bookingTime,
                guests: String(guests),
                packageId: selectedPackage.id,
                venueId: venue.id,
              },
            } as never);
          }}
          style={[styles.cta, { backgroundColor: T.red }]}
        >
          <Text style={styles.ctaTxt}>{Platform.OS === "web" ? "Request Availability" : "Book This Venue"}</Text>
          <Text style={styles.ctaSub}>{Platform.OS === "web" ? "Talk to Momentra" : `₹${selectedPackage.perHead.toLocaleString("en-IN")}/head →`}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: Platform.OS === "ios" ? 52 : 32 },
  hero: { height: 265, overflow: "hidden", position: "relative" },
  heroImage: { ...StyleSheet.absoluteFillObject, opacity: 0.68 },
  heroTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", left: 16, position: "absolute", right: 16, top: 16 },
  backBtn: { alignItems: "center", backgroundColor: "rgba(13,9,5,0.65)", borderRadius: 17, height: 34, justifyContent: "center", width: 34 },
  backTxt: { color: "#C9975A", fontWeight: "700" },
  available: { backgroundColor: "rgba(37,211,102,0.18)", borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4 },
  availableTxt: { color: "#25D366", fontSize: 9, fontWeight: "700" },
  heroBottom: { bottom: 16, left: 16, position: "absolute", right: 16 },
  title: { color: "#F2E8D9", fontSize: 24, fontWeight: "600" },
  location: { color: "rgba(242,232,217,0.62)", fontSize: 11, marginTop: 4 },
  content: { paddingBottom: 128 },
  gallery: { gap: 8, paddingHorizontal: 16, paddingTop: 14 },
  galleryImage: { borderColor: "rgba(201,151,90,0.18)", borderRadius: 10, borderWidth: 1.5, height: 64, width: 84 },
  statsRow: { flexDirection: "row", gap: 9, padding: 16 },
  stat: { alignItems: "center", borderRadius: 11, borderWidth: 1, flex: 1, padding: 10 },
  statVal: { fontSize: 18, fontWeight: "700" },
  statLbl: { fontSize: 9, marginTop: 2 },
  slotCard: { borderRadius: 14, borderWidth: 1, flexDirection: "row", marginHorizontal: 16, marginBottom: 8, overflow: "hidden" },
  slotItem: { flex: 1, padding: 12 },
  slotLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 1.2, marginBottom: 4, textTransform: "uppercase" },
  slotValue: { fontSize: 12, fontWeight: "700" },
  slotDivider: { width: 1 },
  section: { paddingHorizontal: 16, paddingTop: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "600", marginBottom: 10 },
  desc: { fontSize: 12, lineHeight: 20, marginBottom: 8 },
  amenityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  amenity: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 9, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  amenityTxt: { fontSize: 11 },
  inclusionList: { gap: 8, marginTop: 4 },
  inclusionCard: { alignItems: "flex-start", borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 10, padding: 11 },
  inclusionIcon: { fontSize: 17 },
  inclusionCopy: { flex: 1 },
  inclusionName: { fontSize: 12, fontWeight: "700", marginBottom: 2 },
  inclusionDesc: { fontSize: 10.5, lineHeight: 16 },
  reliabilityCard: { borderRadius: 14, borderWidth: 1, padding: 12 },
  reliabilityRow: { alignItems: "flex-start", flexDirection: "row", gap: 9, paddingVertical: 5 },
  reliabilityCheck: { fontSize: 12, fontWeight: "900", lineHeight: 18 },
  reliabilityTxt: { flex: 1, fontSize: 11.5, lineHeight: 18 },
  review: { borderRadius: 14, borderWidth: 1, marginBottom: 10, padding: 13 },
  reviewTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  reviewName: { fontSize: 12, fontWeight: "700" },
  reviewStars: { fontSize: 12, fontWeight: "800" },
  reviewMeta: { fontSize: 10, marginBottom: 7 },
  reviewQuote: { fontSize: 11.5, lineHeight: 18 },
  whatsApp: { alignItems: "center", backgroundColor: "rgba(37,211,102,0.08)", borderColor: "rgba(37,211,102,0.22)", borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 11, margin: 16, padding: 13 },
  whatsAppIcon: { fontSize: 20 },
  whatsAppCopy: { flex: 1 },
  whatsAppTitle: { fontSize: 12, fontWeight: "700" },
  whatsAppSub: { fontSize: 10.5, marginTop: 2 },
  whatsAppArrow: { color: "rgba(37,211,102,0.6)", fontSize: 16 },
  footer: { borderTopWidth: 1, bottom: 0, left: 0, padding: 18, paddingBottom: Platform.OS === "ios" ? 28 : 18, position: "absolute", right: 0 },
  cta: { alignItems: "center", borderRadius: 15, flexDirection: "row", justifyContent: "space-between", padding: 15 },
  ctaTxt: { color: "#fff", fontSize: 14, fontWeight: "700" },
  ctaSub: { color: "rgba(255,255,255,0.82)", fontSize: 13, fontWeight: "700" },
});
