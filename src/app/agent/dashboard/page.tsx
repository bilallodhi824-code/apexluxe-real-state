"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";
import { dbService, Property, Booking, ChatThread, ChatMessage } from "@/lib/db-service";
import { aiService } from "@/lib/ai-service";
import {
  Building,
  PlusCircle,
  Calendar,
  MessageSquare,
  Sparkles,
  DollarSign,
  TrendingUp,
  Clock,
  Trash2,
  Send,
  Camera,
  MapPin,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function AgentDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user || !["agent", "agency", "owner"].includes(user.role)) {
      router.push("/login");
    }
  }, [user, router]);

  // Data States
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);

  // Form States (Create Listing)
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Property["type"]>("villa");
  const [purpose, setPurpose] = useState<Property["purpose"]>("sale");
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [bedrooms, setBedrooms] = useState("3");
  const [bathrooms, setBathrooms] = useState("3");
  const [description, setDescription] = useState("");
  const [amenityInput, setAmenityInput] = useState("");
  const [amenities, setAmenities] = useState<string[]>(["Smart Home", "Pool", "24/7 Security"]);
  const [imageInputUrl, setImageInputUrl] = useState("");
  const [images, setImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80"
  ]);

  // AI Form States
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiImageFeedback, setAiImageFeedback] = useState<any | null>(null);

  const loadAgentData = async () => {
    if (!user) return;
    try {
      const props = await dbService.getProperties();
      setMyProperties(props.filter((p) => p.agentId === user.uid));

      const books = await dbService.getBookings(user.uid, "agent");
      setMyBookings(books);

      const threads = await dbService.getChatThreads(user.uid);
      setChatThreads(threads);
      if (threads.length > 0 && !activeThread) {
        setActiveThread(threads[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgentData();
  }, [user]);

  // Load chat messages when thread is selected
  useEffect(() => {
    if (!activeThread) return;
    const threadId = activeThread.id;
    async function fetchMessages() {
      const msgs = await dbService.getMessages(threadId);
      setActiveMessages(msgs);
    }
    fetchMessages();
  }, [activeThread]);

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !amenities.includes(amenityInput.trim())) {
      setAmenities([...amenities, amenityInput.trim()]);
      setAmenityInput("");
    }
  };

  const handleAddImage = () => {
    if (imageInputUrl.trim() && !images.includes(imageInputUrl.trim())) {
      const newImages = [...images, imageInputUrl.trim()];
      setImages(newImages);
      setImageInputUrl("");
      triggerAiImageFeedback(newImages.length);
    }
  };

  const triggerAiImageFeedback = async (count: number) => {
    const info = await aiService.analyzeImageQuality(count);
    setAiImageFeedback(info);
  };

  const handleAiGenerateFormDesc = async () => {
    if (!title || !location) {
      alert("Please enter a listing Title and Location city first.");
      return;
    }
    setAiGenerating(true);
    try {
      const desc = await aiService.generateDescription(title, type, location, amenities);
      setDescription(desc);
    } catch (err) {
      console.error(err);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCreateListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title || !price || !area || !location) return;

    try {
      await dbService.createProperty(
        {
          title,
          description: description || "No detailed description provided.",
          type,
          purpose,
          price: Number(price),
          bedrooms: type === "office" ? undefined : Number(bedrooms),
          bathrooms: type === "office" ? undefined : Number(bathrooms),
          area: Number(area),
          location,
          address: address || location,
          coordinates: { lat: 25.1 + Math.random() * 0.05, lng: 55.1 + Math.random() * 0.05 },
          images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80"],
          amenities,
          featured: false,
          status: "available",
          nearbyPlaces: [
            { name: "Local Mall", type: "shopping", distance: "0.5 km" },
            { name: "Health Center", type: "hospital", distance: "1.2 km" }
          ]
        },
        user.uid
      );

      // Reset Form
      setTitle("");
      setPrice("");
      setArea("");
      setLocation("");
      setAddress("");
      setDescription("");
      setAmenities(["Smart Home", "Pool", "24/7 Security"]);
      setImages(["https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80"]);
      setAiImageFeedback(null);

      alert("Listing published successfully.");
      loadAgentData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProp = async (id: string) => {
    if (!user) return;
    const confirm = window.confirm("Delete this listing?");
    if (confirm) {
      await dbService.deleteProperty(id, user.uid);
      loadAgentData();
    }
  };

  const handleUpdateBooking = async (id: string, status: Booking["status"]) => {
    if (!user) return;
    const ok = await dbService.updateBookingStatus(id, status, user.uid);
    if (ok) {
      alert(`Viewing request marked as ${status}.`);
      loadAgentData();
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeThread || !replyText.trim()) return;

    const participants = activeThread.participants;
    const recipientId = participants.find((p) => p !== user.uid) || "";
    const recipientDetails = activeThread.participantDetails[recipientId];

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
      replyText,
      activeThread.propertyId ? { id: activeThread.propertyId, title: activeThread.propertyTitle || "" } : undefined
    );

    setReplyText("");
    const msgs = await dbService.getMessages(activeThread.id);
    setActiveMessages(msgs);
    loadAgentData();
  };

  const leadPerformanceData = [
    { name: "Mon", leads: 4 },
    { name: "Tue", leads: 6 },
    { name: "Wed", leads: 3 },
    { name: "Thu", leads: 8 },
    { name: "Fri", leads: 5 },
    { name: "Sat", leads: 12 },
    { name: "Sun", leads: 9 }
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="h-10 w-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-550 font-mono text-xs">Loading agent dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      
      {/* Header */}
      <div className="mb-6 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <span className="text-amber-600 dark:text-amber-500 text-xs font-bold uppercase tracking-wider font-mono">Agent Portal</span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-sans">Properties Portfolio Manager</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your properties, view schedules, and respond to inquiries.
        </p>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch mb-8">
        <div className="lg:col-span-1 bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase font-mono mb-3">Portfolio Overview</h3>
            <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span>Active Listings</span>
                <span className="font-bold font-mono">{myProperties.length} Properties</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Viewing Requests</span>
                <span className="font-bold text-amber-600 dark:text-amber-500 font-mono">
                  {myBookings.filter((b) => b.status === "pending").length} Pending
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-2.5">
                <span>Total Value</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-450 font-mono">
                  ${myProperties.reduce((acc, p) => acc + p.price, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-200 dark:border-slate-850 flex items-center gap-2.5 text-xs mt-4">
            <TrendingUp className="h-4.5 w-4.5 text-slate-500 shrink-0 animate-bounce" />
            <p className="text-slate-500 leading-normal">
              Viewing requests conversion rate is currently at <span className="font-bold text-slate-700 dark:text-slate-350">84%</span>.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <h3 className="text-xs font-bold text-slate-550 uppercase font-mono mb-4">Weekly Inquiries</h3>
          <div className="h-40 w-full font-mono text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadPerformanceData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }} />
                <Bar dataKey="leads" fill="#475569" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Listing CRUD forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mb-6">
        
        {/* Create */}
        <div className="bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
            <PlusCircle className="h-4.5 w-4.5 text-slate-400" /> Add Property Listing
          </h3>

          <form onSubmit={handleCreateListingSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-slate-500">Listing Title</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern Harbor Villa" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-slate-500">Price ($)</label>
                <input 
                  type="number" 
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 1200000" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-slate-500">Intent</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-slate-500">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="villa">Luxury Villa</option>
                  <option value="apartment">Sky Apartment</option>
                  <option value="office">Commercial Office</option>
                  <option value="farmhouse">Scenic Farmhouse</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-slate-500">Area (sqft)</label>
                <input 
                  type="number" 
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. 2500" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-slate-500 font-bold">Beds</label>
                <input 
                  type="number" 
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  placeholder="3" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-slate-500 font-bold">Baths</label>
                <input 
                  type="number" 
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  placeholder="3" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-slate-500">City</label>
                <input 
                  type="text" 
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Manhattan, New York" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-slate-500 font-bold">Address</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 732 Fifth Ave" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-1 pt-1.5 border-t border-slate-100 dark:border-slate-850">
              <label className="text-[9px] uppercase font-mono text-slate-550 flex items-center justify-between">
                <span>Property Image URL</span>
                {aiImageFeedback && (
                  <span className="font-bold font-mono text-[9px] text-amber-600 dark:text-amber-500">
                    AI Review Score: {aiImageFeedback.score}% ({aiImageFeedback.status})
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={imageInputUrl}
                  onChange={(e) => setImageInputUrl(e.target.value)}
                  placeholder="https://unsplash.com/..." 
                  className="flex-grow bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
                <button 
                  type="button" 
                  onClick={handleAddImage}
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 px-3 rounded-lg font-bold uppercase cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* AI description generator inside form */}
            <div className="space-y-1 pt-1.5 border-t border-slate-100 dark:border-slate-850">
              <div className="flex items-center justify-between">
                <label className="text-[9px] uppercase font-mono text-slate-500">Property Description</label>
                <button 
                  type="button"
                  onClick={handleAiGenerateFormDesc}
                  disabled={aiGenerating}
                  className="text-[9px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-bold uppercase font-mono flex items-center gap-1 cursor-pointer animate-pulse"
                >
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  {aiGenerating ? "Generating..." : "Generate with AI"}
                </button>
              </div>
              <textarea 
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write description or click Generate with AI..." 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none resize-none"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold uppercase rounded-lg tracking-wider transition-colors cursor-pointer"
            >
              Publish Listing
            </button>
          </form>
        </div>

        {/* Read/Delete list */}
        <div className="bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between self-stretch space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase font-mono border-b border-slate-100 dark:border-slate-850 pb-2 mb-3">
              My Listings ({myProperties.length})
            </h3>
            
            {myProperties.length === 0 ? (
              <div className="text-center py-10 text-slate-450 font-mono text-xs">
                // NO ACTIVE PROPERTY LISTINGS FOUND
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                {myProperties.map((prop) => (
                  <div key={prop.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3 rounded-lg flex items-center justify-between text-xs gap-4 hover:border-slate-350 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-14 rounded overflow-hidden shrink-0 bg-slate-200">
                        <img src={prop.images[0]} alt="" className="object-cover h-full w-full" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{prop.title}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">${prop.price.toLocaleString()} | {prop.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link 
                        href={`/property/${prop.id}`}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded text-slate-500 hover:text-slate-850"
                        title="View Property"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button 
                        onClick={() => handleDeleteProp(prop.id)}
                        className="p-1.5 hover:bg-red-500/10 text-red-500 rounded transition-colors cursor-pointer"
                        title="Delete Listing"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono border-t border-slate-100 dark:border-slate-900 pt-3">
            Listing Database Status: Active
          </div>
        </div>

      </div>

      {/* Bookings & viewing requests */}
      <div className="bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm mb-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase font-mono border-b border-slate-100 dark:border-slate-850 pb-2">
          Viewings & Booking Requests
        </h3>

        {myBookings.length === 0 ? (
          <div className="text-center py-10 text-slate-450 font-mono text-xs">
            // NO ACTIVE VIEWING REQUESTS LOGGED
          </div>
        ) : (
          <div className="overflow-x-auto font-sans">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-500 font-mono">
                  <th className="py-2.5 px-2">Property</th>
                  <th className="py-2.5 px-2">Client Details</th>
                  <th className="py-2.5 px-2">Schedule Coordinates</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850/40">
                {myBookings.map((book) => (
                  <tr key={book.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/10 text-slate-650 dark:text-slate-350">
                    <td className="py-3 px-2">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{book.propertyTitle}</p>
                      <span className="text-[10px] text-slate-500 font-mono">ID: {book.propertyId}</span>
                    </td>
                    <td className="py-3 px-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-250">{book.customerName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{book.customerEmail}</p>
                    </td>
                    <td className="py-3 px-2 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{book.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-slate-450 text-[10px]">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{book.timeSlot}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-mono">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold border ${
                        book.status === "confirmed" 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                          : book.status === "cancelled" 
                          ? "bg-red-500/10 border-red-500/30 text-red-500" 
                          : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-550"
                      }`}>
                        {book.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {book.status === "pending" && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleUpdateBooking(book.id, "confirmed")}
                            className="p-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded cursor-pointer"
                            title="Approve Viewing"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleUpdateBooking(book.id, "cancelled")}
                            className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded cursor-pointer"
                            title="Reject Viewing"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {book.status !== "pending" && (
                        <span className="text-[10px] text-slate-400 uppercase font-mono">RESOLVED</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chat Center */}
      <div className="bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase font-mono border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
          <MessageSquare className="h-4.5 w-4.5 text-slate-450" /> Client Chats
        </h3>

        {chatThreads.length === 0 ? (
          <div className="text-center py-10 text-slate-450 font-mono text-xs">
            // NO ACTIVE CLIENT MESSAGES LOGGED
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch min-h-[380px]">
            
            {/* Sidebar list */}
            <div className="md:col-span-1 border-r border-slate-150 dark:border-slate-800/80 pr-2.5 space-y-1.5 max-h-[400px] overflow-y-auto">
              {chatThreads.map((thread) => {
                const recipientId = thread.participants.find((p) => p !== user?.uid) || "";
                const details = thread.participantDetails[recipientId] || { name: "Client", avatar: "" };
                const isActive = activeThread?.id === thread.id;

                return (
                  <div
                    key={thread.id}
                    onClick={() => setActiveThread(thread)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-3.5 ${
                      isActive 
                        ? "bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700" 
                        : "bg-slate-50/40 dark:bg-[#0F131C] border-slate-200 dark:border-slate-850 hover:border-slate-300"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800">
                      <img src={details.avatar} alt="" className="object-cover h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-grow text-xs">
                      <p className="font-bold text-slate-800 dark:text-slate-250 truncate">{details.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">{thread.lastMessage}</p>
                      {thread.propertyTitle && (
                        <span className="text-[8px] bg-slate-200 dark:bg-slate-950 px-1.5 py-0.5 rounded text-slate-750 dark:text-slate-350 font-mono uppercase mt-1 inline-block truncate max-w-[140px]">
                          {thread.propertyTitle}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Conversation Area */}
            <div className="md:col-span-2 flex flex-col justify-between self-stretch bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-200 dark:border-slate-900 p-4">
              {activeThread ? (
                <>
                  <div className="flex-grow overflow-y-auto space-y-3 pr-1.5 max-h-[250px] mb-4 scrollbar-thin">
                    {activeMessages.map((msg) => {
                      const isMe = msg.senderId === user?.uid;

                      return (
                        <div 
                          key={msg.id}
                          className={`flex flex-col max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                            isMe 
                              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 ml-auto rounded-tr-none font-semibold shadow-sm" 
                              : "bg-white text-slate-800 dark:bg-[#0F131C] dark:text-slate-200 mr-auto rounded-tl-none border border-slate-200 dark:border-slate-850"
                          }`}
                        >
                          <span className="text-[9px] opacity-60 uppercase font-mono font-bold mb-0.5">{msg.senderName}</span>
                          <p>{msg.text}</p>
                          <span className="text-[8px] opacity-50 mt-1 self-end font-mono">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={handleSendReply} className="flex gap-2">
                    <input 
                      type="text" 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your response..." 
                      className="flex-grow bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-slate-400"
                    />
                    <button 
                      type="submit"
                      className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-4 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-16 text-slate-550 font-mono text-xs">
                  // SELECT A CLIENT CHAT TO DISPLAY HISTORY
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
