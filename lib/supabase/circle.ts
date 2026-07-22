import { supabase } from "@/lib/supabase";

export type PublicCircleProfile = {
  city: string | null;
  created_at: string | null;
  full_name: string | null;
  id: string;
  momentra_id: string | null;
};

export type CircleRequestStatus = "pending" | "accepted" | "declined" | "cancelled";

export type CircleRequest = {
  created_at: string;
  id: string;
  message: string | null;
  receiver: PublicCircleProfile | null;
  receiver_profile_id: string;
  requester: PublicCircleProfile | null;
  requester_profile_id: string;
  responded_at: string | null;
  status: CircleRequestStatus;
};

export type CircleMember = {
  created_at: string;
  id: string;
  member: PublicCircleProfile | null;
  member_profile_id: string;
  owner_profile_id: string;
};

export type SharedPaymentPlan = {
  created_at: string;
  id: string;
  members: SharedPaymentMember[];
  owner_profile_id: string;
  split_type: "equal" | "custom";
  status: "collecting" | "confirmed" | "completed" | "threshold_pending" | "cancelled";
  threshold: number;
  title: string;
  total_amount: number;
};

export type SharedPaymentMember = {
  id: string;
  paid_at: string | null;
  profile: PublicCircleProfile | null;
  profile_id: string;
  share_amount: number;
  status: "pending" | "paid" | "declined";
};

type DbCircleRequest = Omit<CircleRequest, "receiver" | "requester"> & {
  receiver: PublicCircleProfile[] | PublicCircleProfile | null;
  requester: PublicCircleProfile[] | PublicCircleProfile | null;
};

type DbCircleMember = Omit<CircleMember, "member"> & {
  member: PublicCircleProfile[] | PublicCircleProfile | null;
};

type DbSharedPaymentPlan = Omit<SharedPaymentPlan, "members"> & {
  members: Array<Omit<SharedPaymentMember, "profile"> & {
    profile: PublicCircleProfile[] | PublicCircleProfile | null;
  }> | null;
};

const PUBLIC_PROFILE_SELECT = "id,momentra_id,full_name,city,created_at";
const REQUEST_SELECT = `
  id,
  requester_profile_id,
  receiver_profile_id,
  status,
  message,
  responded_at,
  created_at,
  requester:profiles!profile_circle_requests_requester_profile_id_fkey(${PUBLIC_PROFILE_SELECT}),
  receiver:profiles!profile_circle_requests_receiver_profile_id_fkey(${PUBLIC_PROFILE_SELECT})
`;
const MEMBER_SELECT = `
  id,
  owner_profile_id,
  member_profile_id,
  created_at,
  member:profiles!profile_circle_members_member_profile_id_fkey(${PUBLIC_PROFILE_SELECT})
`;
const PLAN_SELECT = `
  id,
  owner_profile_id,
  title,
  total_amount,
  split_type,
  threshold,
  status,
  created_at,
  members:shared_payment_members(
    id,
    profile_id,
    share_amount,
    status,
    paid_at,
    profile:profiles!shared_payment_members_profile_id_fkey(${PUBLIC_PROFILE_SELECT})
  )
`;

function singleProfile(value: PublicCircleProfile[] | PublicCircleProfile | null) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function mapCircleRequest(row: DbCircleRequest): CircleRequest {
  return {
    ...row,
    receiver: singleProfile(row.receiver),
    requester: singleProfile(row.requester),
  };
}

function mapCircleMember(row: DbCircleMember): CircleMember {
  return {
    ...row,
    member: singleProfile(row.member),
  };
}

function mapSharedPaymentPlan(row: DbSharedPaymentPlan): SharedPaymentPlan {
  return {
    ...row,
    members: (row.members ?? []).map((member) => ({
      ...member,
      profile: singleProfile(member.profile),
    })),
  };
}

export function normalizeMomentraId(value: string) {
  const compact = value.trim().toUpperCase().replace(/^@/, "").replace(/\s+/g, "");
  if (!compact) return "";
  return compact.startsWith("MOM-") ? compact : `MOM-${compact.replace(/^MOM/, "").replace(/^-/, "")}`;
}

export async function searchProfileByMomentraId(momentraId: string) {
  const normalized = normalizeMomentraId(momentraId);
  if (!normalized) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(PUBLIC_PROFILE_SELECT)
    .eq("momentra_id", normalized)
    .maybeSingle();

  if (error) throw error;
  return data as PublicCircleProfile | null;
}

export async function listCircleRequests(profileId: string) {
  const { data, error } = await supabase
    .from("profile_circle_requests")
    .select(REQUEST_SELECT)
    .or(`requester_profile_id.eq.${profileId},receiver_profile_id.eq.${profileId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapCircleRequest(row as DbCircleRequest));
}

export async function listCircleMembers(profileId: string) {
  const { data, error } = await supabase
    .from("profile_circle_members")
    .select(MEMBER_SELECT)
    .eq("owner_profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapCircleMember(row as DbCircleMember));
}

export async function sendCircleRequest(currentProfileId: string, receiverMomentraId: string) {
  const receiver = await searchProfileByMomentraId(receiverMomentraId);

  if (!receiver) {
    throw new Error("No Momentra profile found with that ID.");
  }

  if (receiver.id === currentProfileId) {
    throw new Error("You cannot send a Circle request to yourself.");
  }

  const existingMember = await supabase
    .from("profile_circle_members")
    .select("id")
    .eq("owner_profile_id", currentProfileId)
    .eq("member_profile_id", receiver.id)
    .maybeSingle();

  if (existingMember.error) throw existingMember.error;
  if (existingMember.data?.id) {
    throw new Error("This profile is already in your Circle.");
  }

  const existingRequest = await supabase
    .from("profile_circle_requests")
    .select("id,status")
    .or(
      `and(requester_profile_id.eq.${currentProfileId},receiver_profile_id.eq.${receiver.id}),and(requester_profile_id.eq.${receiver.id},receiver_profile_id.eq.${currentProfileId})`
    )
    .in("status", ["pending", "accepted"])
    .maybeSingle();

  if (existingRequest.error) throw existingRequest.error;
  if (existingRequest.data?.status === "pending") {
    throw new Error("A Circle request is already pending between you both.");
  }
  if (existingRequest.data?.status === "accepted") {
    throw new Error("This profile is already connected to your Circle.");
  }

  const { data, error } = await supabase
    .from("profile_circle_requests")
    .insert({
      message: "I would like to add you to my Momentra Circle.",
      receiver_profile_id: receiver.id,
      requester_profile_id: currentProfileId,
      status: "pending",
    })
    .select(REQUEST_SELECT)
    .single();

  if (error) throw error;
  return mapCircleRequest(data as DbCircleRequest);
}

export async function respondToCircleRequest(requestId: string, currentProfileId: string, action: "accept" | "decline") {
  const { data: request, error: requestError } = await supabase
    .from("profile_circle_requests")
    .select("id,requester_profile_id,receiver_profile_id,status")
    .eq("id", requestId)
    .eq("receiver_profile_id", currentProfileId)
    .single();

  if (requestError) throw requestError;
  if (request.status !== "pending") {
    throw new Error("This request has already been handled.");
  }

  const nextStatus = action === "accept" ? "accepted" : "declined";
  const { error: updateError } = await supabase
    .from("profile_circle_requests")
    .update({
      responded_at: new Date().toISOString(),
      status: nextStatus,
    })
    .eq("id", requestId);

  if (updateError) throw updateError;

  if (action === "accept") {
    const { error: memberError } = await supabase
      .from("profile_circle_members")
      .upsert([
        {
          member_profile_id: request.requester_profile_id,
          owner_profile_id: request.receiver_profile_id,
          request_id: request.id,
        },
        {
          member_profile_id: request.receiver_profile_id,
          owner_profile_id: request.requester_profile_id,
          request_id: request.id,
        },
      ], { onConflict: "owner_profile_id,member_profile_id" });

    if (memberError) throw memberError;
  }
}

export async function listSharedPaymentPlans(profileId: string) {
  const { data: owned, error: ownedError } = await supabase
    .from("shared_payment_plans")
    .select(PLAN_SELECT)
    .eq("owner_profile_id", profileId)
    .order("created_at", { ascending: false });

  if (ownedError) throw ownedError;

  const { data: invitedRows, error: invitedError } = await supabase
    .from("shared_payment_members")
    .select(`plan:shared_payment_plans(${PLAN_SELECT})`)
    .eq("profile_id", profileId);

  if (invitedError) throw invitedError;

  const invitedPlans = (invitedRows ?? [])
    .map((row) => (row as { plan?: DbSharedPaymentPlan[] | DbSharedPaymentPlan | null }).plan)
    .flatMap((plan) => Array.isArray(plan) ? plan : plan ? [plan] : []);

  const byId = new Map<string, SharedPaymentPlan>();
  [...(owned ?? []), ...invitedPlans].forEach((row) => {
    const plan = mapSharedPaymentPlan(row as DbSharedPaymentPlan);
    byId.set(plan.id, plan);
  });

  return Array.from(byId.values()).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export async function createSharedPaymentPlan(
  currentProfileId: string,
  selectedProfileIds: string[],
  payload: {
    splitType: "equal" | "custom";
    threshold: number;
    title: string;
    totalAmount: number;
  }
) {
  const memberIds = Array.from(new Set([currentProfileId, ...selectedProfileIds]));
  if (!memberIds.length) throw new Error("Select at least one member.");

  const perHead = memberIds.length ? Math.ceil(payload.totalAmount / memberIds.length) : payload.totalAmount;

  const { data: plan, error: planError } = await supabase
    .from("shared_payment_plans")
    .insert({
      owner_profile_id: currentProfileId,
      split_type: payload.splitType,
      status: "threshold_pending",
      threshold: Math.min(payload.threshold, memberIds.length),
      title: payload.title,
      total_amount: payload.totalAmount,
    })
    .select("id")
    .single();

  if (planError) throw planError;

  const { error: membersError } = await supabase
    .from("shared_payment_members")
    .insert(memberIds.map((profileId) => ({
      paid_at: profileId === currentProfileId ? new Date().toISOString() : null,
      plan_id: plan.id,
      profile_id: profileId,
      share_amount: perHead,
      status: profileId === currentProfileId ? "paid" : "pending",
    })));

  if (membersError) throw membersError;

  return plan.id as string;
}
