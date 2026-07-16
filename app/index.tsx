import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

const HERO_IMAGE = "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=85";
const KITTY_IMAGE = "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=900&q=85";
const CORPORATE_IMAGE = "https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=900&q=85";

const STEPS = [
  ["01", "Choose occasion", "Kitty party, birthday, date night, corporate dinner, offsite, or any special moment."],
  ["02", "Select package/date/venue", "Pick the experience, preferred date, time, guest count, and matching venue."],
  ["03", "Request availability", "Share your preferences, request a quote, or talk to Momentra before confirming anything."],
  ["04", "Momentra coordinates everything", "Venue, setup, reminders, support, and execution are managed by the Momentra team."],
];

export default function IndexScreen() {
  if (Platform.OS !== "web") {
    return <Redirect href="/login" />;
  }

  return <WebHome />;
}

function WebHome() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 820;

  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false} style={styles.root}>
      <View style={styles.hero}>
        <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} resizeMode="cover" />
        <LinearGradient
          colors={["rgba(5,3,2,0.62)", "rgba(5,3,2,0.88)", "#050302"]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.nav}>
          <Image source={require("../assets/logo.png")} style={styles.logo} resizeMode="contain" />
          <Pressable onPress={() => router.push("/login" as never)} style={styles.loginLink}>
            <Text style={styles.loginText}>Login / Continue</Text>
          </Pressable>
        </View>

        <View style={[styles.heroInner, compact && styles.heroInnerCompact]}>
          <Text style={styles.brand}>MOMENTRA</Text>
          <Text style={styles.heroTitle}>
            Every celebration starts with the right moment.
          </Text>
          <Text style={styles.heroSub}>
            From social gatherings to corporate events, Momentra helps you discover venues,
            organize guests, and bring experiences together effortlessly. Momentra coordinates the experience end-to-end.
          </Text>
          <View style={[styles.ctaRow, compact && styles.ctaColumn]}>
            <Pressable onPress={() => router.push("/kitty" as never)} style={styles.primaryCta}>
              <Text style={styles.primaryCtaText}>Plan Kitty Party</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/experiences",
                  params: { occasionId: "house-party" },
                } as never)
              }
              style={styles.housePartyCta}
            >
              <Text style={styles.primaryCtaText}>Plan House Party</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/corporate" as never)} style={styles.primaryCtaAlt}>
              <Text style={styles.primaryCtaText}>Plan Corporate Event</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/explore" as never)} style={styles.secondaryCta}>
              <Text style={styles.secondaryCtaText}>Browse Experiences</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Section eyebrow="HOW IT WORKS" title="A simple booking flow, managed with care.">
        <View style={[styles.stepsGrid, compact && styles.stack]}>
          {STEPS.map(([number, title, text]) => (
            <View key={number} style={styles.stepCard}>
              <Text style={styles.stepNumber}>{number}</Text>
              <Text style={styles.stepTitle}>{title}</Text>
              <Text style={styles.stepText}>{text}</Text>
            </View>
          ))}
        </View>
      </Section>

      <View style={[styles.featureGrid, compact && styles.stack]}>
        <FeaturePanel
          cta="Plan Kitty Party"
          image={KITTY_IMAGE}
          onPress={() => router.push("/kitty" as never)}
          points={[
            "Group booking built for kitty circles",
            "Invite guests and coordinate attendance",
            "Set minimum pax before the booking confirms",
            "Momentra coordinates the experience end-to-end",
          ]}
          subtitle="A simple flow for hosts who want the celebration without awkward collection follow-ups."
          title="Kitty Circle"
        />
        <FeaturePanel
          cta="Plan Corporate Event"
          image={CORPORATE_IMAGE}
          onPress={() => router.push("/corporate" as never)}
          points={[
            "Team dinners, client hosting, and offsites",
            "Budget per head and requirement capture",
            "GST invoice details and formal quote flow",
            "Managed venue coordination for professional events",
          ]}
          subtitle="Designed for HR, founders, admins, and team leads who need reliable execution."
          title="Corporate Events"
        />
      </View>

      <View style={styles.browseBand}>
        <View style={styles.browseCopy}>
          <Text style={styles.browseTitle}>Not sure what to plan yet?</Text>
          <Text style={styles.browseSub}>
            Browse curated experiences across birthdays, date nights, private dining,
            parties, kitty gatherings, and corporate moments.
          </Text>
        </View>
        <Pressable onPress={() => router.push("/explore" as never)} style={styles.primaryCta}>
          <Text style={styles.primaryCtaText}>Browse Experiences</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Section({
  children,
  eyebrow,
  title,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function FeaturePanel({
  cta,
  image,
  onPress,
  points,
  subtitle,
  title,
}: {
  cta: string;
  image: string;
  onPress: () => void;
  points: string[];
  subtitle: string;
  title: string;
}) {
  return (
    <View style={styles.featurePanel}>
      <Image source={{ uri: image }} style={styles.featureImage} resizeMode="cover" />
      <LinearGradient
        colors={["rgba(13,9,5,0.1)", "rgba(13,9,5,0.78)", "rgba(13,9,5,0.98)"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSub}>{subtitle}</Text>
        <View style={styles.points}>
          {points.map((point) => (
            <View key={point} style={styles.pointRow}>
              <View style={styles.pointDot} />
              <Text style={styles.pointText}>{point}</Text>
            </View>
          ))}
        </View>
        <Pressable onPress={onPress} style={styles.featureCta}>
          <Text style={styles.featureCtaText}>{cta}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: "#050302", flex: 1 },
  page: { backgroundColor: "#050302", paddingBottom: 56 },
  hero: { minHeight: 620, overflow: "hidden", position: "relative" },
  heroImage: { ...StyleSheet.absoluteFillObject, opacity: 0.38 },
  nav: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: "auto",
    maxWidth: 1120,
    paddingHorizontal: 22,
    paddingTop: 24,
    width: "100%",
    zIndex: 2,
  },
  logo: { height: 72, width: 190 },
  loginLink: {
    backgroundColor: "rgba(242,232,217,0.06)",
    borderColor: "rgba(201,151,90,0.24)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  loginText: { color: "#E4B97A", fontSize: 13, fontWeight: "800" },
  heroInner: {
    marginHorizontal: "auto",
    maxWidth: 1120,
    paddingHorizontal: 22,
    paddingTop: 82,
    width: "100%",
    zIndex: 1,
  },
  heroInnerCompact: { paddingTop: 54 },
  brand: { color: "#E4B97A", fontSize: 18, fontWeight: "800", letterSpacing: 4, marginBottom: 14, textTransform: "uppercase" },
  heroTitle: { color: "#F2E8D9", fontSize: 60, fontWeight: "300", letterSpacing: 0, lineHeight: 68, maxWidth: 900 },
  heroSub: { color: "rgba(242,232,217,0.68)", fontSize: 18, lineHeight: 30, marginTop: 18, maxWidth: 680 },
  ctaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 30 },
  ctaColumn: { flexDirection: "column" },
  primaryCta: {
    alignItems: "center",
    backgroundColor: "#C0392B",
    borderRadius: 15,
    boxShadow: "0 14px 34px rgba(192,57,43,0.28)" as never,
    paddingHorizontal: 22,
    paddingVertical: 15,
  },
  primaryCtaAlt: {
    alignItems: "center",
    backgroundColor: "#A86F2A",
    borderRadius: 15,
    boxShadow: "0 14px 34px rgba(168,111,42,0.22)" as never,
    paddingHorizontal: 22,
    paddingVertical: 15,
  },
  housePartyCta: {
    alignItems: "center",
    backgroundColor: "#C9975A",
    borderColor: "rgba(228,185,122,0.35)",
    borderRadius: 15,
    borderWidth: 1,
    boxShadow: "0 14px 34px rgba(201,151,90,0.24)" as never,
    paddingHorizontal: 22,
    paddingVertical: 15,
  },
  primaryCtaText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  secondaryCta: {
    alignItems: "center",
    backgroundColor: "rgba(242,232,217,0.06)",
    borderColor: "rgba(201,151,90,0.28)",
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 15,
  },
  secondaryCtaText: { color: "#E4B97A", fontSize: 14, fontWeight: "900" },
  section: { marginHorizontal: "auto", maxWidth: 1120, paddingHorizontal: 22, paddingVertical: 64, width: "100%" },
  eyebrow: { color: "#C9975A", fontSize: 10, fontWeight: "900", letterSpacing: 2.4, marginBottom: 12 },
  sectionTitle: { color: "#F2E8D9", fontSize: 38, fontWeight: "300", lineHeight: 46, maxWidth: 760 },
  stepsGrid: { flexDirection: "row", gap: 14, marginTop: 26 },
  stack: { flexDirection: "column" },
  stepCard: { backgroundColor: "#1A0E08", borderColor: "rgba(201,151,90,0.16)", borderRadius: 18, borderWidth: 1, flex: 1, padding: 18 },
  stepNumber: { color: "#C9975A", fontSize: 11, fontWeight: "900", letterSpacing: 1.8, marginBottom: 22 },
  stepTitle: { color: "#F2E8D9", fontSize: 17, fontWeight: "800", marginBottom: 8 },
  stepText: { color: "rgba(242,232,217,0.56)", fontSize: 13, lineHeight: 21 },
  featureGrid: { flexDirection: "row", gap: 18, marginHorizontal: "auto", maxWidth: 1120, paddingHorizontal: 22, width: "100%" },
  featurePanel: { borderColor: "rgba(201,151,90,0.2)", borderRadius: 24, borderWidth: 1, flex: 1, minHeight: 470, overflow: "hidden", position: "relative" },
  featureImage: { height: "100%", opacity: 0.56, position: "absolute", width: "100%" },
  featureContent: { bottom: 0, left: 0, padding: 28, position: "absolute", right: 0 },
  featureTitle: { color: "#fff", fontSize: 34, fontWeight: "300", marginBottom: 10 },
  featureSub: { color: "rgba(242,232,217,0.68)", fontSize: 14, lineHeight: 23, maxWidth: 520 },
  points: { gap: 9, marginTop: 18 },
  pointRow: { alignItems: "flex-start", flexDirection: "row", gap: 9 },
  pointDot: { backgroundColor: "#C9975A", borderRadius: 4, height: 7, marginTop: 7, width: 7 },
  pointText: { color: "rgba(242,232,217,0.78)", flex: 1, fontSize: 13, lineHeight: 21 },
  featureCta: { alignSelf: "flex-start", backgroundColor: "#C0392B", borderRadius: 14, marginTop: 22, paddingHorizontal: 18, paddingVertical: 13 },
  featureCtaText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  browseBand: {
    alignItems: "center",
    backgroundColor: "rgba(201,151,90,0.06)",
    borderColor: "rgba(201,151,90,0.16)",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 20,
    justifyContent: "space-between",
    marginHorizontal: "auto",
    marginTop: 24,
    maxWidth: 1120,
    padding: 26,
    width: "calc(100% - 44px)" as never,
  },
  browseCopy: { flex: 1 },
  browseTitle: { color: "#F2E8D9", fontSize: 25, fontWeight: "400", marginBottom: 7 },
  browseSub: { color: "rgba(242,232,217,0.6)", fontSize: 14, lineHeight: 23, maxWidth: 660 },
});
