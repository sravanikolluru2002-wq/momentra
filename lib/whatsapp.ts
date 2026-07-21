import { Linking } from "react-native";

export type WhatsAppCategory =
  | "birthday"
  | "corporate"
  | "dateNight"
  | "general"
  | "houseParty"
  | "kitty"
  | "party"
  | "venue";

const WHATSAPP_NUMBER = "917670926935";

export const WHATSAPP_MESSAGES: Record<WhatsAppCategory, string> = {
  birthday: "Hi Momentra, I want to plan a birthday celebration.",
  corporate: "Hi Momentra, I want to plan a corporate event.",
  dateNight: "Hi Momentra, I want to plan a date night experience.",
  general: "Hi Momentra, I want help planning an experience.",
  houseParty: "Hi Momentra, I want to plan a house party at home.",
  kitty: "Hi Momentra, I want to plan a Kitty Circle event.",
  party: "Hi Momentra, I want to plan a group party.",
  venue: "Hi Momentra, I’m interested in this venue. Please share availability and details.",
};

export function getWhatsAppUrl(category: WhatsAppCategory) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGES[category])}`;
}

export function openWhatsApp(category: WhatsAppCategory, errorLabel = "WHATSAPP OPEN ERROR") {
  Linking.openURL(getWhatsAppUrl(category)).catch((error) => {
    console.error(errorLabel, error);
  });
}

export function getWhatsAppMessageUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppMessage(message: string, errorLabel = "WHATSAPP OPEN ERROR") {
  Linking.openURL(getWhatsAppMessageUrl(message)).catch((error) => {
    console.error(errorLabel, error);
  });
}

export function whatsappCategoryFromOccasion(occasionId?: string): WhatsAppCategory {
  switch (occasionId) {
    case "birthday":
      return "birthday";
    case "corporate":
      return "corporate";
    case "datenight":
    case "dateNight":
      return "dateNight";
    case "kitty":
      return "kitty";
    case "house-party":
      return "houseParty";
    case "party":
      return "party";
    default:
      return "general";
  }
}
