import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useMomentraTheme } from "@/contexts/momentra-theme";
import { LuxuryBottomNav } from "@/components/luxury-bottom-nav";
import { firebaseAuth } from "@/firebase/config";

const DARK = {
  bg: "#0D0905",
  surf: "#1A0E08",
  surf2: "#231508",
  border: "rgba(201,151,90,0.16)",
  border2: "rgba(201,151,90,0.35)",
  text: "#F2E8D9",
  text2: "rgba(242,232,217,0.52)",
  text3: "rgba(242,232,217,0.26)",
  gold: "#C9975A",
  red: "#C0392B",
  red2: "#8B1A10",
  chipBg: "#1C0E08",
  cardBg: "#1A0E08",
  navBg: "rgba(15,8,4,0.97)",
  rowHover: "rgba(201,151,90,0.05)",
};

const LIGHT = {
  bg: "#FFF8F2",
  surf: "#FFF0E6",
  surf2: "#FAE8D8",
  border: "rgba(180,120,60,0.16)",
  border2: "rgba(180,120,60,0.38)",
  text: "#1E0A04",
  text2: "rgba(30,10,4,0.52)",
  text3: "rgba(30,10,4,0.30)",
  gold: "#8B5A1A",
  red: "#C0392B",
  red2: "#8B1A10",
  chipBg: "#FFF0E6",
  cardBg: "#FFF0E6",
  navBg: "rgba(255,245,235,0.97)",
  rowHover: "rgba(180,120,60,0.06)",
};

const IC = {
  gold: { bg: "rgba(201,151,90,0.12)", border: "rgba(201,151,90,0.20)" },
  red: { bg: "rgba(192,57,43,0.14)", border: "rgba(192,57,43,0.22)" },
  blue: { bg: "rgba(66,133,244,0.12)", border: "rgba(66,133,244,0.20)" },
  green: { bg: "rgba(39,174,96,0.12)", border: "rgba(39,174,96,0.20)" },
  purple: { bg: "rgba(155,89,182,0.12)", border: "rgba(155,89,182,0.20)" },
  orange: { bg: "rgba(230,126,34,0.12)", border: "rgba(230,126,34,0.20)" },
  teal: { bg: "rgba(26,188,156,0.12)", border: "rgba(26,188,156,0.20)" },
  grey: { bg: "rgba(201,151,90,0.07)", border: "rgba(201,151,90,0.16)" },
};

type IconColor = keyof typeof IC;
type RowRightType = "chevron" | "value" | "badge" | "toggle";
type BadgeType = "gold" | "green";

type SettingRowType = {
  id: string;
  icon: string;
  color: IconColor;
  label: string;
  sub: string;
  right: RowRightType;
  screen?: string;
  value?: string;
  badge?: string;
  badgeType?: BadgeType;
  dot?: boolean;
  highlight?: boolean;
};

type SettingSection = {
  label: string;
  rows: SettingRowType[];
};

const SETTINGS_SECTIONS: SettingSection[] = [
  {
    label: "Account",
    rows: [
      { id: "editProfile", icon: "👤", color: "gold", label: "Edit Profile", sub: "Name, email, photo", right: "chevron", screen: "EditProfile" },
      { id: "addresses", icon: "📍", color: "blue", label: "Saved Addresses", sub: "Home, Work, Other", right: "value", value: "2 saved", screen: "Addresses" },
      { id: "payment", icon: "💳", color: "green", label: "Payment Methods", sub: "UPI, cards, wallet", right: "badge", badge: "₹1,250 credits", badgeType: "gold", screen: "Payment" },
      { id: "notifications", icon: "🔔", color: "red", label: "Notifications", sub: "Bookings, offers, alerts", right: "badge", badge: "On", badgeType: "green", dot: true, screen: "Notifications" },
    ],
  },
  {
    label: "Preferences",
    rows: [
      { id: "city", icon: "🏙️", color: "orange", label: "City", sub: "Shows experiences near you", right: "value", value: "Vizag", highlight: true, screen: "CitySelect" },
      { id: "theme", icon: "🎨", color: "purple", label: "Theme", sub: "", right: "toggle" },
    ],
  },
  {
    label: "Activity",
    rows: [
      { id: "bookings", icon: "🗓️", color: "teal", label: "My Bookings", sub: "Upcoming, past, cancelled", right: "badge", badge: "3 upcoming", badgeType: "gold", screen: "MomentsScreen" },
      { id: "saved", icon: "❤️", color: "red", label: "Saved Experiences", sub: "Your wishlist", right: "value", value: "5 saved", screen: "MomentsScreen" },
    ],
  },
  {
    label: "Support",
    rows: [
      { id: "help", icon: "🎧", color: "blue", label: "Help & Support", sub: "Chat, call, ticket", right: "chevron", screen: "Help" },
      { id: "contact", icon: "💬", color: "green", label: "Contact Us", sub: "Email, WhatsApp", right: "chevron", screen: "Contact" },
      { id: "faq", icon: "❓", color: "gold", label: "FAQs", sub: "Quick answers", right: "chevron", screen: "FAQs" },
    ],
  },
  {
    label: "Legal",
    rows: [
      { id: "privacy", icon: "🔒", color: "grey", label: "Privacy Policy", sub: "", right: "chevron", screen: "Privacy" },
      { id: "terms", icon: "📄", color: "grey", label: "Terms & Conditions", sub: "", right: "chevron", screen: "Terms" },
    ],
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { isDark, setIsDark } = useMomentraTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const T = isDark ? DARK : LIGHT;
  const userPhone = user?.phone ?? "Not available";
  const initials = useMemo(() => {
    const digits = user?.phone?.replace(/\D/g, "") ?? "";
    return digits ? digits.slice(-2) : "M";
  }, [user?.phone]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      console.log("[Momentra auth] Firebase profile auth state", {
        hasUser: Boolean(firebaseUser),
        phone: firebaseUser?.phoneNumber ?? null,
        uid: firebaseUser?.uid ?? null,
      });

      if (!firebaseUser) {
        setUser(null);
        setLoadingSession(false);
        router.replace("/login" as never);
        return;
      }

      setUser(firebaseUser);
      setLoadingSession(false);
    });

    return unsubscribe;
  }, [router]);

  function toggleTheme() {
    setIsDark((previous) => !previous);
  }

  function handleRow(row: SettingRowType) {
    if (row.id === "theme") return;
    if (row.screen === "MomentsScreen") {
      router.push("/moments" as never);
      return;
    }
    Alert.alert(row.label, `Opening ${row.label}...`);
  }

  async function performLogout() {
    await signOut(firebaseAuth);
    router.replace("/login" as never);
  }

  function handleLogout() {
    if (Platform.OS === "web") {
      const confirmed =
        typeof window === "undefined" ||
        window.confirm("Are you sure you want to log out of Momentra?");

      if (confirmed) {
        performLogout();
      }

      return;
    }

    Alert.alert("Log Out", "Are you sure you want to log out of Momentra?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: performLogout,
      },
    ]);
  }

  function IconBox({ icon, color }: { icon: string; color: IconColor }) {
    return (
      <View style={[s.iconBox, { backgroundColor: IC[color].bg, borderColor: IC[color].border }]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
    );
  }

  function RowRight({ row }: { row: SettingRowType }) {
    if (row.right === "toggle") {
      return (
        <Switch
          ios_backgroundColor="rgba(201,151,90,0.15)"
          onValueChange={toggleTheme}
          thumbColor={isDark ? T.gold : T.red}
          trackColor={{ false: "rgba(201,151,90,0.2)", true: "rgba(201,151,90,0.28)" }}
          value={isDark}
        />
      );
    }

    if (row.right === "badge") {
      const isGold = row.badgeType === "gold";
      const isGreen = row.badgeType === "green";
      return (
        <View style={s.rowRightWrap}>
          <View
            style={[
              s.badge,
              isGold && { backgroundColor: "rgba(201,151,90,0.14)", borderColor: "rgba(201,151,90,0.22)" },
              isGreen && { backgroundColor: "rgba(39,174,96,0.12)", borderColor: "rgba(39,174,96,0.20)" },
            ]}
          >
            <Text style={[
              s.badgeTxt,
              isGold && { color: T.gold },
              isGreen && { color: "#1a9055" },
            ]}>
              {row.badge}
            </Text>
          </View>
          {row.dot ? <View style={s.notifDot} /> : null}
          <Text style={[s.chevron, { color: T.text3 }]}>›</Text>
        </View>
      );
    }

    if (row.right === "value") {
      return (
        <View style={s.rowRightWrap}>
          <Text style={[s.rowVal, { color: row.highlight ? T.gold : T.text3, fontWeight: row.highlight ? "500" : "400" }]}>
            {row.value}
          </Text>
          <Text style={[s.chevron, { color: T.text3 }]}>›</Text>
        </View>
      );
    }

    return <Text style={[s.chevron, { color: T.text3 }]}>›</Text>;
  }

  function SettingRow({ row, isLast }: { row: SettingRowType; isLast: boolean }) {
    return (
      <TouchableOpacity
        activeOpacity={row.right === "toggle" ? 1 : 0.7}
        onPress={() => handleRow(row)}
        style={[s.row, !isLast && { borderBottomColor: T.border, borderBottomWidth: 1 }]}
      >
        <IconBox color={row.color} icon={row.icon} />
        <View style={s.rowText}>
          <Text style={[s.rowLabel, { color: T.text }]}>{row.label}</Text>
          {row.sub ? <Text style={[s.rowSub, { color: T.text3 }]}>{row.sub}</Text> : null}
        </View>
        <RowRight row={row} />
      </TouchableOpacity>
    );
  }

  function Section({ section }: { section: SettingSection }) {
    return (
      <View style={s.sectionGroup}>
        <Text style={[s.sectionLabel, { color: T.text3 }]}>{section.label.toUpperCase()}</Text>
        <View style={[s.sectionCard, { backgroundColor: T.cardBg, borderColor: T.border }]}>
          {section.rows.map((row, index) => (
            <SettingRow key={row.id} isLast={index === section.rows.length - 1} row={row} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {loadingSession ? (
        <View style={s.loadingWrap}>
          <Text style={[s.loadingText, { color: T.text2 }]}>Checking your Momentra session...</Text>
        </View>
      ) : !user ? (
        <View style={s.loadingWrap}>
          <Text style={[s.loadingText, { color: T.text2 }]}>Redirecting to login...</Text>
        </View>
      ) : (
        <>

      <View style={[s.hero, { borderBottomColor: T.border }]}>
        <LinearGradient
          colors={["rgba(192,57,43,0.06)", "transparent"]}
          end={{ x: 1, y: 0.5 }}
          start={{ x: 0, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />

          <View style={s.profileRow}>
          <View style={s.avatarWrap}>
            <LinearGradient colors={["rgba(192,57,43,0.3)", "rgba(201,151,90,0.2)"]} style={s.avatar}>
              <Text style={s.avatarInitials}>{initials}</Text>
            </LinearGradient>
            <TouchableOpacity style={[s.avatarEdit, { backgroundColor: T.red, borderColor: T.bg }]}>
              <Text style={{ fontSize: 10 }}>✏️</Text>
            </TouchableOpacity>
          </View>

          <View style={s.userInfo}>
            <Text style={[s.userName, { color: T.text }]}>Momentra Customer</Text>
            <Text style={[s.userPhone, { color: T.text2 }]}>{userPhone}</Text>
            <View style={s.userBadgeRow}>
              <View style={s.goldBadge}>
                <Text style={[s.userBadgeTxt, { color: T.gold }]}>✓ Phone verified</Text>
              </View>
              <View style={s.redBadge}>
                <Text style={[s.userBadgeTxt, { color: T.red }]}>Supabase Auth</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => Alert.alert("Edit Profile", "Opening Edit Profile...")}
          style={[s.editBtn, { backgroundColor: T.surf, borderColor: T.border2 }]}
        >
          <Text style={{ fontSize: 13 }}>✏️</Text>
          <Text style={[s.editBtnTxt, { color: T.text2 }]}>Edit Profile</Text>
        </TouchableOpacity>

        <View style={s.statsRow}>
          {[
            { num: "0", lbl: "Bookings" },
            { num: "0", lbl: "Saved" },
            { num: "New", lbl: "Status" },
            { num: "Live", lbl: "Session" },
          ].map((stat) => (
            <View key={stat.lbl} style={[s.statBox, { backgroundColor: T.surf, borderColor: T.border }]}>
              <Text style={[s.statNum, { color: T.gold }]}>{stat.num}</Text>
              <Text style={[s.statLbl, { color: T.text3 }]}>{stat.lbl.toUpperCase()}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={s.settingsBody} showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {SETTINGS_SECTIONS.map((section) => (
          <Section key={section.label} section={section} />
        ))}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          style={[s.logoutBtn, { backgroundColor: "rgba(192,57,43,0.09)", borderColor: "rgba(192,57,43,0.38)" }]}
        >
          <Text style={{ fontSize: 18 }}>🚪</Text>
          <Text style={[s.logoutTxt, { color: T.red }]}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[s.versionTxt, { color: T.text3 }]}>
          Momentra v1.0.0 · Made with ❤️ in Vizag
        </Text>
      </ScrollView>

      <LuxuryBottomNav active="Profile" />
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingTop: Platform.OS === "ios" ? 52 : 32 },
  loadingWrap: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 },
  loadingText: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  hero: { borderBottomWidth: 1, overflow: "hidden", paddingBottom: 18, paddingHorizontal: 20, paddingTop: 16 },
  profileRow: { alignItems: "center", flexDirection: "row", gap: 16, marginBottom: 14 },
  avatarWrap: { flexShrink: 0, position: "relative" },
  avatar: { alignItems: "center", borderColor: "rgba(201,151,90,0.4)", borderRadius: 36, borderWidth: 2, height: 72, justifyContent: "center", width: 72 },
  avatarInitials: { color: "#F2E8D9", fontSize: 26, fontWeight: "600" },
  avatarEdit: { alignItems: "center", borderRadius: 11, borderWidth: 2, bottom: 0, height: 22, justifyContent: "center", position: "absolute", right: 0, width: 22 },
  userInfo: { flex: 1 },
  userName: { fontSize: 22, fontWeight: "400", marginBottom: 2 },
  userPhone: { fontSize: 12, marginBottom: 8 },
  userBadgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  goldBadge: { backgroundColor: "rgba(201,151,90,0.14)", borderColor: "rgba(201,151,90,0.25)", borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 3 },
  redBadge: { backgroundColor: "rgba(192,57,43,0.12)", borderColor: "rgba(192,57,43,0.22)", borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 3 },
  userBadgeTxt: { fontSize: 9.5, fontWeight: "500" },
  editBtn: { alignItems: "center", alignSelf: "flex-start", borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 8, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 10 },
  editBtnTxt: { fontSize: 12, fontWeight: "500" },
  statsRow: { flexDirection: "row", gap: 10 },
  statBox: { alignItems: "center", borderRadius: 13, borderWidth: 1, flex: 1, paddingVertical: 12 },
  statNum: { fontSize: 20, fontWeight: "400", lineHeight: 22 },
  statLbl: { fontSize: 8, letterSpacing: 0.5, marginTop: 2 },
  settingsBody: { paddingBottom: 128, paddingHorizontal: 18, paddingTop: 16 },
  sectionGroup: { marginBottom: 18 },
  sectionLabel: { fontSize: 9, fontWeight: "500", letterSpacing: 2.5, marginBottom: 9, paddingLeft: 4 },
  sectionCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  row: { alignItems: "center", flexDirection: "row", gap: 13, paddingHorizontal: 14, paddingVertical: 13 },
  iconBox: { alignItems: "center", borderRadius: 10, borderWidth: 1, flexShrink: 0, height: 34, justifyContent: "center", width: 34 },
  rowText: { flex: 1, minWidth: 0 },
  rowLabel: { fontSize: 13, fontWeight: "400" },
  rowSub: { fontSize: 10, marginTop: 1 },
  rowRightWrap: { alignItems: "center", flexDirection: "row", gap: 6 },
  rowVal: { fontSize: 11 },
  chevron: { fontSize: 18, lineHeight: 20, opacity: 0.6 },
  badge: { borderRadius: 7, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 10, fontWeight: "500" },
  notifDot: { backgroundColor: "#C0392B", borderRadius: 4, height: 7, width: 7 },
  logoutBtn: { alignItems: "center", borderRadius: 15, borderWidth: 1.5, flexDirection: "row", gap: 10, justifyContent: "center", marginBottom: 14, paddingVertical: 14 },
  logoutTxt: { fontSize: 14, fontWeight: "600", letterSpacing: 0.3 },
  versionTxt: { fontSize: 10, paddingBottom: 16, textAlign: "center" },
  nav: { alignItems: "center", borderTopWidth: 1, bottom: 0, flexDirection: "row", height: 72, left: 0, position: "absolute", right: 0 },
  navItem: { alignItems: "center", flex: 1, gap: 4, justifyContent: "center", minHeight: 64 },
  navMark: { borderBottomLeftRadius: 2, borderBottomRightRadius: 2, height: 2, position: "absolute", top: 0, width: 22 },
  navIcon: { fontSize: 19 },
  navLabel: { fontSize: 9, fontWeight: "700" },
});
