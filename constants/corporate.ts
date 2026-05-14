export type CorporateEventType = {
  budgetHint: string;
  desc: string;
  icon: string;
  id: string;
  label: string;
  tags: string[];
};

export type CorporateReview = {
  company: string;
  date: string;
  event: string;
  name: string;
  rating: number;
  text: string;
};

export type CorporateVenue = {
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
  perHead: number;
  rating: number;
  reviews: CorporateReview[];
  reviewCount: number;
};

export const CORPORATE_EVENT_TYPES: CorporateEventType[] = [
  {
    id: "team-dinner",
    icon: "🍽️",
    label: "Team Dinner",
    desc: "Monthly or quarterly team celebration with curated venue, fixed menu, and no coordination needed from your side.",
    budgetHint: "₹1,200-₹2,500/head",
    tags: ["10-50 people", "Most frequent", "Dinner"],
  },
  {
    id: "client-entertainment",
    icon: "🤝",
    label: "Client Entertainment",
    desc: "High-stakes dining for clients, partners, or investors with premium venues and discreet service.",
    budgetHint: "₹3,000-₹6,000/head",
    tags: ["4-20 people", "Premium", "Hosting"],
  },
  {
    id: "offsite",
    icon: "🏕️",
    label: "Offsite / Retreat",
    desc: "Full-day or weekend team offsite with venue, meals, activities, and logistics coordinated by Momentra.",
    budgetHint: "₹4,000-₹10,000/head",
    tags: ["15-100 people", "Full day", "Activities"],
  },
  {
    id: "milestone",
    icon: "🏆",
    label: "Milestone Celebration",
    desc: "Employee awards, promotions, work anniversaries, and farewells with a personal touch in a professional setting.",
    budgetHint: "₹1,800-₹3,500/head",
    tags: ["5-30 people", "Special occasion", "Awards"],
  },
  {
    id: "conference-dinner",
    icon: "🎤",
    label: "Conference Dinner",
    desc: "Post-conference or post-event group dinner with large capacity, smooth service, and GST invoice support.",
    budgetHint: "₹1,000-₹2,000/head",
    tags: ["30-150 people", "Large group", "GST ready"],
  },
];

export const CORPORATE_BUDGETS = ["Under ₹1,500", "₹1,500-₹3,000", "₹3,000-₹6,000", "₹6,000+"];

export const CORPORATE_REQUIREMENTS = [
  { id: "projector", icon: "📽️", label: "Projector / AV" },
  { id: "mic", icon: "🎤", label: "Mic & Sound" },
  { id: "outdoor", icon: "🌿", label: "Outdoor Space" },
  { id: "veg", icon: "🥗", label: "Veg Only" },
  { id: "bar", icon: "🍷", label: "Bar / Drinks" },
  { id: "parking", icon: "🚗", label: "Parking" },
  { id: "photography", icon: "📸", label: "Photography" },
  { id: "accessibility", icon: "♿", label: "Accessibility" },
];

export const CORPORATE_TIME_SLOTS = ["12:30 PM - 3:00 PM", "6:30 PM - 9:30 PM", "7:30 PM - 10:30 PM"];

export const CORPORATE_VENUES: CorporateVenue[] = [
  {
    id: "executive-dining-suite",
    name: "Executive Dining Suite",
    location: "Momentra Exclusive · MVP Colony, Vizag",
    capacity: "Up to 40 guests",
    desc: "A private dining suite for board dinners, team celebrations, client lunches, and milestone events. It has no walk-through traffic, integrated AV, corporate-trained service staff, and a dedicated Momentra coordinator from booking to close.",
    duration: "2-4 hrs",
    gallery: [
      "https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=800&q=85",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=85",
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=85",
    ],
    image: "https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=800&q=85",
    perHead: 1800,
    rating: 4.8,
    reviewCount: 52,
    badges: ["Top Rated", "GST Ready"],
    amenities: ["Projector & screen", "Mic & PA", "High-speed WiFi", "Valet parking", "Bar access"],
    reviews: [
      { name: "Rohan M.", company: "Tech Company", rating: 5, date: "8 Apr 2026", event: "Quarterly Dinner · 28 guests", text: "AV worked perfectly, food timing was tight, and the GST invoice reached finance the next morning." },
      { name: "Sneha K.", company: "Manufacturing MNC", rating: 5, date: "22 Mar 2026", event: "Annual Awards · 35 guests", text: "The Momentra coordinator handled seating, vendor timing, and service quietly in the background. Our leadership noticed the smoothness." },
      { name: "Arjun T.", company: "Startup", rating: 4, date: "14 Feb 2026", event: "Client Dinner · 8 guests", text: "The venue felt premium and private. Parking took a few extra minutes, but the dinner itself was seamless." },
    ],
  },
  {
    id: "grand-banquet-hall",
    name: "Grand Banquet Hall",
    location: "Momentra Exclusive · Siripuram, Vizag",
    capacity: "Up to 120 guests",
    desc: "A large-format banquet space built for conference dinners, employee townhalls, and awards evenings. Best when you need stage support, buffet flow, parking, and structured guest movement.",
    duration: "3-6 hrs",
    gallery: [
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=85",
      "https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=800&q=85",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=85",
    ],
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=85",
    perHead: 1400,
    rating: 4.7,
    reviewCount: 38,
    badges: ["Corporate Fav", "GST Ready"],
    amenities: ["Full AV setup", "Stage & mic", "Garden area", "Parking 50+", "Buffet service"],
    reviews: [
      { name: "Madhav P.", company: "SaaS Team", rating: 5, date: "12 Apr 2026", event: "Conference Dinner · 82 guests", text: "Large group movement was handled cleanly, and the buffet counters never felt crowded." },
      { name: "Kavya R.", company: "Finance Firm", rating: 4, date: "19 Mar 2026", event: "Awards Night · 64 guests", text: "Stage, mic, and seating were ready before our team arrived. The manager approval summary was useful." },
      { name: "Imran S.", company: "Events Agency", rating: 5, date: "3 Mar 2026", event: "Partner Dinner · 100 guests", text: "Reliable venue for bigger headcounts. Momentra gave us one point of contact instead of five vendors." },
    ],
  },
  {
    id: "rooftop-business-lounge",
    name: "Rooftop Business Lounge",
    location: "Momentra Exclusive · Beach Road, Vizag",
    capacity: "Up to 35 guests",
    desc: "A polished rooftop lounge for leadership dinners, smaller client hosting, and milestone celebrations. The sea-facing ambience feels premium while keeping conversation and service flow comfortable.",
    duration: "2-3 hrs",
    gallery: [
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=85",
      "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=800&q=85",
      "https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=800&q=85",
    ],
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=85",
    perHead: 2100,
    rating: 4.6,
    reviewCount: 29,
    badges: ["GST Ready"],
    amenities: ["City + sea view", "Wireless mic", "Lounge seating", "Private service", "Curated dinner"],
    reviews: [
      { name: "Nisha V.", company: "Consulting Team", rating: 5, date: "6 Apr 2026", event: "Client Hosting · 12 guests", text: "The space helped the dinner feel premium but not stiff. Great for client conversations." },
      { name: "Pranav D.", company: "Product Startup", rating: 4, date: "15 Mar 2026", event: "Leadership Dinner · 18 guests", text: "Good ambience and service. The rooftop made the team celebration feel special." },
      { name: "Elina G.", company: "Design Studio", rating: 5, date: "23 Feb 2026", event: "Milestone Dinner · 20 guests", text: "Beautiful setting, easy coordination, and clear invoicing after the event." },
    ],
  },
];

export function findCorporateEventType(id?: string | string[]) {
  const value = Array.isArray(id) ? id[0] : id;
  return CORPORATE_EVENT_TYPES.find((item) => item.id === value) ?? CORPORATE_EVENT_TYPES[0];
}

export function findCorporateVenue(id?: string | string[]) {
  const value = Array.isArray(id) ? id[0] : id;
  return CORPORATE_VENUES.find((item) => item.id === value) ?? CORPORATE_VENUES[0];
}

export function corporateTotal(perHead: number, guests: number, includeGst = true) {
  const subtotal = perHead * guests;
  return includeGst ? Math.round(subtotal * 1.18) : subtotal;
}
