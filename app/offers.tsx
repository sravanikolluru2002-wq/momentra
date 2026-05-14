import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useMomentraTheme } from "@/contexts/momentra-theme";
import { LuxuryBottomNav } from "@/components/luxury-bottom-nav";

const DARK = {
  bg: "#0D0905",
  surf: "#1A0E08",
  surf2: "#231508",
  border: "rgba(201,151,90,0.18)",
  border2: "rgba(201,151,90,0.38)",
  text: "#F2E8D9",
  text2: "rgba(242,232,217,0.52)",
  text3: "rgba(242,232,217,0.28)",
  gold: "#C9975A",
  gold2: "#E4B97A",
  red: "#C0392B",
  red2: "#8B1A10",
  chipBg: "#1C0E08",
  cardBg: "#1A0E08",
  navBg: "rgba(15,8,4,0.97)",
  codeBg: "rgba(201,151,90,0.12)",
  codeBorder: "rgba(201,151,90,0.28)",
};

const LIGHT = {
  bg: "#FFF8F2",
  surf: "#FFF0E6",
  surf2: "#FAE8D8",
  border: "rgba(180,120,60,0.18)",
  border2: "rgba(180,120,60,0.4)",
  text: "#1E0A04",
  text2: "rgba(30,10,4,0.52)",
  text3: "rgba(30,10,4,0.32)",
  gold: "#8B5A1A",
  gold2: "#A0722A",
  red: "#C0392B",
  red2: "#8B1A10",
  chipBg: "#FFF0E6",
  cardBg: "#FFF0E6",
  navBg: "rgba(255,245,235,0.97)",
  codeBg: "rgba(180,120,60,0.10)",
  codeBorder: "rgba(180,120,60,0.28)",
};

const COUPONS = [
  {
    id: 1,
    label: "🎂 Birthday Special",
    title: "20% OFF Birthday",
    titleAccent: "20% OFF",
    desc: "Get 20% off on all birthday packages. Valid for Vizag & Hyderabad.",
    code: "BDAY20",
    validity: "Valid till 31 May",
    minBooking: "Min ₹4,999",
    stripColor: ["#C0392B", "#8B1A10"],
    badgeBg: "rgba(192,57,43,0.14)",
    badgeBorder: "rgba(192,57,43,0.25)",
    badgeColor: "#C0392B",
  },
  {
    id: 2,
    label: "❤️ Date Night",
    title: "₹500 OFF Romance",
    titleAccent: "₹500",
    desc: "Flat ₹500 off on date night packages for 2. Candlelight dinner included.",
    code: "DATE500",
    validity: "Valid till 30 Jun",
    minBooking: "Min ₹3,999",
    stripColor: ["#C9975A", "#8B5A1A"],
    badgeBg: "rgba(201,151,90,0.14)",
    badgeBorder: "rgba(201,151,90,0.25)",
    badgeColor: "#C9975A",
  },
  {
    id: 3,
    label: "💼 Corporate",
    title: "₹2,000 OFF Events",
    titleAccent: "₹2,000",
    desc: "₹2,000 off on corporate dinner & event packages above ₹14,999.",
    code: "CORP2K",
    validity: "Valid till 15 Jun",
    minBooking: "Min ₹14,999",
    stripColor: ["#1a9055", "#0d5c36"],
    badgeBg: "rgba(39,174,96,0.12)",
    badgeBorder: "rgba(39,174,96,0.25)",
    badgeColor: "#1a9055",
  },
];

const SEASONAL = [
  { id: 1, icon: "🎂", label: "Birthday Deals", discount: "20% OFF", from: "From ₹2,999", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80" },
  { id: 2, icon: "❤️", label: "Date Night Specials", discount: "₹500 OFF", from: "From ₹3,499", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&q=80" },
  { id: 3, icon: "🏛️", label: "Banquet Discounts", discount: "15% OFF", from: "From ₹9,999", img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&q=80" },
  { id: 4, icon: "💼", label: "Corporate Offers", discount: "₹2K OFF", from: "From ₹7,999", img: "https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=300&q=80" },
];

const REF_STEPS = [
  { icon: "📤", label: "Invite\na Friend", step: "1" },
  { icon: "📱", label: "Friend\nRegisters", step: "2" },
  { icon: "🥂", label: "Friend\nBooks", step: "3" },
  { icon: "💰", label: "You Earn\n₹500", step: "4" },
];

type Coupon = (typeof COUPONS)[number];
type SeasonalOffer = (typeof SEASONAL)[number];

export default function OffersScreen() {
  const { isDark } = useMomentraTheme();
  const T = isDark ? DARK : LIGHT;
  const [countdown, setCountdown] = useState(23 * 3600 + 14 * 60 + 8);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const copyCode = useCallback(async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert("Copied!", `"${code}" copied to clipboard.`);
  }, []);

  const applyCode = useCallback((code: string) => {
    Alert.alert("Applied!", `Coupon "${code}" applied successfully.`);
  }, []);

  const shareReferral = useCallback(async () => {
    await Share.share({
      message: "Join Momentra and book amazing celebrations! Use my code RAHUL500 to get ₹500 off your first booking. https://momentra.app/ref/RAHUL500",
    });
  }, []);

  function SecLabel({ title, showAll }: { title: string; showAll?: boolean }) {
    return (
      <View style={s.secRow}>
        <Text style={[s.secTitle, { color: T.text }]}>
          <Text style={{ color: T.gold }}>✦ </Text>{title}
        </Text>
        {showAll ? (
          <TouchableOpacity>
            <Text style={[s.seeAll, { color: T.red }]}>See all ›</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  function CouponCard({ item }: { item: Coupon }) {
    return (
      <View style={[s.couponCard, { backgroundColor: T.cardBg, borderColor: T.border }]}>
        <LinearGradient colors={item.stripColor as [string, string]} style={s.couponStrip} />

        <View style={s.couponInner}>
          <View style={{ flex: 1 }}>
            <View style={[s.couponBadge, { backgroundColor: item.badgeBg, borderColor: item.badgeBorder }]}>
              <Text style={[s.couponBadgeTxt, { color: item.badgeColor }]}>{item.label}</Text>
            </View>
            <Text style={[s.couponDiscount, { color: T.text }]}>
              <Text style={{ color: T.gold }}>{item.titleAccent} </Text>
              {item.title.replace(item.titleAccent, "").trim()}
            </Text>
            <Text style={[s.couponDesc, { color: T.text2 }]}>{item.desc}</Text>
            <View style={s.metaRow}>
              {[
                ["📅", item.validity],
                ["💰", item.minBooking],
              ].map(([icon, value]) => (
                <View key={value} style={[s.metaChip, { backgroundColor: "rgba(201,151,90,0.07)", borderColor: T.border }]}>
                  <Text style={{ fontSize: 10 }}>{icon}</Text>
                  <Text style={[s.metaTxt, { color: T.text3 }]}>{value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={s.couponRight}>
            <View style={s.codeWrap}>
              <Text style={[s.codeLbl, { color: T.text3 }]}>CODE</Text>
              <TouchableOpacity
                onPress={() => copyCode(item.code)}
                style={[s.codeBox, { backgroundColor: T.codeBg, borderColor: T.codeBorder }]}
              >
                <Text style={[s.codeVal, { color: T.gold2 }]}>{item.code}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => copyCode(item.code)}>
                <Text style={[s.copyTxt, { color: T.text3 }]}>📋 Copy</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => applyCode(item.code)} style={[s.applyBtn, { shadowColor: T.red }]}>
              <Text style={s.applyBtnTxt}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[s.couponDivider, { borderColor: T.border }]}>
          <Text style={[s.scissor, { color: T.text3 }]}>✂</Text>
        </View>
      </View>
    );
  }

  function SeasonalCard({ item }: { item: SeasonalOffer }) {
    return (
      <TouchableOpacity activeOpacity={0.88} style={s.seasonCard}>
        <Image source={{ uri: item.img }} style={s.seasonImg} resizeMode="cover" />
        <LinearGradient
          colors={["transparent", "rgba(13,9,5,0.94)"]}
          locations={[0.2, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.seasonBadge}>
          <Text style={s.seasonBadgeTxt}>{item.discount}</Text>
        </View>
        <View style={s.seasonContent}>
          <Text style={s.seasonIcon}>{item.icon}</Text>
          <Text style={s.seasonLabel}>{item.label}</Text>
          <Text style={[s.seasonFrom, { color: T.gold }]}>{item.from}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle="light-content" />

      <View style={s.header}>
        <View>
          <Text style={[s.headerTitle, { color: T.text }]}>Offers</Text>
          <Text style={[s.headerSub, { color: T.text2 }]}>Exclusive deals for your celebrations</Text>
        </View>
        <TouchableOpacity style={[s.bellBtn, { backgroundColor: T.chipBg, borderColor: T.border }]}>
          <Text style={{ fontSize: 18 }}>🎁</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={s.heroPad}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => applyCode("MOMENT1000")} style={s.heroCard}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=85" }}
              style={[StyleSheet.absoluteFill, s.heroBgImage]}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["rgba(139,26,16,0.75)", "rgba(13,9,5,0.6)", "rgba(13,9,5,0.88)"]}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={s.heroTimer}>
              <Text style={s.heroTimerTxt}>⏱ Ends in  </Text>
              <Text style={[s.heroTimerVal, { color: T.gold }]}>{formatCountdown(countdown)}</Text>
            </View>

            <View style={s.heroContent}>
              <View style={s.heroTag}>
                <Text style={[s.heroTagTxt, { color: T.gold }]}>✦ FEATURED DEAL</Text>
              </View>
              <Text style={s.heroDiscount}>
                Flat <Text style={{ color: T.gold2 }}>₹1,000</Text> OFF
              </Text>
              <Text style={s.heroCond}>On bookings above ₹7,999 · New users only</Text>

              <View style={s.heroBottom}>
                <View>
                  <Text style={s.heroCodeLbl}>USE CODE</Text>
                  <View style={s.heroCodeBox}>
                    <Text style={[s.heroCodeVal, { color: T.gold2 }]}>MOMENT1000</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => applyCode("MOMENT1000")} style={s.heroCTA}>
                  <Text style={s.heroCTATxt}>Apply Now →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[s.section, s.tightSection]}>
          <SecLabel title="All Coupons" showAll />
        </View>
        <View style={s.couponList}>
          {COUPONS.map((coupon) => <CouponCard key={coupon.id} item={coupon} />)}
        </View>

        <View style={s.section}>
          <SecLabel title="Seasonal Deals" showAll />
          <ScrollView
            contentContainerStyle={s.seasonScrollContent}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.seasonScroll}
          >
            {SEASONAL.map((item) => <SeasonalCard key={item.id} item={item} />)}
          </ScrollView>
        </View>

        <View style={s.section}>
          <SecLabel title="Refer & Earn" />
          <View style={[s.referralCard, { backgroundColor: T.cardBg, borderColor: T.border2 }]}>
            <View style={s.refGlow} />
            <View style={s.refInner}>
              <View style={s.refTopRow}>
                <View style={{ flex: 1 }}>
                  <View style={s.refBadge}>
                    <Text style={[s.refBadgeTxt, { color: T.gold }]}>🎁 REFERRAL PROGRAM</Text>
                  </View>
                  <Text style={[s.refHeadline, { color: T.text }]}>
                    Invite & Earn{"\n"}
                    <Text style={{ color: T.gold }}>₹500</Text>
                  </Text>
                  <Text style={[s.refSub, { color: T.text2 }]}>
                    Earn ₹500 wallet credits for every friend who books a celebration.
                  </Text>
                </View>
                <View style={s.refCircle}>
                  <LinearGradient
                    colors={["rgba(192,57,43,0.2)", "rgba(201,151,90,0.12)"]}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={[s.refCircleAmt, { color: T.gold }]}>₹500</Text>
                  <Text style={[s.refCircleLbl, { color: T.text3 }]}>PER INVITE</Text>
                </View>
              </View>

              <View style={[s.stepsRow, { backgroundColor: "rgba(201,151,90,0.05)", borderColor: T.border }]}>
                {REF_STEPS.map((step, index) => (
                  <React.Fragment key={step.step}>
                    <View style={s.stepItem}>
                      <View style={s.stepIconWrap}>
                        <Text style={{ fontSize: 17 }}>{step.icon}</Text>
                      </View>
                      <Text style={[s.stepNum, { color: T.text3 }]}>Step {step.step}</Text>
                      <Text style={[s.stepLbl, { color: T.text2 }]}>{step.label}</Text>
                    </View>
                    {index < REF_STEPS.length - 1 ? (
                      <Text style={[s.stepArrow, { color: T.border2 }]}>→</Text>
                    ) : null}
                  </React.Fragment>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => copyCode("RAHUL500")}
                style={[s.refCodeBox, { backgroundColor: T.codeBg, borderColor: T.codeBorder }]}
              >
                <Text style={[s.refCodeLbl, { color: T.text3 }]}>Your Referral Code</Text>
                <Text style={[s.refCodeVal, { color: T.gold }]}>RAHUL500</Text>
                <Text style={[s.refCopyTxt, { color: T.text3 }]}>📋 Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={shareReferral} style={[s.refCTA, { shadowColor: T.red }]}>
                <Text style={s.refCTATxt}>🎁  Invite Now & Earn ₹500</Text>
              </TouchableOpacity>

              <View style={s.refEarned}>
                <Text style={[s.refEarnedLbl, { color: T.text3 }]}>Total earned so far: </Text>
                <Text style={[s.refEarnedVal, { color: T.gold }]}>₹1,500 from 3 invites</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <LuxuryBottomNav active="Offers" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingTop: Platform.OS === "ios" ? 52 : 32 },
  header: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 18, paddingHorizontal: 20 },
  headerTitle: { fontSize: 28, fontWeight: "400", lineHeight: 32 },
  headerSub: { fontSize: 11, marginTop: 3 },
  bellBtn: { alignItems: "center", borderRadius: 18, borderWidth: 1, height: 36, justifyContent: "center", width: 36 },
  scrollContent: { paddingBottom: 118 },
  section: { marginBottom: 20, paddingHorizontal: 18 },
  tightSection: { marginBottom: 4 },
  secRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  secTitle: { fontSize: 18, fontWeight: "400" },
  seeAll: { fontSize: 11, fontWeight: "500" },
  heroPad: { marginBottom: 22, paddingHorizontal: 18 },
  heroCard: { borderColor: "rgba(201,151,90,0.22)", borderRadius: 22, borderWidth: 1, height: 200, overflow: "hidden" },
  heroBgImage: { opacity: 0.22 },
  heroTimer: { alignItems: "center", backgroundColor: "rgba(13,9,5,0.7)", borderColor: "rgba(201,151,90,0.22)", borderRadius: 9, borderWidth: 1, flexDirection: "row", left: 14, paddingHorizontal: 10, paddingVertical: 5, position: "absolute", top: 14 },
  heroTimerTxt: { color: "rgba(242,232,217,0.65)", fontSize: 10 },
  heroTimerVal: { fontSize: 10, fontWeight: "700" },
  heroContent: { bottom: 0, left: 0, padding: 18, position: "absolute", right: 0 },
  heroTag: { alignSelf: "flex-start", backgroundColor: "rgba(201,151,90,0.2)", borderColor: "rgba(201,151,90,0.35)", borderRadius: 8, borderWidth: 1, marginBottom: 7, paddingHorizontal: 10, paddingVertical: 4 },
  heroTagTxt: { fontSize: 9, fontWeight: "700", letterSpacing: 1.5 },
  heroDiscount: { color: "#fff", fontSize: 34, fontWeight: "400", lineHeight: 38, marginBottom: 4 },
  heroCond: { color: "rgba(242,232,217,0.65)", fontSize: 11, marginBottom: 14 },
  heroBottom: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  heroCodeLbl: { color: "rgba(242,232,217,0.45)", fontSize: 8, letterSpacing: 1.5, marginBottom: 4 },
  heroCodeBox: { borderColor: "rgba(201,151,90,0.45)", borderRadius: 9, borderStyle: "dashed", borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  heroCodeVal: { fontSize: 14, fontWeight: "700", letterSpacing: 2 },
  heroCTA: { backgroundColor: "#C0392B", borderRadius: 12, elevation: 6, paddingHorizontal: 18, paddingVertical: 11, shadowColor: "#C0392B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
  heroCTATxt: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  couponList: { paddingHorizontal: 18 },
  couponCard: { borderRadius: 18, borderWidth: 1, marginBottom: 12, overflow: "hidden", position: "relative" },
  couponStrip: { bottom: 0, left: 0, position: "absolute", top: 0, width: 4 },
  couponInner: { alignItems: "flex-start", flexDirection: "row", gap: 12, padding: 14, paddingLeft: 20 },
  couponBadge: { alignItems: "center", alignSelf: "flex-start", borderRadius: 6, borderWidth: 1, flexDirection: "row", marginBottom: 6, paddingHorizontal: 8, paddingVertical: 3 },
  couponBadgeTxt: { fontSize: 9, fontWeight: "700", letterSpacing: 0.4 },
  couponDiscount: { fontSize: 20, fontWeight: "600", lineHeight: 24, marginBottom: 4 },
  couponDesc: { fontSize: 10.5, lineHeight: 15, marginBottom: 9 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  metaChip: { alignItems: "center", borderRadius: 7, borderWidth: 1, flexDirection: "row", gap: 4, paddingHorizontal: 8, paddingVertical: 3 },
  metaTxt: { fontSize: 9.5 },
  couponRight: { alignItems: "flex-end", gap: 8 },
  codeWrap: { alignItems: "flex-end", marginBottom: 8 },
  codeLbl: { fontSize: 8, letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" },
  codeBox: { borderRadius: 9, borderStyle: "dashed", borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  codeVal: { fontSize: 12, fontWeight: "700", letterSpacing: 2 },
  copyTxt: { fontSize: 9, marginTop: 4 },
  applyBtn: { backgroundColor: "#C0392B", borderRadius: 10, elevation: 5, paddingHorizontal: 14, paddingVertical: 9, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.28, shadowRadius: 8 },
  applyBtnTxt: { color: "#fff", fontSize: 11, fontWeight: "600" },
  couponDivider: { borderStyle: "dashed", borderTopWidth: 1, height: 1, position: "relative" },
  scissor: { fontSize: 14, left: 14, position: "absolute" },
  seasonScroll: { marginHorizontal: -18 },
  seasonScrollContent: { gap: 11, paddingHorizontal: 18 },
  seasonCard: { borderRadius: 16, height: 140, overflow: "hidden", position: "relative", width: 148 },
  seasonImg: { height: "100%", opacity: 0.65, position: "absolute", width: "100%" },
  seasonBadge: { backgroundColor: "rgba(192,57,43,0.88)", borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3, position: "absolute", right: 9, top: 9 },
  seasonBadgeTxt: { color: "#fff", fontSize: 9, fontWeight: "700" },
  seasonContent: { bottom: 0, left: 0, padding: 12, position: "absolute", right: 0 },
  seasonIcon: { fontSize: 22, marginBottom: 4 },
  seasonLabel: { color: "#fff", fontSize: 13, fontWeight: "600", lineHeight: 17, marginBottom: 2 },
  seasonFrom: { fontSize: 10, fontWeight: "600" },
  referralCard: { borderRadius: 22, borderWidth: 1, overflow: "hidden", position: "relative" },
  refGlow: { backgroundColor: "transparent", bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  refInner: { padding: 20, position: "relative" },
  refTopRow: { alignItems: "flex-start", flexDirection: "row", gap: 12, justifyContent: "space-between", marginBottom: 16 },
  refBadge: { alignSelf: "flex-start", backgroundColor: "rgba(201,151,90,0.14)", borderColor: "rgba(201,151,90,0.28)", borderRadius: 8, borderWidth: 1, marginBottom: 8, paddingHorizontal: 10, paddingVertical: 4 },
  refBadgeTxt: { fontSize: 9, fontWeight: "600", letterSpacing: 1 },
  refHeadline: { fontSize: 24, fontWeight: "400", lineHeight: 30, marginBottom: 6 },
  refSub: { fontSize: 11, lineHeight: 16 },
  refCircle: { alignItems: "center", borderColor: "rgba(201,151,90,0.3)", borderRadius: 36, borderWidth: 1, flexShrink: 0, height: 72, justifyContent: "center", overflow: "hidden", width: 72 },
  refCircleAmt: { fontSize: 20, fontWeight: "400", lineHeight: 22 },
  refCircleLbl: { fontSize: 8, letterSpacing: 1 },
  stepsRow: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", marginBottom: 14, padding: 14 },
  stepItem: { alignItems: "center", flex: 1, gap: 4 },
  stepIconWrap: { alignItems: "center", backgroundColor: "rgba(192,57,43,0.12)", borderColor: "rgba(192,57,43,0.25)", borderRadius: 19, borderWidth: 1, height: 38, justifyContent: "center", width: 38 },
  stepNum: { fontSize: 8, letterSpacing: 0.5 },
  stepLbl: { fontSize: 9, fontWeight: "500", lineHeight: 13, textAlign: "center" },
  stepArrow: { fontSize: 14, marginBottom: 16, paddingHorizontal: 2 },
  refCodeBox: { alignItems: "center", borderRadius: 13, borderStyle: "dashed", borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginBottom: 14, paddingHorizontal: 14, paddingVertical: 12 },
  refCodeLbl: { fontSize: 9, letterSpacing: 1 },
  refCodeVal: { fontSize: 16, fontWeight: "700", letterSpacing: 3 },
  refCopyTxt: { fontSize: 10 },
  refCTA: { alignItems: "center", backgroundColor: "#C0392B", borderRadius: 14, elevation: 8, marginBottom: 10, paddingVertical: 14, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.32, shadowRadius: 14 },
  refCTATxt: { color: "#fff", fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
  refEarned: { alignItems: "center", flexDirection: "row", gap: 4, justifyContent: "center" },
  refEarnedLbl: { fontSize: 10 },
  refEarnedVal: { fontSize: 10, fontWeight: "600" },
  nav: { alignItems: "center", borderTopWidth: 1, bottom: 0, flexDirection: "row", height: 72, left: 0, position: "absolute", right: 0 },
  navItem: { alignItems: "center", flex: 1, gap: 4, justifyContent: "center", minHeight: 64 },
  navMark: { borderBottomLeftRadius: 2, borderBottomRightRadius: 2, height: 2, position: "absolute", top: 0, width: 22 },
  navIcon: { fontSize: 19 },
  navLabel: { fontSize: 9, fontWeight: "700" },
});
