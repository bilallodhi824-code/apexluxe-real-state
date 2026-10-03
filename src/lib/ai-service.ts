import { dbService, Property } from "./db-service";

interface SmartFilters {
  purpose?: "sale" | "rent" | "all";
  type?: string;
  maxPrice?: number;
  minPrice?: number;
  bedrooms?: number;
  keyword?: string;
}

export const aiService = {
  // -------------------------------------------------------------
  // AI NATURAL LANGUAGE SMART SEARCH PARSER
  // -------------------------------------------------------------
  parseSmartSearch: async (queryText: string): Promise<SmartFilters> => {
    await new Promise((r) => setTimeout(r, 600)); // Simulating LLM parse latency
    const normalized = queryText.toLowerCase();
    const filters: SmartFilters = {};

    // Purpose matching
    if (normalized.includes("rent") || normalized.includes("lease") || normalized.includes("monthly")) {
      filters.purpose = "rent";
    } else if (normalized.includes("buy") || normalized.includes("sale") || normalized.includes("purchase")) {
      filters.purpose = "sale";
    }

    // Type matching
    if (normalized.includes("apartment") || normalized.includes("flat") || normalized.includes("penthouse")) {
      filters.type = "apartment";
    } else if (normalized.includes("villa") || normalized.includes("mansion") || normalized.includes("estate")) {
      filters.type = "villa";
    } else if (normalized.includes("office") || normalized.includes("corporate") || normalized.includes("workplace")) {
      filters.type = "office";
    } else if (normalized.includes("farmhouse") || normalized.includes("ranch") || normalized.includes("vineyard")) {
      filters.type = "farmhouse";
    } else if (normalized.includes("commercial")) {
      filters.type = "commercial";
    }

    // Bedroom matching
    const bedMatch = normalized.match(/(\d+)\s*(?:bed|bedroom|br)/);
    if (bedMatch) {
      filters.bedrooms = parseInt(bedMatch[1]);
    } else if (normalized.includes("one bedroom") || normalized.includes("1 bed")) {
      filters.bedrooms = 1;
    } else if (normalized.includes("two bedroom") || normalized.includes("2 bed")) {
      filters.bedrooms = 2;
    } else if (normalized.includes("three bedroom") || normalized.includes("3 bed")) {
      filters.bedrooms = 3;
    } else if (normalized.includes("four bedroom") || normalized.includes("4 bed")) {
      filters.bedrooms = 4;
    } else if (normalized.includes("five bedroom") || normalized.includes("5 bed")) {
      filters.bedrooms = 5;
    }

    // Price extraction (e.g., "under 5000", "under 10M", "less than 2000000")
    const maxPriceMatch = normalized.match(/(?:under|below|less than|max|up to)\s*(?:[\$\£\€]?)\s*([\d\.,]+)\s*(m|million|k|thousand)?/);
    if (maxPriceMatch) {
      let value = parseFloat(maxPriceMatch[1].replace(/,/g, ""));
      const unit = maxPriceMatch[2];
      if (unit === "m" || unit === "million") {
        value = value * 1000000;
      } else if (unit === "k" || unit === "thousand") {
        value = value * 1000;
      }
      filters.maxPrice = value;
    }

    // Keyword collection
    const keywords = ["pool", "beach", "ocean", "view", "parking", "garden", "gym", "security", "theater", "concierge"];
    for (const kw of keywords) {
      if (normalized.includes(kw)) {
        filters.keyword = kw;
        break;
      }
    }

    if (!filters.keyword && !filters.type && !filters.purpose && !filters.maxPrice && !filters.bedrooms) {
      // Fallback: put first two words as keyword
      const words = queryText.split(" ").slice(0, 3).join(" ");
      filters.keyword = words;
    }

    return filters;
  },

  // -------------------------------------------------------------
  // AI PROPERTY RECOMMENDATIONS ENGINE
  // -------------------------------------------------------------
  getRecommendations: async (userInterests: string[]): Promise<Property[]> => {
    await new Promise((r) => setTimeout(r, 400));
    const allProps = await dbService.getProperties();
    if (userInterests.length === 0) {
      // Default to featured properties
      return allProps.filter((p) => p.featured).slice(0, 3);
    }

    const scored = allProps.map((p) => {
      let score = 0;
      userInterests.forEach((interest) => {
        const normInt = interest.toLowerCase();
        if (p.title.toLowerCase().includes(normInt)) score += 10;
        if (p.description.toLowerCase().includes(normInt)) score += 5;
        if (p.location.toLowerCase().includes(normInt)) score += 8;
        if (p.type.toLowerCase() === normInt) score += 12;
        if (p.amenities.some((a) => a.toLowerCase().includes(normInt))) score += 4;
      });
      return { p, score };
    });

    return scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.p)
      .slice(0, 3);
  },

  // -------------------------------------------------------------
  // AI DESCRIPTION GENERATOR
  // -------------------------------------------------------------
  generateDescription: async (title: string, type: string, location: string, amenities: string[]): Promise<string> => {
    await new Promise((r) => setTimeout(r, 1000)); // Simulating LLM deep generation

    const intros = [
      `A magnificent opportunity awaits at ${title}, an elite ${type} listing situated in the premier residential sector of ${location}.`,
      `Perfectly located in ${location}, ${title} sets a brand-new standard for contemporary ${type} luxury.`,
      `Boasting a spectacular layout and state-of-the-art details, ${title} is a signature ${type} located in ${location}.`,
    ];

    const body = `This exceptional property has been designed with meticulous attention to detail. The layout maximizes natural light filtration and capitalizes on breathtaking local viewpoints. Seamlessly integrating organic design values with architectural concrete frames, the interior represents a sophisticated modern vision.`;

    const amenitySentence = amenities.length > 0 
      ? `Residents will enjoy a comprehensive collection of elite amenities, including a premium ${amenities.slice(0, 3).join(", ")}, and much more.`
      : `Complete with custom detailing, premium security gates, and central environment controls.`;

    const outro = `Representing an unrivaled lifestyle of luxury and convenience, this listing stands as a true trophy property in ${location}. Private viewings can be scheduled exclusively by contacting ApexLuxe advisors.`;

    const randomIntro = intros[Math.floor(Math.random() * intros.length)];
    return `${randomIntro}\n\n${body}\n\n${amenitySentence}\n\n${outro}`;
  },

  // -------------------------------------------------------------
  // AI PRICE ESTIMATOR
  // -------------------------------------------------------------
  estimatePrice: async (
    type: string,
    area: number,
    location: string,
    amenitiesCount: number
  ): Promise<{
    estimatedPrice: number;
    lowRange: number;
    highRange: number;
    breakdown: { label: string; amount: number }[];
  }> => {
    await new Promise((r) => setTimeout(r, 800));

    // Base value per sqft depending on type
    let basePricePerSqft = 350;
    if (type === "villa" || type === "luxury") basePricePerSqft = 850;
    if (type === "apartment") basePricePerSqft = 500;
    if (type === "office") basePricePerSqft = 400;
    if (type === "farmhouse") basePricePerSqft = 450;

    // Location coefficients
    let locMultiplier = 1.0;
    const locLower = location.toLowerCase();
    if (locLower.includes("palm") || locLower.includes("jumeirah") || locLower.includes("beverly") || locLower.includes("fifth")) {
      locMultiplier = 2.4;
    } else if (locLower.includes("manhattan") || locLower.includes("dubai") || locLower.includes("london")) {
      locMultiplier = 1.8;
    } else if (locLower.includes("riyadh") || locLower.includes("saudi")) {
      locMultiplier = 1.3;
    }

    const baseVal = area * basePricePerSqft;
    const locationPremium = baseVal * (locMultiplier - 1);
    const amenitiesPremium = amenitiesCount * 18000;
    const totalEst = baseVal + locationPremium + amenitiesPremium;

    // Rounded
    const estimatedPrice = Math.round(totalEst);
    const lowRange = Math.round(estimatedPrice * 0.92);
    const highRange = Math.round(estimatedPrice * 1.08);

    return {
      estimatedPrice,
      lowRange,
      highRange,
      breakdown: [
        { label: "Base Structural Value", amount: Math.round(baseVal) },
        { label: "Geographic Location Premium", amount: Math.round(locationPremium) },
        { label: "Luxury Amenities Markup", amount: Math.round(amenitiesPremium) },
      ],
    };
  },

  // -------------------------------------------------------------
  // AI MARKET INSIGHTS
  // -------------------------------------------------------------
  getMarketInsights: async (location: string) => {
    await new Promise((r) => setTimeout(r, 500));
    
    // Custom market indicators based on location
    const isPremium = /palm|jumeirah|beverly|manhattan|fifth/i.test(location);
    const growthRate = isPremium ? 12.4 : 7.2;
    const averageDays = isPremium ? 45 : 68;
    const demandScore = isPremium ? "Very High" : "Moderate";

    // Chart trend coordinates (past 6 quarters)
    const trendData = [
      { quarter: "Q1 2025", pricePerSqft: isPremium ? 1800 : 800 },
      { quarter: "Q2 2025", pricePerSqft: isPremium ? 1850 : 810 },
      { quarter: "Q3 2025", pricePerSqft: isPremium ? 1920 : 830 },
      { quarter: "Q4 2025", pricePerSqft: isPremium ? 2040 : 845 },
      { quarter: "Q1 2026", pricePerSqft: isPremium ? 2150 : 870 },
      { quarter: "Q2 2026", pricePerSqft: isPremium ? 2280 : 895 },
    ];

    return {
      growthRate,
      averageDays,
      demandScore,
      trendData,
      investmentGrade: isPremium ? "AAA Premium" : "A Growth",
      localNotes: isPremium 
        ? "Demand continues to outstrip available primary beachfront inventory. Rent values are projected to climb an additional 8% over the next quarter."
        : "Market exhibits healthy, stable appreciation with new transit connections driving search volume.",
    };
  },

  // -------------------------------------------------------------
  // AI IMAGE ENHANCEMENT SUGGESTIONS
  // -------------------------------------------------------------
  analyzeImageQuality: async (imageUrlsCount: number) => {
    await new Promise((r) => setTimeout(r, 600));

    if (imageUrlsCount === 0) {
      return {
        score: 0,
        status: "Missing media",
        tips: ["Upload at least 3 high-resolution images to list.", "Capture property exterior during Golden Hour.", "Ensure interiors are staged and brightly illuminated."],
      };
    }

    const tips = [];
    let score = 70;

    if (imageUrlsCount < 3) {
      score -= 20;
      tips.push("Add more images: Listings with 3+ images receive up to 180% more inquiries.");
    } else {
      tips.push("Excellent photo volume. Ensure you include structural layouts.");
    }

    tips.push("AI Analysis: Lighting is adequate. We recommend minor exposure adjustment (+5%) for shadow details.");
    tips.push("AI Analysis: Framing displays 92% vertical alignment. Crop ratio fits standard web grid beautifully.");
    tips.push("Tip: Adding a 360 virtual tour increases engagement by 40%.");

    return {
      score: Math.min(score + (imageUrlsCount * 3), 98),
      status: score >= 80 ? "Optimal Presentation" : "Needs Optimization",
      tips,
    };
  },
};

export default aiService;
