"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";
import { Building, Mail, Lock, LogIn, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loginWithGoogle, loading, error } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);

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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const ok = await login(email, password);
    if (ok) {
      setSuccess(true);
    }
  };

  const handleGoogleLogin = async () => {
    const ok = await loginWithGoogle();
    if (ok) {
      setSuccess(true);
    }
  };

  const triggerQuickLogin = async (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("password123");
    const ok = await login(roleEmail, "password123");
    if (ok) {
      setSuccess(true);
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
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-sans">Sign In</h2>
          <p className="text-xs text-slate-500 mt-1">Enter your email and password to access your dashboard.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 rounded-lg text-xs font-semibold text-center font-mono">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-450 rounded-lg text-xs font-semibold text-center font-mono">
            🔑 Login authorized. Redirecting...
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
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

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold uppercase rounded-lg tracking-wider text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
          <span className="relative bg-white dark:bg-[#0F131C] px-3 text-[10px] uppercase font-mono text-slate-400">Or</span>
        </div>

        {/* Google OAuth mock */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full py-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.72 14.9 1 12 1 7.35 1 3.4 3.65 1.55 7.5l3.85 2.99C6.35 7.39 9 5.04 12 5.04z" />
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.73-4.94 3.73-8.6z" fillRule="evenodd" clipRule="evenodd" />
            <path fill="#FBBC05" d="M5.4 14.51c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31L1.55 6.9C.56 8.9 0 11.23 0 13.7s.56 4.8 1.55 6.8l3.85-2.99z" />
            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.7-2.87c-1.1.74-2.52 1.18-4.26 1.18-3 0-5.65-2.35-6.6-5.46L1.55 15.9C3.4 19.75 7.35 23 12 23z" />
          </svg>
          Google Account
        </button>

        {/* Demo profiles quick selector */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-mono mb-3 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-slate-400" /> Demo Accounts
          </h4>
          <div className="grid grid-cols-3 gap-2 font-mono text-[9px]">
            <button 
              onClick={() => triggerQuickLogin("admin@apexluxe.com")}
              className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1.5 rounded-lg text-slate-600 dark:text-slate-350 font-bold truncate cursor-pointer text-center"
            >
              Admin
            </button>
            <button 
              onClick={() => triggerQuickLogin("alexander@apexluxe.com")}
              className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1.5 rounded-lg text-slate-600 dark:text-slate-350 font-bold truncate cursor-pointer text-center"
            >
              Agent
            </button>
            <button 
              onClick={() => triggerQuickLogin("customer@apexluxe.com")}
              className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1.5 rounded-lg text-slate-600 dark:text-slate-350 font-bold truncate cursor-pointer text-center"
            >
              Client
            </button>
          </div>
        </div>

        <div className="text-center mt-6 text-[11px] text-slate-500 font-sans">
          Don't have an account?{" "}
          <Link href="/signup" className="text-amber-600 hover:underline">
            Register Here
          </Link>
        </div>

      </div>
    </div>
  );
}
