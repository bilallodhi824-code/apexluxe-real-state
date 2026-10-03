import { isFirebaseConfigured, db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";

// Interfaces
export interface Property {
  id: string;
  title: string;
  description: string;
  type: "residential" | "commercial" | "apartment" | "office" | "plot" | "farmhouse" | "villa" | "rental";
  purpose: "sale" | "rent";
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  area: number; // in sqft
  location: string;
  address: string;
  coordinates: { lat: number; lng: number };
  images: string[];
  videoUrl?: string;
  virtualTour360?: string;
  amenities: string[];
  featured: boolean;
  status: "available" | "pending" | "sold" | "rented";
  createdAt: string;
  agentId: string;
  ownerId?: string;
  nearbyPlaces?: { name: string; type: string; distance: string }[];
  floorPlanUrl?: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  agency: string;
  email: string;
  phone: string;
  avatar: string;
  rating: number;
  listingsCount: number;
  experienceYears: number;
  about: string;
}

export interface Booking {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  agentId: string;
  agentName: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  timeSlot: string;
  status: "pending" | "confirmed" | "cancelled" | "rescheduled";
  notes?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  propertyId?: string;
}

export interface ChatThread {
  id: string;
  participants: string[]; // [customerId, agentId]
  participantDetails: {
    [key: string]: { name: string; avatar: string; role: string };
  };
  lastMessage: string;
  lastMessageAt: string;
  propertyId?: string;
  propertyTitle?: string;
}

export interface SystemLog {
  id: string;
  type: "activity" | "audit" | "security";
  message: string;
  userId: string;
  userEmail: string;
  severity: "info" | "warning" | "critical";
  timestamp: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  authorName: string;
  category: string;
  publishedAt: string;
  readTime: string;
}

// -------------------------------------------------------------
// SEED DATA FOR LOCAL STORAGE FALLBACK
// -------------------------------------------------------------
const MOCK_AGENTS: Agent[] = [
  {
    id: "agent_alexander",
    name: "Alexander Mercer",
    role: "Luxury Estates Specialist",
    agency: "ApexLuxe Dubai Office",
    email: "alexander@apexluxe.com",
    phone: "+971 50 123 4567",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&h=256&q=80",
    rating: 4.9,
    listingsCount: 14,
    experienceYears: 8,
    about: "Alexander specializes in ultra-high-net-worth property acquisitions in Palm Jumeirah, Emirates Hills, and Downtown Dubai. With 8 years of dedicated luxury market experience, he offers unmatched insight and bespoke private brokerage service.",
  },
  {
    id: "agent_sophia",
    name: "Sophia Sterling",
    role: "International Client Advisor",
    agency: "ApexLuxe Manhattan Office",
    email: "sophia@apexluxe.com",
    phone: "+1 (212) 555-0199",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80",
    rating: 4.8,
    listingsCount: 9,
    experienceYears: 6,
    about: "Sophia advises institutional buyers and elite families on residential property portfolios. Known for her data-driven analytics and refined negotiations, she helps select premium residences in Manhattan, London, and Geneva.",
  },
  {
    id: "agent_marcus",
    name: "Marcus Vance",
    role: "Commercial Portfolio Manager",
    agency: "ApexLuxe Riyadh Office",
    email: "marcus@apexluxe.com",
    phone: "+966 55 987 6543",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&h=256&q=80",
    rating: 4.7,
    listingsCount: 22,
    experienceYears: 12,
    about: "Marcus leads the commercial acquisitions division, dealing with grade-A corporate offices, retail hubs, and premium plots. He has negotiated over $800M in transaction volume across EMEA.",
  },
];

const MOCK_PROPERTIES: Property[] = [
  {
    id: "prop_golden_horizon",
    title: "The Golden Horizon Villa",
    description: "An architectural marvel poised on the prestigious fronds of Palm Jumeirah. This signature villa showcases clean minimalist design combined with warm organic limestone facade finishes. Offering double-height floor-to-ceiling glass paneling, a temperature-controlled dynamic infinity edge pool, absolute private beachfront access, and a custom Italian designer kitchen. Designed for an ultra-luxury lifestyle.",
    type: "villa",
    purpose: "rent",
    price: 32000,
    bedrooms: 5,
    bathrooms: 6,
    area: 8400,
    location: "Palm Jumeirah, Dubai",
    address: "Frond G, Palm Jumeirah Marina",
    coordinates: { lat: 25.1124, lng: 55.1390 },
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
    ],
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    virtualTour360: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Infinity Pool", "Private Beach", "Smart Home Automation", "Home Theater", "Chef Kitchen", "Maid Quarter", "24/7 Security", "Wine Cellar"],
    featured: true,
    status: "available",
    createdAt: new Date().toISOString(),
    agentId: "agent_alexander",
    nearbyPlaces: [
      { name: "Palm Marina Mall", type: "shopping", distance: "0.8 km" },
      { name: "The Wellington School", type: "school", distance: "2.5 km" },
      { name: "King's Hospital Dubai", type: "hospital", distance: "3.2 km" },
      { name: "Al Ittihad Park", type: "park", distance: "1.2 km" }
    ],
    floorPlanUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "prop_manhattan_amber",
    title: "Amber Skyline Penthouse",
    description: "Suspended 60 floors above the city, this breathtaking corner duplex penthouse boasts 360-degree views of Central Park and the Manhattan skyline. Masterfully finished by an award-winning design firm, featuring solid white oak herringbone floors, customized bronze fixtures, a master wing with full marble steam bath, and a private wraparound sky deck. Amenities include access to elite wellness concierge services, a private cellar, and an indoor Olympic-sized pool.",
    type: "apartment",
    purpose: "sale",
    price: 6850000,
    bedrooms: 3,
    bathrooms: 4,
    area: 4200,
    location: "Manhattan, New York",
    address: "732 Fifth Avenue, Midtown East",
    coordinates: { lat: 40.7580, lng: -74.0060 },
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80"
    ],
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    virtualTour360: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Central Park Views", "Concierge Service", "Sky Deck", "Indoor Pool", "Wine Cellar", "Steam Room", "Valet Parking", "Fitness Center"],
    featured: true,
    status: "available",
    createdAt: new Date().toISOString(),
    agentId: "agent_sophia",
    nearbyPlaces: [
      { name: "Central Park Secondary School", type: "school", distance: "0.4 km" },
      { name: "Mount Sinai Wellness Clinic", type: "hospital", distance: "1.1 km" },
      { name: "Grand Central Plaza Shopping", type: "shopping", distance: "0.6 km" }
    ],
    floorPlanUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "prop_difc_commercial",
    title: "Zenith Executive Commercial Suite",
    description: "Located within the financial epicenter of the Middle East, this premium executive suite occupies the top floor of the newly opened Zenith Tower in DIFC. Outfitted with high-speed executive fiber networks, integrated acoustic glass privacy partitioning, ergonomic workspaces, custom-built conference rooms, and a dedicated executive lounge. Full concierge reception and continuous underground secure parking are included.",
    type: "office",
    purpose: "rent",
    price: 14500,
    area: 3200,
    location: "DIFC, Dubai",
    address: "Tower 2, Gate Precinct, DIFC",
    coordinates: { lat: 25.2120, lng: 55.2800 },
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80"
    ],
    amenities: ["Fiber Internet", "Executive Lounge", "Conference Center", "24/7 Access", "Underground Parking", "Server Room", "Meeting Rooms"],
    featured: false,
    status: "available",
    createdAt: new Date().toISOString(),
    agentId: "agent_marcus",
    nearbyPlaces: [
      { name: "DIFC Metro Station", type: "transit", distance: "0.2 km" },
      { name: "Gate Avenue Mall", type: "shopping", distance: "0.3 km" }
    ]
  },
  {
    id: "prop_napa_farmhouse",
    title: "Whispering Pines Estate & Vineyard",
    description: "A gorgeous luxury farmhouse situated on 8 acres of fertile, rolling vineyards in the heart of Napa Valley. This custom farmhouse property fuses high-end modern convenience with historic rustic charm. Complete with a private wine tasting vault, a fully-equipped pool pavilion, a standalone guest cottage, commercial-grade stable boxes, and outdoor stone hearth fire pits for hosting. Truly a spectacular country haven.",
    type: "farmhouse",
    purpose: "sale",
    price: 3450000,
    bedrooms: 4,
    bathrooms: 5,
    area: 6100,
    location: "Napa Valley, California",
    address: "128 Vineyard Lane, Saint Helena",
    coordinates: { lat: 38.5025, lng: -122.4700 },
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80"
    ],
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    virtualTour360: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Private Vineyard", "Pool & Spa Pavilion", "Wine Tasting Room", "Guest House", "Equestrian Stables", "Chef Kitchen", "Outdoor Stone Pizza Oven"],
    featured: true,
    status: "available",
    createdAt: new Date().toISOString(),
    agentId: "agent_alexander",
    nearbyPlaces: [
      { name: "Napa Valley High School", type: "school", distance: "4.2 km" },
      { name: "St. Helena Health Center", type: "hospital", distance: "3.8 km" }
    ],
    floorPlanUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "prop_beverly_crest",
    title: "Emerald Crest Beverly Estate",
    description: "An estate of unparalleled scale and sophisticated architectural design. Rising majestically above Beverly Hills with breathtaking views from the city grid to the Pacific Ocean. Securely situated behind private dual-gates, the residence is built to a standard rarely achieved. Boasting an absolute scale of materials: massive glass facades, rare stone accents, an integrated premium spa, multiple pools, an 18-seat home cinema, and high-performance smart-home security systems.",
    type: "villa",
    purpose: "sale",
    price: 19800000,
    bedrooms: 7,
    bathrooms: 9,
    area: 14500,
    location: "Beverly Hills, California",
    address: "9405 Crest Drive, Beverly Hills",
    coordinates: { lat: 34.0736, lng: -118.4004 },
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80"
    ],
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    virtualTour360: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Ocean View Panorama", "Dual Gate Entry Security", "Infinity Swimming Pool", "18-Seat Cinema Room", "Wellness Spa Center", "Tennis Court", "Automobile Showroom Lounge", "Commercial Elevators"],
    featured: true,
    status: "available",
    createdAt: new Date().toISOString(),
    agentId: "agent_sophia",
    nearbyPlaces: [
      { name: "Beverly Hills Academy", type: "school", distance: "1.5 km" },
      { name: "UCLA Medical Center", type: "hospital", distance: "4.8 km" },
      { name: "Rodeo Drive Boutiques", type: "shopping", distance: "2.1 km" }
    ],
    floorPlanUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "prop_riyadh_hub",
    title: "Al-Oasis Corporate Office Tower Floor",
    description: "An entirely premium commercial corporate floor available for lease or acquisition, directly adjacent to King Fahd Road in Riyadh. Designed to accommodate modern high-growth regional headquarters, featuring advanced smart central climate control, automated solar shading facades, multi-level secure parking spaces, and an open-concept layouts that can be flexibly configured.",
    type: "office",
    purpose: "sale",
    price: 1850000,
    area: 5500,
    location: "Downtown Riyadh, Saudi Arabia",
    address: "Floors 14 & 15, Oasis Tower, Olaya District",
    coordinates: { lat: 24.7136, lng: 46.6753 },
    images: [
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80"
    ],
    amenities: ["Olaya Skyline Views", "Central Air Conditioning", "Solar Facade Shading", "Integrated Security Entrance", "Fiber Backbone Access", "Dedicated Boardrooms"],
    featured: false,
    status: "available",
    createdAt: new Date().toISOString(),
    agentId: "agent_marcus",
    nearbyPlaces: [
      { name: "King Abdullah Financial District Metro", type: "transit", distance: "1.2 km" },
      { name: "Kingdom Centre Mall", type: "shopping", distance: "1.8 km" }
    ]
  }
];

const MOCK_BLOGS: BlogPost[] = [
  {
    id: "blog_1",
    title: "Global Luxury Real Estate Trends: 2026 Forecast",
    excerpt: "Discover the emerging designs, sustainable materials, and target hubs defining ultra-high-net-worth real estate in the coming years.",
    content: "The global market for luxury residential real estate is undergoing a structural transition. Modern institutional capitals and multi-generational families are no longer valuing size alone. Today, the focus is squarely on health assets, carbon-neutral concrete formulations, private wellness sanctuaries, and high-performance home automations. Cities like Dubai, Riyadh, New York, and Lisbon are experiencing massive demand, driven by favorable residency laws and highly refined architectural standards. Developers are capitalizing on this by offering customized bespoke villas and glassmorphic penthouses. In this report, we analyze the macroeconomic factors, luxury design paradigms, and the changing preferences of buyers.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
    authorName: "Alexander Mercer",
    category: "Market Insights",
    publishedAt: "2026-06-15",
    readTime: "5 min read",
  },
  {
    id: "blog_2",
    title: "The Return of Organic Architecture in Modern Estates",
    excerpt: "How integration of raw stone finishes and live forest courtyards is redefining high-end residential interiors.",
    content: "Organic architecture is making a dramatic comeback. Today’s premier architects are drawing inspiration from Frank Lloyd Wright, utilizing local slate, raw limestone, and integrated courtyard gardens. These natural accents are not merely cosmetic; they serve as structural anchors that connect modern architectural glass shells with their geographic landscape. Homeowners are reportingly feeling reduced stress levels, better acoustic isolation, and a greater sense of calm in residences utilizing organic designs. By creating properties that feel like natural extensions of their hillsides, cliffs, or shores, luxury prop-tech represents a timeless return to organic synergy.",
    image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80",
    authorName: "Sophia Sterling",
    category: "Architecture & Design",
    publishedAt: "2026-06-20",
    readTime: "4 min read",
  },
];

const MOCK_LOGS: SystemLog[] = [
  {
    id: "log_1",
    type: "security",
    message: "Admin session authenticated successfully from IP 184.22.45.109",
    userId: "user_superadmin",
    userEmail: "admin@apexluxe.com",
    severity: "info",
    timestamp: new Date().toISOString(),
  },
  {
    id: "log_2",
    type: "activity",
    message: "Property listing 'The Golden Horizon Villa' status changed to 'available'",
    userId: "agent_alexander",
    userEmail: "alexander@apexluxe.com",
    severity: "info",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "log_3",
    type: "audit",
    message: "User account 'guest_test@apexluxe.com' role promoted to 'Customer'",
    userId: "user_superadmin",
    userEmail: "admin@apexluxe.com",
    severity: "info",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
];

// Helper to simulate API network delay
const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// -------------------------------------------------------------
// DUAL-MODE SERVICE LAYER IMPLEMENTATION
// -------------------------------------------------------------
class DatabaseService {
  private isLocalMode: boolean;

  constructor() {
    this.isLocalMode = !isFirebaseConfigured;
    if (typeof window !== "undefined") {
      this.initLocalStorage();
    }
  }


  private initLocalStorage() {
    if (typeof window === "undefined") return;

    if (!localStorage.getItem("apex_properties")) {
      localStorage.setItem("apex_properties", JSON.stringify(MOCK_PROPERTIES));
    }
    if (!localStorage.getItem("apex_agents")) {
      localStorage.setItem("apex_agents", JSON.stringify(MOCK_AGENTS));
    }
    if (!localStorage.getItem("apex_blogs")) {
      localStorage.setItem("apex_blogs", JSON.stringify(MOCK_BLOGS));
    }
    if (!localStorage.getItem("apex_logs")) {
      localStorage.setItem("apex_logs", JSON.stringify(MOCK_LOGS));
    }
    if (!localStorage.getItem("apex_bookings")) {
      localStorage.setItem("apex_bookings", JSON.stringify([]));
    }
    if (!localStorage.getItem("apex_chat_threads")) {
      localStorage.setItem("apex_chat_threads", JSON.stringify([]));
    }
    if (!localStorage.getItem("apex_chat_messages")) {
      localStorage.setItem("apex_chat_messages", JSON.stringify([]));
    }
    if (!localStorage.getItem("apex_users")) {
      // Seed default accounts
      const defaultUsers = [
        { uid: "user_superadmin", email: "admin@apexluxe.com", displayName: "Super Admin", role: "superadmin", status: "verified" },
        { uid: "agent_alexander", email: "alexander@apexluxe.com", displayName: "Alexander Mercer", role: "agent", status: "verified" },
        { uid: "agent_sophia", email: "sophia@apexluxe.com", displayName: "Sophia Sterling", role: "agent", status: "verified" },
        { uid: "agent_marcus", email: "marcus@apexluxe.com", displayName: "Marcus Vance", role: "agent", status: "verified" },
        { uid: "user_customer", email: "customer@apexluxe.com", displayName: "Sarah Connor", role: "customer", status: "verified" },
      ];
      localStorage.setItem("apex_users", JSON.stringify(defaultUsers));
    }
  }

  isLocal() {
    return this.isLocalMode;
  }

  // -------------------------------------------------------------
  // PROPERTIES CRUD
  // -------------------------------------------------------------
  async getProperties(filters?: {
    type?: string;
    purpose?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    keyword?: string;
  }): Promise<Property[]> {
    await delay();

    if (!this.isLocalMode) {
      try {
        const ref = collection(db, "properties");
        const q = query(ref, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        let properties = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Property));
        
        // Filter in-memory if query filters are provided
        if (filters) {
          properties = this.applyFilters(properties, filters);
        }
        return properties;
      } catch (error) {
        console.warn("Firestore getProperties failed, falling back to local memory: ", error);
        this.isLocalMode = true;
      }
    }

    // Local Storage Fallback
    const list = JSON.parse(localStorage.getItem("apex_properties") || "[]") as Property[];
    let filteredList = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filters) {
      filteredList = this.applyFilters(filteredList, filters);
    }
    return filteredList;
  }

  private applyFilters(properties: Property[], filters: any): Property[] {
    return properties.filter((p) => {
      if (filters.type && filters.type !== "all" && p.type !== filters.type) return false;
      if (filters.purpose && filters.purpose !== "all" && p.purpose !== filters.purpose) return false;
      if (filters.location && filters.location !== "" && !p.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.minPrice && p.price < filters.minPrice) return false;
      if (filters.maxPrice && p.price > filters.maxPrice) return false;
      if (filters.bedrooms && filters.bedrooms !== "any" && p.bedrooms !== Number(filters.bedrooms)) return false;
      if (filters.bathrooms && filters.bathrooms !== "any" && p.bathrooms !== Number(filters.bathrooms)) return false;
      if (filters.keyword && filters.keyword !== "") {
        const key = filters.keyword.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(key);
        const matchesDesc = p.description.toLowerCase().includes(key);
        const matchesLoc = p.location.toLowerCase().includes(key);
        const matchesAddress = p.address.toLowerCase().includes(key);
        const matchesAmenity = p.amenities.some((a) => a.toLowerCase().includes(key));
        if (!matchesTitle && !matchesDesc && !matchesLoc && !matchesAddress && !matchesAmenity) return false;
      }
      return true;
    });
  }

  async getPropertyById(id: string): Promise<Property | null> {
    await delay();

    if (!this.isLocalMode) {
      try {
        const docRef = doc(db, "properties", id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          return { id: snapshot.id, ...snapshot.data() } as Property;
        }
      } catch (error) {
        console.warn("Firestore getPropertyById failed: ", error);
        this.isLocalMode = true;
      }
    }

    const list = JSON.parse(localStorage.getItem("apex_properties") || "[]") as Property[];
    return list.find((p) => p.id === id) || null;
  }

  async createProperty(propertyData: Omit<Property, "id" | "createdAt" | "agentId">, agentId: string): Promise<Property> {
    await delay(500);
    const newProperty: Property = {
      ...propertyData,
      id: "prop_" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      agentId,
      status: "available",
    };

    if (!this.isLocalMode) {
      try {
        const ref = collection(db, "properties");
        const docRef = await addDoc(ref, newProperty);
        newProperty.id = docRef.id;
        await this.logActivity("activity", `Created new property listing: '${newProperty.title}'`, agentId);
        return newProperty;
      } catch (error) {
        console.error("Firestore createProperty failed: ", error);
      }
    }

    // Local Storage
    const list = JSON.parse(localStorage.getItem("apex_properties") || "[]") as Property[];
    list.unshift(newProperty);
    localStorage.setItem("apex_properties", JSON.stringify(list));
    await this.logActivity("activity", `Created new property listing: '${newProperty.title}' (Local Mode)`, agentId);
    return newProperty;
  }

  async updateProperty(id: string, propertyData: Partial<Property>, userId: string): Promise<Property | null> {
    await delay(500);

    if (!this.isLocalMode) {
      try {
        const docRef = doc(db, "properties", id);
        await updateDoc(docRef, propertyData);
        await this.logActivity("activity", `Updated property listing: '${id}'`, userId);
        const updatedDoc = await getDoc(docRef);
        return { id: updatedDoc.id, ...updatedDoc.data() } as Property;
      } catch (error) {
        console.error("Firestore updateProperty failed: ", error);
      }
    }

    // Local Storage
    const list = JSON.parse(localStorage.getItem("apex_properties") || "[]") as Property[];
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const updatedProperty = { ...list[idx], ...propertyData };
    list[idx] = updatedProperty;
    localStorage.setItem("apex_properties", JSON.stringify(list));
    await this.logActivity("activity", `Updated property listing: '${updatedProperty.title}' (Local Mode)`, userId);
    return updatedProperty;
  }

  async deleteProperty(id: string, userId: string): Promise<boolean> {
    await delay();

    if (!this.isLocalMode) {
      try {
        const docRef = doc(db, "properties", id);
        await deleteDoc(docRef);
        await this.logActivity("activity", `Deleted property listing: '${id}'`, userId);
        return true;
      } catch (error) {
        console.error("Firestore deleteProperty failed: ", error);
      }
    }

    const list = JSON.parse(localStorage.getItem("apex_properties") || "[]") as Property[];
    const filtered = list.filter((p) => p.id !== id);
    localStorage.setItem("apex_properties", JSON.stringify(filtered));
    await this.logActivity("activity", `Deleted property listing: '${id}' (Local Mode)`, userId);
    return true;
  }

  // -------------------------------------------------------------
  // AGENTS
  // -------------------------------------------------------------
  async getAgents(): Promise<Agent[]> {
    await delay();
    if (!this.isLocalMode) {
      try {
        const ref = collection(db, "agents");
        const snapshot = await getDocs(ref);
        if (!snapshot.empty) {
          return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Agent));
        }
      } catch (e) {
        console.warn("Firestore getAgents failed: ", e);
        this.isLocalMode = true;
      }
    }
    return JSON.parse(localStorage.getItem("apex_agents") || "[]") as Agent[];
  }

  async getAgentById(id: string): Promise<Agent | null> {
    await delay();
    const list = await this.getAgents();
    return list.find((a) => a.id === id) || null;
  }

  // -------------------------------------------------------------
  // BOOKINGS / APPOINTMENTS
  // -------------------------------------------------------------
  async getBookings(userId: string, role: string): Promise<Booking[]> {
    await delay();
    if (!this.isLocalMode) {
      try {
        const ref = collection(db, "bookings");
        let q = query(ref, orderBy("createdAt", "desc"));
        if (role === "customer") {
          q = query(ref, where("customerId", "==", userId), orderBy("createdAt", "desc"));
        } else if (role === "agent") {
          q = query(ref, where("agentId", "==", userId), orderBy("createdAt", "desc"));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
      } catch (error) {
        console.warn("Firestore getBookings failed, fallback to local: ", error);
        this.isLocalMode = true;
      }
    }

    const list = JSON.parse(localStorage.getItem("apex_bookings") || "[]") as Booking[];
    let filtered = list;
    if (role === "customer") {
      filtered = list.filter((b) => b.customerId === userId);
    } else if (role === "agent") {
      filtered = list.filter((b) => b.agentId === userId);
    }
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createBooking(bookingData: Omit<Booking, "id" | "createdAt" | "status">): Promise<Booking> {
    await delay(500);
    const newBooking: Booking = {
      ...bookingData,
      id: "book_" + Math.random().toString(36).substr(2, 9),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    if (!this.isLocalMode) {
      try {
        const ref = collection(db, "bookings");
        const docRef = await addDoc(ref, newBooking);
        newBooking.id = docRef.id;
        await this.logActivity("activity", `Requested visit booking for '${bookingData.propertyTitle}'`, bookingData.customerId);
        return newBooking;
      } catch (error) {
        console.error("Firestore createBooking failed: ", error);
      }
    }

    const list = JSON.parse(localStorage.getItem("apex_bookings") || "[]") as Booking[];
    list.unshift(newBooking);
    localStorage.setItem("apex_bookings", JSON.stringify(list));
    await this.logActivity("activity", `Requested visit booking for '${bookingData.propertyTitle}' (Local Mode)`, bookingData.customerId);
    return newBooking;
  }

  async updateBookingStatus(bookingId: string, status: Booking["status"], userId: string, notes?: string): Promise<Booking | null> {
    await delay();
    if (!this.isLocalMode) {
      try {
        const docRef = doc(db, "bookings", bookingId);
        const updateData: any = { status };
        if (notes) updateData.notes = notes;
        await updateDoc(docRef, updateData);
        const updated = await getDoc(docRef);
        return { id: updated.id, ...updated.data() } as Booking;
      } catch (e) {
        console.error(e);
      }
    }

    const list = JSON.parse(localStorage.getItem("apex_bookings") || "[]") as Booking[];
    const idx = list.findIndex((b) => b.id === bookingId);
    if (idx === -1) return null;
    list[idx].status = status;
    if (notes) list[idx].notes = notes;
    localStorage.setItem("apex_bookings", JSON.stringify(list));
    return list[idx];
  }

  // -------------------------------------------------------------
  // CHAT / COMMUNICATIONS
  // -------------------------------------------------------------
  async getChatThreads(userId: string): Promise<ChatThread[]> {
    await delay();
    if (!this.isLocalMode) {
      try {
        const ref = collection(db, "chat_threads");
        const q = query(ref, where("participants", "array-contains", userId), orderBy("lastMessageAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ChatThread));
      } catch (e) {
        console.warn("Firestore getChatThreads failed: ", e);
        this.isLocalMode = true;
      }
    }

    const threads = JSON.parse(localStorage.getItem("apex_chat_threads") || "[]") as ChatThread[];
    return threads
      .filter((t) => t.participants.includes(userId))
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }

  async getMessages(chatId: string): Promise<ChatMessage[]> {
    await delay();
    if (!this.isLocalMode) {
      try {
        const ref = collection(db, "chat_messages");
        const q = query(ref, where("chatId", "==", chatId), orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
      } catch (e) {
        console.warn("Firestore getMessages failed: ", e);
        this.isLocalMode = true;
      }
    }

    const msgs = JSON.parse(localStorage.getItem("apex_chat_messages") || "[]") as ChatMessage[];
    return msgs.filter((m) => m.chatId === chatId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async sendMessage(
    senderId: string,
    senderName: string,
    recipientId: string,
    recipientDetails: { name: string; avatar: string; role: string },
    senderDetails: { name: string; avatar: string; role: string },
    text: string,
    propertyData?: { id: string; title: string }
  ): Promise<ChatMessage> {
    await delay();

    const threadId = [senderId, recipientId].sort().join("_");
    const now = new Date().toISOString();

    const message: ChatMessage = {
      id: "msg_" + Math.random().toString(36).substr(2, 9),
      chatId: threadId,
      senderId,
      senderName,
      text,
      createdAt: now,
      propertyId: propertyData?.id,
    };

    const threadUpdate: ChatThread = {
      id: threadId,
      participants: [senderId, recipientId],
      participantDetails: {
        [senderId]: senderDetails,
        [recipientId]: recipientDetails,
      },
      lastMessage: text,
      lastMessageAt: now,
      propertyId: propertyData?.id,
      propertyTitle: propertyData?.title,
    };

    if (!this.isLocalMode) {
      try {
        // Send message
        const msgRef = collection(db, "chat_messages");
        await addDoc(msgRef, message);

        // Update/create thread doc
        // Note: In real app, you might use setDoc with merge: true to update or create
        // We simulate it here
        const threadRef = collection(db, "chat_threads");
        const tQ = query(threadRef, where("id", "==", threadId));
        const tSnap = await getDocs(tQ);
        if (tSnap.empty) {
          await addDoc(threadRef, threadUpdate);
        } else {
          const tDocId = tSnap.docs[0].id;
          await updateDoc(doc(db, "chat_threads", tDocId), {
            lastMessage: text,
            lastMessageAt: now,
          });
        }
        return message;
      } catch (error) {
        console.error("Firestore sendMessage failed: ", error);
      }
    }

    // Local Storage
    const messages = JSON.parse(localStorage.getItem("apex_chat_messages") || "[]") as ChatMessage[];
    messages.push(message);
    localStorage.setItem("apex_chat_messages", JSON.stringify(messages));

    const threads = JSON.parse(localStorage.getItem("apex_chat_threads") || "[]") as ChatThread[];
    const tIdx = threads.findIndex((t) => t.id === threadId);
    if (tIdx === -1) {
      threads.push(threadUpdate);
    } else {
      threads[tIdx] = {
        ...threads[tIdx],
        lastMessage: text,
        lastMessageAt: now,
      };
    }
    localStorage.setItem("apex_chat_threads", JSON.stringify(threads));

    return message;
  }

  // -------------------------------------------------------------
  // SYSTEM AUDIT & ACTIVITY LOGS
  // -------------------------------------------------------------
  async getLogs(type?: "activity" | "audit" | "security"): Promise<SystemLog[]> {
    await delay();
    if (!this.isLocalMode) {
      try {
        const ref = collection(db, "logs");
        let q = query(ref, orderBy("timestamp", "desc"));
        if (type) {
          q = query(ref, where("type", "==", type), orderBy("timestamp", "desc"));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SystemLog));
      } catch (e) {
        console.warn("Firestore getLogs failed: ", e);
        this.isLocalMode = true;
      }
    }

    const list = JSON.parse(localStorage.getItem("apex_logs") || "[]") as SystemLog[];
    let filtered = list;
    if (type) {
      filtered = list.filter((l) => l.type === type);
    }
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async logActivity(
    type: SystemLog["type"],
    message: string,
    userId: string,
    severity: SystemLog["severity"] = "info"
  ): Promise<void> {
    const users = JSON.parse(localStorage.getItem("apex_users") || "[]");
    const user = users.find((u: any) => u.uid === userId) || { email: "system@apexluxe.com" };
    
    const newLog: SystemLog = {
      id: "log_" + Math.random().toString(36).substr(2, 9),
      type,
      message,
      userId,
      userEmail: user.email,
      severity,
      timestamp: new Date().toISOString(),
    };

    if (!this.isLocalMode) {
      try {
        const ref = collection(db, "logs");
        await addDoc(ref, newLog);
        return;
      } catch (e) {
        console.error(e);
      }
    }

    const list = JSON.parse(localStorage.getItem("apex_logs") || "[]") as SystemLog[];
    list.unshift(newLog);
    // Keep max 200 logs locally
    if (list.length > 200) list.pop();
    localStorage.setItem("apex_logs", JSON.stringify(list));
  }

  // -------------------------------------------------------------
  // USER PROFILES & ROLES
  // -------------------------------------------------------------
  async getAllUsers(): Promise<any[]> {
    await delay();
    if (!this.isLocalMode) {
      try {
        const ref = collection(db, "users");
        const snapshot = await getDocs(ref);
        return snapshot.docs.map((d) => ({ uid: d.id, ...d.data() }));
      } catch (e) {
        console.warn("Firestore getAllUsers failed: ", e);
        this.isLocalMode = true;
      }
    }
    return JSON.parse(localStorage.getItem("apex_users") || "[]");
  }  async createUserProfile(uid: string, data: any): Promise<boolean> {
    await delay();
    if (!this.isLocalMode) {
      try {
        const docRef = doc(db, "users", uid);
        await setDoc(docRef, data);
        return true;
      } catch (e) {
        console.warn("Firestore createUserProfile failed: ", e);
      }
    }
    const localUsers = JSON.parse(localStorage.getItem("apex_users") || "[]");
    localUsers.push({ uid, ...data });
    localStorage.setItem("apex_users", JSON.stringify(localUsers));
    return true;
  }  async getUserById(uid: string): Promise<any | null> {
    await delay();
    if (!this.isLocalMode) {
      try {
        const docRef = doc(db, "users", uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          return { uid: snapshot.id, ...snapshot.data() };
        }
      } catch (e) {
        console.warn("Firestore getUserById failed: ", e);
      }
    }
    const localUsers = JSON.parse(localStorage.getItem("apex_users") || "[]");
    return localUsers.find((u: any) => u.uid === uid) || null;
  }

  async updateUserRole(uid: string, role: string, adminUserId: string): Promise<boolean> {
    await delay();
    if (!this.isLocalMode) {
      try {
        const docRef = doc(db, "users", uid);
        await updateDoc(docRef, { role });
        await this.logActivity("audit", `User ${uid} role updated to ${role}`, adminUserId, "warning");
        return true;
      } catch (e) {
        console.error(e);
      }
    }

    const users = JSON.parse(localStorage.getItem("apex_users") || "[]");
    const uIdx = users.findIndex((u: any) => u.uid === uid);
    if (uIdx === -1) return false;
    const oldRole = users[uIdx].role;
    users[uIdx].role = role;
    localStorage.setItem("apex_users", JSON.stringify(users));
    await this.logActivity("audit", `User '${users[uIdx].email}' role updated from ${oldRole} to ${role} (Local Mode)`, adminUserId, "warning");
    return true;
  }

  // -------------------------------------------------------------
  // BLOGS
  // -------------------------------------------------------------
  async getBlogs(): Promise<BlogPost[]> {
    await delay();
    if (!this.isLocalMode) {
      try {
        const ref = collection(db, "blogs");
        const q = query(ref, orderBy("publishedAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost));
      } catch (e) {
        console.warn("Firestore getBlogs failed: ", e);
        this.isLocalMode = true;
      }
    }
    const list = JSON.parse(localStorage.getItem("apex_blogs") || "[]") as BlogPost[];
    return list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  async createBlog(blog: Omit<BlogPost, "id" | "publishedAt" | "readTime" | "authorName">, authorName: string): Promise<BlogPost> {
    await delay();
    const newBlog: BlogPost = {
      ...blog,
      id: "blog_" + Math.random().toString(36).substr(2, 9),
      authorName,
      publishedAt: new Date().toISOString().split("T")[0],
      readTime: "4 min read",
    };

    if (!this.isLocalMode) {
      try {
        const ref = collection(db, "blogs");
        const docRef = await addDoc(ref, newBlog);
        newBlog.id = docRef.id;
        return newBlog;
      } catch (e) {
        console.error(e);
      }
    }

    const list = JSON.parse(localStorage.getItem("apex_blogs") || "[]") as BlogPost[];
    list.unshift(newBlog);
    localStorage.setItem("apex_blogs", JSON.stringify(list));
    return newBlog;
  }

  async deleteBlog(id: string): Promise<boolean> {
    await delay();
    if (!this.isLocalMode) {
      try {
        const docRef = doc(db, "blogs", id);
        await deleteDoc(docRef);
        return true;
      } catch (e) {
        console.error(e);
      }
    }

    const list = JSON.parse(localStorage.getItem("apex_blogs") || "[]") as BlogPost[];
    const filtered = list.filter((b) => b.id !== id);
    localStorage.setItem("apex_blogs", JSON.stringify(filtered));
    return true;
  }
}

export const dbService = new DatabaseService();
export default dbService;
