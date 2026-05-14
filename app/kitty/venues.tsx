import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";

import { DARK, LIGHT } from "@/constants/experiences";
import { KITTY_VENUES, findKittyPackage } from "@/constants/kitty";
import { useMomentraTheme } from "@/contexts/momentra-theme";

export default function KittyVenuesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingDate?: string; bookingTime?: string; guests?: string; packageId?: string }>();
  const { isDark } = useMomentraTheme();
  const T = isDark ? DARK : LIGHT;
  const selectedPackage = findKittyPackage(params.packageId);
  const guests = Number.parseInt(params.guests ?? "12", 10) || 12;
  const bookingDate = params.bookingDate ?? "";
  const bookingTime = params.bookingTime ?? "";
  const availableVenues = KITTY_VENUES;

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.header, { borderBottomColor: T.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: T.border }]}>
          <Text style={[styles.backTxt, { color: T.gold }]}>←</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: T.text }]}>Available Venues</Text>
          <Text style={[styles.sub, { color: T.text2 }]}>
            {selectedPackage.name} · {bookingDate || "Selected date"} · {bookingTime || "Selected time"} · {guests} guests
          </Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {availableVenues.map((venue) => (
          <Pressable
            key={venue.id}
            onPress={() =>
              router.push({
                pathname: "/kitty/venue-detail",
                params: {
                  bookingDate,
                  bookingTime,
                  guests: String(guests),
                  packageId: selectedPackage.id,
                  venueId: venue.id,
                },
              } as never)
            }
            style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}
          >
            <View style={styles.imageWrap}>
              <Image source={{ uri: venue.image }} style={styles.image} />
              <View style={styles.badgeRow}>
                {venue.badges.map((badge) => (
                  <View key={badge} style={styles.badge}><Text style={styles.badgeTxt}>{badge}</Text></View>
                ))}
                <View style={styles.availableBadge}><Text style={styles.availableTxt}>Available</Text></View>
              </View>
            </View>
            <View style={styles.body}>
              <Text style={[styles.venueName, { color: T.text }]}>{venue.name}</Text>
              <Text style={[styles.location, { color: T.text2 }]}>📍 {venue.location}</Text>
              <Text style={[styles.desc, { color: T.text2 }]} numberOfLines={2}>{venue.desc}</Text>
              <View style={styles.metaRow}>
                <Text style={[styles.meta, { borderColor: T.border, color: T.text2 }]}>👯 {venue.capacity}</Text>
                <Text style={[styles.meta, { borderColor: T.border, color: T.text2 }]}>⏱ {venue.duration}</Text>
                <Text style={[styles.meta, { borderColor: T.border, color: T.gold }]}>★ {venue.rating} ({venue.reviews})</Text>
              </View>
              <View style={styles.amenities}>
                {venue.amenities.map((amenity) => <Text key={amenity} style={[styles.amenity, { color: T.text3 }]}>{amenity}</Text>)}
              </View>
              <View style={styles.priceRow}>
                <Text style={[styles.perHead, { color: T.text3 }]}>Per head ({selectedPackage.name})</Text>
                <Text style={[styles.price, { color: T.gold }]}>₹{selectedPackage.perHead.toLocaleString("en-IN")}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: Platform.OS === "ios" ? 52 : 32 },
  header: { alignItems: "center", borderBottomWidth: 1, flexDirection: "row", gap: 12, padding: 16 },
  backBtn: { alignItems: "center", borderRadius: 17, borderWidth: 1, height: 34, justifyContent: "center", width: 34 },
  backTxt: { fontSize: 15, fontWeight: "700" },
  headerCopy: { flex: 1 },
  title: { fontSize: 20, fontWeight: "600" },
  sub: { fontSize: 11, marginTop: 2 },
  content: { padding: 16, paddingBottom: 28 },
  card: { borderRadius: 18, borderWidth: 1, marginBottom: 13, overflow: "hidden" },
  imageWrap: { height: 175, position: "relative" },
  image: { height: "100%", opacity: 0.78, width: "100%" },
  badgeRow: { flexDirection: "row", gap: 6, left: 10, position: "absolute", top: 10 },
  badge: { backgroundColor: "rgba(192,57,43,0.88)", borderRadius: 7, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt: { color: "#fff", fontSize: 9, fontWeight: "700" },
  availableBadge: { backgroundColor: "rgba(37,211,102,0.88)", borderRadius: 7, paddingHorizontal: 10, paddingVertical: 4 },
  availableTxt: { color: "#fff", fontSize: 9, fontWeight: "700" },
  body: { padding: 13 },
  venueName: { fontSize: 18, fontWeight: "500", marginBottom: 3 },
  location: { fontSize: 11, marginBottom: 8 },
  desc: { fontSize: 11, lineHeight: 17, marginBottom: 10 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  meta: { backgroundColor: "rgba(201,151,90,0.07)", borderRadius: 7, borderWidth: 1, fontSize: 10, paddingHorizontal: 8, paddingVertical: 4 },
  amenities: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  amenity: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 6, fontSize: 9.5, paddingHorizontal: 8, paddingVertical: 3 },
  priceRow: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  perHead: { fontSize: 10 },
  price: { fontSize: 20, fontWeight: "700" },
});
