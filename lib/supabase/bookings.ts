import type { User as FirebaseUser } from "firebase/auth";

import { normalizeIndianPhoneNumber } from "@/lib/phone";
import { supabase } from "@/lib/supabase";

export type MomentraBookingStatus =
  | "draft"
  | "requested"
  | "quoted"
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "refunded";

export type MomentraPaymentStatus = "unpaid" | "partial" | "paid" | "failed" | "refunded";

export type MomentraBookingPayload = {
  bookingDate?: string;
  bookingTime?: string;
  city?: string;
  enquiryId?: string;
  estimatedTotal?: number;
  guests?: number;
  metadata?: Record<string, unknown>;
  packageId?: string;
  phoneOverride?: string;
  selectedAddons?: string[];
  selectedFoodItems?: string[];
  selectedRequirements?: string[];
  status?: MomentraBookingStatus;
  title: string;
  venueId?: string;
};

export type MomentraBookingRow = {
  booking_date: string | null;
  booking_reference: string;
  booking_time: string | null;
  city: string | null;
  created_at: string;
  enquiry_id: string | null;
  estimated_total: number;
  firebase_uid: string | null;
  guests: number | null;
  id: string;
  metadata: Record<string, unknown> | null;
  package_id: string | null;
  payment_status: MomentraPaymentStatus;
  phone_number: string | null;
  profile_id: string | null;
  selected_addons: string[] | null;
  selected_food_items: string[] | null;
  selected_requirements: string[] | null;
  status: MomentraBookingStatus;
  title: string;
  updated_at: string;
  venue_id: string | null;
};

const BOOKING_SELECT = "id,profile_id,enquiry_id,package_id,venue_id,firebase_uid,phone_number,booking_reference,title,city,booking_date,booking_time,guests,estimated_total,selected_requirements,selected_addons,selected_food_items,status,payment_status,metadata,created_at,updated_at";

export async function createMomentraBooking(payload: MomentraBookingPayload, user?: FirebaseUser | null) {
  const phoneNumber = normalizeIndianPhoneNumber(payload.phoneOverride ?? user?.phoneNumber ?? null);
  const profileId = await findProfileId(user?.uid, phoneNumber);

  const { data, error } = await supabase
    .from("momentra_bookings")
    .insert({
      booking_date: payload.bookingDate ?? null,
      booking_time: payload.bookingTime ?? null,
      city: payload.city ?? null,
      enquiry_id: payload.enquiryId ?? null,
      estimated_total: Math.max(Math.round(payload.estimatedTotal ?? 0), 0),
      firebase_uid: user?.uid ?? null,
      guests: payload.guests ?? null,
      metadata: payload.metadata ?? {},
      package_id: payload.packageId ?? null,
      phone_number: phoneNumber || null,
      profile_id: profileId,
      selected_addons: payload.selectedAddons ?? [],
      selected_food_items: payload.selectedFoodItems ?? [],
      selected_requirements: payload.selectedRequirements ?? [],
      status: payload.status ?? "requested",
      title: payload.title,
      venue_id: payload.venueId ?? null,
    })
    .select(BOOKING_SELECT)
    .single();

  if (error) throw error;
  return data as MomentraBookingRow;
}

export async function listMomentraBookingsForUser(user?: FirebaseUser | null) {
  const phoneNumber = normalizeIndianPhoneNumber(user?.phoneNumber ?? null);
  const profileId = await findProfileId(user?.uid, phoneNumber);

  let query = supabase
    .from("momentra_bookings")
    .select(BOOKING_SELECT)
    .order("created_at", { ascending: false });

  if (profileId) {
    query = query.eq("profile_id", profileId);
  } else if (user?.uid) {
    query = query.eq("firebase_uid", user.uid);
  } else if (phoneNumber) {
    query = query.eq("phone_number", phoneNumber);
  } else {
    return [];
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MomentraBookingRow[];
}

export async function updateMomentraBookingStatus(
  bookingId: string,
  patch: { paymentStatus?: MomentraPaymentStatus; status?: MomentraBookingStatus }
) {
  const record: Record<string, string> = {};
  if (patch.status) record.status = patch.status;
  if (patch.paymentStatus) record.payment_status = patch.paymentStatus;

  const { error } = await supabase.from("momentra_bookings").update(record).eq("id", bookingId);
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
