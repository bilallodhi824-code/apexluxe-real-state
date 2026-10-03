"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";
import { dbService, Property, Booking, ChatThread, ChatMessage } from "@/lib/db-service";
import { aiService } from "@/lib/ai-service";
import {
  User,
  Heart,
  Calendar,
  MessageSquare,
  Sparkles,
  FileText,
  Clock,
  Send,
  Eye,
  Trash2,
  Upload,
  UserCheck,
  Compass,
  Building,
  Crown,
  CheckCircle,
  Shield
} from "lucide-react";

export default function CustomerDashboard() {
  const router = useRouter();
  const { user, updateUserSession, switchPlan } = useAuthStore();
  const [planSwitching, setPlanSwitching] = useState(false);
  const [planSuccess, setPlanSuccess] = useState<string | null>(null);

  const handleSwitchPlan = async (plan: "economical" | "vip") => {
    if (user?.plan === plan) return;
    setPlanSwitching(true);
    setPlanSuccess(null);
    await switchPlan(plan);
    setPlanSuccess(plan);
    setTimeout(() => setPlanSuccess(null), 3000);
    setPlanSwitching(false);
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  // Data States
  const [wishlist, setWishlist] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);

  // Recommendations
  const [recommendations, setRecommendations] = useState<Property[]>([]);

  // Profile Edit states
  const [newName, setNewName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // Document upload state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([
    "ID_Passport_Scan_Verified.pdf",
    "Proof_of_Funds_Escrow_2026.pdf"
  ]);

  const loadCustomerData = async () => {
    if (!user) return;
    try {
      const books = await dbService.getBookings(user.uid, "customer");
      setBookings(books);

      const threads = await dbService.getChatThreads(user.uid);
      setChatThreads(threads);
      if (threads.length > 0 && !activeThread) {
        setActiveThread(threads[0]);
      }

      const savedIds = JSON.parse(localStorage.getItem(`apex_wishlist_${user.uid}`) || "[]") as string[];
      const allProps = await dbService.getProperties();
      
      let filteredWishlist = allProps.filter((p) => savedIds.includes(p.id));
      if (filteredWishlist.length === 0 && allProps.length > 0) {
        const firstPropId = allProps[0].id;
        localStorage.setItem(`apex_wishlist_${user.uid}`, JSON.stringify([firstPropId]));
        filteredWishlist = [allProps[0]];
      }
      setWishlist(filteredWishlist);

      const categories = filteredWishlist.map((p) => p.type);
      const recs = await aiService.getRecommendations(categories);
      setRecommendations(recs);

      setNewName(user.displayName);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, [user]);

  // Load chat messages
  useEffect(() => {
    if (!activeThread) return;
    const threadId = activeThread.id;
    async function fetchMessages() {
      const msgs = await dbService.getMessages(threadId);
      setActiveMessages(msgs);
    }
    fetchMessages();
  }, [activeThread]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !user) return;

    setProfileSaving(true);
    try {
      await updateUserSession({ displayName: newName.trim() });
      await dbService.logActivity("activity", `Updated account display name to ${newName.trim()}`, user.uid);
      alert("Account information updated.");
    } catch (err) {
      console.error(err);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUploadKYC = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadSuccess(false);
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          setUploadedDocs((docs) => [...docs, file.name]);
          setUploadSuccess(true);
          dbService.logActivity(
            "activity",
            `Document uploaded: '${file.name}'`,
            user.uid
          );
          setTimeout(() => {
            setUploadProgress(null);
            setUploadSuccess(false);
          }, 3000);
          return 100;
        }
        return prev + 30;
      });
    }, 400);
  };

  const handleRemoveWishlist = (propId: string) => {
    if (!user) return;
    const currentIds = JSON.parse(localStorage.getItem(`apex_wishlist_${user.uid}`) || "[]") as string[];
    const updatedIds = currentIds.filter((id) => id !== propId);
    localStorage.setItem(`apex_wishlist_${user.uid}`, JSON.stringify(updatedIds));
    setWishlist(wishlist.filter((p) => p.id !== propId));
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!user) return;
    const confirm = window.confirm("Cancel this scheduled viewing appointment?");
    if (confirm) {
      const ok = await dbService.updateBookingStatus(bookingId, "cancelled", user.uid, "Cancelled by user");
      if (ok) {
        alert("Viewing request cancelled.");
        loadCustomerData();
      }
    }
  };

  const handleRescheduleBooking = async (bookingId: string) => {
    if (!user) return;
    const newDate = window.prompt("Enter new appointment date (YYYY-MM-DD):");
    if (newDate) {
      const ok = await dbService.updateBookingStatus(
        bookingId,
        "rescheduled",
        user.uid,
        `Rescheduled to ${newDate}`
      );
      if (ok) {
        const list = JSON.parse(localStorage.getItem("apex_bookings") || "[]") as Booking[];
        const idx = list.findIndex((b) => b.id === bookingId);
        if (idx !== -1) {
          list[idx].date = newDate;
          localStorage.setItem("apex_bookings", JSON.stringify(list));
        }
        alert(`Rescheduled viewing to ${newDate}.`);
        loadCustomerData();
      }
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
    loadCustomerData();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="h-10 w-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-550 font-mono text-xs">Loading account...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      
      {/* Header */}
      <div className="mb-6 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <span className="text-amber-600 dark:text-amber-500 text-xs font-bold uppercase tracking-wider font-mono">Client Portal</span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-sans">My Account</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your wishlist, view scheduled viewings, upload documents, and contact agents.
        </p>
      </div>

      {/* Bookings */}
      <div className="bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm mb-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase font-mono border-b border-slate-100 dark:border-slate-850 pb-2">
          My Scheduled Viewings
        </h3>

        {bookings.length === 0 ? (
          <div className="text-center py-10 text-slate-450 font-mono text-xs animate-pulse">
            // NO SCHEDULED VIEWINGS RECORDED
          </div>
        ) : (
          <div className="overflow-x-auto font-sans">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-500 font-mono">
                  <th className="py-2.5 px-2">Property</th>
                  <th className="py-2.5 px-2">Assigned Agent</th>
                  <th className="py-2.5 px-2">Appointment Details</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850/40">
                {bookings.map((book) => (
                  <tr key={book.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/10 text-slate-650 dark:text-slate-350">
                    <td className="py-3 px-2">
                      <p className="font-bold text-slate-850 dark:text-slate-250">{book.propertyTitle}</p>
                      <span className="text-[10px] text-slate-500 font-mono">ID: {book.propertyId}</span>
                    </td>
                    <td className="py-3 px-2">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{book.agentName}</p>
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
                      {book.status !== "cancelled" ? (
                        <div className="flex items-center justify-end gap-3 text-[10px] font-bold uppercase font-mono">
                          <button 
                            onClick={() => handleRescheduleBooking(book.id)}
                            className="text-amber-600 hover:text-amber-500"
                          >
                            Reschedule
                          </button>
                          <button 
                            onClick={() => handleCancelBooking(book.id)}
                            className="text-red-500 hover:text-red-650"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 uppercase font-mono">CANCELLED</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Membership Plans */}
      <div className="bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm mb-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono flex items-center gap-1.5">
              <Crown className="h-4 w-4 text-amber-500" /> Membership & Billing
            </h3>
            <p className="text-[10px] text-slate-450 mt-0.5">Your current plan controls access to priority listings and exclusive broker concierge.</p>
          </div>
          {user?.plan && (
            <span className={`text-[9px] font-bold uppercase font-mono px-2.5 py-1 rounded-full border ${
              user.plan === "vip"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"
            }`}>
              {user.plan === "vip" ? "✦ VIP Active" : "Economical"}
            </span>
          )}
        </div>

        {planSuccess && (
          <div className="mb-4 p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[11px] font-bold flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Membership updated to {planSuccess === "vip" ? "VIP Buyer" : "Economical Buyer"} successfully.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Economical Plan */}
          <div className={`p-5 rounded-xl border-2 transition-all ${
            user?.plan === "economical"
              ? "border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-900/30"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-500">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Economical Buyer</h4>
                  <p className="text-[10px] text-slate-500 font-mono">Standard Access</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">Free</p>
                <p className="text-[9px] text-slate-400 font-mono">Forever</p>
              </div>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400 mb-4">
              {["Browse all public listings", "Submit property enquiries", "Standard email response", "1 saved search alert"].map(f => (
                <li key={f} className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-slate-400 shrink-0" />{f}</li>
              ))}
            </ul>
            <button
              onClick={() => handleSwitchPlan("economical")}
              disabled={planSwitching || user?.plan === "economical"}
              className={`w-full py-2 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all cursor-pointer ${
                user?.plan === "economical"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 cursor-default"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-800"
              }`}
            >
              {user?.plan === "economical" ? "✓ Current Plan" : "Switch to Economical"}
            </button>
          </div>

          {/* VIP Plan */}
          <div className={`p-5 rounded-xl border-2 transition-all ${
            user?.plan === "vip" || !user?.plan
              ? "border-amber-500/60 bg-amber-500/5"
              : "border-slate-200 dark:border-slate-800 hover:border-amber-400/40"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                  <Crown className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">VIP Buyer</h4>
                  <p className="text-[10px] text-amber-600 font-mono font-bold">Priority Access</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">$299<span className="text-sm font-normal text-slate-500">/yr</span></p>
                <p className="text-[9px] text-slate-400 font-mono">Billed annually</p>
              </div>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400 mb-4">
              {["Everything in Economical", "Priority broker concierge", "Off-market listings access", "AI-powered matching", "Unlimited saved searches", "Dedicated property manager"].map(f => (
                <li key={f} className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-amber-500 shrink-0" />{f}</li>
              ))}
            </ul>
            <button
              onClick={() => handleSwitchPlan("vip")}
              disabled={planSwitching || user?.plan === "vip" || !user?.plan}
              className={`w-full py-2 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all cursor-pointer ${
                user?.plan === "vip" || !user?.plan
                  ? "bg-amber-600 text-white cursor-default"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }`}
            >
              {user?.plan === "vip" || !user?.plan ? "✦ Current Plan" : (planSwitching ? "Activating..." : "Upgrade to VIP")}
            </button>
          </div>
        </div>
      </div>

      {/* Wishlist & KYC */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mb-6">
        
        {/* Wishlist */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase font-mono border-b border-slate-100 dark:border-slate-850 pb-2">
            Saved Wishlist ({wishlist.length})
          </h3>
          
          {wishlist.length === 0 ? (
            <div className="text-center py-10 text-slate-450 font-mono text-xs">
              // NO PROPERTIES SAVED IN WISHLIST
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {wishlist.map((prop) => (
                <div key={prop.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3 rounded-lg flex items-center justify-between text-xs gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-14 rounded overflow-hidden shrink-0 bg-slate-200">
                      <img src={prop.images[0]} alt="" className="object-cover h-full w-full" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{prop.title}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">${prop.price.toLocaleString()} | {prop.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link 
                      href={`/property/${prop.id}`}
                      className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-850 rounded"
                      title="Inspect Listing"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button 
                      onClick={() => handleRemoveWishlist(prop.id)}
                      className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded transition-colors cursor-pointer"
                      title="Remove Saved"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* KYC & Verification */}
        <div className="lg:col-span-1 bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
          {/* Profile Name */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase font-mono border-b border-slate-100 dark:border-slate-850 pb-2">
              Profile Details
            </h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-2.5 text-xs">
              <div className="space-y-0.5">
                <label className="text-[9px] uppercase font-mono text-slate-500">Display Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <button 
                type="submit"
                disabled={profileSaving}
                className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold uppercase rounded-lg tracking-wider text-[9px] transition-colors"
              >
                {profileSaving ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </div>

          {/* KYC Documents */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-850">
            <h3 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase font-mono border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-slate-400" /> KYC Verification
            </h3>
            <p className="text-[10px] text-slate-500 leading-normal">
              Confirm your identity by uploading Proof of Funds or Identity Scan.
            </p>

            <div className="space-y-2.5">
              <label className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-slate-800 transition-colors">
                <Upload className="h-4.5 w-4.5 text-slate-400 mb-0.5 animate-bounce" />
                <span className="text-[9px] font-bold uppercase font-mono">Upload document (PDF)</span>
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={handleUploadKYC}
                  className="hidden" 
                />
              </label>

              {/* Progress */}
              {uploadProgress !== null && (
                <div className="space-y-1 font-mono text-[9px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Uploading:</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-900 dark:bg-slate-100" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-center text-[10px] font-bold">
                  File uploaded successfully.
                </div>
              )}

              {/* List */}
              <div className="space-y-1.5">
                <h4 className="text-[9px] uppercase font-mono text-slate-500 font-bold">My Verification Scans ({uploadedDocs.length})</h4>
                {uploadedDocs.map((docName, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-850 flex justify-between items-center text-[10px] text-slate-650 dark:text-slate-400">
                    <span className="truncate max-w-[150px] font-mono">{docName}</span>
                    <span className="text-[8px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">SECURE</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Recommendations */}
      <div className="bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm mb-6 space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" /> Property Recommendations
          </h3>
          <span className="text-[9px] text-slate-450 uppercase font-mono">Based on your saved list</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((prop) => (
            <div 
              key={prop.id} 
              className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-905 p-4 rounded-lg flex flex-col justify-between"
            >
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{prop.title}</h4>
                <p className="text-[10px] text-amber-600 dark:text-amber-500 font-mono font-bold mt-0.5">
                  ${prop.price.toLocaleString()} {prop.purpose === "rent" ? "/mo" : ""}
                </p>
                <p className="text-[9px] text-slate-450 mt-0.5">{prop.location}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed font-light">{prop.description}</p>
              </div>
              <Link 
                href={`/property/${prop.id}`}
                className="w-full block text-center py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-800 hover:border-slate-400 rounded-lg mt-3 transition-colors font-mono"
              >
                Inspect Property
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Chats */}
      <div className="bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase font-mono border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
          <MessageSquare className="h-4.5 w-4.5 text-slate-450" /> Agent Chats
        </h3>

        {chatThreads.length === 0 ? (
          <div className="text-center py-10 text-slate-450 font-mono text-xs">
            // NO ACTIVE INQUIRIES LOGGED
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch min-h-[380px]">
            
            {/* Sidebar list */}
            <div className="md:col-span-1 border-r border-slate-150 dark:border-slate-800/80 pr-2.5 space-y-1.5 max-h-[400px] overflow-y-auto">
              {chatThreads.map((thread) => {
                const recipientId = thread.participants.find((p) => p !== user?.uid) || "";
                const details = thread.participantDetails[recipientId] || { name: "Agent", avatar: "" };
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

            {/* Conversation chat box */}
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
                      placeholder="Type message..." 
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
                  // SELECT AN ACTIVE AGENT CHAT TO DISPLAY HISTORY
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
