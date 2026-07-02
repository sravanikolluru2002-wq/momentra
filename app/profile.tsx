import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import {
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
import { supabase } from "@/lib/supabase";

type ScreenId =
  | "main"
  | "edit"
  | "addresses"
  | "payments"
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

type CustomerProfile = {
  city: string | null;
  created_at: string | null;
  firebase_uid: string | null;
  full_name: string | null;
  id: string;
  phone_number: string | null;
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
  const [activeScreen, setActiveScreen] = useState<ScreenId>("main");
  const [city, setCity] = useState("Vizag");
  const [cityQuery, setCityQuery] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [bookingTab, setBookingTab] = useState("Upcoming");
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
  const displayName = profile?.full_name?.trim() || user?.displayName || "Momentra Customer";
  const profileCity = profile?.city?.trim() || city;
  const memberSince = formatMemberSince(profile?.created_at);
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

  function showToast(message: string) {
    setToastMessage(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(""), 2400);
  }

  function openScreen(screen: ScreenId) {
    if (screen === "edit") {
      setEditFullName(displayName);
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

  async function loadCustomerProfile(firebaseUser: User) {
    setProfileLoading(true);

    try {
      const columns = "id,firebase_uid,phone_number,full_name,city,created_at";
      const byFirebase = await supabase
        .from("users")
        .select(columns)
        .eq("firebase_uid", firebaseUser.uid)
        .limit(1);

      if (byFirebase.error) {
        console.error("[Momentra profile] firebase_uid profile lookup failed", {
          details: byFirebase.error.details,
          message: byFirebase.error.message,
        });
        throw byFirebase.error;
      }

      let row = (byFirebase.data?.[0] ?? null) as CustomerProfile | null;
      const phone = firebaseUser.phoneNumber ?? "";

      if (!row && phone) {
        const byPhone = await supabase
          .from("users")
          .select(columns)
          .eq("phone_number", phone)
          .limit(1);

        if (byPhone.error) {
          console.error("[Momentra profile] phone_number profile lookup failed", {
            details: byPhone.error.details,
            message: byPhone.error.message,
          });
          throw byPhone.error;
        }

        row = (byPhone.data?.[0] ?? null) as CustomerProfile | null;
      }

      setProfile(row);
      setCity(row?.city?.trim() || "Vizag");
      setEditFullName(row?.full_name?.trim() || firebaseUser.displayName || "");
      setEditCity(row?.city?.trim() || "Vizag");
      setEditPhone(row?.phone_number || phone);
    } catch (error) {
      console.error("[Momentra profile] Could not load Supabase profile", error);
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
      const now = new Date().toISOString();
      const updatePayload = {
        city: cleanCity || null,
        firebase_uid: user.uid,
        full_name: cleanName,
        phone_number: cleanPhone,
        last_login: now,
      };

      const write = profile?.id
        ? await supabase
            .from("users")
            .update(updatePayload)
            .eq("id", profile.id)
            .select("id,firebase_uid,phone_number,full_name,city,created_at")
            .single()
        : await supabase
            .from("users")
            .insert({ ...updatePayload, created_at: now })
            .select("id,firebase_uid,phone_number,full_name,city,created_at")
            .single();

      if (write.error) {
        console.error("[Momentra profile] user profile save failed", {
          details: write.error.details,
          message: write.error.message,
        });
        throw write.error;
      }

      const nextProfile = write.data as CustomerProfile;
      setProfile(nextProfile);
      setCity(nextProfile.city?.trim() || "Vizag");
      setEditFullName(nextProfile.full_name?.trim() || cleanName);
      setEditCity(nextProfile.city?.trim() || cleanCity);
      setEditPhone(nextProfile.phone_number || cleanPhone);
      closeScreen();
      showToast("Profile saved successfully");
    } catch (error) {
      console.error("[Momentra profile] Could not save profile", error);
      showToast("We could not save your profile right now.");
    } finally {
      setSavingProfile(false);
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
              <Text style={styles.avatarText}>{initials}</Text>
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
            <Stat label="Status" value="New" small onPress={() => showToast("Your Momentra profile is active")} styles={styles} />
            <Stat label="Session" value="● Live" small green onPress={() => showToast("You are signed in")} styles={styles} />
          </View>

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
        <Pressable onPress={() => showToast("Photo upload coming soon")} style={({ pressed }) => [styles.editAvatar, pressed && styles.pressed]}>
          <Text style={styles.editAvatarText}>{initials}</Text>
          <View style={styles.editCamera}>
            <Text style={styles.avatarEditText}>⌁</Text>
          </View>
        </Pressable>
        <Text style={styles.tapPhoto}>Tap to change photo</Text>
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
      paddingBottom: 148,
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
      marginBottom: 26,
      marginTop: 8,
      textAlign: "center",
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
