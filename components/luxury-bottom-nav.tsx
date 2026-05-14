import {
  Compass,
  House,
  Sparkles,
  TicketPercent,
  UserCircle,
  type LucideIcon,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type NavKey = "Home" | "Explore" | "Moments" | "Offers" | "Profile";

type NavItem = {
  icon: LucideIcon;
  label: NavKey;
  route: "/home" | "/explore" | "/moments" | "/offers" | "/profile";
};

const NAV_ITEMS: NavItem[] = [
  { icon: House, label: "Home", route: "/home" },
  { icon: Compass, label: "Explore", route: "/explore" },
  { icon: Sparkles, label: "Moments", route: "/moments" },
  { icon: TicketPercent, label: "Offers", route: "/offers" },
  { icon: UserCircle, label: "Profile", route: "/profile" },
];

type LuxuryBottomNavProps = {
  active: NavKey;
};

export function LuxuryBottomNav({ active }: LuxuryBottomNavProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const webWidth = Math.min(Math.max(width - 48, 320), 760);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        isWeb
          ? {
              bottom: 22,
              left: Math.max((width - webWidth) / 2, 24),
              right: undefined,
              width: webWidth,
            }
          : {
              bottom: Math.max(insets.bottom, Platform.OS === "ios" ? 12 : 10),
            },
      ]}
    >
      <View style={[styles.bar, isWeb && styles.webBar]}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.label === active;

          return (
            <LuxuryNavItem
              key={item.label}
              item={item}
              active={isActive}
              onPress={() => {
                if (!isActive) router.push(item.route as never);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function LuxuryNavItem({
  active,
  item,
  onPress,
}: {
  active: boolean;
  item: NavItem;
  onPress: () => void;
}) {
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;
  const Icon = item.icon;

  useEffect(() => {
    Animated.spring(progress, {
      damping: 15,
      mass: 0.8,
      stiffness: 170,
      toValue: active ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [active, progress]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  return (
    <Pressable onPress={onPress} style={styles.item}>
      <Animated.View
        style={[
          styles.iconShell,
          active && styles.iconShellActive,
          {
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        {active ? <View style={styles.activeGlow} /> : null}
        <Icon
          color={active ? "#E4B97A" : "rgba(242,232,217,0.46)"}
          size={active ? 23 : 21}
          strokeWidth={active ? 2.15 : 1.75}
        />
      </Animated.View>
      <Text style={[styles.label, active ? styles.labelActive : styles.labelIdle]}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    left: 14,
    position: "absolute",
    right: 14,
    zIndex: 80,
  },
  bar: {
    alignItems: "center",
    backgroundColor: "rgba(13,9,5,0.82)",
    borderColor: "rgba(201,151,90,0.22)",
    borderRadius: 26,
    borderWidth: 1,
    elevation: 18,
    flexDirection: "row",
    height: 72,
    justifyContent: "space-between",
    overflow: "hidden",
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 24,
  },
  webBar: {
    backgroundColor: "rgba(13,9,5,0.72)",
    borderColor: "rgba(228,185,122,0.22)",
    height: 76,
  },
  item: {
    alignItems: "center",
    flex: 1,
    gap: 4,
    height: 62,
    justifyContent: "center",
  },
  iconShell: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    position: "relative",
    width: 42,
  },
  iconShellActive: {
    backgroundColor: "rgba(192,57,43,0.13)",
    borderColor: "rgba(228,185,122,0.24)",
    borderWidth: 1,
  },
  activeGlow: {
    backgroundColor: "rgba(192,57,43,0.34)",
    borderRadius: 16,
    height: 28,
    position: "absolute",
    shadowColor: "#C0392B",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    width: 32,
  },
  label: {
    fontSize: 9.5,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  labelActive: {
    color: "#E4B97A",
  },
  labelIdle: {
    color: "rgba(242,232,217,0.42)",
  },
});
