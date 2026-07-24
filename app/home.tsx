import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  Camera,
  HeartHandshake,
  House,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { DARK, LIGHT, OCCASIONS as SHARED_OCCASIONS } from "@/constants/experiences";
import { useMomentraTheme } from "@/contexts/momentra-theme";
import { LuxuryBottomNav } from "@/components/luxury-bottom-nav";
import { openWhatsApp as openMomentraWhatsApp, WhatsAppCategory } from "@/lib/whatsapp";

const TREND_W = 175;
const ANIMATE_WITH_NATIVE_DRIVER = Platform.OS !== "web";

type OccasionItem = {
  desc: string;
  icon: string;
  id: string;
  img: string;
  label: string;
};

type TrendingItem = {
  cat: string;
  id: string;
  img: string;
  location: string;
  price: number;
  rating: number;
  title: string;
};

const OCCASIONS: OccasionItem[] = SHARED_OCCASIONS
  .filter((occasion) => occasion.active ?? true)
  .map((occasion) => ({
    desc: occasion.subtitle ?? occasion.desc,
    icon: occasion.icon,
    id: occasion.id,
    img: occasion.image,
    label: occasion.title ?? occasion.label,
  }));

const TRENDING: TrendingItem[] = [
  {
    id: "candlelight-dining",
    title: "Intimate Candlelight Dining",
    location: "Sagar Nagar · Visakhapatnam",
    price: 2000,
    rating: 4.8,
    img: "/venues/venue-1/cover.jpg",
    cat: "datenight",
  },
];

export default function HomeScreen() {
  return <MobileHomeScreen />;
}

const PROMISE_ITEMS: { icon: LucideIcon; text: string }[] = [
  { icon: Camera, text: "Setup photo sent 2 hours before your moment" },
  { icon: BadgeCheck, text: "Availability confirmed before we confirm to you" },
  { icon: HeartHandshake, text: "Live support during every Momentra experience" },
  { icon: ShieldCheck, text: "Full refund if we can't deliver what we promised" },
];

function MobileHomeScreen() {
  const router = useRouter();
  const { isDark } = useMomentraTheme();
  const { width: windowWidth } = useWindowDimensions();
  const viewportWidth = useViewportWidth(windowWidth);
  const width = Math.min(windowWidth, viewportWidth);
  const T = isDark ? DARK : LIGHT;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const occasionColumns = width < 430 ? 2 : width < 900 ? 3 : 4;
  const occasionCardWidth = (width - 32 - 9 * (occasionColumns - 1)) / occasionColumns;

  useEffect(() => {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { duration: 900, toValue: 1.5, useNativeDriver: ANIMATE_WITH_NATIVE_DRIVER }),
          Animated.timing(pulseAnim, { duration: 900, toValue: 1, useNativeDriver: ANIMATE_WITH_NATIVE_DRIVER }),
        ])
      );

    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  function openWhatsApp(category: WhatsAppCategory) {
    openMomentraWhatsApp(category);
  }

  function openOccasion(item: OccasionItem) {
    if (item.id === "kitty") {
      router.push("/kitty" as never);
      return;
    }
    if (item.id === "corporate") {
      router.push("/corporate" as never);
      return;
    }

    router.push({
      pathname: "/experiences",
      params: { occasionId: item.id },
    } as never);
  }

  function openExperience(item: TrendingItem) {
    if (item.cat === "corporate" || item.id === "corporate-dinner") {
      router.push("/corporate" as never);
      return;
    }

    router.push({
      pathname: "/experience-detail",
      params: { experienceId: item.id },
    } as never);
  }

  function OccasionCard({ item }: { item: OccasionItem }) {
    const scale = useRef(new Animated.Value(1)).current;
    const Icon = getOccasionIcon(item.id);

    return (
        <Pressable
          onPress={() => openOccasion(item)}
          onPressIn={() => Animated.spring(scale, { speed: 50, toValue: 0.95, useNativeDriver: ANIMATE_WITH_NATIVE_DRIVER }).start()}
          onPressOut={() => Animated.spring(scale, { speed: 30, toValue: 1, useNativeDriver: ANIMATE_WITH_NATIVE_DRIVER }).start()}
          style={[styles.occCard, { width: occasionCardWidth }]}
        >
        <Animated.View style={[styles.occInner, { transform: [{ scale }] }]}>
          <Image source={{ uri: item.img }} style={styles.occImg} resizeMode="cover" />
          <LinearGradient
            colors={["rgba(13,9,5,0.05)", "rgba(13,9,5,0.82)"]}
            locations={[0.2, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.occContent}>
            <View style={styles.occIconWrap}>
              <Icon color="#F2E8D9" size={17} strokeWidth={2.1} />
            </View>
            <Text style={styles.occLabel}>{item.label}</Text>
            <Text style={styles.occDesc}>{item.desc}</Text>
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  function TrendingCard({ item }: { item: TrendingItem }) {
    return (
      <Pressable
        onPress={() => openExperience(item)}
        style={[styles.trendCard, { borderColor: T.border }]}
      >
        <Image source={{ uri: item.img }} style={styles.trendImg} resizeMode="cover" />
        <LinearGradient
          colors={["transparent", "rgba(13,9,5,0.96)"]}
          locations={[0.2, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.trendInfo}>
          <Text style={styles.trendTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.trendLoc} numberOfLines={1}>📍 {item.location}</Text>
          <View style={styles.trendBottom}>
            <Text style={[styles.trendPrice, { color: T.gold }]}>₹{item.price.toLocaleString("en-IN")}</Text>
            <View style={styles.ratingChip}>
              <Text style={[styles.ratingText, { color: T.gold }]}>★ {item.rating}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View style={styles.hero}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=85" }}
            style={[StyleSheet.absoluteFill, { opacity: isDark ? 0.24 : 0.35 }]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={
              isDark
                ? ["rgba(13,9,5,0.35)", "rgba(13,9,5,0)", "rgba(13,9,5,0)", "rgba(13,9,5,0.84)", T.bg]
                : ["rgba(255,248,242,0.1)", "rgba(255,248,242,0)", "rgba(255,248,242,0)", "rgba(255,248,242,0.9)", T.bg]
            }
            locations={[0, 0.2, 0.42, 0.72, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroGlow} />

          <View style={styles.heroHeader}>
            <View style={styles.headerSpacer} />
            <View style={styles.logoWrap}>
              <Image source={require("../assets/logo-wide.png")} style={styles.logoImg} resizeMode="contain" />
            </View>
            <View style={styles.headerActions}>
              <Pressable style={styles.hdrBtn}>
                <Search color={T.gold} size={16} strokeWidth={2.2} />
              </Pressable>
              <Pressable style={styles.hdrBtn}>
                <Bell color={T.gold} size={16} strokeWidth={2.2} />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => router.push("/explore" as never)}
            style={styles.foundingBanner}
          >
            <Animated.View style={[styles.foundingDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.foundingTxt}>
              <Text style={styles.foundingStrong}>Founding Moment</Text>
              {"  —  "}exclusive pricing for our first 100 guests.{"  "}
              <Text style={[styles.foundingLink, { color: T.gold }]}>3 slots left →</Text>
            </Text>
          </Pressable>

          <View style={styles.heroText}>
            <Text style={[styles.heroH, { color: T.text }]}>
              Book a Memory,{"\n"}
              <Text style={{ color: T.gold, fontStyle: "italic" }}>Not a Venue.</Text>
            </Text>
            <Text style={[styles.heroSub, { color: T.text2 }]}>
              Every detail handled. Every moment guaranteed.{"\n"}
              You just show up and feel it.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.secHeader}>
            <Text style={[styles.secTitle, { color: T.text }]}>What are you celebrating?</Text>
            <Pressable onPress={() => router.push("/explore" as never)}>
              <Text style={[styles.seeAll, { color: T.gold }]}>View all →</Text>
            </Pressable>
          </View>
          <View style={styles.occGrid}>
            {OCCASIONS.map((item) => <OccasionCard key={item.id} item={item} />)}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.secHeader}>
            <Text style={[styles.secTitle, { color: T.text }]}>✦ Kitty Circle</Text>
          </View>
        </View>

        <View style={styles.kittyCard}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&q=85" }}
            style={styles.kittyBg}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(140,40,10,0.65)", "rgba(13,9,5,0.55)", "rgba(13,9,5,0.88)"]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.kittyInner}>
            <View style={styles.kittyBadge}>
              <UsersRound color={T.gold} size={13} strokeWidth={2.2} />
              <Text style={[styles.kittyBadgeTxt, { color: T.gold }]}>Most Popular · Groups</Text>
            </View>
            <Text style={styles.kittyTitle}>
              Your Circle.{"\n"}
              <Text style={{ color: T.gold, fontStyle: "italic" }}>Your Celebration.</Text>
            </Text>
            <Text style={styles.kittySub}>
              Private venues, curated setup, zero planning stress.{"\n"}
              We handle everything — you just bring your people.
            </Text>

            <View style={styles.kittyMath}>
              {[
                { val: "15", lbl: "Guests" },
                { val: "×", lbl: "", sep: true },
                { val: "₹1,500", lbl: "Per head" },
                { val: "=", lbl: "", sep: true },
                { val: "One unforgettable night", lbl: "₹22,000 for the group", highlight: true },
              ].map((item, index) =>
                item.sep ? (
                  <Text key={`${item.val}-${index}`} style={styles.kittyMathSep}>{item.val}</Text>
                ) : (
                  <View key={`${item.val}-${index}`} style={styles.kittyMathItem}>
                    <Text style={[styles.kittyMathVal, { color: item.highlight ? "#fff" : T.gold }]}>{item.val}</Text>
                    {!!item.lbl && <Text style={styles.kittyMathLbl}>{item.lbl}</Text>}
                  </View>
                )
              )}
            </View>

            <View style={styles.kittyActions}>
              <Pressable
                onPress={() => router.push("/kitty" as never)}
                style={styles.kittyBtn}
              >
                <Text style={styles.kittyBtnTxt}>Explore Kitty Packages</Text>
              </Pressable>
              <Pressable
                onPress={() => openWhatsApp("kitty")}
                style={styles.kittyWaBtn}
              >
                <MessageCircle color="#25D366" size={15} strokeWidth={2.2} />
                <Text style={styles.kittyWaBtnTxt}>Chat on WhatsApp</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.secHeader}>
            <Text style={[styles.secTitle, { color: T.text }]}>House Parties</Text>
          </View>
        </View>

        <View style={styles.houseCard}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=700&q=85" }}
            style={styles.houseBg}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(201,151,90,0.46)", "rgba(48,24,8,0.62)", "rgba(13,9,5,0.92)"]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.houseInner}>
            <View style={styles.houseBadge}>
              <House color="#E4B97A" size={13} strokeWidth={2.2} />
              <Text style={styles.houseBadgeTxt}>PRIVATE CELEBRATIONS · AT HOME</Text>
            </View>
            <Text style={styles.houseTitle}>House Party, Fully Handled.</Text>
            <Text style={styles.houseSub}>
              From decor and food to music and cleanup, Momentra coordinates your private celebration end-to-end.
            </Text>

            <View style={styles.houseEstimate}>
              <Text style={styles.houseEstimateText}>
                10 Guests × ₹1,200 per head = <Text style={styles.houseEstimateStrong}>₹12,000 estimated</Text>
              </Text>
            </View>

            <View style={styles.kittyActions}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/experiences",
                    params: { category: "house-party" },
                  } as never)
                }
                style={styles.houseBtn}
              >
                <Text style={styles.houseBtnTxt}>Plan House Party</Text>
              </Pressable>
              <Pressable
                onPress={() => openWhatsApp("houseParty")}
                style={styles.kittyWaBtn}
              >
                <MessageCircle color="#25D366" size={15} strokeWidth={2.2} />
                <Text style={styles.kittyWaBtnTxt}>Chat on WhatsApp</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.secHeader}>
            <Text style={[styles.secTitle, { color: T.text }]}>Corporate Moments</Text>
          </View>
        </View>

        <View style={styles.corporateCard}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=700&q=85" }}
            style={styles.corporateBg}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(10,12,14,0.42)", "rgba(10,12,14,0.72)", "rgba(13,9,5,0.94)"]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.corporateInner}>
            <View style={styles.corporateBadge}>
              <BriefcaseBusiness color="#4BAFD6" size={13} strokeWidth={2.2} />
              <Text style={styles.corporateBadgeTxt}>GST READY · TEAM EVENTS</Text>
            </View>
            <Text style={styles.corporateTitle}>Corporate Moments</Text>
            <Text style={styles.corporateSub}>Team dinners, client hosting, offsites & GST-ready events</Text>
            <Pressable onPress={() => router.push("/corporate" as never)} style={styles.corporateBtn}>
              <Text style={styles.corporateBtnTxt}>Plan Corporate Event</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.secHeader}>
            <Text style={[styles.secTitle, { color: T.text }]}>Trending in Vizag</Text>
            <Pressable onPress={() => router.push("/explore" as never)}>
              <Text style={[styles.seeAll, { color: T.gold }]}>See all →</Text>
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.trendingContent}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.trendingScroll}
          >
            {TRENDING.map((item) => <TrendingCard key={item.id} item={item} />)}
          </ScrollView>
        </View>

        <View style={[styles.section, styles.waSection]}>
          <Pressable
            onPress={() => openWhatsApp("general")}
            style={styles.waStrip}
          >
            <View style={styles.waIcon}>
              <MessageCircle color="#25D366" size={18} strokeWidth={2.2} />
            </View>
            <View style={styles.waCopy}>
              <Text style={[styles.waTitle, { color: T.text }]}>Not sure what to book?</Text>
              <Text style={[styles.waSub, { color: T.text2 }]}>
                Chat with our celebration expert on WhatsApp — we will plan it for you.
              </Text>
            </View>
            <Text style={styles.waArrow}>›</Text>
          </Pressable>
        </View>

        <View style={[styles.section, styles.trustSection]}>
          <View style={[styles.trustCard, { backgroundColor: T.card, borderColor: T.border }]}>
            <Text style={[styles.trustTitle, { color: T.text3 }]}>THE MOMENTRA PROMISE</Text>
            {PROMISE_ITEMS.map((item, index) => {
              const PromiseIcon = item.icon;
              return (
              <View
                key={item.text}
                style={[styles.trustRow, index > 0 && { borderTopColor: T.border, borderTopWidth: 1 }]}
              >
                <PromiseIcon color={T.gold} size={16} strokeWidth={2.1} />
                <Text style={[styles.trustTxt, { color: T.text2 }]}>{item.text}</Text>
              </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <LuxuryBottomNav active="Home" />
    </View>
  );
}

function useViewportWidth(fallback: number) {
  const [viewportWidth, setViewportWidth] = useState(fallback);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const updateWidth = () => setViewportWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);

    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  return viewportWidth;
}

function getOccasionIcon(id: string): LucideIcon {
  if (id === "corporate") return BriefcaseBusiness;
  if (id === "house-party") return House;
  if (id === "kitty" || id === "bachelorette" || id === "bridal-shower") return UsersRound;
  if (id === "datenight" || id === "anniversary") return HeartHandshake;
  return Sparkles;
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: Platform.OS === "ios" ? 52 : 32 },
  scrollContent: { paddingBottom: 154 },
  hero: { height: 370, overflow: "hidden", position: "relative" },
  heroGlow: {
    alignSelf: "center",
    backgroundColor: "rgba(120,40,10,0.16)",
    borderRadius: 140,
    bottom: -50,
    height: 280,
    position: "absolute",
    width: 280,
  },
  heroHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    left: 0,
    paddingHorizontal: 18,
    paddingTop: 44,
    position: "absolute",
    right: 0,
    top: Platform.OS === "ios" ? 0 : -20,
    zIndex: 10,
  },
  headerSpacer: { width: 82 },
  logoWrap: { alignItems: "center", left: 92, position: "absolute", right: 92 },
  logoImg: { alignSelf: "center", height: 126, width: 296 },
  headerActions: { flexDirection: "row", gap: 8, justifyContent: "flex-end", paddingTop: 4, width: 82 },
  hdrBtn: {
    alignItems: "center",
    backgroundColor: "rgba(13,9,5,0.55)",
    borderColor: "rgba(201,151,90,0.22)",
    borderRadius: 17,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  headerIcon: { fontSize: 15 },
  foundingBanner: {
    alignItems: "center",
    backgroundColor: "rgba(13,9,5,0.72)",
    borderColor: "rgba(201,151,90,0.34)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    left: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    position: "absolute",
    right: 18,
    top: 154,
    zIndex: 12,
  },
  foundingDot: {
    backgroundColor: "#E4B97A",
    borderColor: "#C0392B",
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 0,
    height: 10,
    shadowColor: "#E4B97A",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 6,
    width: 10,
  },
  foundingTxt: { color: "rgba(242,232,217,0.94)", flex: 1, fontSize: 11, lineHeight: 16 },
  foundingStrong: { color: "#fff", fontWeight: "600" },
  foundingLink: { fontWeight: "500" },
  heroText: { bottom: 26, left: 18, position: "absolute", right: 18, zIndex: 10 },
  eyebrow: { alignItems: "center", flexDirection: "row", gap: 8, marginBottom: 8 },
  eyeLine: { backgroundColor: "rgba(201,151,90,0.35)", flex: 1, height: 1 },
  eyeLineFlip: { transform: [{ scaleX: -1 }] },
  eyebrowTxt: { fontSize: 8.5, fontWeight: "500", letterSpacing: 2.5, textTransform: "uppercase" },
  heroH: { fontSize: 31, fontWeight: "300", lineHeight: 37, marginBottom: 7 },
  heroSub: { fontSize: 12, fontWeight: "300", lineHeight: 18 },
  section: { paddingHorizontal: 16, paddingTop: 18 },
  secHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 13 },
  secTitle: { fontSize: 18, fontWeight: "400" },
  seeAll: { fontSize: 11, fontWeight: "500" },
  occGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  occCard: {
    borderColor: "rgba(201,151,90,0.12)",
    borderRadius: 15,
    borderWidth: 1,
    height: 108,
    overflow: "hidden",
  },
  occInner: { borderRadius: 15, flex: 1, overflow: "hidden" },
  occImg: { ...StyleSheet.absoluteFillObject, opacity: 0.72 },
  occContent: { bottom: 0, left: 0, padding: 9, position: "absolute", right: 0 },
  occIconWrap: {
    alignItems: "center",
    backgroundColor: "rgba(13,9,5,0.6)",
    borderColor: "rgba(201,151,90,0.22)",
    borderRadius: 7,
    borderWidth: 1,
    height: 26,
    justifyContent: "center",
    marginBottom: 4,
    width: 26,
  },
  occIcon: { fontSize: 13 },
  occLabel: { color: "#fff", fontSize: 12, fontWeight: "600", lineHeight: 15 },
  occDesc: { color: "rgba(242,232,217,0.42)", fontSize: 8, marginTop: 1 },
  kittyCard: {
    borderColor: "rgba(201,151,90,0.22)",
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 16,
    overflow: "hidden",
    position: "relative",
  },
  kittyBg: { ...StyleSheet.absoluteFillObject, opacity: 0.28 },
  kittyInner: { padding: 20 },
  kittyBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(201,151,90,0.18)",
    borderColor: "rgba(201,151,90,0.3)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    marginBottom: 9,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  kittyBadgeTxt: { fontSize: 9, fontWeight: "600", letterSpacing: 1 },
  kittyTitle: { color: "#fff", fontSize: 22, fontWeight: "300", lineHeight: 27, marginBottom: 5 },
  kittySub: { color: "rgba(242,232,217,0.55)", fontSize: 11, lineHeight: 16, marginBottom: 13 },
  kittyMath: {
    alignItems: "center",
    backgroundColor: "rgba(13,9,5,0.5)",
    borderColor: "rgba(201,151,90,0.18)",
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    marginBottom: 13,
    padding: 11,
  },
  kittyMathItem: { alignItems: "center", flex: 1 },
  kittyMathVal: { fontSize: 15, fontWeight: "400", lineHeight: 18, textAlign: "center" },
  kittyMathLbl: { color: "rgba(201,151,90,0.5)", fontSize: 8, marginTop: 2, textAlign: "center" },
  kittyMathSep: { color: "rgba(201,151,90,0.35)", fontSize: 16, paddingHorizontal: 2 },
  kittyActions: { flexDirection: "row", gap: 9 },
  kittyBtn: {
    backgroundColor: "#C0392B",
    borderRadius: 11,
    elevation: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#C0392B",
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  kittyBtnTxt: { color: "#fff", fontSize: 11, fontWeight: "600" },
  kittyWaBtn: {
    alignItems: "center",
    backgroundColor: "rgba(37,211,102,0.14)",
    borderColor: "rgba(37,211,102,0.28)",
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  kittyWaIcon: { fontSize: 14 },
  kittyWaBtnTxt: { color: "#25D366", fontSize: 11, fontWeight: "600" },
  houseCard: {
    borderColor: "rgba(201,151,90,0.26)",
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 16,
    overflow: "hidden",
    position: "relative",
  },
  houseBg: { ...StyleSheet.absoluteFillObject, opacity: 0.34 },
  houseInner: { padding: 20 },
  houseBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(201,151,90,0.18)",
    borderColor: "rgba(228,185,122,0.32)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    marginBottom: 9,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  houseBadgeTxt: { color: "#E4B97A", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  houseTitle: { color: "#fff", fontSize: 22, fontWeight: "300", lineHeight: 27, marginBottom: 5 },
  houseSub: { color: "rgba(242,232,217,0.6)", fontSize: 11, lineHeight: 16, marginBottom: 13 },
  houseEstimate: {
    backgroundColor: "rgba(13,9,5,0.52)",
    borderColor: "rgba(201,151,90,0.22)",
    borderRadius: 11,
    borderWidth: 1,
    marginBottom: 13,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  houseEstimateText: { color: "rgba(242,232,217,0.72)", fontSize: 11, lineHeight: 16 },
  houseEstimateStrong: { color: "#E4B97A", fontWeight: "800" },
  houseBtn: {
    backgroundColor: "#C9975A",
    borderColor: "rgba(228,185,122,0.34)",
    borderRadius: 11,
    borderWidth: 1,
    elevation: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#C9975A",
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
  },
  houseBtnTxt: { color: "#1A0E08", fontSize: 11, fontWeight: "800" },
  corporateCard: {
    borderColor: "rgba(201,151,90,0.22)",
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 16,
    overflow: "hidden",
    position: "relative",
  },
  corporateBg: { ...StyleSheet.absoluteFillObject, opacity: 0.36 },
  corporateInner: { padding: 20 },
  corporateBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(46,134,171,0.18)",
    borderColor: "rgba(46,134,171,0.3)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    marginBottom: 9,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  corporateBadgeTxt: { color: "#4BAFD6", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  corporateTitle: { color: "#fff", fontSize: 22, fontWeight: "300", lineHeight: 27, marginBottom: 5 },
  corporateSub: { color: "rgba(242,232,217,0.58)", fontSize: 11, lineHeight: 16, marginBottom: 13 },
  corporateBtn: { alignSelf: "flex-start", backgroundColor: "#C0392B", borderRadius: 11, paddingHorizontal: 16, paddingVertical: 10 },
  corporateBtnTxt: { color: "#fff", fontSize: 11, fontWeight: "700" },
  trendingScroll: { marginHorizontal: -16 },
  trendingContent: { gap: 11, paddingHorizontal: 16 },
  trendCard: { borderRadius: 14, borderWidth: 1, height: 132, overflow: "hidden", position: "relative", width: TREND_W },
  trendImg: { ...StyleSheet.absoluteFillObject, opacity: 0.68 },
  trendInfo: { bottom: 10, left: 10, position: "absolute", right: 10 },
  trendTitle: { color: "#F2E8D9", fontSize: 12, fontWeight: "600", marginBottom: 1 },
  trendLoc: { color: "rgba(242,232,217,0.48)", fontSize: 9, marginBottom: 5 },
  trendBottom: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  trendPrice: { fontSize: 13, fontWeight: "400" },
  ratingChip: { backgroundColor: "rgba(201,151,90,0.15)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  ratingText: { fontSize: 9, fontWeight: "600" },
  waSection: { paddingTop: 4 },
  waStrip: {
    alignItems: "center",
    backgroundColor: "rgba(37,211,102,0.08)",
    borderColor: "rgba(37,211,102,0.22)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  waIcon: {
    alignItems: "center",
    backgroundColor: "rgba(37,211,102,0.18)",
    borderColor: "rgba(37,211,102,0.3)",
    borderRadius: 19,
    borderWidth: 1,
    flexShrink: 0,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  waIconText: { fontSize: 18 },
  waCopy: { flex: 1 },
  waTitle: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
  waSub: { fontSize: 10.5, lineHeight: 15 },
  waArrow: { color: "rgba(37,211,102,0.6)", fontSize: 18 },
  trustSection: { paddingBottom: 132, paddingTop: 8 },
  trustCard: { borderRadius: 15, borderWidth: 1, overflow: "hidden" },
  trustTitle: { fontSize: 9, fontWeight: "500", letterSpacing: 2.5, padding: 13, paddingBottom: 8, textTransform: "uppercase" },
  trustRow: { alignItems: "center", flexDirection: "row", gap: 11, paddingHorizontal: 13, paddingVertical: 10 },
  trustIcon: { flexShrink: 0, fontSize: 15 },
  trustTxt: { flex: 1, fontSize: 11, lineHeight: 16 },
  nav: {
    alignItems: "center",
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    height: 72,
    left: 0,
    position: "absolute",
    right: 0,
  },
  navItem: { alignItems: "center", flex: 1, gap: 4, justifyContent: "center", minHeight: 64 },
  navMark: { borderBottomLeftRadius: 2, borderBottomRightRadius: 2, height: 2, position: "absolute", top: 0, width: 22 },
  navIcon: { fontSize: 19 },
  navLabel: { fontSize: 9, fontWeight: "700" },
});
