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
  eventTypeId: string;
  gallery: string[];
  id: string;
  image: string;
  location: string;
  name: string;
  perHead: number;
  rating: number;
  reviews: CorporateReview[];
  reviewCount: number;
  venueType: string;
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
    id: "executive-ranch-team-lunch",
    name: "Executive Ranch Team Lunch",
    location: "Sagar Nagar, Vizag",
    capacity: "11+ guests",
    desc: "A premium outdoor team lunch experience set around a scenic horse ranch atmosphere, designed for relaxed corporate bonding, leadership lunches, and team celebrations.",
    duration: "2 hours",
    eventTypeId: "team-dinner",
    gallery: [
      "/venues/venue-1/cover.jpg",
      "/venues/venue-1/1.jpg",
      "/venues/venue-1/2.jpg",
      "/venues/venue-1/3.jpg",
    ],
    image: "/venues/venue-1/cover.jpg",
    perHead: 2000,
    rating: 4.8,
    reviewCount: 52,
    venueType: "Outdoor Lawn",
    badges: ["Team Dinner", "GST Ready"],
    amenities: ["Horse ranch ambience", "Outdoor lunch setup", "Reserved team seating", "Curated dining", "Momentra coordinator"],
    reviews: [
      { name: "Rohan M.", company: "Tech Company", rating: 5, date: "8 Apr 2026", event: "Team Lunch · 18 guests", text: "The ranch atmosphere made the lunch feel relaxed and premium. It was a strong change from the usual hotel team meal." },
      { name: "Sneha K.", company: "Manufacturing MNC", rating: 5, date: "22 Mar 2026", event: "Leadership Lunch · 24 guests", text: "The open-air setup, horses nearby, and service flow helped our leadership lunch feel memorable without becoming too formal." },
      { name: "Arjun T.", company: "Startup", rating: 4, date: "14 Feb 2026", event: "Team Celebration · 14 guests", text: "Great setting for a small team celebration. The food timing was smooth and the outdoor ambience was the highlight." },
    ],
  },
  {
    id: "milestone-ranch-celebration",
    name: "Milestone Ranch Celebration",
    location: "Sagar Nagar, Vizag",
    capacity: "11+ guests",
    desc: "A refined milestone celebration experience with lunch, open-air ambience, horse ranch surroundings, and a premium setup for company achievements and success moments.",
    duration: "2 hours",
    eventTypeId: "milestone",
    gallery: [
      "/venues/venue-1/cover.jpg",
      "/venues/venue-1/1.jpg",
      "/venues/venue-1/2.jpg",
      "/venues/venue-1/3.jpg",
    ],
    image: "/venues/venue-1/cover.jpg",
    perHead: 2000,
    rating: 4.7,
    reviewCount: 38,
    venueType: "Outdoor Lawn",
    badges: ["Milestone Celebration", "GST Ready"],
    amenities: ["Premium lunch setup", "Open-air ranch ambience", "Achievement toast setup", "Reserved seating", "Momentra coordinator"],
    reviews: [
      { name: "Madhav P.", company: "SaaS Team", rating: 5, date: "12 Apr 2026", event: "Milestone Lunch · 22 guests", text: "The ranch setting gave our milestone celebration a real sense of occasion. The team loved the open-air lunch format." },
      { name: "Kavya R.", company: "Finance Firm", rating: 4, date: "19 Mar 2026", event: "Achievement Celebration · 16 guests", text: "Elegant, different, and easy to coordinate. The surroundings made the success celebration feel special." },
      { name: "Imran S.", company: "Events Agency", rating: 5, date: "3 Mar 2026", event: "Company Milestone · 30 guests", text: "Momentra kept the setup polished while the ranch ambience did the rest. It photographed beautifully too." },
    ],
  },
  {
    id: "conference-ranch-lunch",
    name: "Conference Ranch Lunch",
    location: "Sagar Nagar, Vizag",
    capacity: "11+ guests",
    desc: "A sophisticated post-conference lunch experience combining networking, curated dining, and a scenic ranch-style setting with horses and open-air hospitality.",
    duration: "2 hours",
    eventTypeId: "conference-dinner",
    gallery: [
      "/venues/venue-1/cover.jpg",
      "/venues/venue-1/1.jpg",
      "/venues/venue-1/2.jpg",
      "/venues/venue-1/3.jpg",
    ],
    image: "/venues/venue-1/cover.jpg",
    perHead: 2000,
    rating: 4.6,
    reviewCount: 29,
    venueType: "Outdoor Lawn",
    badges: ["Conference Dinner", "GST Ready"],
    amenities: ["Post-conference lunch", "Networking-friendly seating", "Scenic ranch setting", "Curated dining", "Open-air hospitality"],
    reviews: [
      { name: "Nisha V.", company: "Consulting Team", rating: 5, date: "6 Apr 2026", event: "Post-conference Lunch · 32 guests", text: "It was a refreshing close to our conference day. The ranch-style setting made networking feel natural." },
      { name: "Pranav D.", company: "Product Startup", rating: 4, date: "15 Mar 2026", event: "Networking Lunch · 18 guests", text: "Good ambience and service. The open-air format helped conversations continue after the sessions." },
      { name: "Elina G.", company: "Design Studio", rating: 5, date: "23 Feb 2026", event: "Conference Lunch · 26 guests", text: "Beautiful setting, clear coordination, and a premium lunch experience without the usual banquet feel." },
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
