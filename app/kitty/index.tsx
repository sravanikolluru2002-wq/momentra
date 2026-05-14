import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
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
import { Calendar } from "react-native-calendars";

import { DARK, LIGHT } from "@/constants/experiences";
import { KITTY_PACKAGES, kittyTotal } from "@/constants/kitty";
import { useMomentraTheme } from "@/contexts/momentra-theme";

const TIME_SLOTS = ["11:30 AM - 2:30 PM", "4:00 PM - 7:00 PM", "7:30 PM - 10:30 PM"];

function getTomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export default function KittyScreen() {
  const router = useRouter();
  const { isDark } = useMomentraTheme();
  const T = isDark ? DARK : LIGHT;
  const minDate = useMemo(getTomorrow, []);
  const [guests, setGuests] = useState(12);
  const [packageId, setPackageId] = useState(KITTY_PACKAGES[0].id);
  const [selectedDate, setSelectedDate] = useState(minDate);
  const [selectedTime, setSelectedTime] = useState(TIME_SLOTS[0]);
  const selectedPackage = KITTY_PACKAGES.find((item) => item.id === packageId) ?? KITTY_PACKAGES[0];

  function changeGuests(delta: number) {
    setGuests((current) => Math.max(5, Math.min(30, current + delta)));
  }

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=700&q=85" }}
            style={styles.heroImage}
          />
          <LinearGradient colors={["rgba(13,9,5,0.25)", "rgba(13,9,5,0.88)", T.bg]} style={StyleSheet.absoluteFill} />
          <View style={styles.heroTop}>
            <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: T.border }]}>
              <Text style={[styles.backTxt, { color: T.gold }]}>←</Text>
            </Pressable>
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>👯 Kitty Circle</Text>
            </View>
          </View>
          <View style={styles.heroBottom}>
            <Text style={[styles.heroTitle, { color: T.text }]}>
              Your Circle.{"\n"}Your <Text style={{ color: T.gold, fontStyle: "italic" }}>Celebration.</Text>
            </Text>
            <Text style={[styles.heroSub, { color: T.text2 }]}>Private venues · curated setup · zero planning stress</Text>
          </View>
        </View>

        <View style={[styles.guestCard, { backgroundColor: T.card, borderColor: T.border }]}>
          <Text style={[styles.label, { color: T.text3 }]}>How many in your circle?</Text>
          <View style={styles.guestRow}>
            <View style={styles.guestCtrl}>
              <Pressable onPress={() => changeGuests(-1)} style={[styles.guestBtn, { borderColor: T.border2 }]}>
                <Text style={[styles.guestBtnTxt, { color: T.gold }]}>−</Text>
              </Pressable>
              <Text style={[styles.guestCount, { color: T.text }]}>{guests}</Text>
              <Pressable onPress={() => changeGuests(1)} style={[styles.guestBtn, { borderColor: T.border2 }]}>
                <Text style={[styles.guestBtnTxt, { color: T.gold }]}>+</Text>
              </Pressable>
            </View>
            <Text style={[styles.guestHint, { color: T.text3 }]}>women</Text>
          </View>
          <View style={[styles.mathBox, { borderColor: T.border }]}>
            <Text style={[styles.mathTxt, { color: T.gold }]}>{guests}</Text>
            <Text style={styles.mathSep}>×</Text>
            <Text style={[styles.mathTxt, { color: T.gold }]}>₹{selectedPackage.perHead.toLocaleString("en-IN")}</Text>
            <Text style={styles.mathSep}>=</Text>
            <Text style={[styles.mathTxt, { color: T.text }]}>₹{kittyTotal(selectedPackage.perHead, guests).toLocaleString("en-IN")}</Text>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: T.text }]}>Select Date</Text>
          <View style={[styles.calendarWrap, { backgroundColor: T.card, borderColor: T.border }]}>
            <Calendar
              minDate={minDate}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  selectedColor: T.red,
                  selectedTextColor: "#fff",
                },
              }}
              onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
              theme={{
                arrowColor: T.gold,
                calendarBackground: T.card,
                dayTextColor: T.text,
                monthTextColor: T.gold,
                selectedDayBackgroundColor: T.red,
                selectedDayTextColor: "#fff",
                textDisabledColor: isDark ? "rgba(242,232,217,0.22)" : "rgba(30,10,4,0.22)",
                textMonthFontWeight: "800",
                textSectionTitleColor: T.text2,
                todayTextColor: T.gold,
              }}
            />
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: T.text }]}>Select Time</Text>
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map((slot) => {
              const active = selectedTime === slot;
              return (
                <Pressable
                  key={slot}
                  onPress={() => setSelectedTime(slot)}
                  style={[styles.timeChip, { backgroundColor: active ? T.red : T.card, borderColor: active ? T.red : T.border }]}
                >
                  <Text style={[styles.timeTxt, { color: active ? "#fff" : T.text2 }]}>{slot}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: T.text }]}>Choose Your Package</Text>
        {KITTY_PACKAGES.map((item) => {
          const selected = item.id === packageId;
          return (
            <Pressable
              key={item.id}
              onPress={() => setPackageId(item.id)}
              style={[styles.packageCard, { backgroundColor: T.card, borderColor: selected ? T.gold : T.border }]}
            >
              <View style={styles.packageTop}>
                <Text style={[styles.packageName, { color: T.text }]}>{item.name}</Text>
                <View style={[styles.packageBadge, { borderColor: selected ? T.gold : T.border }]}>
                  <Text style={[styles.packageBadgeTxt, { color: selected ? T.gold : T.text2 }]}>{item.badge}</Text>
                </View>
              </View>
              <Text style={[styles.packageDesc, { color: T.text2 }]}>{item.desc}</Text>
              <View style={styles.includeRow}>
                {item.includes.map((include) => (
                  <View key={include.name} style={[styles.includeChip, { borderColor: T.border }]}>
                    <Text style={[styles.includeTxt, { color: T.text2 }]}>{include.icon} {include.name}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.packageBottom}>
                <View>
                  <Text style={[styles.perHead, { color: T.text3 }]}>Per head</Text>
                  <Text style={[styles.price, { color: T.gold }]}>₹{item.perHead.toLocaleString("en-IN")}</Text>
                </View>
                <Text style={[styles.selectTxt, { color: selected ? T.gold : T.text3 }]}>{selected ? "✓ Selected" : "Select"}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: T.bg, borderTopColor: T.border }]}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/kitty/venues",
              params: {
                bookingDate: selectedDate,
                bookingTime: selectedTime,
                guests: String(guests),
                packageId,
              },
            } as never)
          }
          style={[styles.cta, { backgroundColor: T.red }]}
        >
          <Text style={styles.ctaTxt}>See Venues for This Package</Text>
          <Text style={styles.ctaSub}>₹{selectedPackage.perHead.toLocaleString("en-IN")}/head →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: Platform.OS === "ios" ? 52 : 32 },
  content: { paddingBottom: 120 },
  hero: { height: 260, overflow: "hidden", position: "relative" },
  heroImage: { ...StyleSheet.absoluteFillObject, opacity: 0.62 },
  heroTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", left: 18, position: "absolute", right: 18, top: 18 },
  backBtn: { alignItems: "center", borderRadius: 17, borderWidth: 1, height: 34, justifyContent: "center", width: 34 },
  backTxt: { fontSize: 15, fontWeight: "700" },
  badge: { backgroundColor: "rgba(232,130,154,0.18)", borderColor: "rgba(232,130,154,0.3)", borderRadius: 9, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  badgeTxt: { color: "#E8829A", fontSize: 9, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  heroBottom: { bottom: 20, left: 18, position: "absolute", right: 18 },
  heroTitle: { fontSize: 32, fontWeight: "300", lineHeight: 36 },
  heroSub: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  guestCard: { borderRadius: 15, borderWidth: 1, margin: 16, marginBottom: 14, padding: 16 },
  label: { fontSize: 10, fontWeight: "600", letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" },
  guestRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  guestCtrl: { alignItems: "center", flexDirection: "row", gap: 14 },
  guestBtn: { alignItems: "center", borderRadius: 17, borderWidth: 1.5, height: 34, justifyContent: "center", width: 34 },
  guestBtnTxt: { fontSize: 18 },
  guestCount: { fontSize: 28, fontWeight: "300", minWidth: 36, textAlign: "center" },
  guestHint: { fontSize: 11 },
  mathBox: { alignItems: "center", backgroundColor: "rgba(201,151,90,0.06)", borderRadius: 11, borderWidth: 1, flexDirection: "row", justifyContent: "space-around", padding: 10 },
  mathTxt: { fontSize: 15, fontWeight: "700" },
  mathSep: { color: "rgba(201,151,90,0.35)", fontSize: 16 },
  sectionBlock: { marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: "500", marginBottom: 12, paddingHorizontal: 16 },
  calendarWrap: { borderRadius: 14, borderWidth: 1, marginHorizontal: 16, overflow: "hidden", paddingBottom: 6 },
  timeGrid: { gap: 8, paddingHorizontal: 16 },
  timeChip: { alignItems: "center", borderRadius: 12, borderWidth: 1, paddingVertical: 11 },
  timeTxt: { fontSize: 12, fontWeight: "700" },
  packageCard: { borderRadius: 17, borderWidth: 1.5, marginHorizontal: 16, marginBottom: 11, padding: 16 },
  packageTop: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  packageName: { fontSize: 19, fontWeight: "500" },
  packageBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4 },
  packageBadgeTxt: { fontSize: 9, fontWeight: "700" },
  packageDesc: { fontSize: 11, lineHeight: 17, marginBottom: 11 },
  includeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  includeChip: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 7, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  includeTxt: { fontSize: 9.5 },
  packageBottom: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between" },
  perHead: { fontSize: 10 },
  price: { fontSize: 22, fontWeight: "500" },
  selectTxt: { fontSize: 12, fontWeight: "700" },
  footer: { borderTopWidth: 1, bottom: 0, left: 0, padding: 18, paddingBottom: Platform.OS === "ios" ? 28 : 18, position: "absolute", right: 0 },
  cta: { alignItems: "center", borderRadius: 15, flexDirection: "row", justifyContent: "space-between", padding: 15 },
  ctaTxt: { color: "#fff", fontSize: 14, fontWeight: "700" },
  ctaSub: { color: "rgba(255,255,255,0.82)", fontSize: 13, fontWeight: "700" },
});
