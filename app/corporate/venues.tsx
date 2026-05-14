import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";

import { CORPORATE_REQUIREMENTS, CORPORATE_VENUES, findCorporateEventType } from "@/constants/corporate";
import { DARK, LIGHT } from "@/constants/experiences";
import { useMomentraTheme } from "@/contexts/momentra-theme";

export default function CorporateVenuesScreen() {
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
  }>();
  const { isDark } = useMomentraTheme();
  const T = isDark ? DARK : LIGHT;
  const eventType = findCorporateEventType(params.eventTypeId);
  const guests = Number.parseInt(params.guests ?? "20", 10) || 20;
  const requirementLabels = (params.requirements ?? "")
    .split(",")
    .filter(Boolean)
    .map((id) => CORPORATE_REQUIREMENTS.find((item) => item.id === id)?.label)
    .filter(Boolean);

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.header, { borderBottomColor: T.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: T.border }]}>
          <Text style={[styles.backTxt, { color: T.gold }]}>←</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: T.text }]}>Venues — {eventType.label}</Text>
          <Text style={[styles.sub, { color: T.text2 }]}>{params.date} · {params.time} · {guests} guests · {params.budget}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersContent}>
        {["All", "Private Dining", "Banquet", "Rooftop", "Hotel", "GST Ready"].map((filter, index) => (
          <Text key={filter} style={[styles.filterChip, { backgroundColor: index === 0 ? T.red : T.card, borderColor: index === 0 ? T.red : T.border, color: index === 0 ? "#fff" : T.text2 }]}>{filter}</Text>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {CORPORATE_VENUES.map((venue) => (
          <Pressable
            key={venue.id}
            onPress={() =>
              router.push({
                pathname: "/corporate/venue-detail",
                params: { ...params, venueId: venue.id },
              } as never)
            }
            style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}
          >
            <View style={styles.imageWrap}>
              <Image source={{ uri: venue.image }} style={styles.image} />
              <View style={styles.badgeRow}>
                {venue.badges.map((badge) => (
                  <Text key={badge} style={[styles.badge, badge.includes("GST") && styles.gstBadge]}>{badge}</Text>
                ))}
              </View>
            </View>
            <View style={styles.body}>
              <Text style={[styles.venueName, { color: T.text }]}>{venue.name}</Text>
              <Text style={[styles.location, { color: T.text2 }]}>📍 {venue.location}</Text>
              <Text style={[styles.desc, { color: T.text2 }]} numberOfLines={2}>{venue.desc}</Text>
              <View style={styles.metaRow}>
                <Text style={[styles.meta, { borderColor: T.border, color: T.text2 }]}>👥 {venue.capacity}</Text>
                <Text style={[styles.meta, { borderColor: T.border, color: T.text2 }]}>⏱ {venue.duration}</Text>
                <Text style={[styles.meta, { borderColor: T.border, color: T.gold }]}>★ {venue.rating} ({venue.reviewCount})</Text>
              </View>
              <View style={styles.amenities}>
                {[...venue.amenities, ...requirementLabels].slice(0, 6).map((item) => <Text key={item} style={[styles.amenity, { color: T.text3 }]}>{item}</Text>)}
              </View>
              <View style={styles.priceRow}>
                <Text style={[styles.perHead, { color: T.text3 }]}>Starting from / head</Text>
                <Text style={[styles.price, { color: T.gold }]}>₹{venue.perHead.toLocaleString("en-IN")}</Text>
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
  backTxt: { fontSize: 15, fontWeight: "800" },
  headerCopy: { flex: 1 },
  title: { fontSize: 20, fontWeight: "800" },
  sub: { fontSize: 10.5, marginTop: 3 },
  filters: { flexGrow: 0 },
  filtersContent: { gap: 7, paddingHorizontal: 16, paddingVertical: 11 },
  filterChip: { borderRadius: 18, borderWidth: 1.5, fontSize: 11, fontWeight: "700", paddingHorizontal: 13, paddingVertical: 7 },
  content: { padding: 16, paddingBottom: 34 },
  card: { borderRadius: 17, borderWidth: 1, marginBottom: 13, overflow: "hidden" },
  imageWrap: { height: 165, position: "relative" },
  image: { height: "100%", opacity: 0.72, width: "100%" },
  badgeRow: { flexDirection: "row", gap: 6, left: 10, position: "absolute", top: 10 },
  badge: { backgroundColor: "rgba(192,57,43,0.88)", borderRadius: 7, color: "#fff", fontSize: 9, fontWeight: "800", paddingHorizontal: 10, paddingVertical: 4 },
  gstBadge: { backgroundColor: "rgba(39,174,96,0.88)" },
  body: { padding: 13 },
  venueName: { fontSize: 18, fontWeight: "700", marginBottom: 3 },
  location: { fontSize: 11, marginBottom: 8 },
  desc: { fontSize: 11, lineHeight: 17, marginBottom: 10 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 10 },
  meta: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 7, borderWidth: 1, fontSize: 10, paddingHorizontal: 8, paddingVertical: 4 },
  amenities: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  amenity: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 6, fontSize: 9.5, paddingHorizontal: 8, paddingVertical: 3 },
  priceRow: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  perHead: { fontSize: 10 },
  price: { fontSize: 20, fontWeight: "800" },
});
