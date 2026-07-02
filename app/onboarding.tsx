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
import { supabase } from "@/lib/supabase";

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
const OCCASIONS = ["Birthday", "Anniversary", "Date night", "Kitty party", "Wedding", "Corporate", "Proposal", "Custom"];
const BUDGETS = ["Under ₹3,000", "₹3,000 - ₹7,000", "₹7,000 - ₹15,000", "₹15,000+"];
const VIBES = ["Luxury", "Romantic", "Family-friendly", "Trendy", "Calm", "Premium casual"];

type SupabaseUserError = {
  code?: string | null;
  details?: string | null;
  hint?: string | null;
  message?: string;
};

function isMissingColumnError(message: string) {
  return /column|schema cache|Could not find|does not exist/i.test(message);
}

function isMissingConflictConstraintError(error: SupabaseUserError) {
  return error.code === "42P10" || /unique|constraint|on conflict/i.test(`${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`);
}

function logSupabaseUserError(context: string, error: SupabaseUserError, extra?: Record<string, unknown>) {
  console.error(`[Momentra onboarding] ${context}`, {
    code: error.code ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
    message: error.message ?? "Unknown Supabase error",
    ...extra,
  });
}

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
      const now = new Date().toISOString();
      const payload = {
        budget,
        celebration_goal: goal,
        city: city.trim(),
        date_time_preference: dateTimePreference.trim() || null,
        firebase_uid: user.uid,
        full_name: fullName.trim(),
        guest_count: guestCount.trim() || null,
        last_login: now,
        occasion_type: occasion,
        phone_number: phoneNumber,
        preferred_vibe: vibe,
        referral_code: referralCode.trim() || null,
      };
      const insertPayload = {
        ...payload,
        created_at: now,
      };
      const selectColumns = "id,firebase_uid,phone_number,full_name,city,created_at";

      console.log("[Momentra onboarding] users save payload columns", {
        insertColumns: Object.keys(insertPayload),
        updateColumns: Object.keys(payload),
      });

      const firebaseMatch = await supabase
        .from("users")
        .select("id")
        .eq("firebase_uid", user.uid)
        .limit(1);

      if (firebaseMatch.error) {
        logSupabaseUserError("firebase_uid lookup failed", firebaseMatch.error, {
          firebase_uid: user.uid,
          phone_number: phoneNumber,
          payloadColumns: Object.keys(payload),
        });
        throw firebaseMatch.error;
      }

      const phoneMatch = firebaseMatch.data?.[0]
        ? null
        : await supabase
            .from("users")
            .select("id")
            .eq("phone_number", phoneNumber)
            .limit(1);

      if (phoneMatch?.error) {
        logSupabaseUserError("phone_number lookup failed", phoneMatch.error, {
          firebase_uid: user.uid,
          phone_number: phoneNumber,
          payloadColumns: Object.keys(payload),
        });
        throw phoneMatch.error;
      }

      const existingId = firebaseMatch.data?.[0]?.id ?? phoneMatch?.data?.[0]?.id;
      let write = existingId
        ? await supabase
            .from("users")
            .update(payload)
            .eq("id", existingId)
            .select(selectColumns)
            .maybeSingle()
        : await supabase
            .from("users")
            .upsert(insertPayload, { onConflict: "phone_number" })
            .select(selectColumns)
            .maybeSingle();

      if (write.error) {
        logSupabaseUserError(existingId ? "existing user update failed" : "phone_number upsert failed", write.error, {
          conflictTarget: existingId ? null : "phone_number",
          existingId: existingId ?? null,
          firebase_uid: user.uid,
          phone_number: phoneNumber,
          payloadColumns: Object.keys(existingId ? payload : insertPayload),
        });

        if (!existingId && isMissingConflictConstraintError(write.error)) {
          console.warn("[Momentra onboarding] phone_number has no unique constraint for upsert; trying firebase_uid upsert next.");

          const firebaseUpsert = await supabase
            .from("users")
            .upsert(insertPayload, { onConflict: "firebase_uid" })
            .select(selectColumns)
            .maybeSingle();

          if (firebaseUpsert.error) {
            logSupabaseUserError("firebase_uid upsert failed", firebaseUpsert.error, {
              conflictTarget: "firebase_uid",
              firebase_uid: user.uid,
              phone_number: phoneNumber,
              payloadColumns: Object.keys(insertPayload),
            });

            if (!isMissingConflictConstraintError(firebaseUpsert.error)) {
              throw firebaseUpsert.error;
            }

            console.warn("[Momentra onboarding] firebase_uid has no unique constraint for upsert; falling back to plain insert.");
          } else {
            write = firebaseUpsert;
          }
        } else {
          throw write.error;
        }
      }

      if (write.error) {
        write = await supabase
          .from("users")
          .insert(insertPayload)
          .select(selectColumns)
          .maybeSingle();

        if (write.error) {
          logSupabaseUserError("fallback user insert failed", write.error, {
            firebase_uid: user.uid,
            phone_number: phoneNumber,
            payloadColumns: Object.keys(insertPayload),
          });
          throw write.error;
        }
      }

      if (write.error) {
        logSupabaseUserError("user save failed", write.error, {
          payloadColumns: Object.keys(insertPayload),
        });
        throw write.error;
      }

      if (email.trim()) {
        console.log("[Momentra onboarding] Email was entered but users.email does not exist in the current Supabase schema; skipping email save.");
      }

      router.replace("/profile");
    } catch (err) {
      const supabaseError = err as SupabaseUserError;
      const text = supabaseError?.message ?? (err instanceof Error ? err.message : "Could not save onboarding.");

      logSupabaseUserError("save failed", supabaseError, {
        rawError: err,
      });

      if (isMissingColumnError(text)) {
        showError("Supabase users table needs onboarding columns. See SQL in the implementation summary.");
      } else {
        showError("We could not save your profile right now. Please try again.");
      }
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
        <Image resizeMode="contain" source={require("../assets/logo.png")} style={s.logo} />
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
  logo: { alignSelf: "center", height: 86, marginBottom: 10, width: 220 },
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
