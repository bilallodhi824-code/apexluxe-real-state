"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { dbService, SystemLog, BlogPost, Property } from "@/lib/db-service";
import {
  Users,
  Shield,
  FileText,
  Activity,
  UserCheck,
  TrendingUp,
  DollarSign,
  PlusCircle,
  Trash2,
  Lock,
  Terminal,
  Database,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLocalMode } = useAuthStore();

  useEffect(() => {
    if (!user || user.role !== "superadmin") {
      router.push("/login");
    }
  }, [user, router]);

  // Data States
  const [usersList, setUsersList] = useState<any[]>([]);
  const [blogsList, setBlogsList] = useState<BlogPost[]>([]);
  const [propertiesList, setPropertiesList] = useState<Property[]>([]);
  const [logsList, setLogsList] = useState<SystemLog[]>([]);
  
  // Log filtering
  const [activeLogTab, setActiveLogTab] = useState<"activity" | "audit" | "security">("activity");

  // Approval queue state
  const [pendingListings, setPendingListings] = useState<Array<{
    id: string;
    title: string;
    price: number;
    location: string;
    agentName: string;
    submittedAt: string;
    status: "pending" | "approved" | "rejected";
  }>>([]);
  const [approvalLoading, setApprovalLoading] = useState<Record<string, boolean>>({});

  // System settings toggles
  const [sysSettings, setSysSettings] = useState({
    publicRegistration: true,
    maintenanceMode: false,
    aiAutopilot: true,
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Blog creation states
  const [blogTitle, setBlogTitle] = useState("");
  const [blogExcerpt, setBlogExcerpt] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogCategory, setBlogCategory] = useState("Market Insights");
  const [blogSubmitting, setBlogSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      const u = await dbService.getAllUsers();
      setUsersList(u);

      const b = await dbService.getBlogs();
      setBlogsList(b);

      const p = await dbService.getProperties();
      setPropertiesList(p);

      const l = await dbService.getLogs(activeLogTab);
      setLogsList(l);

      // Seed demo pending listings from fetched properties (simulate pending queue)
      if (p.length > 0) {
        const demoPending = p.slice(0, 3).map((prop, i) => ({
          id: prop.id,
          title: prop.title,
          price: prop.price,
          location: prop.location,
          agentName: i === 0 ? "Alexander Mercer" : i === 1 ? "Sophia Sterling" : "James Whitmore",
          submittedAt: new Date(Date.now() - (i + 1) * 3600000 * 4).toISOString(),
          status: "pending" as const,
        }));
        setPendingListings(demoPending);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [activeLogTab]);

  const handleApproveReject = async (id: string, action: "approved" | "rejected") => {
    setApprovalLoading(prev => ({ ...prev, [id]: true }));
    await new Promise(r => setTimeout(r, 700)); // Simulate API call
    setPendingListings(prev => prev.map(l => l.id === id ? { ...l, status: action } : l));
    setApprovalLoading(prev => ({ ...prev, [id]: false }));
    if (user) await dbService.logActivity("audit", `Listing ${id} ${action} by admin`, user.uid);
  };

  const handleSaveSettings = async () => {
    setSettingsSaved(false);
    await new Promise(r => setTimeout(r, 600));
    if (user) await dbService.logActivity("audit", `System settings updated by ${user.displayName}`, user.uid);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleUpdateRole = async (uid: string, newRole: string) => {
    if (!user) return;
    const ok = await dbService.updateUserRole(uid, newRole, user.uid);
    if (ok) {
      alert("User account permissions updated.");
      loadAdminData();
    }
  };

  const handleDeleteProperty = async (propId: string) => {
    if (!user) return;
    const confirm = window.confirm("Are you sure you want to remove this property listing?");
    if (confirm) {
      const ok = await dbService.deleteProperty(propId, user.uid);
      if (ok) {
        alert("Listing removed.");
        loadAdminData();
      }
    }
  };

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle || !blogContent) return;
    if (!user) return;

    setBlogSubmitting(true);
    try {
      await dbService.createBlog(
        {
          title: blogTitle,
          excerpt: blogExcerpt || blogContent.substring(0, 100) + "...",
          content: blogContent,
          image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
          category: blogCategory
        },
        user.displayName
      );
      setBlogTitle("");
      setBlogExcerpt("");
      setBlogContent("");
      alert("Blog post published successfully.");
      loadAdminData();
    } catch (err) {
      console.error(err);
    } finally {
      setBlogSubmitting(false);
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    const confirm = window.confirm("Delete this blog post?");
    if (confirm) {
      const ok = await dbService.deleteBlog(blogId);
      if (ok) {
        alert("Blog deleted.");
        loadAdminData();
      }
    }
  };

  const revenueChartData = [
    { name: "Jan", revenue: 45000, listings: 12 },
    { name: "Feb", revenue: 52000, listings: 15 },
    { name: "Mar", revenue: 61000, listings: 18 },
    { name: "Apr", revenue: 58000, listings: 14 },
    { name: "May", revenue: 74000, listings: 22 },
    { name: "Jun", revenue: 98000, listings: 30 }
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="h-10 w-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-550 font-mono text-xs">Loading administration console...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-red-500 text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" /> Secure Admin Session
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-sans">System Administration</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage user accounts, catalog publications, blogs, and system logs.</p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-900/80 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
          <Database className="h-4 w-4 text-slate-400" />
          <span>DATABASE MODE:</span>
          <span className="text-amber-600 dark:text-amber-500 font-bold uppercase">{isLocalMode ? "Local DB" : "Cloud Firestore"}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        <div className="bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Total Accounts</span>
            <h3 className="text-2xl font-bold font-mono mt-0.5 text-slate-900 dark:text-slate-100">{usersList.length}</h3>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-500/20">
            <Users className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Active Listings</span>
            <h3 className="text-2xl font-bold font-mono mt-0.5 text-slate-900 dark:text-slate-100">{propertiesList.length}</h3>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-650 dark:text-amber-400 rounded-lg border border-amber-100 dark:border-amber-500/20">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Published Blogs</span>
            <h3 className="text-2xl font-bold font-mono mt-0.5 text-slate-900 dark:text-slate-100">{blogsList.length}</h3>
          </div>
          <div className="p-2.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg border border-green-100 dark:border-green-500/20">
            <FileText className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Est. Revenue</span>
            <h3 className="text-2xl font-bold font-mono mt-0.5 text-slate-900 dark:text-slate-100">$98,450</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
            <DollarSign className="h-4.5 w-4.5" />
          </div>
        </div>

      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        <div className="lg:col-span-2 bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono mb-4">Revenue & Royalty Streams</h3>
          <div className="h-60 w-full font-mono text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#475569" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.1} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", color: "#f8fafc" }} />
                <Area type="monotone" dataKey="revenue" stroke="#475569" fillOpacity={1} fill="url(#colorRev)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono mb-4">Listing Growth</h3>
          <div className="h-60 w-full font-mono text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.1} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", color: "#f8fafc" }} />
                <Bar dataKey="listings" fill="#475569" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* User permissions & Listings moderation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mb-6">
        
        {/* Account management */}
        <div className="bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono border-b border-slate-100 dark:border-slate-850 pb-2">
            Account Permissions
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 font-mono">
                  <th className="py-2.5 px-2">Account Name</th>
                  <th className="py-2.5 px-2">Email Address</th>
                  <th className="py-2.5 px-2 text-right">Permission Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850/40">
                {usersList.map((usr: any) => (
                  <tr key={usr.uid} className="hover:bg-slate-50 dark:hover:bg-slate-900/10 text-slate-650 dark:text-slate-350">
                    <td className="py-3 px-2 font-semibold text-slate-800 dark:text-slate-200">{usr.displayName}</td>
                    <td className="py-3 px-2 font-mono text-slate-400">{usr.email}</td>
                    <td className="py-3 px-2 text-right">
                      <select
                        value={usr.role}
                        onChange={(e) => handleUpdateRole(usr.uid, e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-[10px] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-slate-400 font-mono"
                      >
                        <option value="superadmin">Super Admin</option>
                        <option value="agency">Agency Manager</option>
                        <option value="agent">Broker Agent</option>
                        <option value="owner">Independent Owner</option>
                        <option value="customer">Customer</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Listings Moderation */}
        <div className="bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono border-b border-slate-100 dark:border-slate-850 pb-2">
            Listings Moderation
          </h3>
          <div className="space-y-2.5">
            {propertiesList.slice(0, 4).map((prop) => (
              <div key={prop.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3 rounded-lg flex items-center justify-between text-xs gap-4">
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-850 dark:text-slate-200 truncate">{prop.title}</h4>
                  <p className="text-[10px] text-slate-550 dark:text-slate-500 font-mono mt-0.5">{prop.location} | ID: {prop.id}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded text-slate-750 dark:text-slate-350">
                    For {prop.purpose}
                  </span>
                  <button 
                    onClick={() => handleDeleteProperty(prop.id)}
                    className="p-1.5 hover:bg-red-500/10 text-red-500 dark:text-red-400 rounded transition-colors cursor-pointer"
                    title="Remove Listing"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Blogs Editor & Log Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Blog Publisher CMS */}
        <div className="lg:col-span-1 bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
            <PlusCircle className="h-4.5 w-4.5 text-slate-400" /> System Blog Editor
          </h3>
          
          <form onSubmit={handleCreateBlog} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-mono text-slate-550 dark:text-slate-400">Article Title</label>
              <input 
                type="text" 
                required
                value={blogTitle}
                onChange={(e) => setBlogTitle(e.target.value)}
                placeholder="e.g. Real Estate Trends" 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-mono text-slate-550 dark:text-slate-400">Category</label>
              <select
                value={blogCategory}
                onChange={(e) => setBlogCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="Market Insights">Market Insights</option>
                <option value="Architecture & Design">Architecture & Design</option>
                <option value="Tax Regulations">Tax Regulations</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-mono text-slate-550 dark:text-slate-400">Summary Excerpt</label>
              <input 
                type="text" 
                value={blogExcerpt}
                onChange={(e) => setBlogExcerpt(e.target.value)}
                placeholder="Brief summary sentence..." 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-mono text-slate-550 dark:text-slate-400">Full Content</label>
              <textarea 
                rows={4}
                required
                value={blogContent}
                onChange={(e) => setBlogContent(e.target.value)}
                placeholder="Compose full content here..." 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none resize-none"
              />
            </div>

            <button 
              type="submit"
              disabled={blogSubmitting}
              className="w-full py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-bold uppercase rounded-lg tracking-wider transition-colors cursor-pointer"
            >
              {blogSubmitting ? "Publishing..." : "Publish Article"}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-1.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase font-mono mb-1.5">Published Articles ({blogsList.length})</h4>
            {blogsList.map((b) => (
              <div key={b.id} className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded border border-slate-200 dark:border-slate-850 flex justify-between items-center text-[10px] text-slate-650 dark:text-slate-350">
                <span className="truncate max-w-[140px] font-semibold text-slate-800 dark:text-slate-200">{b.title}</span>
                <button 
                  onClick={() => handleDeleteBlog(b.id)}
                  className="text-red-500 hover:text-red-650 font-semibold"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Log Terminal Viewer */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between self-stretch">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-150 dark:border-slate-850 pb-2.5 gap-2 mb-4">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-slate-550" /> Log Terminal Viewer
              </h3>
              
              <div className="flex bg-slate-50 dark:bg-slate-950 p-0.5 rounded border border-slate-200 dark:border-slate-850">
                {["activity", "audit", "security"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveLogTab(tab as any)}
                    className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-mono font-bold transition-all cursor-pointer ${
                      activeLogTab === tab 
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-sm" 
                        : "text-slate-400 hover:text-slate-800"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable logs */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-lg p-3 h-80 overflow-y-auto font-mono text-[10px] space-y-2">
              {logsList.length === 0 ? (
                <div className="text-slate-400 text-center py-8">
                  // NO RECORDS FOUND FOR {activeLogTab.toUpperCase()}
                </div>
              ) : (
                logsList.map((log) => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-start gap-1 border-b border-slate-100 dark:border-slate-900/60 pb-1.5 text-slate-700 dark:text-slate-300">
                    <span className="text-slate-400 shrink-0">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className={`font-bold shrink-0 uppercase px-1 rounded text-[8px] ${
                      log.severity === "critical" 
                        ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                        : log.severity === "warning" 
                        ? "bg-amber-500/10 text-amber-600 border border-amber-550/20" 
                        : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                    }`}>
                      {log.type}
                    </span>
                    <span className="text-slate-500 shrink-0">{log.userEmail}:</span>
                    <span className="text-slate-800 dark:text-slate-350 leading-relaxed font-sans">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-mono mt-4 pt-3 border-t border-slate-150 dark:border-slate-900 flex justify-between">
            <span>SYS STATUS: 200 OK</span>
            <span>LOG CHANNEL: ACTIVE</span>
          </div>
        </div>

      </div>

      {/* Listing Approval Queue */}
      <div className="bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm mb-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-500" /> Listing Approval Queue
            </h3>
            <p className="text-[10px] text-slate-450 mt-0.5">Review and approve or reject new broker listing submissions.</p>
          </div>
          <span className="text-[9px] font-bold uppercase font-mono px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
            {pendingListings.filter(l => l.status === "pending").length} Pending
          </span>
        </div>

        {pendingListings.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs font-mono">// NO PENDING SUBMISSIONS</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-500 font-mono">
                  <th className="py-2.5 px-2">Property</th>
                  <th className="py-2.5 px-2">Broker</th>
                  <th className="py-2.5 px-2">Price</th>
                  <th className="py-2.5 px-2">Submitted</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850/40">
                {pendingListings.map(listing => (
                  <tr key={listing.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/10">
                    <td className="py-3 px-2">
                      <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{listing.title}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{listing.location}</span>
                    </td>
                    <td className="py-3 px-2 text-slate-600 dark:text-slate-350 font-semibold">{listing.agentName}</td>
                    <td className="py-3 px-2 text-amber-600 dark:text-amber-500 font-bold font-mono">${listing.price.toLocaleString()}</td>
                    <td className="py-3 px-2 text-slate-500 font-mono text-[10px]">
                      {new Date(listing.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold border font-mono ${
                        listing.status === "approved"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                          : listing.status === "rejected"
                          ? "bg-red-500/10 border-red-500/30 text-red-500"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                      }`}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {listing.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApproveReject(listing.id, "approved")}
                            disabled={!!approvalLoading[listing.id]}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold hover:bg-emerald-500/20 cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle className="h-3 w-3" />
                            {approvalLoading[listing.id] ? "..." : "Approve"}
                          </button>
                          <button
                            onClick={() => handleApproveReject(listing.id, "rejected")}
                            disabled={!!approvalLoading[listing.id]}
                            className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-500 rounded text-[10px] font-bold hover:bg-red-500/20 cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="h-3 w-3" />
                            {approvalLoading[listing.id] ? "..." : "Reject"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono uppercase">{listing.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* System Settings Panel */}
      <div className="bg-white dark:bg-[#0F131C] p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm mb-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono flex items-center gap-1.5">
              <Settings className="h-4 w-4 text-slate-500" /> System Settings
            </h3>
            <p className="text-[10px] text-slate-450 mt-0.5">Manage platform-wide configurations and access controls.</p>
          </div>
        </div>

        {settingsSaved && (
          <div className="mb-4 p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[11px] font-bold flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> System settings saved successfully.
          </div>
        )}

        <div className="space-y-3 mb-5">
          {[
            { key: "publicRegistration", label: "Public Registration", desc: "Allow new accounts to register on the platform." },
            { key: "maintenanceMode", label: "Maintenance Mode", desc: "Take the platform offline for scheduled maintenance." },
            { key: "aiAutopilot", label: "AI Autopilot", desc: "Enable AI-powered property matching and recommendation engine." },
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{setting.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{setting.desc}</p>
              </div>
              <button
                onClick={() => setSysSettings(prev => ({ ...prev, [setting.key]: !prev[setting.key as keyof typeof prev] }))}
                className="shrink-0 cursor-pointer"
              >
                {sysSettings[setting.key as keyof typeof sysSettings] ? (
                  <ToggleRight className="h-7 w-7 text-emerald-500" />
                ) : (
                  <ToggleLeft className="h-7 w-7 text-slate-400" />
                )}
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wide cursor-pointer"
        >
          Save Configuration
        </button>
      </div>

    </div>
  );
}
