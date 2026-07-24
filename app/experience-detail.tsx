import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Camera,
  CakeSlice,
  Mic2,
  Music,
  Sparkles,
  Trash2,
  Utensils,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Calendar, DateData } from "react-native-calendars";
import {
  ImageBackground,
  ImageSourcePropType,
  Modal,
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
import { firebaseAuth } from "@/firebase/config";
import { createMomentraEnquiry } from "@/lib/supabase/enquiries";
import { supabase } from "@/lib/supabase";
import { openWhatsAppMessage } from "@/lib/whatsapp";

const TIMES = ["7:00 PM", "8:00 PM", "9:00 PM", "Custom"];
const SERVICE_MODES = ["Momentra managed", "Customer home", "Partner venue", "Outdoor destination", "Custom"];
const PICNIC_DESTINATIONS = ["Vizag outskirts", "Araku", "Maredumilli", "Beachside", "Resort", "Farmhouse"];
const FOOD_MENU = [
  { title: "Veg starters", items: ["Paneer tikka", "Crispy corn", "Veg spring rolls", "Mushroom pepper fry", "Hara bhara kebab", "Cheese balls"] },
  { title: "Non-veg starters", items: ["Chicken tikka", "Fish fingers", "Chicken lollipop", "Prawn fry", "Mutton seekh kebab", "Pepper chicken"] },
  { title: "Buffet meal", items: ["Veg biryani", "Chicken biryani", "Paneer butter masala", "Butter naan", "Dal makhani", "Curd rice"] },
  { title: "Live counter", items: ["Pasta counter", "Chaat counter", "Dosa counter", "Grill counter", "Mocktail counter", "Tandoor counter"] },
  { title: "Snacks", items: ["French fries", "Nachos", "Mini sandwiches", "Popcorn", "Masala peanuts", "Garlic bread"] },
  { title: "Beverages", items: ["Fresh lime soda", "Mocktails", "Cold coffee", "Soft drinks", "Masala chai", "Mineral water"] },
  { title: "Desserts", items: ["Gulab jamun", "Brownie bites", "Ice cream cups", "Fruit custard", "Rasmalai", "Pastry bites"] },
  { title: "Custom menu", items: ["Jain menu", "Kids menu", "Healthy menu", "Regional menu", "No onion garlic", "Diet-specific menu"] },
];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KITTY_PARTY_IMAGE = require("../assets/kitty-party.png");
const today = new Date().toISOString().slice(0, 10);

export default function ExperienceDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ experienceId?: string }>();
  const theme = DARK;
  const [experience, setExperience] = useState(getExperience(params.experienceId));
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [selectedFoodItems, setSelectedFoodItems] = useState<string[]>([]);
  const [foodMenuOpen, setFoodMenuOpen] = useState(false);
  const [activeFoodCategory, setActiveFoodCategory] = useState(FOOD_MENU[0].title);
  const [serviceMode, setServiceMode] = useState(getDefaultServiceMode(experience));
  const [destination, setDestination] = useState(PICNIC_DESTINATIONS[0]);
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
        setServiceMode(getDefaultServiceMode(mapped));
        setSelectedRequirements([]);
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
  const activeFoodMenu = FOOD_MENU.find((item) => item.title === activeFoodCategory) ?? FOOD_MENU[0];

  async function requestAvailability() {
    try {
      await createMomentraEnquiry({
        addOns: experience.addOns
          .filter((addOn) => selectedAddOns.includes(addOn.id))
          .map((addOn) => getAddOnLabel(addOn)),
        bookingDate: date,
        bookingTime: time,
        city: experience.city,
        enquiryType: "experience_availability_request",
        estimatedTotal: total,
        experienceId: experience.id,
        experienceTitle: experience.title,
        foodItems: selectedFoodItems,
        guests,
        notes: specialRequest,
        occasionId: experience.occasionId,
        requirements: selectedRequirements,
        source: "experience_detail",
        summary: {
          destination: experience.occasionId === "picnic" ? destination : "",
          serviceMode,
        },
        venue: experience.venue,
      }, firebaseAuth.currentUser);
    } catch (error) {
      console.error("[Momentra enquiry] availability save failed", error);
    }

    openWhatsAppMessage(
      buildAvailabilityMessage({
        addOns: experience.addOns
          .filter((addOn) => selectedAddOns.includes(addOn.id))
          .map((addOn) => getAddOnLabel(addOn)),
        date,
        destination: experience.occasionId === "picnic" ? destination : undefined,
        experience,
        foodItems: selectedFoodItems,
        guests,
        requirements: selectedRequirements,
        serviceMode,
        specialRequest,
        time,
      }),
      "EXPERIENCE WEB WHATSAPP ERROR"
    );
  }

  function toggleAddOn(id: string) {
    const addOn = experience.addOns.find((item) => item.id === id);
    if (addOn && isFoodOption(addOn.name)) {
      setFoodMenuOpen(true);
    }

    setSelectedAddOns((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function toggleRequirement(item: string) {
    if (isFoodOption(item)) {
      setFoodMenuOpen(true);
    }

    setSelectedRequirements((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item]
    );
  }

  function toggleFoodItem(item: string) {
    setSelectedFoodItems((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item]
    );
  }

  const requirementOptions = getExperienceRequirements(experience);

  function continueRequest() {
    if (Platform.OS === "web") {
      requestAvailability();
      return;
    }

    router.push({
      pathname: "/booking-summary",
      params: {
        addOns: selectedAddOns.join(","),
        capacity: String(experience.capacity),
        date,
        destination: experience.occasionId === "picnic" ? destination : "",
        experienceId: experience.id,
        experienceTitle: experience.title,
        foodMenu: selectedFoodItems.join(","),
        guests: String(guests),
        price: String(experience.price),
        request: specialRequest,
        requirements: selectedRequirements.join(","),
        serviceMode,
        time,
        venue: experience.venue,
      },
    } as never);
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        style={styles.pageScroll}
      >
      <ImageBackground
        onError={() => setFailedImages((current) => new Set(current).add(selectedImage))}
        source={getGalleryImageSource(experience, selectedImage, failedImages)}
        style={[styles.hero, Platform.OS === "web" && styles.heroWeb]}
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

        <SectionTitle title="Choose service mode" />
        <View style={styles.modeGrid}>
          {SERVICE_MODES.map((mode) => {
            const active = mode === serviceMode;
            return (
              <Pressable
                key={mode}
                onPress={() => setServiceMode(mode)}
                style={[
                  styles.modeChip,
                  { backgroundColor: active ? "rgba(192,57,43,0.18)" : theme.surface, borderColor: active ? theme.red : theme.border },
                ]}
              >
                <Text style={[styles.modeText, { color: active ? theme.red : theme.text2 }]}>{mode}</Text>
              </Pressable>
            );
          })}
        </View>

        {experience.occasionId === "picnic" && (
          <>
            <SectionTitle title="Choose destination style" />
            <View style={styles.modeGrid}>
              {PICNIC_DESTINATIONS.map((item) => {
                const active = item === destination;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setDestination(item)}
                    style={[
                      styles.modeChip,
                      { backgroundColor: active ? "rgba(192,57,43,0.18)" : theme.surface, borderColor: active ? theme.red : theme.border },
                    ]}
                  >
                    <Text style={[styles.modeText, { color: active ? theme.red : theme.text2 }]}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <SectionTitle title="What's Included" />
        <View style={styles.inclusionGrid}>
          {experience.inclusions.map((item) => (
            <View key={item} style={styles.inclusion}>
              <Text style={{ color: theme.gold }}>✓</Text>
              <Text style={[styles.inclusionText, { color: theme.text2 }]}>{item}</Text>
            </View>
          ))}
        </View>

        <SectionTitle title="Select requirements" />
        <View style={styles.requirementGrid}>
          {requirementOptions.map((item) => {
            const active = selectedRequirements.includes(item);
            return (
              <Pressable
                key={item}
                onPress={() => toggleRequirement(item)}
                style={[
                  styles.requirementChip,
                  { backgroundColor: active ? "rgba(192,57,43,0.18)" : theme.surface, borderColor: active ? theme.red : theme.border },
                ]}
              >
                <Text style={[styles.requirementText, { color: active ? theme.red : theme.text2 }]}>
                  {active ? "✓ " : "+ "}{item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {false && foodMenuOpen && (
          <View style={[styles.foodMenu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.foodMenuHeader}>
              <View>
                <Text style={styles.foodMenuTitle}>Food menu</Text>
                <Text style={[styles.foodMenuSub, { color: theme.text2 }]}>Choose what you want Momentra to arrange</Text>
              </View>
              <Pressable onPress={() => setFoodMenuOpen(false)} style={[styles.foodMenuClose, { borderColor: theme.border }]}>
                <Text style={{ color: theme.gold, fontWeight: "900" }}>×</Text>
              </Pressable>
            </View>
            <View style={styles.foodGrid}>
              {FOOD_MENU.map((category) => {
                const active = selectedFoodItems.includes(category.title);
                return (
                  <Pressable
                    key={category.title}
                    onPress={() => toggleFoodItem(category.title)}
                    style={[
                      styles.foodChip,
                      { backgroundColor: active ? "rgba(192,57,43,0.18)" : "rgba(255,255,255,0.035)", borderColor: active ? theme.red : theme.border },
                    ]}
                  >
                    <Text style={[styles.foodChipText, { color: active ? theme.red : theme.text2 }]}>
                      {active ? "✓ " : "+ "}{category.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

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
                <AddOnIcon addOn={addOn} color={theme.gold} />
                <Text style={[styles.addOnName, { color: theme.text2 }]}>{getAddOnLabel(addOn)}</Text>
                <Text style={[styles.addOnPrice, { color: theme.gold }]}>
                  +{formatINR(addOn.price)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {false && foodMenuOpen && (
          <View style={[styles.foodMenu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.foodMenuHeader}>
              <View style={styles.foodMenuCopy}>
                <Text style={styles.foodMenuEyebrow}>MENU BUILDER</Text>
                <Text style={styles.foodMenuTitle}>Build your food plan</Text>
                <Text style={[styles.foodMenuSub, { color: theme.text2 }]}>
                  Pick food sections now. Momentra will confirm exact menu options based on your guest count and budget.
                </Text>
              </View>
              <Pressable onPress={() => setFoodMenuOpen(false)} style={[styles.foodMenuClose, { borderColor: theme.border }]}>
                <Text style={{ color: theme.gold, fontWeight: "900" }}>×</Text>
              </Pressable>
            </View>
            <View style={styles.foodGrid}>
              {FOOD_MENU.map((category) => {
                const active = selectedFoodItems.includes(category.title);
                return (
                  <Pressable
                    key={category.title}
                    onPress={() => toggleFoodItem(category.title)}
                    style={[
                      styles.foodChip,
                      { backgroundColor: active ? "rgba(192,57,43,0.18)" : "rgba(255,255,255,0.035)", borderColor: active ? theme.red : theme.border },
                    ]}
                  >
                    <Text style={[styles.foodChipText, { color: active ? theme.red : theme.text2 }]}>
                      {active ? "✓ " : "+ "}{category.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.foodSummaryRow}>
              <Text style={[styles.foodMenuSummary, { color: theme.text2 }]}>
                {selectedFoodItems.length
                  ? `${selectedFoodItems.length} section${selectedFoodItems.length > 1 ? "s" : ""} selected`
                  : "Start with one or more food sections"}
              </Text>
              <Text style={[styles.foodMenuSummary, { color: theme.gold }]}>Editable before request</Text>
            </View>
          </View>
        )}

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

        <View style={[styles.footer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={styles.footerTitle}>Ready to check availability?</Text>
          <Text style={[styles.footerSub, { color: theme.text2 }]}>
            Your selections will be sent with the package, date, guests, requirements, add-ons, and food menu.
          </Text>
          <Pressable onPress={continueRequest} style={[styles.cta, { backgroundColor: theme.red }]}>
            <Text style={styles.ctaText}>{Platform.OS === "web" ? "Request Availability" : "Continue to Summary"}</Text>
            {Platform.OS !== "web" ? <Text style={styles.ctaPrice}>{formatINR(total)}</Text> : null}
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setFoodMenuOpen(false)}
        transparent
        visible={foodMenuOpen}
      >
        <View style={styles.menuOverlay}>
          <Pressable onPress={() => setFoodMenuOpen(false)} style={styles.menuBackdrop} />
          <View style={[styles.menuSheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.menuHandle} />
            <View style={styles.foodMenuHeader}>
              <View style={styles.foodMenuCopy}>
                <Text style={styles.foodMenuEyebrow}>FOOD MENU</Text>
                <Text style={styles.foodMenuTitle}>Choose dishes for your celebration</Text>
                <Text style={[styles.foodMenuSub, { color: theme.text2 }]}>
                  Select actual items under each type. Momentra will confirm availability and final quantities with you.
                </Text>
              </View>
              <Pressable onPress={() => setFoodMenuOpen(false)} style={[styles.foodMenuClose, { borderColor: theme.border }]}>
                <Text style={{ color: theme.gold, fontWeight: "900" }}>x</Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.foodCategoryRow}>
              {FOOD_MENU.map((category) => {
                const active = category.title === activeFoodCategory;
                const selectedCount = category.items.filter((item) => selectedFoodItems.includes(item)).length;
                return (
                  <Pressable
                    key={category.title}
                    onPress={() => setActiveFoodCategory(category.title)}
                    style={[
                      styles.foodCategoryChip,
                      { backgroundColor: active ? "rgba(192,57,43,0.22)" : "rgba(255,255,255,0.035)", borderColor: active ? theme.red : theme.border },
                    ]}
                  >
                    <Text style={[styles.foodCategoryText, { color: active ? theme.red : theme.text2 }]}>
                      {category.title}{selectedCount ? ` (${selectedCount})` : ""}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[styles.foodPanelTitle, { color: theme.gold }]}>{activeFoodMenu.title}</Text>
            <View style={styles.foodItemGrid}>
              {activeFoodMenu.items.map((item) => {
                const active = selectedFoodItems.includes(item);
                return (
                  <Pressable
                    key={item}
                    onPress={() => toggleFoodItem(item)}
                    style={[
                      styles.foodItemCard,
                      { backgroundColor: active ? "rgba(192,57,43,0.18)" : "rgba(255,255,255,0.035)", borderColor: active ? theme.red : theme.border },
                    ]}
                  >
                    <Text style={[styles.foodItemText, { color: active ? theme.red : theme.text2 }]}>
                      {active ? "✓ " : "+ "}{item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.foodSummaryRow}>
              <Text style={[styles.foodMenuSummary, { color: theme.text2 }]}>
                {selectedFoodItems.length ? `${selectedFoodItems.length} food item${selectedFoodItems.length > 1 ? "s" : ""} selected` : "No food items selected yet"}
              </Text>
              <Pressable onPress={() => setFoodMenuOpen(false)} style={[styles.foodDoneButton, { backgroundColor: theme.red }]}>
                <Text style={styles.foodDoneText}>Save food menu</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function AddOnIcon({ addOn, color }: { addOn: AddOn; color: string }) {
  const Icon = getAddOnIcon(addOn);
  return <Icon color={color} size={24} strokeWidth={1.9} />;
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

function getExperienceRequirements(experience: Experience) {
  if (experience.requirements?.length) return experience.requirements;

  const defaults: Record<string, string[]> = {
    anniversary: ["Food", "Decor", "Music", "Projector / screen optional", "Cake", "Host optional", "Photographer optional", "Custom theme optional"],
    bachelorette: ["Venue", "Theme decor", "Music", "Games", "Food and drinks", "Dance floor", "DJ optional", "Photographer optional", "Host optional"],
    "board-games": ["Venue or home setup", "Board games kit", "Snacks", "Beverages", "Music", "Host / game coordinator optional", "Food optional"],
    "bridal-shower": ["Venue", "Theme decor", "Music", "Games", "Stage / backdrop", "Food and soft drinks", "Welcome drinks", "Cake optional", "Photographer optional", "Makeup artist optional", "Personalized props optional"],
    birthday: ["Food", "Decor", "Music", "Projector / screen optional", "Cake", "Host optional", "Photographer optional", "Custom theme optional"],
    "cocktail-party": ["Decor package", "Food / curated buffet", "Bar / drinks setup", "Dance floor", "DJ / music", "Live band optional", "Photographer optional", "Host optional"],
    corporate: ["Venue", "Food", "Projector / AV", "Mic / sound", "Stage setup", "Seating arrangement", "GST invoice details", "Photography", "Anchor / host optional"],
    datenight: ["Weekday / date selection", "Couple seating", "Flower decor included", "Roses included", "Music included", "Candlelight setup", "Food included", "Cake optional", "Photographer optional"],
    "house-party": ["Food / customized menu", "Games", "Bartender", "Custom theme", "Dance floor or open space", "DJ optional", "Projector optional", "Host optional", "Photographer optional", "Cleanup optional", "Within-city service", "Away-from-city service"],
    kitty: ["Venue", "Food", "Music", "Tambola / games", "Host optional", "Decor optional", "Photography optional"],
    picnic: ["Venue / destination", "Guide provided", "Day outing", "Overnight stay", "Fun activities", "Board games", "Bonfire", "Food", "Transportation optional"],
  };

  return defaults[experience.occasionId] ?? experience.inclusions;
}

function getDefaultServiceMode(experience: Experience) {
  if (experience.venueType === "customer home") return "Customer home";
  if (experience.venueType === "partner venue") return "Partner venue";
  if (experience.venueType === "outdoor destination") return "Outdoor destination";
  if (experience.venueType === "custom") return "Custom";
  if (experience.occasionId === "house-party") return "Customer home";
  if (experience.occasionId === "picnic") return "Outdoor destination";
  return "Momentra managed";
}

function buildAvailabilityMessage({
  addOns,
  date,
  destination,
  experience,
  foodItems,
  guests,
  requirements,
  serviceMode,
  specialRequest,
  time,
}: {
  addOns: string[];
  date: string;
  destination?: string;
  experience: Experience;
  foodItems: string[];
  guests: number;
  requirements: string[];
  serviceMode: string;
  specialRequest: string;
  time: string;
}) {
  const lines = [
    "Hi Momentra, I want to request availability for this package.",
    `Package: ${experience.title}`,
    `Occasion: ${experience.category ?? experience.occasionId}`,
    `Venue / area: ${experience.venue}`,
    `Service mode: ${serviceMode}`,
    destination ? `Destination preference: ${destination}` : "",
    `Date: ${date}`,
    `Time: ${time}`,
    `Guests: ${guests}`,
    requirements.length ? `Requirements: ${requirements.join(", ")}` : "",
    foodItems.length ? `Food menu: ${foodItems.join(", ")}` : "",
    addOns.length ? `Add-ons: ${addOns.join(", ")}` : "",
    specialRequest.trim() ? `Notes: ${specialRequest.trim()}` : "",
  ];

  return lines.filter(Boolean).join("\n");
}

function isFoodOption(value: string) {
  const normalized = value.toLowerCase();
  return normalized.includes("food") || normalized.includes("catering") || normalized.includes("buffet") || normalized.includes("menu");
}

function getAddOnLabel(addOn: AddOn) {
  if (isFoodOption(addOn.name)) {
    return addOn.name.toLowerCase().includes("premium") ? "Premium Food" : "Food";
  }

  return addOn.name;
}

function getAddOnIcon(addOn: AddOn): LucideIcon {
  const name = addOn.name.toLowerCase();
  if (isFoodOption(addOn.name)) return Utensils;
  if (name.includes("photo")) return Camera;
  if (name.includes("cake")) return CakeSlice;
  if (name.includes("music") || name.includes("dj")) return Music;
  if (name.includes("host") || name.includes("anchor") || name.includes("games")) return Mic2;
  if (name.includes("clean")) return Trash2;
  return Sparkles;
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
  pageScroll: { flex: 1 },
  hero: { height: 285, marginHorizontal: -16, marginTop: -16 },
  heroWeb: { height: 200 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", padding: 14, paddingTop: 38 },
  actionRow: { flexDirection: "row", gap: 8 },
  circle: { alignItems: "center", backgroundColor: "rgba(13,9,5,0.65)", borderRadius: 17, height: 34, justifyContent: "center", width: 34 },
  circleText: { color: "#C9975A", fontSize: 26, lineHeight: 28 },
  heroBottom: { bottom: 16, left: 16, position: "absolute", right: 16 },
  title: { color: "#F2E8D9", fontSize: 25, fontWeight: "700", lineHeight: 30 },
  venue: { color: "rgba(242,232,217,0.65)", fontSize: 11, marginTop: 5 },
  rating: { alignSelf: "flex-start", backgroundColor: "rgba(201,151,90,0.16)", borderRadius: 7, fontSize: 10, fontWeight: "800", marginTop: 7, paddingHorizontal: 7, paddingVertical: 4 },
  body: { flexGrow: 1, padding: 16, paddingBottom: 40 },
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
  modeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modeChip: { borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 9 },
  modeText: { fontSize: 11, fontWeight: "800" },
  requirementGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  requirementChip: { borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 11, paddingVertical: 8 },
  requirementText: { fontSize: 11, fontWeight: "700" },
  foodMenu: { borderRadius: 22, borderWidth: 1, marginTop: 14, padding: 16 },
  foodMenuHeader: { alignItems: "flex-start", flexDirection: "row", gap: 12, justifyContent: "space-between", marginBottom: 14 },
  foodMenuCopy: { flex: 1, paddingRight: 8 },
  foodMenuEyebrow: { color: "#C9975A", fontSize: 9, fontWeight: "900", letterSpacing: 1.6, marginBottom: 4 },
  foodMenuTitle: { color: "#F2E8D9", fontSize: 16, fontWeight: "800" },
  foodMenuSub: { fontSize: 11, lineHeight: 17, marginTop: 4 },
  foodMenuClose: { alignItems: "center", borderRadius: 16, borderWidth: 1, height: 32, justifyContent: "center", width: 32 },
  foodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  foodChip: { borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 9 },
  foodChipText: { fontSize: 11, fontWeight: "800" },
  foodSummaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between", marginTop: 13 },
  foodMenuSummary: { fontSize: 11, fontWeight: "800" },
  menuOverlay: { flex: 1, justifyContent: "flex-end" },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === "web" ? "rgba(1,1,1,0.68)" : "rgba(1,1,1,0.72)",
    ...(Platform.OS === "web" ? ({ backdropFilter: "blur(10px)" } as never) : null),
  },
  menuSheet: {
    alignSelf: "center",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    maxHeight: Platform.OS === "web" ? "82%" : "86%",
    padding: 18,
    paddingBottom: Platform.OS === "web" ? 20 : 30,
    width: "100%",
  },
  menuHandle: { alignSelf: "center", backgroundColor: "rgba(201,151,90,0.42)", borderRadius: 999, height: 4, marginBottom: 14, width: 54 },
  foodCategoryRow: { marginBottom: 14 },
  foodCategoryChip: { borderRadius: 999, borderWidth: 1.5, marginRight: 8, paddingHorizontal: 12, paddingVertical: 9 },
  foodCategoryText: { fontSize: 11, fontWeight: "900" },
  foodPanelTitle: { fontSize: 13, fontWeight: "900", letterSpacing: 0.4, marginBottom: 10 },
  foodItemGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  foodItemCard: { borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 11, width: Platform.OS === "web" ? "31.8%" : "48%" },
  foodItemText: { fontSize: 12, fontWeight: "800", lineHeight: 16 },
  foodDoneButton: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11 },
  foodDoneText: { color: "#fff", fontSize: 12, fontWeight: "900" },
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
  footer: { borderRadius: 22, borderWidth: 1, marginTop: 20, padding: 16 },
  footerTitle: { color: "#F2E8D9", fontSize: 18, fontWeight: "900", marginBottom: 5 },
  footerSub: { fontSize: 11.5, lineHeight: 18, marginBottom: 14 },
  cta: { alignItems: "center", borderRadius: 15, flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between", padding: 16 },
  ctaText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  ctaPrice: { color: "rgba(255,255,255,0.84)", fontSize: 15, fontWeight: "800" },
});
