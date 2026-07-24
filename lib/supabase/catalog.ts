import { supabase } from "@/lib/supabase";

export type CatalogStatus = "demo" | "draft" | "review" | "live" | "hidden";

export type MomentraVenue = {
  address: string | null;
  amenities: string[] | null;
  area: string | null;
  capacity_max: number | null;
  capacity_min: number | null;
  city: string;
  description: string | null;
  gallery: string[] | null;
  id: string;
  image_url: string | null;
  metadata: Record<string, unknown> | null;
  price_label: string | null;
  slug: string;
  status: CatalogStatus;
  title: string;
  venue_type: string;
};

export type MomentraPackage = {
  capacity: number | null;
  city: string;
  description: string | null;
  duration: string | null;
  gallery: string[] | null;
  id: string;
  image_url: string | null;
  inclusions: string[] | null;
  metadata: Record<string, unknown> | null;
  minimum_guests: number | null;
  occasion_id: string;
  package_type: string;
  price: number | null;
  price_label: string | null;
  requirements: string[] | null;
  short_description: string | null;
  slug: string;
  status: CatalogStatus;
  title: string;
  venue_id: string | null;
};

export type MomentraAddon = {
  addon_type: string;
  description: string | null;
  icon_label: string | null;
  id: string;
  metadata: Record<string, unknown> | null;
  price: number | null;
  price_label: string | null;
  slug: string;
  status: CatalogStatus;
  title: string;
};

export type MomentraFoodMenuItem = {
  category: string;
  description: string | null;
  dietary_tags: string[] | null;
  food_type: string;
  id: string;
  metadata: Record<string, unknown> | null;
  price: number | null;
  price_label: string | null;
  slug: string;
  status: CatalogStatus;
  title: string;
};

const VISIBLE_STATUSES: CatalogStatus[] = ["demo", "live"];
const VENUE_SELECT = "id,slug,title,city,area,address,venue_type,status,capacity_min,capacity_max,price_label,description,image_url,gallery,amenities,metadata";
const PACKAGE_SELECT = "id,slug,occasion_id,venue_id,title,city,status,package_type,price,price_label,minimum_guests,capacity,duration,short_description,description,image_url,gallery,inclusions,requirements,metadata";
const ADDON_SELECT = "id,slug,title,addon_type,status,price,price_label,description,icon_label,metadata";
const FOOD_SELECT = "id,slug,title,food_type,category,status,price,price_label,description,dietary_tags,metadata";

export async function listCatalogVenues(filters: { city?: string; status?: CatalogStatus[] } = {}) {
  let query = supabase
    .from("momentra_venues")
    .select(VENUE_SELECT)
    .in("status", filters.status ?? VISIBLE_STATUSES)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (filters.city) query = query.eq("city", filters.city);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MomentraVenue[];
}

export async function listCatalogPackages(filters: { city?: string; occasionId?: string; status?: CatalogStatus[] } = {}) {
  let query = supabase
    .from("momentra_packages")
    .select(PACKAGE_SELECT)
    .in("status", filters.status ?? VISIBLE_STATUSES)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (filters.city) query = query.eq("city", filters.city);
  if (filters.occasionId) query = query.eq("occasion_id", filters.occasionId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MomentraPackage[];
}

export async function getCatalogPackageBySlug(slug: string) {
  const { data, error } = await supabase
    .from("momentra_packages")
    .select(PACKAGE_SELECT)
    .eq("slug", slug)
    .in("status", VISIBLE_STATUSES)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as MomentraPackage | null;
}

export async function listPackageAddons(packageId: string) {
  const { data, error } = await supabase
    .from("momentra_package_addons")
    .select(`included,sort_order,addon:momentra_addons(${ADDON_SELECT})`)
    .eq("package_id", packageId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    included: Boolean(row.included),
    item: row.addon as MomentraAddon,
  }));
}

export async function listPackageFoodItems(packageId: string) {
  const { data, error } = await supabase
    .from("momentra_package_food_items")
    .select(`included,sort_order,food_item:momentra_food_menu_items(${FOOD_SELECT})`)
    .eq("package_id", packageId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    included: Boolean(row.included),
    item: row.food_item as MomentraFoodMenuItem,
  }));
}
