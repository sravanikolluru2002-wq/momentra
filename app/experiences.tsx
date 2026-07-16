import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useMomentraTheme } from "@/contexts/momentra-theme";
import {
  DARK,
  formatINR,
  getExperiencesByOccasion,
  getOccasion,
  LIGHT,
} from "@/constants/experiences";

const KITTY_PARTY_IMAGE = require("../assets/kitty-party.png");

export default function ExperiencesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; occasionId?: string }>();
  const { isDark } = useMomentraTheme();
  const theme = isDark ? DARK : LIGHT;
  const selectedCategory = params.occasionId ?? params.category;
  const occasion = getOccasion(selectedCategory);
  const experiences = getExperiencesByOccasion(selectedCategory);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.roundButton,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.roundText, { color: theme.gold }]}>‹</Text>
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.title, { color: theme.text }]}>
            {occasion.label} Experiences
          </Text>
          <Text style={[styles.subtitle, { color: theme.text2 }]}>
            Curated picks in Vizag
          </Text>
        </View>
        <View style={styles.switchWrap} />
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {experiences.map((experience) => (
          <Pressable
            key={experience.id}
            onPress={() =>
              router.push({
                pathname: "/experience-detail",
                params: { experienceId: experience.id },
              } as never)
            }
            style={[
              styles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <ImageBackground
              source={getExperienceImage(experience.id, experience.image)}
              style={styles.image}
            >
              {experience.badge ? (
                <View style={[styles.badge, { backgroundColor: theme.red }]}>
                  <Text style={styles.badgeText}>{experience.badge}</Text>
                </View>
              ) : null}
              <View style={styles.heart}>
                <Text>♡</Text>
              </View>
            </ImageBackground>
            <View style={styles.info}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {experience.title}
              </Text>
              <Text style={[styles.venue, { color: theme.text2 }]}>
                {experience.venue}
              </Text>
              <View style={styles.bottom}>
                <View>
                  <Text style={[styles.price, { color: theme.gold }]}>
                    {experience.priceLabel ?? formatINR(experience.price)}
                  </Text>
                  <Text style={[styles.forText, { color: theme.text3 }]}>
                    for up to {experience.capacity} people
                  </Text>
                </View>
                <Text style={[styles.rating, { color: theme.gold }]}>
                  ★ {experience.rating} ({experience.reviews})
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function getExperienceImage(id: string, image: string): ImageSourcePropType {
  return id === "kitty-brunch" ? KITTY_PARTY_IMAGE : { uri: image };
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  roundButton: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  roundText: { fontSize: 26, lineHeight: 28 },
  headerTitleWrap: { flex: 1 },
  title: { fontSize: 21, fontWeight: "500" },
  subtitle: { fontSize: 11, marginTop: 2 },
  switchWrap: { width: 54 },
  list: { flexGrow: 1, padding: 14, paddingBottom: 100 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  image: { height: 170 },
  badge: {
    borderRadius: 7,
    left: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    position: "absolute",
    top: 10,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  heart: {
    alignItems: "center",
    backgroundColor: "rgba(13,9,5,0.62)",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    position: "absolute",
    right: 10,
    top: 10,
    width: 32,
  },
  info: { padding: 13 },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  venue: { fontSize: 11, marginBottom: 9 },
  bottom: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  price: { fontSize: 21, fontWeight: "800" },
  forText: { fontSize: 10 },
  rating: {
    backgroundColor: "rgba(201,151,90,0.16)",
    borderRadius: 7,
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
});
