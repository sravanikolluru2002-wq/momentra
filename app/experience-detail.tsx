import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Calendar, DateData } from "react-native-calendars";
import {
  ImageBackground,
  ImageSourcePropType,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { DARK, EXPERIENCES, formatINR, getExperience } from "@/constants/experiences";
import type { AddOn, Experience } from "@/constants/experiences";
import { supabase } from "@/lib/supabase";
import { openWhatsApp as openMomentraWhatsApp, whatsappCategoryFromOccasion } from "@/lib/whatsapp";

const TIMES = ["7:00 PM", "8:00 PM", "9:00 PM", "Custom"];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KITTY_PARTY_IMAGE = require("../assets/kitty-party.png");
const today = new Date().toISOString().slice(0, 10);

export default function ExperienceDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ experienceId?: string }>();
  const theme = DARK;
  const [experience, setExperience] = useState(getExperience(params.experienceId));
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [time, setTime] = useState("8:00 PM");
  const [date, setDate] = useState(today);
  const [guests, setGuests] = useState(experience.capacity);
  const [specialRequest, setSpecialRequest] = useState("");
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const galleryImages = useMemo(() => getExperienceGalleryImages(experience), [experience]);
  const [selectedImage, setSelectedImage] = useState(galleryImages[0]);

  useEffect(() => {
    let mounted = true;

    async function fetchApprovedExperience() {
      const id = Array.isArray(params.experienceId) ? params.experienceId[0] : params.experienceId;
      if (!id || !UUID_PATTERN.test(id)) return;

      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("id", id)
        .eq("status", "approved")
        .maybeSingle();

      if (error) {
        console.error("EXPERIENCE DETAIL FETCH ERROR:", JSON.stringify(error, null, 2));
        return;
      }

      if (mounted && data) {
        const mapped = mapSupabaseExperience(data);
        setExperience(mapped);
        setGuests(mapped.capacity);
      }
    }

    fetchApprovedExperience();

    return () => {
      mounted = false;
    };
  }, [params.experienceId]);

  useEffect(() => {
    setSelectedImage(galleryImages[0]);
    setFailedImages(new Set());
  }, [galleryImages]);

  const addOnTotal = useMemo(
    () =>
      experience.addOns
        .filter((addOn) => selectedAddOns.includes(addOn.id))
        .reduce((sum, addOn) => sum + addOn.price, 0),
    [experience.addOns, selectedAddOns]
  );
  const total = experience.price + addOnTotal;

  function requestAvailability() {
    openMomentraWhatsApp(whatsappCategoryFromOccasion(experience.occasionId), "EXPERIENCE WEB WHATSAPP ERROR");
  }

  function toggleAddOn(id: string) {
    setSelectedAddOns((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.bg }]}>
      <ImageBackground
        onError={() => setFailedImages((current) => new Set(current).add(selectedImage))}
        source={getGalleryImageSource(experience, selectedImage, failedImages)}
        style={styles.hero}
      >
        <LinearGradient
          colors={["rgba(13,9,5,0.08)", "rgba(13,9,5,0.96)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroTop}>
          <Pressable onPress={() => router.back()} style={styles.circle}>
            <Text style={styles.circleText}>‹</Text>
          </Pressable>
          <View style={styles.actionRow}>
            <View style={styles.circle}><Text>♡</Text></View>
            <View style={styles.circle}><Text>↗</Text></View>
          </View>
        </View>
        <View style={styles.heroBottom}>
          <Text style={styles.title}>{experience.title}</Text>
          <Text style={styles.venue}>📍 {experience.venue}</Text>
          <Text style={[styles.rating, { color: theme.gold }]}>
            ★ {experience.rating} ({experience.reviews} reviews)
          </Text>
        </View>
      </ImageBackground>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <ExperienceGallery
          experience={experience}
          failedImages={failedImages}
          onImageError={(image) => setFailedImages((current) => new Set(current).add(image))}
          onSelectImage={setSelectedImage}
          selectedImage={selectedImage}
        />

        <View style={styles.priceRow}>
          <View>
            <Text style={[styles.price, { color: theme.gold }]}>{experience.priceLabel ?? formatINR(experience.price)}</Text>
            <Text style={[styles.muted, { color: theme.text2 }]}>
              {experience.minimumGuests ? `minimum ${experience.minimumGuests} guests` : `for ${experience.capacity} people`}
            </Text>
          </View>
          <View style={[styles.duration, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.muted, { color: theme.text2 }]}>⏱ {experience.duration ?? "2 hours"}</Text>
          </View>
        </View>

        <SectionTitle title="About this experience" />
        <Text style={[styles.description, { color: theme.text2 }]}>
          {getExperienceDescription(experience)}
        </Text>

        <SectionTitle title="What makes this special" />
        <View style={styles.specialList}>
          {getExperienceSpecial(experience).map((item) => (
            <View key={item} style={[styles.specialCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.specialCheck, { color: theme.gold }]}>✓</Text>
              <Text style={[styles.specialText, { color: theme.text2 }]}>{item}</Text>
            </View>
          ))}
        </View>

        <SectionTitle title="What's Included" />
        <View style={styles.inclusionGrid}>
          {experience.inclusions.map((item) => (
            <View key={item} style={styles.inclusion}>
              <Text style={{ color: theme.gold }}>✓</Text>
              <Text style={[styles.inclusionText, { color: theme.text2 }]}>{item}</Text>
            </View>
          ))}
        </View>

        <SectionTitle title="Add-ons" />
        <ScrollView
          directionalLockEnabled
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.addOnRow}
        >
          {experience.addOns.map((addOn) => {
            const isSelected = selectedAddOns.includes(addOn.id);
            return (
              <Pressable
                key={addOn.id}
                onPress={() => toggleAddOn(addOn.id)}
                style={[
                  styles.addOn,
                  { backgroundColor: theme.surface, borderColor: isSelected ? theme.red : theme.border },
                ]}
              >
                {isSelected && (
                  <View style={[styles.addOnCheck, { backgroundColor: theme.red }]}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
                <Text style={styles.addOnIcon}>{addOn.icon}</Text>
                <Text style={[styles.addOnName, { color: theme.text2 }]}>{addOn.name}</Text>
                <Text style={[styles.addOnPrice, { color: theme.gold }]}>
                  +{formatINR(addOn.price)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <SectionTitle title="Select Date" />
        <View style={[styles.calendarWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Calendar
            minDate={today}
            onDayPress={(day: DateData) => setDate(day.dateString)}
            markedDates={{
              [date]: {
                selected: true,
                selectedColor: theme.red,
                selectedTextColor: "#fff",
              },
            }}
            theme={{
              arrowColor: theme.gold,
              calendarBackground: theme.surface,
              dayTextColor: theme.text,
              monthTextColor: theme.gold,
              selectedDayBackgroundColor: theme.red,
              selectedDayTextColor: "#fff",
              textDayFontWeight: "600",
              textDisabledColor: "rgba(242,232,217,0.22)",
              textMonthFontWeight: "800",
              textSectionTitleColor: theme.text2,
              todayTextColor: theme.gold,
            }}
          />
        </View>

        <SectionTitle title="Select Time" />
        <View style={styles.timeRow}>
          {TIMES.map((item) => {
            const active = item === time;
            return (
              <Pressable
                key={item}
                onPress={() => setTime(item)}
                style={[
                  styles.timeChip,
                  { borderColor: active ? theme.red : theme.border, backgroundColor: active ? theme.red : "transparent" },
                ]}
              >
                <Text style={{ color: active ? "#fff" : theme.text2, fontWeight: "700" }}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <SectionTitle title="Guests" />
        <View style={[styles.guestBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable
            onPress={() => setGuests((current) => Math.max(experience.minimumGuests ?? 1, current - 1))}
            style={[styles.guestBtn, { borderColor: theme.border }]}
          >
            <Text style={[styles.guestBtnTxt, { color: theme.gold }]}>−</Text>
          </Pressable>
          <Text style={[styles.guestCount, { color: theme.text }]}>{guests} Guests</Text>
          <Pressable
            onPress={() => setGuests((current) => current + 1)}
            style={[styles.guestBtn, { borderColor: theme.border }]}
          >
            <Text style={[styles.guestBtnTxt, { color: theme.gold }]}>+</Text>
          </Pressable>
        </View>

        <SectionTitle title="Special Request" />
        <TextInput
          multiline
          onChangeText={setSpecialRequest}
          placeholder="Add decor notes, cake message, allergies, or special add-ons"
          placeholderTextColor={theme.text2}
          style={[styles.requestInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          value={specialRequest}
        />

        <SectionTitle title="Reviews" />
        {getExperienceReviews(experience).map((review) => (
          <View key={`${review.name}-${review.date}`} style={[styles.reviewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.reviewTop}>
              <Text style={[styles.reviewName, { color: theme.text }]}>{review.name}</Text>
              <Text style={[styles.reviewRating, { color: theme.gold }]}>{review.rating}★</Text>
            </View>
            <Text style={[styles.reviewMeta, { color: theme.text2 }]}>{review.date} · {review.occasion}</Text>
            <Text style={[styles.reviewText, { color: theme.text2 }]}>{review.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
        <Pressable
          onPress={() => {
            if (Platform.OS === "web") {
              requestAvailability();
              return;
            }

            router.push({
              pathname: "/booking-summary",
              params: {
                experienceId: experience.id,
                addOns: selectedAddOns.join(","),
                capacity: String(experience.capacity),
                date,
                experienceTitle: experience.title,
                guests: String(guests),
                price: String(experience.price),
                request: specialRequest,
                time,
                venue: experience.venue,
              },
            } as never);
          }}
          style={[styles.cta, { backgroundColor: theme.red }]}
        >
          <Text style={styles.ctaText}>{Platform.OS === "web" ? "Request Availability" : "Continue to Summary"}</Text>
          <Text style={styles.ctaPrice}>{Platform.OS === "web" ? "Talk to Momentra" : formatINR(total)}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function ExperienceGallery({
  experience,
  failedImages,
  onImageError,
  onSelectImage,
  selectedImage,
}: {
  experience: Experience;
  failedImages: Set<string>;
  onImageError: (image: string) => void;
  onSelectImage: (image: string) => void;
  selectedImage: string;
}) {
  const galleryImages = getExperienceGalleryImages(experience);

  return (
    <View style={styles.topGallery}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryRow}>
        {galleryImages.map((image) => {
          const isSelected = image === selectedImage;

          return (
            <Pressable
              key={image}
              onPress={() => onSelectImage(image)}
              style={[
                styles.galleryThumbButton,
                isSelected && styles.galleryThumbButtonActive,
              ]}
            >
              <ImageBackground
                onError={() => onImageError(image)}
                source={getGalleryImageSource(experience, image, failedImages)}
                style={styles.galleryImage}
                imageStyle={styles.galleryImageRadius}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function getExperienceGalleryImages(experience: Experience) {
  const images = experience.images?.length
    ? experience.images
    : [experience.image].filter(Boolean);

  return images.length ? images : [experience.image];
}

function getExperienceImage(id: string, image: string): ImageSourcePropType {
  return id === "kitty-brunch" ? KITTY_PARTY_IMAGE : { uri: image };
}

function getGalleryImageSource(experience: Experience, image: string, failedImages: Set<string>): ImageSourcePropType {
  if (failedImages.has(image)) {
    return getExperienceImage(experience.id, experience.image);
  }

  return getExperienceImage(experience.id, image);
}

type SupabaseExperienceRow = {
  add_ons?: AddOn[] | null;
  addOns?: AddOn[] | null;
  badge?: string | null;
  capacity?: number | string | null;
  category?: string | null;
  description?: string | null;
  id?: number | string | null;
  image?: string | null;
  image_url?: string | null;
  images?: string[] | null;
  inclusions?: string[] | string | null;
  occasionId?: string | null;
  occasion_id?: string | null;
  price?: number | string | null;
  priceLabel?: string | null;
  price_label?: string | null;
  duration?: string | null;
  minimumGuests?: number | string | null;
  minimum_guests?: number | string | null;
  city?: string | null;
  area?: string | null;
  location?: string | null;
  rating?: number | string | null;
  reviewList?: Experience["reviewList"] | null;
  review_list?: Experience["reviewList"] | null;
  reviews?: number | string | null;
  special?: string[] | string | null;
  title?: string | null;
  venue?: string | null;
};

function mapSupabaseExperience(row: SupabaseExperienceRow): Experience {
  const fallback = EXPERIENCES[0];

  return {
    addOns: Array.isArray(row.add_ons) ? row.add_ons : Array.isArray(row.addOns) ? row.addOns : fallback.addOns,
    badge: row.badge ?? fallback.badge,
    capacity: toNumber(row.capacity, fallback.capacity),
    description: row.description || undefined,
    id: String(row.id ?? fallback.id),
    image: row.image_url || row.image || fallback.image,
    images: Array.isArray(row.images) ? row.images : fallback.images,
    inclusions: Array.isArray(row.inclusions)
      ? row.inclusions
      : typeof row.inclusions === "string"
        ? row.inclusions.split(",").map((item) => item.trim()).filter(Boolean)
        : fallback.inclusions,
    occasionId: row.occasion_id ?? row.occasionId ?? row.category ?? fallback.occasionId,
    price: toNumber(row.price, fallback.price),
    priceLabel: row.price_label ?? row.priceLabel ?? fallback.priceLabel,
    duration: row.duration ?? fallback.duration,
    minimumGuests: toNumber(row.minimum_guests ?? row.minimumGuests, fallback.minimumGuests ?? fallback.capacity),
    city: row.city ?? fallback.city,
    area: row.area ?? fallback.area,
    location: row.location ?? fallback.location,
    rating: toNumber(row.rating, fallback.rating),
    reviewList: Array.isArray(row.review_list) ? row.review_list : Array.isArray(row.reviewList) ? row.reviewList : undefined,
    reviews: toNumber(row.reviews, fallback.reviews),
    special: Array.isArray(row.special)
      ? row.special
      : typeof row.special === "string"
        ? row.special.split(",").map((item) => item.trim()).filter(Boolean)
        : undefined,
    title: row.title || fallback.title,
    venue: row.venue || fallback.venue,
  };
}

function getExperienceDescription(experience: Experience) {
  return experience.description || `${experience.title} is a curated Momentra experience at ${experience.venue}. The package brings venue coordination, essential setup, and celebration details into one booking so you can focus on the moment instead of managing vendors.`;
}

function getExperienceSpecial(experience: Experience) {
  return experience.special?.length
    ? experience.special
    : ["Curated setup for the occasion", "Venue and timing coordination", "Add-ons available during booking", "Designed to reduce planning effort"];
}

function getExperienceReviews(experience: Experience) {
  return experience.reviewList?.length
    ? experience.reviewList
    : [
        { name: "Rahul Sharma", rating: 5, date: "18 Apr 2026", occasion: experience.title, text: "The setup was ready on time, the coordination was smooth, and the experience felt much easier than planning everything ourselves." },
        { name: "Ananya Rao", rating: 5, date: "2 Apr 2026", occasion: experience.occasionId, text: "Loved how the details were handled. We could arrive, enjoy the evening, and not worry about calling different vendors." },
        { name: "Vikram Jain", rating: 4, date: "16 Mar 2026", occasion: experience.venue, text: "Good ambience and reliable support. The booking flow made the celebration simple to manage." },
      ];
}

function toNumber(value: number | string | null | undefined, fallback: number) {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(parsed) ? Number(parsed) : fallback;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  hero: { height: 285 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", padding: 14, paddingTop: 38 },
  actionRow: { flexDirection: "row", gap: 8 },
  circle: { alignItems: "center", backgroundColor: "rgba(13,9,5,0.65)", borderRadius: 17, height: 34, justifyContent: "center", width: 34 },
  circleText: { color: "#C9975A", fontSize: 26, lineHeight: 28 },
  heroBottom: { bottom: 16, left: 16, position: "absolute", right: 16 },
  title: { color: "#F2E8D9", fontSize: 25, fontWeight: "700", lineHeight: 30 },
  venue: { color: "rgba(242,232,217,0.65)", fontSize: 11, marginTop: 5 },
  rating: { alignSelf: "flex-start", backgroundColor: "rgba(201,151,90,0.16)", borderRadius: 7, fontSize: 10, fontWeight: "800", marginTop: 7, paddingHorizontal: 7, paddingVertical: 4 },
  body: { flexGrow: 1, padding: 16, paddingBottom: 168 },
  priceRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  price: { fontSize: 31, fontWeight: "800" },
  muted: { fontSize: 11 },
  duration: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  sectionTitle: { color: "#F2E8D9", fontSize: 16, fontWeight: "700", marginBottom: 10, marginTop: 14 },
  description: { fontSize: 12, lineHeight: 20 },
  specialList: { gap: 8 },
  specialCard: { alignItems: "flex-start", borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 8, padding: 11 },
  specialCheck: { fontSize: 12, fontWeight: "900", lineHeight: 18 },
  specialText: { flex: 1, fontSize: 11.5, lineHeight: 18 },
  topGallery: { marginBottom: 16, marginTop: -2 },
  galleryRow: { marginBottom: 2 },
  galleryThumbButton: {
    borderColor: "rgba(201,151,90,0.22)",
    borderRadius: 16,
    borderWidth: 2,
    marginRight: 10,
    padding: 2,
  },
  galleryThumbButtonActive: {
    borderColor: "#C9975A",
  },
  galleryImage: { height: 94, overflow: "hidden", width: 132 },
  galleryImageRadius: { borderRadius: 12 },
  inclusionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  inclusion: { alignItems: "center", flexDirection: "row", gap: 6, width: "48%" },
  inclusionText: { flex: 1, fontSize: 11 },
  addOnRow: { marginBottom: 4 },
  addOn: { alignItems: "center", borderRadius: 13, borderWidth: 1.5, marginRight: 9, paddingHorizontal: 9, paddingVertical: 12, position: "relative", width: 104 },
  addOnCheck: { alignItems: "center", borderRadius: 7, height: 14, justifyContent: "center", position: "absolute", right: 6, top: 6, width: 14 },
  checkText: { color: "#fff", fontSize: 8, fontWeight: "800" },
  addOnIcon: { fontSize: 21, marginBottom: 5 },
  addOnName: { fontSize: 10, textAlign: "center" },
  addOnPrice: { fontSize: 12, fontWeight: "800", marginTop: 4 },
  calendarWrap: { borderRadius: 14, borderWidth: 1, overflow: "hidden", paddingBottom: 6 },
  dateBox: { alignItems: "center", borderRadius: 12, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: 14 },
  dateText: { fontSize: 14, fontWeight: "700" },
  timeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeChip: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 },
  guestBox: { alignItems: "center", borderRadius: 12, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: 10 },
  guestBtn: { alignItems: "center", borderRadius: 12, borderWidth: 1, height: 40, justifyContent: "center", width: 44 },
  guestBtnTxt: { fontSize: 22, fontWeight: "900", lineHeight: 24 },
  guestCount: { fontSize: 15, fontWeight: "800" },
  requestInput: { borderRadius: 13, borderWidth: 1, fontSize: 13, minHeight: 88, padding: 13, textAlignVertical: "top" },
  reviewCard: { borderRadius: 14, borderWidth: 1, marginBottom: 10, padding: 13 },
  reviewTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  reviewName: { fontSize: 12, fontWeight: "800" },
  reviewRating: { fontSize: 12, fontWeight: "900" },
  reviewMeta: { fontSize: 10, marginBottom: 7 },
  reviewText: { fontSize: 11.5, lineHeight: 18 },
  footer: { borderTopWidth: 1, bottom: 0, left: 0, padding: 16, paddingBottom: 22, position: "absolute", right: 0 },
  cta: { alignItems: "center", borderRadius: 15, flexDirection: "row", justifyContent: "space-between", padding: 16 },
  ctaText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  ctaPrice: { color: "rgba(255,255,255,0.84)", fontSize: 15, fontWeight: "800" },
});
