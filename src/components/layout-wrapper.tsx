"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore, UserRole } from "@/store/auth-store";
import { 
  User, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard, 
  Moon,
  Sun,
  Building2,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Globe,
  Lock,
  Compass,
  FileText,
  Mail,
  ArrowRight
} from "lucide-react";
import Chatbot from "./chatbot";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { user, switchRole, logout, checkSession } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Initialize session and theme
  useEffect(() => {
    checkSession();
    document.documentElement.classList.add("dark");
  }, [checkSession]);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  };

  const rolesConfig: { role: UserRole; name: string; title: string; email: string }[] = [
    { role: "superadmin", name: "Super Admin", title: "Enterprise Control", email: "admin@apexluxe.com" },
    { role: "agency", name: "Agency Partner", title: "Brokerage Executive", email: "owner@apexluxe.com" },
    { role: "agent", name: "Alexander Mercer", title: "Senior Advisor", email: "alexander@apexluxe.com" },
    { role: "owner", name: "VIP Owner", title: "Private Asset Seller", email: "owner_vip@apexluxe.com" },
    { role: "customer", name: "Sarah Connor", title: "Private Investor", email: "customer@apexluxe.com" },
    { role: "guest", name: "Anonymous Guest", title: "Public Visitor", email: "guest@apexluxe.com" },
  ];

  const handleRoleSwitch = async (role: UserRole) => {
    const target = rolesConfig.find(r => r.role === role) || rolesConfig[4];

    if (!user || user.email !== target.email) {
      await useAuthStore.getState().login(target.email, "password123");
    }
    
    await switchRole(role);
    setUserDropdownOpen(false);
    setRoleMenuOpen(false);

    if (role === "superadmin") {
      router.push("/admin/dashboard");
    } else if (role === "agent" || role === "agency" || role === "owner") {
      router.push("/agent/dashboard");
    } else if (role === "customer") {
      router.push("/customer/dashboard");
    } else {
      router.push("/");
    }
  };

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    setRoleMenuOpen(false);
    router.push("/");
  };

  const getDashboardLink = () => {
    if (!user) return null;
    if (user.role === "superadmin") return "/admin/dashboard";
    if (user.role === "customer") return "/customer/dashboard";
    return "/agent/dashboard";
  };

  const navLinks = [
    { label: "Estates", href: "/search" },
    { label: "Concierge", href: "/#concierge" },
    { label: "Advisors", href: "/#advisors" },
    { label: "Insights", href: "/#blog" },
    { label: "FAQ", href: "/#faq" },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-[#D4AF37]/30 selection:text-amber-200 transition-colors duration-300 ${
      darkMode ? "bg-[#07090E] text-slate-100" : "bg-[#FAF9F6] text-slate-900"
    }`}>
      
      {/* Top Advisory Ticker Banner */}
      <div className="bg-[#0B0F19] border-b border-white/5 py-1.5 px-4 text-[11px] text-slate-400 font-sans hidden sm:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-amber-400/90 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              Global Real Estate Index
            </span>
            <span className="text-slate-500">•</span>
            <span>London Villa Yields +4.2%</span>
            <span className="text-slate-500">•</span>
            <span>Dubai Penthouse Transactions Up 18% YoY</span>
          </div>

          <div className="flex items-center gap-6">
            {/* Quick Demo Role Switcher Bar */}
            <div className="relative">
              <button 
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer text-[11px]"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Demo Profile: <strong className="text-white capitalize">{user?.role || "Guest"}</strong></span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 glass-panel rounded-xl shadow-2xl p-2 z-50 text-xs">
                  <div className="px-3 py-1.5 border-b border-white/10 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Switch Demo Persona
                  </div>
                  <div className="py-1 space-y-0.5">
                    {rolesConfig.map((item) => (
                      <button
                        key={item.role}
                        onClick={() => handleRoleSwitch(item.role)}
                        className={`w-full text-left px-3 py-2 rounded-lg flex justify-between items-center transition-colors cursor-pointer ${
                          user?.role === item.role
                            ? "bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30"
                            : "hover:bg-white/5 text-slate-300"
                        }`}
                      >
                        <div>
                          <p className="text-xs font-medium">{item.name}</p>
                          <p className="text-[10px] text-slate-400">{item.title}</p>
                        </div>
                        {user?.role === item.role && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>USD ($)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header 
        className={`sticky top-0 z-40 transition-all duration-300 w-full ${
          isScrolled 
            ? "glass-panel shadow-2xl py-3 border-b border-white/10" 
            : darkMode ? "bg-[#07090E]/90 border-b border-white/5 py-4" : "bg-[#FAF9F6]/90 border-b border-black/5 py-4"
        } backdrop-blur-xl`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          
          {/* Logo Mark */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 flex items-center justify-center shadow-lg shadow-amber-900/20 group-hover:scale-105 transition-transform">
              <Building2 className="h-5 w-5 text-slate-950 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-[0.2em] font-serif-luxury text-slate-900 dark:text-slate-50 block leading-tight">
                APEX<span className="gold-gradient-text font-normal">LUXE</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.3em] font-semibold text-amber-500/90 block -mt-1">
                Real Estate Private Capital
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link 
              href="/"
              className={`py-1 text-xs font-semibold uppercase tracking-widest transition-all ${
                pathname === "/" ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400 hover:text-slate-100"
              }`}
            >
              Home
            </Link>
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.label} 
                  href={link.href}
                  className={`py-1 text-xs font-semibold uppercase tracking-widest transition-all ${
                    isActive 
                      ? "text-amber-400 border-b-2 border-amber-400" 
                      : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Header Controls */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-white/5 transition-colors cursor-pointer border border-white/5"
              title="Toggle Contrast Mode"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* User Session Profile Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl glass-panel border border-white/10 hover:border-amber-500/40 text-xs font-semibold text-slate-200 transition-all cursor-pointer shadow-lg"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-bold text-[10px]">
                    {user.displayName?.charAt(0) || "U"}
                  </div>
                  <span>{user.displayName}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 glass-panel rounded-xl shadow-2xl py-2 z-50 text-xs border border-white/10">
                    <div className="px-4 py-2 border-b border-white/10">
                      <p className="font-semibold text-slate-100">{user.displayName}</p>
                      <p className="text-[10px] text-amber-400 font-mono tracking-wider uppercase mt-0.5">{user.role}</p>
                    </div>
                    <Link
                      href={getDashboardLink() || "/"}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <LayoutDashboard className="h-4 w-4 text-amber-400" />
                      Executive Dashboard
                    </Link>
                    <div className="h-[1px] bg-white/10 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/login"
                  className="text-xs font-semibold tracking-wider text-slate-300 hover:text-amber-400 px-3 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup"
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 rounded-xl hover:shadow-lg hover:shadow-amber-500/20 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  Request Access
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Header Menu Button */}
          <div className="flex lg:hidden items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-white cursor-pointer"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden w-full glass-panel border-b border-white/10 py-5 px-6 shadow-2xl">
            <nav className="flex flex-col gap-4 text-xs font-medium">
              <Link 
                href="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-200 hover:text-amber-400 text-sm font-semibold"
              >
                Home
              </Link>
              {navLinks.map((link) => (
                <Link 
                  key={link.label} 
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-300 hover:text-amber-400 text-sm font-semibold"
                >
                  {link.label}
                </Link>
              ))}

              <div className="h-[1px] bg-white/10 my-2"></div>

              {/* Mobile Role Switcher */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Switch Persona</p>
                <div className="grid grid-cols-2 gap-2">
                  {rolesConfig.map(r => (
                    <button
                      key={r.role}
                      onClick={() => handleRoleSwitch(r.role)}
                      className={`text-left p-2 rounded-lg text-[11px] border ${
                        user?.role === r.role ? "border-amber-500 bg-amber-500/10 text-amber-300 font-bold" : "border-white/10 text-slate-400"
                      }`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[1px] bg-white/10 my-2"></div>

              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-sm">{user.displayName}</p>
                      <span className="text-[10px] text-amber-400 uppercase tracking-widest">{user.role}</span>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="text-xs text-rose-400 font-semibold flex items-center gap-1"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                  <Link 
                    href={getDashboardLink() || "/"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center block py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider"
                  >
                    Go To Dashboard
                  </Link>
                </div>
              ) : (
                <div className="flex gap-3 pt-2">
                  <Link 
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2.5 border border-white/15 rounded-xl text-slate-300 font-semibold"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-xl font-bold uppercase tracking-wider"
                  >
                    Request Access
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main App Page Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* World-Class Executive Footer */}
      <footer className="bg-[#05070B] border-t border-amber-500/20 pt-20 pb-12 text-slate-400 text-xs font-sans relative overflow-hidden">
        {/* Ambient Glow background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-16 border-b border-white/10">
            
            {/* Brand Intro Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-slate-950 stroke-[2.2]" />
                </div>
                <span className="text-xl font-bold tracking-[0.2em] font-serif-luxury text-slate-100">
                  APEX<span className="gold-gradient-text font-normal">LUXE</span>
                </span>
              </div>

              <p className="text-slate-400 leading-relaxed text-xs pr-6">
                ApexLuxe is an enterprise private capital real estate brokerage representing architectural masterpieces, trophy penthouses, and sovereign-grade land assets globally.
              </p>

              <div className="flex items-center gap-4 text-slate-400 pt-2">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Firebase Realtime Connected
                </div>
                <span className="text-slate-600">•</span>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Lock className="w-3 h-3 text-amber-400" />
                  AES-256 Encrypted
                </div>
              </div>
            </div>

            {/* Quick Collections */}
            <div>
              <h4 className="font-serif-luxury text-base font-semibold text-slate-200 mb-4 tracking-wider gold-gradient-text uppercase">
                Estates Portfolio
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                {["Ultra-Luxury Penthouses", "Waterfront Compounds", "Historic Mansions", "Private Island Retreats", "Commercial Towers"].map((item) => (
                  <li key={item}>
                    <Link href="/search" className="hover:text-amber-400 transition-colors flex items-center gap-1.5 group">
                      <span className="w-1 h-1 rounded-full bg-amber-500/40 group-hover:bg-amber-400"></span>
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Role Dashboards Link */}
            <div>
              <h4 className="font-serif-luxury text-base font-semibold text-slate-200 mb-4 tracking-wider gold-gradient-text uppercase">
                Access Portals
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li onClick={() => handleRoleSwitch("superadmin")} className="hover:text-amber-400 cursor-pointer transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Super Admin Portal
                </li>
                <li onClick={() => handleRoleSwitch("agent")} className="hover:text-amber-400 cursor-pointer transition-colors flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-500" /> Senior Advisor Portal
                </li>
                <li onClick={() => handleRoleSwitch("customer")} className="hover:text-amber-400 cursor-pointer transition-colors flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-500" /> Investor Client Area
                </li>
                <li onClick={() => handleRoleSwitch("owner")} className="hover:text-amber-400 cursor-pointer transition-colors flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" /> Asset Owner Panel
                </li>
              </ul>
            </div>

            {/* Newsletter Column */}
            <div>
              <h4 className="font-serif-luxury text-base font-semibold text-slate-200 mb-4 tracking-wider gold-gradient-text uppercase">
                Private Advisory
              </h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Receive confidential off-market real estate reports and sovereign wealth market intelligence.
              </p>
              <div className="space-y-2">
                <div className="relative">
                  <input 
                    type="email" 
                    placeholder="advisory@institution.com" 
                    className="w-full bg-[#0A0E17] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <button 
                  onClick={() => alert("Thank you. Your advisory request has been dispatched.")}
                  className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold py-2.5 rounded-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                >
                  Subscribe Briefing <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} ApexLuxe Real Estate Inc. All Rights Reserved.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
              <span className="hover:text-slate-400 cursor-pointer">SEC & Real Estate Compliance</span>
              <span className="hover:text-slate-400 cursor-pointer">Sitemap</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating AI Concierge Chatbot */}
      <Chatbot />
    </div>
  );
}

