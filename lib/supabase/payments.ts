import type { User as FirebaseUser } from "firebase/auth";

import { normalizeIndianPhoneNumber } from "@/lib/phone";
import { supabase } from "@/lib/supabase";

export type PaymentOrderStatus = "created" | "attempted" | "paid" | "failed" | "cancelled" | "refunded";

export type PaymentOrderPayload = {
  amount: number;
  bookingId?: string;
  currency?: string;
  enquiryId?: string;
  metadata?: Record<string, unknown>;
  phoneOverride?: string;
  provider?: "razorpay" | "manual" | "cashfree" | "stripe";
  providerOrderId?: string;
  status?: PaymentOrderStatus;
};

export type PaymentOrderRow = {
  amount: number;
  booking_id: string | null;
  created_at: string;
  currency: string;
  enquiry_id: string | null;
  id: string;
  metadata: Record<string, unknown> | null;
  profile_id: string | null;
  provider: string;
  provider_order_id: string | null;
  status: PaymentOrderStatus;
  updated_at: string;
};

const PAYMENT_ORDER_SELECT = "id,profile_id,booking_id,enquiry_id,provider,provider_order_id,amount,currency,status,metadata,created_at,updated_at";

export async function createPaymentOrder(payload: PaymentOrderPayload, user?: FirebaseUser | null) {
  const phoneNumber = normalizeIndianPhoneNumber(payload.phoneOverride ?? user?.phoneNumber ?? null);
  const profileId = await findProfileId(user?.uid, phoneNumber);

  const { data, error } = await supabase
    .from("payment_orders")
    .insert({
      amount: Math.max(Math.round(payload.amount), 0),
      booking_id: payload.bookingId ?? null,
      currency: payload.currency ?? "INR",
      enquiry_id: payload.enquiryId ?? null,
      metadata: payload.metadata ?? {},
      profile_id: profileId,
      provider: payload.provider ?? "razorpay",
      provider_order_id: payload.providerOrderId ?? null,
      status: payload.status ?? "created",
    })
    .select(PAYMENT_ORDER_SELECT)
    .single();

  if (error) throw error;
  return data as PaymentOrderRow;
}

export async function updatePaymentOrderStatus(paymentOrderId: string, status: PaymentOrderStatus, metadata?: Record<string, unknown>) {
  const patch: Record<string, unknown> = { status };
  if (metadata) patch.metadata = metadata;

  const { error } = await supabase.from("payment_orders").update(patch).eq("id", paymentOrderId);
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
