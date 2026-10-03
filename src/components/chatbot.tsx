"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Sparkles, User, HelpCircle, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize with welcome message
  useEffect(() => {
    setMessages([
      {
        id: "msg_welcome",
        sender: "bot",
        text: "Welcome to ApexLuxe Private Concierge. I am your AI Advisory Assistant. How may I assist your estate acquisition or property valuation today?",
        timestamp: new Date()
      }
    ]);
  }, []);

  // Scroll to bottom when messages list changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: "usr_" + Math.random().toString(36).substr(2, 9),
      sender: "user",
      text: inputText.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // Simulate natural AI thinking delay
    setTimeout(() => {
      const responseText = getBotResponse(userMsg.text);
      const botMsg: ChatMessage = {
        id: "bot_" + Math.random().toString(36).substr(2, 9),
        sender: "bot",
        text: responseText,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 800);
  };

  const getBotResponse = (query: string): string => {
    const text = query.toLowerCase();

    if (text.includes("villa") || text.includes("house") || text.includes("estate")) {
      return "We represent verified sovereign-grade villas and architectural compounds globally. Explore our luxury portfolio: http://localhost:3000/search?type=villa";
    }
    if (text.includes("apartment") || text.includes("condo") || text.includes("penthouse")) {
      return "Discover high-floor trophy penthouses and skyline residences in premier metropolis locations: http://localhost:3000/search?type=apartment";
    }
    if (text.includes("rent") || text.includes("lease")) {
      return "We manage select corporate and executive lease opportunities: http://localhost:3000/search?purpose=rent";
    }
    if (text.includes("buy") || text.includes("sale") || text.includes("acquire")) {
      return "To acquire off-market or featured estates, inspect our collection: http://localhost:3000/search?purpose=sale. Our private escrow partners manage confidential transactions.";
    }
    if (text.includes("viewing") || text.includes("schedule") || text.includes("tour") || text.includes("book")) {
      return "Private private tours can be reserved directly on any listing details page. You will receive immediate agent confirmation in your Client Dashboard.";
    }
    if (text.includes("agent") || text.includes("broker") || text.includes("advisor")) {
      return "Our senior estate advisors (including Alexander Mercer and Sophia Sterling) can be contacted directly from the homepage or listing pages.";
    }
    if (text.includes("valuation") || text.includes("estimate") || text.includes("yield")) {
      return "For AI-driven market yield models and automated price estimations, open any property listing and click 'AI Valuation Analysis'.";
    }
    if (text.includes("hello") || text.includes("hi") || text.includes("greetings")) {
      return "Greetings. How may ApexLuxe assist your private capital property endeavors today?";
    }
    
    return "Thank you for reaching out. You can explore our verified catalog (http://localhost:3000/search) or submit an inquiry using our Private Consultation form on the homepage.";
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
      
      {/* Expanded Chat window */}
      {isOpen && (
        <div className="glass-panel w-80 sm:w-96 h-[480px] rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden border border-white/10 animate-scale-in text-xs">
          
          {/* Header */}
          <div className="bg-[#0B0F19] px-4 py-3 flex items-center justify-between border-b border-amber-500/20 text-white">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-slate-950"></span>
              </div>
              <div>
                <h4 className="font-serif-luxury text-sm font-bold text-slate-100 gold-gradient-text tracking-wide">
                  ApexLuxe Concierge AI
                </h4>
                <p className="text-[9px] text-slate-400 font-mono">Private Capital Advisory • Online</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages scroll area */}
          <div className="flex-grow p-4 overflow-y-auto space-y-3.5 bg-[#07090E]/60">
            {messages.map((msg) => {
              const isBot = msg.sender === "bot";
              return (
                <div key={msg.id} className={`flex items-start gap-2.5 ${!isBot ? "flex-row-reverse" : ""}`}>
                  {isBot && (
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shrink-0 font-bold">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div className={`p-3.5 rounded-2xl leading-relaxed text-xs shadow-md max-w-[82%] ${
                    isBot 
                      ? "bg-[#0F131C] text-slate-200 rounded-tl-none border border-white/10" 
                      : "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-semibold rounded-tr-none ml-auto"
                  }`}>
                    {/* Render URLs as clickable anchors cleanly */}
                    <p className="whitespace-pre-line">
                      {msg.text.split(" ").map((word, i) => {
                        if (word.startsWith("http://") || word.startsWith("https://")) {
                          const cleanUrl = word.replace("http://localhost:3000", "");
                          const label = cleanUrl === "/search" ? "Explore Catalog" : cleanUrl.includes("type=villa") ? "Villas Collection" : cleanUrl.includes("type=apartment") ? "Penthouses" : "Client Portal";
                          return (
                            <Link key={i} href={cleanUrl} className="inline-flex items-center gap-1 font-bold underline text-amber-400 hover:text-amber-300 mr-1">
                              {label} <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          );
                        }
                        return word + " ";
                      })}
                    </p>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px] pt-1">
                <div className="h-6 w-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Sparkles className="h-3 w-3 animate-spin" />
                </div>
                <span>Analyzing market catalog...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick options panel */}
          <div className="px-3.5 py-2 border-t border-white/10 flex flex-wrap gap-1.5 bg-[#0A0E17]">
            {[
              { text: "👑 Sovereign Villas", q: "Show me sovereign villas" },
              { text: "🌆 Sky Penthouses", q: "Show me sky penthouses" },
              { text: "📅 Book Private Tour", q: "How can I schedule a private tour?" }
            ].map((opt, i) => (
              <button
                key={i}
                onClick={() => setInputText(opt.q)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] px-2.5 py-1 rounded-full cursor-pointer text-slate-300 transition-colors"
              >
                {opt.text}
              </button>
            ))}
          </div>

          {/* Send Input form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-[#07090E] flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask ApexLuxe Concierge..."
              className="flex-grow bg-[#0F131C] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:opacity-95 text-slate-950 p-2.5 rounded-xl flex items-center justify-center cursor-pointer transition-all font-bold"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>
      )}

      {/* Floating Chat Button trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 p-4 rounded-2xl shadow-2xl hover:scale-105 transition-all flex items-center justify-center cursor-pointer border border-amber-300/40"
        title="Open ApexLuxe Concierge Chatbot"
      >
        <MessageSquare className="h-6 w-6 stroke-[2.2]" />
      </button>
      
    </div>
  );
}

