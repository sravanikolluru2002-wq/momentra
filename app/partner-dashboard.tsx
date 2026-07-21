import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";

import { useMomentraTheme } from "@/contexts/momentra-theme";
import {
  estimateRegistrationFee,
  formatCurrency,
  formatShortDate,
  PartnerProfileRow,
  PayoutBatchRow,
  prettifyStatus,
  PortalTone,
  statusTone,
  SupportTicketRow,
} from "@/lib/portal";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";

const DARK = {
  bg: "#0D0905",
  bg2: "#1A0E08",
  bg3: "#231508",
  side: "#110904",
  card: "#1A0E08",
  text: "#F2E8D9",
  text2: "rgba(242,232,217,0.55)",
  text3: "rgba(242,232,217,0.3)",
  border: "rgba(201,151,90,0.16)",
  borderStrong: "rgba(201,151,90,0.35)",
  gold: "#C9975A",
  red: "#C0392B",
  green: "#27AE60",
  amber: "#D4820A",
  blue: "#4BAFD6",
  purple: "#9B6DFF",
  greenBg: "rgba(39,174,96,0.12)",
  amberBg: "rgba(212,130,10,0.12)",
  blueBg: "rgba(75,175,214,0.12)",
  purpleBg: "rgba(155,109,255,0.12)",
  redBg: "rgba(192,57,43,0.12)",
};

const LIGHT = {
  bg: "#F7F4EF",
  bg2: "#FFFFFF",
  bg3: "#EDEAE3",
  side: "#110904",
  card: "#FFFFFF",
  text: "#1A1208",
  text2: "#6B5A42",
  text3: "#9C8A6E",
  border: "rgba(170,130,70,0.18)",
  borderStrong: "rgba(170,130,70,0.38)",
  gold: "#B8892A",
  red: "#B83225",
  green: "#2A7A4A",
  amber: "#9A6010",
  blue: "#1E5FA8",
  purple: "#5A3DC4",
  greenBg: "rgba(42,122,74,0.1)",
  amberBg: "rgba(154,96,16,0.1)",
  blueBg: "rgba(30,95,168,0.1)",
  purpleBg: "rgba(90,61,196,0.1)",
  redBg: "rgba(184,50,37,0.1)",
};

type ScreenKey = "approval" | "overview" | "payouts" | "support";

export default function PartnerDashboardScreen() {
  const { partnerId } = useLocalSearchParams<{ partnerId?: string }>();
  const { isDark, setIsDark } = useMomentraTheme();
  const theme = isDark ? DARK : LIGHT;
  const { width } = useWindowDimensions();
  const compact = width < 920;
  const [screen, setScreen] = useState<ScreenKey>("overview");
  const [partner, setPartner] = useState<PartnerProfileRow | null>(null);
  const [payouts, setPayouts] = useState<PayoutBatchRow[]>([]);
  const [tickets, setTickets] = useState<SupportTicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ticketText, setTicketText] = useState("");

  useEffect(() => {
    if (!partnerId || !hasSupabaseEnv) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadPortalData() {
      setLoading(true);
      setError("");

      const [partnerResult, payoutResult, ticketResult] = await Promise.all([
        supabase.from("partner_profiles").select("*").eq("id", partnerId).single(),
        supabase.from("payout_batches").select("*").eq("partner_profile_id", partnerId).order("created_at", { ascending: false }),
        supabase.from("support_tickets").select("*").eq("partner_profile_id", partnerId).order("created_at", { ascending: false }),
      ]);

      if (!active) return;

      const failing = partnerResult.error ?? payoutResult.error ?? ticketResult.error;

      if (failing) {
        setError(failing.message);
      } else {
        setPartner(partnerResult.data as PartnerProfileRow);
        setPayouts((payoutResult.data ?? []) as PayoutBatchRow[]);
        setTickets((ticketResult.data ?? []) as SupportTicketRow[]);
      }

      setLoading(false);
    }

    void loadPortalData();

    const channel = supabase
      .channel(`partner-portal-${partnerId}`)
      .on("postgres_changes", { event: "*", filter: `id=eq.${partnerId}`, schema: "public", table: "partner_profiles" }, (payload) => {
        if (payload.new) setPartner(payload.new as PartnerProfileRow);
      })
      .on("postgres_changes", { event: "*", filter: `partner_profile_id=eq.${partnerId}`, schema: "public", table: "support_tickets" }, async () => {
        const refreshed = await supabase.from("support_tickets").select("*").eq("partner_profile_id", partnerId).order("created_at", { ascending: false });
        if (!refreshed.error && active) setTickets((refreshed.data ?? []) as SupportTicketRow[]);
      })
      .on("postgres_changes", { event: "*", filter: `partner_profile_id=eq.${partnerId}`, schema: "public", table: "payout_batches" }, async () => {
        const refreshed = await supabase.from("payout_batches").select("*").eq("partner_profile_id", partnerId).order("created_at", { ascending: false });
        if (!refreshed.error && active) setPayouts((refreshed.data ?? []) as PayoutBatchRow[]);
      })
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [partnerId]);

  const stats = useMemo(() => {
    if (!partner) return [];

    return [
      ["Profile status", prettifyStatus(partner.status), statusTone(partner.status)],
      ["KYC status", prettifyStatus(partner.kyc_status), statusTone(partner.kyc_status)],
      ["Payment status", prettifyStatus(partner.payment_status), statusTone(partner.payment_status)],
      ["Registration fee", formatCurrency(partner.payment_total || estimateRegistrationFee(partner.category)), "neutral" as PortalTone],
    ];
  }, [partner]);

  async function raiseSupportTicket() {
    if (!partner || !ticketText.trim()) return;

    const { error: insertError } = await supabase.from("support_tickets").insert({
      owner_name: "Partner request",
      partner_profile_id: partner.id,
      priority: "blue",
      status: "open",
      summary: ticketText.trim(),
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setTicketText("");
    setScreen("support");
  }

  if (!hasSupabaseEnv) {
    return <PortalMessage text="Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to use the real portal backend." theme={theme} title="Backend unavailable" />;
  }

  if (!partnerId) {
    return <PortalMessage text="Open the partner dashboard from the partner login form so the app can load a real partner record." theme={theme} title="Partner not selected" />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={isDark ? ["#130B06", "#0D0905"] : ["#FBF7F1", "#F7F4EF"]} style={StyleSheet.absoluteFill} />

      <View style={[styles.shell, compact && styles.shellCompact]}>
        <View style={[styles.sidebar, compact && styles.sidebarCompact, { backgroundColor: theme.side }]}>
          <View style={styles.logoRow}>
            <View style={[styles.logoIcon, { backgroundColor: theme.red }]}>
              <Text style={styles.logoIconText}>M</Text>
            </View>
            <View>
              <Text style={styles.logoTitle}>Momentra</Text>
              <Text style={styles.logoSub}>Partner Portal</Text>
            </View>
          </View>

          <View style={styles.sidebarScroll}>
            {[
              ["Overview", "overview"],
              ["Approval Status", "approval"],
              ["Payouts", "payouts"],
              ["Support", "support"],
            ].map(([label, key]) => {
              const active = screen === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setScreen(key as ScreenKey)}
                  style={[styles.navItem, active && { backgroundColor: "rgba(192,57,43,0.16)", borderColor: "rgba(192,57,43,0.28)" }]}
                >
                  <Text style={[styles.navItemText, { color: active ? "#F2E8D9" : "rgba(242,232,217,0.72)" }]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sidebarFooter}>
            <Pressable onPress={() => router.replace("/partner-login")} style={styles.signOutItem}>
              <Text style={styles.signOutText}>Back to partner login</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.main}>
          <View style={[styles.topbar, { backgroundColor: theme.bg2, borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.breadcrumb, { color: theme.text3 }]}>Momentra Partner / {screenTitle(screen)}</Text>
              <Text style={[styles.topTitle, { color: theme.text }]}>{partner?.business_name ?? "Loading partner..."}</Text>
            </View>

            <View style={styles.topbarActions}>
              <Pressable onPress={() => setIsDark((current) => !current)} style={[styles.themePill, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
                <Text style={[styles.themePillText, { color: theme.text2 }]}>{isDark ? "Switch to light" : "Switch to dark"}</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? <Text style={[styles.loadingText, { color: theme.text2 }]}>Loading live partner data...</Text> : null}
            {error ? <Text style={[styles.errorText, { color: theme.red }]}>{error}</Text> : null}

            {partner ? (
              <>
                <View style={[styles.statsGrid, compact && styles.stack]}>
                  {stats.map(([label, value, tone]) => (
                    <View key={label} style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <Text style={[styles.statLabel, { color: theme.text3 }]}>{label}</Text>
                      <Text style={[styles.statValue, { color: toneColor(theme, tone) }]}>{value}</Text>
                    </View>
                  ))}
                </View>

                {screen === "overview" ? (
                  <View style={[styles.detailsPanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.panelTitle, { color: theme.text }]}>Profile overview</Text>
                    <Text style={[styles.detailsHeading, { color: theme.text }]}>{partner.full_name}</Text>
                    <Text style={[styles.detailsSubheading, { color: theme.text3 }]}>
                      {partner.business_name} | {partner.category} | {partner.city}
                    </Text>
                    <View style={styles.badgeRow}>
                      <StatusBadge label={prettifyStatus(partner.status)} theme={theme} tone={statusTone(partner.status)} />
                      <StatusBadge label={prettifyStatus(partner.visibility_status)} theme={theme} tone={statusTone(partner.visibility_status)} />
                    </View>

                    <View style={[styles.notePanel, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
                      <Text style={[styles.noteTitle, { color: theme.text3 }]}>Partner note</Text>
                      <Text style={[styles.noteText, { color: theme.text2 }]}>{partner.status_note || "No partner note added yet."}</Text>
                    </View>

                    <View style={[styles.notePanel, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
                      <Text style={[styles.noteTitle, { color: theme.text3 }]}>Admin note</Text>
                      <Text style={[styles.noteText, { color: theme.text2 }]}>{partner.admin_note || "No admin note has been shared yet."}</Text>
                    </View>
                  </View>
                ) : null}

                {screen === "approval" ? (
                  <View style={[styles.detailsPanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.panelTitle, { color: theme.text }]}>Approval progress</Text>
                    {[
                      ["Profile submitted", formatShortDate(partner.submitted_at), "green"],
                      ["KYC status", prettifyStatus(partner.kyc_status), statusTone(partner.kyc_status)],
                      ["Operations status", prettifyStatus(partner.status), statusTone(partner.status)],
                      ["Visibility", prettifyStatus(partner.visibility_status), statusTone(partner.visibility_status)],
                    ].map(([label, value, tone]) => (
                      <View key={label} style={[styles.summaryRow, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.summaryTitle, { color: theme.text }]}>{label}</Text>
                        <Text style={[styles.summaryValue, { color: toneColor(theme, tone as PortalTone) }]}>{value}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {screen === "payouts" ? (
                  <View style={[styles.detailsPanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.panelTitle, { color: theme.text }]}>Payout batches</Text>
                    {payouts.length ? (
                      payouts.map((payout) => (
                        <View key={payout.id} style={[styles.summaryRow, { borderBottomColor: theme.border }]}>
                          <View>
                            <Text style={[styles.summaryTitle, { color: theme.text }]}>{formatCurrency(payout.amount)}</Text>
                            <Text style={[styles.summarySubtitle, { color: theme.text3 }]}>{payout.release_eta || "Release ETA not set"}</Text>
                          </View>
                          <StatusBadge label={prettifyStatus(payout.status)} theme={theme} tone={statusTone(payout.status)} />
                        </View>
                      ))
                    ) : (
                      <Text style={[styles.noteText, { color: theme.text2 }]}>No payout batches exist yet for this partner.</Text>
                    )}
                  </View>
                ) : null}

                {screen === "support" ? (
                  <View style={[styles.detailsPanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.panelTitle, { color: theme.text }]}>Support tickets</Text>
                    {tickets.map((ticket) => (
                      <View key={ticket.id} style={[styles.ticketCard, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
                        <View style={styles.ticketHeader}>
                          <Text style={[styles.summaryTitle, { color: theme.text }]}>{ticket.summary}</Text>
                          <StatusBadge label={prettifyStatus(ticket.status)} theme={theme} tone={statusTone(ticket.status)} />
                        </View>
                        <Text style={[styles.summarySubtitle, { color: theme.text3 }]}>
                          {ticket.owner_name || "Support desk"} | {formatShortDate(ticket.created_at)}
                        </Text>
                      </View>
                    ))}

                    <View style={[styles.notePanel, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
                      <Text style={[styles.noteTitle, { color: theme.text3 }]}>Raise a new request</Text>
                      <TextInput
                        multiline
                        onChangeText={setTicketText}
                        placeholder="Describe what you need help with..."
                        placeholderTextColor={theme.text3}
                        style={[styles.textArea, { borderColor: theme.border, color: theme.text }]}
                        value={ticketText}
                      />
                      <View style={styles.actionRow}>
                        <Pressable onPress={raiseSupportTicket} style={[styles.actionButton, { backgroundColor: theme.blueBg, borderColor: theme.borderStrong }]}>
                          <Text style={[styles.actionButtonText, { color: theme.blue }]}>Submit support request</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ) : null}
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

function PortalMessage({
  text,
  theme,
  title,
}: {
  text: string;
  theme: typeof DARK | typeof LIGHT;
  title: string;
}) {
  return (
    <View style={[styles.screen, { alignItems: "center", backgroundColor: theme.bg, justifyContent: "center", padding: 24 }]}>
      <View style={[styles.detailsPanel, { backgroundColor: theme.card, borderColor: theme.border, maxWidth: 640 }]}>
        <Text style={[styles.panelTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.noteText, { color: theme.text2 }]}>{text}</Text>
      </View>
    </View>
  );
}

function StatusBadge({
  label,
  theme,
  tone,
}: {
  label: string;
  theme: typeof DARK | typeof LIGHT;
  tone: PortalTone;
}) {
  return (
    <View style={[styles.badge, badgeStyle(theme, tone)]}>
      <Text style={[styles.badgeText, { color: badgeTextColor(theme, tone) }]}>{label}</Text>
    </View>
  );
}

function screenTitle(screen: ScreenKey) {
  if (screen === "approval") return "Approval Status";
  if (screen === "payouts") return "Payouts";
  if (screen === "support") return "Support";
  return "Overview";
}

function toneColor(theme: typeof DARK | typeof LIGHT, tone: PortalTone) {
  if (tone === "green") return theme.green;
  if (tone === "blue") return theme.blue;
  if (tone === "amber") return theme.amber;
  if (tone === "purple") return theme.purple;
  if (tone === "red") return theme.red;
  return theme.text;
}

function badgeStyle(theme: typeof DARK | typeof LIGHT, tone: PortalTone) {
  if (tone === "green") return { backgroundColor: theme.greenBg, borderColor: "rgba(42,122,74,0.25)" };
  if (tone === "amber") return { backgroundColor: theme.amberBg, borderColor: "rgba(154,96,16,0.25)" };
  if (tone === "blue") return { backgroundColor: theme.blueBg, borderColor: "rgba(30,95,168,0.25)" };
  if (tone === "purple") return { backgroundColor: theme.purpleBg, borderColor: "rgba(90,61,196,0.25)" };
  if (tone === "red") return { backgroundColor: theme.redBg, borderColor: "rgba(184,50,37,0.22)" };
  return { backgroundColor: theme.bg3, borderColor: theme.border };
}

function badgeTextColor(theme: typeof DARK | typeof LIGHT, tone: PortalTone) {
  if (tone === "green") return theme.green;
  if (tone === "amber") return theme.amber;
  if (tone === "blue") return theme.blue;
  if (tone === "purple") return theme.purple;
  if (tone === "red") return theme.red;
  return theme.text2;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  shell: { flex: 1, flexDirection: "row" },
  shellCompact: { flexDirection: "column" },
  sidebar: { paddingTop: 18, width: 240 },
  sidebarCompact: { width: "100%" },
  logoRow: { alignItems: "center", borderBottomColor: "rgba(201,151,90,0.1)", borderBottomWidth: 1, flexDirection: "row", gap: 10, paddingBottom: 14, paddingHorizontal: 16 },
  logoIcon: { alignItems: "center", borderRadius: 12, height: 42, justifyContent: "center", width: 42 },
  logoIconText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  logoTitle: { color: "#F2E8D9", fontFamily: "serif", fontSize: 22, fontStyle: "italic" },
  logoSub: { color: "rgba(201,151,90,0.55)", fontSize: 9, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },
  sidebarScroll: { flex: 1, paddingHorizontal: 10, paddingTop: 10 },
  navItem: { borderColor: "transparent", borderRadius: 10, borderWidth: 1, marginBottom: 3, paddingHorizontal: 10, paddingVertical: 9 },
  navItemText: { fontSize: 12.5, fontWeight: "500" },
  sidebarFooter: { borderTopColor: "rgba(201,151,90,0.1)", borderTopWidth: 1, padding: 10 },
  signOutItem: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9 },
  signOutText: { color: "rgba(242,232,217,0.6)", fontSize: 12.5, fontWeight: "500" },
  main: { flex: 1 },
  topbar: { alignItems: "center", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 52, paddingHorizontal: 24, paddingVertical: 12 },
  breadcrumb: { fontSize: 12, marginBottom: 3 },
  topTitle: { fontSize: 14, fontWeight: "600" },
  topbarActions: { alignItems: "center", flexDirection: "row", gap: 8 },
  themePill: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 6 },
  themePillText: { fontSize: 11, fontWeight: "600" },
  content: { padding: 24 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  stack: { flexDirection: "column" },
  statCard: { borderRadius: 12, borderWidth: 1, flexGrow: 1, minWidth: 150, padding: 16 },
  statLabel: { fontSize: 10, letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" },
  statValue: { fontFamily: "serif", fontSize: 22, lineHeight: 28 },
  detailsPanel: { borderRadius: 14, borderWidth: 1, padding: 16 },
  panelTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  detailsHeading: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  detailsSubheading: { fontSize: 12, marginBottom: 12 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  badge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10.5, fontWeight: "600" },
  notePanel: { borderRadius: 10, borderWidth: 1, marginBottom: 12, padding: 12 },
  noteTitle: { fontSize: 10, fontWeight: "600", letterSpacing: 1.5, marginBottom: 8, textTransform: "uppercase" },
  noteText: { fontSize: 12, lineHeight: 18 },
  summaryRow: { alignItems: "center", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  summaryTitle: { fontSize: 13, fontWeight: "700" },
  summarySubtitle: { fontSize: 12, marginTop: 2 },
  summaryValue: { fontSize: 13, fontWeight: "700" },
  loadingText: { fontSize: 13, marginBottom: 12 },
  errorText: { fontSize: 12, fontWeight: "700", lineHeight: 18, marginBottom: 12 },
  ticketCard: { borderRadius: 10, borderWidth: 1, marginBottom: 10, padding: 12 },
  ticketHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  textArea: { borderRadius: 12, borderWidth: 1, fontSize: 14, minHeight: 96, padding: 12, textAlignVertical: "top" as never },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 10 },
  actionButton: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  actionButtonText: { fontSize: 12, fontWeight: "600" },
});
