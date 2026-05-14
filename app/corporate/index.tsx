import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Image, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";

import { CORPORATE_EVENT_TYPES } from "@/constants/corporate";
import { DARK, LIGHT } from "@/constants/experiences";
import { useMomentraTheme } from "@/contexts/momentra-theme";

export default function CorporateScreen() {
  const router = useRouter();
  const { isDark } = useMomentraTheme();
  const T = isDark ? DARK : LIGHT;

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={{ uri: "https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=900&q=85" }} style={styles.heroImage} />
          <LinearGradient colors={["rgba(13,9,5,0.18)", "rgba(13,9,5,0.78)", T.bg]} style={StyleSheet.absoluteFill} />
          <View style={styles.gridOverlay} />
          <View style={styles.heroTop}>
            <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: T.border }]}>
              <Text style={[styles.backTxt, { color: T.gold }]}>←</Text>
            </Pressable>
            <View style={styles.gstBadge}>
              <Text style={styles.gstBadgeTxt}>✓ GST Invoice Provided</Text>
            </View>
          </View>
          <View style={styles.heroBottom}>
            <View style={styles.badge}><Text style={styles.badgeTxt}>💼 Corporate</Text></View>
            <Text style={[styles.heroTitle, { color: T.text }]}>
              One call.{"\n"}<Text style={{ color: T.gold, fontStyle: "italic" }}>Confirmed & done.</Text>
            </Text>
            <Text style={[styles.heroSub, { color: T.text2 }]}>Corporate events handled end-to-end. GST invoice ready for finance.</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: T.text }]}>What is the occasion?</Text>
        {CORPORATE_EVENT_TYPES.map((item) => (
          <Pressable
            key={item.id}
            onPress={() =>
              router.push({
                pathname: "/corporate/details",
                params: { eventTypeId: item.id },
              } as never)
            }
            style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}
          >
            <View style={[styles.iconBox, { borderColor: T.border }]}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <View style={styles.cardCopy}>
              <Text style={[styles.cardTitle, { color: T.text }]}>{item.label}</Text>
              <Text style={[styles.cardDesc, { color: T.text2 }]}>{item.desc}</Text>
              <View style={styles.tags}>
                {item.tags.map((tag) => (
                  <Text key={tag} style={[styles.tag, { borderColor: T.border, color: T.text3 }]}>{tag}</Text>
                ))}
              </View>
            </View>
            <Text style={[styles.arrow, { color: T.gold }]}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: Platform.OS === "ios" ? 52 : 32 },
  content: { paddingBottom: 28 },
  hero: { height: 230, overflow: "hidden", position: "relative" },
  heroImage: { ...StyleSheet.absoluteFillObject, opacity: 0.6 },
  gridOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.08 },
  heroTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", left: 18, position: "absolute", right: 18, top: 18 },
  backBtn: { alignItems: "center", borderRadius: 17, borderWidth: 1, height: 34, justifyContent: "center", width: 34 },
  backTxt: { fontSize: 15, fontWeight: "800" },
  gstBadge: { backgroundColor: "rgba(39,174,96,0.16)", borderColor: "rgba(39,174,96,0.28)", borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  gstBadgeTxt: { color: "#27ae60", fontSize: 9, fontWeight: "700" },
  heroBottom: { bottom: 20, left: 18, position: "absolute", right: 18 },
  badge: { alignSelf: "flex-start", backgroundColor: "rgba(46,134,171,0.22)", borderColor: "rgba(46,134,171,0.35)", borderRadius: 9, borderWidth: 1, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 5 },
  badgeTxt: { color: "#4BAFD6", fontSize: 9, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  heroTitle: { fontSize: 30, fontWeight: "300", lineHeight: 34 },
  heroSub: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 13, paddingHorizontal: 16, paddingTop: 16 },
  card: { alignItems: "flex-start", borderRadius: 15, borderWidth: 1.5, flexDirection: "row", gap: 13, marginHorizontal: 16, marginBottom: 10, padding: 14 },
  iconBox: { alignItems: "center", backgroundColor: "rgba(46,134,171,0.12)", borderRadius: 12, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  icon: { fontSize: 20 },
  cardCopy: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "800", marginBottom: 3 },
  cardDesc: { fontSize: 10.5, lineHeight: 16 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 8 },
  tag: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 6, borderWidth: 1, fontSize: 9, paddingHorizontal: 7, paddingVertical: 3 },
  arrow: { fontSize: 22, lineHeight: 24 },
});
