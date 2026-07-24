import { User } from "firebase/auth";

import { normalizeIndianPhoneNumber } from "@/lib/phone";
import { supabase } from "@/lib/supabase";

export type MomentraEnquiryPayload = {
  addOns?: string[];
  bookingDate?: string;
  bookingTime?: string;
  city?: string;
  enquiryType?: string;
  estimatedTotal?: number;
  experienceId?: string;
  experienceTitle?: string;
  foodItems?: string[];
  guests?: number;
  notes?: string;
  occasionId?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  requirements?: string[];
  source?: string;
  summary?: Record<string, string | number | boolean | null | undefined>;
  venue?: string;
};

export type MomentraEnquiryRow = {
  add_ons: string[] | null;
  admin_note: string | null;
  booking_date: string | null;
  booking_time: string | null;
  city: string | null;
  created_at: string;
  enquiry_type: string;
  estimated_total: number | null;
  experience_id: string | null;
  experience_title: string | null;
  firebase_uid: string | null;
  food_items: string[] | null;
  guests: number | null;
  id: string;
  notes: string | null;
  occasion_id: string | null;
  phone_number: string | null;
  priority: string;
  profile_id: string | null;
  requirements: string[] | null;
  source: string;
  status: string;
  summary: Record<string, unknown> | null;
  updated_at: string;
  venue: string | null;
};

const ENQUIRY_SELECT = "id,profile_id,firebase_uid,phone_number,source,enquiry_type,occasion_id,experience_id,experience_title,venue,city,booking_date,booking_time,guests,estimated_total,requirements,add_ons,food_items,summary,notes,status,priority,admin_note,created_at,updated_at";

export async function createMomentraEnquiry(payload: MomentraEnquiryPayload, user?: User | null) {
  const phoneNumber = normalizeIndianPhoneNumber(user?.phoneNumber ?? null);
  const profileId = await findProfileId(user?.uid, phoneNumber);
  const record = {
    add_ons: payload.addOns ?? [],
    booking_date: payload.bookingDate ?? null,
    booking_time: payload.bookingTime ?? null,
    city: payload.city ?? null,
    enquiry_type: payload.enquiryType ?? "general",
    estimated_total: payload.estimatedTotal ? Math.round(payload.estimatedTotal) : null,
    experience_id: payload.experienceId ?? null,
    experience_title: payload.experienceTitle ?? null,
    firebase_uid: user?.uid ?? null,
    food_items: payload.foodItems ?? [],
    guests: payload.guests ?? null,
    notes: payload.notes?.trim() || null,
    occasion_id: payload.occasionId ?? null,
    phone_number: phoneNumber || null,
    priority: payload.priority ?? "normal",
    profile_id: profileId,
    requirements: payload.requirements ?? [],
    source: payload.source ?? "app",
    status: "new",
    summary: cleanSummary(payload.summary ?? {}),
    venue: payload.venue ?? null,
  };

  const { data, error } = await supabase
    .from("momentra_enquiries")
    .insert(record)
    .select("id")
    .single();

  if (error) throw error;
  return String(data.id);
}

export async function listMomentraEnquiries() {
  const { data, error } = await supabase
    .from("momentra_enquiries")
    .select(ENQUIRY_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as MomentraEnquiryRow[];
}

export async function updateMomentraEnquiryStatus(enquiryId: string, patch: { adminNote?: string | null; status?: string }) {
  const { error } = await supabase
    .from("momentra_enquiries")
    .update({
      admin_note: patch.adminNote,
      status: patch.status,
    })
    .eq("id", enquiryId);

  if (error) throw error;
}

async function findProfileId(firebaseUid?: string | null, phoneNumber?: string | null) {
  if (!firebaseUid && !phoneNumber) return null;

  let query = supabase.from("profiles").select("id").limit(1);

  if (firebaseUid) {
    query = query.eq("firebase_uid", firebaseUid);
  } else if (phoneNumber) {
    query = query.eq("phone_number", phoneNumber);
  }

  const { data, error } = await query.maybeSingle();
  if (error) return null;
  return data?.id ?? null;
}

function cleanSummary(summary: Record<string, string | number | boolean | null | undefined>) {
  return Object.fromEntries(
    Object.entries(summary).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}
