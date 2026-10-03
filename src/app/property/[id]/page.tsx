"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dbService, Property, Agent, Booking } from "@/lib/db-service";
import { aiService } from "@/lib/ai-service";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";
import {
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Sparkles,
  Calendar,
  Clock,
  Send,
  Building,
  User,
  Shield,
  Star,
  Compass,
  DollarSign,
  ChevronLeft,
  Video,
  FileText,
  School,
  Activity,
  Trees,
  Navigation
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PropertyDetailPage(props: PageProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [property, setProperty] = useState<Property | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  // Gallery
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [show360, setShow360] = useState(false);

  // Booking states
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTimeSlot, setBookingTimeSlot] = useState("10:00 AM");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Chat states
  const [chatMessage, setChatMessage] = useState("");
  const [chatSubmitting, setChatSubmitting] = useState(false);
  const [chatSuccess, setChatSuccess] = useState(false);

  // AI Helper states
  const [aiGeneratingDesc, setAiGeneratingDesc] = useState(false);
  const [aiGeneratedDesc, setAiGeneratedDesc] = useState<string | null>(null);
  
  const [aiValuation, setAiValuation] = useState<any | null>(null);
  const [aiEstimating, setAiEstimating] = useState(false);
  
  const [aiInsights, setAiInsights] = useState<any | null>(null);
  const [aiLoadingInsights, setAiLoadingInsights] = useState(false);

  // Resolve params
  const [paramsPromise, setParamsPromise] = useState<any>(null);

  useEffect(() => {
    props.params.then(setParamsPromise);
  }, [props.params]);

  useEffect(() => {
    if (!paramsPromise) return;
    
    async function loadData() {
      try {
        const prop = await dbService.getPropertyById(paramsPromise.id);
        if (prop) {
          setProperty(prop);
          const ag = await dbService.getAgentById(prop.agentId);
          setAgent(ag);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [paramsPromise]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="h-10 w-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-550 font-mono text-xs">Loading property details...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center bg-white dark:bg-[#0F131C] rounded-xl border border-slate-200 dark:border-slate-800 mt-8 shadow-sm">
        <Compass className="h-10 w-10 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Property Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested listing could not be found in our database.</p>
        <Link href="/search" className="mt-6 inline-block px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold uppercase rounded-lg">
          Return to search
        </Link>
      </div>
    );
  }

  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to schedule a viewing.");
      router.push("/login");
      return;
    }
    if (!bookingDate) return;

    setBookingSubmitting(true);
    try {
      await dbService.createBooking({
        propertyId: property.id,
        propertyTitle: property.title,
        propertyImage: property.images[0],
        agentId: property.agentId,
        agentName: agent?.name || "Broker Agent",
        customerId: user.uid,
        customerName: user.displayName,
        customerEmail: user.email,
        customerPhone: "+1 (555) 019-9922",
        date: bookingDate,
        timeSlot: bookingTimeSlot,
        notes: bookingNotes
      });
      setBookingSuccess(true);
      setBookingDate("");
      setBookingNotes("");
      setTimeout(() => setBookingSuccess(false), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to message the agent.");
      router.push("/login");
      return;
    }
    if (!chatMessage.trim()) return;

    setChatSubmitting(true);
    try {
      const recipientId = property.agentId;
      const recipientDetails = {
        name: agent?.name || "Broker Agent",
        avatar: agent?.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a",
        role: "agent"
      };
      
      const senderDetails = {
        name: user.displayName,
        avatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`,
        role: user.role
      };

      await dbService.sendMessage(
        user.uid,
        user.displayName,
        recipientId,
        recipientDetails,
        senderDetails,
        chatMessage,
        { id: property.id, title: property.title }
      );

      setChatSuccess(true);
      setChatMessage("");
      setTimeout(() => setChatSuccess(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setChatSubmitting(false);
    }
  };

  const triggerAiDescription = async () => {
    setAiGeneratingDesc(true);
    try {
      const copy = await aiService.generateDescription(
        property.title,
        property.type,
        property.location,
        property.amenities
      );
      setAiGeneratedDesc(copy);
    } catch (err) {
      console.error(err);
    } finally {
      setAiGeneratingDesc(false);
    }
  };

  const triggerAiValuation = async () => {
    setAiEstimating(true);
    try {
      const report = await aiService.estimatePrice(
        property.type,
        property.area,
        property.location,
        property.amenities.length
      );
      setAiValuation(report);
    } catch (err) {
      console.error(err);
    } finally {
      setAiEstimating(false);
    }
  };

  const triggerAiInsights = async () => {
    setAiLoadingInsights(true);
    try {
      const info = await aiService.getMarketInsights(property.location);
      setAiInsights(info);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoadingInsights(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      
      {/* Back link */}
      <Link 
        href="/search"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-4 font-mono"
      >
        <ChevronLeft className="h-4 w-4" /> Back to listings
      </Link>

      {/* Main Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mb-8">
        
        {/* Gallery Panel */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative h-[420px] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-black">
            {show360 ? (
              <div className="relative w-full h-full">
                <img 
                  src={property.virtualTour360} 
                  alt="360 View"
                  className="w-full h-full object-cover blur-[1px] opacity-80"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-center p-6">
                  <Compass className="h-12 w-12 text-white animate-spin-slow mb-2" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">360° VR View Active</h3>
                  <p className="text-xs text-slate-300 max-w-xs mt-1">
                    Rotate the view to explore the layout of the property.
                  </p>
                  <button 
                    onClick={() => setShow360(false)}
                    className="mt-4 px-4 py-2 bg-slate-900 border border-slate-700 hover:border-slate-500 text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
                  >
                    Exit VR View
                  </button>
                </div>
              </div>
            ) : (
              <img 
                src={property.images[activeImageIdx]} 
                alt={property.title}
                className="w-full h-full object-cover"
              />
            )}

            {/* Purpose */}
            <div className="absolute top-3 left-3 bg-slate-900/90 text-white px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider">
              For {property.purpose}
            </div>
            
            {/* Mode selection */}
            {property.virtualTour360 && (
              <div className="absolute bottom-3 left-3 flex gap-1.5 bg-slate-950/80 p-1 rounded-lg">
                <button 
                  onClick={() => setShow360(false)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    !show360 ? "bg-slate-900 text-white" : "text-slate-400"
                  }`}
                >
                  Photos
                </button>
                <button 
                  onClick={() => setShow360(true)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    show360 ? "bg-slate-900 text-white" : "text-slate-400"
                  }`}
                >
                  360° VR
                </button>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {!show360 && (
            <div className="flex gap-2 overflow-x-auto py-1">
              {property.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`h-16 w-24 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    activeImageIdx === idx ? "border-slate-800 dark:border-slate-100" : "border-slate-200 dark:border-slate-800 hover:border-slate-500"
                  }`}
                >
                  <img src={img} alt="" className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pricing Card */}
        <div className="bg-white dark:bg-[#0F131C] p-6 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between self-stretch">
          <div>
            <div className="flex items-center gap-1 text-slate-550 dark:text-slate-400 text-xs mb-1.5">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span>{property.location}</span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {property.title}
            </h1>
            <p className="text-[10px] text-slate-505 font-mono tracking-wider uppercase mt-1">Listing ID: {property.id}</p>

            <div className="h-[1px] bg-slate-100 dark:bg-slate-850 my-4"></div>

            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500 font-mono">
              {property.purpose === "rent" ? `$${property.price.toLocaleString()}/mo` : `$${property.price.toLocaleString()}`}
            </div>
            <p className="text-[10px] text-slate-505 uppercase mt-1">Verified Listing</p>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2.5 my-5 text-center font-mono">
              {property.bedrooms && (
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-850">
                  <BedDouble className="h-4 w-4 text-slate-400 mx-auto mb-0.5" />
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{property.bedrooms} Beds</p>
                </div>
              )}
              {property.bathrooms && (
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-850">
                  <Bath className="h-4 w-4 text-slate-400 mx-auto mb-0.5" />
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{property.bathrooms} Baths</p>
                </div>
              )}
              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-850">
                <Maximize className="h-4 w-4 text-slate-400 mx-auto mb-0.5" />
                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{property.area.toLocaleString()} sqft</p>
              </div>
            </div>
          </div>

          {/* AI Helper actions */}
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-850 p-3 rounded-lg space-y-2.5 shadow-inner">
            <h4 className="text-[10px] font-bold text-slate-700 dark:text-slate-350 tracking-wider uppercase font-mono flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" /> AI Listing Assistant
            </h4>
            
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <button 
                onClick={triggerAiValuation}
                disabled={aiEstimating}
                className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-800 rounded-md py-1.5 text-center cursor-pointer transition-colors"
              >
                {aiEstimating ? "Estimating..." : "AI Estimate"}
              </button>
              <button 
                onClick={triggerAiInsights}
                disabled={aiLoadingInsights}
                className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-800 rounded-md py-1.5 text-center cursor-pointer transition-colors"
              >
                {aiLoadingInsights ? "Analysing..." : "Market Trends"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Box */}
      {(aiValuation || aiInsights) && (
        <div className="bg-slate-550 dark:bg-[#0F131C] p-5 rounded-xl border border-slate-250 dark:border-slate-800/80 mb-8 shadow-sm animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 pb-2 mb-3.5">
            <h3 className="text-xs font-bold text-slate-800 dark:text-amber-500 flex items-center gap-1.5 font-mono uppercase">
              <Sparkles className="h-4.5 w-4.5" /> AI Valuation Summary
            </h3>
            <button 
              onClick={() => { setAiValuation(null); setAiInsights(null); }}
              className="text-[10px] text-slate-505 hover:text-slate-707 uppercase font-bold"
            >
              Close
            </button>
          </div>

          {/* AI Valuation Estimate */}
          {aiValuation && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Market Value Estimate:</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-0.5">${aiValuation.estimatedPrice.toLocaleString()}</p>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5 flex gap-2">
                  <span>Range Low: ${(aiValuation.lowRange/1000).toFixed(0)}k</span>
                  <span>Range High: ${(aiValuation.highRange/1000).toFixed(0)}k</span>
                </div>
                <p className="text-xs text-slate-555 dark:text-slate-400 mt-3 leading-relaxed font-light">
                  This estimated valuation is generated automatically based on property type, total size, location, and amenities count.
                </p>
              </div>
              <div className="space-y-1.5 bg-white dark:bg-slate-950 p-4.5 rounded-lg border border-slate-200 dark:border-slate-900 font-mono text-[10px]">
                {aiValuation.breakdown.map((row: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-slate-500">{row.label}:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">${row.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Market Insights */}
          {aiInsights && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              <div>
                <h4 className="text-xs font-bold text-slate-855 dark:text-slate-350 uppercase mb-2">Location Statistics</h4>
                <div className="grid grid-cols-3 gap-2 text-center text-[9px] mb-3">
                  <div className="bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-900">
                    <p className="text-slate-500">APPRECIATION</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">{aiInsights.growthRate}% YoY</p>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-900">
                    <p className="text-slate-500">AVG DAYS LISTED</p>
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-xs mt-0.5">{aiInsights.averageDays} Days</p>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-900">
                    <p className="text-slate-500">DEMAND LEVEL</p>
                    <p className="font-bold text-amber-600 dark:text-amber-505 text-xs mt-0.5">{aiInsights.demandScore}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-light">{aiInsights.localNotes}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-855 dark:text-slate-350 uppercase mb-2">Market Price Trend</h4>
                <div className="space-y-1 text-[10px]">
                  {aiInsights.trendData.map((t: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-950 px-3 py-1 rounded border border-slate-100 dark:border-slate-900">
                      <span className="text-slate-500">{t.quarter}:</span>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 bg-amber-500 rounded-full" style={{ width: `${(t.pricePerSqft / 2500) * 100}px` }}></div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">${t.pricePerSqft}/sqft</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Description & landmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-8">
        
        {/* Detail text columns */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white dark:bg-[#0F131C] p-6 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2 mb-4">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono">Property Description</h3>
              <button 
                onClick={triggerAiDescription}
                disabled={aiGeneratingDesc}
                className="text-[9px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold uppercase font-mono flex items-center gap-1.5 cursor-pointer animate-pulse"
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                {aiGeneratingDesc ? "Regenerating..." : "Improve with AI"}
              </button>
            </div>

            <div className="text-xs text-slate-655 dark:text-slate-300 leading-relaxed font-sans space-y-3">
              {aiGeneratedDesc ? (
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs leading-relaxed relative animate-scale-in">
                  <span className="absolute -top-2 left-3 px-1.5 bg-white dark:bg-slate-950 text-[8px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 border border-slate-200 dark:border-slate-855">
                    AI Improved Description
                  </span>
                  {aiGeneratedDesc.split("\n\n").map((para, i) => (
                    <p key={i} className="mb-2">{para}</p>
                  ))}
                </div>
              ) : (
                property.description.split("\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F131C] p-6 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono border-b border-slate-100 dark:border-slate-850 pb-2 mb-4">
              Amenities
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {property.amenities.map((item, i) => (
                <div 
                  key={i} 
                  className="bg-slate-550 dark:bg-slate-955 border border-slate-200 dark:border-slate-855 px-3 py-2 rounded-lg font-semibold text-slate-700 dark:text-slate-355 flex items-center gap-1.5 font-mono"
                >
                  <span className="text-amber-500">•</span> {item}
                </div>
              ))}
            </div>
          </div>

          {property.floorPlanUrl && (
            <div className="bg-white dark:bg-[#0F131C] p-6 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono border-b border-slate-100 dark:border-slate-850 pb-2 mb-4">
                Floor Plan
              </h3>
              <div className="max-w-lg mx-auto h-64 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-850 bg-slate-950">
                <img src={property.floorPlanUrl} alt="Floor Plan" className="object-cover w-full h-full opacity-70" />
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-[#0F131C] p-6 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono border-b border-slate-100 dark:border-slate-850 pb-2 mb-4">
              Location & Nearby Places
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              <div className="md:col-span-2 h-56 rounded-lg border border-slate-200 dark:border-slate-850 overflow-hidden bg-slate-100 dark:bg-[#05070A] relative shadow-inner">
                
                <svg className="absolute inset-0 h-full w-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                  <pattern id="detail-grid-inner" width="20" height="20" patternUnits="userSpaceOnUse">
                    <rect width="20" height="20" fill="none" stroke="#64748B" strokeWidth="0.5"/>
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#detail-grid-inner)" />
                </svg>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-600/10 border border-amber-600 px-3 py-1.5 rounded-full font-bold text-[10px] uppercase font-mono z-10">
                  📍 Property
                </div>

                <div className="absolute top-1/4 left-1/4 bg-blue-500/10 border border-blue-400 text-blue-500 text-[8px] font-bold p-1 rounded font-mono">
                  School
                </div>
                <div className="absolute bottom-1/4 right-1/3 bg-red-500/10 border border-red-400 text-red-500 text-[8px] font-bold p-1 rounded font-mono">
                  Clinic
                </div>
                <div className="absolute top-2/3 left-1/3 bg-green-500/10 border border-green-400 text-green-500 text-[8px] font-bold p-1 rounded font-mono">
                  Park
                </div>
              </div>

              <div className="md:col-span-1 space-y-2">
                <h4 className="text-[10px] font-bold text-slate-555 uppercase font-mono">Nearby Landmarks</h4>
                
                {property.nearbyPlaces && property.nearbyPlaces.length > 0 ? (
                  <div className="space-y-1.5">
                    {property.nearbyPlaces.map((place, idx) => (
                      <div key={idx} className="bg-slate-550 dark:bg-slate-955 p-2 rounded-lg border border-slate-200 dark:border-slate-855 flex items-center justify-between text-[11px]">
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-350">{place.name}</p>
                          <span className="text-[8px] text-slate-500 uppercase font-mono">{place.type}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 font-bold shrink-0">{place.distance}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {[
                      { name: "Sunset High School", type: "school", dist: "1.2 km" },
                      { name: "Lakeside Medical Clinic", type: "hospital", dist: "2.4 km" },
                      { name: "Westside Botanical Park", type: "park", dist: "0.8 km" }
                    ].map((item, i) => (
                      <div key={i} className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-850 flex items-center justify-between text-[11px]">
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-350">{item.name}</p>
                          <span className="text-[8px] text-slate-500 uppercase font-mono">{item.type}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">{item.dist}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar forms */}
        <div className="space-y-6">
          
          {/* Agent details */}
          {agent && (
            <div className="bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm text-center">
              <div className="h-16 w-16 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 p-1 mx-auto mb-2">
                <img src={agent.avatar} alt={agent.name} className="h-full w-full object-cover rounded-full" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-205">{agent.name}</h3>
              <p className="text-xs text-slate-500 font-bold font-mono uppercase tracking-wide">{agent.role}</p>
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-mono mt-1">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                <span>{agent.rating} Rating</span>
                <span>•</span>
                <span>{agent.experienceYears} Yrs Exp</span>
              </div>
            </div>
          )}

          {/* Schedule Form */}
          <div className="bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <h3 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase font-mono border-b border-slate-100 dark:border-slate-850 pb-2 mb-3">
              Schedule Viewing
            </h3>
            
            <form onSubmit={handleScheduleVisit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-slate-450 tracking-wider">Select Date</label>
                <input 
                  type="date" 
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-slate-450 tracking-wider">Select Time</label>
                <select
                  value={bookingTimeSlot}
                  onChange={(e) => setBookingTimeSlot(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-855 rounded-lg px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="9:00 AM">9:00 AM (Morning)</option>
                  <option value="11:00 AM">11:00 AM (Midday)</option>
                  <option value="2:00 PM">2:00 PM (Afternoon)</option>
                  <option value="4:00 PM">4:00 PM (Evening)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-slate-450 tracking-wider">Additional Notes</label>
                <textarea 
                  rows={3}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Specify viewing details or timeslot requirements..." 
                  className="w-full bg-slate-550 dark:bg-slate-955 border border-slate-200 dark:border-slate-855 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={bookingSubmitting}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-250 text-white dark:text-slate-955 font-bold uppercase rounded-lg tracking-wider text-xs cursor-pointer transition-all"
              >
                {bookingSubmitting ? "Submitting..." : "Schedule Viewing"}
              </button>
            </form>

            {bookingSuccess && (
              <div className="mt-3.5 p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 rounded-lg text-center text-[10px] font-semibold animate-scale-in">
                Viewing requested. View appointment status in Dashboard.
              </div>
            )}
          </div>

          {/* Send direct Broker Message */}
          <div className="bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <h3 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase font-mono border-b border-slate-100 dark:border-slate-850 pb-2 mb-3">
              Message Agent
            </h3>
            
            <form onSubmit={handleSendMessage} className="space-y-2.5">
              <textarea 
                rows={3}
                required
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask about properties, pricing negotiation, or details..." 
                className="w-full bg-slate-550 dark:bg-slate-955 border border-slate-200 dark:border-slate-855 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none resize-none"
              />
              <button 
                type="submit"
                disabled={chatSubmitting}
                className="w-full py-2 bg-slate-900 border border-slate-800 hover:border-slate-705 text-white font-bold uppercase rounded-lg tracking-wider text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                {chatSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>

            {chatSuccess && (
              <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 rounded-lg text-center text-[10px] font-semibold animate-scale-in">
                Message sent. Open Chat center in Dashboard.
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
