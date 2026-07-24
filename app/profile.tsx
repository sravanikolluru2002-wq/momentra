import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { LuxuryBottomNav } from "@/components/luxury-bottom-nav";
import { useMomentraTheme } from "@/contexts/momentra-theme";
import { firebaseAuth } from "@/firebase/config";
import { resetRecaptchaVerifier } from "@/lib/firebase/recaptcha";
import {
  CustomerProfileRow,
  ensureCustomerProfile,
  getCustomerProfile,
  logSupabaseProfileError,
  updateCustomerProfileAvatar,
} from "@/lib/supabase/customer-profile";
import { supabase } from "@/lib/supabase";
import {
  CircleMember,
  CircleRequest,
  PublicCircleProfile,
  SharedPaymentPlan,
  createSharedPaymentPlan,
  listCircleMembers,
  listCircleRequests,
  listSharedPaymentPlans,
  normalizeMomentraId,
  respondToCircleRequest,
  searchProfileByMomentraId,
  sendCircleRequest,
} from "@/lib/supabase/circle";

type ScreenId =
  | "main"
  | "edit"
  | "addresses"
  | "payments"
  | "credits"
  | "groups"
  | "createPlan"
  | "notifications"
  | "city"
  | "bookings"
  | "saved"
  | "support"
  | "contact"
  | "faq"
  | "privacy"
  | "terms";

type Palette = typeof DARK;

type CustomerProfile = CustomerProfileRow;

type WalletTransactionType = "referral" | "refund" | "promo" | "redemption" | "manual_credit";
type WalletTransaction = {
  amount: number;
  date: string;
  id: string;
  note: string;
  type: WalletTransactionType;
};
type MockWallet = {
  available: number;
  earned: number;
  expiring: number;
  expiringOn: string;
  transactions: WalletTransaction[];
  used: number;
};
const DARK = {
  bg: "#0d0905",
  bg2: "#1a0e08",
  bg3: "#231508",
  bg4: "#2e1e0a",
  text: "#F2E8D9",
  text2: "rgba(242,232,217,0.62)",
  text3: "rgba(242,232,217,0.32)",
  border: "rgba(201,151,90,0.12)",
  border2: "rgba(201,151,90,0.26)",
  gold: "#C9975A",
  gold2: "#E4B97A",
  red: "#C0392B",
  red2: "#8B1A10",
  green: "#27ae60",
  greenBg: "rgba(39,174,96,0.14)",
  amber: "#d4820a",
  amberBg: "rgba(212,130,10,0.14)",
  blue: "#4BAFD6",
  blueBg: "rgba(75,175,214,0.14)",
  card: "#191008",
  card2: "#201309",
};

const LIGHT = {
  bg: "#f5f0e8",
  bg2: "#ffffff",
  bg3: "#ede7da",
  bg4: "#e2d9c8",
  text: "#1a1208",
  text2: "#6b5a42",
  text3: "#9c8a6e",
  border: "rgba(170,130,70,0.15)",
  border2: "rgba(170,130,70,0.32)",
  gold: "#b8892a",
  gold2: "#d4a84a",
  red: "#b83225",
  red2: "#8B1A10",
  green: "#2a7a4a",
  greenBg: "rgba(42,122,74,0.10)",
  amber: "#9a6010",
  amberBg: "rgba(154,96,16,0.10)",
  blue: "#1e5fa8",
  blueBg: "rgba(30,95,168,0.10)",
  card: "#ffffff",
  card2: "#f9f5ef",
};

const iconGradients = {
  purple: ["#5a3dc4", "#3a2a90"],
  blue: ["#1e5fa8", "#0d3870"],
  green: ["#1a7040", "#0f4828"],
  red: ["#b83225", "#7a1a10"],
  amber: ["#9a6010", "#6a3e08"],
  night: ["#2a2a4a", "#1a1a36"],
  gold: ["#6a3e08", "#4a2a04"],
} as const;

const savedVenues = [
  {
    id: "beachfront",
    emoji: "🌊",
    name: "Beachfront Sunset Terrace",
    meta: "Beach Road, Vizag · Rooftop venue",
    price: "Starting ₹3,800",
    tags: ["Up to 40 guests", "Rooftop · Sea view", "4.9"],
    colors: ["rgba(30,95,168,0.30)", "rgba(10,4,2,0.95)"],
  },
  {
    id: "kapoor",
    emoji: "🌿",
    name: "Kapoor Garden & Banquet",
    meta: "MVP Colony, Vizag · Banquet hall",
    price: "Starting ₹6,200",
    tags: ["Up to 150 guests", "Banquet · AC", "4.8"],
    colors: ["rgba(39,174,96,0.25)", "rgba(10,4,2,0.95)"],
  },
  {
    id: "candlelight",
    emoji: "🌹",
    name: "The Candlelight Terrace",
    meta: "Rushikonda, Vizag · Terrace venue",
    price: "Starting ₹4,500",
    tags: ["Up to 30 guests", "Terrace · Decor incl.", "4.8"],
    colors: ["rgba(184,50,37,0.30)", "rgba(10,4,2,0.95)"],
  },
  {
    id: "ballroom",
    emoji: "🏛️",
    name: "Grand Vizag Ballroom",
    meta: "Dwaraka Nagar · Hotel banquet",
    price: "Starting ₹18,000",
    tags: ["Up to 300 guests", "5-star · Valet", "4.9"],
    colors: ["rgba(201,151,90,0.25)", "rgba(10,4,2,0.95)"],
  },
  {
    id: "palm",
    emoji: "🌴",
    name: "Palm Court Resort Lawn",
    meta: "Bheemunipatnam · Resort lawn",
    price: "Starting ₹11,000",
    tags: ["Up to 200 guests", "Lawn · Pool view", "4.7"],
    colors: ["rgba(212,130,10,0.25)", "rgba(10,4,2,0.95)"],
  },
];

const bookings = [
  {
    id: "birthday",
    emoji: "🎂",
    title: "Birthday Setup — Kapoor Garden",
    date: "Sat, 24 May 2026",
    time: "7:00 PM",
    guests: "14 guests",
    venue: "Terrace Garden Suite, MVP Colony, Vizag",
    price: "₹8,400",
    colors: ["rgba(184,50,37,0.35)", "rgba(20,6,2,0.90)"],
  },
  {
    id: "datenight",
    emoji: "💑",
    title: "Date Night — Beachside Table",
    date: "Sun, 25 May 2026",
    time: "8:00 PM",
    guests: "2 guests",
    venue: "SeaView Terrace, Beach Road, Vizag",
    price: "₹4,500",
    colors: ["rgba(90,61,196,0.30)", "rgba(20,6,2,0.90)"],
  },
  {
    id: "kitty",
    emoji: "👠",
    title: "Kitty Party — Sunday Brunch",
    date: "Sat, 31 May 2026",
    time: "12:00 PM",
    guests: "18 guests",
    venue: "Rooftop Lounge, MVP Colony, Vizag",
    price: "₹12,800",
    colors: ["rgba(30,95,168,0.30)", "rgba(20,6,2,0.90)"],
  },
];

const cities = [
  { id: "vizag", emoji: "🌊", label: "Vizag", name: "Visakhapatnam (Vizag)", state: "Andhra Pradesh" },
  { id: "vijayawada", emoji: "🏙️", label: "Vijayawada", name: "Vijayawada", state: "Andhra Pradesh" },
  { id: "hyderabad", emoji: "🕌", label: "Hyderabad", name: "Hyderabad", state: "Telangana" },
  { id: "chennai", emoji: "🌆", label: "Chennai", name: "Chennai", state: "Tamil Nadu" },
  { id: "bengaluru", emoji: "🌿", label: "Bengaluru", name: "Bengaluru", state: "Karnataka" },
  { id: "mumbai", emoji: "🌃", label: "Mumbai", name: "Mumbai", state: "Maharashtra" },
];

const faqs = [
  ["How do I book an experience?", "Browse venues on Explore, choose your date and guest count, then complete payment. Momentra sends confirmation immediately."],
  ["Can I cancel or reschedule?", "Yes. Open My Bookings, select the booking, and request a cancellation or reschedule. Refunds depend on the venue policy."],
  ["What is Kitty Pay?", "Kitty Pay lets your group split a bill individually through one shared payment link."],
  ["How do Momentra Credits work?", "Credits can be earned through referrals, offers, and refunds. One credit equals ₹1 at checkout."],
  ["Is my payment safe?", "Payments are processed by Razorpay with PCI-DSS compliant payment infrastructure."],
  ["Can I bring my own decorator?", "Each venue listing shows whether external decoration is allowed under Amenities & Permissions."],
];

const mockWallet: MockWallet = {
  available: 1250,
  earned: 3000,
  expiring: 350,
  expiringOn: "31 Dec 2026",
  used: 1750,
  transactions: [
    { id: "txn-referral", amount: 500, date: "18 Jul 2026", note: "Referral reward for inviting Ananya", type: "referral" },
    { id: "txn-refund", amount: 750, date: "12 Jul 2026", note: "Refund credit from rescheduled kitty brunch", type: "refund" },
    { id: "txn-promo", amount: 250, date: "01 Jul 2026", note: "Founding Moment promo credit", type: "promo" },
    { id: "txn-redeem", amount: -800, date: "24 Jun 2026", note: "Used at checkout for birthday setup", type: "redemption" },
    { id: "txn-manual", amount: 550, date: "16 Jun 2026", note: "Manual service recovery credit", type: "manual_credit" },
  ],
};

const emptyMockWallet: MockWallet = {
  available: 0,
  earned: 0,
  expiring: 0,
  expiringOn: "No expiry",
  used: 0,
  transactions: [],
};

function formatMemberSince(createdAt?: string | null) {
  if (!createdAt) return "2026";

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) return "2026";

  return date.getFullYear().toString();
}

export default function ProfileScreen() {
  const router = useRouter();
  const { isDark, setIsDark } = useMomentraTheme();
  const T = isDark ? DARK : LIGHT;
  const styles = useMemo(() => createStyles(T), [T]);

  const [user, setUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeScreen, setActiveScreen] = useState<ScreenId>("main");
  const [city, setCity] = useState("Vizag");
  const [cityQuery, setCityQuery] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [bookingTab, setBookingTab] = useState("Upcoming");
  const [walletPreviewState, setWalletPreviewState] = useState<"active" | "empty">("active");
  const [circleMembers, setCircleMembers] = useState<CircleMember[]>([]);
  const [circleRequests, setCircleRequests] = useState<CircleRequest[]>([]);
  const [sharedPaymentPlans, setSharedPaymentPlans] = useState<SharedPaymentPlan[]>([]);
  const [circleLoading, setCircleLoading] = useState(false);
  const [circleSearchId, setCircleSearchId] = useState("");
  const [circleSearchResult, setCircleSearchResult] = useState<PublicCircleProfile | null>(null);
  const [circleSearchState, setCircleSearchState] = useState<"idle" | "loading" | "found" | "empty">("idle");
  const [circleActionBusy, setCircleActionBusy] = useState<string | null>(null);
  const [planName, setPlanName] = useState("House Party Split");
  const [planAmount, setPlanAmount] = useState("12000");
  const [planSplitType, setPlanSplitType] = useState<"equal" | "custom">("equal");
  const [planThreshold, setPlanThreshold] = useState(3);
  const [selectedPlanMembers, setSelectedPlanMembers] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState("");
  const [logoutSheetOpen, setLogoutSheetOpen] = useState(false);
  const [addPaySheetOpen, setAddPaySheetOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    confirmations: true,
    reminders: true,
    flash: true,
    saved: false,
    experiences: false,
    whatsapp: true,
    receipts: true,
    promotions: false,
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userPhone = user?.phoneNumber ?? user?.phone ?? "";
  const savedProfileName = profile?.full_name?.trim() || user?.displayName?.trim() || "";
  const displayName = savedProfileName || (userPhone ? formatProfilePhone(userPhone) : "Your Profile");
  const avatarUrl = profile?.avatar_url?.trim() || "";
  const profileCity = profile?.city?.trim() || city;
  const memberSince = formatMemberSince(profile?.created_at);
  const wallet = walletPreviewState === "active" ? mockWallet : emptyMockWallet;
  const momentraId = profile?.momentra_id || (profile?.id ? makeFallbackMomentraId(profile.id) : "MOM-LOADING");
  const incomingRequests = circleRequests.filter((request) => request.receiver_profile_id === profile?.id && request.status === "pending");
  const sentRequests = circleRequests.filter((request) => request.requester_profile_id === profile?.id);
  const activeSharedPlan = sharedPaymentPlans.find((plan) => plan.status === "collecting" || plan.status === "threshold_pending");
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 1)
    .toUpperCase() || "M";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      console.log("[Momentra auth] Profile auth state", {
        hasUser: Boolean(firebaseUser),
        phone: firebaseUser?.phoneNumber ?? null,
        uid: firebaseUser?.uid ?? null,
      });

      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoadingSession(false);
        router.replace("/login" as never);
        return;
      }

      setUser(firebaseUser);
      setLoadingSession(false);
      void loadCustomerProfile(firebaseUser);
    });

    return () => {
      unsubscribe();
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
    // loadCustomerProfile reads the latest profile state setters and is only invoked from auth state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (!profile?.id) return;

    void refreshCircleData(profile.id);

    const channelId = `momentra-circle-${profile.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelId)
      .on("postgres_changes", { event: "*", schema: "public", table: "profile_circle_requests" }, () => {
        void refreshCircleData(profile.id);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profile_circle_members" }, () => {
        void refreshCircleData(profile.id);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "shared_payment_plans" }, () => {
        void refreshCircleData(profile.id);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "shared_payment_members" }, () => {
        void refreshCircleData(profile.id);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // refreshCircleData intentionally reads current setters and toast helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  function showToast(message: string) {
    setToastMessage(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(""), 2400);
  }

  function openScreen(screen: ScreenId) {
    if (screen === "edit") {
      setEditFullName(savedProfileName);
      setEditCity(profileCity);
      setEditPhone(profile?.phone_number || userPhone);
    }
    setActiveScreen(screen);
  }

  function closeScreen() {
    setActiveScreen("main");
  }

  function toggleNotification(key: string) {
    setNotifications((current) => {
      const next = !current[key];
      showToast(next ? "Turned on" : "Turned off");
      return { ...current, [key]: next };
    });
  }

  function togglePlanMember(memberId: string) {
    setSelectedPlanMembers((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId]
    );
  }

  async function refreshCircleData(profileId = profile?.id) {
    if (!profileId) return;

    setCircleLoading(true);
    try {
      const [requests, membersList, plans] = await Promise.all([
        listCircleRequests(profileId),
        listCircleMembers(profileId),
        listSharedPaymentPlans(profileId),
      ]);

      setCircleRequests(requests);
      setCircleMembers(membersList);
      setSharedPaymentPlans(plans);
    } catch (error) {
      console.error("[Momentra circle] refresh failed", error);
      showToast("We could not refresh your Circle.");
    } finally {
      setCircleLoading(false);
    }
  }

  async function copyMomentraId() {
    await Clipboard.setStringAsync(momentraId);
    showToast("Momentra ID copied");
  }

  async function searchCircleProfile() {
    const normalized = normalizeMomentraId(circleSearchId);
    if (!normalized) {
      showToast("Enter a Momentra ID first.");
      return;
    }

    setCircleSearchState("loading");
    setCircleSearchResult(null);

    try {
      const result = await searchProfileByMomentraId(normalized);
      setCircleSearchResult(result);
      setCircleSearchState(result ? "found" : "empty");
    } catch (error) {
      console.error("[Momentra circle] search failed", error);
      setCircleSearchState("empty");
      showToast("Search failed. Please try again.");
    }
  }

  async function sendCircleInvite() {
    if (!profile?.id || !circleSearchResult?.momentra_id) return;

    setCircleActionBusy("send");
    try {
      await sendCircleRequest(profile.id, circleSearchResult.momentra_id);
      setCircleSearchResult(null);
      setCircleSearchId("");
      setCircleSearchState("idle");
      await refreshCircleData(profile.id);
      showToast("Circle request sent");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not send request.");
    } finally {
      setCircleActionBusy(null);
    }
  }

  async function respondToRequest(requestId: string, action: "accept" | "decline") {
    if (!profile?.id) return;

    setCircleActionBusy(requestId);
    try {
      await respondToCircleRequest(requestId, profile.id, action);
      await refreshCircleData(profile.id);
      showToast(action === "accept" ? "Added to your Circle" : "Request declined");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not update request.");
    } finally {
      setCircleActionBusy(null);
    }
  }

  function createSharedPlan() {
    const amount = Number.parseInt(planAmount.replace(/[^\d]/g, ""), 10) || 0;
    if (!profile?.id) {
      showToast("Profile is still loading.");
      return;
    }
    if (!planName.trim()) {
      showToast("Add an event name first.");
      return;
    }
    if (!amount) {
      showToast("Add a valid total amount.");
      return;
    }
    if (!selectedPlanMembers.length) {
      showToast("Select at least one member.");
      return;
    }

    setCircleActionBusy("create-plan");
    createSharedPaymentPlan(profile.id, selectedPlanMembers, {
      splitType: planSplitType,
      threshold: planThreshold,
      title: planName.trim(),
      totalAmount: amount,
    })
      .then(async () => {
        setSelectedPlanMembers([]);
        setActiveScreen("groups");
        await refreshCircleData(profile.id);
        showToast("Shared plan created");
      })
      .catch((error) => {
        showToast(error instanceof Error ? error.message : "Could not create shared plan.");
      })
      .finally(() => setCircleActionBusy(null));
  }

  async function loadCustomerProfile(firebaseUser: User) {
    setProfileLoading(true);

    try {
      const phone = firebaseUser.phoneNumber ?? "";
      const row = await ensureCustomerProfile(firebaseUser, {}, phone);
      const completeProfile = await getCustomerProfile(row.id).catch(() => row);

      setProfile(completeProfile);
      setCity(completeProfile?.city?.trim() || "Vizag");
      setEditFullName(completeProfile?.full_name?.trim() || firebaseUser.displayName || "");
      setEditCity(completeProfile?.city?.trim() || "Vizag");
      setEditPhone(completeProfile?.phone_number || phone);
    } catch (error) {
      logSupabaseProfileError("profile load/ensure failed", error);
      showToast("We could not load your profile details.");
      setEditFullName(firebaseUser.displayName || "");
      setEditCity("Vizag");
      setEditPhone(firebaseUser.phoneNumber ?? "");
    } finally {
      setProfileLoading(false);
    }
  }

  async function saveProfileChanges() {
    if (!user) return;

    const cleanName = editFullName.trim();
    const cleanCity = editCity.trim();
    const cleanPhone = userPhone || editPhone.trim();

    if (!cleanName) {
      showToast("Please enter your full name.");
      return;
    }

    setSavingProfile(true);

    try {
      const nextProfile = await ensureCustomerProfile(user, {
        city: cleanCity || null,
        full_name: cleanName,
      }, cleanPhone);
      const mergedProfile = {
        ...nextProfile,
        avatar_url: profile?.avatar_url ?? null,
      };

      setProfile(mergedProfile);
      setCity(mergedProfile.city?.trim() || "Vizag");
      setEditFullName(mergedProfile.full_name?.trim() || cleanName);
      setEditCity(mergedProfile.city?.trim() || cleanCity);
      setEditPhone(mergedProfile.phone_number || cleanPhone);
      closeScreen();
      showToast("Profile saved successfully");
    } catch (error) {
      logSupabaseProfileError("profile save failed", error);
      showToast("We could not save your profile right now.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function chooseProfilePhoto() {
    if (!profile?.id) {
      showToast("Profile is still loading.");
      return;
    }

    if (Platform.OS !== "web" || typeof document === "undefined") {
      showToast("Photo upload is available on web for now.");
      return;
    }

    try {
      const file = await pickImageFileFromBrowser();
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showToast("Please choose an image file.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast("Please choose an image under 5 MB.");
        return;
      }

      setUploadingAvatar(true);
      const publicUrl = await uploadProfilePhoto(profile.id, file);
      const nextProfile = await updateCustomerProfileAvatar(profile.id, publicUrl);

      setProfile(nextProfile);
      showToast("Profile photo saved");
    } catch (error) {
      console.error("[Momentra profile] avatar upload failed", error);
      showToast("We could not save your photo. Check Supabase storage setup.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function removeProfilePhoto() {
    if (!profile?.id || uploadingAvatar) return;

    setUploadingAvatar(true);
    try {
      const nextProfile = await updateCustomerProfileAvatar(profile.id, null);
      setProfile(nextProfile);
      showToast("Profile photo removed");
    } catch (error) {
      console.error("[Momentra profile] avatar remove failed", error);
      showToast("We could not remove your photo.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function performLogout() {
    try {
      await signOut(firebaseAuth);
      resetRecaptchaVerifier();
      setLogoutSheetOpen(false);
      router.replace("/login" as never);
    } catch (error) {
      console.error("[Momentra auth] Logout failed", error);
      showToast("We could not log you out. Please try again.");
    }
  }

  if (loadingSession) {
    return (
      <View style={[styles.page, styles.center]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <Text style={styles.loadingTitle}>Momentra</Text>
        <Text style={styles.muted}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.shell}>
        {activeScreen === "main" ? renderMainScreen() : renderSubScreen(activeScreen)}
        <Toast message={toastMessage} styles={styles} />
        <LogoutSheet
          onCancel={() => setLogoutSheetOpen(false)}
          onLogout={performLogout}
          open={logoutSheetOpen}
          styles={styles}
          T={T}
        />
        <AddPaymentSheet
          onClose={() => setAddPaySheetOpen(false)}
          onPick={(label) => {
            setAddPaySheetOpen(false);
            showToast(`${label} linking coming soon`);
          }}
          open={addPaySheetOpen}
          styles={styles}
          T={T}
        />
      </View>
    </View>
  );

  function renderMainScreen() {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.screenBody} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Pressable onPress={() => openScreen("edit")} style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
              <View style={styles.avatarEdit}>
                <Text style={styles.avatarEditText}>✎</Text>
              </View>
            </Pressable>
            <View style={styles.heroCopy}>
              <Text style={styles.heroName}>{displayName}</Text>
              <Text style={styles.heroCity}>{profileLoading ? "Loading profile..." : profileCity || "Location not set"}</Text>
              <View style={styles.heroTags}>
                <Pill label="Phone Verified" tone="green" T={T} styles={styles} />
                <Pill label={`Member since ${memberSince}`} tone="gold" T={T} styles={styles} />
              </View>
              <Text style={styles.heroPhone}>{profile?.phone_number || userPhone || "Phone not available"}</Text>
            </View>
          </View>

          <Pressable onPress={() => openScreen("edit")} style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
            <Text style={styles.editButtonText}>✎  Edit Profile</Text>
          </Pressable>

          <View style={styles.stats}>
            <Stat label="Bookings" value="3" onPress={() => openScreen("bookings")} styles={styles} />
            <Stat label="Saved" value="5" onPress={() => openScreen("saved")} styles={styles} />
            <Stat label="Circle" value={String(circleMembers.length)} onPress={() => openScreen("groups")} styles={styles} />
            <Stat label="Requests" value={String(incomingRequests.length)} small green={incomingRequests.length > 0} onPress={() => openScreen("groups")} styles={styles} />
            <Stat label="Session" value="● Live" small green onPress={() => showToast("You are signed in")} styles={styles} />
          </View>

          <View style={styles.momentraIdCard}>
            <View style={styles.rowBody}>
              <Text style={styles.inlineEyebrow}>My Momentra ID</Text>
              <Text style={styles.momentraIdText}>{momentraId}</Text>
              <Text style={styles.rowSubtitle}>Share this ID with friends so they can send a Circle request.</Text>
            </View>
            <Pressable onPress={copyMomentraId} style={styles.copyIdButton}>
              <Text style={styles.copyIdText}>Copy</Text>
            </Pressable>
          </View>

          <Section title="Momentra Credits" styles={styles}>
            <WalletSummaryCard
              onHistory={() => openScreen("credits")}
              onUse={() => showToast(wallet.available ? "Credits can reduce your next booking or add-on bill." : "No credits available yet.")}
              styles={styles}
              T={T}
              wallet={wallet}
            />
          </Section>

          <Section title="My Circle" styles={styles}>
            <SharedPlanPreview
              incomingCount={incomingRequests.length}
              members={circleMembers}
              onCreate={() => openScreen("createPlan")}
              onOpen={() => openScreen("groups")}
              plan={activeSharedPlan}
              plansCount={sharedPaymentPlans.length}
              styles={styles}
              T={T}
            />
          </Section>

          <Section title="Account" styles={styles}>
            <MenuRow icon="ID" title="Edit Profile" subtitle="Name, location, phone" gradient="purple" onPress={() => openScreen("edit")} styles={styles} T={T} />
            <MenuRow icon="AD" title="Saved Addresses" subtitle="Home, Work, Other" gradient="blue" right={<Pill label="2 saved" tone="gold" T={T} styles={styles} />} onPress={() => openScreen("addresses")} styles={styles} T={T} />
            <MenuRow icon="₹" title="Payment Methods" subtitle="UPI, cards, wallet" gradient="green" right={<Pill label="₹1,250 credits" tone="green" T={T} styles={styles} />} onPress={() => openScreen("payments")} styles={styles} T={T} />
            <MenuRow icon="NO" title="Notifications" subtitle="Bookings, offers, alerts" gradient="red" right={<Pill label="On" tone="green" T={T} styles={styles} />} onPress={() => openScreen("notifications")} styles={styles} T={T} />
          </Section>

          <Section title="Preferences" styles={styles}>
            <MenuRow icon="CT" title="City" subtitle="Shows experiences near you" gradient="amber" right={<Text style={styles.rowValue}>{profileCity}</Text>} onPress={() => openScreen("city")} styles={styles} T={T} />
            <View style={styles.row}>
              <IconTile icon="TH" gradient="night" styles={styles} />
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>Theme</Text>
                <Text style={styles.rowSubtitle}>{isDark ? "Dark mode" : "Light mode"}</Text>
              </View>
              <Switch
                ios_backgroundColor="rgba(201,151,90,0.22)"
                onValueChange={() => {
                  setIsDark((value) => !value);
                  showToast(isDark ? "Light mode on" : "Dark mode on");
                }}
                thumbColor="#fff"
                trackColor={{ false: T.border2, true: T.green }}
                value={isDark}
              />
            </View>
          </Section>

          <Section title="Activity" styles={styles}>
            <MenuRow icon="BK" title="My Bookings" subtitle="Upcoming, past, cancelled" gradient="green" right={<Pill label="3 upcoming" tone="green" T={T} styles={styles} />} onPress={() => openScreen("bookings")} styles={styles} T={T} />
            <MenuRow icon="SV" title="Saved Venues" subtitle="Your wishlist" gradient="red" right={<Text style={styles.rowValue}>5 saved</Text>} onPress={() => openScreen("saved")} styles={styles} T={T} />
          </Section>

          <Section title="Support" styles={styles}>
            <MenuRow icon="HP" title="Help & Support" subtitle="Chat, call, ticket" gradient="blue" onPress={() => openScreen("support")} styles={styles} T={T} />
            <MenuRow icon="✉" title="Contact Us" subtitle="Email, WhatsApp" gradient="green" onPress={() => openScreen("contact")} styles={styles} T={T} />
            <MenuRow icon="?" title="FAQs" subtitle="Quick answers" gradient="gold" onPress={() => openScreen("faq")} styles={styles} T={T} />
          </Section>

          <Section title="Legal" styles={styles}>
            <MenuRow icon="▱" title="Privacy Policy" gradient="purple" onPress={() => openScreen("privacy")} styles={styles} T={T} />
            <MenuRow icon="☰" title="Terms & Conditions" gradient="gold" onPress={() => openScreen("terms")} styles={styles} T={T} />
          </Section>

          <Pressable onPress={() => setLogoutSheetOpen(true)} style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}>
            <Text style={styles.logoutText}>↗  Log Out</Text>
          </Pressable>
          <Text style={styles.version}>Momentra v2.4.1 · Build 240520</Text>
        </ScrollView>
        <LuxuryBottomNav active="Profile" />
      </View>
    );
  }

  function renderSubScreen(screen: ScreenId) {
    const titles: Record<ScreenId, string> = {
      main: "Profile",
      edit: "Edit Profile",
      addresses: "Saved Addresses",
      payments: "Payment Methods",
      credits: "Event Credits",
      groups: "My Circle",
      createPlan: "Create Shared Plan",
      notifications: "Notifications",
      city: "Select City",
      bookings: "My Bookings",
      saved: "Saved Venues",
      support: "Help & Support",
      contact: "Contact Us",
      faq: "FAQs",
      privacy: "Privacy Policy",
      terms: "Terms & Conditions",
    };

    const action =
      screen === "edit"
        ? { label: savingProfile ? "Saving..." : "Save", onPress: saveProfileChanges }
        : screen === "createPlan"
          ? { label: "Create", onPress: createSharedPlan }
          : screen === "groups"
            ? { label: "+ Plan", onPress: () => openScreen("createPlan") }
        : screen === "payments"
          ? { label: "+ Add", onPress: () => setAddPaySheetOpen(true) }
          : screen === "addresses"
            ? { label: "+ Add", onPress: () => showToast("Add address") }
            : undefined;

    return (
      <View style={styles.screen}>
        <TopBar title={titles[screen]} onBack={closeScreen} action={action} styles={styles} />
        <ScrollView contentContainerStyle={styles.subBody} showsVerticalScrollIndicator={false}>
          {screen === "edit" && renderEdit()}
          {screen === "addresses" && renderAddresses()}
          {screen === "payments" && renderPayments()}
          {screen === "credits" && renderCredits()}
          {screen === "groups" && renderGroups()}
          {screen === "createPlan" && renderCreateSharedPlan()}
          {screen === "notifications" && renderNotifications()}
          {screen === "city" && renderCity()}
          {screen === "bookings" && renderBookings()}
          {screen === "saved" && renderSaved()}
          {screen === "support" && renderSupport()}
          {screen === "contact" && renderContact()}
          {screen === "faq" && renderFaq()}
          {screen === "privacy" && <LegalCopy type="privacy" styles={styles} />}
          {screen === "terms" && <LegalCopy type="terms" styles={styles} />}
        </ScrollView>
      </View>
    );
  }

  function renderEdit() {
    return (
      <View>
        <Pressable disabled={uploadingAvatar} onPress={chooseProfilePhoto} style={({ pressed }) => [styles.editAvatar, pressed && styles.pressed, uploadingAvatar && styles.disabled]}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.editAvatarImage} />
          ) : (
            <Text style={styles.editAvatarText}>{initials}</Text>
          )}
          <View style={styles.editCamera}>
            <Text style={styles.avatarEditText}>⌁</Text>
          </View>
        </Pressable>
        <Text style={styles.tapPhoto}>{uploadingAvatar ? "Saving photo..." : "Tap to change photo"}</Text>
        {avatarUrl ? (
          <Pressable disabled={uploadingAvatar} onPress={removeProfilePhoto} style={({ pressed }) => [styles.removePhotoButton, pressed && styles.pressed, uploadingAvatar && styles.disabled]}>
            <Text style={styles.removePhotoText}>Remove photo</Text>
          </Pressable>
        ) : null}
        <Field label="Full Name" onChangeText={setEditFullName} styles={styles} value={editFullName} />
        <Field label="City / Location" onChangeText={setEditCity} styles={styles} value={editCity} />
        <Field
          editable={false}
          keyboardType="phone-pad"
          label="Mobile Number"
          onChangeText={setEditPhone}
          styles={styles}
          value={editPhone || userPhone || "+91 98765 43210"}
        />
        <Text style={styles.editHint}>Your mobile number is managed by Firebase Phone Auth. Name and city are saved to your Momentra profile.</Text>
        <Pressable
          disabled={savingProfile}
          onPress={saveProfileChanges}
          style={({ pressed }) => [styles.saveButton, pressed && styles.pressed, savingProfile && styles.disabled]}
        >
          <Text style={styles.saveText}>{savingProfile ? "Saving..." : "Save Changes"}</Text>
        </Pressable>
      </View>
    );
  }

  function renderAddresses() {
    return (
      <View style={styles.group}>
        <AddressCard label="Home" icon="⌂" lines="12-3-456, Beach Road, MVP Colony, Visakhapatnam, AP — 530022" gradient="red" styles={styles} showToast={showToast} />
        <AddressCard label="Work" icon="▥" lines="TCS Campus, Madhurawada, Visakhapatnam, AP — 530048" gradient="blue" styles={styles} showToast={showToast} />
        <Pressable onPress={() => showToast("Add new address")} style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}>
          <View style={styles.addCircle}>
            <Text style={styles.addPlus}>+</Text>
          </View>
          <Text style={styles.addText}>Add new address</Text>
        </Pressable>
      </View>
    );
  }

  function renderPayments() {
    return (
      <View>
        <View style={styles.walletCard}>
          <View style={styles.walletTop}>
            <View>
              <Text style={styles.walletLabel}>Momentra Wallet</Text>
              <Text style={styles.walletAmount}>₹1,250</Text>
              <Text style={styles.walletSub}>Available credits · expires 31 Dec 2026</Text>
            </View>
            <View style={styles.walletIcon}>
              <Text style={styles.walletIconText}>▣</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <View style={styles.walletScale}>
            <Text style={styles.walletScaleText}>₹1,250 remaining</Text>
            <Text style={styles.walletScaleText}>of ₹3,000 issued</Text>
          </View>
          <Pressable onPress={() => showToast("Credits applied at checkout")} style={styles.walletButton}>
            <Text style={styles.walletButtonText}>Use at Checkout</Text>
          </Pressable>
        </View>

        <SectionLabel label="UPI" styles={styles} />
        <View style={styles.group}>
          <PaymentRow mark="GPay" title="Google Pay" subtitle="customer@okaxis" badge="Primary" styles={styles} showToast={showToast} />
          <PaymentRow mark="Pe" title="PhonePe" subtitle="customer@ybl" styles={styles} showToast={showToast} />
          <PaymentRow mark="Paytm" title="Paytm UPI" subtitle="customer@paytm" styles={styles} showToast={showToast} />
        </View>

        <SectionLabel label="Saved Cards" styles={styles} />
        <View style={styles.group}>
          <PaymentRow mark="VISA" title="HDFC Visa Debit" subtitle="•••• •••• •••• 4821 · Expires 06/27" styles={styles} showToast={showToast} />
          <PaymentRow mark="MC" title="ICICI Mastercard Credit" subtitle="•••• •••• •••• 7732 · Expires 12/28" styles={styles} showToast={showToast} />
        </View>

        <SectionLabel label="Net Banking" styles={styles} />
        <View style={styles.group}>
          <PaymentRow mark="HDFC" title="HDFC Bank" subtitle="Net banking · Saved" styles={styles} showToast={showToast} />
        </View>

        <Pressable onPress={() => setAddPaySheetOpen(true)} style={({ pressed }) => [styles.addPayment, pressed && styles.pressed]}>
          <View style={styles.payMark}>
            <Text style={styles.payMarkText}>+</Text>
          </View>
          <View>
            <Text style={styles.payTitle}>Add payment method</Text>
            <Text style={styles.paySub}>UPI, debit/credit card, net banking</Text>
          </View>
        </Pressable>

        <View style={styles.securityNote}>
          <Text style={styles.securityIcon}>◇</Text>
          <Text style={styles.securityText}>Secured by Razorpay · PCI-DSS Level 1 Certified · 256-bit SSL encryption. Momentra never stores your card or UPI credentials.</Text>
        </View>
      </View>
    );
  }

  function renderCredits() {
    const summary = [
      ["Earned", formatMockINR(wallet.earned), "green" as const],
      ["Used", formatMockINR(wallet.used), "red" as const],
      ["Expiring", formatMockINR(wallet.expiring), "gold" as const],
    ];

    return (
      <View>
        <View style={styles.previewSwitch}>
          {["active", "empty"].map((state) => (
            <Pressable
              key={state}
              onPress={() => setWalletPreviewState(state as "active" | "empty")}
              style={[styles.previewChip, walletPreviewState === state && styles.previewChipOn]}
            >
              <Text style={[styles.previewChipText, walletPreviewState === state && styles.previewChipTextOn]}>
                {state === "active" ? "Wallet with balance" : "Empty wallet"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.walletCard}>
          <View style={styles.walletTop}>
            <View>
              <Text style={styles.walletLabel}>Event credits</Text>
              <Text style={styles.walletAmount}>{formatMockINR(wallet.available)}</Text>
              <Text style={styles.walletSub}>
                Spend on venues, food, decor, music, add-ons, and planning upgrades.
              </Text>
            </View>
            <View style={styles.walletIcon}>
              <Text style={styles.walletIconText}>MC</Text>
            </View>
          </View>
          <View style={styles.creditUseGrid}>
            {["Venue booking", "Food menu", "Decor upgrade", "Refund credit"].map((item) => (
              <Text key={item} style={styles.creditUsePill}>{item}</Text>
            ))}
          </View>
          {wallet.expiring ? (
            <View style={styles.expiryBanner}>
              <Text style={styles.expiryBannerTitle}>{formatMockINR(wallet.expiring)} expiring soon</Text>
              <Text style={styles.expiryBannerText}>Use before {wallet.expiringOn} on your next Momentra plan.</Text>
            </View>
          ) : null}
          <View style={styles.walletStatGrid}>
            {summary.map(([label, value, tone]) => (
              <View key={label} style={styles.walletMiniStat}>
                <Text style={styles.walletMiniLabel}>{label}</Text>
                <Text style={[styles.walletMiniValue, tone === "green" && styles.greenText, tone === "red" && styles.redText]}>{value}</Text>
              </View>
            ))}
          </View>
          <View style={styles.walletActions}>
            <Pressable onPress={() => showToast("Credits will appear as a checkout option.")} style={styles.walletButton}>
              <Text style={styles.walletButtonText}>Use at Checkout</Text>
            </Pressable>
            <Pressable onPress={() => showToast("Showing mock transaction history")} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>View History</Text>
            </Pressable>
          </View>
        </View>

        <SectionLabel label="Credit Activity" styles={styles} />
        {wallet.transactions.length ? (
          <View style={styles.group}>
            {wallet.transactions.map((transaction) => (
              <WalletTransactionRow key={transaction.id} styles={styles} transaction={transaction} />
            ))}
          </View>
        ) : (
          <EmptyProfileState
            action="Explore offers"
            body="Credits from referrals, refunds, promos, and service adjustments will appear here."
            onPress={() => showToast("Offer discovery coming soon")}
            styles={styles}
            title="No credit activity yet"
          />
        )}

        <Text style={styles.backendNote}>Mock-only for local testing. Later this can connect to a credits ledger per profile.</Text>
      </View>
    );
  }

  function renderGroups() {
    return (
      <View>
        <View style={styles.momentraIdCard}>
          <View style={styles.rowBody}>
            <Text style={styles.inlineEyebrow}>My Momentra ID</Text>
            <Text style={styles.momentraIdText}>{momentraId}</Text>
            <Text style={styles.rowSubtitle}>Share this ID with friends so they can search and request to join your Circle.</Text>
          </View>
          <Pressable onPress={copyMomentraId} style={styles.copyIdButton}>
            <Text style={styles.copyIdText}>Copy</Text>
          </Pressable>
        </View>
        {circleLoading ? <Text style={styles.backendNote}>Refreshing your Circle...</Text> : null}

        <SectionLabel label="Find a Profile" styles={styles} />
        <View style={styles.circleSearchCard}>
          <TextInput
            autoCapitalize="characters"
            onChangeText={(value) => {
              setCircleSearchId(value);
              setCircleSearchState("idle");
              setCircleSearchResult(null);
            }}
            placeholder="Enter Momentra ID, for example MOM-1A2B3C4D"
            placeholderTextColor={T.text3}
            style={styles.searchInput}
            value={circleSearchId}
          />
          <Pressable onPress={searchCircleProfile} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
            <Text style={styles.saveText}>{circleSearchState === "loading" ? "Searching..." : "Search Profile"}</Text>
          </Pressable>
          {circleSearchState === "found" && circleSearchResult ? (
            <CircleProfileResult
              currentProfileId={profile?.id}
              onSend={sendCircleInvite}
              profile={circleSearchResult}
              sending={circleActionBusy === "send"}
              styles={styles}
            />
          ) : null}
          {circleSearchState === "empty" ? (
            <Text style={styles.backendNote}>No Momentra profile found with that ID.</Text>
          ) : null}
        </View>

        <SectionLabel label="Incoming Requests" styles={styles} />
        {incomingRequests.length ? (
          <View style={styles.group}>
            {incomingRequests.map((request) => (
              <CircleRequestRow
                busy={circleActionBusy === request.id}
                key={request.id}
                onAccept={() => respondToRequest(request.id, "accept")}
                onDecline={() => respondToRequest(request.id, "decline")}
                request={request}
                side="incoming"
                styles={styles}
              />
            ))}
          </View>
        ) : (
          <EmptyProfileState
            action="Refresh"
            body="Requests from friends who searched your Momentra ID will appear here."
            onPress={() => refreshCircleData()}
            styles={styles}
            title="No incoming requests"
          />
        )}

        <SectionLabel label="Sent Requests" styles={styles} />
        {sentRequests.length ? (
          <View style={styles.group}>
            {sentRequests.map((request) => (
              <CircleRequestRow
                busy={false}
                key={request.id}
                request={request}
                side="sent"
                styles={styles}
              />
            ))}
          </View>
        ) : (
          <EmptyProfileState
            action="Search profiles"
            body="Search a friend’s Momentra ID and send a request to start planning together."
            onPress={() => showToast("Enter a Momentra ID above.")}
            styles={styles}
            title="No sent requests"
          />
        )}

        <SectionLabel label="Circle Members" styles={styles} />
        {circleMembers.length ? (
          <View style={styles.circleHeroCard}>
            <View>
              <Text style={styles.circleHeroEyebrow}>Momentra circle</Text>
              <Text style={styles.circleHeroTitle}>My Circle</Text>
              <Text style={styles.circleHeroSub}>{circleMembers.length} trusted member{circleMembers.length === 1 ? "" : "s"} for shared plans and quick invites.</Text>
            </View>
            <View style={styles.circleHeroBadge}>
              <Text style={styles.circleHeroBadgeText}>{sharedPaymentPlans.length}</Text>
              <Text style={styles.circleHeroBadgeLabel}>plans</Text>
            </View>
          </View>
        ) : null}
        {circleMembers.length ? (
          <View style={styles.memberStrip}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {circleMembers.map((member) => (
                <MemberBubble key={member.id} member={member} styles={styles} />
              ))}
            </ScrollView>
          </View>
        ) : (
          <EmptyProfileState
            action="Add members later"
            body="Accepted Circle members will appear here after someone accepts your request or you accept theirs."
            onPress={() => showToast("Search a Momentra ID above.")}
            styles={styles}
            title="No saved members yet"
          />
        )}

        <SectionLabel label="Circle Plans" styles={styles} />
        {sharedPaymentPlans.length ? (
          sharedPaymentPlans.map((plan) => (
            <SharedPlanCard key={plan.id} plan={plan} styles={styles} T={T} showToast={showToast} />
          ))
        ) : (
          <EmptyProfileState
            action="Create shared plan"
            body="Create a plan with your Circle members, split style, and minimum payments needed to confirm."
            onPress={() => openScreen("createPlan")}
            styles={styles}
            title="No shared plans yet"
          />
        )}

        <Pressable onPress={() => openScreen("createPlan")} style={({ pressed }) => [styles.createPlanButton, pressed && styles.pressed]}>
          <Text style={styles.createPlanText}>Create Circle Plan</Text>
          <Text style={styles.createPlanSub}>Pick members, split the amount, and set how many payments confirm the celebration.</Text>
        </Pressable>
      </View>
    );
  }

  function renderCreateSharedPlan() {
    const amount = Number.parseInt(planAmount.replace(/[^\d]/g, ""), 10) || 0;
    const selectedMembers = circleMembers.filter((member) => selectedPlanMembers.includes(member.member_profile_id));
    const participantCount = selectedMembers.length + (profile?.id ? 1 : 0);
    const perHead = participantCount ? Math.ceil(amount / participantCount) : 0;

    return (
      <View>
        <Field label="Event / Plan Name" onChangeText={setPlanName} styles={styles} value={planName} />
        <Field keyboardType="phone-pad" label="Total Amount" onChangeText={setPlanAmount} styles={styles} value={planAmount} />

        <SectionLabel label="Members" styles={styles} />
        {circleMembers.length ? (
          <View style={styles.group}>
            {circleMembers.map((member) => {
            const selected = selectedPlanMembers.includes(member.member_profile_id);
            const memberProfile = member.member;
            return (
              <Pressable key={member.id} onPress={() => togglePlanMember(member.member_profile_id)} style={({ pressed }) => [styles.memberSelectRow, pressed && styles.pressed]}>
                <View style={[styles.memberAvatar, selected && styles.memberAvatarOn]}>
                  <Text style={styles.memberAvatarText}>{profileInitial(memberProfile)}</Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{profileDisplayName(memberProfile)}</Text>
                  <Text style={styles.rowSubtitle}>{memberProfile?.momentra_id || "Momentra member"}</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioOn]} />
              </Pressable>
            );
          })}
          </View>
        ) : (
          <EmptyProfileState
            action="Open My Circle"
            body="Add at least one Circle member before creating a shared plan."
            onPress={() => openScreen("groups")}
            styles={styles}
            title="No Circle members yet"
          />
        )}

        <SectionLabel label="Split Type" styles={styles} />
        <View style={styles.splitChoiceRow}>
          {["equal", "custom"].map((type) => (
            <Pressable key={type} onPress={() => setPlanSplitType(type as "equal" | "custom")} style={[styles.splitChoice, planSplitType === type && styles.splitChoiceOn]}>
              <Text style={[styles.splitChoiceText, planSplitType === type && styles.splitChoiceTextOn]}>{type === "equal" ? "Equal split" : "Custom split"}</Text>
              <Text style={styles.splitChoiceSub}>{type === "equal" ? `${formatMockINR(perHead)} each` : "Mock custom weights later"}</Text>
            </Pressable>
          ))}
        </View>

        <SectionLabel label="Minimum to Confirm" styles={styles} />
        <View style={styles.thresholdProfileCard}>
          <Text style={styles.thresholdProfileCopy}>
            Confirm when at least {Math.min(planThreshold, participantCount || 1)} of {participantCount || 1} participants pay. If threshold is not reached, the plan stays pending.
          </Text>
          <View style={styles.thresholdControls}>
            <Pressable onPress={() => setPlanThreshold((value) => Math.max(1, value - 1))} style={styles.thresholdButton}><Text style={styles.thresholdButtonText}>-</Text></Pressable>
            <Text style={styles.thresholdNumber}>{Math.min(planThreshold, participantCount || 1)}</Text>
            <Pressable onPress={() => setPlanThreshold((value) => Math.min(participantCount || 1, value + 1))} style={styles.thresholdButton}><Text style={styles.thresholdButtonText}>+</Text></Pressable>
          </View>
        </View>

        <SectionLabel label="Review" styles={styles} />
        <View style={styles.reviewPlanCard}>
          <ReviewLine label="Plan" value={planName || "Untitled plan"} styles={styles} />
          <ReviewLine label="Total" value={formatMockINR(amount)} styles={styles} />
          <ReviewLine label="Participants" value={`${participantCount} including you`} styles={styles} />
          <ReviewLine label="Split" value={planSplitType === "equal" ? `${formatMockINR(perHead)} each` : "Custom split mock"} styles={styles} />
          <ReviewLine label="Threshold" value={`${Math.min(planThreshold, participantCount || 1)} payments`} styles={styles} />
        </View>

        <Pressable onPress={createSharedPlan} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
          <Text style={styles.saveText}>{circleActionBusy === "create-plan" ? "Creating..." : "Create Shared Plan"}</Text>
        </Pressable>
      </View>
    );
  }

  function renderNotifications() {
    const items = [
      ["confirmations", "Booking confirmations", "Confirmed, cancelled, or updated bookings"],
      ["reminders", "Booking reminders", "24 hours and 2 hours before your event"],
      ["flash", "Flash deals near you", "Time-sensitive offers from nearby venues"],
      ["saved", "Saved venue updates", "Price drops on your wishlist venues"],
      ["experiences", "New experiences", "New venues and packages in your city"],
      ["whatsapp", "WhatsApp updates", "Booking receipts and confirmations on WhatsApp"],
      ["receipts", "Email receipts", "Booking confirmations and invoices by email"],
      ["promotions", "Promotions", "Personalised offers and newsletters"],
    ];

    return (
      <View style={styles.group}>
        {items.map(([key, title, subtitle]) => (
          <View key={key} style={styles.notificationRow}>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{title}</Text>
              <Text style={styles.rowSubtitle}>{subtitle}</Text>
            </View>
            <Switch
              ios_backgroundColor="rgba(201,151,90,0.22)"
              onValueChange={() => toggleNotification(key)}
              thumbColor="#fff"
              trackColor={{ false: T.border2, true: T.green }}
              value={notifications[key]}
            />
          </View>
        ))}
      </View>
    );
  }

  function renderCity() {
    const filtered = cities.filter((entry) => entry.name.toLowerCase().includes(cityQuery.toLowerCase()) || entry.label.toLowerCase().includes(cityQuery.toLowerCase()));

    return (
      <View>
        <TextInput
          onChangeText={setCityQuery}
          placeholder="Search city..."
          placeholderTextColor={T.text3}
          style={styles.searchInput}
          value={cityQuery}
        />
        <View style={styles.group}>
          {filtered.map((entry) => {
            const selected = city === entry.label;
            return (
              <Pressable
                key={entry.id}
                onPress={() => {
                  setCity(entry.label);
                  setEditCity(entry.label);
                  showToast(`City set to ${entry.label}`);
                  setTimeout(closeScreen, 500);
                }}
                style={({ pressed }) => [styles.cityRow, selected && styles.citySelected, pressed && styles.pressed]}
              >
                <Text style={styles.cityEmoji}>{entry.emoji}</Text>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{entry.name}</Text>
                  <Text style={styles.rowSubtitle}>{entry.state}</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioOn]} />
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={() => showToast("Request submitted!")}>
          <Text style={styles.cityFooter}>More cities coming soon · Request your city →</Text>
        </Pressable>
      </View>
    );
  }

  function renderBookings() {
    return (
      <View>
        <View style={styles.bookingTabs}>
          {["Upcoming", "Past", "Cancelled"].map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                setBookingTab(tab);
                showToast(`Showing ${tab} bookings`);
              }}
              style={[styles.bookingTab, bookingTab === tab && styles.bookingTabOn]}
            >
              <Text style={[styles.bookingTabText, bookingTab === tab && styles.bookingTabTextOn]}>{tab}</Text>
            </Pressable>
          ))}
        </View>
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} styles={styles} T={T} />
        ))}
      </View>
    );
  }

  function renderSaved() {
    return (
      <View>
        <Text style={styles.savedIntro}>5 venues saved to your wishlist</Text>
        {savedVenues.map((venue) => (
          <SavedVenueCard key={venue.id} venue={venue} styles={styles} T={T} onRemove={() => showToast("Removed from wishlist")} />
        ))}
      </View>
    );
  }

  function renderSupport() {
    return (
      <View>
        <SupportOption icon="💬" title="Live Chat" subtitle="Chat with our support team" meta="● Typically replies in under 2 minutes" onPress={() => showToast("Opening live chat...")} styles={styles} T={T} />
        <SupportOption icon="☎" title="Call Support" subtitle="1800-123-MOMENT (toll free)" meta="Mon–Sat · 9am–9pm IST" onPress={() => showToast("Call: 1800-123-4567")} styles={styles} T={T} />
        <SupportOption icon="🎫" title="Raise a Ticket" subtitle="Track your issue with a ticket ID" meta="Response in 4 business hours" onPress={() => showToast("Raise a support ticket")} styles={styles} T={T} />
        <SupportOption icon="?" title="Browse FAQs" subtitle="Quick answers to common questions" onPress={() => openScreen("faq")} styles={styles} T={T} />
      </View>
    );
  }

  function renderContact() {
    return (
      <View>
        <SupportOption icon="●" title="WhatsApp" subtitle="+91 98765 43210" meta="● Online now" onPress={() => showToast("Opening WhatsApp...")} styles={styles} T={T} />
        <SupportOption icon="✉" title="Email" subtitle="support@momentra.in" meta="Reply within 24 hours" onPress={() => showToast("Opening email...")} styles={styles} T={T} />
        <SupportOption icon="◎" title="Instagram" subtitle="@momentra.in" onPress={() => showToast("Opening Instagram...")} styles={styles} T={T} />
        <View style={styles.contactForm}>
          <Text style={styles.contactTitle}>Send us a message</Text>
          <TextInput placeholder="Your name" placeholderTextColor={T.text3} style={styles.contactInput} />
          <TextInput keyboardType="email-address" placeholder="Email address" placeholderTextColor={T.text3} style={styles.contactInput} />
          <TextInput multiline placeholder="How can we help you?" placeholderTextColor={T.text3} style={[styles.contactInput, styles.contactArea]} />
          <Pressable onPress={() => showToast("Message sent! We'll reply soon ✓")} style={styles.saveButton}>
            <Text style={styles.saveText}>Send Message</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderFaq() {
    return (
      <View>
        <TextInput placeholder="Search FAQs..." placeholderTextColor={T.text3} style={styles.searchInput} />
        {faqs.map(([question, answer]) => {
          const open = openFaq === question;
          return (
            <Pressable key={question} onPress={() => setOpenFaq(open ? null : question)} style={styles.faqCard}>
              <View style={styles.faqQuestion}>
                <Text style={styles.faqQuestionText}>{question}</Text>
                <Text style={styles.chevron}>{open ? "⌃" : "⌄"}</Text>
              </View>
              {open ? <Text style={styles.faqAnswer}>{answer}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    );
  }
}

function WalletSummaryCard({
  onHistory,
  onUse,
  styles,
  wallet,
}: {
  onHistory: () => void;
  onUse: () => void;
  styles: ReturnType<typeof createStyles>;
  T: Palette;
  wallet: MockWallet;
}) {
  return (
    <View style={styles.inlineWallet}>
      <View style={styles.inlineWalletTop}>
        <View>
          <Text style={styles.inlineEyebrow}>Event credits</Text>
          <Text style={styles.inlineWalletAmount}>{formatMockINR(wallet.available)}</Text>
          <Text style={styles.inlineWalletSub}>Use credits for bookings, food, decor, music, or add-ons.</Text>
        </View>
        <View style={styles.inlineWalletToken}>
          <Text style={styles.inlineWalletTokenText}>MC</Text>
        </View>
      </View>
      <View style={styles.creditUseGrid}>
        {["Booking", "Food", "Decor", "Add-ons"].map((item) => (
          <Text key={item} style={styles.creditUsePill}>{item}</Text>
        ))}
      </View>
      <View style={styles.inlineWalletStats}>
        <Text style={styles.inlineWalletStat}>Earned {formatMockINR(wallet.earned)}</Text>
        <Text style={styles.inlineWalletStat}>Used {formatMockINR(wallet.used)}</Text>
        <Text style={styles.inlineWalletStat}>Expiring {formatMockINR(wallet.expiring)}</Text>
      </View>
      <View style={styles.inlineActions}>
        <Pressable onPress={onUse} style={styles.inlinePrimary}>
          <Text style={styles.inlinePrimaryText}>Use credits</Text>
        </Pressable>
        <Pressable onPress={onHistory} style={styles.inlineSecondary}>
          <Text style={styles.inlineSecondaryText}>Credit history</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SharedPlanPreview({
  incomingCount,
  members,
  onCreate,
  onOpen,
  plan,
  plansCount,
  styles,
}: {
  incomingCount: number;
  members: CircleMember[];
  onCreate: () => void;
  onOpen: () => void;
  plan?: SharedPaymentPlan;
  plansCount: number;
  styles: ReturnType<typeof createStyles>;
  T: Palette;
}) {
  const paid = plan?.members.filter((member) => member.status === "paid").length ?? 0;
  const invited = plan?.members.length ?? members.length;
  const pending = Math.max(invited - paid, 0);

  return (
    <View style={styles.inlineGroupCard}>
      <View style={styles.inlineGroupTop}>
        <View>
          <Text style={styles.inlineEyebrow}>My circle</Text>
          <Text style={styles.inlineGroupTitle}>{members.length ? "My Circle" : "Create your Circle"}</Text>
          <Text style={styles.inlineGroupSub}>
            {plan ? `${members.length} members · ${paid}/${invited} paid · ${pending} pending` : `${members.length} members · ${plansCount} plans · ${incomingCount} requests`}
          </Text>
        </View>
        <View style={styles.memberStack}>
          {members.slice(0, 3).map((member) => (
            <View key={member.id} style={styles.memberStackAvatar}>
              <Text style={styles.memberStackText}>{profileInitial(member.member)}</Text>
            </View>
          ))}
        </View>
      </View>
      {plan ? (
        <View style={styles.circleMission}>
          <Text style={styles.circleMissionTitle}>{plan.title}</Text>
          <Text style={styles.circleMissionText}>Needs {plan.threshold} payments to confirm this celebration.</Text>
          <View style={styles.planProgressTrack}>
            <View style={[styles.planProgressFill, { width: `${invited ? Math.round((paid / invited) * 100) : 0}%` }]} />
          </View>
        </View>
      ) : null}
      <View style={styles.inlineActions}>
        <Pressable onPress={onOpen} style={styles.inlinePrimary}>
          <Text style={styles.inlinePrimaryText}>Open circle</Text>
        </Pressable>
        <Pressable onPress={onCreate} style={styles.inlineSecondary}>
          <Text style={styles.inlineSecondaryText}>Create plan</Text>
        </Pressable>
      </View>
    </View>
  );
}

function WalletTransactionRow({ styles, transaction }: { styles: ReturnType<typeof createStyles>; transaction: WalletTransaction }) {
  const positive = transaction.amount >= 0;
  return (
    <View style={styles.transactionRow}>
      <IconTile icon={walletTypeLabel(transaction.type)} gradient={positive ? "green" : "red"} styles={styles} />
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{transaction.note}</Text>
        <Text style={styles.rowSubtitle}>{transaction.date} · {transaction.type.replace("_", " ")}</Text>
      </View>
      <Text style={[styles.transactionAmount, positive ? styles.greenText : styles.redText]}>
        {positive ? "+" : "-"}{formatMockINR(Math.abs(transaction.amount))}
      </Text>
    </View>
  );
}

function MemberBubble({ member, styles }: { member: CircleMember; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.memberBubble}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>{profileInitial(member.member)}</Text>
      </View>
      <Text style={styles.memberName} numberOfLines={1}>{profileDisplayName(member.member)}</Text>
      <Text style={styles.memberStatus}>{member.member?.momentra_id || "Member"}</Text>
    </View>
  );
}

function SharedPlanCard({
  plan,
  showToast,
  styles,
  T,
}: {
  plan: SharedPaymentPlan;
  showToast: (message: string) => void;
  styles: ReturnType<typeof createStyles>;
  T: Palette;
}) {
  const paid = plan.members.filter((member) => member.status === "paid").length;
  const invited = plan.members.length;
  const pending = Math.max(invited - paid, 0);
  const perHead = invited ? Math.ceil(plan.total_amount / invited) : plan.total_amount;
  const reached = paid >= plan.threshold;

  return (
    <Pressable onPress={() => showToast("Shared plan tracker is live in My Circle.")} style={({ pressed }) => [styles.sharedPlanCard, pressed && styles.pressed]}>
      <View style={styles.sharedPlanTop}>
        <View>
          <Text style={styles.inlineEyebrow}>Shared plan</Text>
          <Text style={styles.sharedPlanTitle}>{plan.title}</Text>
          <Text style={styles.sharedPlanSub}>
            {plan.split_type} split · {formatMockINR(perHead)} per participant · needs {plan.threshold} payments
          </Text>
        </View>
        <Pill label={planStatusLabel(plan, reached)} tone={reached ? "green" : "gold"} T={T} styles={styles} />
      </View>
      <View style={styles.planProgressTrack}>
        <View style={[styles.planProgressFill, { width: `${invited ? Math.round((paid / invited) * 100) : 0}%` }]} />
      </View>
      <View style={styles.planMetaGrid}>
        <PlanMetric label="Paid" value={`${paid}`} styles={styles} />
        <PlanMetric label="Pending" value={`${pending}`} styles={styles} />
        <PlanMetric label="Threshold" value={`${plan.threshold}`} styles={styles} />
        <PlanMetric label="Total" value={formatMockINR(plan.total_amount)} styles={styles} />
      </View>
      <Text style={styles.circleStatusLine}>
        {reached ? "Circle is ready to confirm." : `${Math.max(plan.threshold - paid, 0)} more payment${Math.max(plan.threshold - paid, 0) === 1 ? "" : "s"} needed to confirm.`}
      </Text>
      <View style={styles.planMembersLine}>
        {plan.members.slice(0, 4).map((member) => (
          <Text key={member.id} style={styles.planMemberPill}>{profileFirstName(member.profile)}</Text>
        ))}
      </View>
    </Pressable>
  );
}

function PlanMetric({ label, styles, value }: { label: string; styles: ReturnType<typeof createStyles>; value: string }) {
  return (
    <View style={styles.planMetric}>
      <Text style={styles.planMetricValue}>{value}</Text>
      <Text style={styles.planMetricLabel}>{label}</Text>
    </View>
  );
}

function ReviewLine({ label, styles, value }: { label: string; styles: ReturnType<typeof createStyles>; value: string }) {
  return (
    <View style={styles.reviewLine}>
      <Text style={styles.reviewLineLabel}>{label}</Text>
      <Text style={styles.reviewLineValue}>{value}</Text>
    </View>
  );
}

function EmptyProfileState({
  action,
  body,
  onPress,
  styles,
  title,
}: {
  action: string;
  body: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  title: string;
}) {
  return (
    <View style={styles.emptyProfileCard}>
      <Text style={styles.emptyProfileTitle}>{title}</Text>
      <Text style={styles.emptyProfileBody}>{body}</Text>
      <Pressable onPress={onPress} style={styles.emptyProfileButton}>
        <Text style={styles.emptyProfileButtonText}>{action}</Text>
      </Pressable>
    </View>
  );
}

function formatMockINR(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function CircleProfileResult({
  currentProfileId,
  onSend,
  profile,
  sending,
  styles,
}: {
  currentProfileId?: string;
  onSend: () => void;
  profile: PublicCircleProfile;
  sending: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  const isSelf = currentProfileId === profile.id;

  return (
    <View style={styles.circleResultCard}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>{profileInitial(profile)}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{profileDisplayName(profile)}</Text>
        <Text style={styles.rowSubtitle}>{profile.momentra_id} · {profile.city || "City not added"}</Text>
      </View>
      <Pressable disabled={isSelf || sending} onPress={onSend} style={[styles.requestAction, (isSelf || sending) && styles.disabled]}>
        <Text style={styles.requestActionText}>{isSelf ? "You" : sending ? "Sending" : "Send Request"}</Text>
      </Pressable>
    </View>
  );
}

function CircleRequestRow({
  busy,
  onAccept,
  onDecline,
  request,
  side,
  styles,
}: {
  busy: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  request: CircleRequest;
  side: "incoming" | "sent";
  styles: ReturnType<typeof createStyles>;
}) {
  const otherProfile = side === "incoming" ? request.requester : request.receiver;

  return (
    <View style={styles.circleRequestRow}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>{profileInitial(otherProfile)}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{profileDisplayName(otherProfile)}</Text>
        <Text style={styles.rowSubtitle}>{otherProfile?.momentra_id || "Momentra profile"} · {request.status}</Text>
      </View>
      {side === "incoming" && request.status === "pending" ? (
        <View style={styles.requestButtons}>
          <Pressable disabled={busy} onPress={onDecline} style={[styles.requestGhost, busy && styles.disabled]}>
            <Text style={styles.requestGhostText}>Decline</Text>
          </Pressable>
          <Pressable disabled={busy} onPress={onAccept} style={[styles.requestAction, busy && styles.disabled]}>
            <Text style={styles.requestActionText}>{busy ? "Saving" : "Accept"}</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.requestStatusText}>{request.status}</Text>
      )}
    </View>
  );
}

function makeFallbackMomentraId(profileId: string) {
  return `MOM-${profileId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function pickImageFileFromBrowser() {
  return new Promise<File | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.oncancel = () => resolve(null);
    input.click();
  });
}

async function uploadProfilePhoto(profileId: string, file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${profileId}/avatar-${Date.now()}.${extension}`;
  const { error } = await supabase.storage
    .from("profile-photos")
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
  return data.publicUrl;
}

function profileDisplayName(profile?: PublicCircleProfile | null) {
  return profile?.full_name?.trim() || "Circle Member";
}

function formatProfilePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "Your Profile";
  return `User ${digits.slice(-4)}`;
}

function profileFirstName(profile?: PublicCircleProfile | null) {
  return profileDisplayName(profile).split(" ")[0] || "Member";
}

function profileInitial(profile?: PublicCircleProfile | null) {
  return profileDisplayName(profile).slice(0, 1).toUpperCase() || "M";
}

function walletTypeLabel(type: WalletTransactionType) {
  const labels: Record<WalletTransactionType, string> = {
    manual_credit: "MC",
    promo: "PR",
    redemption: "RD",
    referral: "RF",
    refund: "RE",
  };

  return labels[type];
}

function planStatusLabel(plan: SharedPaymentPlan, thresholdReached: boolean) {
  if (plan.status === "completed") return "Completed";
  if (thresholdReached) return "Threshold reached";
  if (plan.status === "threshold_pending") return "Threshold pending";
  return "Collecting";
}

function TopBar({
  title,
  onBack,
  action,
  styles,
}: {
  title: string;
  onBack: () => void;
  action?: { label: string; onPress: () => void };
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.topbar}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>
      <Text style={styles.topbarTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={action.onPress} style={styles.topbarAction}>
          <Text style={styles.topbarActionText}>{action.label}</Text>
        </Pressable>
      ) : (
        <View style={styles.topbarSpacer} />
      )}
    </View>
  );
}

function Section({ title, children, styles }: { title: string; children: React.ReactNode; styles: ReturnType<typeof createStyles> }) {
  return (
    <>
      <SectionLabel label={title} styles={styles} />
      <View style={styles.group}>{children}</View>
    </>
  );
}

function SectionLabel({ label, styles }: { label: string; styles: ReturnType<typeof createStyles> }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function IconTile({ icon, gradient, styles }: { icon: string; gradient: keyof typeof iconGradients; styles: ReturnType<typeof createStyles> }) {
  return (
    <LinearGradient colors={iconGradients[gradient]} style={styles.iconTile}>
      <Text style={styles.iconText}>{icon}</Text>
    </LinearGradient>
  );
}

function MenuRow({
  icon,
  title,
  subtitle,
  gradient,
  right,
  onPress,
  styles,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  gradient: keyof typeof iconGradients;
  right?: React.ReactNode;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  T: Palette;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <IconTile icon={icon} gradient={gradient} styles={styles} />
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.rowRight}>
        {right}
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

function Pill({ label, tone, styles, T }: { label: string; tone: "green" | "gold" | "red" | "blue"; styles: ReturnType<typeof createStyles>; T: Palette }) {
  const color = tone === "green" ? T.green : tone === "red" ? T.red : tone === "blue" ? T.blue : T.gold;
  const bg = tone === "green" ? T.greenBg : tone === "red" ? "rgba(192,57,43,0.10)" : tone === "blue" ? T.blueBg : "rgba(201,151,90,0.10)";
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: color }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function Stat({
  value,
  label,
  onPress,
  styles,
  small,
  green,
}: {
  value: string;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  small?: boolean;
  green?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.stat, pressed && styles.pressed]}>
      <Text style={[styles.statValue, small && styles.statValueSmall, green && styles.greenText]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

function Field({
  label,
  styles,
  editable = true,
  onChangeText,
  placeholder,
  keyboardType,
  value,
}: {
  label: string;
  styles: ReturnType<typeof createStyles>;
  editable?: boolean;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  value: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        editable={editable}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(242,232,217,0.32)"
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
      />
    </View>
  );
}

function AddressCard({
  label,
  icon,
  lines,
  gradient,
  styles,
  showToast,
}: {
  label: string;
  icon: string;
  lines: string;
  gradient: keyof typeof iconGradients;
  styles: ReturnType<typeof createStyles>;
  showToast: (message: string) => void;
}) {
  return (
    <View style={styles.addressCard}>
      <IconTile icon={icon} gradient={gradient} styles={styles} />
      <View style={styles.rowBody}>
        <Text style={styles.addressType}>{label}</Text>
        <Text style={styles.addressLine}>{lines}</Text>
        <View style={styles.addressActions}>
          <Pressable onPress={() => showToast("Edit address")}>
            <Text style={styles.addressAction}>Edit</Text>
          </Pressable>
          <Pressable onPress={() => showToast("Address removed")}>
            <Text style={[styles.addressAction, styles.addressDelete]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function PaymentRow({
  mark,
  title,
  subtitle,
  badge,
  styles,
  showToast,
}: {
  mark: string;
  title: string;
  subtitle: string;
  badge?: string;
  styles: ReturnType<typeof createStyles>;
  showToast: (message: string) => void;
}) {
  return (
    <Pressable onPress={() => showToast(`${title} selected`)} style={({ pressed }) => [styles.payRow, pressed && styles.pressed]}>
      <View style={styles.payMark}>
        <Text style={styles.payMarkText}>{mark}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.payTitle}>{title}</Text>
        <Text style={styles.paySub}>{subtitle}</Text>
      </View>
      {badge ? <Text style={styles.primaryBadge}>{badge}</Text> : null}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function BookingCard({ booking, styles, T }: { booking: (typeof bookings)[number]; styles: ReturnType<typeof createStyles>; T: Palette }) {
  return (
    <Pressable style={({ pressed }) => [styles.bookingCard, pressed && styles.pressed]}>
      <LinearGradient colors={booking.colors} style={styles.bookingBanner}>
        <Text style={styles.bookingEmoji}>{booking.emoji}</Text>
        <View style={styles.bookingStatus}>
          <Text style={[styles.pillText, { color: T.green }]}>Upcoming</Text>
        </View>
      </LinearGradient>
      <View style={styles.bookingBody}>
        <Text style={styles.bookingTitle}>{booking.title}</Text>
        <Text style={styles.bookingMeta}>📅 {booking.date}   🕐 {booking.time}   👥 {booking.guests}</Text>
        <Text style={styles.bookingVenue}>📍 {booking.venue}</Text>
        <Text style={styles.bookingPrice}>{booking.price}</Text>
      </View>
    </Pressable>
  );
}

function SavedVenueCard({
  venue,
  styles,
  onRemove,
}: {
  venue: (typeof savedVenues)[number];
  styles: ReturnType<typeof createStyles>;
  T: Palette;
  onRemove: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.venueCard, pressed && styles.pressed]}>
      <LinearGradient colors={venue.colors} style={styles.venueThumb}>
        <Text style={styles.venueEmoji}>{venue.emoji}</Text>
      </LinearGradient>
      <View style={styles.venueBody}>
        <Text style={styles.venueName}>{venue.name}</Text>
        <Text style={styles.venueMeta}>📍 {venue.meta}</Text>
        <Text style={styles.venuePrice}>{venue.price}</Text>
        <View style={styles.venueTags}>
          {venue.tags.map((tag) => (
            <Text key={`${venue.id}-${tag}`} style={styles.venueTag}>{tag}</Text>
          ))}
        </View>
      </View>
      <Pressable onPress={onRemove} style={styles.venueHeart}>
        <Text style={styles.heartText}>♥</Text>
      </Pressable>
    </Pressable>
  );
}

function SupportOption({
  icon,
  title,
  subtitle,
  meta,
  onPress,
  styles,
}: {
  icon: string;
  title: string;
  subtitle: string;
  meta?: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  T: Palette;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.supportCard, pressed && styles.pressed]}>
      <View style={styles.supportIcon}>
        <Text style={styles.supportIconText}>{icon}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.supportTitle}>{title}</Text>
        <Text style={styles.supportSub}>{subtitle}</Text>
        {meta ? <Text style={styles.supportMeta}>{meta}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function LegalCopy({ type, styles }: { type: "privacy" | "terms"; styles: ReturnType<typeof createStyles> }) {
  const privacy = type === "privacy";
  return (
    <View style={styles.legal}>
      <Text style={styles.legalTitle}>{privacy ? "Privacy Policy" : "Terms & Conditions"}</Text>
      <Text style={styles.legalDate}>Last updated: 1 May 2026</Text>
      {(privacy
        ? [
            ["Information We Collect", "We collect information you provide when creating an account, making bookings, or contacting support, including your name, phone number, preferences, and booking details."],
            ["How We Use Information", "We use your information to process bookings, personalize recommendations, send confirmations, improve the platform, and protect against fraud."],
            ["Data Sharing", "When a booking is confirmed, we share relevant booking details with the venue partner only for service delivery."],
            ["Your Rights", "You may request correction or deletion of your information by contacting privacy@momentra.in."],
          ]
        : [
            ["Acceptance", "By creating an account or booking on Momentra, you agree to these terms."],
            ["Bookings & Payments", "Bookings are confirmed only after successful payment. Momentra acts as a marketplace between customers and venues."],
            ["Cancellations & Refunds", "Cancellation and refund policies vary by vendor and are shown before booking."],
            ["Limitation of Liability", "Momentra facilitates booking and support. Experience quality remains the responsibility of the venue or vendor."],
          ]).map(([heading, body]) => (
        <View key={heading} style={styles.legalBlock}>
          <Text style={styles.legalHeading}>{heading}</Text>
          <Text style={styles.legalBody}>{body}</Text>
        </View>
      ))}
    </View>
  );
}

function Toast({ message, styles }: { message: string; styles: ReturnType<typeof createStyles> }) {
  if (!message) return null;
  return (
    <View style={styles.toast}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}

function LogoutSheet({
  open,
  onCancel,
  onLogout,
  styles,
}: {
  open: boolean;
  onCancel: () => void;
  onLogout: () => void;
  styles: ReturnType<typeof createStyles>;
  T: Palette;
}) {
  return (
    <Modal animationType="fade" transparent visible={open} onRequestClose={onCancel}>
      <Pressable onPress={onCancel} style={styles.overlay}>
        <Pressable style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Log out of Momentra?</Text>
          <Text style={styles.sheetSub}>You will need to sign in again to access your bookings and saved venues.</Text>
          <Pressable onPress={onLogout} style={styles.sheetPrimary}>
            <Text style={styles.sheetPrimaryText}>Log Out</Text>
          </Pressable>
          <Pressable onPress={onCancel} style={styles.sheetSecondary}>
            <Text style={styles.sheetSecondaryText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AddPaymentSheet({
  open,
  onClose,
  onPick,
  styles,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (label: string) => void;
  styles: ReturnType<typeof createStyles>;
  T: Palette;
}) {
  return (
    <Modal animationType="fade" transparent visible={open} onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Add Payment Method</Text>
          <View style={styles.payChoiceGrid}>
            {[
              ["UPI", "GPay, PhonePe, Paytm", "📱"],
              ["Card", "Debit or credit card", "💳"],
              ["Net Banking", "All major banks", "🏦"],
              ["Wallet", "Paytm, Amazon Pay", "👛"],
            ].map(([label, sub, icon]) => (
              <Pressable key={label} onPress={() => onPick(label)} style={styles.payChoice}>
                <Text style={styles.payChoiceIcon}>{icon}</Text>
                <Text style={styles.payChoiceTitle}>{label}</Text>
                <Text style={styles.payChoiceSub}>{sub}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={onClose} style={styles.sheetSecondary}>
            <Text style={styles.sheetSecondaryText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(T: Palette) {
  return StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor: T.bg,
    },
    shell: {
      backgroundColor: T.bg,
      flex: 1,
      width: "100%",
    },
    screen: {
      backgroundColor: T.bg,
      flex: 1,
    },
    screenBody: {
      alignSelf: "center",
      maxWidth: 1040,
      paddingBottom: Platform.OS === "web" ? 184 : 156,
      paddingHorizontal: Platform.OS === "web" ? 24 : 0,
      width: "100%",
    },
    subBody: {
      alignSelf: "center",
      maxWidth: 1040,
      paddingBottom: 48,
      paddingHorizontal: Platform.OS === "web" ? 24 : 0,
      paddingTop: 14,
      width: "100%",
    },
    center: {
      alignItems: "center",
      justifyContent: "center",
    },
    loadingTitle: {
      color: T.gold,
      fontFamily: Platform.select({ web: "Cormorant Garamond, serif", default: undefined }),
      fontSize: 34,
      fontStyle: "italic",
      marginBottom: 8,
    },
    muted: {
      color: T.text3,
      fontSize: 13,
    },
    topbar: {
      alignItems: "center",
      backgroundColor: T.bg2,
      borderBottomColor: T.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      height: 54,
      justifyContent: "space-between",
      paddingHorizontal: 20,
    },
    backButton: {
      minWidth: 72,
      paddingVertical: 10,
    },
    backText: {
      color: T.gold,
      fontSize: 15,
      fontWeight: "600",
    },
    topbarTitle: {
      color: T.text,
      fontSize: 16,
      fontWeight: "700",
      left: 0,
      position: "absolute",
      right: 0,
      textAlign: "center",
      zIndex: -1,
    },
    topbarAction: {
      minWidth: 72,
      paddingVertical: 10,
    },
    topbarActionText: {
      color: T.gold,
      fontSize: 14,
      fontWeight: "700",
      textAlign: "right",
    },
    topbarSpacer: {
      minWidth: 72,
    },
    hero: {
      alignItems: "center",
      flexDirection: "row",
      gap: 18,
      paddingBottom: 18,
      paddingHorizontal: 20,
      paddingTop: 30,
    },
    avatar: {
      alignItems: "center",
      borderColor: T.gold,
      borderRadius: 36,
      borderWidth: 2.5,
      height: 72,
      justifyContent: "center",
      width: 72,
      backgroundColor: T.red,
    },
    avatarImage: {
      borderRadius: 33,
      height: "100%",
      width: "100%",
    },
    avatarText: {
      color: "#fff",
      fontFamily: Platform.select({ web: "Cormorant Garamond, serif", default: undefined }),
      fontSize: 30,
      fontStyle: "italic",
    },
    avatarEdit: {
      alignItems: "center",
      backgroundColor: T.gold,
      borderColor: T.bg,
      borderRadius: 12,
      borderWidth: 2,
      bottom: -1,
      height: 23,
      justifyContent: "center",
      position: "absolute",
      right: -1,
      width: 23,
    },
    avatarEditText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "800",
    },
    heroCopy: {
      flex: 1,
    },
    heroName: {
      color: T.text,
      fontFamily: Platform.select({ web: "Cormorant Garamond, serif", default: undefined }),
      fontSize: 24,
      lineHeight: 28,
    },
    heroCity: {
      color: T.text3,
      fontSize: 13,
      marginTop: 3,
    },
    heroPhone: {
      color: T.text3,
      fontSize: 12,
      marginTop: 7,
    },
    heroTags: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 8,
    },
    pill: {
      borderRadius: 20,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    pillText: {
      fontSize: 11,
      fontWeight: "700",
    },
    editButton: {
      alignItems: "center",
      borderColor: T.border2,
      borderRadius: 13,
      borderWidth: 1.5,
      justifyContent: "center",
      marginBottom: 18,
      marginHorizontal: 12,
      padding: 12,
    },
    editButtonText: {
      color: T.text2,
      fontSize: 14,
      fontWeight: "600",
    },
    stats: {
      flexDirection: "row",
      gap: 8,
      marginHorizontal: 12,
    },
    stat: {
      alignItems: "center",
      backgroundColor: T.card,
      borderColor: T.border,
      borderRadius: 14,
      borderWidth: 1,
      flex: 1,
      paddingHorizontal: 6,
      paddingVertical: 14,
    },
    statValue: {
      color: T.text,
      fontFamily: Platform.select({ web: "Cormorant Garamond, serif", default: undefined }),
      fontSize: 26,
      lineHeight: 28,
    },
    statValueSmall: {
      color: T.gold,
      fontFamily: Platform.select({ web: "DM Sans, sans-serif", default: undefined }),
      fontSize: 14,
      fontWeight: "800",
      marginBottom: 4,
    },
    greenText: {
      color: T.green,
    },
    statLabel: {
      color: T.text3,
      fontSize: 9,
      fontWeight: "700",
      letterSpacing: 1.8,
      marginTop: 4,
      textTransform: "uppercase",
    },
    momentraIdCard: {
      alignItems: "center",
      backgroundColor: T.card,
      borderColor: T.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      gap: 12,
      marginHorizontal: 12,
      marginTop: 12,
      padding: 15,
    },
    momentraIdText: {
      color: T.gold2,
      fontSize: 18,
      fontWeight: "900",
      letterSpacing: 1.2,
    },
    copyIdButton: {
      alignItems: "center",
      backgroundColor: "rgba(201,151,90,0.12)",
      borderColor: "rgba(201,151,90,0.28)",
      borderRadius: 12,
      borderWidth: 1,
      minWidth: 72,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    copyIdText: {
      color: T.gold2,
      fontSize: 12,
      fontWeight: "900",
    },
    sectionLabel: {
      color: T.text3,
      fontSize: 10.5,
      fontWeight: "800",
      letterSpacing: 2.2,
      paddingBottom: 9,
      paddingHorizontal: 16,
      paddingTop: 22,
      textTransform: "uppercase",
    },
    group: {
      backgroundColor: T.card,
      borderColor: T.border,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 12,
      marginHorizontal: 12,
      overflow: "hidden",
    },
    row: {
      alignItems: "center",
      borderBottomColor: T.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 15,
    },
    pressed: {
      opacity: 0.72,
    },
    iconTile: {
      alignItems: "center",
      borderRadius: 10,
      height: 38,
      justifyContent: "center",
      width: 38,
    },
    iconText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "800",
    },
    rowBody: {
      flex: 1,
      minWidth: 0,
    },
    rowTitle: {
      color: T.text,
      fontSize: 15,
      fontWeight: "600",
    },
    rowSubtitle: {
      color: T.text3,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 2,
    },
    rowRight: {
      alignItems: "center",
      flexDirection: "row",
      gap: 7,
    },
    rowValue: {
      color: T.text3,
      fontSize: 14,
      fontWeight: "500",
    },
    chevron: {
      color: T.text3,
      fontSize: 22,
      fontWeight: "300",
      lineHeight: 24,
    },
    logoutButton: {
      alignItems: "center",
      backgroundColor: "rgba(192,57,43,0.07)",
      borderColor: "rgba(192,57,43,0.22)",
      borderRadius: 14,
      borderWidth: 1.5,
      marginBottom: 28,
      marginHorizontal: 12,
      marginTop: 4,
      padding: 15,
    },
    logoutText: {
      color: T.red,
      fontSize: 15,
      fontWeight: "800",
    },
    version: {
      color: T.text3,
      fontSize: 12,
      paddingBottom: 4,
      textAlign: "center",
    },
    editAvatar: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: T.red,
      borderColor: T.gold,
      borderRadius: 45,
      borderWidth: 2.5,
      height: 90,
      justifyContent: "center",
      marginTop: 14,
      width: 90,
    },
    editAvatarImage: {
      borderRadius: 42,
      height: "100%",
      width: "100%",
    },
    editAvatarText: {
      color: "#fff",
      fontFamily: Platform.select({ web: "Cormorant Garamond, serif", default: undefined }),
      fontSize: 38,
      fontStyle: "italic",
    },
    editCamera: {
      alignItems: "center",
      backgroundColor: T.gold,
      borderColor: T.bg,
      borderRadius: 14,
      borderWidth: 2.5,
      bottom: 0,
      height: 28,
      justifyContent: "center",
      position: "absolute",
      right: 0,
      width: 28,
    },
    tapPhoto: {
      color: T.text3,
      fontSize: 12,
      marginBottom: 14,
      marginTop: 8,
      textAlign: "center",
    },
    removePhotoButton: {
      alignItems: "center",
      alignSelf: "center",
      borderColor: "rgba(192,57,43,0.24)",
      borderRadius: 999,
      borderWidth: 1,
      marginBottom: 22,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    removePhotoText: {
      color: T.red,
      fontSize: 12,
      fontWeight: "800",
    },
    fieldWrap: {
      marginBottom: 14,
      paddingHorizontal: 16,
    },
    fieldLabel: {
      color: T.text3,
      fontSize: 10.5,
      fontWeight: "800",
      letterSpacing: 1.5,
      marginBottom: 7,
      marginHorizontal: 16,
      textTransform: "uppercase",
    },
    input: {
      backgroundColor: T.bg3,
      borderColor: T.border2,
      borderRadius: 12,
      borderWidth: 1.5,
      color: T.text,
      fontSize: 15,
      paddingHorizontal: 15,
      paddingVertical: 13,
    },
    inputDisabled: {
      opacity: 0.72,
    },
    editHint: {
      color: T.text3,
      fontSize: 12,
      lineHeight: 18,
      marginHorizontal: 16,
      marginTop: 4,
    },
    disabled: {
      opacity: 0.55,
    },
    selectBox: {
      alignItems: "center",
      backgroundColor: T.bg3,
      borderColor: T.border2,
      borderRadius: 12,
      borderWidth: 1.5,
      flexDirection: "row",
      justifyContent: "space-between",
      marginHorizontal: 16,
      paddingHorizontal: 15,
      paddingVertical: 13,
    },
    selectText: {
      color: T.text,
      fontSize: 15,
    },
    saveButton: {
      alignItems: "center",
      backgroundColor: T.red,
      borderRadius: 14,
      justifyContent: "center",
      marginHorizontal: 16,
      marginTop: 18,
      padding: 15,
    },
    saveText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "800",
    },
    addressCard: {
      borderBottomColor: T.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      gap: 13,
      paddingHorizontal: 16,
      paddingVertical: 15,
    },
    addressType: {
      color: T.text3,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.5,
      marginBottom: 3,
      textTransform: "uppercase",
    },
    addressLine: {
      color: T.text,
      fontSize: 14,
      lineHeight: 20,
    },
    addressActions: {
      flexDirection: "row",
      gap: 16,
      marginTop: 7,
    },
    addressAction: {
      color: T.gold,
      fontSize: 12.5,
      fontWeight: "800",
    },
    addressDelete: {
      color: T.red,
    },
    addRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 15,
    },
    addCircle: {
      alignItems: "center",
      borderColor: T.border2,
      borderRadius: 10,
      borderStyle: "dashed",
      borderWidth: 1.5,
      height: 38,
      justifyContent: "center",
      width: 38,
    },
    addPlus: {
      color: T.text3,
      fontSize: 20,
    },
    addText: {
      color: T.text3,
      fontSize: 14.5,
      fontWeight: "600",
    },
    walletCard: {
      backgroundColor: "#1a0e04",
      borderColor: "rgba(201,151,90,0.30)",
      borderRadius: 20,
      borderWidth: 1,
      marginBottom: 20,
      marginHorizontal: 12,
      padding: 20,
    },
    walletTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 18,
    },
    walletLabel: {
      color: "rgba(201,151,90,0.55)",
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 2,
      marginBottom: 6,
      textTransform: "uppercase",
    },
    walletAmount: {
      color: T.gold2,
      fontFamily: Platform.select({ web: "Cormorant Garamond, serif", default: undefined }),
      fontSize: 40,
      lineHeight: 42,
    },
    walletSub: {
      color: "rgba(242,232,217,0.35)",
      fontSize: 12,
      marginTop: 5,
    },
    walletIcon: {
      alignItems: "center",
      backgroundColor: "rgba(201,151,90,0.10)",
      borderColor: "rgba(201,151,90,0.20)",
      borderRadius: 12,
      borderWidth: 1,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    walletIconText: {
      color: T.gold,
      fontSize: 18,
    },
    progressTrack: {
      backgroundColor: "rgba(255,255,255,0.08)",
      borderRadius: 4,
      height: 3,
      overflow: "hidden",
    },
    progressFill: {
      backgroundColor: T.gold2,
      borderRadius: 4,
      height: "100%",
      width: "42%",
    },
    walletScale: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
      marginTop: 6,
    },
    walletScaleText: {
      color: "rgba(242,232,217,0.30)",
      fontSize: 11,
    },
    walletButton: {
      alignItems: "center",
      backgroundColor: "rgba(201,151,90,0.15)",
      borderColor: "rgba(201,151,90,0.35)",
      borderRadius: 12,
      borderWidth: 1.5,
      padding: 13,
    },
    walletButtonText: {
      color: T.gold2,
      fontSize: 14,
      fontWeight: "800",
    },
    inlineWallet: {
      backgroundColor: "#1a0e04",
      borderColor: "rgba(201,151,90,0.28)",
      borderRadius: 18,
      borderWidth: 1,
      marginHorizontal: 12,
      padding: 16,
    },
    inlineWalletTop: {
      alignItems: "flex-start",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    inlineEyebrow: {
      color: "rgba(201,151,90,0.62)",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.8,
      marginBottom: 5,
      textTransform: "uppercase",
    },
    inlineWalletAmount: {
      color: T.gold2,
      fontFamily: Platform.select({ web: "Cormorant Garamond, serif", default: undefined }),
      fontSize: 34,
      lineHeight: 36,
    },
    inlineWalletSub: {
      color: T.text3,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4,
      maxWidth: 420,
    },
    inlineWalletToken: {
      alignItems: "center",
      backgroundColor: "rgba(201,151,90,0.11)",
      borderColor: "rgba(201,151,90,0.22)",
      borderRadius: 12,
      borderWidth: 1,
      height: 42,
      justifyContent: "center",
      width: 42,
    },
    inlineWalletTokenText: {
      color: T.gold,
      fontSize: 13,
      fontWeight: "900",
    },
    inlineWalletStats: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 14,
    },
    inlineWalletStat: {
      backgroundColor: "rgba(255,255,255,0.035)",
      borderColor: T.border,
      borderRadius: 999,
      borderWidth: 1,
      color: T.text3,
      fontSize: 11,
      fontWeight: "700",
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    creditUseGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 14,
    },
    creditUsePill: {
      backgroundColor: "rgba(201,151,90,0.10)",
      borderColor: "rgba(201,151,90,0.22)",
      borderRadius: 999,
      borderWidth: 1,
      color: T.gold2,
      fontSize: 11,
      fontWeight: "800",
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    expiryBanner: {
      backgroundColor: "rgba(192,57,43,0.10)",
      borderColor: "rgba(192,57,43,0.26)",
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: 14,
      padding: 12,
    },
    expiryBannerTitle: {
      color: T.text,
      fontSize: 13,
      fontWeight: "900",
      marginBottom: 3,
    },
    expiryBannerText: {
      color: T.text3,
      fontSize: 12,
      lineHeight: 17,
    },
    inlineActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 9,
    },
    inlinePrimary: {
      alignItems: "center",
      backgroundColor: T.red,
      borderRadius: 12,
      flexGrow: 1,
      justifyContent: "center",
      minWidth: 132,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    inlinePrimaryText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "900",
    },
    inlineSecondary: {
      alignItems: "center",
      borderColor: T.border2,
      borderRadius: 12,
      borderWidth: 1.5,
      flexGrow: 1,
      justifyContent: "center",
      minWidth: 124,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    inlineSecondaryText: {
      color: T.gold2,
      fontSize: 13,
      fontWeight: "900",
    },
    inlineGroupCard: {
      backgroundColor: T.card,
      borderColor: T.border,
      borderRadius: 18,
      borderWidth: 1,
      marginHorizontal: 12,
      padding: 16,
    },
    inlineGroupTop: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
      marginBottom: 14,
    },
    inlineGroupTitle: {
      color: T.text,
      fontSize: 17,
      fontWeight: "800",
      marginBottom: 3,
    },
    inlineGroupSub: {
      color: T.text3,
      fontSize: 12,
      lineHeight: 18,
    },
    circleMission: {
      backgroundColor: "rgba(201,151,90,0.075)",
      borderColor: "rgba(201,151,90,0.18)",
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: 14,
      padding: 12,
    },
    circleMissionTitle: {
      color: T.text,
      fontSize: 14,
      fontWeight: "900",
      marginBottom: 3,
    },
    circleMissionText: {
      color: T.text3,
      fontSize: 12,
      lineHeight: 17,
      marginBottom: 9,
    },
    memberStack: {
      flexDirection: "row",
      minWidth: 72,
      paddingLeft: 16,
    },
    memberStackAvatar: {
      alignItems: "center",
      backgroundColor: T.bg3,
      borderColor: T.border2,
      borderRadius: 14,
      borderWidth: 1,
      height: 28,
      justifyContent: "center",
      marginLeft: -8,
      width: 28,
    },
    memberStackText: {
      color: T.gold2,
      fontSize: 11,
      fontWeight: "900",
    },
    previewSwitch: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 14,
      marginHorizontal: 12,
    },
    previewChip: {
      borderColor: T.border2,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 13,
      paddingVertical: 8,
    },
    previewChipOn: {
      backgroundColor: T.red,
      borderColor: T.red,
    },
    previewChipText: {
      color: T.text3,
      fontSize: 12,
      fontWeight: "800",
    },
    previewChipTextOn: {
      color: "#fff",
    },
    walletStatGrid: {
      flexDirection: "row",
      gap: 9,
      marginBottom: 16,
    },
    walletMiniStat: {
      backgroundColor: "rgba(255,255,255,0.035)",
      borderColor: T.border,
      borderRadius: 14,
      borderWidth: 1,
      flex: 1,
      padding: 12,
    },
    walletMiniLabel: {
      color: T.text3,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.2,
      marginBottom: 5,
      textTransform: "uppercase",
    },
    walletMiniValue: {
      color: T.gold2,
      fontSize: 16,
      fontWeight: "900",
    },
    walletActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    secondaryButton: {
      alignItems: "center",
      borderColor: T.border2,
      borderRadius: 12,
      borderWidth: 1.5,
      flex: 1,
      justifyContent: "center",
      minWidth: 132,
      padding: 13,
    },
    secondaryButtonText: {
      color: T.gold2,
      fontSize: 14,
      fontWeight: "800",
    },
    transactionRow: {
      alignItems: "center",
      borderBottomColor: T.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      gap: 13,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    transactionAmount: {
      fontSize: 13,
      fontWeight: "900",
    },
    redText: {
      color: T.red,
    },
    backendNote: {
      color: T.text3,
      fontSize: 12,
      lineHeight: 18,
      marginHorizontal: 16,
      marginTop: 12,
    },
    memberStrip: {
      marginBottom: 12,
      marginHorizontal: 12,
    },
    circleHeroCard: {
      alignItems: "center",
      backgroundColor: T.card,
      borderColor: T.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
      marginHorizontal: 12,
      padding: 16,
    },
    circleHeroEyebrow: {
      color: "rgba(201,151,90,0.62)",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.6,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    circleHeroTitle: {
      color: T.text,
      fontSize: 18,
      fontWeight: "900",
      marginBottom: 3,
    },
    circleHeroSub: {
      color: T.text3,
      fontSize: 12,
      lineHeight: 18,
      maxWidth: 520,
    },
    circleHeroBadge: {
      alignItems: "center",
      backgroundColor: "rgba(192,57,43,0.12)",
      borderColor: "rgba(192,57,43,0.28)",
      borderRadius: 16,
      borderWidth: 1,
      minWidth: 64,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    circleHeroBadgeText: {
      color: T.gold2,
      fontSize: 20,
      fontWeight: "900",
    },
    circleHeroBadgeLabel: {
      color: T.text3,
      fontSize: 10,
      fontWeight: "800",
      marginTop: 1,
      textTransform: "uppercase",
    },
    memberBubble: {
      alignItems: "center",
      backgroundColor: T.card,
      borderColor: T.border,
      borderRadius: 16,
      borderWidth: 1,
      marginRight: 10,
      minWidth: 104,
      paddingHorizontal: 12,
      paddingVertical: 13,
    },
    memberAvatar: {
      alignItems: "center",
      backgroundColor: T.bg3,
      borderColor: T.border2,
      borderRadius: 18,
      borderWidth: 1,
      height: 36,
      justifyContent: "center",
      width: 36,
    },
    memberAvatarOn: {
      backgroundColor: T.red,
      borderColor: T.red,
    },
    memberAvatarText: {
      color: T.gold2,
      fontSize: 13,
      fontWeight: "900",
    },
    memberName: {
      color: T.text,
      fontSize: 12,
      fontWeight: "800",
      marginTop: 8,
      maxWidth: 90,
    },
    memberStatus: {
      color: T.text3,
      fontSize: 10,
      marginTop: 3,
      textTransform: "capitalize",
    },
    sharedPlanCard: {
      backgroundColor: T.card,
      borderColor: T.border,
      borderRadius: 18,
      borderWidth: 1,
      marginBottom: 12,
      marginHorizontal: 12,
      padding: 16,
    },
    sharedPlanTop: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
      marginBottom: 14,
    },
    sharedPlanTitle: {
      color: T.text,
      fontSize: 16,
      fontWeight: "900",
      marginBottom: 3,
    },
    sharedPlanSub: {
      color: T.text3,
      fontSize: 12,
      lineHeight: 17,
    },
    planProgressTrack: {
      backgroundColor: "rgba(255,255,255,0.07)",
      borderRadius: 999,
      height: 5,
      marginBottom: 13,
      overflow: "hidden",
    },
    planProgressFill: {
      backgroundColor: T.gold2,
      borderRadius: 999,
      height: "100%",
    },
    planMetaGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    planMetric: {
      backgroundColor: "rgba(255,255,255,0.035)",
      borderColor: T.border,
      borderRadius: 12,
      borderWidth: 1,
      minWidth: 82,
      paddingHorizontal: 10,
      paddingVertical: 9,
    },
    planMetricValue: {
      color: T.text,
      fontSize: 14,
      fontWeight: "900",
    },
    planMetricLabel: {
      color: T.text3,
      fontSize: 10,
      fontWeight: "800",
      marginTop: 2,
      textTransform: "uppercase",
    },
    planMembersLine: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
    },
    circleStatusLine: {
      color: T.gold2,
      fontSize: 12,
      fontWeight: "800",
      lineHeight: 18,
      marginBottom: 12,
    },
    planMemberPill: {
      backgroundColor: "rgba(201,151,90,0.10)",
      borderColor: "rgba(201,151,90,0.22)",
      borderRadius: 999,
      borderWidth: 1,
      color: T.gold2,
      fontSize: 11,
      fontWeight: "800",
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    createPlanButton: {
      backgroundColor: "rgba(192,57,43,0.10)",
      borderColor: "rgba(192,57,43,0.32)",
      borderRadius: 16,
      borderWidth: 1.5,
      marginHorizontal: 12,
      marginTop: 8,
      padding: 16,
    },
    createPlanText: {
      color: T.text,
      fontSize: 15,
      fontWeight: "900",
    },
    createPlanSub: {
      color: T.text3,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4,
    },
    memberSelectRow: {
      alignItems: "center",
      borderBottomColor: T.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      gap: 13,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    splitChoiceRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginHorizontal: 12,
    },
    splitChoice: {
      backgroundColor: T.card,
      borderColor: T.border,
      borderRadius: 16,
      borderWidth: 1,
      flex: 1,
      minWidth: 150,
      padding: 15,
    },
    splitChoiceOn: {
      backgroundColor: "rgba(192,57,43,0.10)",
      borderColor: T.red,
    },
    splitChoiceText: {
      color: T.text,
      fontSize: 14,
      fontWeight: "900",
    },
    splitChoiceTextOn: {
      color: T.gold2,
    },
    splitChoiceSub: {
      color: T.text3,
      fontSize: 12,
      marginTop: 5,
    },
    thresholdProfileCard: {
      backgroundColor: T.card,
      borderColor: T.border,
      borderRadius: 16,
      borderWidth: 1,
      marginHorizontal: 12,
      padding: 16,
    },
    thresholdProfileCopy: {
      color: T.text2,
      flex: 1,
      fontSize: 13,
      lineHeight: 20,
    },
    thresholdControls: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      marginTop: 14,
    },
    thresholdButton: {
      alignItems: "center",
      backgroundColor: T.bg3,
      borderColor: T.border2,
      borderRadius: 12,
      borderWidth: 1,
      height: 38,
      justifyContent: "center",
      width: 38,
    },
    thresholdButtonText: {
      color: T.gold2,
      fontSize: 18,
      fontWeight: "900",
    },
    thresholdNumber: {
      color: T.text,
      fontSize: 18,
      fontWeight: "900",
      minWidth: 26,
      textAlign: "center",
    },
    reviewPlanCard: {
      backgroundColor: T.card,
      borderColor: T.border,
      borderRadius: 16,
      borderWidth: 1,
      marginHorizontal: 12,
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    reviewLine: {
      alignItems: "center",
      borderBottomColor: T.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 11,
    },
    reviewLineLabel: {
      color: T.text3,
      fontSize: 12,
      fontWeight: "800",
    },
    reviewLineValue: {
      color: T.text,
      flex: 1,
      fontSize: 13,
      fontWeight: "900",
      textAlign: "right",
    },
    emptyProfileCard: {
      alignItems: "flex-start",
      backgroundColor: T.card,
      borderColor: T.border,
      borderRadius: 16,
      borderStyle: "dashed",
      borderWidth: 1.5,
      marginBottom: 12,
      marginHorizontal: 12,
      padding: 18,
    },
    emptyProfileTitle: {
      color: T.text,
      fontSize: 16,
      fontWeight: "900",
      marginBottom: 5,
    },
    emptyProfileBody: {
      color: T.text3,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 14,
    },
    emptyProfileButton: {
      backgroundColor: "rgba(201,151,90,0.12)",
      borderColor: "rgba(201,151,90,0.28)",
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    emptyProfileButtonText: {
      color: T.gold2,
      fontSize: 12,
      fontWeight: "900",
    },
    payRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 14,
      padding: 16,
    },
    payMark: {
      alignItems: "center",
      backgroundColor: T.bg3,
      borderColor: T.border2,
      borderRadius: 10,
      borderWidth: 1,
      height: 36,
      justifyContent: "center",
      minWidth: 52,
      paddingHorizontal: 8,
    },
    payMarkText: {
      color: T.text,
      fontSize: 11,
      fontWeight: "900",
    },
    payTitle: {
      color: T.text,
      fontSize: 14.5,
      fontWeight: "600",
    },
    paySub: {
      color: T.text3,
      fontSize: 12,
      marginTop: 2,
    },
    primaryBadge: {
      backgroundColor: T.greenBg,
      borderColor: "rgba(39,174,96,0.28)",
      borderRadius: 20,
      borderWidth: 1,
      color: T.green,
      fontSize: 10.5,
      fontWeight: "800",
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    addPayment: {
      alignItems: "center",
      borderColor: T.border2,
      borderRadius: 16,
      borderStyle: "dashed",
      borderWidth: 1.5,
      flexDirection: "row",
      gap: 14,
      marginHorizontal: 12,
      padding: 16,
    },
    securityNote: {
      alignItems: "flex-start",
      backgroundColor: T.bg3,
      borderColor: T.border,
      borderRadius: 13,
      borderWidth: 1,
      flexDirection: "row",
      gap: 10,
      marginHorizontal: 16,
      marginTop: 10,
      padding: 13,
    },
    securityIcon: {
      color: T.gold,
      fontSize: 16,
    },
    securityText: {
      color: T.text3,
      flex: 1,
      fontSize: 12,
      lineHeight: 19,
    },
    notificationRow: {
      alignItems: "center",
      borderBottomColor: T.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 15,
    },
    searchInput: {
      backgroundColor: T.bg3,
      borderColor: T.border2,
      borderRadius: 12,
      borderWidth: 1.5,
      color: T.text,
      fontSize: 15,
      marginBottom: 12,
      marginHorizontal: 12,
      paddingHorizontal: 15,
      paddingVertical: 13,
    },
    circleSearchCard: {
      marginBottom: 8,
    },
    circleResultCard: {
      alignItems: "center",
      backgroundColor: T.card,
      borderColor: T.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      gap: 12,
      marginHorizontal: 12,
      marginTop: 12,
      padding: 14,
    },
    circleRequestRow: {
      alignItems: "center",
      borderBottomColor: T.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      gap: 13,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    requestButtons: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
    },
    requestAction: {
      alignItems: "center",
      backgroundColor: T.red,
      borderRadius: 11,
      justifyContent: "center",
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    requestActionText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "900",
    },
    requestGhost: {
      alignItems: "center",
      borderColor: T.border2,
      borderRadius: 11,
      borderWidth: 1,
      justifyContent: "center",
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    requestGhostText: {
      color: T.gold2,
      fontSize: 11,
      fontWeight: "900",
    },
    requestStatusText: {
      color: T.text3,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "capitalize",
    },
    cityRow: {
      alignItems: "center",
      borderBottomColor: T.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      gap: 13,
      paddingHorizontal: 16,
      paddingVertical: 15,
    },
    citySelected: {
      backgroundColor: "rgba(201,151,90,0.06)",
    },
    cityEmoji: {
      fontSize: 22,
      textAlign: "center",
      width: 34,
    },
    radio: {
      borderColor: T.border2,
      borderRadius: 10,
      borderWidth: 2,
      height: 20,
      width: 20,
    },
    radioOn: {
      backgroundColor: T.gold,
      borderColor: T.gold,
    },
    cityFooter: {
      color: T.gold,
      fontSize: 12.5,
      padding: 12,
      textAlign: "center",
    },
    bookingTabs: {
      backgroundColor: T.card,
      borderColor: T.border,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: "row",
      marginBottom: 14,
      marginHorizontal: 12,
      padding: 3,
    },
    bookingTab: {
      borderRadius: 10,
      flex: 1,
      padding: 9,
    },
    bookingTabOn: {
      backgroundColor: T.bg3,
    },
    bookingTabText: {
      color: T.text3,
      fontSize: 13,
      fontWeight: "600",
      textAlign: "center",
    },
    bookingTabTextOn: {
      color: T.text,
      fontWeight: "800",
    },
    bookingCard: {
      backgroundColor: T.card,
      borderColor: T.border,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 10,
      marginHorizontal: 12,
      overflow: "hidden",
    },
    bookingBanner: {
      alignItems: "center",
      height: 110,
      justifyContent: "center",
    },
    bookingEmoji: {
      fontSize: 36,
    },
    bookingStatus: {
      backgroundColor: "rgba(39,174,96,0.18)",
      borderColor: "rgba(39,174,96,0.35)",
      borderRadius: 20,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 4,
      position: "absolute",
      right: 12,
      top: 10,
    },
    bookingBody: {
      padding: 14,
    },
    bookingTitle: {
      color: T.text,
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 5,
    },
    bookingMeta: {
      color: T.text3,
      fontSize: 12.5,
      lineHeight: 18,
    },
    bookingVenue: {
      color: T.text3,
      fontSize: 12,
      marginTop: 4,
    },
    bookingPrice: {
      color: T.gold,
      fontSize: 14,
      fontWeight: "900",
      marginTop: 6,
    },
    savedIntro: {
      color: T.text3,
      fontSize: 13,
      marginBottom: 10,
      marginHorizontal: 12,
    },
    venueCard: {
      alignItems: "stretch",
      backgroundColor: T.card,
      borderColor: T.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      marginBottom: 10,
      marginHorizontal: 12,
      overflow: "hidden",
    },
    venueThumb: {
      alignItems: "center",
      justifyContent: "center",
      width: 96,
    },
    venueEmoji: {
      fontSize: 30,
    },
    venueBody: {
      flex: 1,
      padding: 13,
    },
    venueName: {
      color: T.text,
      fontSize: 14.5,
      fontWeight: "800",
      lineHeight: 19,
      marginBottom: 3,
    },
    venueMeta: {
      color: T.text3,
      fontSize: 12,
      marginBottom: 5,
    },
    venuePrice: {
      color: T.gold,
      fontSize: 13,
      fontWeight: "900",
    },
    venueTags: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
      marginTop: 6,
    },
    venueTag: {
      backgroundColor: "rgba(201,151,90,0.08)",
      borderColor: T.border2,
      borderRadius: 20,
      borderWidth: 1,
      color: T.text3,
      fontSize: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    venueHeart: {
      alignItems: "center",
      justifyContent: "center",
      padding: 14,
    },
    heartText: {
      color: T.red,
      fontSize: 22,
    },
    supportCard: {
      alignItems: "center",
      backgroundColor: T.card,
      borderColor: T.border,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: "row",
      gap: 14,
      marginBottom: 8,
      marginHorizontal: 12,
      padding: 16,
    },
    supportIcon: {
      alignItems: "center",
      backgroundColor: T.blueBg,
      borderColor: "rgba(30,95,168,0.20)",
      borderRadius: 14,
      borderWidth: 1,
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    supportIconText: {
      fontSize: 22,
    },
    supportTitle: {
      color: T.text,
      fontSize: 15,
      fontWeight: "800",
    },
    supportSub: {
      color: T.text3,
      fontSize: 12.5,
      marginTop: 3,
    },
    supportMeta: {
      color: T.green,
      fontSize: 11.5,
      fontWeight: "700",
      marginTop: 5,
    },
    contactForm: {
      backgroundColor: T.card,
      borderColor: T.border,
      borderRadius: 16,
      borderWidth: 1,
      margin: 12,
      padding: 18,
    },
    contactTitle: {
      color: T.text,
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 14,
    },
    contactInput: {
      backgroundColor: T.bg3,
      borderColor: T.border2,
      borderRadius: 11,
      borderWidth: 1.5,
      color: T.text,
      fontSize: 14,
      marginBottom: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    contactArea: {
      minHeight: 84,
      textAlignVertical: "top",
    },
    faqCard: {
      backgroundColor: T.card,
      borderColor: T.border,
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: 8,
      marginHorizontal: 12,
      overflow: "hidden",
    },
    faqQuestion: {
      alignItems: "center",
      flexDirection: "row",
      gap: 10,
      justifyContent: "space-between",
      padding: 16,
    },
    faqQuestionText: {
      color: T.text,
      flex: 1,
      fontSize: 14,
      fontWeight: "700",
    },
    faqAnswer: {
      borderTopColor: T.border,
      borderTopWidth: 1,
      color: T.text2,
      fontSize: 13.5,
      lineHeight: 22,
      padding: 16,
      paddingTop: 13,
    },
    legal: {
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
    legalTitle: {
      color: T.text,
      fontFamily: Platform.select({ web: "Cormorant Garamond, serif", default: undefined }),
      fontSize: 28,
      marginBottom: 6,
    },
    legalDate: {
      color: T.text3,
      fontSize: 12,
      marginBottom: 18,
    },
    legalBlock: {
      marginBottom: 18,
    },
    legalHeading: {
      color: T.text,
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 6,
    },
    legalBody: {
      color: T.text2,
      fontSize: 14,
      lineHeight: 24,
    },
    toast: {
      alignSelf: "center",
      backgroundColor: "rgba(26,14,6,0.96)",
      borderColor: T.border2,
      borderRadius: 13,
      borderWidth: 1,
      bottom: 98,
      maxWidth: "92%",
      paddingHorizontal: 22,
      paddingVertical: 12,
      position: "absolute",
      pointerEvents: "none",
      zIndex: 999,
    },
    toastText: {
      color: T.text,
      fontSize: 13.5,
      fontWeight: "700",
      textAlign: "center",
    },
    overlay: {
      backgroundColor: "rgba(0,0,0,0.65)",
      flex: 1,
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: T.bg3,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingBottom: 28,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    sheetHandle: {
      alignSelf: "center",
      backgroundColor: T.border2,
      borderRadius: 2,
      height: 4,
      marginBottom: 18,
      width: 38,
    },
    sheetTitle: {
      color: T.text,
      fontSize: 17,
      fontWeight: "900",
      marginBottom: 8,
      textAlign: "center",
    },
    sheetSub: {
      color: T.text3,
      fontSize: 13.5,
      lineHeight: 20,
      marginBottom: 22,
      textAlign: "center",
    },
    sheetPrimary: {
      alignItems: "center",
      backgroundColor: T.red,
      borderRadius: 14,
      marginBottom: 9,
      padding: 15,
    },
    sheetPrimaryText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "900",
    },
    sheetSecondary: {
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.06)",
      borderColor: T.border2,
      borderRadius: 14,
      borderWidth: 1.5,
      padding: 15,
    },
    sheetSecondaryText: {
      color: T.text2,
      fontSize: 15,
      fontWeight: "700",
    },
    payChoiceGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 16,
    },
    payChoice: {
      alignItems: "center",
      backgroundColor: T.bg4,
      borderColor: T.border2,
      borderRadius: 14,
      borderWidth: 1.5,
      flexBasis: "48%",
      flexGrow: 1,
      padding: 16,
    },
    payChoiceIcon: {
      fontSize: 26,
      marginBottom: 6,
    },
    payChoiceTitle: {
      color: T.text,
      fontSize: 13.5,
      fontWeight: "900",
    },
    payChoiceSub: {
      color: T.text3,
      fontSize: 11,
      marginTop: 3,
      textAlign: "center",
    },
  });
}
