import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { useMomentraTheme } from "@/contexts/momentra-theme";
import {
  AdminProfileRow,
  formatCurrency,
  formatShortDate,
  MomentraEnquiryRow,
  PartnerProfileRow,
  PayoutBatchRow,
  PortalTone,
  prettifyStatus,
  statusTone,
  SupportTicketRow,
} from "@/lib/portal";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { listMomentraEnquiries, updateMomentraEnquiryStatus } from "@/lib/supabase/enquiries";

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

type AdminScreen = "enquiries" | "finance" | "ops" | "support";

export default function AdminDashboardScreen() {
  const { adminId } = useLocalSearchParams<{ adminId?: string }>();
  const { isDark, setIsDark } = useMomentraTheme();
  const theme = isDark ? DARK : LIGHT;
  const { width } = useWindowDimensions();
  const compact = width < 920;
  const [screen, setScreen] = useState<AdminScreen>("ops");
  const [adminProfile, setAdminProfile] = useState<AdminProfileRow | null>(null);
  const [partners, setPartners] = useState<PartnerProfileRow[]>([]);
  const [enquiries, setEnquiries] = useState<MomentraEnquiryRow[]>([]);
  const [tickets, setTickets] = useState<SupportTicketRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutBatchRow[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string>("");
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadData() {
      setLoading(true);
      setError("");

      const [adminResult, partnersResult, ticketsResult, payoutsResult, enquiriesResult] = await Promise.all([
        adminId ? supabase.from("admin_profiles").select("*").eq("id", adminId).maybeSingle() : Promise.resolve({ data: null, error: null }),
        supabase.from("partner_profiles").select("*").order("submitted_at", { ascending: false }),
        supabase.from("support_tickets").select("*").order("created_at", { ascending: false }),
        supabase.from("payout_batches").select("*").order("created_at", { ascending: false }),
        listMomentraEnquiries().then((data) => ({ data, error: null })).catch((error) => ({ data: [], error })),
      ]);

      if (!active) return;

      const failing = adminResult.error ?? partnersResult.error ?? ticketsResult.error ?? payoutsResult.error ?? enquiriesResult.error;

      if (failing) {
        setError(failing.message);
      } else {
        const nextPartners = (partnersResult.data ?? []) as PartnerProfileRow[];
        const nextTickets = (ticketsResult.data ?? []) as SupportTicketRow[];
        const nextPayouts = (payoutsResult.data ?? []) as PayoutBatchRow[];
        const nextEnquiries = (enquiriesResult.data ?? []) as MomentraEnquiryRow[];
        setAdminProfile((adminResult.data as AdminProfileRow | null) ?? null);
        setPartners(nextPartners);
        setTickets(nextTickets);
        setPayouts(nextPayouts);
        setEnquiries(nextEnquiries);
        setSelectedPartnerId((current) => current || nextPartners[0]?.id || "");
        setSelectedEnquiryId((current) => current || nextEnquiries[0]?.id || "");
        setSelectedTicketId((current) => current || nextTickets[0]?.id || "");
      }

      setLoading(false);
    }

    void loadData();

    const channel = supabase
      .channel(`admin-portal-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "partner_profiles" }, async () => {
        const refreshed = await supabase.from("partner_profiles").select("*").order("submitted_at", { ascending: false });
        if (!refreshed.error && active) setPartners((refreshed.data ?? []) as PartnerProfileRow[]);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, async () => {
        const refreshed = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false });
        if (!refreshed.error && active) setTickets((refreshed.data ?? []) as SupportTicketRow[]);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "payout_batches" }, async () => {
        const refreshed = await supabase.from("payout_batches").select("*").order("created_at", { ascending: false });
        if (!refreshed.error && active) setPayouts((refreshed.data ?? []) as PayoutBatchRow[]);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "momentra_enquiries" }, async () => {
        const refreshed = await listMomentraEnquiries();
        if (active) setEnquiries(refreshed as MomentraEnquiryRow[]);
      })
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [adminId]);

  const selectedPartner = partners.find((partner) => partner.id === selectedPartnerId) ?? partners[0] ?? null;
  const selectedEnquiry = enquiries.find((enquiry) => enquiry.id === selectedEnquiryId) ?? enquiries[0] ?? null;
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? tickets[0] ?? null;

  const stats = useMemo(() => {
    return [
      ["Pending review", String(partners.filter((partner) => statusTone(partner.status) === "amber").length), "amber" as PortalTone],
      ["New enquiries", String(enquiries.filter((enquiry) => enquiry.status === "new").length), "blue" as PortalTone],
      ["Approved profiles", String(partners.filter((partner) => statusTone(partner.kyc_status) === "green").length), "green" as PortalTone],
      ["Open tickets", String(tickets.filter((ticket) => statusTone(ticket.status) !== "green").length), "blue" as PortalTone],
    ];
  }, [enquiries, partners, tickets]);

  async function updatePartner(partnerId: string, patch: Partial<PartnerProfileRow>) {
    const { error: updateError } = await supabase.from("partner_profiles").update(patch).eq("id", partnerId);
    if (updateError) setError(updateError.message);
  }

  async function updateTicket(ticketId: string, patch: Partial<SupportTicketRow>) {
    const { error: updateError } = await supabase.from("support_tickets").update(patch).eq("id", ticketId);
    if (updateError) setError(updateError.message);
  }

  async function updateEnquiry(enquiryId: string, status: string, adminNote?: string) {
    try {
      await updateMomentraEnquiryStatus(enquiryId, { adminNote, status });
      const refreshed = await listMomentraEnquiries();
      setEnquiries(refreshed as MomentraEnquiryRow[]);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update enquiry.");
    }
  }

  async function updatePayouts(status: string, releaseEta: string) {
    if (!selectedPartner) return;

    const { error: updateError } = await supabase
      .from("payout_batches")
      .update({ release_eta: releaseEta, status })
      .eq("partner_profile_id", selectedPartner.id);

    if (updateError) setError(updateError.message);
  }

  if (!hasSupabaseEnv) {
    return <PortalMessage text="Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to use the real admin backend." theme={theme} title="Backend unavailable" />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={isDark ? ["#130B06", "#0D0905"] : ["#FBF7F1", "#F7F4EF"]} style={StyleSheet.absoluteFill} />

      <View style={[styles.shell, compact && styles.shellCompact]}>
        <View style={[styles.sidebar, compact && styles.sidebarCompact, { backgroundColor: theme.side }]}>
          <View style={styles.logoRow}>
            <View style={[styles.logoIcon, { backgroundColor: theme.red }]}>
              <Text style={styles.logoIconText}>A</Text>
            </View>
            <View>
              <Text style={styles.logoTitle}>Momentra</Text>
              <Text style={styles.logoSub}>Admin Control</Text>
            </View>
          </View>

          <View style={styles.sidebarScroll}>
            {[
              ["Operations", "ops"],
              ["Enquiries", "enquiries"],
              ["Finance", "finance"],
              ["Support", "support"],
            ].map(([label, key]) => {
              const active = screen === key;
              return (
                <Pressable key={key} onPress={() => setScreen(key as AdminScreen)} style={[styles.navItem, active && { backgroundColor: "rgba(192,57,43,0.16)", borderColor: "rgba(192,57,43,0.28)" }]}>
                  <Text style={[styles.navItemText, { color: active ? "#F2E8D9" : "rgba(242,232,217,0.72)" }]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sidebarFooter}>
            <Text style={styles.footerName}>{adminProfile?.full_name || adminProfile?.email || "Admin session"}</Text>
            <Text style={styles.footerVendor}>{adminProfile?.role || "Operations"}</Text>
            <Pressable onPress={() => router.replace("/admin-login")} style={styles.signOutItem}>
              <Text style={styles.signOutText}>Back to admin login</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.main}>
          <View style={[styles.topbar, { backgroundColor: theme.bg2, borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.breadcrumb, { color: theme.text3 }]}>Momentra Admin / {screenTitle(screen)}</Text>
              <Text style={[styles.topTitle, { color: theme.text }]}>Live admin dashboard</Text>
            </View>

            <View style={styles.topbarActions}>
              <Pressable onPress={() => setIsDark((current) => !current)} style={[styles.themePill, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
                <Text style={[styles.themePillText, { color: theme.text2 }]}>{isDark ? "Switch to light" : "Switch to dark"}</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? <Text style={[styles.loadingText, { color: theme.text2 }]}>Loading live admin data...</Text> : null}
            {error ? <Text style={[styles.errorText, { color: theme.red }]}>{error}</Text> : null}

            <View style={[styles.statsGrid, compact && styles.stack]}>
              {stats.map(([label, value, tone]) => (
                <View key={label} style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.statLabel, { color: theme.text3 }]}>{label}</Text>
                  <Text style={[styles.statValue, { color: toneColor(theme, tone) }]}>{value}</Text>
                </View>
              ))}
            </View>

            {screen === "ops" ? (
              <View style={[styles.twoCol, compact && styles.stack]}>
                <View style={styles.leftCol}>
                  {partners.map((partner) => (
                    <Pressable
                      key={partner.id}
                      onPress={() => setSelectedPartnerId(partner.id)}
                      style={[styles.adminCard, { backgroundColor: theme.card, borderColor: theme.border }, selectedPartnerId === partner.id && { borderColor: theme.gold, borderWidth: 1.5 }]}
                    >
                      <Text style={[styles.vendorName, { color: theme.text }]}>{partner.business_name}</Text>
                      <Text style={[styles.vendorMeta, { color: theme.text3 }]}>{partner.full_name} | {partner.city}</Text>
                      <View style={styles.badgeRow}>
                        <StatusBadge label={prettifyStatus(partner.status)} theme={theme} tone={statusTone(partner.status)} />
                        <StatusBadge label={prettifyStatus(partner.kyc_status)} theme={theme} tone={statusTone(partner.kyc_status)} />
                      </View>
                    </Pressable>
                  ))}
                </View>

                {selectedPartner ? (
                  <View style={[styles.detailsPanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.panelTitle, { color: theme.text }]}>Partner moderation</Text>
                    <Text style={[styles.detailsHeading, { color: theme.text }]}>{selectedPartner.business_name}</Text>
                    <Text style={[styles.detailsSubheading, { color: theme.text3 }]}>
                      {selectedPartner.full_name} | {selectedPartner.category} | {selectedPartner.phone_number}
                    </Text>

                    <View style={styles.badgeRow}>
                      <StatusBadge label={prettifyStatus(selectedPartner.status)} theme={theme} tone={statusTone(selectedPartner.status)} />
                      <StatusBadge label={prettifyStatus(selectedPartner.kyc_status)} theme={theme} tone={statusTone(selectedPartner.kyc_status)} />
                      <StatusBadge label={prettifyStatus(selectedPartner.visibility_status)} theme={theme} tone={statusTone(selectedPartner.visibility_status)} />
                    </View>

                    <View style={[styles.notePanel, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
                      <Text style={[styles.noteTitle, { color: theme.text3 }]}>Current note</Text>
                      <Text style={[styles.noteText, { color: theme.text2 }]}>{selectedPartner.admin_note || selectedPartner.status_note || "No admin note yet."}</Text>
                    </View>

                    <View style={styles.actionRow}>
                      <ActionButton label="Approve KYC" onPress={() => updatePartner(selectedPartner.id, { admin_note: "KYC approved by admin.", kyc_status: "approved", status: "verification pending" })} theme={theme} tone="green" />
                      <ActionButton label="Request docs" onPress={() => updatePartner(selectedPartner.id, { admin_note: "Additional documents requested.", kyc_status: "needs docs", status: "pending" })} theme={theme} tone="purple" />
                      <ActionButton label="Reject profile" onPress={() => updatePartner(selectedPartner.id, { admin_note: "Profile rejected by admin.", kyc_status: "rejected", status: "rejected" })} theme={theme} tone="red" />
                      <ActionButton label="Publish profile" onPress={() => updatePartner(selectedPartner.id, { status: "approved", visibility_status: "live" })} theme={theme} tone="blue" />
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}

            {screen === "enquiries" ? (
              <View style={[styles.twoCol, compact && styles.stack]}>
                <View style={styles.leftCol}>
                  {enquiries.length ? enquiries.map((enquiry) => (
                    <Pressable
                      key={enquiry.id}
                      onPress={() => setSelectedEnquiryId(enquiry.id)}
                      style={[styles.adminCard, { backgroundColor: theme.card, borderColor: theme.border }, selectedEnquiryId === enquiry.id && { borderColor: theme.gold, borderWidth: 1.5 }]}
                    >
                      <Text style={[styles.vendorName, { color: theme.text }]}>{enquiry.experience_title || prettifyStatus(enquiry.enquiry_type)}</Text>
                      <Text style={[styles.vendorMeta, { color: theme.text3 }]}>
                        {enquiry.phone_number || "No phone"} | {formatShortDate(enquiry.created_at)}
                      </Text>
                      <View style={styles.badgeRow}>
                        <StatusBadge label={prettifyStatus(enquiry.status)} theme={theme} tone={statusTone(enquiry.status)} />
                        <StatusBadge label={prettifyStatus(enquiry.priority)} theme={theme} tone={statusTone(enquiry.priority)} />
                      </View>
                    </Pressable>
                  )) : (
                    <View style={[styles.adminCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <Text style={[styles.vendorName, { color: theme.text }]}>No enquiries yet</Text>
                      <Text style={[styles.vendorMeta, { color: theme.text3 }]}>Customer requests will appear here after they tap Request Availability.</Text>
                    </View>
                  )}
                </View>

                {selectedEnquiry ? (
                  <View style={[styles.detailsPanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.panelTitle, { color: theme.text }]}>Customer enquiry</Text>
                    <Text style={[styles.detailsHeading, { color: theme.text }]}>{selectedEnquiry.experience_title || prettifyStatus(selectedEnquiry.enquiry_type)}</Text>
                    <Text style={[styles.detailsSubheading, { color: theme.text3 }]}>
                      {selectedEnquiry.venue || "Venue not selected"} | {selectedEnquiry.booking_date || "Date open"} | {selectedEnquiry.guests ? `${selectedEnquiry.guests} guests` : "Guest count open"}
                    </Text>
                    <View style={styles.badgeRow}>
                      <StatusBadge label={prettifyStatus(selectedEnquiry.status)} theme={theme} tone={statusTone(selectedEnquiry.status)} />
                      {selectedEnquiry.estimated_total ? <StatusBadge label={formatCurrency(selectedEnquiry.estimated_total)} theme={theme} tone="amber" /> : null}
                    </View>
                    <View style={[styles.notePanel, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
                      <Text style={[styles.noteTitle, { color: theme.text3 }]}>Customer note</Text>
                      <Text style={[styles.noteText, { color: theme.text2 }]}>{selectedEnquiry.notes || "No note added."}</Text>
                    </View>
                    <View style={styles.actionRow}>
                      <ActionButton label="Mark contacted" onPress={() => updateEnquiry(selectedEnquiry.id, "contacted", "Customer contacted by admin team.")} theme={theme} tone="blue" />
                      <ActionButton label="Mark quoted" onPress={() => updateEnquiry(selectedEnquiry.id, "quoted", "Quote shared with customer.")} theme={theme} tone="purple" />
                      <ActionButton label="Confirm" onPress={() => updateEnquiry(selectedEnquiry.id, "confirmed", "Enquiry confirmed by operations.")} theme={theme} tone="green" />
                      <ActionButton label="Cancel" onPress={() => updateEnquiry(selectedEnquiry.id, "cancelled", "Enquiry cancelled by operations.")} theme={theme} tone="red" />
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}

            {screen === "finance" ? (
              <View style={[styles.twoCol, compact && styles.stack]}>
                <View style={[styles.detailsPanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.panelTitle, { color: theme.text }]}>Payout control</Text>
                  {payouts.map((payout) => (
                    <View key={payout.id} style={[styles.summaryRow, { borderBottomColor: theme.border }]}>
                      <View>
                        <Text style={[styles.summaryTitle, { color: theme.text }]}>{formatCurrency(payout.amount)}</Text>
                        <Text style={[styles.summarySubtitle, { color: theme.text3 }]}>{payout.release_eta || "Release ETA not set"}</Text>
                      </View>
                      <StatusBadge label={prettifyStatus(payout.status)} theme={theme} tone={statusTone(payout.status)} />
                    </View>
                  ))}
                </View>

                <View style={[styles.detailsPanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.panelTitle, { color: theme.text }]}>Finance actions</Text>
                  <Text style={[styles.noteText, { color: theme.text2 }]}>These actions now update the real payout rows backing the partner dashboard.</Text>
                  <View style={styles.actionRow}>
                    <ActionButton label="Release selected partner payouts" onPress={() => updatePayouts("released", "Released by admin")} theme={theme} tone="green" />
                    <ActionButton label="Hold selected partner payouts" onPress={() => updatePayouts("held", "Held for finance review")} theme={theme} tone="red" />
                  </View>
                </View>
              </View>
            ) : null}

            {screen === "support" ? (
              <View style={[styles.twoCol, compact && styles.stack]}>
                <View style={styles.leftCol}>
                  {tickets.map((ticket) => (
                    <Pressable
                      key={ticket.id}
                      onPress={() => setSelectedTicketId(ticket.id)}
                      style={[styles.adminCard, { backgroundColor: theme.card, borderColor: theme.border }, selectedTicketId === ticket.id && { borderColor: theme.gold, borderWidth: 1.5 }]}
                    >
                      <Text style={[styles.vendorName, { color: theme.text }]}>{ticket.summary}</Text>
                      <Text style={[styles.vendorMeta, { color: theme.text3 }]}>{ticket.owner_name || "Support desk"} | {formatShortDate(ticket.created_at)}</Text>
                      <StatusBadge label={prettifyStatus(ticket.status)} theme={theme} tone={statusTone(ticket.status)} />
                    </Pressable>
                  ))}
                </View>

                {selectedTicket ? (
                  <View style={[styles.detailsPanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.panelTitle, { color: theme.text }]}>Support ticket</Text>
                    <Text style={[styles.detailsHeading, { color: theme.text }]}>{selectedTicket.summary}</Text>
                    <Text style={[styles.detailsSubheading, { color: theme.text3 }]}>
                      {selectedTicket.owner_name || "Support desk"} | {formatShortDate(selectedTicket.created_at)}
                    </Text>
                    <View style={styles.actionRow}>
                      <ActionButton label="Assign to admin" onPress={() => updateTicket(selectedTicket.id, { owner_name: adminProfile?.full_name || adminProfile?.email || "Admin team", status: "in progress" })} theme={theme} tone="blue" />
                      <ActionButton label="Close ticket" onPress={() => updateTicket(selectedTicket.id, { status: "closed" })} theme={theme} tone="green" />
                      <ActionButton label="Mark pending" onPress={() => updateTicket(selectedTicket.id, { status: "pending" })} theme={theme} tone="purple" />
                    </View>
                  </View>
                ) : null}
              </View>
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

function ActionButton({
  label,
  onPress,
  theme,
  tone,
}: {
  label: string;
  onPress: () => void;
  theme: typeof DARK | typeof LIGHT;
  tone: "blue" | "green" | "purple" | "red";
}) {
  const background =
    tone === "green" ? theme.greenBg : tone === "blue" ? theme.blueBg : tone === "purple" ? theme.purpleBg : theme.redBg;
  const color = tone === "green" ? theme.green : tone === "blue" ? theme.blue : tone === "purple" ? theme.purple : theme.red;

  return (
    <Pressable onPress={onPress} style={[styles.actionButton, { backgroundColor: background, borderColor: theme.borderStrong }]}>
      <Text style={[styles.actionButtonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function screenTitle(screen: AdminScreen) {
  if (screen === "enquiries") return "Enquiries";
  if (screen === "finance") return "Finance Control";
  if (screen === "support") return "Support Desk";
  return "Operations Overview";
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
  footerName: { color: "rgba(242,232,217,0.7)", fontSize: 12, fontWeight: "600", marginBottom: 2 },
  footerVendor: { color: "rgba(201,151,90,0.5)", fontSize: 10, marginBottom: 8 },
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
  statValue: { fontFamily: "serif", fontSize: 26, lineHeight: 30 },
  twoCol: { flexDirection: "row", gap: 16 },
  leftCol: { flex: 1, gap: 12 },
  adminCard: { borderRadius: 14, borderWidth: 1, marginBottom: 12, padding: 16 },
  detailsPanel: { borderRadius: 14, borderWidth: 1, flex: 1.05, padding: 16 },
  panelTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  detailsHeading: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  detailsSubheading: { fontSize: 12, marginBottom: 12 },
  vendorName: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  vendorMeta: { fontSize: 12, marginBottom: 8 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  badge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10.5, fontWeight: "600" },
  notePanel: { borderRadius: 10, borderWidth: 1, marginBottom: 12, padding: 12 },
  noteTitle: { fontSize: 10, fontWeight: "600", letterSpacing: 1.5, marginBottom: 8, textTransform: "uppercase" },
  noteText: { fontSize: 12, lineHeight: 18 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 4 },
  actionButton: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  actionButtonText: { fontSize: 12, fontWeight: "600" },
  summaryRow: { alignItems: "center", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  summaryTitle: { fontSize: 13, fontWeight: "700" },
  summarySubtitle: { fontSize: 12, marginTop: 2 },
  summaryValue: { fontSize: 13, fontWeight: "700" },
  loadingText: { fontSize: 13, marginBottom: 12 },
  errorText: { fontSize: 12, fontWeight: "700", lineHeight: 18, marginBottom: 12 },
});
