import { useRouter } from "expo-router";
import {
  Building2,
  CakeSlice,
  Coffee,
  Dice5,
  Gift,
  Heart,
  HeartHandshake,
  House,
  Landmark,
  MapPin,
  Martini,
  PartyPopper,
  Search,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { useMomentraTheme } from "@/contexts/momentra-theme";
import { EXPERIENCES as CATALOG_EXPERIENCES } from "@/constants/experiences";
import { LuxuryBottomNav } from "@/components/luxury-bottom-nav";
import { supabase } from "@/lib/supabase";

const { width, height } = Dimensions.get("window");

const DARK = {
  bg: "#0D0905",
  surf: "#1A0E08",
  border: "rgba(201,151,90,0.18)",
  border2: "rgba(201,151,90,0.35)",
  text: "#F2E8D9",
  text2: "rgba(242,232,217,0.50)",
  text3: "rgba(242,232,217,0.26)",
  gold: "#C9975A",
  red: "#C0392B",
  inputBg: "rgba(255,255,255,0.055)",
  chipBg: "#1C0E08",
  cardBg: "#1A0E08",
  navBg: "rgba(15,8,4,0.97)",
  sheetBg: "#160C06",
};

const LIGHT = {
  bg: "#FFF8F2",
  surf: "#FFF0E6",
  border: "rgba(180,120,60,0.18)",
  border2: "rgba(180,120,60,0.38)",
  text: "#1E0A04",
  text2: "rgba(30,10,4,0.50)",
  text3: "rgba(30,10,4,0.30)",
  gold: "#8B5A1A",
  red: "#C0392B",
  inputBg: "rgba(0,0,0,0.04)",
  chipBg: "#FFF0E6",
  cardBg: "#FFF0E6",
  navBg: "rgba(255,245,235,0.97)",
  sheetBg: "#FFF0E6",
};

const CITIES = [
  { name: "Vizag", sub: "Visakhapatnam, AP" },
  { name: "Vijayawada", sub: "Krishna, AP" },
  { name: "Hyderabad", sub: "Telangana" },
  { name: "Bangalore", sub: "Karnataka" },
  { name: "Mumbai", sub: "Maharashtra" },
  { name: "Chennai", sub: "Tamil Nadu" },
  { name: "Delhi", sub: "NCR Region" },
  { name: "Pune", sub: "Maharashtra" },
];

const CATEGORIES = [
  { id: "all", icon: null, label: "All" },
  { id: "birthday", icon: "🎂", label: "Birthday" },
  { id: "datenight", icon: "❤️", label: "Date Night" },
  { id: "kitty", icon: "👯", label: "Kitty" },
  { id: "house-party", icon: "🏠", label: "House Party" },
  { id: "party", icon: "🎉", label: "Party" },
  { id: "corporate", icon: "💼", label: "Corporate" },
  { id: "banquet", icon: "🏛️", label: "Banquet Hall" },
  { id: "cafe", icon: "☕", label: "Cafe" },
  { id: "cocktail-party", icon: "BAR", label: "Cocktail Party" },
  { id: "bridal-shower", icon: "B2B", label: "Bride-to-Be" },
  { id: "bachelorette", icon: "BACH", label: "Bachelorette" },
  { id: "anniversary", icon: "ANN", label: "Anniversary" },
  { id: "board-games", icon: "GAME", label: "Board Games Night" },
  { id: "picnic", icon: "DAY", label: "Picnic / Day Outing" },
];

type ExploreExperience = {
  id: number;
  detailId: string;
  cat: string;
  title: string;
  venue: string;
  desc: string;
  price: number;
  ppl: number;
  rating: number;
  tag: "bestseller" | "new" | "trending" | "";
  img: string;
};

const EXPERIENCES: ExploreExperience[] = [
  {
    id: 1,
    detailId: "candlelight-dining",
    cat: "datenight",
    title: "Intimate Candlelight Dining",
    venue: "Sagar Nagar • Vizag",
    desc: "Elegant candlelight dining with floral table styling, warm ambient lighting, soft music, and a romantic private-style setup.",
    price: 2000,
    ppl: 11,
    rating: 4.8,
    tag: "new",
    img: "/venues/venue-1/cover.jpg",
  },
  {
    id: 2,
    detailId: "birthday-at-home",
    cat: "house-party",
    title: "Birthday at Home Setup",
    venue: "At your home • Vizag",
    desc: "Home decor setup, cake table styling, food coordination, music add-ons, and cleanup support for private celebrations.",
    price: 4999,
    ppl: 12,
    rating: 4.8,
    tag: "new",
    img: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&q=80",
  },
  {
    id: 3,
    detailId: "private-dinner-at-home",
    cat: "house-party",
    title: "Private Dinner at Home",
    venue: "At your home • Vizag",
    desc: "Styled private dinner at home with table design, food coordination, warm lighting, and optional host support.",
    price: 6999,
    ppl: 8,
    rating: 4.7,
    tag: "",
    img: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500&q=80",
  },
  {
    id: 4,
    detailId: "signature-cocktail-party",
    cat: "cocktail-party",
    title: "Signature Cocktail Party",
    venue: "Partner Lounge, Vizag",
    desc: "Decor, buffet, bar setup, music, dance floor, and host or live band add-ons coordinated by Momentra.",
    price: 11999,
    ppl: 18,
    rating: 4.8,
    tag: "new",
    img: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=500&q=80",
  },
  {
    id: 5,
    detailId: "bridal-shower-theme",
    cat: "bridal-shower",
    title: "Bride-to-Be Theme Shower",
    venue: "Momentra venue or home setup, Vizag",
    desc: "Theme decor, backdrop, music, games, food, welcome drinks, props, cake, and photographer options.",
    price: 9999,
    ppl: 14,
    rating: 4.9,
    tag: "new",
    img: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=500&q=80",
  },
  {
    id: 6,
    detailId: "bachelorette-night",
    cat: "bachelorette",
    title: "Bachelorette Party Night",
    venue: "Private lounge or villa, Vizag",
    desc: "Theme decor, food and drinks, music, games, dance floor, DJ, host, and photography options.",
    price: 14999,
    ppl: 16,
    rating: 4.8,
    tag: "",
    img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&q=80",
  },
  {
    id: 7,
    detailId: "anniversary-dinner-setup",
    cat: "anniversary",
    title: "Anniversary Dinner Setup",
    venue: "Private dining or home setup, Vizag",
    desc: "Food, decor, music, cake table styling, custom theme, photographer, and optional projector support.",
    price: 6999,
    ppl: 6,
    rating: 4.9,
    tag: "bestseller",
    img: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=500&q=80",
  },
  {
    id: 8,
    detailId: "board-games-night",
    cat: "board-games",
    title: "Hosted Board Games Night",
    venue: "At your home or cafe venue, Vizag",
    desc: "Board games kit, snacks, beverages, music, and optional game coordinator or food package.",
    price: 3999,
    ppl: 10,
    rating: 4.7,
    tag: "",
    img: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=500&q=80",
  },
  {
    id: 9,
    detailId: "guided-day-picnic",
    cat: "picnic",
    title: "Guided Picnic & Day Outing",
    venue: "Vizag outskirts, Araku, or resort destination",
    desc: "Destination, guide, food, fun activities, board games, bonfire, and optional transport or overnight stay.",
    price: 8999,
    ppl: 12,
    rating: 4.8,
    tag: "trending",
    img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=500&q=80",
  },
];

const CATALOG_EXPLORE_EXPERIENCES: ExploreExperience[] = CATALOG_EXPERIENCES.map((experience, index) => ({
  cat: normalizeCategory(experience.occasionId || experience.category),
  desc: experience.description || experience.inclusions.slice(0, 3).join(", "),
  detailId: experience.id,
  id: index + 1,
  img: experience.image,
  ppl: experience.minimumGuests ?? experience.capacity,
  price: experience.price,
  rating: experience.rating,
  tag: normalizeTag(experience.badge),
  title: experience.title,
  venue: experience.venue,
}));

const DEFAULT_EXPERIENCES = Array.from(
  new Map([...CATALOG_EXPLORE_EXPERIENCES, ...EXPERIENCES].map((experience) => [experience.detailId, experience])).values()
).map((experience, index) => ({ ...experience, id: index + 1 }));

const SORT_OPTIONS = ["Popularity", "Price: Low to High", "Price: High to Low", "Rating"];
const RATING_OPTIONS = ["Any", "4.0+", "4.5+", "4.8+"];
const KITTY_PARTY_IMAGE = require("../assets/kitty-party.png");

type SupabaseExploreRow = {
  badge?: string | null;
  capacity?: number | string | null;
  category?: string | null;
  desc?: string | null;
  description?: string | null;
  id?: number | string | null;
  image?: string | null;
  image_url?: string | null;
  occasionId?: string | null;
  occasion_id?: string | null;
  people?: number | string | null;
  ppl?: number | string | null;
  price?: number | string | null;
  rating?: number | string | null;
  tag?: string | null;
  title?: string | null;
  venue?: string | null;
};

function mapSupabaseExploreExperience(row: SupabaseExploreRow, index: number): ExploreExperience {
  const fallback = DEFAULT_EXPERIENCES[index % DEFAULT_EXPERIENCES.length];

  return {
    cat: normalizeCategory(row.occasion_id ?? row.occasionId ?? row.category ?? fallback.cat),
    desc: row.description || row.desc || fallback.desc,
    detailId: String(row.id ?? fallback.detailId),
    id: index + 1000,
    img: row.image_url || row.image || fallback.img,
    ppl: toNumber(row.ppl ?? row.people ?? row.capacity, fallback.ppl),
    price: toNumber(row.price, fallback.price),
    rating: toNumber(row.rating, fallback.rating),
    tag: normalizeTag(row.tag ?? row.badge ?? fallback.tag),
    title: row.title || fallback.title,
    venue: row.venue || fallback.venue,
  };
}

function normalizeCategory(value?: string | null) {
  const key = value?.toLowerCase().replace(/[\s_-]/g, "");
  if (key === "date" || key === "datenight" || key === "romantic") return "datenight";
  if (key === "kittyparty") return "kitty";
  if (key === "houseparty" || key === "homeparty") return "house-party";
  if (key === "cocktailparty") return "cocktail-party";
  if (key === "bridetobe" || key === "bridalshower") return "bridal-shower";
  if (key === "boardgames" || key === "boardgamesnight") return "board-games";
  if (key === "dayouting" || key === "picnicdayouting") return "picnic";
  if (key === "banquethall") return "banquet";
  return CATEGORIES.some((item) => item.id === value) ? value ?? "all" : "all";
}

function normalizeTag(value?: string | null): ExploreExperience["tag"] {
  const key = value?.toLowerCase().replace(/[\s_-]/g, "");
  if (key === "bestseller" || key === "best") return "bestseller";
  if (key === "new") return "new";
  if (key === "trending") return "trending";
  return "";
}

function toNumber(value: number | string | null | undefined, fallback: number) {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(parsed) ? Number(parsed) : fallback;
}

function mergeExploreExperiences(primary: ExploreExperience[], fallback: ExploreExperience[]) {
  return Array.from(
    new Map([...primary, ...fallback].map((experience) => [experience.detailId, experience])).values()
  ).map((experience, index) => ({ ...experience, id: index + 1 }));
}

export default function ExploreScreen() {
  const router = useRouter();
  const { isDark } = useMomentraTheme();
  const { width: viewportWidth } = useWindowDimensions();
  const T = isDark ? DARK : LIGHT;
  const compactGrid = viewportWidth < 430;
  const [experiences, setExperiences] = useState<ExploreExperience[]>(DEFAULT_EXPERIENCES);
  const [activeCity, setActiveCity] = useState("Vizag");
  const [activeCat, setActiveCat] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [loved, setLoved] = useState<Set<number>>(new Set());
  const [cityDropOpen, setCityDropOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [minPrice, setMinPrice] = useState("1000");
  const [maxPrice, setMaxPrice] = useState("20000");
  const [selRating, setSelRating] = useState("Any");
  const [selOccs, setSelOccs] = useState<Set<string>>(new Set());
  const [selSort, setSelSort] = useState("Popularity");
  const [filterCount, setFilterCount] = useState(0);
  const sheetY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    let mounted = true;

    async function fetchApprovedExperiences() {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("status", "approved");

      if (error) {
        console.error("EXPERIENCE FETCH ERROR:", JSON.stringify(error, null, 2));
        return;
      }

      const mapped = (data ?? []).map(mapSupabaseExploreExperience);
      if (mounted && mapped.length > 0) {
        setExperiences(mergeExploreExperiences(mapped, DEFAULT_EXPERIENCES));
      }
    }

    fetchApprovedExperiences();

    return () => {
      mounted = false;
    };
  }, []);

  function openFilterSheet() {
    setFilterOpen(true);
    Animated.spring(sheetY, {
      friction: 11,
      tension: 65,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }

  function closeFilterSheet() {
    Animated.timing(sheetY, {
      duration: 320,
      toValue: height,
      useNativeDriver: true,
    }).start(() => setFilterOpen(false));
  }

  function applyFilters() {
    let count = 0;
    if (Number.parseInt(minPrice, 10) > 1000 || Number.parseInt(maxPrice, 10) < 20000) count += 1;
    if (selRating !== "Any") count += 1;
    if (selOccs.size > 0) count += 1;
    if (selSort !== "Popularity") count += 1;
    setFilterCount(count);
    closeFilterSheet();
  }

  function resetFilters() {
    setMinPrice("1000");
    setMaxPrice("20000");
    setSelRating("Any");
    setSelOccs(new Set());
    setSelSort("Popularity");
    setFilterCount(0);
  }

  function toggleLove(id: number) {
    setLoved((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleOcc(label: string) {
    setSelOccs((previous) => {
      const next = new Set(previous);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  const filteredExps = useMemo(() => {
    const min = Number.parseInt(minPrice, 10) || 0;
    const max = Number.parseInt(maxPrice, 10) || Number.MAX_SAFE_INTEGER;
    const minRating = selRating === "Any" ? 0 : Number.parseFloat(selRating);

    const filtered = experiences.filter((experience) => {
      const matchCat = activeCat === "all" || experience.cat === activeCat;
      const matchSearch =
        !searchText ||
        experience.title.toLowerCase().includes(searchText.toLowerCase()) ||
        experience.venue.toLowerCase().includes(searchText.toLowerCase());
      const matchPrice = experience.price >= min && experience.price <= max;
      const matchRating = experience.rating >= minRating;
      const matchOccasion =
        selOccs.size === 0 ||
        [...selOccs].some((label) => {
          const category = CATEGORIES.find((item) => item.label === label);
          return category?.id === experience.cat;
        });
      return matchCat && matchSearch && matchPrice && matchRating && matchOccasion;
    });

    if (selSort === "Price: Low to High") return [...filtered].sort((a, b) => a.price - b.price);
    if (selSort === "Price: High to Low") return [...filtered].sort((a, b) => b.price - a.price);
    if (selSort === "Rating") return [...filtered].sort((a, b) => b.rating - a.rating);
    return filtered;
  }, [activeCat, experiences, maxPrice, minPrice, searchText, selOccs, selRating, selSort]);

  function tagStyle(tag: ExploreExperience["tag"]) {
    if (tag === "bestseller") return { bg: "rgba(192,57,43,0.16)", color: T.red, border: "rgba(192,57,43,0.25)" };
    if (tag === "new") return { bg: "rgba(201,151,90,0.14)", color: T.gold, border: "rgba(201,151,90,0.22)" };
    if (tag === "trending") return { bg: "rgba(39,174,96,0.14)", color: "#1a9055", border: "rgba(39,174,96,0.2)" };
    return null;
  }

  function tagLabel(tag: ExploreExperience["tag"]) {
    if (tag === "bestseller") return "🔥 Best Seller";
    if (tag === "new") return "✦ New";
    if (tag === "trending") return "↑ Trending";
    return "";
  }

  function renderCard({ item }: { item: ExploreExperience }) {
    const tag = tagStyle(item.tag);
    const isLoved = loved.has(item.id);

    return (
      <Pressable
        onPress={() => {
          if (item.cat === "kitty" || item.detailId === "kitty-brunch") {
            router.push("/kitty" as never);
            return;
          }
          if (item.cat === "corporate" || item.detailId === "corporate-dinner") {
            router.push("/corporate" as never);
            return;
          }

          router.push({
            pathname: "/experience-detail",
            params: { experienceId: item.detailId },
          } as never);
        }}
        style={[s.card, { backgroundColor: T.cardBg, borderColor: T.border }]}
      >
        <View style={s.cardImgCol}>
          <Image
            source={item.detailId === "kitty-brunch" ? KITTY_PARTY_IMAGE : { uri: item.img }}
            style={s.cardImg}
            resizeMode="cover"
          />
          <View style={s.ratingBadge}>
            <Text style={s.ratingStar}>★</Text>
            <Text style={s.ratingVal}>{item.rating}</Text>
          </View>
        </View>

        <View style={s.cardBody}>
          {tag && (
            <View style={[s.tag, { backgroundColor: tag.bg, borderColor: tag.border }]}>
              <Text style={[s.tagTxt, { color: tag.color }]}>{tagLabel(item.tag)}</Text>
            </View>
          )}
          <Text style={[s.cardTitle, { color: T.text }]} numberOfLines={1}>{item.title}</Text>
          <View style={s.venueLine}>
            <MapPin color={T.text2} size={12} strokeWidth={2} />
            <Text style={[s.venueTxt, { color: T.text2 }]} numberOfLines={1}>{item.venue}</Text>
          </View>
          <View style={s.cardBot}>
            <View>
              <Text style={[s.price, { color: T.gold }]}>₹{item.price.toLocaleString("en-IN")}</Text>
              <Text style={[s.ppl, { color: T.text3 }]}>/ {item.ppl} {item.ppl === 1 ? "Person" : "People"}</Text>
            </View>
            <Pressable
              onPress={() => toggleLove(item.id)}
              style={[
                s.heartBtn,
                {
                  backgroundColor: isLoved ? "rgba(192,57,43,0.14)" : "transparent",
                  borderColor: isLoved ? T.red : T.border2,
                },
              ]}
            >
              <Heart color={isLoved ? T.red : T.text2} fill={isLoved ? T.red : "transparent"} size={15} strokeWidth={2.1} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  }

  function renderCompactCard({ item }: { item: ExploreExperience }) {
    const tag = tagStyle(item.tag);
    const isLoved = loved.has(item.id);

    return (
      <Pressable
        onPress={() => {
          if (item.cat === "kitty" || item.detailId === "kitty-brunch") {
            router.push("/kitty" as never);
            return;
          }
          if (item.cat === "corporate" || item.detailId === "corporate-dinner") {
            router.push("/corporate" as never);
            return;
          }

          router.push({
            pathname: "/experience-detail",
            params: { experienceId: item.detailId },
          } as never);
        }}
        style={[s.allCard, { backgroundColor: T.cardBg, borderColor: T.border }]}
      >
        <View style={s.allCardImageWrap}>
          <Image
            source={item.detailId === "kitty-brunch" ? KITTY_PARTY_IMAGE : { uri: item.img }}
            style={s.allCardImage}
            resizeMode="cover"
          />
          <View style={s.ratingBadge}>
            <Text style={s.ratingStar}>★</Text>
            <Text style={s.ratingVal}>{item.rating}</Text>
          </View>
          <Pressable
            onPress={() => toggleLove(item.id)}
            style={[
              s.allHeartBtn,
              {
                backgroundColor: isLoved ? "rgba(192,57,43,0.86)" : "rgba(13,9,5,0.62)",
                borderColor: isLoved ? T.red : "rgba(255,255,255,0.22)",
              },
            ]}
          >
            <Heart color="#fff" fill={isLoved ? "#fff" : "transparent"} size={14} strokeWidth={2.1} />
          </Pressable>
        </View>

        <View style={s.allCardBody}>
          {tag && (
            <View style={[s.allTag, { backgroundColor: tag.bg, borderColor: tag.border }]}>
              <Text style={[s.allTagTxt, { color: tag.color }]}>{tagLabel(item.tag)}</Text>
            </View>
          )}
          <Text style={[s.allCardTitle, { color: T.text }]} numberOfLines={1}>{item.title}</Text>
          <View style={s.venueLine}>
            <MapPin color={T.text2} size={12} strokeWidth={2} />
            <Text style={[s.allVenueTxt, { color: T.text2 }]} numberOfLines={1}>{item.venue}</Text>
          </View>
          <Text style={[s.allPrice, { color: T.gold }]}>₹{item.price.toLocaleString("en-IN")}</Text>
        </View>
      </Pressable>
    );
  }

  function SlidersIcon() {
    return (
      <View style={s.slidersIcon}>
        <View style={s.sliderTrack}>
          <View style={[s.sliderKnob, s.sliderKnobLeft]} />
        </View>
        <View style={s.sliderTrack}>
          <View style={[s.sliderKnob, s.sliderKnobRight]} />
        </View>
        <View style={s.sliderTrack}>
          <View style={[s.sliderKnob, s.sliderKnobMid]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={s.header}>
        <View>
          <Text style={[s.headerTitle, { color: T.text }]}>Explore</Text>
          <Text style={[s.headerSub, { color: T.text2 }]}>Discover perfect celebrations</Text>
        </View>
        <View style={s.headerRight}>
          <Pressable onPress={() => setCityDropOpen(true)} style={[s.cityBtn, { backgroundColor: T.chipBg, borderColor: T.border2 }]}>
            <View style={[s.cityDot, { backgroundColor: T.red }]} />
            <Text style={[s.cityName, { color: T.text }]}>{activeCity}</Text>
            <Text style={{ color: T.text2, fontSize: 9 }}>▾</Text>
          </Pressable>
          <Pressable onPress={openFilterSheet} style={s.filterBtn}>
            <SlidersIcon />
            {filterCount > 0 && (
              <View style={[s.filterBadge, { backgroundColor: T.gold }]}>
                <Text style={s.filterBadgeTxt}>{filterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <View style={[s.searchBar, { backgroundColor: T.inputBg, borderColor: T.border }]}>
        <Search color={T.text3} size={17} strokeWidth={2.1} />
        <TextInput
          onChangeText={setSearchText}
          placeholder="Search venues, occasions..."
          placeholderTextColor={T.text3}
          style={[s.searchInput, { color: T.text }]}
          value={searchText}
        />
      </View>

      <View style={s.catsSection}>
        <Text style={[s.catsLabel, { color: T.text3 }]}>BROWSE COLLECTIONS</Text>
        <ScrollView directionalLockEnabled horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((category) => {
            const isActive = activeCat === category.id;
            const CategoryIcon = getCategoryIcon(category.id);
            return (
              <Pressable
                key={category.id}
                onPress={() => setActiveCat(category.id)}
                style={[
                  s.catChip,
                  { backgroundColor: isActive ? T.red : T.chipBg, borderColor: isActive ? T.red : T.border },
                ]}
              >
                <CategoryIcon color={isActive ? "#fff" : T.gold} size={15} strokeWidth={2.15} />
                <Text style={[s.catLabel, { color: isActive ? "#fff" : T.text2, fontWeight: isActive ? "600" : "400" }]}>
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={s.secHeader}>
        <Text style={[s.secTitle, { color: T.text }]}>
          ✦ {activeCat === "all" ? "Popular Experiences" : `${CATEGORIES.find((item) => item.id === activeCat)?.label} Experiences`}
          <Text style={{ color: T.text3, fontSize: 12, fontWeight: "400" }}> ({filteredExps.length})</Text>
        </Text>
        <Text style={[s.seeAll, { color: T.red }]}>See all ›</Text>
      </View>

      <FlatList
        columnWrapperStyle={activeCat === "all" && !compactGrid ? s.allGridRow : undefined}
        contentContainerStyle={[s.cardsList, activeCat === "all" && s.allGridList]}
        data={filteredExps}
        key={activeCat === "all" && !compactGrid ? "all-grid" : "category-list"}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Search color={T.text3} size={36} strokeWidth={1.8} />
            <Text style={{ color: T.text2, fontSize: 13 }}>No experiences found</Text>
            <Text style={{ color: T.text3, fontSize: 11, marginTop: 6 }}>Try a different category or city</Text>
          </View>
        }
        numColumns={activeCat === "all" && !compactGrid ? 2 : 1}
        renderItem={activeCat === "all" && !compactGrid ? renderCompactCard : renderCard}
        showsVerticalScrollIndicator={false}
        style={s.resultsList}
      />

      <LuxuryBottomNav active="Explore" />

      <Modal visible={cityDropOpen} transparent animationType="fade" onRequestClose={() => setCityDropOpen(false)}>
        <Pressable onPress={() => setCityDropOpen(false)} style={s.modalOverlay}>
          <Pressable style={[s.cityDropPanel, { backgroundColor: T.sheetBg, borderColor: T.border2 }]}>
            <Text style={[s.dropHeader, { borderBottomColor: T.border, color: T.gold }]}>Select City</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {CITIES.map((city) => (
                <Pressable
                  key={city.name}
                  onPress={() => {
                    setActiveCity(city.name);
                    setCityDropOpen(false);
                  }}
                  style={[s.dropItem, { backgroundColor: activeCity === city.name ? "rgba(192,57,43,0.09)" : "transparent", borderBottomColor: T.border }]}
                >
                  <View style={s.dropItemLeft}>
                    <View style={[s.dropDot, { backgroundColor: activeCity === city.name ? T.red : T.text3 }]} />
                    <View>
                      <Text style={[s.dropCityName, { color: T.text }]}>{city.name}</Text>
                      <Text style={[s.dropCitySub, { color: T.text3 }]}>{city.sub}</Text>
                    </View>
                  </View>
                  {activeCity === city.name && <Text style={{ color: T.red, fontSize: 13 }}>✓</Text>}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {filterOpen && (
        <Modal visible transparent animationType="none" onRequestClose={closeFilterSheet}>
          <View style={s.sheetOverlay}>
            <Pressable onPress={closeFilterSheet} style={StyleSheet.absoluteFill} />
            <Animated.View style={[s.filterSheet, { backgroundColor: T.sheetBg, borderColor: T.border2, transform: [{ translateY: sheetY }] }]}>
              <View style={[s.sheetHandle, { backgroundColor: T.border2 }]} />
              <Text style={[s.sheetTitle, { color: T.text }]}>Filter & Sort</Text>
              <Text style={[s.sheetSub, { color: T.text2 }]}>Refine your celebration search</Text>
              <ScrollView contentContainerStyle={s.sheetContent} showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                <View style={s.filterSection}>
                  <Text style={[s.filterSectionLabel, { color: T.gold }]}>PRICE RANGE (₹)</Text>
                  <View style={s.priceRow}>
                    <TextInput keyboardType="numeric" onChangeText={setMinPrice} placeholder="Min" placeholderTextColor={T.text3} style={[s.priceInput, { backgroundColor: T.inputBg, borderColor: T.border, color: T.text }]} value={minPrice} />
                    <Text style={[s.priceDash, { color: T.text3 }]}>—</Text>
                    <TextInput keyboardType="numeric" onChangeText={setMaxPrice} placeholder="Max" placeholderTextColor={T.text3} style={[s.priceInput, { backgroundColor: T.inputBg, borderColor: T.border, color: T.text }]} value={maxPrice} />
                  </View>
                </View>

                <View style={s.filterSection}>
                  <Text style={[s.filterSectionLabel, { color: T.gold }]}>MINIMUM RATING</Text>
                  <View style={s.ratingChips}>
                    {RATING_OPTIONS.map((rating) => (
                      <Pressable key={rating} onPress={() => setSelRating(rating)} style={[s.ratingChip, { backgroundColor: selRating === rating ? T.red : T.chipBg, borderColor: selRating === rating ? T.red : T.border }]}>
                        <Text style={{ color: selRating === rating ? "#fff" : T.text2, fontSize: 12, fontWeight: selRating === rating ? "600" : "400" }}>{rating === "Any" ? rating : `★ ${rating}`}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={s.filterSection}>
                  <Text style={[s.filterSectionLabel, { color: T.gold }]}>OCCASION</Text>
                  <View style={s.occChips}>
                    {CATEGORIES.filter((category) => category.id !== "all").map((category) => {
                      const selected = selOccs.has(category.label);
                      const FilterCategoryIcon = getCategoryIcon(category.id);
                      return (
                        <Pressable key={category.id} onPress={() => toggleOcc(category.label)} style={[s.occChip, { backgroundColor: selected ? "rgba(192,57,43,0.12)" : T.chipBg, borderColor: selected ? T.red : T.border }]}>
                          <FilterCategoryIcon color={selected ? T.red : T.gold} size={13} strokeWidth={2.1} />
                          <Text style={{ color: selected ? T.red : T.text2, fontSize: 11, fontWeight: selected ? "600" : "400" }}>{category.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={s.filterSection}>
                  <Text style={[s.filterSectionLabel, { color: T.gold }]}>SORT BY</Text>
                  {SORT_OPTIONS.map((option) => {
                    const selected = selSort === option;
                    return (
                      <Pressable key={option} onPress={() => setSelSort(option)} style={[s.sortOpt, { backgroundColor: selected ? "rgba(192,57,43,0.09)" : T.chipBg, borderColor: selected ? T.red : T.border }]}>
                        <Text style={[s.sortLabel, { color: T.text }]}>{option}</Text>
                        <View style={[s.sortRadio, { borderColor: selected ? T.red : T.border2 }]}>{selected && <View style={[s.sortDot, { backgroundColor: T.red }]} />}</View>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
              <View style={[s.sheetFooter, { borderTopColor: T.border }]}>
                <Pressable onPress={resetFilters} style={[s.btnReset, { borderColor: T.border2 }]}>
                  <Text style={[s.btnResetTxt, { color: T.text2 }]}>Reset</Text>
                </Pressable>
                <Pressable onPress={applyFilters} style={s.btnApply}>
                  <Text style={s.btnApplyTxt}>Apply Filters</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function getCategoryIcon(id: string): LucideIcon {
  const icons: Record<string, LucideIcon> = {
    anniversary: HeartHandshake,
    bachelorette: HeartHandshake,
    banquet: Landmark,
    "board-games": Dice5,
    birthday: CakeSlice,
    "bridal-shower": Gift,
    cafe: Coffee,
    "cocktail-party": Martini,
    corporate: Building2,
    datenight: Heart,
    "house-party": House,
    kitty: UsersRound,
    party: PartyPopper,
    picnic: MapPin,
  };

  return icons[id] ?? Sparkles;
}

const s = StyleSheet.create({
  root: { flex: 1, overflowY: Platform.OS === "web" ? "auto" : "visible" as never, paddingTop: Platform.OS === "ios" ? 52 : 32 },
  header: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 14, paddingHorizontal: 18 },
  headerTitle: { fontSize: 30, fontWeight: "400", lineHeight: 34 },
  headerSub: { fontSize: 11, marginTop: 2 },
  headerRight: { alignItems: "center", flexDirection: "row", gap: 8, paddingTop: 4 },
  cityBtn: { alignItems: "center", borderRadius: 22, borderWidth: 1, flexDirection: "row", gap: 6, paddingHorizontal: 13, paddingVertical: 8 },
  cityDot: { borderRadius: 4, height: 7, width: 7 },
  cityName: { fontSize: 12, fontWeight: "500" },
  filterBtn: { alignItems: "center", backgroundColor: "#C0392B", borderRadius: 13, elevation: 6, height: 40, justifyContent: "center", position: "relative", shadowColor: "#C0392B", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.36, shadowRadius: 10, width: 40 },
  slidersIcon: { gap: 4, width: 18 },
  sliderTrack: { backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 1, height: 2, position: "relative", width: 18 },
  sliderKnob: { backgroundColor: "#fff", borderRadius: 3, height: 6, position: "absolute", top: -2, width: 6 },
  sliderKnobLeft: { left: 2 },
  sliderKnobMid: { left: 7 },
  sliderKnobRight: { right: 2 },
  filterBadge: { alignItems: "center", borderRadius: 8, height: 16, justifyContent: "center", position: "absolute", right: -4, top: -4, width: 16 },
  filterBadgeTxt: { color: "#fff", fontSize: 9, fontWeight: "700" },
  searchBar: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 14, marginHorizontal: 18, paddingHorizontal: 16, paddingVertical: 12 },
  searchInput: { flex: 1, fontSize: 13, fontWeight: "300" },
  catsSection: { marginBottom: 16, paddingHorizontal: 18 },
  catsLabel: { fontSize: 9, fontWeight: "500", letterSpacing: 2, marginBottom: 10 },
  catChip: { alignItems: "center", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 7, marginRight: 8, minHeight: 36, paddingHorizontal: 13, paddingVertical: 8 },
  catDot: { borderRadius: 4, height: 7, width: 7 },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 11, textAlign: "center" },
  secHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12, paddingHorizontal: 18 },
  secTitle: { fontSize: 18, fontWeight: "400" },
  seeAll: { fontSize: 11, fontWeight: "500" },
  cardsList: { gap: 12, paddingBottom: Platform.OS === "web" ? 180 : Platform.OS === "ios" ? 152 : 136, paddingHorizontal: 18 },
  resultsList: { flexGrow: 0, flexShrink: 0 },
  allGridList: { gap: 12 },
  allGridRow: { gap: 12 },
  allCard: { borderRadius: 16, borderWidth: 1, flex: 1, maxWidth: (width - 48) / 2, minHeight: 196, overflow: "hidden" },
  allCardImageWrap: { height: 98, position: "relative" },
  allCardImage: { height: "100%", opacity: 0.84, width: "100%" },
  allHeartBtn: { alignItems: "center", borderRadius: 13, borderWidth: 1, height: 26, justifyContent: "center", position: "absolute", right: 7, top: 7, width: 26 },
  allCardBody: { flex: 1, padding: 10 },
  allTag: { alignItems: "center", alignSelf: "flex-start", borderRadius: 6, borderWidth: 1, marginBottom: 6, paddingHorizontal: 6, paddingVertical: 2 },
  allTagTxt: { fontSize: 8, fontWeight: "700", letterSpacing: 0.2 },
  allCardTitle: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  allVenueTxt: { flex: 1, fontSize: 9.5 },
  allPrice: { fontSize: 15, fontWeight: "700", marginTop: "auto" },
  card: { borderRadius: 18, borderWidth: 1, flexDirection: "row", minHeight: 136, overflow: "hidden" },
  cardImgCol: { position: "relative", width: 112 },
  cardImg: { height: "100%", opacity: 0.82, width: "100%" },
  ratingBadge: { alignItems: "center", backgroundColor: "rgba(13,9,5,0.75)", borderColor: "rgba(201,151,90,0.22)", borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 3, left: 8, paddingHorizontal: 7, paddingVertical: 3, position: "absolute", top: 8 },
  ratingStar: { color: "#C9975A", fontSize: 10 },
  ratingVal: { color: "#F2E8D9", fontSize: 10, fontWeight: "600" },
  cardBody: { flex: 1, padding: 12, paddingLeft: 11 },
  tag: { alignItems: "center", alignSelf: "flex-start", borderRadius: 6, borderWidth: 1, flexDirection: "row", marginBottom: 7, paddingHorizontal: 7, paddingVertical: 3 },
  tagTxt: { fontSize: 9, fontWeight: "600", letterSpacing: 0.3 },
  cardTitle: { fontSize: 15, fontWeight: "600", marginBottom: 5 },
  venueTxt: { flex: 1, fontSize: 10.5 },
  venueLine: { alignItems: "center", flexDirection: "row", gap: 4, marginBottom: 10 },
  cardBot: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: "auto" },
  price: { fontSize: 18, fontWeight: "500" },
  ppl: { fontSize: 9, marginTop: 1 },
  heartBtn: { alignItems: "center", borderRadius: 15, borderWidth: 1, height: 30, justifyContent: "center", width: 30 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  nav: { alignItems: "center", borderTopWidth: 1, bottom: 0, flexDirection: "row", height: 72, left: 0, position: "absolute", right: 0 },
  navItem: { alignItems: "center", flex: 1, gap: 4, justifyContent: "center", minHeight: 64 },
  navMark: { borderBottomLeftRadius: 2, borderBottomRightRadius: 2, height: 2, position: "absolute", top: 0, width: 22 },
  navIcon: { fontSize: 19 },
  navLabel: { fontSize: 9, fontWeight: "700" },
  modalOverlay: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.55)", flex: 1, justifyContent: "center" },
  cityDropPanel: { borderRadius: 18, borderWidth: 1, maxHeight: height * 0.6, overflow: "hidden", width: width * 0.8 },
  dropHeader: { borderBottomWidth: 1, fontSize: 9, fontWeight: "500", letterSpacing: 2, paddingHorizontal: 16, paddingVertical: 12 },
  dropItem: { alignItems: "center", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 13 },
  dropItemLeft: { alignItems: "center", flexDirection: "row", gap: 10 },
  dropDot: { borderRadius: 4, height: 7, width: 7 },
  dropCityName: { fontSize: 13, fontWeight: "500" },
  dropCitySub: { fontSize: 9, marginTop: 1 },
  sheetOverlay: { backgroundColor: "rgba(0,0,0,0.6)", flex: 1, justifyContent: "flex-end" },
  filterSheet: { borderLeftWidth: 1, borderRightWidth: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, height: height * 0.85, paddingBottom: Platform.OS === "ios" ? 30 : 20 },
  sheetHandle: { alignSelf: "center", borderRadius: 2, height: 4, marginBottom: 18, marginTop: 14, width: 40 },
  sheetTitle: { fontSize: 22, fontWeight: "400", marginBottom: 4, paddingHorizontal: 20 },
  sheetSub: { fontSize: 11, marginBottom: 20, paddingHorizontal: 20 },
  sheetContent: { paddingBottom: 20 },
  filterSection: { marginBottom: 20, paddingHorizontal: 20 },
  filterSectionLabel: { fontSize: 9.5, fontWeight: "500", letterSpacing: 2, marginBottom: 12 },
  priceRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  priceInput: { borderRadius: 12, borderWidth: 1, flex: 1, fontSize: 13, paddingHorizontal: 14, paddingVertical: 11 },
  priceDash: { fontSize: 16 },
  ratingChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  ratingChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  occChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  occChip: { alignItems: "center", borderRadius: 20, borderWidth: 1, flexDirection: "row", gap: 6, paddingHorizontal: 13, paddingVertical: 7 },
  sortOpt: { alignItems: "center", borderRadius: 12, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginBottom: 8, padding: 13 },
  sortLabel: { fontSize: 13 },
  sortRadio: { alignItems: "center", borderRadius: 9, borderWidth: 2, height: 18, justifyContent: "center", width: 18 },
  sortDot: { borderRadius: 4, height: 8, width: 8 },
  sheetFooter: { borderTopWidth: 1, flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 16 },
  btnReset: { alignItems: "center", borderRadius: 13, borderWidth: 1, flex: 1, padding: 14 },
  btnResetTxt: { fontSize: 13, fontWeight: "500" },
  btnApply: { alignItems: "center", backgroundColor: "#C0392B", borderRadius: 13, elevation: 8, flex: 2, padding: 14, shadowColor: "#C0392B", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12 },
  btnApplyTxt: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
