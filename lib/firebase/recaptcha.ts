import { Auth, RecaptchaVerifier } from "firebase/auth";

const RECAPTCHA_CONTAINER_ID = "momentra-recaptcha-root";

declare global {
  interface Window {
    __momentraRecaptchaVerifier?: RecaptchaVerifier | null;
  }
}

function getContainers() {
  if (typeof document === "undefined") return [];
  return Array.from(document.querySelectorAll(`[id="${RECAPTCHA_CONTAINER_ID}"]`));
}

function ensureRecaptchaRoot() {
  if (typeof document === "undefined") return null;

  const containers = getContainers();
  const root = containers[0] ?? document.createElement("div");

  if (!root.id) {
    root.id = RECAPTCHA_CONTAINER_ID;
  }

  containers.slice(1).forEach((container) => {
    container.parentElement?.removeChild(container);
  });

  if (!root.parentElement) {
    root.style.height = "1px";
    root.style.left = "-9999px";
    root.style.opacity = "0";
    root.style.overflow = "hidden";
    root.style.position = "absolute";
    root.style.top = "0";
    root.style.width = "1px";
    document.body.appendChild(root);
  }

  return root;
}

export function getRecaptchaVerifier(auth: Auth) {
  if (typeof window === "undefined") {
    throw new Error("Firebase reCAPTCHA is only available in the browser.");
  }

  if (window.__momentraRecaptchaVerifier) {
    console.log("Using existing recaptcha verifier");
    return window.__momentraRecaptchaVerifier;
  }

  const container = ensureRecaptchaRoot();

  if (!container) {
    throw new Error("Firebase reCAPTCHA container is not ready. Please try again.");
  }

  container.innerHTML = "";

  window.__momentraRecaptchaVerifier =
    window.__momentraRecaptchaVerifier ||
    new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
      size: "invisible",
    });

  return window.__momentraRecaptchaVerifier;
}

export function resetRecaptchaVerifier() {
  if (typeof window === "undefined") return;

  window.__momentraRecaptchaVerifier?.clear();
  window.__momentraRecaptchaVerifier = null;

  const container = typeof document === "undefined" ? null : document.getElementById(RECAPTCHA_CONTAINER_ID);
  if (container) {
    container.innerHTML = "";
  }
}
