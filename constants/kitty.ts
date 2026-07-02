export type KittyPackage = {
  badge: string;
  desc: string;
  id: string;
  includes: KittyInclusion[];
  name: string;
  perHead: number;
};

export type KittyInclusion = {
  desc: string;
  icon: string;
  name: string;
};

export type KittyReview = {
  date: string;
  group: string;
  name: string;
  rating: number;
  text: string;
};

export type KittyVenue = {
  amenities: string[];
  badges: string[];
  capacity: string;
  desc: string;
  duration: string;
  gallery: string[];
  id: string;
  image: string;
  location: string;
  name: string;
  rating: number;
  reviewList: KittyReview[];
  reviews: number;
};

export const KITTY_PACKAGES: KittyPackage[] = [
  {
    id: "bloom",
    name: "The Bloom",
    badge: "Most Booked",
    desc: "A polished brunch-first package for monthly kitty circles that want a beautiful setup without heavy planning. It covers the essentials: decor, food, welcome drinks, and enough photography to capture the best group moments.",
    includes: [
      { icon: "🌸", name: "Floral decor", desc: "Fresh-looking table styling, themed accents, and photo-ready corners for effortless group pictures." },
      { icon: "🥂", name: "Welcome drinks", desc: "A welcome round for every guest so the gathering feels hosted from the first minute." },
      { icon: "🍽️", name: "3-course brunch", desc: "A balanced brunch menu suited for relaxed afternoon conversations and repeat monthly meetups." },
      { icon: "📸", name: "1hr photography", desc: "A short candid coverage slot for group portraits, decor shots, and host highlights." },
    ],
    perHead: 1800,
  },
  {
    id: "luxe",
    name: "The Luxe",
    badge: "Premium",
    desc: "A richer evening package for groups that want more ambience, better food pacing, and entertainment built in. Best for milestone kitty nights, birthdays inside the circle, and premium dinner gatherings.",
    includes: [
      { icon: "🎭", name: "Themed decor", desc: "A coordinated theme with table styling, florals, candles, and color-matched visual details." },
      { icon: "🍷", name: "Wine and mocktails", desc: "Curated beverages for both celebratory and non-alcoholic preferences." },
      { icon: "🎵", name: "Live acoustic", desc: "Soft live music that makes the space feel special without overpowering conversation." },
      { icon: "📸", name: "Full photoshoot", desc: "Longer photo coverage for candids, group portraits, venue shots, and outfit moments." },
    ],
    perHead: 2800,
  },
  {
    id: "royal",
    name: "The Royal",
    badge: "Luxury",
    desc: "The signature luxury Kitty Circle experience for hosts who want everything handled end-to-end. Ideal for anniversaries, reunion circles, premium clubs, and once-in-a-year celebrations.",
    includes: [
      { icon: "🏰", name: "Private rooftop", desc: "A reserved elevated venue with privacy, mood lighting, and premium seating flow." },
      { icon: "🍽️", name: "Chef's table", desc: "A more curated dining experience with chef-led menu planning and plated service." },
      { icon: "🎁", name: "Return gifts", desc: "Personalised take-home gifts that make every guest feel considered." },
      { icon: "📸", name: "Pro photoshoot", desc: "Professional coverage for the full event, including portraits, details, and candid moments." },
    ],
    perHead: 4200,
  },
];

export const KITTY_VENUES: KittyVenue[] = [
  {
    id: "terrace-garden",
    name: "Terrace Garden Venue",
    location: "Momentra Exclusive · Beach Road, Vizag",
    capacity: "Up to 25 guests",
    desc: "An open-air terrace garden designed for elegant daytime kitty brunches and golden-hour celebrations. It is best for hosts who want greenery, soft light, easy movement, and a premium-but-relaxed setting where conversation stays at the center.",
    duration: "3-4 hrs",
    gallery: [
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=85",
      "https://images.unsplash.com/photo-1519671282429-b44b4a72b065?w=700&q=85",
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=700&q=85",
      "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=700&q=85",
    ],
    rating: 4.9,
    reviewList: [
      { name: "Priya Sharma", rating: 5, date: "12 Apr 2026", group: "Kitty Brunch · 14 guests", text: "Beautiful setup, smooth coordination, and the Momentra host handled everything. Our group walked in and immediately started taking photos." },
      { name: "Sunitha Reddy", rating: 5, date: "28 Mar 2026", group: "Kitty Lunch · 18 guests", text: "The setup photo arrived before we reached, the decor matched what was promised, and the brunch flow felt effortless." },
      { name: "Anjali Mehta", rating: 4, date: "15 Feb 2026", group: "Monthly Kitty · 12 guests", text: "Elegant venue and very good food. The custom table details made the afternoon feel personal." },
    ],
    reviews: 48,
    badges: ["Bestseller"],
    amenities: ["Open garden", "Parking", "AC backup", "Photo corners"],
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=85",
  },
  {
    id: "poolside-space",
    name: "Poolside Celebration Space",
    location: "Momentra Exclusive · Rushikonda, Vizag",
    capacity: "Up to 30 guests",
    desc: "A breezy poolside setting for larger circles that want a resort-like feel without the work of coordinating vendors. Best for groups that enjoy photos, music, and a more social, playful afternoon.",
    duration: "3-5 hrs",
    gallery: [
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=700&q=85",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=85",
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=700&q=85",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=700&q=85",
    ],
    rating: 4.7,
    reviewList: [
      { name: "Neha Varma", rating: 5, date: "9 Apr 2026", group: "Poolside Kitty · 20 guests", text: "Loved the sea breeze and the photo corners. The team managed drinks, food timing, and music so well." },
      { name: "Kavitha Rao", rating: 4, date: "22 Mar 2026", group: "Birthday Kitty · 16 guests", text: "Great for a lively group. The venue felt private and the setup was ready before our guests arrived." },
      { name: "Meera Iyer", rating: 5, date: "2 Mar 2026", group: "Kitty Brunch · 24 guests", text: "The poolside atmosphere made it feel like a mini getaway. Very easy booking experience." },
    ],
    reviews: 22,
    badges: ["New"],
    amenities: ["Pool access", "Sea view", "Sound system", "Change rooms"],
    image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=700&q=85",
  },
  {
    id: "moonlit-rooftop",
    name: "Moonlit Rooftop Lounge",
    location: "Momentra Exclusive · Siripuram, Vizag",
    capacity: "Up to 20 guests",
    desc: "A cozy rooftop lounge for evening kitty dinners, intimate circles, and groups that prefer mood lighting over large venues. Best for conversation-led gatherings with a polished dinner setup.",
    duration: "2-3 hrs",
    gallery: [
      "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=700&q=85",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=85",
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=700&q=85",
      "https://images.unsplash.com/photo-1519671282429-b44b4a72b065?w=700&q=85",
    ],
    rating: 4.8,
    reviewList: [
      { name: "Radhika Menon", rating: 5, date: "6 Apr 2026", group: "Dinner Kitty · 10 guests", text: "The rooftop was intimate and beautifully lit. Perfect for our smaller circle." },
      { name: "Lakshmi Nair", rating: 5, date: "18 Mar 2026", group: "Kitty Dinner · 15 guests", text: "Food timing, decor, and hosting were all handled quietly in the background. Very premium." },
      { name: "Farah Khan", rating: 4, date: "26 Feb 2026", group: "Friends Circle · 12 guests", text: "Lovely ambience and great photos. We especially liked that there were no venue coordination calls for us." },
    ],
    reviews: 35,
    badges: [],
    amenities: ["City view", "Lounge seating", "Candle setup"],
    image: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=700&q=85",
  },
];

export function findKittyPackage(id?: string | string[]) {
  const normalized = Array.isArray(id) ? id[0] : id;
  return KITTY_PACKAGES.find((item) => item.id === normalized) ?? KITTY_PACKAGES[0];
}

export function findKittyVenue(id?: string | string[]) {
  const normalized = Array.isArray(id) ? id[0] : id;
  return KITTY_VENUES.find((item) => item.id === normalized) ?? KITTY_VENUES[0];
}

export function kittyTotal(perHead: number, guests: number) {
  return perHead * guests;
}
