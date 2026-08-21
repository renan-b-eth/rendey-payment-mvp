"use client";

import { FormEvent, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Loader2,
  Lock,
  Mail,
  Wallet,
  Zap,
} from "lucide-react";
import { useToast } from "@/lib/toast";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = (await res.json()) as {
          error?: string;
          walletSource?: "circle" | "mock";
        };
        if (!res.ok) {
          const message = data.error ?? "Registration failed.";
          setError(message);
          toast(message, "error");
          return;
        }
        toast(
          data.walletSource === "circle"
            ? "Account created — Solana wallet provisioned."
            : "Account created — wallet ready (demo mode).",
          "success"
        );
        router.push("/dashboard");
        router.refresh();
      } catch {
        const message = "Network error — please try again.";
        setError(message);
        toast(message, "error");
      } finally {
        setLoading(false);
      }
    },
    [name, email, password, router, toast]
  );

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white font-sans flex flex-col">
      <header className="border-b border-white/[0.06] bg-[#0a0b0d]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#06210f]" strokeWidth={2.5} />
            </div>
            <span className="font-semibold tracking-tight">Valence</span>
          </Link>
          <Link
            href="/login"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-8">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5">
              <Wallet className="w-6 h-6 text-cyan-300" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Register Your Business
            </h1>
            <p className="text-xs text-gray-500 mt-1.5">
              We'll instantly provision a Developer-Controlled USDC wallet on
              Solana Mainnet for your settlements.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="text-[11px] text-gray-400 mb-1.5 block">
                  Business Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Acme Café"
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-gray-400 mb-1.5 block">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@business.com"
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-gray-400 mb-1.5 block">
                  Password <span className="text-gray-600">(min. 8 chars)</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3.5 py-2.5 text-xs text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-[#06210f] text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-[11px] text-gray-600 text-center mt-5">
              Already registered?{" "}
              <Link
                href="/login"
                className="text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-[10px] text-gray-700 text-center mt-5">
            By registering you agree to the Valence terms & privacy policy.
          </p>
        </div>
      </main>
    </div>
  );
}
