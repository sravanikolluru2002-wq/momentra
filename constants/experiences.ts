export const DARK = {
  bg: "#0D0905",
  surface: "#1A0E08",
  surface2: "#231508",
  card: "#1A0E08",
  text: "#F2E8D9",
  text2: "rgba(242,232,217,0.62)",
  text3: "rgba(242,232,217,0.36)",
  gold: "#C9975A",
  gold2: "#E4B97A",
  red: "#C0392B",
  red2: "#8B1A10",
  border: "rgba(201,151,90,0.18)",
  border2: "rgba(201,151,90,0.35)",
  input: "rgba(255,255,255,0.05)",
  nav: "rgba(16,8,4,0.97)",
};

export const LIGHT = {
  bg: "#FFF8F2",
  surface: "#FFF0E6",
  surface2: "#FAE8D8",
  card: "#FFF0E6",
  text: "#1E0A04",
  text2: "rgba(30,10,4,0.62)",
  text3: "rgba(30,10,4,0.36)",
  gold: "#8B5A1A",
  gold2: "#A0722A",
  red: "#C0392B",
  red2: "#8B1A10",
  border: "rgba(180,120,60,0.18)",
  border2: "rgba(180,120,60,0.38)",
  input: "rgba(0,0,0,0.04)",
  nav: "rgba(255,245,235,0.97)",
};

export type MomentraTheme = typeof DARK;

export type Occasion = {
  id: string;
  icon: string;
  label: string;
  desc: string;
  image: string;
  slug?: string;
  title?: string;
  subtitle?: string;
  type?: "social" | "corporate" | "custom";
  active?: boolean;
};

export type AddOn = {
  id: string;
  name: string;
  price: number;
  icon: string;
};

export type ExperienceReview = {
  date: string;
  name: string;
  occasion: string;
  rating: number;
  text: string;
};

export type Experience = {
  id: string;
  occasionId: string;
  title: string;
  venue: string;
  price: number;
  priceLabel?: string;
  capacity: number;
  minimumGuests?: number;
  duration?: string;
  city?: string;
  area?: string;
  location?: string;
  rating: number;
  reviews: number;
  description?: string;
  reviewList?: ExperienceReview[];
  special?: string[];
  badge?: string;
  image: string;
  images?: string[];
  inclusions: string[];
  addOns: AddOn[];
};

export const OCCASIONS: Occasion[] = [
  {
    id: "birthday",
    icon: "🎂",
    label: "Birthday",
    desc: "Birthdays & milestones",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=80",
  },
  {
    id: "datenight",
    icon: "❤️",
    label: "Date Night",
    desc: "Romantic vibe",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=80",
  },
  {
    id: "kitty",
    icon: "👯",
    label: "Kitty Party",
    desc: "Girls gatherings",
    image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=700&q=80",
  },
  {
    id: "house-party",
    slug: "house-party",
    icon: "🏠",
    title: "House Party",
    label: "House Party",
    subtitle: "Private celebrations at home",
    desc: "Private celebrations at home",
    type: "social",
    active: true,
    image: "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=700&q=80",
  },
  {
    id: "party",
    icon: "🎉",
    label: "Party",
    desc: "Group celebrations",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=700&q=80",
  },
  {
    id: "corporate",
    icon: "💼",
    label: "Corporate",
    desc: "Work events & dinners",
    image: "https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=700&q=80",
  },
  {
    id: "other",
    icon: "✨",
    label: "Other",
    desc: "Any special moment",
    image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=700&q=80",
  },
];

export const EXPERIENCES: Experience[] = [
  {
    id: "candlelight-dining",
    occasionId: "datenight",
    title: "Intimate Candlelight Dining",
    venue: "Sagar Nagar, Vizag",
    price: 2000,
    priceLabel: "₹2,000 per plate",
    capacity: 11,
    minimumGuests: 11,
    duration: "2 hours",
    city: "Visakhapatnam",
    area: "Sagar Nagar",
    location: "Sagar Nagar, Vizag",
    rating: 4.8,
    reviews: 4,
    badge: "NEW",
    description: "An intimate candlelight dining experience designed for couples who want their evening to feel warm, personal, and unforgettable. Set under glowing lights with elegant table styling, floral arrangements, and soft music, this setup is perfect for anniversaries, proposals, surprise dates, or meaningful celebrations. Every detail is crafted to create a cozy and romantic atmosphere that feels straight out of a dream dinner.",
    special: [
      "Elegant candlelight table setup",
      "Romantic floral and greenery styling",
      "Warm ambient lighting and cozy atmosphere",
      "Perfect for proposals, anniversaries, and date nights",
      "Beautifully curated dining experience with aesthetic decor",
    ],
    reviewList: [
      { name: "Meghana S", rating: 5, date: "19 Apr 2026", occasion: "Anniversary · 2 guests", text: "The entire setup looked magical in person. The candlelight, flowers, and table styling made our anniversary feel very special and intimate." },
      { name: "Arjun Dev", rating: 5, date: "5 Apr 2026", occasion: "Proposal Dinner · 2 guests", text: "The ambience was perfect for a proposal. Everything from the lighting to the decor felt elegant and beautifully planned." },
      { name: "Poojitha", rating: 4, date: "17 Mar 2026", occasion: "Date Night · 2 guests", text: "Loved the aesthetic setup and cozy vibe. The candles and floral decorations made the evening feel calm, romantic, and memorable." },
      { name: "Rahul K", rating: 5, date: "28 Feb 2026", occasion: "Surprise Dinner · 2 guests", text: "One of the most aesthetic dinner setups I have seen. The warm lighting and table decor looked stunning in photos and even better in real life." },
    ],
    image: "/venues/venue-1/cover.jpg",
    images: [
      "/venues/venue-1/cover.jpg",
      "/venues/venue-1/1.jpg",
      "/venues/venue-1/2.jpg",
      "/venues/venue-1/3.jpg",
    ],
    inclusions: [
      "Reserved private-style dining table",
      "Premium candlelight decor setup",
      "Floral table arrangements",
      "Ambient background music",
      "Elegant seating and dinner setup",
      "Romantic photo-worthy ambience",
    ],
    addOns: [
      { id: "photographer", name: "Photographer", price: 1500, icon: "📸" },
      { id: "premium-cake", name: "Premium Cake Setup", price: 800, icon: "🎂" },
      { id: "live-guitar", name: "Live Guitar Performance", price: 2000, icon: "🎸" },
      { id: "balloon-decoration", name: "Custom Balloon Decoration", price: 3000, icon: "🎈" },
    ],
  },
  {
    id: "birthday-terrace",
    occasionId: "birthday",
    title: "Terrace Birthday Celebration",
    venue: "Rooftop, Beach Road, Vizag",
    price: 6999,
    capacity: 6,
    rating: 4.8,
    reviews: 118,
    badge: "BESTSELLER",
    description: "A private terrace birthday setup with warm fairy lights, styled decor, cake placement, and a reserved celebration corner. It is best for close friend groups or family birthdays where the host wants a polished surprise without coordinating decorators, venue staff, and food separately.",
    special: ["Reserved terrace setup", "Decor planned before arrival", "Cake and music flow handled", "Good for intimate birthday surprises"],
    reviewList: [
      { name: "Akhil Varma", rating: 5, date: "18 Apr 2026", occasion: "Birthday · 7 guests", text: "The terrace looked ready before we arrived, and the cake reveal felt effortless. My sister loved the lights and photo corner." },
      { name: "Mounika Rao", rating: 5, date: "3 Apr 2026", occasion: "Milestone Birthday · 6 guests", text: "Decor, music, and seating were handled neatly. It felt private but still premium." },
      { name: "Rishi Kumar", rating: 4, date: "14 Mar 2026", occasion: "Surprise Birthday · 8 guests", text: "Very smooth coordination and nice ambience. The add-on photographer was worth it." },
    ],
    image: "https://images.unsplash.com/photo-1519671282429-b44b4a72b065?w=900&q=80",
    inclusions: ["Decor and fairy lights", "Birthday cake", "Reserved terrace", "Background music"],
    addOns: [
      { id: "photographer", name: "Photographer", price: 1500, icon: "📸" },
      { id: "cake-upgrade", name: "Cake Upgrade", price: 800, icon: "🎂" },
      { id: "guitarist", name: "Live Guitarist", price: 2000, icon: "🎸" },
    ],
  },
  {
    id: "birthday-private-dining",
    occasionId: "birthday",
    title: "Private Dining Birthday",
    venue: "Luxury Cafe, Siripuram, Vizag",
    price: 7999,
    capacity: 6,
    rating: 4.9,
    reviews: 96,
    description: "A cozy private dining birthday experience inside a premium cafe-style setting. It is designed for smaller groups who want a comfortable indoor celebration with a meal, candles, and a controlled surprise moment.",
    special: ["Private booth seating", "Three-course dining flow", "Indoor candlelight ambience", "Best for family or couple-led birthdays"],
    reviewList: [
      { name: "Sneha Reddy", rating: 5, date: "21 Apr 2026", occasion: "Birthday Dinner · 5 guests", text: "The private booth made it feel special without being loud. Food came on time and the surprise was handled well." },
      { name: "Karthik Jain", rating: 5, date: "30 Mar 2026", occasion: "Cafe Birthday · 6 guests", text: "Perfect for a small group. The candles, cake timing, and meal pacing were very good." },
      { name: "Divya Nair", rating: 4, date: "12 Mar 2026", occasion: "Family Birthday · 6 guests", text: "Elegant and easy. We did not have to coordinate with cafe staff at all." },
    ],
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80",
    inclusions: ["Private booth", "3-course meal", "Candlelight setup", "Birthday surprise"],
    addOns: [
      { id: "photographer", name: "Photographer", price: 1500, icon: "📸" },
      { id: "floral", name: "Floral Setup", price: 1200, icon: "🌸" },
    ],
  },
  {
    id: "birthday-poolside",
    occasionId: "birthday",
    title: "Poolside Birthday Setup",
    venue: "Resort, Rushikonda, Vizag",
    price: 8999,
    capacity: 8,
    rating: 4.7,
    reviews: 74,
    description: "A resort-style poolside birthday setup with welcome drinks, floating decor, and music for a livelier celebration. It suits groups that want photos, movement, and a more energetic party atmosphere.",
    special: ["Poolside decor setup", "Welcome drinks included", "DJ-style music support", "Best for larger birthday groups"],
    reviewList: [
      { name: "Nikhil Chandra", rating: 5, date: "9 Apr 2026", occasion: "Poolside Birthday · 10 guests", text: "The poolside setup looked amazing in photos, and the team kept the drinks and music moving." },
      { name: "Anusha K", rating: 4, date: "27 Mar 2026", occasion: "Friends Birthday · 8 guests", text: "Great vibe for a fun group. Decor was ready and the venue felt energetic." },
      { name: "Rahul Menon", rating: 5, date: "7 Mar 2026", occasion: "Birthday Party · 12 guests", text: "Very memorable. The floating decor and photo booth add-on made the evening stand out." },
    ],
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80",
    inclusions: ["Pool access", "Floating decor", "DJ music", "Welcome drinks"],
    addOns: [
      { id: "cake-upgrade", name: "Cake Upgrade", price: 800, icon: "🎂" },
      { id: "photo-booth", name: "Photo Booth", price: 2500, icon: "📷" },
    ],
  },
  {
    id: "date-terrace",
    occasionId: "datenight",
    title: "Romantic Terrace Dinner for Two",
    venue: "Beach Road Area, Vizag",
    price: 4999,
    capacity: 2,
    rating: 4.9,
    reviews: 118,
    description: "A candlelit terrace dinner created for two, with a reserved table, warm lighting, music, and a three-course meal. It is built for proposals, anniversaries, apology dinners, or any date night where the setting needs to feel intentional.",
    special: ["Private table styling", "Candlelight and floral mood", "Three-course dinner included", "Ideal for proposals and anniversaries"],
    reviewList: [
      { name: "Meghana S", rating: 5, date: "19 Apr 2026", occasion: "Anniversary · 2 guests", text: "The table was beautiful, quiet, and exactly what we wanted. It felt personal without being overdone." },
      { name: "Arjun Dev", rating: 5, date: "5 Apr 2026", occasion: "Proposal Dinner · 2 guests", text: "The setup team helped time the reveal perfectly. My partner was genuinely surprised." },
      { name: "Pooja Iyer", rating: 4, date: "17 Mar 2026", occasion: "Date Night · 2 guests", text: "Lovely ambience and good food. The background music made it feel very warm." },
    ],
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80",
    inclusions: ["Reserved table with decor", "3-course dinner", "Candlelight setup", "Background music"],
    addOns: [
      { id: "photographer", name: "Photographer", price: 1500, icon: "📸" },
      { id: "cake-upgrade", name: "Cake Upgrade", price: 800, icon: "🎂" },
      { id: "guitarist", name: "Live Guitarist", price: 2000, icon: "🎸" },
    ],
  },
  {
    id: "date-beach",
    occasionId: "datenight",
    title: "Moonlight Beach Dinner",
    venue: "RK Beach, Vizag",
    price: 5999,
    capacity: 2,
    rating: 4.8,
    reviews: 84,
    description: "A moonlit beachside dinner with candles, rose petals, and a four-course meal close to the shoreline. It works best for couples who want a quieter, more scenic setting with a memorable arrival moment.",
    special: ["Beachside reserved setup", "Four-course meal", "Rose petal styling", "Scenic mood for special dates"],
    reviewList: [
      { name: "Harsha P", rating: 5, date: "11 Apr 2026", occasion: "Romantic Dinner · 2 guests", text: "The beach setup was peaceful and private. It looked even better at night." },
      { name: "Ishita Bose", rating: 5, date: "24 Mar 2026", occasion: "Anniversary · 2 guests", text: "Candles, roses, food, everything was ready. We just arrived and enjoyed the evening." },
      { name: "Sai Teja", rating: 4, date: "6 Mar 2026", occasion: "Date Night · 2 guests", text: "Great location and very thoughtful styling. The team checked in without disturbing us." },
    ],
    image: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=900&q=80",
    inclusions: ["Beachside setup", "Candlelight", "4-course meal", "Rose petals"],
    addOns: [
      { id: "photographer", name: "Photographer", price: 1500, icon: "📸" },
      { id: "cake", name: "Cake", price: 600, icon: "🎂" },
    ],
  },
  {
    id: "kitty-brunch",
    occasionId: "kitty",
    title: "Luxury Kitty Brunch",
    venue: "Novotel, Vizag",
    price: 2499,
    capacity: 10,
    rating: 4.8,
    reviews: 41,
    image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=900&q=80",
    inclusions: ["Private dining", "Brunch buffet", "Wine", "Decor"],
    addOns: [
      { id: "photographer", name: "Photographer", price: 1500, icon: "📸" },
      { id: "cake", name: "Cake", price: 600, icon: "🎂" },
    ],
  },
  {
    id: "birthday-at-home",
    occasionId: "house-party",
    title: "Birthday at Home Setup",
    venue: "At your home, Vizag",
    price: 4999,
    capacity: 12,
    rating: 4.8,
    reviews: 34,
    badge: "NEW",
    description: "A polished at-home birthday setup where Momentra coordinates decor, cake table styling, catering support, music, and post-party essentials so your home feels celebration-ready without the planning mess.",
    special: ["Home decor setup", "Cake table styling", "Catering coordination", "Music and host add-ons available"],
    reviewList: [
      { name: "Ishika R", rating: 5, date: "12 Apr 2026", occasion: "Birthday at home · 14 guests", text: "The team transformed our living room beautifully and handled the setup before guests arrived." },
      { name: "Varun S", rating: 5, date: "29 Mar 2026", occasion: "Family birthday · 10 guests", text: "Decor, food coordination, and cleanup support made the evening feel easy." },
      { name: "Kavya P", rating: 4, date: "8 Mar 2026", occasion: "Surprise birthday · 12 guests", text: "Loved the premium styling. It felt like a venue experience inside our home." },
    ],
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=900&q=80",
    inclusions: ["Home decor setup", "Cake table styling", "Basic photo corner", "Vendor coordination"],
    addOns: [
      { id: "home-catering", name: "Catering", price: 3000, icon: "🍽️" },
      { id: "photographer", name: "Photographer", price: 1500, icon: "📸" },
      { id: "music", name: "DJ / Music Setup", price: 2500, icon: "🎵" },
      { id: "cleanup", name: "Cleaning Support", price: 1200, icon: "✨" },
    ],
  },
  {
    id: "private-dinner-at-home",
    occasionId: "house-party",
    title: "Private Dinner at Home",
    venue: "At your home, Vizag",
    price: 6999,
    capacity: 8,
    rating: 4.7,
    reviews: 27,
    description: "A refined private dinner experience at home with table styling, food coordination, warm lighting, and optional chef/catering support for close friends, family, or intimate celebrations.",
    special: ["Styled dinner table", "Food and service coordination", "Warm home ambience", "Great for friends gatherings"],
    reviewList: [
      { name: "Meera N", rating: 5, date: "18 Apr 2026", occasion: "Private dinner · 8 guests", text: "The table styling and food flow made it feel like a private dining experience without leaving home." },
      { name: "Raghav K", rating: 4, date: "21 Mar 2026", occasion: "Friends gathering · 9 guests", text: "Very convenient and elegant. The setup saved us a lot of coordination." },
      { name: "Anusha T", rating: 5, date: "5 Mar 2026", occasion: "Family dinner · 7 guests", text: "Beautiful ambience and well-planned service. Our guests were impressed." },
    ],
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=900&q=80",
    inclusions: ["Dinner table styling", "Ambient lighting", "Menu coordination", "Basic serving plan"],
    addOns: [
      { id: "premium-catering", name: "Premium Catering", price: 4500, icon: "🍽️" },
      { id: "host-anchor", name: "Host / Anchor", price: 2000, icon: "🎤" },
      { id: "photographer", name: "Photographer", price: 1500, icon: "📸" },
    ],
  },
  {
    id: "terrace-house-party",
    occasionId: "house-party",
    title: "Terrace House Party",
    venue: "Your terrace or home space, Vizag",
    price: 8999,
    capacity: 15,
    rating: 4.9,
    reviews: 31,
    description: "A terrace-friendly house party setup with decor, lighting, music, catering coordination, and optional games or host support for a lively private gathering at home.",
    special: ["Terrace decor and lighting", "Music setup available", "Game night friendly", "Cleanup support add-on"],
    reviewList: [
      { name: "Nikhil C", rating: 5, date: "25 Apr 2026", occasion: "Terrace party · 18 guests", text: "Our terrace looked like a premium party venue. Music and food coordination were smooth." },
      { name: "Sravya L", rating: 5, date: "2 Apr 2026", occasion: "Game night · 15 guests", text: "The game night setup and lights made it feel festive but still private." },
      { name: "Aditya R", rating: 4, date: "16 Mar 2026", occasion: "Friends gathering · 16 guests", text: "Great for a home party without the stress of arranging ten different things." },
    ],
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=900&q=80",
    inclusions: ["Terrace decor", "Ambient lighting", "Music-ready setup", "Games corner"],
    addOns: [
      { id: "dj-music", name: "DJ or Music Setup", price: 3000, icon: "🎵" },
      { id: "catering", name: "Catering", price: 4000, icon: "🍽️" },
      { id: "cleanup", name: "Cleaning Support", price: 1500, icon: "✨" },
    ],
  },
  {
    id: "friends-game-night-at-home",
    occasionId: "house-party",
    title: "Friends Game Night at Home",
    venue: "At your home, Vizag",
    price: 5999,
    capacity: 10,
    rating: 4.8,
    reviews: 22,
    description: "A relaxed house-party format for friends gatherings and game nights, with cozy decor, snack/catering coordination, music support, and an optional host or games coordinator to keep the evening moving.",
    special: ["Friends gathering setup", "Game night friendly", "Host or games coordinator add-on", "Food, music, and cleanup support available"],
    reviewList: [
      { name: "Siddharth M", rating: 5, date: "19 Apr 2026", occasion: "Game night · 11 guests", text: "The games host made it feel organized without becoming formal. Snacks and music were timed well." },
      { name: "Rhea K", rating: 5, date: "1 Apr 2026", occasion: "Friends gathering · 10 guests", text: "Perfect for a low-stress night at home. We got decor, food coordination, and cleanup support in one place." },
      { name: "Naveen P", rating: 4, date: "13 Mar 2026", occasion: "Home party · 12 guests", text: "The setup felt premium but still personal. Great option when you do not want to book a venue." },
    ],
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=900&q=80",
    inclusions: ["Game night layout", "Snack table styling", "Music-ready setup", "Vendor coordination"],
    addOns: [
      { id: "games-host", name: "Host or Games Coordinator", price: 2200, icon: "🎤" },
      { id: "catering", name: "Catering", price: 3500, icon: "🍽️" },
      { id: "dj-music", name: "DJ or Music Setup", price: 3000, icon: "🎵" },
      { id: "cleanup", name: "Cleanup Support", price: 1200, icon: "✨" },
    ],
  },
  {
    id: "villa-poolside-house-party",
    occasionId: "house-party",
    title: "Villa & Poolside House Party",
    venue: "Private villa or poolside home, Vizag",
    price: 14999,
    capacity: 18,
    rating: 4.9,
    reviews: 18,
    description: "A premium villa or poolside house party setup for private celebrations, with outdoor styling, catering coordination, photographer options, music setup, and end-to-end vendor execution.",
    special: ["Villa party support", "Poolside house party setup", "Photographer and music add-ons", "End-to-end vendor coordination"],
    reviewList: [
      { name: "Tanvi S", rating: 5, date: "26 Apr 2026", occasion: "Villa party · 20 guests", text: "It looked like a boutique event at home. The lights, food coordination, and photos came together beautifully." },
      { name: "Armaan D", rating: 5, date: "6 Apr 2026", occasion: "Poolside house party · 18 guests", text: "The poolside styling felt premium and the team handled all vendors without us chasing anyone." },
      { name: "Leela V", rating: 4, date: "22 Mar 2026", occasion: "Private celebration · 16 guests", text: "Very polished execution for a home celebration. The photographer add-on was worth it." },
    ],
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=900&q=80",
    inclusions: ["Outdoor decor styling", "Food vendor coordination", "Music-ready layout", "Execution checklist"],
    addOns: [
      { id: "photographer", name: "Photographer", price: 1800, icon: "📸" },
      { id: "premium-catering", name: "Premium Catering", price: 6000, icon: "🍽️" },
      { id: "dj-music", name: "DJ or Music Setup", price: 3500, icon: "🎵" },
      { id: "cleanup", name: "Cleanup Support", price: 1800, icon: "✨" },
    ],
  },
  {
    id: "party-hall",
    occasionId: "party",
    title: "Private Party Hall",
    venue: "Daspalla, Vizag",
    price: 12999,
    capacity: 20,
    rating: 4.7,
    reviews: 63,
    description: "A private hall package for bigger celebrations that need music, buffet service, decor, and enough room for a group to move around. It is best for birthdays, reunions, farewell parties, and friend-group celebrations.",
    special: ["Exclusive hall access", "DJ setup and buffet", "Decor coordination included", "Built for larger groups"],
    reviewList: [
      { name: "Vikram R", rating: 5, date: "16 Apr 2026", occasion: "Friends Party · 22 guests", text: "The hall was ready on time, and the DJ setup gave the evening the energy we wanted." },
      { name: "Lavanya M", rating: 4, date: "1 Apr 2026", occasion: "Farewell Party · 18 guests", text: "Good food, clean setup, and easy coordination. The photo booth add-on was a hit." },
      { name: "Aditya N", rating: 5, date: "10 Mar 2026", occasion: "Birthday Party · 20 guests", text: "Everything from buffet to decor was managed smoothly. We could actually enjoy the party." },
    ],
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=900&q=80",
    inclusions: ["Exclusive hall", "DJ setup", "Buffet", "Decor"],
    addOns: [
      { id: "photo-booth", name: "Photo Booth", price: 2500, icon: "📷" },
      { id: "cake", name: "Cake", price: 800, icon: "🎂" },
    ],
  },
  {
    id: "corporate-dinner",
    occasionId: "corporate",
    title: "Corporate Dinner Night",
    venue: "Novotel, Vizag",
    price: 3499,
    capacity: 15,
    rating: 4.6,
    reviews: 52,
    description: "A polished corporate dinner setup with private hall access, AV support, welcome drinks, and a four-course meal. It is designed for teams that need a professional evening without operational friction.",
    special: ["Private business-friendly hall", "AV setup support", "Four-course meal", "Works for team dinners and client meets"],
    reviewList: [
      { name: "Sandeep Kulkarni", rating: 5, date: "20 Apr 2026", occasion: "Team Dinner · 18 guests", text: "AV, seating, and food timing were handled professionally. Our team could focus on the evening." },
      { name: "Nisha Thomas", rating: 4, date: "29 Mar 2026", occasion: "Client Dinner · 12 guests", text: "The setup felt formal but warm. Good choice for client-facing dinners." },
      { name: "Rohit Shah", rating: 5, date: "8 Mar 2026", occasion: "Corporate Event · 24 guests", text: "Smooth coordination and good service. The welcome drinks helped the event start well." },
    ],
    image: "https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=900&q=80",
    inclusions: ["Private hall", "4-course meal", "AV setup", "Welcome drinks"],
    addOns: [
      { id: "photography", name: "Photography", price: 1500, icon: "📸" },
      { id: "floral", name: "Floral Decor", price: 900, icon: "🌸" },
    ],
  },
  {
    id: "custom-setup",
    occasionId: "other",
    title: "Custom Celebration Setup",
    venue: "Your Venue, Vizag",
    price: 2999,
    capacity: 10,
    rating: 4.7,
    reviews: 28,
    description: "A flexible celebration setup that brings Momentra planning to your chosen venue. It works when you already have a location but need decor, hosting, food coordination, and timing handled as one experience.",
    special: ["Works at your chosen venue", "Flexible decor direction", "Personal host coordination", "Good for unique or mixed occasions"],
    reviewList: [
      { name: "Keerthi Das", rating: 5, date: "13 Apr 2026", occasion: "Family Celebration · 16 guests", text: "We had the venue, but Momentra made it feel like a complete event. Decor and timing were handled well." },
      { name: "Manoj P", rating: 4, date: "25 Mar 2026", occasion: "House Party · 10 guests", text: "Very useful when you do not want to chase multiple vendors. The host kept everything on track." },
      { name: "Sravya L", rating: 5, date: "5 Mar 2026", occasion: "Custom Surprise · 8 guests", text: "They adapted the setup to our home terrace beautifully. It felt personal and easy." },
    ],
    image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=900&q=80",
    inclusions: ["Custom decor", "Personal host", "Flexible timing", "Any cuisine"],
    addOns: [
      { id: "photographer", name: "Photographer", price: 1500, icon: "📸" },
      { id: "cake", name: "Cake", price: 600, icon: "🎂" },
    ],
  },
];

export const TRENDING_IDS = ["candlelight-dining"];

export function formatINR(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function getOccasion(id?: string | string[]) {
  const value = Array.isArray(id) ? id[0] : id;
  return OCCASIONS.find((occasion) => occasion.id === value) ?? OCCASIONS[0];
}

export function getExperiencesByOccasion(id?: string | string[]) {
  const occasion = getOccasion(id);
  return EXPERIENCES.filter((experience) => experience.occasionId === occasion.id);
}

export function getExperience(id?: string | string[]) {
  const value = Array.isArray(id) ? id[0] : id;
  return EXPERIENCES.find((experience) => experience.id === value) ?? EXPERIENCES[0];
}

export function getAddOns(ids?: string | string[]) {
  const value = Array.isArray(ids) ? ids[0] : ids;
  const selected = value ? value.split(",").filter(Boolean) : [];
  const experience = EXPERIENCES.find((item) =>
    item.addOns.some((addOn) => selected.includes(addOn.id))
  );

  return experience?.addOns.filter((addOn) => selected.includes(addOn.id)) ?? [];
}
