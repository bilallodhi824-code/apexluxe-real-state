"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dbService, Property, Agent, BlogPost } from "@/lib/db-service";
import { aiService } from "@/lib/ai-service";
import { 
  Search, 
  Sparkles, 
  MapPin, 
  BedDouble, 
  Bath, 
  Maximize, 
  ArrowRight, 
  Building2,
  User,
  Star,
  Quote,
  Clock,
  Send,
  HelpCircle,
  ChevronDown,
  ShieldCheck,
  TrendingUp,
  Award,
  Lock,
  ArrowUpRight
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Smart AI Search States
  const [aiQuery, setAiQuery] = useState("");
  const [aiParsing, setAiParsing] = useState(false);

  // Contact Form States
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", msg: "" });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // FAQ Active State
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  useEffect(() => {
    async function loadData() {
      try {
        const props = await dbService.getProperties();
        const featuredProps = props.filter(p => p.featured).slice(0, 3);
        setProperties(featuredProps);

        const agList = await dbService.getAgents();
        setAgents(agList);

        const blList = await dbService.getBlogs();
        setBlogs(blList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setAiParsing(true);
    try {
      const parsedFilters = await aiService.parseSmartSearch(aiQuery);
      
      const params = new URLSearchParams();
      if (parsedFilters.purpose) params.set("purpose", parsedFilters.purpose);
      if (parsedFilters.type) params.set("type", parsedFilters.type);
      if (parsedFilters.maxPrice) params.set("maxPrice", parsedFilters.maxPrice.toString());
      if (parsedFilters.bedrooms) params.set("bedrooms", parsedFilters.bedrooms.toString());
      if (parsedFilters.keyword) params.set("keyword", parsedFilters.keyword);

      router.push(`/search?${params.toString()}&ai=true`);
    } catch (err) {
      console.error(err);
      router.push(`/search?keyword=${encodeURIComponent(aiQuery)}`);
    } finally {
      setAiParsing(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email) return;

    await dbService.logActivity(
      "activity",
      `Private Consultation requested by ${contactForm.name} (${contactForm.email})`,
      "guest"
    );
    setContactSubmitted(true);
    setContactForm({ name: "", email: "", phone: "", msg: "" });
    setTimeout(() => setContactSubmitted(false), 5000);
  };

  const faqs = [
    {
      q: "How does ApexLuxe verify its sovereign estate listings?",
      a: "Every asset listed on ApexLuxe undergoes a rigorous 5-stage due diligence process. Our legal and architectural advisors review title deeds, zoning mandates, land registry records, and physical inspection reports before granting public listing certification."
    },
    {
      q: "What institutional settlement options are available?",
      a: "ApexLuxe partners with licensed global escrow accounts, tier-1 private banks, and regulated settlement clearing houses. Confidential multi-currency wiring and escrow arrangements are tailored to cross-border requirements."
    },
    {
      q: "Can I access off-market non-public listings?",
      a: "Yes. Over 40% of our portfolio is held under confidential Non-Disclosure Agreements (NDAs). Qualified institutional investors and accredited buyers can request off-market access via our Private Advisory Desk."
    },
    {
      q: "How does the AI Property Investment Concierge assist my search?",
      a: "Our proprietary AI engine translates natural language investment criteria (e.g., yield expectations, architectural preference, coastal proximity) into immediate filtered matches with live valuation projections."
    }
  ];

  return (
    <div className="w-full font-sans selection:bg-[#D4AF37]/30 selection:text-amber-200">
      
      {/* 1. EDITORIAL LUXURY HERO SECTION */}
      <section className="relative min-h-[92vh] flex flex-col justify-between py-16 items-center bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2400&q=85')] bg-cover bg-center overflow-hidden">
        {/* Dark Glass & Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090E] via-[#07090E]/80 to-[#07090E]/60"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent"></div>

        {/* Ambient Top Space */}
        <div className="h-4"></div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center my-auto">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-[0.25em] mb-8 shadow-2xl animate-fade-in-up">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Private Capital & Sovereign Real Estate</span>
          </div>

          {/* High-Impact Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold font-serif-luxury tracking-tight text-white mb-6 leading-[1.08]">
            Architectural Masterpieces &<br />
            <span className="gold-gradient-text font-serif-luxury italic font-normal">Bespoke Real Estate Assets</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-10 font-light leading-relaxed tracking-wide">
            Curating iconic estates, trophy penthouses, and high-yield commercial assets for private investors, sovereign capital, and ultra-high-net-worth clients globally.
          </p>

          {/* AI SMART SEARCH BAR */}
          <div className="max-w-3xl mx-auto glass-panel p-3.5 rounded-2xl shadow-2xl border border-white/15 gold-border-glow transition-all">
            <form onSubmit={handleAiSearch} className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="flex-grow flex items-center gap-3 px-4 py-3 bg-[#090C12]/90 rounded-xl border border-white/10 focus-within:border-amber-400 transition-all">
                <Search className="h-4.5 w-4.5 text-amber-400 shrink-0" />
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="e.g. 'Penthouse in Manhattan with skyline view under $15M'"
                  className="bg-transparent border-none outline-none text-xs text-slate-100 placeholder:text-slate-500 w-full focus:ring-0 font-sans"
                />
              </div>
              <button
                type="submit"
                disabled={aiParsing}
                className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-amber-500/20 hover:scale-[1.02] transition-all disabled:opacity-75 cursor-pointer shrink-0"
              >
                {aiParsing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    Parsing Criteria...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 stroke-[2.2]" />
                    Smart Match
                  </>
                )}
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 text-left mt-3 px-2 pt-2 border-t border-white/5">
              <span className="text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> AI Natural Search:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Waterfront Villa Palm Jumeirah",
                  "Private Island Estate",
                  "Beverly Hills Compound"
                ].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setAiQuery(tag)}
                    className="bg-white/5 hover:bg-white/10 px-2.5 py-0.5 rounded-full text-[10px] text-slate-300 transition-colors border border-white/5 cursor-pointer"
                  >
                    "{tag}"
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Live Market Counter Widgets */}
        <div className="relative z-10 mt-14 hidden md:flex items-center gap-12 glass-panel px-10 py-5 rounded-2xl border border-white/10 text-white shadow-2xl">
          <div className="text-center">
            <p className="text-xl font-bold font-serif-luxury gold-gradient-text">$3.4 Billion+</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Private Capital Transacted</p>
          </div>
          <div className="h-8 w-[1px] bg-white/10"></div>
          <div className="text-center">
            <p className="text-xl font-bold font-serif-luxury text-slate-100">120+</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Certified Senior Advisors</p>
          </div>
          <div className="h-8 w-[1px] bg-white/10"></div>
          <div className="text-center">
            <p className="text-xl font-bold font-serif-luxury text-slate-100">1,400+</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Sovereign Properties Listed</p>
          </div>
        </div>
      </section>

      {/* 2. PORTFOLIO CATEGORIES */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-[0.3em] block mb-2">Curated Portfolios</span>
          <h2 className="text-3xl sm:text-5xl font-serif-luxury text-slate-900 dark:text-slate-50 font-bold">
            Explore Property Collections
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto mt-3 leading-relaxed font-light">
            Filter our authenticated global listings by structural category, investment grade, and architectural style.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: "Sovereign Villas", type: "villa", icon: "🏛️", count: "48 Curated Estates", desc: "Private grounds with bespoke security" },
            { name: "Trophy Penthouses", type: "apartment", icon: "🏙️", count: "36 Sky Residences", desc: "High-floor panoramic metropolis views" },
            { name: "Corporate Towers", type: "office", icon: "🏢", count: "18 Prime Assets", desc: "Institutional grade commercial spaces" },
            { name: "Historic Countryside", type: "farmhouse", icon: "🌿", count: "12 Private Retreats", desc: "Expansive equestrian and vineyard plots" }
          ].map((cat) => (
            <Link 
              key={cat.type} 
              href={`/search?type=${cat.type}`}
              className="luxury-card p-8 rounded-2xl flex flex-col justify-between group cursor-pointer border border-white/5 relative overflow-hidden"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 group-hover:bg-amber-500/10 group-hover:border-amber-500/30 transition-all">
                {cat.icon}
              </div>
              <div>
                <h3 className="text-base font-bold font-serif-luxury text-slate-900 dark:text-slate-100 group-hover:text-amber-400 transition-colors tracking-wide">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-amber-500 font-semibold uppercase tracking-wider mt-1">{cat.count}</p>
                <p className="text-xs text-slate-400 mt-2 font-light leading-relaxed">{cat.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-amber-400 transition-colors">
                <span>View Collection</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED ESTATES GRID */}
      <section className="py-24 bg-[#05070C] border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <span className="text-amber-400 text-xs font-bold uppercase tracking-[0.3em] block mb-2">Prime Selections</span>
              <h2 className="text-3xl sm:text-5xl font-serif-luxury text-white font-bold">Featured Listings</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-3 max-w-lg font-light leading-relaxed">
                Hand-picked flagship listings backed by verified land registry audits and institutional appraisal reports.
              </p>
            </div>
            <Link 
              href="/search" 
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors group"
            >
              <span>Explore Complete Portfolio</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-96 rounded-2xl bg-white/5 animate-pulse border border-white/5"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {properties.map((prop) => (
                <div 
                  key={prop.id} 
                  className="luxury-card rounded-2xl overflow-hidden border border-white/10 group flex flex-col justify-between"
                >
                  <div>
                    {/* Cover Image & Tags */}
                    <div className="relative h-64 w-full overflow-hidden">
                      <img 
                        src={prop.images[0]} 
                        alt={prop.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0F131C] via-transparent to-transparent opacity-80"></div>
                      
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="bg-[#07090E]/80 backdrop-blur-md text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          For {prop.purpose}
                        </span>
                        {prop.featured && (
                          <span className="bg-amber-500 text-slate-950 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            Verified
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-4 right-4 glass-panel px-3.5 py-1.5 rounded-xl border border-white/15 text-sm font-bold font-serif-luxury gold-gradient-text shadow-lg">
                        {prop.purpose === "rent" ? `$${prop.price.toLocaleString()}/mo` : `$${prop.price.toLocaleString()}`}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-2">
                        <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{prop.location}</span>
                      </div>

                      <h3 className="text-lg font-bold font-serif-luxury text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                        {prop.title}
                      </h3>

                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed font-light">
                        {prop.description}
                      </p>

                      {/* Specs bar */}
                      <div className="flex items-center justify-between border-y border-white/10 py-3.5 my-4 text-xs text-slate-300 font-sans">
                        {prop.bedrooms && (
                          <div className="flex items-center gap-1.5">
                            <BedDouble className="h-4 w-4 text-amber-400" />
                            <span>{prop.bedrooms} Beds</span>
                          </div>
                        )}
                        {prop.bathrooms && (
                          <div className="flex items-center gap-1.5">
                            <Bath className="h-4 w-4 text-amber-400" />
                            <span>{prop.bathrooms} Baths</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Maximize className="h-4 w-4 text-amber-400" />
                          <span>{prop.area.toLocaleString()} sqft</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="px-6 pb-6 pt-0">
                    <Link 
                      href={`/property/${prop.id}`}
                      className="w-full block text-center py-3 text-xs font-bold uppercase tracking-wider border border-white/15 hover:border-amber-400 hover:text-amber-400 text-slate-200 rounded-xl transition-all"
                    >
                      Inspect Property Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. AI CONCIERGE & ADVISORY SHOWCASE */}
      <section id="concierge" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 sm:p-14 rounded-3xl border border-white/10 gold-border-glow relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" /> PropTech Intelligence
              </div>

              <h2 className="text-3xl sm:text-5xl font-serif-luxury font-bold text-white leading-tight">
                AI Investment Concierge &<br />
                <span className="gold-gradient-text">Automated Valuation Engine</span>
              </h2>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-light">
                ApexLuxe integrates machine-learning valuation models and natural language matching to streamline high-value transactions for private family offices and real estate advisors.
              </p>

              <div className="space-y-3 text-xs text-slate-300 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span>Real-Time Yield & Capital Growth Analytics</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span>Title Deed Verification & Blockchain Escrow Integration</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span>Confidential Non-Disclosure Off-Market Listings</span>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider hover:shadow-lg hover:shadow-amber-500/20 transition-all"
                >
                  Try AI Matchmaker <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Feature Mockup Box */}
            <div className="bg-[#090D16] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-200">ApexValuation Engine v4.2</span>
                </div>
                <span className="text-[10px] font-mono text-amber-400">99.4% Accuracy</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Target Investment Criteria</p>
                  <p className="text-slate-200 font-medium mt-1">"Penthouse in Manhattan near Central Park with private elevator & 6%+ net cap rate"</p>
                </div>

                <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-2">
                  <div className="flex justify-between text-[11px] font-bold text-amber-300">
                    <span>AI Valuation Forecast</span>
                    <span>$12,500,000</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full w-[82%]"></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Forecast 5-Yr Yield: +28.4%</span>
                    <span>Confidence Score: 96%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. SENIOR ADVISORS SHOWCASE */}
      <section id="advisors" className="py-24 bg-[#05070C] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-[0.3em] block mb-2">Advisory Team</span>
            <h2 className="text-3xl sm:text-5xl font-serif-luxury text-white font-bold">
              Senior Estate Brokers
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto mt-3 font-light leading-relaxed">
              Connect directly with certified real estate partners, luxury brokers, and private capital advisors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {agents.map((agent) => (
              <div 
                key={agent.id} 
                className="luxury-card p-8 rounded-2xl border border-white/10 flex flex-col items-center text-center group hover:border-amber-500/40 transition-all"
              >
                <div className="h-28 w-28 rounded-full overflow-hidden border-2 border-amber-500/30 p-1 mb-4 group-hover:border-amber-400 transition-colors shadow-xl">
                  <img src={agent.avatar} alt={agent.name} className="h-full w-full object-cover rounded-full" />
                </div>
                
                <h3 className="text-lg font-bold font-serif-luxury text-slate-100">{agent.name}</h3>
                <p className="text-xs text-amber-400 font-semibold tracking-wider uppercase mt-1">{agent.role}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{agent.agency}</p>
                
                <div className="flex items-center gap-2 my-4 text-xs glass-panel px-4 py-1.5 rounded-full font-semibold text-slate-300 border border-white/10">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>{agent.rating} Rating</span>
                  <span className="text-slate-600">•</span>
                  <span>{agent.experienceYears} Years Exp</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-light mt-1 line-clamp-3">
                  {agent.about}
                </p>

                <div className="h-[1px] bg-white/10 w-full my-6"></div>

                <button 
                  onClick={() => {
                    alert(`Advisory message channel initialized with ${agent.name}. Opening Advisor Dashboard.`);
                    router.push("/agent/dashboard");
                  }}
                  className="w-full py-3 text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-gradient-to-r hover:from-amber-400 hover:to-amber-500 hover:text-slate-950 text-slate-200 rounded-xl transition-all border border-white/10 cursor-pointer"
                >
                  Contact Senior Advisor
                </button>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. EDITORIAL JOURNAL & INSIGHTS */}
      <section id="blog" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-[0.3em] block mb-2">Apex Luxe Journal</span>
          <h2 className="text-3xl sm:text-5xl font-serif-luxury text-slate-900 dark:text-slate-50 font-bold">
            Market Intelligence & Reports
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto mt-3 font-light leading-relaxed">
            Analytical insights, cross-border tax guidance, and architectural design trends.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blogs.map((post) => (
            <div 
              key={post.id} 
              className="luxury-card rounded-2xl overflow-hidden border border-white/10 flex flex-col sm:flex-row group"
            >
              <div className="sm:w-2/5 relative h-52 sm:h-auto overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <div className="p-6 sm:w-3/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-amber-400 tracking-widest mb-2">
                    <span>{post.category}</span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-slate-400" /> {post.readTime}</span>
                  </div>
                  <h3 className="text-base font-bold font-serif-luxury text-slate-900 dark:text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed font-light">
                    {post.excerpt}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-[11px] text-slate-400">
                  <span>By {post.authorName}</span>
                  <span>{post.publishedAt}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FAQ ACCORDION */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-[0.3em] block mb-2">Advisory Helpdesk</span>
          <h2 className="text-3xl sm:text-4xl font-serif-luxury text-slate-900 dark:text-slate-50 font-bold">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="glass-panel rounded-2xl border border-white/10 overflow-hidden transition-all shadow-md"
            >
              <button 
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                className="w-full px-6 py-5 text-left flex justify-between items-center text-slate-200 hover:text-amber-400 transition-colors font-semibold text-xs sm:text-sm cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <HelpCircle className="h-4 w-4 text-amber-400 shrink-0" />
                  {faq.q}
                </span>
                <ChevronDown className={`h-4 w-4 text-amber-400 transition-transform duration-300 ${activeFaq === index ? "rotate-180" : ""}`} />
              </button>
              
              {activeFaq === index && (
                <div className="px-6 pb-6 pt-1 border-t border-white/5 animate-fade-in-up">
                  <p className="text-xs text-slate-400 leading-relaxed font-light">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. BESPOKE PRIVATE CONSULTATION FORM */}
      <section id="contact" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-3xl border border-amber-500/20 p-8 sm:p-12 shadow-2xl relative overflow-hidden gold-border-glow">
          
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-[0.3em] block mb-2">Confidential Desk</span>
            <h2 className="text-3xl sm:text-4xl font-serif-luxury font-bold text-white">
              Request Private Consultation
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-3 font-light leading-relaxed">
              Submit your property acquisition parameters or listing requests. A senior broker will review your dossier under NDA.
            </p>
          </div>

          <form onSubmit={handleContactSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Full Legal Name</label>
                <input 
                  type="text" 
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="e.g. Jean-Luc Vance" 
                  className="w-full bg-[#07090E] border border-white/15 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Institutional / Corporate Email</label>
                <input 
                  type="email" 
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="e.g. vance@capital.com" 
                  className="w-full bg-[#07090E] border border-white/15 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Phone / Encrypted Channel (Optional)</label>
              <input 
                type="tel" 
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                placeholder="e.g. +1 (555) 019-9922" 
                className="w-full bg-[#07090E] border border-white/15 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Acquisition Mandate & Criteria</label>
              <textarea 
                rows={4}
                required
                value={contactForm.msg}
                onChange={(e) => setContactForm({ ...contactForm, msg: e.target.value })}
                placeholder="Target locations, minimum square footage, yield expectations, or off-market preference..." 
                className="w-full bg-[#07090E] border border-white/15 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-colors resize-none"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl hover:shadow-amber-500/20 hover:scale-[1.01] transition-all cursor-pointer"
            >
              Submit Confidential Advisory Request
            </button>
          </form>

          {contactSubmitted && (
            <div className="mt-5 p-4 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 rounded-xl text-center text-xs font-semibold animate-fade-in-up flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Your advisory request has been dispatched securely under NDA. A senior broker will respond within 24 hours.</span>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

