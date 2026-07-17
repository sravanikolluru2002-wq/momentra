export type PortalTone = "amber" | "blue" | "green" | "neutral" | "purple" | "red";

export type PartnerProfileRow = {
  admin_note: string | null;
  business_name: string;
  category: string;
  city: string;
  created_at: string;
  full_name: string;
  id: string;
  kyc_note: string | null;
  kyc_status: string;
  payment_status: string;
  payment_total: number | null;
  phone_number: string;
  status: string;
  status_note: string | null;
  submitted_at: string;
  updated_at: string;
  visibility_status: string;
};

export type AdminProfileRow = {
  created_at: string;
  email: string;
  full_name: string | null;
  id: string;
  role: string;
  updated_at: string;
};

export type SupportTicketRow = {
  created_at: string;
  id: string;
  owner_name: string | null;
  partner_profile_id: string;
  priority: string;
  status: string;
  summary: string;
  updated_at: string;
};

export type PayoutBatchRow = {
  amount: number;
  created_at: string;
  id: string;
  partner_profile_id: string;
  release_eta: string | null;
  status: string;
  updated_at: string;
};

const CATEGORY_FEES: Record<string, number> = {
  banquet: 2999,
  cafe: 1999,
  catering: 1499,
  decorator: 999,
  dining: 2499,
  entertainer: 1499,
  event: 1499,
  florist: 999,
  hotel: 3499,
  makeup: 999,
  photo: 999,
  restaurant: 1999,
  rooftop: 2999,
  terrace: 2999,
  venue: 2999,
};

export function estimateRegistrationFee(category: string) {
  const key = category.trim().toLowerCase();

  for (const [token, value] of Object.entries(CATEGORY_FEES)) {
    if (key.includes(token)) return value;
  }

  return 1999;
}

export function formatCurrency(amount: number | null | undefined) {
  const value = Number(amount ?? 0);

  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function statusTone(status: string | null | undefined): PortalTone {
  const value = (status ?? "").trim().toLowerCase();

  if (["approved", "verified", "paid", "ready to go live", "live", "completed", "released", "closed"].includes(value)) {
    return "green";
  }

  if (["submitted", "open", "in progress"].includes(value)) {
    return "blue";
  }

  if (["under review", "verification pending", "pending", "held"].includes(value)) {
    return "amber";
  }

  if (["needs docs", "needs more docs", "needs documents"].includes(value)) {
    return "purple";
  }

  if (["rejected", "failed", "cancelled"].includes(value)) {
    return "red";
  }

  return "neutral";
}

export function prettifyStatus(status: string | null | undefined) {
  const value = (status ?? "").trim();
  if (!value) return "Not set";

  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatShortDate(value: string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
