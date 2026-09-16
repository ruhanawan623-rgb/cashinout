"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Lock, Mail, ArrowRight, Shield, User, Calculator } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Network error during login");
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoRole = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    handleLogin(undefined, roleEmail, rolePass);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-600 text-white shadow-2xs mb-3">
            <Activity className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            MediCash POS
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Medical Store Cash Management Software
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Sign in to Register</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your credentials to manage cash flow
            </p>
          </div>

          {error && (
            <div className="mb-3.5 p-2.5 bg-rose-50 border border-rose-200/80 rounded-lg text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-3.5">
            <div>
              <Input
                label="Email"
                type="email"
                placeholder="you@medicash.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftAddon={<Mail className="w-4 h-4" />}
                required
                autoFocus
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftAddon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2 shadow-2xs mt-1"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Sign In
            </Button>
          </form>

          {/* 1-Click Role Switcher Demo */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Quick 1-Click Demo Login
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setDemoRole("admin@medicash.local", "admin123")}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors text-[11px] font-medium"
              >
                <Shield className="w-3.5 h-3.5 text-slate-500 mb-1" />
                Admin
              </button>

              <button
                type="button"
                onClick={() => setDemoRole("cashier@medicash.local", "cashier123")}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors text-[11px] font-medium"
              >
                <User className="w-3.5 h-3.5 text-slate-500 mb-1" />
                Cashier
              </button>

              <button
                type="button"
                onClick={() => setDemoRole("accountant@medicash.local", "accountant123")}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors text-[11px] font-medium"
              >
                <Calculator className="w-3.5 h-3.5 text-slate-500 mb-1" />
                Accountant
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-5">
          MediCash Medical POS • Standard Edition
        </p>
      </div>
    </div>
  );
}
