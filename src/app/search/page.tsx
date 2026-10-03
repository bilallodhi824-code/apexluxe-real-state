"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { dbService, Property } from "@/lib/db-service";
import { aiService } from "@/lib/ai-service";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Sparkles,
  Map as MapIcon,
  List,
  Eye,
  School,
  Activity,
  Trees,
  Compass,
  Navigation
} from "lucide-react";

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="h-10 w-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 font-mono text-xs">Loading property listings...</p>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Filters State
  const [purpose, setPurpose] = useState(searchParams.get("purpose") || "all");
  const [type, setType] = useState(searchParams.get("type") || "all");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") || "any");
  const [bathrooms, setBathrooms] = useState(searchParams.get("bathrooms") || "any");
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  
  // Layout Options
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [sortBy, setSortBy] = useState("recent");

  // AI Prompt search states
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSearching, setAiSearching] = useState(false);
  const [isAiApplied, setIsAiApplied] = useState(searchParams.get("ai") === "true");

  // Property results
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Map settings
  const [showSchools, setShowSchools] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showParks, setShowParks] = useState(false);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [selectedMapProp, setSelectedMapProp] = useState<Property | null>(null);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const filters = {
        purpose: purpose !== "all" ? purpose : undefined,
        type: type !== "all" ? type : undefined,
        location: location || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        bedrooms: bedrooms !== "any" ? Number(bedrooms) : undefined,
        bathrooms: bathrooms !== "any" ? Number(bathrooms) : undefined,
        keyword: keyword || undefined,
      };

      let results = await dbService.getProperties(filters);

      if (sortBy === "price_asc") {
        results.sort((a, b) => a.price - b.price);
      } else if (sortBy === "price_desc") {
        results.sort((a, b) => b.price - a.price);
      } else {
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      setProperties(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Synchronize state with URL parameters (for client-side search links)
  useEffect(() => {
    setPurpose(searchParams.get("purpose") || "all");
    setType(searchParams.get("type") || "all");
    setLocation(searchParams.get("location") || "");
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
    setBedrooms(searchParams.get("bedrooms") || "any");
    setBathrooms(searchParams.get("bathrooms") || "any");
    setKeyword(searchParams.get("keyword") || "");
    setIsAiApplied(searchParams.get("ai") === "true");
  }, [searchParams]);

  useEffect(() => {
    fetchProperties();
  }, [purpose, type, location, minPrice, maxPrice, bedrooms, bathrooms, keyword, sortBy]);

  const handleAiSmartSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setAiSearching(true);
    try {
      const parsed = await aiService.parseSmartSearch(aiPrompt);
      if (parsed.purpose) setPurpose(parsed.purpose);
      if (parsed.type) setType(parsed.type);
      if (parsed.maxPrice) setMaxPrice(parsed.maxPrice.toString());
      if (parsed.bedrooms) setBedrooms(parsed.bedrooms.toString());
      if (parsed.keyword) setKeyword(parsed.keyword);
      setIsAiApplied(true);
      setAiPrompt("");
    } catch (err) {
      console.error(err);
    } finally {
      setAiSearching(false);
    }
  };

  const handleResetFilters = () => {
    setPurpose("all");
    setType("all");
    setLocation("");
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("any");
    setBathrooms("any");
    setKeyword("");
    setIsAiApplied(false);
  };

  // Coordinates mapping
  const getCoordinates = (i: number) => {
    return {
      latPercent: 30 + ((i * 19) % 55),
      lngPercent: 20 + ((i * 27) % 65)
    };
  };

  const mockMapAmenities = [
    { name: "Westside Academy", lat: 35, lng: 42, type: "school" },
    { name: "City Health Hospital", lat: 60, lng: 72, type: "hospital" },
    { name: "Sunset Park", lat: 25, lng: 65, type: "park" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-slate-500" /> Find Properties
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Search our catalog of verified residential, commercial, and rental properties.</p>
        </div>

        {/* View Mode controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
              viewMode === "grid" 
                ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-950 dark:border-slate-150"
                : "border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-950 dark:hover:text-slate-200"
            }`}
          >
            <List className="h-4 w-4" /> Listings Grid
          </button>
          <button 
            onClick={() => setViewMode("map")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
              viewMode === "map" 
                ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-950 dark:border-slate-150"
                : "border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-950 dark:hover:text-slate-200"
            }`}
          >
            <MapIcon className="h-4 w-4" /> Map View ({properties.length})
          </button>
        </div>
      </div>

      {/* AI search box */}
      <div className="bg-slate-50 dark:bg-[#0F131C] p-4 rounded-xl border border-slate-250/60 dark:border-slate-800/80 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="max-w-md">
          <h3 className="text-xs font-bold text-slate-700 dark:text-amber-500 flex items-center gap-1.5 uppercase font-mono">
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" /> AI Search Filter
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Type description requirements in plain English. The AI engine will parse details and filter properties automatically.
          </p>
        </div>
        <form onSubmit={handleAiSmartSearchSubmit} className="flex-grow max-w-lg flex items-center gap-2">
          <input 
            type="text" 
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g. 'Apartment in Manhattan with park view under 5000000'"
            className="flex-grow bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400"
          />
          <button 
            type="submit"
            disabled={aiSearching}
            className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-4 py-2 rounded-lg text-xs font-semibold uppercase hover:opacity-90 shrink-0 transition-all cursor-pointer"
          >
            {aiSearching ? "Parsing..." : "Apply"}
          </button>
        </form>
      </div>

      {isAiApplied && (
        <div className="mb-6 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-500 px-4 py-2 rounded-lg text-xs font-bold font-mono animate-scale-in">
          <Sparkles className="h-4 w-4 text-amber-500" />
          AI Search Filter Applied.
          <button onClick={handleResetFilters} className="underline ml-auto hover:opacity-80 font-sans font-normal">
            Reset Filters
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase font-mono">Filters</h3>
            <button onClick={handleResetFilters} className="text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-bold uppercase font-mono">
              Clear All
            </button>
          </div>

          {/* Keyword */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Keywords</label>
            <div className="relative">
              <input 
                type="text" 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Pool, garden, view..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none"
              />
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* Intent */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Listing Intent</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              {["all", "sale", "rent"].map((item) => (
                <button
                  key={item}
                  onClick={() => setPurpose(item)}
                  className={`py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    purpose === item 
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-700" 
                      : "text-slate-550 hover:text-slate-800 dark:text-slate-400"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Property Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="villa">Luxury Villa</option>
              <option value="apartment">Sky Apartment</option>
              <option value="office">Commercial Office</option>
              <option value="farmhouse">Scenic Farmhouse</option>
            </select>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">City / Location</label>
            <input 
              type="text" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Manhattan, Dubai" 
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none"
            />
          </div>

          {/* Price */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Price Limits ($)</label>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number" 
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min" 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none"
              />
              <input 
                type="number" 
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max" 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Bed/Baths */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Bedrooms</label>
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="any">Any</option>
                <option value="1">1 Bed</option>
                <option value="2">2 Beds</option>
                <option value="3">3 Beds</option>
                <option value="4">4 Beds</option>
                <option value="5">5+ Beds</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Bathrooms</label>
              <select
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="any">Any</option>
                <option value="1">1 Bath</option>
                <option value="2">2 Baths</option>
                <option value="3">3+ Baths</option>
              </select>
            </div>
          </div>

          {/* Sorting */}
          <div className="space-y-1 pt-3 border-t border-slate-100 dark:border-slate-850">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="recent">Recently Added</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Results Listings Container */}
        <div className="lg:col-span-3">
          {viewMode === "grid" ? (
            /* A. GRID VIEW */
            loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-80 rounded-xl bg-slate-200 dark:bg-slate-800/35 animate-pulse"></div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="bg-white dark:bg-[#0F131C] p-16 rounded-xl border border-slate-200 dark:border-slate-800/80 text-center">
                <Compass className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250">No Listings Matched</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Try adjusting the filters or rewriting the search requirements in the AI input box.
                </p>
                <button 
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 text-xs font-semibold rounded-lg hover:opacity-90 cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {properties.map((prop) => (
                  <div 
                    key={prop.id}
                    onMouseEnter={() => setHoveredPropertyId(prop.id)}
                    onMouseLeave={() => setHoveredPropertyId(null)}
                    className="bg-white dark:bg-[#0F131C] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800/80 hover:shadow-sm transition-all group flex flex-col justify-between"
                  >
                    <div className="relative h-52 w-full overflow-hidden">
                      <img src={prop.images[0]} alt={prop.title} className="object-cover w-full h-full" />
                      <div className="absolute top-3 left-3 bg-slate-950/80 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-white">
                        For {prop.purpose}
                      </div>
                      <div className="absolute bottom-3 right-3 bg-slate-950/90 text-white px-2.5 py-1 rounded text-xs font-bold border border-slate-800 font-mono">
                        {prop.purpose === "rent" ? `$${prop.price.toLocaleString()}/mo` : `$${prop.price.toLocaleString()}`}
                      </div>
                    </div>

                    <div className="p-5 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-1">
                          <MapPin className="h-3 w-3 text-slate-400 animate-bounce" />
                          <span>{prop.location}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors line-clamp-1">
                          {prop.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {prop.description}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-2.5 my-3 text-[10px] text-slate-500 dark:text-slate-450 font-mono">
                          {prop.bedrooms && (
                            <span className="flex items-center gap-0.5"><BedDouble className="h-3.5 w-3.5" /> {prop.bedrooms} Bed</span>
                          )}
                          {prop.bathrooms && (
                            <span className="flex items-center gap-0.5"><Bath className="h-3.5 w-3.5" /> {prop.bathrooms} Bath</span>
                          )}
                          <span><Maximize className="h-3.5 w-3.5 inline mr-0.5" />{prop.area.toLocaleString()} sqft</span>
                        </div>

                        <Link 
                          href={`/property/${prop.id}`}
                          className="w-full block text-center py-2 text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:border-amber-600 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-500 rounded-lg transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* B. HUMAN-DESIGNED STYLIZED CITY SVG VECTOR MAP VIEW */
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch min-h-[460px]">
              
              {/* Stylized Vector SVG City Map */}
              <div className="md:col-span-2 bg-[#F1F3F5] dark:bg-[#07090F] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative flex flex-col justify-between p-4 shadow-inner min-h-[420px]">
                
                {/* Map Control bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg z-10 w-full mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1">
                    <Compass className="h-3.5 w-3.5 text-slate-400" /> Vector City Map Selector
                  </span>
                  
                  {/* Select Toggles */}
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => setShowSchools(!showSchools)}
                      className={`px-2 py-1 rounded text-[9px] font-semibold border transition-all cursor-pointer ${
                        showSchools ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 border-slate-900" : "border-slate-200 dark:border-slate-800 text-slate-400"
                      }`}
                    >
                      <School className="h-3.5 w-3.5 inline mr-1" /> Schools
                    </button>
                    <button 
                      onClick={() => setShowHospitals(!showHospitals)}
                      className={`px-2 py-1 rounded text-[9px] font-semibold border transition-all cursor-pointer ${
                        showHospitals ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 border-slate-900" : "border-slate-200 dark:border-slate-800 text-slate-400"
                      }`}
                    >
                      <Activity className="h-3.5 w-3.5 inline mr-1" /> Health Clinics
                    </button>
                  </div>
                </div>

                {/* SVG Visual City Layer */}
                <div className="relative flex-grow w-full rounded-lg bg-[#E9ECEF] dark:bg-[#05070A] overflow-hidden min-h-[280px]">
                  
                  <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
                    {/* Ocean Harbor Wave */}
                    <path d="M 0 260 Q 80 230 180 280 T 380 220 T 500 240 L 500 400 L 0 400 Z" fill="#D0EBFF" className="dark:fill-[#1C2C40] opacity-40" />
                    
                    {/* City Grid Avenues */}
                    <line x1="80" y1="0" x2="80" y2="400" stroke="#CED4DA" strokeWidth="2" className="dark:stroke-slate-800" />
                    <line x1="280" y1="0" x2="280" y2="400" stroke="#CED4DA" strokeWidth="2" className="dark:stroke-slate-800" strokeDasharray="3 3" />
                    <line x1="0" y1="120" x2="500" y2="120" stroke="#CED4DA" strokeWidth="2" className="dark:stroke-slate-800" />
                    <line x1="0" y1="290" x2="500" y2="290" stroke="#CED4DA" strokeWidth="2" className="dark:stroke-slate-800" />

                    {/* Avenue Labels */}
                    <text x="90" y="20" fill="#adb5bd" fontSize="8" fontFamily="monospace" className="dark:fill-slate-600">BROADWAY AVE</text>
                    <text x="10" y="110" fill="#adb5bd" fontSize="8" fontFamily="monospace" className="dark:fill-slate-600">1ST STREET</text>
                    
                    {/* Render directions route if property is selected */}
                    {selectedMapProp && (
                      <path 
                        d="M 80 120 L 280 120 L 280 290" 
                        fill="none" 
                        stroke="#B45309" 
                        strokeWidth="1.5" 
                        strokeDasharray="4 4" 
                        className="animate-pulse"
                      />
                    )}
                  </svg>

                  {/* Render Static Map Landmarks (Schools, Health Centers) */}
                  {showSchools && mockMapAmenities.filter(m => m.type === "school").map((mark, i) => (
                    <div 
                      key={i}
                      style={{ top: `${mark.lat}%`, left: `${mark.lng}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 bg-blue-500/10 border border-blue-400 text-blue-500 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 z-10 cursor-help"
                      title={mark.name}
                    >
                      <School className="h-3 w-3" />
                      <span>School</span>
                    </div>
                  ))}

                  {showHospitals && mockMapAmenities.filter(m => m.type === "hospital").map((mark, i) => (
                    <div 
                      key={i}
                      style={{ top: `${mark.lat}%`, left: `${mark.lng}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 bg-red-500/10 border border-red-400 text-red-500 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 z-10 cursor-help"
                      title={mark.name}
                    >
                      <Activity className="h-3 w-3" />
                      <span>Clinic</span>
                    </div>
                  ))}

                  {/* Render Custom styled Location Pins for properties */}
                  {properties.map((prop, i) => {
                    const { latPercent, lngPercent } = getCoordinates(i);
                    const isHovered = hoveredPropertyId === prop.id;

                    return (
                      <div
                        key={prop.id}
                        style={{ top: `${latPercent}%`, left: `${lngPercent}%` }}
                        onClick={() => setSelectedMapProp(prop)}
                        onMouseEnter={() => setHoveredPropertyId(prop.id)}
                        onMouseLeave={() => setHoveredPropertyId(null)}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer ${
                          isHovered ? "scale-105 z-30" : "z-20"
                        }`}
                      >
                        <div className={`px-2 py-1 rounded border text-[9px] font-bold font-mono shadow-md flex items-center gap-1 ${
                          isHovered 
                            ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:text-slate-950" 
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        }`}>
                          <MapPin className={`h-3 w-3 text-amber-600 ${isHovered ? "animate-bounce" : ""}`} />
                          <span>${(prop.price >= 1000000 ? `${(prop.price/1000000).toFixed(1)}M` : `${prop.price/1000}k`)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Property preview card */}
                {selectedMapProp && (
                  <div className="absolute bottom-3 left-3 right-3 bg-white dark:bg-[#0F131C] p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-lg animate-scale-in flex items-center justify-between gap-4 z-30">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-16 rounded overflow-hidden shrink-0">
                        <img src={selectedMapProp.images[0]} alt="" className="object-cover h-full w-full" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{selectedMapProp.title}</h4>
                        <p className="text-[10px] text-amber-650 dark:text-amber-550 font-bold mt-0.5">
                          ${selectedMapProp.price.toLocaleString()} {selectedMapProp.purpose === "rent" ? "/mo" : ""}
                        </p>
                        <p className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                          <Navigation className="h-2.5 w-2.5" /> Transit Route Plotted
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Link 
                        href={`/property/${selectedMapProp.id}`}
                        className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-bold px-3 py-1.5 rounded-md text-[9px] uppercase font-mono text-center"
                      >
                        Inspect
                      </Link>
                      <button 
                        onClick={() => setSelectedMapProp(null)}
                        className="text-[9px] text-slate-500 hover:text-slate-700 uppercase font-bold"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar list panel */}
              <div className="md:col-span-1 bg-white dark:bg-[#0F131C] border border-slate-200 dark:border-slate-800 rounded-xl p-3 overflow-y-auto max-h-[420px] flex flex-col gap-3">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase font-mono border-b border-slate-150 dark:border-slate-850 pb-2">
                  Matching Listings ({properties.length})
                </h3>
                {properties.map((prop, idx) => (
                  <div 
                    key={prop.id}
                    onMouseEnter={() => setHoveredPropertyId(prop.id)}
                    onMouseLeave={() => setHoveredPropertyId(null)}
                    onClick={() => {
                      setSelectedMapProp(prop);
                      setViewMode("map");
                    }}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                      hoveredPropertyId === prop.id 
                        ? "bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-750" 
                        : "bg-slate-50/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-850/60 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{prop.title}</h4>
                      <p className="text-[10px] text-amber-650 dark:text-amber-500 font-bold font-mono mt-0.5">
                        ${prop.price.toLocaleString()} {prop.purpose === "rent" ? "/mo" : ""}
                      </p>
                      <span className="text-[9px] text-slate-400">{prop.location}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 mt-2.5 pt-2 text-[9px] text-slate-500 font-mono">
                      <span>Coord: {getCoordinates(idx).latPercent}° N</span>
                      <span>{prop.area.toLocaleString()} sqft</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
