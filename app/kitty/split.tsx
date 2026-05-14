import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";

import { DARK, LIGHT } from "@/constants/experiences";
import { findKittyPackage, findKittyVenue, kittyTotal } from "@/constants/kitty";
import { useMomentraTheme } from "@/contexts/momentra-theme";
import { WebEnquiryScreen } from "@/components/web-enquiry-screen";

type Guest = { name: string; phone: string };

const DEFAULT_GUESTS: Guest[] = [
  { name: "Priya Mehta", phone: "98765 43210" },
  { name: "Rekha Sharma", phone: "91234 56789" },
  { name: "Anjali Nair", phone: "99887 76655" },
  { name: "Sridevi Rao", phone: "98001 23456" },
  { name: "Kavitha Reddy", phone: "90099 88776" },
  { name: "Lakshmi Devi", phone: "91122 33445" },
  { name: "Meenakshi S.", phone: "98765 11223" },
  { name: "Deepa Krishnan", phone: "99001 22334" },
];

export default function KittySplitSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingDate?: string; bookingTime?: string; guests?: string; mode?: string; packageId?: string; venueId?: string }>();
  const { isDark } = useMomentraTheme();
  const T = isDark ? DARK : LIGHT;
  const selectedPackage = findKittyPackage(params.packageId);
  const venue = findKittyVenue(params.venueId);
  const [organizerName, setOrganizerName] = useState("Sunitha");
  const [message, setMessage] = useState("Ladies, our kitty is confirmed! Pay your share below and let us make it a night to remember.");
  const [guests, setGuests] = useState<Guest[]>(DEFAULT_GUESTS);
  const [minimumGuestThreshold, setMinimumGuestThreshold] = useState(6);
  const [paymentDeadline, setPaymentDeadline] = useState("5 days");
  const total = kittyTotal(selectedPackage.perHead, guests.length);
  const invitedGuests = useMemo(() => JSON.stringify(guests), [guests]);

  if (Platform.OS === "web") {
    const webGuests = Number.parseInt(params.guests ?? "12", 10) || 12;
    const webTotal = kittyTotal(selectedPackage.perHead, webGuests);

    return (
      <WebEnquiryScreen
        primaryLabel="Get Custom Plan"
        secondaryHref="/kitty"
        secondaryLabel="Back to Kitty Circle"
        subtitle="Share your group size, preferred date, and venue interest, and Momentra will help coordinate the plan for your circle."
        summary={[
          { label: "Venue", value: venue.name },
          { label: "Package", value: selectedPackage.name },
          { label: "Date", value: params.bookingDate ?? "Preferred date" },
          { label: "Time", value: params.bookingTime ?? "Preferred time" },
          { label: "Guests", value: `${webGuests} guests` },
          { label: "Estimated Plan", value: `₹${webTotal.toLocaleString("en-IN")}` },
        ]}
        title="Plan Your Kitty Circle"
        whatsappCategory="kitty"
      />
    );
  }

  if (params.mode !== "setup") {
    const fullPayGuests = Number.parseInt(params.guests ?? "12", 10) || 12;
    const fullPayTotal = kittyTotal(selectedPackage.perHead, fullPayGuests);

    return (
      <View style={[styles.root, { backgroundColor: T.bg }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View style={[styles.header, { borderBottomColor: T.border }]}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: T.border }]}>
            <Text style={[styles.backTxt, { color: T.gold }]}>←</Text>
          </Pressable>
          <View>
            <Text style={[styles.title, { color: T.text }]}>How would you like to book?</Text>
            <Text style={[styles.sub, { color: T.text3 }]}>Pay yourself or invite your circle to pay their share.</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.summary, { backgroundColor: T.card, borderColor: T.border }]}>
            <View style={styles.summaryCopy}>
              <Text style={[styles.summaryTitle, { color: T.text }]}>{venue.name}</Text>
              <Text style={[styles.summarySub, { color: T.text2 }]}>{selectedPackage.name} · {params.bookingDate} · {params.bookingTime}</Text>
            </View>
            <View style={styles.summaryPrice}>
              <Text style={[styles.perHead, { color: T.gold }]}>₹{selectedPackage.perHead.toLocaleString("en-IN")}</Text>
              <Text style={[styles.perHeadLabel, { color: T.text3 }]}>per head</Text>
            </View>
          </View>

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/kitty/confirm",
                params: {
                  ...params,
                  guests: String(fullPayGuests),
                  splitBooking: "false",
                },
              } as never)
            }
            style={[styles.choiceCard, { backgroundColor: T.card, borderColor: T.border }]}
          >
            <Text style={styles.choiceIcon}>💳</Text>
            <View style={styles.choiceCopy}>
              <Text style={[styles.choiceTitle, { color: T.text }]}>Pay Full Amount</Text>
              <Text style={[styles.choiceDesc, { color: T.text2 }]}>Use the regular checkout and confirm the whole Kitty booking yourself.</Text>
            </View>
            <Text style={[styles.choicePrice, { color: T.gold }]}>₹{fullPayTotal.toLocaleString("en-IN")} →</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              router.replace({
                pathname: "/kitty/split",
                params: { ...params, mode: "setup" },
              } as never)
            }
            style={[styles.choiceCard, { backgroundColor: "rgba(201,151,90,0.07)", borderColor: T.border2 }]}
          >
            <Text style={styles.choiceIcon}>👯</Text>
            <View style={styles.choiceCopy}>
              <Text style={[styles.choiceTitle, { color: T.text }]}>Split With Circle</Text>
              <Text style={[styles.choiceDesc, { color: T.text2 }]}>Invite guests to pay only their own share. The booking stays pending until your minimum pax have paid.</Text>
            </View>
            <Text style={[styles.choicePrice, { color: T.gold }]}>₹{selectedPackage.perHead.toLocaleString("en-IN")}/guest →</Text>
          </Pressable>

          <View style={[styles.promise, { borderColor: T.border }]}>
            <Text style={[styles.promiseTitle, { color: T.text }]}>Split payment protection</Text>
            <Text style={[styles.promiseText, { color: T.text2 }]}>For split bookings, Momentra tracks guest payments and confirms the booking only after the minimum guest threshold is reached.</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  function updateGuest(index: number, key: keyof Guest, value: string) {
    setGuests((current) => current.map((guest, i) => i === index ? { ...guest, [key]: value } : guest));
  }

  function addGuest() {
    setGuests((current) => [...current, { name: "", phone: "" }]);
  }

  function removeGuest(index: number) {
    setGuests((current) => current.filter((_, i) => i !== index));
    setMinimumGuestThreshold((current) => Math.min(current, Math.max(1, guests.length - 1)));
  }

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.header, { borderBottomColor: T.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: T.border }]}>
          <Text style={[styles.backTxt, { color: T.gold }]}>←</Text>
        </Pressable>
        <View>
          <Text style={[styles.title, { color: T.text }]}>Set Up Your Circle</Text>
          <Text style={[styles.sub, { color: T.text3 }]}>Add guests · they pay their own share</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.summary, { backgroundColor: T.card, borderColor: T.border }]}>
          <View style={styles.summaryCopy}>
            <Text style={[styles.summaryTitle, { color: T.text }]}>{venue.name}</Text>
            <Text style={[styles.summarySub, { color: T.text2 }]}>{selectedPackage.name} · {params.bookingDate} · {params.bookingTime}</Text>
          </View>
          <View style={styles.summaryPrice}>
            <Text style={[styles.perHead, { color: T.gold }]}>₹{selectedPackage.perHead.toLocaleString("en-IN")}</Text>
            <Text style={[styles.perHeadLabel, { color: T.text3 }]}>per head</Text>
          </View>
        </View>

        <View style={[styles.mathBar, { borderColor: T.border }]}>
          <MathItem label="Guests" value={String(guests.length)} />
          <Text style={styles.mathSep}>×</Text>
          <MathItem label="Per head" value={`₹${selectedPackage.perHead.toLocaleString("en-IN")}`} />
          <Text style={styles.mathSep}>=</Text>
          <MathItem label="Total collection" value={`₹${total.toLocaleString("en-IN")}`} />
        </View>

        <Card title="Organizer">
          <TextInput onChangeText={setOrganizerName} placeholder="Organizer name" placeholderTextColor={T.text3} style={[styles.input, { borderColor: T.border, color: T.text }]} value={organizerName} />
        </Card>

        <Card title="Personal Message">
          <TextInput
            multiline
            maxLength={140}
            onChangeText={setMessage}
            placeholder="Write a note for your circle"
            placeholderTextColor={T.text3}
            style={[styles.input, styles.messageInput, { borderColor: T.border, color: T.text }]}
            value={message}
          />
          <Text style={[styles.charCount, { color: T.text3 }]}>{message.length}/140</Text>
        </Card>

        <Card title={`Your Circle (${guests.length} guests)`}>
          {guests.map((guest, index) => (
            <View key={`${guest.name}-${index}`} style={styles.guestRow}>
              <TextInput onChangeText={(value) => updateGuest(index, "name", value)} placeholder="Guest name" placeholderTextColor={T.text3} style={[styles.guestInput, { borderColor: T.border, color: T.text }]} value={guest.name} />
              <TextInput onChangeText={(value) => updateGuest(index, "phone", value)} placeholder="Phone" placeholderTextColor={T.text3} style={[styles.phoneInput, { borderColor: T.border, color: T.text }]} value={guest.phone} />
              <Pressable onPress={() => removeGuest(index)} style={styles.removeBtn}><Text style={styles.removeTxt}>×</Text></Pressable>
            </View>
          ))}
          <Pressable onPress={addGuest} style={[styles.addBtn, { borderColor: T.border2 }]}>
            <Text style={[styles.addTxt, { color: T.gold }]}>+ Add Guest</Text>
          </Pressable>
        </Card>

        <Card title="Payment Deadline">
          <View style={styles.chips}>
            {["3 days", "5 days", "7 days", "Custom date"].map((deadline) => {
              const active = paymentDeadline === deadline;
              return (
                <Pressable key={deadline} onPress={() => setPaymentDeadline(deadline)} style={[styles.chip, { backgroundColor: active ? "rgba(201,151,90,0.12)" : "rgba(255,255,255,0.04)", borderColor: active ? T.border2 : T.border }]}>
                  <Text style={[styles.chipTxt, { color: active ? T.text : T.text2 }]}>{deadline}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card title="Minimum to Confirm">
          <View style={styles.thresholdRow}>
            <Text style={[styles.thresholdCopy, { color: T.text2 }]}>If fewer than {minimumGuestThreshold} guests pay, everyone is fully refunded and the booking is not confirmed.</Text>
            <View style={styles.thresholdCtrl}>
              <Pressable onPress={() => setMinimumGuestThreshold((current) => Math.max(1, current - 1))} style={[styles.roundBtn, { borderColor: T.border2 }]}><Text style={[styles.roundTxt, { color: T.gold }]}>−</Text></Pressable>
              <Text style={[styles.thresholdVal, { color: T.text }]}>{minimumGuestThreshold}</Text>
              <Pressable onPress={() => setMinimumGuestThreshold((current) => Math.min(guests.length, current + 1))} style={[styles.roundBtn, { borderColor: T.border2 }]}><Text style={[styles.roundTxt, { color: T.gold }]}>+</Text></Pressable>
            </View>
          </View>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: T.bg, borderTopColor: T.border }]}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/kitty/invite-preview",
              params: {
                ...params,
                guests: String(guests.length),
                invitedGuests,
                minimumGuestThreshold: String(minimumGuestThreshold),
                organizerMessage: message,
                organizerName,
                paymentDeadline,
                splitBooking: "true",
              },
            } as never)
          }
          style={[styles.cta, { backgroundColor: T.red }]}
        >
          <Text style={styles.ctaTxt}>Preview Invitation</Text>
          <Text style={styles.ctaSub}>Send to {guests.length} guests →</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MathItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.mathItem}>
      <Text style={styles.mathVal}>{value}</Text>
      <Text style={styles.mathLbl}>{label}</Text>
    </View>
  );
}

function Card({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: Platform.OS === "ios" ? 52 : 32 },
  header: { alignItems: "center", borderBottomWidth: 1, flexDirection: "row", gap: 12, padding: 16 },
  backBtn: { alignItems: "center", borderRadius: 17, borderWidth: 1, height: 34, justifyContent: "center", width: 34 },
  backTxt: { fontSize: 15, fontWeight: "800" },
  title: { fontSize: 20, fontWeight: "800" },
  sub: { fontSize: 11, marginTop: 2 },
  content: { padding: 18, paddingBottom: 132 },
  summary: { alignItems: "center", borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 12, padding: 12 },
  summaryCopy: { flex: 1 },
  summaryTitle: { fontSize: 13, fontWeight: "800" },
  summarySub: { fontSize: 10, marginTop: 3 },
  summaryPrice: { alignItems: "flex-end" },
  perHead: { fontSize: 17, fontWeight: "800" },
  perHeadLabel: { fontSize: 9 },
  mathBar: { backgroundColor: "rgba(201,151,90,0.06)", borderRadius: 12, borderWidth: 1, flexDirection: "row", marginBottom: 12, padding: 11 },
  mathItem: { alignItems: "center", flex: 1 },
  mathVal: { color: "#C9975A", fontSize: 15, fontWeight: "800", textAlign: "center" },
  mathLbl: { color: "rgba(242,232,217,0.36)", fontSize: 8.5, marginTop: 2, textAlign: "center" },
  mathSep: { alignSelf: "center", color: "rgba(201,151,90,0.3)", fontSize: 15 },
  card: { backgroundColor: "#1A0E08", borderColor: "rgba(201,151,90,0.16)", borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  cardTitle: { borderBottomColor: "rgba(201,151,90,0.16)", borderBottomWidth: 1, color: "#F2E8D9", fontSize: 16, fontWeight: "700", padding: 13 },
  cardBody: { padding: 13 },
  input: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, borderWidth: 1, fontSize: 13, padding: 12 },
  messageInput: { minHeight: 78, textAlignVertical: "top" },
  charCount: { fontSize: 10, marginTop: 5, textAlign: "right" },
  guestRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  guestInput: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, borderWidth: 1, flex: 1, fontSize: 12, padding: 10 },
  phoneInput: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, borderWidth: 1, fontSize: 12, padding: 10, width: 118 },
  removeBtn: { alignItems: "center", backgroundColor: "rgba(192,57,43,0.12)", borderRadius: 9, height: 38, justifyContent: "center", width: 32 },
  removeTxt: { color: "#C0392B", fontSize: 16, fontWeight: "800" },
  addBtn: { alignItems: "center", borderRadius: 11, borderStyle: "dashed", borderWidth: 1.5, padding: 10 },
  addTxt: { fontSize: 12, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 8 },
  chipTxt: { fontSize: 11, fontWeight: "700" },
  thresholdRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  thresholdCopy: { flex: 1, fontSize: 12, lineHeight: 18 },
  thresholdCtrl: { alignItems: "center", flexDirection: "row", gap: 8 },
  roundBtn: { alignItems: "center", borderRadius: 14, borderWidth: 1.5, height: 28, justifyContent: "center", width: 28 },
  roundTxt: { fontSize: 14, fontWeight: "900" },
  thresholdVal: { fontSize: 22, fontWeight: "500", minWidth: 24, textAlign: "center" },
  footer: { borderTopWidth: 1, bottom: 0, left: 0, padding: 18, paddingBottom: Platform.OS === "ios" ? 28 : 18, position: "absolute", right: 0 },
  cta: { alignItems: "center", borderRadius: 15, flexDirection: "row", justifyContent: "space-between", padding: 15 },
  ctaTxt: { color: "#fff", fontSize: 14, fontWeight: "800" },
  ctaSub: { color: "rgba(255,255,255,0.82)", fontSize: 13, fontWeight: "800" },
  choiceCard: { alignItems: "center", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 12, marginBottom: 12, padding: 14 },
  choiceIcon: { fontSize: 24 },
  choiceCopy: { flex: 1 },
  choiceTitle: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  choiceDesc: { fontSize: 11.5, lineHeight: 17 },
  choicePrice: { fontSize: 12, fontWeight: "900", textAlign: "right" },
  promise: { backgroundColor: "rgba(201,151,90,0.06)", borderRadius: 13, borderWidth: 1, padding: 13 },
  promiseTitle: { fontSize: 13, fontWeight: "800", marginBottom: 5 },
  promiseText: { fontSize: 11.5, lineHeight: 18 },
});
