"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, UserRole } from "@/store/auth-store";
import Link from "next/link";
import { Building, Mail, Lock, User, PlusCircle, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { user, signUp, loading, error } = useAuthStore();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("customer");
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (user) {
      redirectToDashboard(user.role);
    }
  }, [user]);

  const redirectToDashboard = (role: string) => {
    if (role === "superadmin") {
      router.push("/admin/dashboard");
    } else if (role === "customer") {
      router.push("/customer/dashboard");
    } else {
      router.push("/agent/dashboard");
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) return;

    const ok = await signUp(email, password, displayName, role);
    if (ok) {
      setRegistered(true);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 animate-fade-in-up">
      <div className="bg-white dark:bg-[#0F131C] w-full max-w-md rounded-xl p-8 border border-slate-200 dark:border-slate-800 shadow-lg relative">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm mb-4">
            <Building className="h-5 w-5 text-amber-600 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-sans">Create Account</h2>
          <p className="text-xs text-slate-500 mt-1">Register to start managing listings or viewing properties.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 rounded-lg text-xs font-semibold text-center font-mono">
            ⚠️ {error}
          </div>
        )}

        {registered ? (
          <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-xl border border-emerald-500/20 text-center space-y-4 animate-scale-in">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 dark:text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase font-mono">Account Registered</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light font-sans">
              Your registration was successful. Welcome to ApexLuxe.
            </p>
            <button 
              onClick={() => redirectToDashboard(role)}
              className="w-full py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 font-bold uppercase tracking-wider text-xs rounded-lg cursor-pointer"
            >
              Enter Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSignupSubmit} className="space-y-4 text-xs">
            
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono text-slate-550 dark:text-slate-400 tracking-wider">Full Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Sarah Connor" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none"
                />
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono text-slate-550 dark:text-slate-400 tracking-wider">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none"
                />
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono text-slate-550 dark:text-slate-400 tracking-wider">Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none"
                />
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Select Role */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono text-slate-550 dark:text-slate-400 tracking-wider">Account Type</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="customer">Buyer / Client</option>
                <option value="agent">Broker Agent</option>
                <option value="owner">Independent Owner</option>
                <option value="agency">Agency Manager</option>
              </select>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold uppercase rounded-lg tracking-wider text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}

        <div className="text-center mt-6 text-[11px] text-slate-500 font-sans">
          Already have an account?{" "}
          <Link href="/login" className="text-amber-600 hover:underline">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
