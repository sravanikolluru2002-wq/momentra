import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { DARK, formatINR, getExperience } from "@/constants/experiences";
import { WebEnquiryScreen } from "@/components/web-enquiry-screen";
import { whatsappCategoryFromOccasion } from "@/lib/whatsapp";

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    experienceId?: string;
    addOns?: string;
    date?: string;
    time?: string;
  }>();
  const theme = DARK;
  const [paid, setPaid] = useState(false);
  const [processing, setProcessing] = useState(false);
  const experience = getExperience(params.experienceId);
  const selectedAddOns = useMemo(() => {
    const selected = params.addOns ? params.addOns.split(",").filter(Boolean) : [];
    return experience.addOns.filter((addOn) => selected.includes(addOn.id));
  }, [experience.addOns, params.addOns]);
  const total = experience.price + selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
  const date = params.date ?? "12 May 2026";
  const time = params.time ?? "8:00 PM";

  if (Platform.OS === "web") {
    return (
      <WebEnquiryScreen
        primaryLabel="Talk to Momentra"
        subtitle="Share your preferred experience details and Momentra will help confirm availability, refine the plan, and guide the next steps."
        summary={[
          { label: "Experience", value: experience.title },
          { label: "Date", value: date },
          { label: "Time", value: time },
          { label: "Estimated Plan", value: formatINR(total) },
        ]}
        title="Request Availability"
        whatsappCategory={whatsappCategoryFromOccasion(experience.occasionId)}
      />
    );
  }

  function pay() {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setPaid(true);
    }, 900);
  }

  if (paid) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.bg }]}>
        <ScrollView
          contentContainerStyle={styles.successContent}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          <View style={[styles.successCircle, { borderColor: theme.border }]}>
            <Text style={styles.successIcon}>🥂</Text>
          </View>
          <Text style={[styles.successTitle, { color: theme.text }]}>
            Your Moment{"\n"}is Locked!
          </Text>
          <Text style={[styles.successSub, { color: theme.gold }]}>Booking #MN-4826</Text>

          <View style={[styles.successDetails, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <SummaryRow label="Experience" value={experience.title} />
            <SummaryRow label="Date" value={date} />
            <SummaryRow label="Time" value={time} />
            <SummaryRow label="Total Paid" value={formatINR(total)} />
          </View>

          <Text style={[styles.successNote, { color: theme.text2 }]}>
            Setup preview photo before arrival{"\n"}WhatsApp and email confirmation{"\n"}Live support contact
          </Text>

          <Pressable onPress={() => router.replace("/home")} style={[styles.cta, styles.centerCta, { backgroundColor: theme.red }]}>
            <Text style={styles.ctaText}>Back to Home</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.backText, { color: theme.gold }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Payment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View style={[styles.totalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.totalLabel, { color: theme.text2 }]}>TOTAL AMOUNT</Text>
          <Text style={[styles.totalValue, { color: theme.red }]}>{formatINR(total)}</Text>
          <Text style={[styles.secure, { color: theme.text2 }]}>🔒 Secure Checkout</Text>
        </View>

        <PaymentTitle title="UPI" />
        <View style={styles.logoRow}>
          {["G Pay", "PhonePe", "Paytm", "BHIM"].map((item) => (
            <View key={item} style={styles.upiItem}>
              <View style={[styles.paymentLogo, { backgroundColor: theme.red }]}>
                <Text style={styles.paymentLogoText}>{item}</Text>
              </View>
              <Text style={[styles.paymentName, { color: theme.text2 }]}>{item}</Text>
            </View>
          ))}
        </View>

        <PaymentTitle title="Cards" />
        <View style={styles.cardRow}>
          {["VISA", "MC", "RuPay", "Amex"].map((item) => (
            <View key={item} style={[styles.cardLogo, { backgroundColor: theme.surface2 }]}>
              <Text style={[styles.cardLogoText, { color: theme.gold }]}>{item}</Text>
            </View>
          ))}
        </View>

        <PaymentTitle title="Other Options" />
        <Option label="Net Banking" icon="🏦" />
        <Option label="Wallets" icon="👝" />
        <View style={[styles.coupon, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={styles.couponIcon}>🏷️</Text>
          <Text style={[styles.couponText, { color: theme.text2 }]}>Apply Coupon Code</Text>
          <View style={[styles.apply, { backgroundColor: theme.red }]}>
            <Text style={styles.applyText}>Apply</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
        <Pressable onPress={pay} disabled={processing} style={[styles.cta, { backgroundColor: theme.red }]}>
          <Text style={styles.ctaText}>{processing ? "Processing..." : `Pay ${formatINR(total)}`}</Text>
          <Text style={styles.ctaPrice}>🔒 Secure</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function PaymentTitle({ title }: { title: string }) {
  return <Text style={styles.paymentTitle}>{title}</Text>;
}

function Option({ label, icon }: { label: string; icon: string }) {
  return (
    <View style={styles.option}>
      <Text style={styles.optionIcon}>{icon}</Text>
      <Text style={styles.optionText}>{label}</Text>
      <Text style={styles.optionArrow}>›</Text>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { alignItems: "center", borderBottomWidth: 1, flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  back: { alignItems: "center", borderRadius: 18, borderWidth: 1, height: 36, justifyContent: "center", width: 36 },
  backText: { fontSize: 26, lineHeight: 28 },
  title: { flex: 1, fontSize: 21, fontWeight: "800", textAlign: "center" },
  headerSpacer: { width: 36 },
  body: { flexGrow: 1, padding: 14, paddingBottom: 164 },
  totalCard: { alignItems: "center", borderRadius: 15, borderWidth: 1, marginBottom: 18, padding: 18 },
  totalLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  totalValue: { fontSize: 38, fontWeight: "900", marginVertical: 6 },
  secure: { fontSize: 11 },
  paymentTitle: { color: "#F2E8D9", fontSize: 16, fontWeight: "800", marginBottom: 11 },
  logoRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  upiItem: { alignItems: "center", gap: 5 },
  paymentLogo: { alignItems: "center", borderRadius: 8, height: 32, justifyContent: "center", width: 62 },
  paymentLogoText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  paymentName: { fontSize: 9 },
  cardRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  cardLogo: { alignItems: "center", borderRadius: 7, flex: 1, height: 34, justifyContent: "center" },
  cardLogoText: { fontSize: 10, fontWeight: "900" },
  option: { alignItems: "center", backgroundColor: "#1A0E08", borderColor: "rgba(201,151,90,0.18)", borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 12, marginBottom: 9, padding: 14 },
  optionIcon: { fontSize: 17 },
  optionText: { color: "#F2E8D9", flex: 1, fontSize: 13, fontWeight: "700" },
  optionArrow: { color: "rgba(242,232,217,0.62)", fontSize: 20 },
  coupon: { alignItems: "center", borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 10, marginTop: 4, padding: 13 },
  couponIcon: { fontSize: 15 },
  couponText: { flex: 1, fontSize: 12 },
  apply: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  applyText: { color: "#fff", fontSize: 11, fontWeight: "900" },
  footer: { borderTopWidth: 1, bottom: 0, left: 0, padding: 16, paddingBottom: 22, position: "absolute", right: 0 },
  cta: { alignItems: "center", borderRadius: 15, flexDirection: "row", justifyContent: "space-between", padding: 16 },
  centerCta: { justifyContent: "center", marginTop: 22, width: "100%" },
  ctaText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  ctaPrice: { color: "rgba(255,255,255,0.84)", fontSize: 13, fontWeight: "900" },
  successContent: { alignItems: "center", flexGrow: 1, justifyContent: "center", padding: 24, paddingBottom: 100 },
  successCircle: { alignItems: "center", backgroundColor: "rgba(192,57,43,0.1)", borderRadius: 44, borderWidth: 1, height: 88, justifyContent: "center", marginBottom: 18, width: 88 },
  successIcon: { fontSize: 38 },
  successTitle: { fontSize: 30, fontWeight: "800", lineHeight: 35, textAlign: "center" },
  successSub: { fontSize: 13, fontWeight: "800", marginBottom: 20, marginTop: 7 },
  successDetails: { borderRadius: 15, borderWidth: 1, marginBottom: 18, overflow: "hidden", width: "100%" },
  summaryRow: { alignItems: "center", borderBottomColor: "rgba(201,151,90,0.14)", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: 13 },
  summaryLabel: { color: "rgba(242,232,217,0.62)", fontSize: 12 },
  summaryValue: { color: "#F2E8D9", fontSize: 12, fontWeight: "900", maxWidth: "55%", textAlign: "right" },
  successNote: { fontSize: 12, lineHeight: 24, textAlign: "center" },
});
