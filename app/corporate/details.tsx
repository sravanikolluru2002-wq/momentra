import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Calendar } from "react-native-calendars";
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";

import { CORPORATE_BUDGETS, CORPORATE_REQUIREMENTS, CORPORATE_TIME_SLOTS, findCorporateEventType } from "@/constants/corporate";
import { DARK, LIGHT } from "@/constants/experiences";
import { useMomentraTheme } from "@/contexts/momentra-theme";

function getTomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export default function CorporateDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ eventTypeId?: string }>();
  const { isDark } = useMomentraTheme();
  const T = isDark ? DARK : LIGHT;
  const eventType = findCorporateEventType(params.eventTypeId);
  const minDate = useMemo(getTomorrow, []);
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [guests, setGuests] = useState(20);
  const [date, setDate] = useState(minDate);
  const [time, setTime] = useState(CORPORATE_TIME_SLOTS[1]);
  const [budget, setBudget] = useState(CORPORATE_BUDGETS[1]);
  const [requirements, setRequirements] = useState<string[]>(["projector", "mic"]);
  const [notes, setNotes] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  function changeGuests(delta: number) {
    setGuests((current) => Math.max(5, Math.min(200, current + delta)));
  }

  function toggleRequirement(id: string) {
    setRequirements((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.header, { borderBottomColor: T.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: T.border }]}>
          <Text style={[styles.backTxt, { color: T.gold }]}>←</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: T.text }]}>Event Details</Text>
          <Text style={[styles.sub, { color: T.text2 }]}>{eventType.label} · GST-ready planning</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Field label="Company Name" onChangeText={setCompany} placeholder="e.g. Infosys, Startup Name, Agency" value={company} />
        <View style={styles.twoCol}>
          <Field label="Your Name" onChangeText={setContactName} placeholder="Full name" value={contactName} />
          <Field label="Your Role" onChangeText={setRole} placeholder="HR / Admin / Founder" value={role} />
        </View>
        <View style={styles.twoCol}>
          <Field label="WhatsApp Number" onChangeText={setPhone} placeholder="+91 98765 43210" value={phone} />
          <Field label="Work Email" onChangeText={setEmail} placeholder="you@company.com" value={email} />
        </View>

        <Label text="Number of Guests" />
        <View style={[styles.stepper, { backgroundColor: T.input, borderColor: T.border }]}>
          <Pressable onPress={() => changeGuests(-5)} style={styles.stepBtn}><Text style={[styles.stepBtnTxt, { color: T.gold }]}>−</Text></Pressable>
          <Text style={[styles.stepVal, { borderColor: T.border, color: T.text }]}>{guests}</Text>
          <Pressable onPress={() => changeGuests(5)} style={styles.stepBtn}><Text style={[styles.stepBtnTxt, { color: T.gold }]}>+</Text></Pressable>
        </View>
        <Text style={[styles.hint, { color: T.text3 }]}>Tap to add/remove in steps of 5</Text>

        <Label text="Preferred Date" />
        <View style={[styles.calendarWrap, { backgroundColor: T.card, borderColor: T.border }]}>
          <Calendar
            minDate={minDate}
            markedDates={{ [date]: { selected: true, selectedColor: T.red, selectedTextColor: "#fff" } }}
            onDayPress={(day: { dateString: string }) => setDate(day.dateString)}
            theme={{
              arrowColor: T.gold,
              calendarBackground: T.card,
              dayTextColor: T.text,
              monthTextColor: T.gold,
              selectedDayBackgroundColor: T.red,
              textDisabledColor: isDark ? "rgba(242,232,217,0.22)" : "rgba(30,10,4,0.22)",
              textMonthFontWeight: "800",
              textSectionTitleColor: T.text2,
              todayTextColor: T.gold,
            }}
          />
        </View>

        <Label text="Preferred Time" />
        <View style={styles.chips}>
          {CORPORATE_TIME_SLOTS.map((slot) => {
            const active = slot === time;
            return (
              <Pressable key={slot} onPress={() => setTime(slot)} style={[styles.chip, { backgroundColor: active ? T.red : T.input, borderColor: active ? T.red : T.border }]}>
                <Text style={[styles.chipTxt, { color: active ? "#fff" : T.text2 }]}>{slot}</Text>
              </Pressable>
            );
          })}
        </View>

        <Label text="Budget Per Head" />
        <View style={styles.chips}>
          {CORPORATE_BUDGETS.map((item) => {
            const active = item === budget;
            return (
              <Pressable key={item} onPress={() => setBudget(item)} style={[styles.chip, { backgroundColor: active ? "rgba(192,57,43,0.12)" : T.input, borderColor: active ? T.red : T.border }]}>
                <Text style={[styles.chipTxt, { color: active ? T.text : T.text2 }]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>

        <Label text="Special Requirements" />
        <View style={styles.chips}>
          {CORPORATE_REQUIREMENTS.map((item) => {
            const active = requirements.includes(item.id);
            return (
              <Pressable key={item.id} onPress={() => toggleRequirement(item.id)} style={[styles.reqChip, { backgroundColor: active ? "rgba(201,151,90,0.08)" : T.input, borderColor: active ? T.border2 : T.border }]}>
                <Text>{item.icon}</Text>
                <Text style={[styles.chipTxt, { color: active ? T.text : T.text2 }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Field label="Special Notes" multiline onChangeText={setNotes} placeholder="Dietary preferences, event agenda, seating, client privacy needs..." value={notes} />

        <View style={[styles.gstBox, { borderColor: "rgba(39,174,96,0.2)" }]}>
          <Text style={styles.gstTitle}>✓ GST Invoice Details (Optional)</Text>
          <Field label="GST Number" onChangeText={setGstNumber} placeholder="e.g. 29ABCDE1234F1Z5" value={gstNumber} />
          <Field label="Billing Address" onChangeText={setBillingAddress} placeholder="Company billing address" value={billingAddress} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: T.bg, borderTopColor: T.border }]}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/corporate/venues",
              params: {
                billingAddress,
                budget,
                company,
                contactName,
                date,
                email,
                eventTypeId: eventType.id,
                gstNumber,
                guests: String(guests),
                notes,
                phone,
                requirements: requirements.join(","),
                role,
                time,
              },
            } as never)
          }
          style={[styles.cta, { backgroundColor: T.red }]}
        >
          <Text style={styles.ctaTxt}>Find Matching Venues</Text>
          <Text style={styles.ctaSub}>{guests} guests →</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

function Field({ label, multiline, onChangeText, placeholder, value }: { label: string; multiline?: boolean; onChangeText: (value: string) => void; placeholder: string; value: string }) {
  return (
    <View style={styles.field}>
      <Label text={label} />
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(242,232,217,0.28)"
        style={[styles.input, multiline && styles.multiline]}
        value={value}
      />
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
  sub: { fontSize: 11, marginTop: 2 },
  content: { padding: 18, paddingBottom: 128 },
  field: { flex: 1, marginBottom: 14 },
  label: { color: "#C9975A", fontSize: 9.5, fontWeight: "700", letterSpacing: 1.6, marginBottom: 8, textTransform: "uppercase" },
  input: { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(201,151,90,0.18)", borderRadius: 12, borderWidth: 1, color: "#F2E8D9", fontSize: 13, padding: 12 },
  multiline: { minHeight: 88, textAlignVertical: "top" },
  twoCol: { flexDirection: "row", gap: 10 },
  stepper: { alignItems: "center", borderRadius: 12, borderWidth: 1, flexDirection: "row", marginBottom: 6, overflow: "hidden" },
  stepBtn: { alignItems: "center", height: 46, justifyContent: "center", width: 44 },
  stepBtnTxt: { fontSize: 22, fontWeight: "900" },
  stepVal: { borderLeftWidth: 1, borderRightWidth: 1, flex: 1, fontSize: 22, fontWeight: "400", paddingVertical: 9, textAlign: "center" },
  hint: { fontSize: 10, marginBottom: 14, textAlign: "center" },
  calendarWrap: { borderRadius: 14, borderWidth: 1, marginBottom: 16, overflow: "hidden", paddingBottom: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 16 },
  chip: { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 13, paddingVertical: 9 },
  reqChip: { alignItems: "center", borderRadius: 10, borderWidth: 1.5, flexDirection: "row", gap: 6, paddingHorizontal: 12, paddingVertical: 9 },
  chipTxt: { fontSize: 11, fontWeight: "700" },
  gstBox: { backgroundColor: "rgba(39,174,96,0.05)", borderRadius: 13, borderWidth: 1, padding: 14 },
  gstTitle: { color: "#27ae60", fontSize: 9.5, fontWeight: "800", letterSpacing: 1.6, marginBottom: 10, textTransform: "uppercase" },
  footer: { borderTopWidth: 1, bottom: 0, left: 0, padding: 18, paddingBottom: Platform.OS === "ios" ? 28 : 18, position: "absolute", right: 0 },
  cta: { alignItems: "center", borderRadius: 15, flexDirection: "row", justifyContent: "space-between", padding: 15 },
  ctaTxt: { color: "#fff", fontSize: 14, fontWeight: "800" },
  ctaSub: { color: "rgba(255,255,255,0.82)", fontSize: 13, fontWeight: "800" },
});
