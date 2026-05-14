import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useMomentraTheme } from "@/contexts/momentra-theme";
import { supabase } from "@/lib/supabase";

const { width } = Dimensions.get("window");

const DARK = {
  bg: "#0D0905",
  surf: "#1A0E08",
  border: "rgba(201,151,90,0.16)",
  border2: "rgba(201,151,90,0.38)",
  text: "#F2E8D9",
  text2: "rgba(242,232,217,0.52)",
  text3: "rgba(242,232,217,0.26)",
  gold: "#C9975A",
  gold2: "#E4B97A",
  red: "#C0392B",
  red2: "#8B1A10",
  chipBg: "#1C0E08",
  cardBg: "#1A0E08",
  selBg: "rgba(192,57,43,0.12)",
  selBorder: "#C0392B",
};

const LIGHT = {
  bg: "#FFF8F2",
  surf: "#FFF0E6",
  border: "rgba(180,120,60,0.16)",
  border2: "rgba(180,120,60,0.38)",
  text: "#1E0A04",
  text2: "rgba(30,10,4,0.52)",
  text3: "rgba(30,10,4,0.28)",
  gold: "#8B5A1A",
  gold2: "#A0722A",
  red: "#C0392B",
  red2: "#8B1A10",
  chipBg: "#FFF0E6",
  cardBg: "#FFF0E6",
  selBg: "rgba(192,57,43,0.08)",
  selBorder: "#C0392B",
};

const CITIES = [
  "Hyderabad",
  "Vizag",
  "Vijayawada",
  "Bangalore",
  "Mumbai",
  "Chennai",
  "Delhi",
  "Pune",
];

const PERSONAS = [
  {
    id: "18",
    icon: "🎓",
    age: "18 - 24",
    name: "Party Starter",
    desc: "College plans, birthdays, cafes, friends and casual celebrations",
  },
  {
    id: "25",
    icon: "✨",
    age: "25 - 34",
    name: "Moment Maker",
    desc: "Date nights, birthdays, proposals and premium experiences",
  },
  {
    id: "35",
    icon: "🏡",
    age: "35 - 44",
    name: "Social Host",
    desc: "Family dinners, kitty parties, corporate and private gatherings",
  },
  {
    id: "45",
    icon: "🥂",
    age: "45 - 54",
    name: "Celebration Curator",
    desc: "Milestone birthdays, anniversaries, banquets and family events",
  },
  {
    id: "55",
    icon: "👑",
    age: "55+",
    name: "Legacy Celebrator",
    desc: "Family celebrations, anniversaries, reunions and elegant events",
  },
];

const PROFESSIONS = [
  { id: "student", icon: "📚", label: "Student" },
  { id: "working", icon: "💼", label: "Working Professional" },
  { id: "entrepreneur", icon: "🚀", label: "Entrepreneur" },
  { id: "homemaker", icon: "🏠", label: "Homemaker" },
  { id: "corporate", icon: "🏢", label: "Corporate Team" },
  { id: "other", icon: "✦", label: "Other" },
];

const BUDGETS = [
  { id: "u3k", icon: "🌱", range: "Under ₹3,000", sub: "Budget friendly" },
  { id: "3to7", icon: "🌟", range: "₹3,000 - ₹7,000", sub: "Mid range" },
  { id: "7to15", icon: "✨", range: "₹7,000 - ₹15,000", sub: "Premium" },
  { id: "15p", icon: "👑", range: "₹15,000+", sub: "Ultra luxury" },
];

const STEP_META = [
  {
    title: "Where are you",
    titleGold: "located?",
    sub: "We will show curated experiences near you.",
    hint: "Select your city",
  },
  {
    title: "Tell us your",
    titleGold: "celebration vibe",
    sub: "We will personalise moments around your lifestyle.",
    hint: "Select your age group",
  },
  {
    title: "What is your",
    titleGold: "profession?",
    sub: "Helps us match the right venues for you.",
    hint: "Select your profession",
  },
  {
    title: "What is your",
    titleGold: "budget range?",
    sub: "We will show experiences that fit perfectly.",
    hint: "Select your budget",
  },
];

export default function PersonaOnboardingScreen() {
  const router = useRouter();
  const { isDark } = useMomentraTheme();
  const T = isDark ? DARK : LIGHT;

  const [step, setStep] = useState(1);
  const [showFinal, setShowFinal] = useState(false);
  const [selCity, setCity] = useState<string | null>(null);
  const [selAge, setAge] = useState<string | null>(null);
  const [selProf, setProf] = useState<string | null>(null);
  const [selBudget, setBudget] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pingAnim = useRef(new Animated.Value(0)).current;
  const pingAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (step !== 1 || showFinal) return;

    const runPing = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { duration: 1600, toValue: 1, useNativeDriver: true }),
          Animated.timing(anim, { duration: 0, toValue: 0, useNativeDriver: true }),
        ])
      ).start();

    runPing(pingAnim, 0);
    runPing(pingAnim2, 720);
  }, [pingAnim, pingAnim2, showFinal, step]);

  const mkPing = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 0.12, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
  });

  const stepComplete = useCallback(() => {
    if (step === 1) return !!selCity;
    if (step === 2) return !!selAge;
    if (step === 3) return !!selProf;
    if (step === 4) return !!selBudget;
    return false;
  }, [step, selCity, selAge, selProf, selBudget]);

  function transitionTo(update: () => void) {
    Animated.timing(fadeAnim, { duration: 160, toValue: 0, useNativeDriver: true }).start(() => {
      update();
      scrollRef.current?.scrollTo({ animated: false, y: 0 });
      Animated.timing(fadeAnim, { duration: 260, toValue: 1, useNativeDriver: true }).start();
    });
  }

  async function handleNext() {
    if (step < 4) {
      transitionTo(() => setStep((current) => current + 1));
      return;
    }

    const selectedPersona = PERSONAS.find((item) => item.id === selAge);
    const selectedProfession = PROFESSIONS.find((item) => item.id === selProf);
    const selectedBudget = BUDGETS.find((item) => item.id === selBudget);
    const payload = {
      age: selectedPersona?.age ?? selAge,
      budget: selectedBudget?.range ?? selBudget,
      city: selCity,
      profession: selectedProfession?.label ?? selProf,
    };

    await AsyncStorage.setItem("@momentra_profile", JSON.stringify(payload));

    console.log("ONBOARDING PAYLOAD:", payload);

    const { data, error } = await supabase.from("users").insert(payload).select();

    if (error) {
      console.error("ONBOARDING SAVE ERROR:", JSON.stringify(error, null, 2));
    } else {
      console.log("ONBOARDING SAVE SUCCESS:", data);
    }

    transitionTo(() => setShowFinal(true));
  }

  function handleBack() {
    if (showFinal) {
      transitionTo(() => {
        setShowFinal(false);
        setStep(4);
      });
      return;
    }

    if (step > 1) {
      transitionTo(() => setStep((current) => current - 1));
      return;
    }

    router.back();
  }

  function handleSkip() {
    if (step < 4) transitionTo(() => setStep((current) => current + 1));
    else if (!showFinal) transitionTo(() => setShowFinal(true));
  }

  async function useGPS() {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        const [geo] = await Location.reverseGeocodeAsync(loc.coords);
        setCity(geo?.city || "Vizag");
      }
    } catch {
      setCity("Vizag");
    } finally {
      setDetecting(false);
    }
  }

  const doneCount = [selCity, selAge, selProf, selBudget].filter(Boolean).length;
  const meta = showFinal ? null : STEP_META[step - 1];
  const persona = PERSONAS.find((item) => item.id === selAge) || PERSONAS[1];
  const profession = PROFESSIONS.find((item) => item.id === selProf) || PROFESSIONS[0];
  const budget = BUDGETS.find((item) => item.id === selBudget) || BUDGETS[1];

  function SecLabel({ label }: { label: string }) {
    return (
      <View style={s.secLblRow}>
        <View style={[s.secLblLine, { backgroundColor: T.border }]} />
        <Text style={[s.secLblTxt, { color: T.text3 }]}>{label}</Text>
        <View style={[s.secLblLine, { backgroundColor: T.border }]} />
      </View>
    );
  }

  function Step1() {
    return (
      <View style={s.section}>
        <SecLabel label="Select City" />
        <View style={s.pinWrap}>
          <Animated.View style={[s.pingRing, mkPing(pingAnim), { borderColor: "rgba(192,57,43,0.4)" }]} />
          <Animated.View style={[s.pingRing, mkPing(pingAnim2), { borderColor: "rgba(192,57,43,0.4)" }]} />
          <View style={s.pinCore}>
            <Text style={s.pinEmoji}>📍</Text>
          </View>
        </View>

        <View style={s.chipGrid}>
          {CITIES.map((city) => {
            const selected = selCity === city;
            return (
              <TouchableOpacity
                key={city}
                onPress={() => setCity((current) => (current === city ? null : city))}
                style={[
                  s.cityChip,
                  {
                    backgroundColor: selected ? T.selBg : T.chipBg,
                    borderColor: selected ? T.selBorder : T.border,
                  },
                ]}
              >
                <View style={[s.cityDot, { backgroundColor: selected ? T.red : T.text3 }]} />
                <Text style={[s.chipTxt, { color: selected ? T.text : T.text2 }]}>{city}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={s.orRow}>
          <View style={[s.orLine, { backgroundColor: T.border }]} />
          <Text style={[s.orTxt, { color: T.text3 }]}>or</Text>
          <View style={[s.orLine, { backgroundColor: T.border }]} />
        </View>

        <TouchableOpacity
          disabled={detecting}
          onPress={useGPS}
          style={s.gpsBtn}
        >
          {detecting ? <ActivityIndicator color={T.red} size="small" /> : <Text style={s.gpsIcon}>📍</Text>}
          <Text style={[s.gpsBtnTxt, { color: T.red }]}>
            {detecting ? "Detecting your location..." : "Use My Location"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  function Step2() {
    return (
      <View style={s.section}>
        <SecLabel label="Your Age Group" />
        {PERSONAS.map((personaItem) => {
          const selected = selAge === personaItem.id;
          return (
            <TouchableOpacity
              activeOpacity={0.85}
              key={personaItem.id}
              onPress={() => setAge((current) => (current === personaItem.id ? null : personaItem.id))}
              style={[
                s.personaCard,
                {
                  backgroundColor: selected ? T.selBg : T.cardBg,
                  borderColor: selected ? T.selBorder : T.border,
                },
              ]}
            >
              <View
                style={[
                  s.personaIconBox,
                  {
                    backgroundColor: selected ? "rgba(192,57,43,0.16)" : "rgba(201,151,90,0.09)",
                    borderColor: selected ? "rgba(192,57,43,0.3)" : "rgba(201,151,90,0.16)",
                  },
                ]}
              >
                <Text style={s.personaIcon}>{personaItem.icon}</Text>
              </View>
              <View style={s.flex}>
                <Text style={[s.personaName, { color: T.gold }]}>{personaItem.name}</Text>
                <Text style={[s.personaAge, { color: T.text }]}>{personaItem.age}</Text>
                <Text style={[s.personaDesc, { color: T.text3 }]}>{personaItem.desc}</Text>
              </View>
              <View
                style={[
                  s.checkCircle,
                  {
                    backgroundColor: selected ? T.red : "transparent",
                    borderColor: selected ? T.red : T.border2,
                  },
                ]}
              >
                {selected ? <Text style={s.checkText}>✓</Text> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  function Step3() {
    return (
      <View style={s.section}>
        <SecLabel label="Your Profession" />
        <View style={s.chipGrid}>
          {PROFESSIONS.map((professionItem) => {
            const selected = selProf === professionItem.id;
            return (
              <TouchableOpacity
                key={professionItem.id}
                onPress={() => setProf((current) => (current === professionItem.id ? null : professionItem.id))}
                style={[
                  s.chip,
                  {
                    backgroundColor: selected ? T.selBg : T.chipBg,
                    borderColor: selected ? T.selBorder : T.border,
                  },
                ]}
              >
                <Text style={s.chipIcon}>{professionItem.icon}</Text>
                <Text style={[s.chipTxt, { color: selected ? T.text : T.text2 }]}>{professionItem.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  function Step4() {
    return (
      <View style={s.section}>
        <SecLabel label="Budget Per Booking" />
        <View style={s.budgetGrid}>
          {BUDGETS.map((budgetItem) => {
            const selected = selBudget === budgetItem.id;
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                key={budgetItem.id}
                onPress={() => setBudget((current) => (current === budgetItem.id ? null : budgetItem.id))}
                style={[
                  s.budgetCard,
                  {
                    backgroundColor: selected ? T.selBg : T.cardBg,
                    borderColor: selected ? T.selBorder : T.border,
                  },
                ]}
              >
                {selected ? (
                  <View style={s.budgetCheck}>
                    <Text style={s.checkText}>✓</Text>
                  </View>
                ) : null}
                <Text style={s.budgetIcon}>{budgetItem.icon}</Text>
                <Text style={[s.budgetRange, { color: selected ? T.gold : T.text }]}>{budgetItem.range}</Text>
                <Text style={[s.budgetSub, { color: T.text3 }]}>{budgetItem.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={[s.tipCard, { backgroundColor: "rgba(201,151,90,0.06)", borderColor: T.border }]}>
          <Text style={s.tipIcon}>💡</Text>
          <View style={s.flex}>
            <Text style={[s.tipTitle, { color: T.text2 }]}>You can always change this</Text>
            <Text style={[s.tipSub, { color: T.text3 }]}>
              Budget helps us filter experiences. Explore all price ranges anytime from the Explore tab.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  function FinalScreen() {
    return (
      <View style={s.finalWrap}>
        <Image resizeMode="contain" source={require("../assets/logo.png")} style={s.finalLogo} />
        <View style={s.finalCircle}>
          <Text style={s.finalEmoji}>🥂</Text>
        </View>
        <Text style={[s.finalTitle, { color: T.text }]}>
          <Text style={{ color: T.gold, fontStyle: "italic" }}>Let’s Explore!</Text>
        </Text>
        <Text style={[s.finalSub, { color: T.text2 }]}>
          Your Momentra is personalised.{"\n"}
          We’ve curated the best experiences{"\n"}
          matching your vibe & budget.
        </Text>
        <View style={[s.summaryCard, { backgroundColor: T.cardBg, borderColor: T.border2 }]}>
          {[
            { icon: "📍", label: "Your City", value: selCity || "Vizag" },
            { icon: persona.icon, label: "Your Vibe", value: `${persona.name} · ${persona.age}`, gold: true },
            { icon: "💼", label: "Profession", value: profession.label },
            { icon: "💰", label: "Budget Range", value: budget.range, gold: true },
          ].map((row, index) => (
            <View
              key={row.label}
              style={[s.summaryRow, index < 3 && { borderBottomColor: T.border, borderBottomWidth: 1 }]}
            >
              <View style={s.summaryIcon}>
                <Text style={s.summaryIconText}>{row.icon}</Text>
              </View>
              <View style={s.flex}>
                <Text style={[s.summaryLabel, { color: T.text3 }]}>{row.label}</Text>
                <Text style={[s.summaryValue, { color: row.gold ? T.gold : T.text }]}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={["rgba(192,57,43,0.09)", "transparent"]}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
        start={{ x: 0.5, y: 0 }}
        style={s.atmGlow}
      />

      <View style={s.pageHeader}>
        {!showFinal && step === 1 ? (
          <Image resizeMode="contain" source={require("../assets/logo.png")} style={s.logo} />
        ) : null}
        <TouchableOpacity onPress={handleBack} style={s.backBtn}>
          <Text style={[s.backTxt, { color: T.gold }]}>← Back</Text>
        </TouchableOpacity>

        <View style={s.progressBar}>
          {[1, 2, 3, 4].map((index) => (
            <View
              key={index}
              style={[
                s.progressSeg,
                { backgroundColor: showFinal || index < step ? T.red : index === step ? T.gold : T.border },
              ]}
            />
          ))}
        </View>

        {!showFinal && meta ? (
          <>
            <Text style={[s.title, { color: T.text }]}>
              {meta.title} <Text style={{ color: T.gold, fontStyle: "italic" }}>{meta.titleGold}</Text>
            </Text>
            <Text style={[s.subtitle, { color: T.text2 }]}>{meta.sub}</Text>
          </>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={s.scrollBody}
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        style={s.flex}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {!showFinal && step === 1 ? <Step1 /> : null}
          {!showFinal && step === 2 ? <Step2 /> : null}
          {!showFinal && step === 3 ? <Step3 /> : null}
          {!showFinal && step === 4 ? <Step4 /> : null}
          {showFinal ? <FinalScreen /> : null}
        </Animated.View>
      </ScrollView>

      <View style={[s.ctaFooter, { backgroundColor: T.bg, borderTopColor: T.border }]}>
        {showFinal ? (
          <View style={s.ctaProgressRow}>
            <Text style={[s.ctaProgTxt, { color: T.text3 }]}>Personalization complete</Text>
            <Text style={[s.ctaProgVal, { color: T.gold }]}>4/4 done</Text>
          </View>
        ) : null}

        {!showFinal && meta ? (
          <View style={s.ctaProgressRow}>
            <Text style={[s.ctaProgTxt, { color: T.text3 }]}>{meta.hint}</Text>
            <Text style={[s.ctaProgVal, { color: T.gold }]}>{doneCount} / 4 done</Text>
          </View>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.88}
          disabled={!showFinal && !stepComplete()}
          onPress={showFinal ? () => router.replace("/home" as never) : handleNext}
          style={[s.ctaBtn, !showFinal && !stepComplete() && { opacity: 0.38 }]}
        >
          <LinearGradient
            colors={showFinal ? ["#27ae60", "#1a7a40"] : [T.red, T.red2]}
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 0 }}
            style={s.ctaBtnGrad}
          >
            <Text style={s.ctaBtnTxt}>
              {showFinal ? "🥂 Let’s Explore Momentra" : step === 4 ? "Personalise My Experience" : "Continue"}
            </Text>
            {!showFinal ? <Text style={s.ctaArrow}>→</Text> : null}
          </LinearGradient>
        </TouchableOpacity>

        {!showFinal ? (
          <TouchableOpacity onPress={handleSkip} style={s.skipBtn}>
            <Text style={[s.skipTxt, { color: T.text3 }]}>Skip for now</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingTop: Platform.OS === "ios" ? 52 : 32 },
  flex: { flex: 1 },
  atmGlow: { height: 240, left: 0, position: "absolute", right: 0, top: 0, zIndex: 0 },
  pageHeader: { paddingBottom: 14, paddingHorizontal: 20, paddingTop: 10, zIndex: 5 },
  logo: { alignSelf: "center", height: 65, marginBottom: 10, width: 170 },
  backBtn: { marginBottom: 18 },
  backTxt: { fontSize: 13, fontWeight: "500" },
  progressBar: { flexDirection: "row", gap: 5, marginBottom: 20 },
  progressSeg: { borderRadius: 2, flex: 1, height: 3 },
  title: { fontSize: 26, fontWeight: "300", lineHeight: 32, marginBottom: 5 },
  subtitle: { fontSize: 12, fontWeight: "300", lineHeight: 18 },
  scrollBody: { paddingBottom: 20 },
  section: { paddingBottom: 10, paddingHorizontal: 18, paddingTop: 10 },
  secLblRow: { alignItems: "center", flexDirection: "row", gap: 10, marginBottom: 14 },
  secLblLine: { flex: 1, height: 1 },
  secLblTxt: { fontSize: 9, fontWeight: "500", letterSpacing: 2.5, textTransform: "uppercase" },
  pinWrap: { alignItems: "center", height: 88, justifyContent: "center", marginBottom: 16 },
  pingRing: { borderRadius: 32, borderWidth: 1, height: 64, position: "absolute", width: 64 },
  pinCore: {
    alignItems: "center",
    backgroundColor: "rgba(192,57,43,0.14)",
    borderColor: "rgba(192,57,43,0.35)",
    borderRadius: 25,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  pinEmoji: { fontSize: 22 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cityChip: { alignItems: "center", borderRadius: 22, borderWidth: 1.5, flexDirection: "row", gap: 6, paddingHorizontal: 14, paddingVertical: 9 },
  cityDot: { borderRadius: 3, height: 6, width: 6 },
  chip: { alignItems: "center", borderRadius: 22, borderWidth: 1.5, flexDirection: "row", gap: 7, paddingHorizontal: 14, paddingVertical: 10 },
  chipIcon: { fontSize: 15 },
  chipTxt: { fontSize: 12, fontWeight: "500" },
  orRow: { alignItems: "center", flexDirection: "row", gap: 10, marginVertical: 14 },
  orLine: { flex: 1, height: 1 },
  orTxt: { fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" },
  gpsBtn: {
    alignItems: "center",
    backgroundColor: "rgba(192,57,43,0.08)",
    borderColor: "rgba(192,57,43,0.35)",
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
    paddingVertical: 13,
  },
  gpsIcon: { fontSize: 16 },
  gpsBtnTxt: { fontSize: 13, fontWeight: "600" },
  personaCard: { alignItems: "center", borderRadius: 16, borderWidth: 1.5, flexDirection: "row", gap: 13, marginBottom: 9, padding: 13 },
  personaIconBox: { alignItems: "center", borderRadius: 13, borderWidth: 1, flexShrink: 0, height: 46, justifyContent: "center", width: 46 },
  personaIcon: { fontSize: 20 },
  personaName: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3, marginBottom: 2 },
  personaAge: { fontSize: 16, fontWeight: "600", lineHeight: 19, marginBottom: 3 },
  personaDesc: { fontSize: 9.5, fontWeight: "300", lineHeight: 14 },
  checkCircle: { alignItems: "center", borderRadius: 10, borderWidth: 1.5, flexShrink: 0, height: 20, justifyContent: "center", width: 20 },
  checkText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  budgetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  budgetCard: { alignItems: "center", borderRadius: 16, borderWidth: 1.5, padding: 18, position: "relative", width: (width - 36 - 10) / 2 },
  budgetCheck: { alignItems: "center", backgroundColor: "#C0392B", borderRadius: 9, height: 18, justifyContent: "center", position: "absolute", right: 9, top: 9, width: 18 },
  budgetIcon: { fontSize: 26, marginBottom: 9 },
  budgetRange: { fontSize: 14, fontWeight: "600", lineHeight: 18, marginBottom: 3, textAlign: "center" },
  budgetSub: { fontSize: 9.5, textAlign: "center" },
  tipCard: { alignItems: "flex-start", borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 11, marginTop: 2, padding: 13 },
  tipIcon: { flexShrink: 0, fontSize: 18 },
  tipTitle: { fontSize: 11, fontWeight: "500", marginBottom: 3 },
  tipSub: { fontSize: 10, lineHeight: 15 },
  finalWrap: { alignItems: "center", paddingBottom: 20, paddingHorizontal: 22, paddingTop: 4 },
  finalLogo: { height: 65, marginBottom: 12, width: 170 },
  finalCircle: {
    alignItems: "center",
    backgroundColor: "rgba(192,57,43,0.12)",
    borderColor: "rgba(201,151,90,0.3)",
    borderRadius: 50,
    borderWidth: 1,
    height: 100,
    justifyContent: "center",
    marginBottom: 22,
    width: 100,
  },
  finalEmoji: { fontSize: 44 },
  finalTitle: { fontSize: 30, fontWeight: "300", marginBottom: 10, textAlign: "center" },
  finalSub: { fontSize: 13, lineHeight: 20, marginBottom: 24, textAlign: "center" },
  summaryCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden", width: "100%" },
  summaryRow: { alignItems: "center", flexDirection: "row", gap: 12, padding: 14 },
  summaryIcon: {
    alignItems: "center",
    backgroundColor: "rgba(201,151,90,0.1)",
    borderColor: "rgba(201,151,90,0.16)",
    borderRadius: 10,
    borderWidth: 1,
    flexShrink: 0,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  summaryIconText: { fontSize: 15 },
  summaryLabel: { fontSize: 9.5, letterSpacing: 0.5, marginBottom: 2, textTransform: "uppercase" },
  summaryValue: { fontSize: 14, fontWeight: "500" },
  ctaFooter: { borderTopWidth: 1, paddingBottom: Platform.OS === "ios" ? 30 : 20, paddingHorizontal: 18, paddingTop: 12 },
  ctaProgressRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  ctaProgTxt: { fontSize: 10 },
  ctaProgVal: { fontSize: 10, fontWeight: "600" },
  ctaBtn: { borderRadius: 15, elevation: 8, marginBottom: 9, overflow: "hidden", shadowColor: "#C0392B", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 16 },
  ctaBtnGrad: { alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "center", paddingVertical: 15 },
  ctaBtnTxt: { color: "#fff", fontSize: 14, fontWeight: "700", letterSpacing: 0.3 },
  ctaArrow: { color: "#fff", fontSize: 16 },
  skipBtn: { alignItems: "center", paddingVertical: 4 },
  skipTxt: { fontSize: 11 },
});
