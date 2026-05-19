import { Auth, RecaptchaVerifier } from "firebase/auth";

const RECAPTCHA_CONTAINER_ID = "recaptcha-container";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier | null;
  }
}

function getContainers() {
  if (typeof document === "undefined") return [];
  return Array.from(document.querySelectorAll(`[id="${RECAPTCHA_CONTAINER_ID}"]`));
}

export function ensureSingleRecaptchaContainer() {
  const containers = getContainers();

  containers.slice(1).forEach((container) => {
    container.parentElement?.removeChild(container);
  });

  return containers[0] ?? null;
}

export function getRecaptchaVerifier(auth: Auth) {
  if (typeof window === "undefined") {
    throw new Error("Firebase reCAPTCHA is only available in the browser.");
  }

  if (window.recaptchaVerifier) {
    console.log("Using existing recaptcha verifier");
    return window.recaptchaVerifier;
  }

  const container = ensureSingleRecaptchaContainer();

  if (!container) {
    throw new Error("Firebase reCAPTCHA container is not ready. Please try again.");
  }

  container.innerHTML = "";

  window.recaptchaVerifier =
    window.recaptchaVerifier ||
    new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
      size: "invisible",
    });

  return window.recaptchaVerifier;
}

export function resetRecaptchaVerifier() {
  if (typeof window === "undefined") return;

  window.recaptchaVerifier?.clear();
  window.recaptchaVerifier = null;

  const container = ensureSingleRecaptchaContainer();
  if (container) {
    container.innerHTML = "";
  }
}

export { RECAPTCHA_CONTAINER_ID };
