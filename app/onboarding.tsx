import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useMomentraTheme } from "@/contexts/momentra-theme";
import { firebaseAuth } from "@/firebase/config";
import { normalizeIndianPhoneNumber } from "@/lib/phone";
import {
  ensureCustomerProfile,
  logSupabaseProfileError,
} from "@/lib/supabase/customer-profile";

const DARK = {
  bg: "#0D0905",
  card: "#1A0E08",
  border: "rgba(201,151,90,0.18)",
  border2: "rgba(201,151,90,0.38)",
  text: "#F2E8D9",
  text2: "rgba(242,232,217,0.58)",
  text3: "rgba(242,232,217,0.34)",
  field: "rgba(255,255,255,0.06)",
  red: "#C0392B",
  red2: "#8B1A10",
  gold: "#C9975A",
  green: "#27AE60",
};

const LIGHT = {
  bg: "#FFF8F2",
  card: "#FFFDFB",
  border: "rgba(180,120,60,0.18)",
  border2: "rgba(180,120,60,0.38)",
  text: "#1E0A04",
  text2: "rgba(30,10,4,0.58)",
  text3: "rgba(30,10,4,0.34)",
  field: "#FDF9F5",
  red: "#C0392B",
  red2: "#8B1A10",
  gold: "#8B5A1A",
  green: "#1D7A4A",
};

const GOALS = ["Book a venue", "Plan a private celebration", "Find curated experiences", "Corporate event", "Explore ideas"];
const OCCASIONS = ["Birthday", "Anniversary", "Date night", "Kitty party", "House party", "Wedding", "Corporate", "Proposal", "Custom"];
const BUDGETS = ["Under ₹3,000", "₹3,000 - ₹7,000", "₹7,000 - ₹15,000", "₹15,000+"];
const VIBES = ["Luxury", "Romantic", "Family-friendly", "Trendy", "Calm", "Premium casual"];

export default function PersonaOnboardingScreen() {
  const { isDark } = useMomentraTheme();
  const T = isDark ? DARK : LIGHT;
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [goal, setGoal] = useState("");
  const [occasion, setOccasion] = useState("");
  const [budget, setBudget] = useState("");
  const [vibe, setVibe] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [dateTimePreference, setDateTimePreference] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const saveInFlightRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (!user?.phoneNumber) {
        router.replace("/login");
        return;
      }

      setCheckingSession(false);
    });

    return unsubscribe;
  }, []);

  function showError(text: string) {
    setError(text);
    if (Platform.OS !== "web") {
      Alert.alert("Momentra onboarding", text);
    }
  }

  async function submitOnboarding() {
    if (loading || saveInFlightRef.current || checkingSession) return;

    const user = firebaseAuth.currentUser;
    const phoneNumber = normalizeIndianPhoneNumber(user?.phoneNumber);

    if (!user || !phoneNumber) {
      showError("Please verify your phone number again.");
      router.replace("/login");
      return;
    }

    if (!fullName.trim()) {
      showError("Enter your name.");
      return;
    }

    if (!city.trim()) {
      showError("Enter your city.");
      return;
    }

    if (!goal || !occasion || !budget || !vibe) {
      showError("Please complete your celebration preferences.");
      return;
    }

    saveInFlightRef.current = true;
    setLoading(true);
    setError("");

    try {
      const payload = {
        budget,
        celebration_goal: goal,
        city: city.trim(),
        date_time_preference: dateTimePreference.trim() || null,
        full_name: fullName.trim(),
        guest_count: guestCount.trim() || null,
        occasion_type: occasion,
        preferred_vibe: vibe,
        referral_code: referralCode.trim() || null,
      };

      console.log("[Momentra onboarding] profiles save payload columns", {
        updateColumns: Object.keys(payload),
        firebase_uid: user.uid,
        phone_number: phoneNumber,
      });

      await ensureCustomerProfile(user, payload, phoneNumber);

      if (email.trim()) {
        console.log("[Momentra onboarding] Email was entered but profiles.email does not exist in the current Supabase schema; skipping email save.");
      }

      router.replace("/profile");
    } catch (err) {
      logSupabaseProfileError("onboarding save failed", err, {
        rawError: err,
      });

      showError("We could not save your profile right now. Please try again.");
    } finally {
      saveInFlightRef.current = false;
      setLoading(false);
    }
  }

  function ChipGroup({
    options,
    selected,
    onSelect,
  }: {
    options: string[];
    selected: string;
    onSelect: (value: string) => void;
  }) {
    return (
      <View style={s.chipGrid}>
        {options.map((option) => {
          const active = selected === option;
          return (
            <Pressable
              key={option}
              onPress={() => onSelect(option)}
              style={[
                s.chip,
                {
                  backgroundColor: active ? "rgba(192,57,43,0.12)" : T.field,
                  borderColor: active ? T.red : T.border,
                },
              ]}
            >
              <Text style={[s.chipText, { color: active ? T.red : T.text2 }]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={isDark ? ["#3A0906", "#160907", "#050302"] : ["#FFF8F2", "#F7E7DA", "#FFFDFB"]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Image resizeMode="contain" source={require("../assets/logo-wide.png")} style={s.logo} />
        <Text style={[s.eyebrow, { color: T.gold }]}>MOMENTRA SIGN UP</Text>
        <Text style={[s.title, { color: T.text }]}>Complete your Momentra profile</Text>
        <Text style={[s.subtitle, { color: T.text2 }]}>
          Your phone is verified. Share your celebration preferences so Momentra can tailor venues and experiences for you.
        </Text>

        <View style={[s.card, { backgroundColor: T.card, borderColor: T.border }]}>
          <TextInput
            autoCapitalize="words"
            onChangeText={setFullName}
            placeholder="Full name"
            placeholderTextColor={T.text3}
            style={[s.input, { backgroundColor: T.field, borderColor: T.border2, color: T.text }]}
            value={fullName}
          />
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email address (optional)"
            placeholderTextColor={T.text3}
            style={[s.input, { backgroundColor: T.field, borderColor: T.border2, color: T.text }]}
            value={email}
          />
          <TextInput
            autoCapitalize="words"
            onChangeText={setCity}
            placeholder="Location / city"
            placeholderTextColor={T.text3}
            style={[s.input, { backgroundColor: T.field, borderColor: T.border2, color: T.text }]}
            value={city}
          />

          <Text style={[s.sectionLabel, { color: T.text3 }]}>Celebration goal</Text>
          <ChipGroup onSelect={setGoal} options={GOALS} selected={goal} />

          <Text style={[s.sectionLabel, { color: T.text3 }]}>Occasion type</Text>
          <ChipGroup onSelect={setOccasion} options={OCCASIONS} selected={occasion} />

          <Text style={[s.sectionLabel, { color: T.text3 }]}>Budget</Text>
          <ChipGroup onSelect={setBudget} options={BUDGETS} selected={budget} />

          <Text style={[s.sectionLabel, { color: T.text3 }]}>Preferred vibe / style</Text>
          <ChipGroup onSelect={setVibe} options={VIBES} selected={vibe} />

          <TextInput
            keyboardType="number-pad"
            onChangeText={(text) => setGuestCount(text.replace(/[^0-9]/g, ""))}
            placeholder="Guest count"
            placeholderTextColor={T.text3}
            style={[s.input, { backgroundColor: T.field, borderColor: T.border2, color: T.text }]}
            value={guestCount}
          />
          <TextInput
            onChangeText={setDateTimePreference}
            placeholder="Date / time preference"
            placeholderTextColor={T.text3}
            style={[s.input, { backgroundColor: T.field, borderColor: T.border2, color: T.text }]}
            value={dateTimePreference}
          />
          <TextInput
            autoCapitalize="characters"
            onChangeText={setReferralCode}
            placeholder="Referral code (optional)"
            placeholderTextColor={T.text3}
            style={[s.input, { backgroundColor: T.field, borderColor: T.border2, color: T.text }]}
            value={referralCode}
          />

          {error ? <Text style={[s.error, { color: T.red }]}>{error}</Text> : null}

          <Pressable
            disabled={loading || checkingSession}
            onPress={submitOnboarding}
            style={[s.submit, { backgroundColor: T.red2 }, (loading || checkingSession) && { opacity: 0.55 }]}
          >
            <Text style={s.submitText}>
              {checkingSession ? "Checking session..." : loading ? "Saving..." : error ? "Retry sign up" : "Finish sign up"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingBottom: 42, paddingHorizontal: 22, paddingTop: Platform.OS === "ios" ? 58 : 36 },
  logo: { alignSelf: "center", height: 100, marginBottom: 10, width: 236 },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 2.4, marginBottom: 8, textAlign: "center" },
  title: { fontSize: 30, fontWeight: "700", lineHeight: 36, textAlign: "center" },
  subtitle: { alignSelf: "center", fontSize: 13, lineHeight: 21, marginBottom: 24, marginTop: 8, maxWidth: 420, textAlign: "center" },
  card: { borderRadius: 28, borderWidth: 1, gap: 14, padding: 20 },
  input: { borderRadius: 15, borderWidth: 1, fontSize: 15, minHeight: 52, paddingHorizontal: 16 },
  sectionLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1.6, marginTop: 8, textTransform: "uppercase" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  chipText: { fontSize: 12, fontWeight: "700" },
  error: { fontSize: 12, fontWeight: "700", lineHeight: 18, textAlign: "center" },
  submit: { alignItems: "center", borderRadius: 16, height: 54, justifyContent: "center", marginTop: 4 },
  submitText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
