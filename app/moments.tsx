import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useMomentraTheme } from "@/contexts/momentra-theme";
import { LuxuryBottomNav } from "@/components/luxury-bottom-nav";
import { supabase } from "@/lib/supabase";

const DARK = {
  bg: "#0D0905",
  surf: "#1A0E08",
  border: "rgba(201,151,90,0.18)",
  border2: "rgba(201,151,90,0.35)",
  text: "#F2E8D9",
  text2: "rgba(242,232,217,0.50)",
  text3: "rgba(242,232,217,0.26)",
  gold: "#C9975A",
  red: "#C0392B",
  chipBg: "#1C0E08",
  cardBg: "#1A0E08",
  navBg: "rgba(15,8,4,0.97)",
  tabBg: "#150B06",
  confirmBg: "rgba(39,174,96,0.14)",
  confirmC: "#1a9055",
  confirmBorder: "rgba(39,174,96,0.25)",
  pendingBg: "rgba(201,151,90,0.14)",
  pendingC: "#C9975A",
  pendingBorder: "rgba(201,151,90,0.25)",
};

const LIGHT = {
  bg: "#FFF8F2",
  surf: "#FFF0E6",
  border: "rgba(180,120,60,0.18)",
  border2: "rgba(180,120,60,0.38)",
  text: "#1E0A04",
  text2: "rgba(30,10,4,0.50)",
  text3: "rgba(30,10,4,0.30)",
  gold: "#8B5A1A",
  red: "#C0392B",
  chipBg: "#FFF0E6",
  cardBg: "#FFF0E6",
  navBg: "rgba(255,245,235,0.97)",
  tabBg: "#FAE8D8",
  confirmBg: "rgba(39,174,96,0.10)",
  confirmC: "#1a7a45",
  confirmBorder: "rgba(39,174,96,0.20)",
  pendingBg: "rgba(180,120,60,0.12)",
  pendingC: "#8B5A1A",
  pendingBorder: "rgba(180,120,60,0.25)",
};

const UPCOMING = [
  {
    id: 1,
    experienceId: "date-terrace",
    title: "Romantic Terrace Dinner",
    venue: "Rooftop Lounge • Vizag",
    date: "12 May 2026",
    time: "8:00 PM",
    status: "confirmed",
    daysLeft: 8,
    booking: "#MN-2345",
    guests: 2,
    totalAmount: 4999,
    img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=85",
  },
  {
    id: 2,
    experienceId: "birthday-terrace",
    title: "Birthday Celebration Setup",
    venue: "Urban Garden • Vizag",
    date: "18 May 2026",
    time: "7:00 PM",
    status: "pending",
    daysLeft: 14,
    booking: "#MN-2346",
    guests: 10,
    totalAmount: 6999,
    img: "https://images.unsplash.com/photo-1519671282429-b44b4a72b065?w=600&q=85",
  },
  {
    id: 3,
    experienceId: "custom-setup",
    title: "Banquet Hall Evening",
    venue: "The Grand Palace • Vizag",
    date: "25 May 2026",
    time: "6:30 PM",
    status: "confirmed",
    daysLeft: 21,
    booking: "#MN-2347",
    guests: 50,
    totalAmount: 15999,
    img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=85",
  },
];

const PAST = [
  {
    id: 4,
    experienceId: "date-beach",
    title: "Moonlight Beach Dinner",
    venue: "RK Beach • Vizag",
    date: "2 Apr 2026",
    rating: 5,
    img: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=400&q=80",
  },
  {
    id: 5,
    experienceId: "kitty-brunch",
    title: "Kitty Party Brunch",
    venue: "Novotel • Vizag",
    date: "15 Mar 2026",
    rating: 4,
    img: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&q=80",
  },
  {
    id: 6,
    experienceId: "corporate-dinner",
    title: "Corporate Dinner Night",
    venue: "Marriott • Vizag",
    date: "28 Feb 2026",
    rating: 0,
    img: "https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=400&q=80",
  },
];

const SAVED = [
  {
    id: 7,
    experienceId: "date-terrace",
    title: "Skyline Romance",
    venue: "Rooftop Lounge • Vizag",
    price: 4999,
    ppl: 2,
    rating: 4.9,
    reviews: 118,
    tag: "Best Seller",
    img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
  },
  {
    id: 8,
    experienceId: "birthday-poolside",
    title: "Poolside Birthday",
    venue: "Resort • Rushikonda",
    price: 8999,
    ppl: 8,
    rating: 4.7,
    reviews: 74,
    tag: "Trending",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  },
  {
    id: 9,
    experienceId: "custom-setup",
    title: "Garden Banquet Evening",
    venue: "Palm Resort • Vizag",
    price: 12999,
    ppl: 40,
    rating: 4.5,
    reviews: 41,
    tag: "New",
    img: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&q=80",
  },
];

const TABS = ["Upcoming", "Past", "Saved"] as const;

type UpcomingMoment = {
  booking: string;
  date: string;
  daysLeft: number;
  experienceId: string;
  guests: number;
  id: number | string;
  img: string;
  status: string;
  time: string;
  title: string;
  totalAmount: number;
  venue: string;
};
type PastMoment = (typeof PAST)[number];
type SavedMoment = (typeof SAVED)[number];
type TabIndex = 0 | 1 | 2;

type SupabaseBookingRow = {
  booking_date?: string | null;
  booking_time?: string | null;
  created_at?: string | null;
  guests?: number | string | null;
  experience_id?: string | number | null;
  experience_title?: string | null;
  id?: string | number | null;
  status?: string | null;
  total_amount?: number | string | null;
  venue?: string | null;
};

function numericValue(value: number | string | null | undefined, fallback: number) {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(parsed) ? Number(parsed) : fallback;
}

function mapBookingToMoment(row: SupabaseBookingRow, index: number): UpcomingMoment {
  const fallback = UPCOMING[index % UPCOMING.length];
  const date = row.booking_date || fallback.date;

  return {
    booking: `#MN-${row.id ?? index + 1}`,
    date,
    daysLeft: getDaysLeft(date),
    experienceId: String(row.experience_id ?? fallback.experienceId),
    guests: numericValue(row.guests, fallback.guests),
    id: row.id ?? `booking-${index}`,
    img: fallback.img,
    status: row.status ?? "confirmed",
    time: row.booking_time || fallback.time,
    title: row.experience_title || fallback.title,
    totalAmount: numericValue(row.total_amount, fallback.totalAmount),
    venue: row.venue || fallback.venue,
  };
}

function getDaysLeft(date: string) {
  const parsed = Date.parse(date);
  if (Number.isNaN(parsed)) return 0;
  const diff = Math.ceil((parsed - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export default function MomentsScreen() {
  const router = useRouter();
  const { isDark } = useMomentraTheme();
  const [activeTab, setActiveTab] = useState<TabIndex>(0);
  const [bookings, setBookings] = useState<SupabaseBookingRow[]>([]);
  const [starRatings, setStarRatings] = useState<Record<number, number>>({});
  const T = isDark ? DARK : LIGHT;

  useFocusEffect(useCallback(() => {
    let mounted = true;

    async function fetchConfirmedBookings() {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, experience_title, venue, booking_date, booking_time, guests, total_amount, status, created_at")
        .in("status", ["confirmed", "pending"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("MOMENTS BOOKINGS ERROR:", JSON.stringify(error, null, 2));
        return;
      }

      console.log("MOMENTS BOOKINGS DATA:", data);

      if (mounted) {
        setBookings(data ?? []);
      }
    }

    fetchConfirmedBookings();

    return () => {
      mounted = false;
    };
  }, []));

  function setRating(id: number, val: number) {
    setStarRatings((previous) => ({ ...previous, [id]: val }));
  }

  function openBookingSummary(item: UpcomingMoment) {
    router.push({
      pathname: "/booking-summary",
      params: {
        experienceId: item.experienceId,
        date: item.date,
        time: item.time,
      },
    } as never);
  }

  function openExperienceDetail(experienceId: string) {
    router.push({
      pathname: "/experience-detail",
      params: { experienceId },
    } as never);
  }

  function UpcomingCard({ item }: { item: UpcomingMoment }) {
    const isConfirmed = item.status === "confirmed";

    return (
      <Pressable
        onPress={() => openBookingSummary(item)}
        style={[s.upCard, { backgroundColor: T.cardBg, borderColor: T.border }]}
      >
        <View style={s.upImgWrap}>
          <Image source={{ uri: item.img }} style={s.upImg} resizeMode="cover" />
          <LinearGradient
            colors={["transparent", isDark ? "rgba(13,9,5,0.92)" : "rgba(255,248,242,0.88)"]}
            locations={[0.3, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              s.statusBadge,
              {
                backgroundColor: isConfirmed ? T.confirmBg : T.pendingBg,
                borderColor: isConfirmed ? T.confirmBorder : T.pendingBorder,
              },
            ]}
          >
            <Text style={[s.statusTxt, { color: isConfirmed ? T.confirmC : T.pendingC }]}>
              {isConfirmed ? "✓ Confirmed" : "⏳ Pending"}
            </Text>
          </View>
          <View style={s.daysBox}>
            <Text style={[s.daysNum, { color: T.gold }]}>{item.daysLeft}</Text>
            <Text style={s.daysLbl}>DAYS</Text>
          </View>
        </View>

        <View style={s.upBody}>
          <Text style={[s.upTitle, { color: T.text }]} numberOfLines={1}>{item.title}</Text>
          <View style={s.venueRow}>
            <Text style={{ color: T.text3, fontSize: 10 }}>📍</Text>
            <Text style={[s.venueTxt, { color: T.text2 }]} numberOfLines={1}>{item.venue}</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.metaScroll}>
            {[
              { icon: "📅", val: item.date },
              { icon: "⏰", val: item.time },
              { icon: "👥", val: `${item.guests} Guests` },
              { icon: "💰", val: `₹${item.totalAmount.toLocaleString("en-IN")}` },
              { icon: "🎫", val: item.booking },
            ].map((meta) => (
              <View
                key={meta.val}
                style={[s.metaChip, { backgroundColor: "rgba(201,151,90,0.07)", borderColor: T.border }]}
              >
                <Text style={{ fontSize: 11 }}>{meta.icon}</Text>
                <Text style={[s.metaTxt, { color: T.text2 }]}>{meta.val}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={s.upActions}>
            <Pressable onPress={() => openBookingSummary(item)} style={[s.btnView, { shadowColor: T.red }]}>
              <Text style={s.btnViewTxt}>View Details</Text>
            </Pressable>
            <Pressable style={[s.btnSecondary, { borderColor: T.border2 }]}>
              <Text style={[s.btnSecondaryTxt, { color: T.text2 }]}>Reschedule</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  }

  function PastCard({ item }: { item: PastMoment }) {
    const rated = starRatings[item.id] ?? item.rating;

    return (
      <View style={[s.sideCard, { backgroundColor: T.cardBg, borderColor: T.border }]}>
        <View style={s.sideImgCol}>
          <Image source={{ uri: item.img }} style={s.sideImg} resizeMode="cover" />
          <LinearGradient
            colors={["transparent", T.cardBg]}
            end={{ x: 1, y: 0 }}
            start={{ x: 0.5, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <View style={s.sideBody}>
          <View style={s.dateRow}>
            <Text style={{ fontSize: 10 }}>📅</Text>
            <Text style={[s.pastDate, { color: T.text3 }]}>{item.date}</Text>
          </View>
          <Text style={[s.sideTitle, { color: T.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[s.sideVenue, { color: T.text2 }]} numberOfLines={1}>{item.venue}</Text>
          <Text style={[s.rateLabel, { color: T.text3 }]}>
            {rated > 0 ? "Your rating:" : "Rate this moment:"}
          </Text>
          <View style={s.starRow}>
            {[1, 2, 3, 4, 5].map((index) => (
              <Pressable key={index} onPress={() => setRating(item.id, index)}>
                <Text style={{ color: index <= rated ? "#C9975A" : "rgba(201,151,90,0.25)", fontSize: 16 }}>
                  {index <= rated ? "★" : "☆"}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={s.sideActions}>
            <Pressable onPress={() => openExperienceDetail(item.experienceId)} style={[s.btnRebook, { borderColor: T.border2 }]}>
              <Text style={[s.btnRebookTxt, { color: T.gold }]}>↺ Rebook</Text>
            </Pressable>
            <Pressable style={s.btnReview}>
              <Text style={s.btnReviewTxt}>{rated > 0 ? "Edit Review" : "Write Review"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  function SavedCard({ item }: { item: SavedMoment }) {
    return (
      <View style={[s.sideCard, { backgroundColor: T.cardBg, borderColor: T.border }]}>
        <View style={s.sideImgCol}>
          <Image source={{ uri: item.img }} style={s.sideImg} resizeMode="cover" />
          <LinearGradient
            colors={["transparent", T.cardBg]}
            end={{ x: 1, y: 0 }}
            start={{ x: 0.5, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={s.savedHeart}>
            <Text style={{ fontSize: 12 }}>❤️</Text>
          </View>
        </View>
        <View style={s.sideBody}>
          <View style={[s.savedTag, { backgroundColor: "rgba(201,151,90,0.14)", borderColor: "rgba(201,151,90,0.22)" }]}>
            <Text style={[s.savedTagTxt, { color: T.gold }]}>✦ {item.tag}</Text>
          </View>
          <Text style={[s.sideTitle, { color: T.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[s.sideVenue, { color: T.text2 }]} numberOfLines={1}>📍 {item.venue}</Text>
          <View style={s.savedRatingRow}>
            <Text style={{ color: "#C9975A", fontSize: 11 }}>★</Text>
            <Text style={[s.savedRatVal, { color: T.gold }]}>{item.rating}</Text>
            <Text style={[s.savedRatCnt, { color: T.text3 }]}>({item.reviews})</Text>
          </View>
          <View style={s.savedBottomRow}>
            <View>
              <Text style={[s.savedPrice, { color: T.gold }]}>₹{item.price.toLocaleString("en-IN")}</Text>
              <Text style={[s.savedPpl, { color: T.text3 }]}>/ {item.ppl} People</Text>
            </View>
            <Pressable
              onPress={() => openExperienceDetail(item.experienceId)}
              style={[s.btnBookNow, { shadowColor: T.red }]}
            >
              <Text style={s.btnBookNowTxt}>Book Now</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  function EmptyState({ tab }: { tab: TabIndex }) {
    const configs: Record<TabIndex, { icon: string; title: string; sub: string }> = {
      0: { icon: "🗓️", title: "No bookings yet", sub: "Start by exploring celebrations near you." },
      1: { icon: "✨", title: "No past moments", sub: "Your celebration memories\nwill appear here." },
      2: { icon: "🤍", title: "Nothing saved yet", sub: "Save experiences you love\nto find them quickly later." },
    };
    const config = configs[tab];

    return (
      <View style={s.emptyWrap}>
        <View style={[s.emptyIconCircle, { backgroundColor: "rgba(201,151,90,0.07)", borderColor: T.border }]}>
          <Text style={{ fontSize: 36 }}>{config.icon}</Text>
        </View>
        <Text style={[s.emptyTitle, { color: T.text }]}>{config.title}</Text>
        <Text style={[s.emptySub, { color: T.text2 }]}>{config.sub}</Text>
        <Pressable onPress={() => router.push("/explore" as never)} style={[s.btnExplore, { shadowColor: T.red }]}>
          <Text style={s.btnExploreTxt}>Explore Experiences →</Text>
        </Pressable>
      </View>
    );
  }

  function SectionLabel({ count, label }: { count: number; label: string }) {
    return (
      <View style={s.secLbl}>
        <View style={[s.secLine, { backgroundColor: T.border }]} />
        <Text style={[s.secLblTxt, { color: T.text3 }]}>{count} {label}</Text>
        <View style={[s.secLine, { backgroundColor: T.border }]} />
      </View>
    );
  }

  function renderContent() {
    if (activeTab === 0) {
      const upcomingBookings = bookings.map(mapBookingToMoment);

      if (!bookings.length) return <EmptyState tab={0} />;
      return (
        <>
          <SectionLabel count={bookings.length} label="Upcoming" />
          {upcomingBookings.map((item) => <UpcomingCard key={item.id} item={item} />)}
        </>
      );
    }

    if (activeTab === 1) {
      if (!PAST.length) return <EmptyState tab={1} />;
      return (
        <>
          <SectionLabel count={PAST.length} label="Past Moments" />
          {PAST.map((item) => <PastCard key={item.id} item={item} />)}
        </>
      );
    }

    if (!SAVED.length) return <EmptyState tab={2} />;
    return (
      <>
        <SectionLabel count={SAVED.length} label="Saved Experiences" />
        {SAVED.map((item) => <SavedCard key={item.id} item={item} />)}
      </>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={s.header}>
        <View style={s.headerCopy}>
          <Text style={[s.headerTitle, { color: T.text }]}>Your Moments</Text>
          <Text style={[s.headerSub, { color: T.text2 }]}>Bookings, memories & saved experiences</Text>
        </View>
        <View style={s.headerRight}>
          <Pressable style={[s.hdrIconBtn, { backgroundColor: T.chipBg, borderColor: T.border }]}>
            <Text style={{ fontSize: 15 }}>🔔</Text>
          </Pressable>
        </View>
      </View>

      <View style={[s.tabsWrap, { backgroundColor: T.tabBg, borderColor: T.border }]}>
        {TABS.map((tab, index) => {
          const active = activeTab === index;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(index as TabIndex)}
              style={[s.tab, active && { backgroundColor: T.red, shadowColor: T.red }]}
            >
              <Text style={[s.tabTxt, { color: active ? "#fff" : T.text2, fontWeight: active ? "600" : "400" }]}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={s.contentContainer}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {renderContent()}
      </ScrollView>

      <LuxuryBottomNav active="Moments" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingTop: Platform.OS === "ios" ? 52 : 32 },
  header: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 16, paddingHorizontal: 20 },
  headerCopy: { flex: 1, paddingRight: 12 },
  headerTitle: { fontSize: 28, fontWeight: "400", lineHeight: 32 },
  headerSub: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  headerRight: { alignItems: "center", flexDirection: "row", gap: 8 },
  hdrIconBtn: { alignItems: "center", borderRadius: 18, borderWidth: 1, height: 36, justifyContent: "center", width: 36 },
  tabsWrap: { borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 3, marginBottom: 0, marginHorizontal: 20, padding: 4 },
  tab: { alignItems: "center", borderRadius: 11, elevation: 4, flex: 1, justifyContent: "center", paddingVertical: 9, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8 },
  tabTxt: { fontSize: 12 },
  contentContainer: { paddingBottom: Platform.OS === "ios" ? 118 : 102, paddingHorizontal: 18, paddingTop: 14 },
  secLbl: { alignItems: "center", flexDirection: "row", gap: 10, marginBottom: 12 },
  secLine: { flex: 1, height: 1 },
  secLblTxt: { fontSize: 9, fontWeight: "500", letterSpacing: 2, textTransform: "uppercase" },
  upCard: { borderRadius: 18, borderWidth: 1, marginBottom: 14, overflow: "hidden" },
  upImgWrap: { height: 155, position: "relative" },
  upImg: { height: "100%", opacity: 0.8, width: "100%" },
  statusBadge: { borderRadius: 8, borderWidth: 1, left: 10, paddingHorizontal: 10, paddingVertical: 4, position: "absolute", top: 10 },
  statusTxt: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  daysBox: { alignItems: "center", backgroundColor: "rgba(13,9,5,0.75)", borderColor: "rgba(201,151,90,0.25)", borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, position: "absolute", right: 10, top: 10 },
  daysNum: { fontSize: 18, fontWeight: "400", lineHeight: 20 },
  daysLbl: { color: "rgba(242,232,217,0.55)", fontSize: 8, letterSpacing: 0.5 },
  upBody: { padding: 13 },
  upTitle: { fontSize: 18, fontWeight: "400", marginBottom: 5 },
  venueRow: { alignItems: "center", flexDirection: "row", gap: 5, marginBottom: 10 },
  venueTxt: { flex: 1, fontSize: 11 },
  metaScroll: { marginBottom: 12 },
  metaChip: { alignItems: "center", borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 5, marginRight: 8, paddingHorizontal: 10, paddingVertical: 5 },
  metaTxt: { fontSize: 10.5 },
  upActions: { flexDirection: "row", gap: 8 },
  btnView: { alignItems: "center", backgroundColor: "#C0392B", borderRadius: 12, elevation: 6, flex: 1, paddingVertical: 11, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10 },
  btnViewTxt: { color: "#fff", fontSize: 12, fontWeight: "600" },
  btnSecondary: { alignItems: "center", borderRadius: 12, borderWidth: 1, justifyContent: "center", paddingHorizontal: 16, paddingVertical: 11 },
  btnSecondaryTxt: { fontSize: 12, fontWeight: "500" },
  sideCard: { borderRadius: 16, borderWidth: 1, flexDirection: "row", marginBottom: 12, minHeight: 150, overflow: "hidden" },
  sideImgCol: { position: "relative", width: 110 },
  sideImg: { height: "100%", opacity: 0.72, width: "100%" },
  sideBody: { flex: 1, padding: 12, paddingLeft: 9 },
  dateRow: { alignItems: "center", flexDirection: "row", gap: 5, marginBottom: 5 },
  sideTitle: { fontSize: 15, fontWeight: "600", lineHeight: 19, marginBottom: 3 },
  sideVenue: { fontSize: 10, marginBottom: 8 },
  pastDate: { fontSize: 10 },
  rateLabel: { fontSize: 9, marginBottom: 5 },
  starRow: { flexDirection: "row", gap: 3, marginBottom: 10 },
  sideActions: { flexDirection: "row", gap: 7, marginTop: "auto" },
  btnRebook: { alignItems: "center", borderRadius: 9, borderWidth: 1, flex: 1, paddingVertical: 8 },
  btnRebookTxt: { fontSize: 11, fontWeight: "500" },
  btnReview: { alignItems: "center", backgroundColor: "#C0392B", borderRadius: 9, flex: 1, paddingVertical: 8 },
  btnReviewTxt: { color: "#fff", fontSize: 11, fontWeight: "600" },
  savedHeart: { alignItems: "center", backgroundColor: "rgba(192,57,43,0.8)", borderRadius: 12, height: 24, justifyContent: "center", position: "absolute", right: 7, top: 7, width: 24 },
  savedTag: { alignItems: "center", alignSelf: "flex-start", borderRadius: 5, borderWidth: 1, flexDirection: "row", gap: 3, marginBottom: 5, paddingHorizontal: 7, paddingVertical: 2 },
  savedTagTxt: { fontSize: 8.5, fontWeight: "600" },
  savedRatingRow: { alignItems: "center", flexDirection: "row", gap: 4, marginBottom: 10 },
  savedRatVal: { fontSize: 10, fontWeight: "600" },
  savedRatCnt: { fontSize: 9 },
  savedBottomRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: "auto" },
  savedPrice: { fontSize: 18, fontWeight: "400", lineHeight: 20 },
  savedPpl: { fontSize: 9, marginTop: 1 },
  btnBookNow: { backgroundColor: "#C0392B", borderRadius: 9, elevation: 5, paddingHorizontal: 13, paddingVertical: 8, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.28, shadowRadius: 8 },
  btnBookNowTxt: { color: "#fff", fontSize: 11, fontWeight: "600" },
  emptyWrap: { alignItems: "center", paddingHorizontal: 28, paddingVertical: 48 },
  emptyIconCircle: { alignItems: "center", borderRadius: 45, borderWidth: 1, height: 90, justifyContent: "center", marginBottom: 20, width: 90 },
  emptyTitle: { fontSize: 22, fontWeight: "400", marginBottom: 8, textAlign: "center" },
  emptySub: { fontSize: 12, lineHeight: 18, marginBottom: 22, textAlign: "center" },
  btnExplore: { backgroundColor: "#C0392B", borderRadius: 14, elevation: 8, paddingHorizontal: 28, paddingVertical: 13, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.32, shadowRadius: 14 },
  btnExploreTxt: { color: "#fff", fontSize: 13, fontWeight: "600" },
  nav: { alignItems: "center", borderTopWidth: 1, bottom: 0, flexDirection: "row", height: 72, left: 0, position: "absolute", right: 0 },
  navItem: { alignItems: "center", flex: 1, gap: 4, justifyContent: "center", minHeight: 64 },
  navMark: { borderBottomLeftRadius: 2, borderBottomRightRadius: 2, height: 2, position: "absolute", top: 0, width: 22 },
  navIcon: { fontSize: 19 },
  navLabel: { fontSize: 9, fontWeight: "700" },
});
