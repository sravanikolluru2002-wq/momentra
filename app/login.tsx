import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useMomentraTheme } from "@/contexts/momentra-theme";

const DARK = {
  bg: "#0D0905",
  panel: "rgba(255,255,255,0.05)",
  panelBorder: "rgba(201,151,90,0.18)",
  text: "#F2E8D9",
  text2: "rgba(242,232,217,0.62)",
  muted: "rgba(242,232,217,0.42)",
  field: "rgba(255,255,255,0.06)",
  fieldBorder: "rgba(201,151,90,0.22)",
  featureBg: "rgba(192,57,43,0.12)",
  featureBorder: "rgba(201,151,90,0.16)",
  divider: "rgba(201,151,90,0.14)",
  red: "#C0392B",
  red2: "#8E332A",
  gold: "#C9975A",
  shadow: "#000000",
};

const LIGHT = {
  bg: "#F8F2EC",
  panel: "#FFFDFB",
  panelBorder: "#E8DDD4",
  text: "#33211A",
  text2: "#705F55",
  muted: "#9B897C",
  field: "#FDF9F5",
  fieldBorder: "#DED1C7",
  featureBg: "#F8F2EC",
  featureBorder: "#EEE4DB",
  divider: "#E9DDD4",
  red: "#7B2E26",
  red2: "#8E332A",
  gold: "#947C6C",
  shadow: "#4B241C",
};

export default function LoginScreen() {
  const router = useRouter();
  const { isDark } = useMomentraTheme();
  const [phone, setPhone] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const theme = isDark ? DARK : LIGHT;

  function sendOTP() {
    if (phone.length !== 10) {
      Alert.alert("Enter a valid 10-digit mobile number");
      return;
    }

    setShowOtp(true);
  }

  async function verifyOTP() {
    if (otp.length !== 6) {
      Alert.alert("Enter the 6-digit OTP");
      return;
    }

    if (otp !== "123456") {
      Alert.alert("Invalid OTP. Use 123456 for testing.");
      return;
    }

    const onboardingProfile = await AsyncStorage.getItem("@momentra_profile");
    await AsyncStorage.setItem("@momentra_phone", `+91${phone}`);
    router.replace(onboardingProfile ? "/home" : "/onboarding");
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.bg }]}>
      <LinearGradient
        colors={
          isDark
            ? ["#3A0906", "#160907", "#050302"]
            : ["#FFF8F2", "#F7E7DA", "#FFFDFB"]
        }
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[
          styles.backgroundGlow,
          {
            backgroundColor: isDark
              ? "rgba(192,57,43,0.18)"
              : "rgba(192,57,43,0.08)",
          },
        ]}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandBlock}>
            <Image
              resizeMode="contain"
              source={require("../assets/logo.png")}
              style={styles.logoImage}
            />
            <Text style={[styles.phonetic, { color: theme.gold }]}>
              {"/'moh-men-truh/"}
            </Text>
            <Text style={[styles.tagline, { color: theme.text }]}>
              Curated celebration venues, experiences, and details in a single
              beautiful booking flow.
            </Text>
          </View>

          <View
            style={[
              styles.panel,
              {
                backgroundColor: theme.panel,
                borderColor: theme.panelBorder,
                shadowColor: theme.shadow,
              },
            ]}
          >
            <View style={styles.features}>
              <View
                style={[
                  styles.feature,
                  {
                    backgroundColor: theme.featureBg,
                    borderColor: theme.featureBorder,
                  },
                ]}
              >
                <Text style={[styles.featureIcon, { color: theme.red2 }]}>01</Text>
                <Text style={[styles.featureText, { color: theme.text }]}>
                  Verified celebration venues
                </Text>
              </View>
              <View
                style={[
                  styles.feature,
                  {
                    backgroundColor: theme.featureBg,
                    borderColor: theme.featureBorder,
                  },
                ]}
              >
                <Text style={[styles.featureIcon, { color: theme.red2 }]}>02</Text>
                <Text style={[styles.featureText, { color: theme.text }]}>
                  Curated add-ons and experiences
                </Text>
              </View>
              <View
                style={[
                  styles.feature,
                  {
                    backgroundColor: theme.featureBg,
                    borderColor: theme.featureBorder,
                  },
                ]}
              >
                <Text style={[styles.featureIcon, { color: theme.red2 }]}>03</Text>
                <Text style={[styles.featureText, { color: theme.text }]}>
                  Instant booking with secure checkout
                </Text>
              </View>
            </View>

            {!showOtp ? (
              <View style={styles.form}>
                <Text style={[styles.label, { color: theme.text2 }]}>
                  Mobile number
                </Text>

                <View style={styles.phoneRow}>
                  <View
                    style={[
                      styles.countryBox,
                      {
                        backgroundColor: theme.field,
                        borderColor: theme.fieldBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.countryText, { color: theme.text }]}>+91</Text>
                  </View>

                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.field,
                        borderColor: theme.fieldBorder,
                        color: theme.text,
                      },
                    ]}
                    placeholder="Enter 10-digit number"
                    placeholderTextColor={theme.muted}
                    keyboardType="number-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={(text) =>
                      setPhone(text.replace(/[^0-9]/g, ""))
                    }
                  />
                </View>

                <Pressable
                  style={[styles.primaryButton, { backgroundColor: theme.red2 }]}
                  onPress={sendOTP}
                  android_ripple={{ color: "rgba(255,255,255,0.14)" }}
                  unstable_pressDelay={0}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                </Pressable>

                <View style={styles.dividerRow}>
                  <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                  <Text style={[styles.or, { color: theme.muted }]}>or</Text>
                  <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                </View>

                <Pressable
                  style={[
                    styles.googleButton,
                    {
                      backgroundColor: theme.field,
                      borderColor: theme.fieldBorder,
                    },
                  ]}
                  onPress={() => Alert.alert("Google sign-in coming soon")}
                  android_ripple={{ color: "rgba(201,151,90,0.12)" }}
                >
                  <Text style={[styles.googleText, { color: theme.text }]}>
                    Continue with Google
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={[styles.otpTitle, { color: theme.text }]}>
                  Verify your number
                </Text>
                <Text style={[styles.otpHint, { color: theme.text2 }]}>
                  We sent a 6-digit OTP to +91 {phone.slice(0, 5)}XXXXX
                </Text>

                <TextInput
                  style={[
                    styles.otpInput,
                    {
                      backgroundColor: theme.field,
                      borderColor: theme.fieldBorder,
                      color: theme.text,
                    },
                  ]}
                  placeholder="000000"
                  placeholderTextColor={theme.muted}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ""))}
                />
                <Text style={[styles.devNote, { color: theme.gold }]}>
                  Use 123456 for testing
                </Text>

                <Pressable
                  style={[styles.primaryButton, { backgroundColor: theme.red2 }]}
                  onPress={verifyOTP}
                  android_ripple={{ color: "rgba(255,255,255,0.14)" }}
                >
                  <Text style={styles.primaryButtonText}>Verify and enter</Text>
                </Pressable>

                <Pressable onPress={() => setOtp("")}>
                  <Text style={[styles.resend, { color: theme.red }]}>Resend OTP</Text>
                </Pressable>
              </View>
            )}

            <Text style={[styles.disclaimer, { color: theme.muted }]}>
              By continuing you agree to the Momentra Terms and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8F2EC",
  },
  backgroundGlow: {
    borderRadius: 180,
    height: 360,
    position: "absolute",
    right: -140,
    top: -80,
    width: 360,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 34,
  },
  brandBlock: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoImage: {
    height: 128,
    marginBottom: 10,
    width: 306,
  },
  phonetic: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  tagline: {
    alignSelf: "center",
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 330,
    textAlign: "center",
  },
  panel: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.18,
    shadowRadius: 34,
    elevation: 10,
  },
  features: {
    gap: 10,
    marginBottom: 28,
  },
  feature: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  featureIcon: {
    fontSize: 12,
    fontWeight: "800",
    width: 24,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  phoneRow: {
    flexDirection: "row",
    gap: 10,
  },
  countryBox: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    minWidth: 68,
    paddingHorizontal: 14,
  },
  countryText: {
    fontSize: 15,
    fontWeight: "700",
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    minHeight: 58,
    paddingHorizontal: 16,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 18,
    minHeight: 60,
    justifyContent: "center",
    marginTop: 2,
    shadowColor: "#8E332A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 5,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  dividerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginVertical: 2,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  or: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  googleButton: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 58,
    justifyContent: "center",
  },
  googleText: {
    fontSize: 15,
    fontWeight: "700",
  },
  otpTitle: {
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
  },
  otpHint: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 4,
    textAlign: "center",
  },
  otpInput: {
    borderRadius: 18,
    borderWidth: 1,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 8,
    minHeight: 62,
    paddingHorizontal: 18,
    textAlign: "center",
  },
  devNote: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: -8,
    textAlign: "center",
  },
  resend: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2,
    textAlign: "center",
  },
  disclaimer: {
    fontSize: 11,
    lineHeight: 18,
    marginTop: 22,
    textAlign: "center",
  },
});
