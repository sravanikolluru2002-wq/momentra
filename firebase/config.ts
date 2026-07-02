import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "missing-api-key",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "missing-app-id",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "missing-auth-domain",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "missing-sender-id",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "missing-project-id",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "missing-storage-bucket",
};

export const hasFirebaseEnv = Boolean(
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET &&
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID
);

if (!hasFirebaseEnv) {
  console.warn(
    "[Momentra auth] Missing Firebase env vars. Add EXPO_PUBLIC_FIREBASE_* values before using phone OTP."
  );
}

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);

if (typeof window !== "undefined") {
  setPersistence(firebaseAuth, browserLocalPersistence).catch((error) => {
    console.warn("[Momentra auth] Firebase persistence setup failed", error);
  });
}
