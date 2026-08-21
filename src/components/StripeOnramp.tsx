"use client";

// =============================================================================
// StripeOnramp — Valence Payment Platform
//
// Mounts the official Stripe Crypto Onramp UI. The SDK is loaded at runtime
// directly from Stripe's CDN (https://js.stripe.com/v3/crypto-onramp.js) via
// a dynamically injected <script> tag — there is NO npm package dependency,
// so CI/Vercel builds can never fail on registry availability.
//
// The backend creates a session whose destination wallet is locked to the
// merchant's Solana address, so purchased USDC settles directly into the
// Circle programmable wallet — no manual address input ever exposed.
//
// SDK types live in src/types/stripe-onramp.d.ts (imported below).
// =============================================================================

import { useEffect, useRef, useState } from "react";
import { getStripePublishableKey } from "@/lib/env";
import type {
  StripeOnrampFactory,
  StripeOnrampSession,
} from "@/types/stripe-onramp";

const ONRAMP_SDK_URL = "https://js.stripe.com/v3/crypto-onramp.js";

// Singleton loader promise — the SDK script is injected at most once per page
// lifetime, and concurrent mounts share the same load. Reset to null on
// failure so a retry re-attempts the network fetch.
let sdkLoadPromise: Promise<StripeOnrampFactory> | null = null;

function loadStripeOnrampSdk(): Promise<StripeOnrampFactory> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Stripe Onramp SDK can only be loaded in the browser.")
    );
  }

  // Already loaded (e.g. a previous mount in this page lifetime).
  if (typeof window.StripeOnramp === "function") {
    return Promise.resolve(window.StripeOnramp);
  }

  if (!sdkLoadPromise) {
    sdkLoadPromise = new Promise<StripeOnrampFactory>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = ONRAMP_SDK_URL;
      script.async = true;

      script.onload = () => {
        if (typeof window.StripeOnramp === "function") {
          resolve(window.StripeOnramp);
        } else {
          sdkLoadPromise = null;
          reject(
            new Error(
              "Stripe Onramp SDK loaded, but window.StripeOnramp is unavailable."
            )
          );
        }
      };

      script.onerror = () => {
        sdkLoadPromise = null;
        reject(
          new Error("Failed to load the Stripe Onramp SDK from the CDN.")
        );
      };

      document.head.appendChild(script);
    });
  }

  return sdkLoadPromise;
}

export interface StripeOnrampProps {
  /** Merchant's Solana wallet (locked server-side into the session). */
  walletAddress: string;
  /** Fiat source amount (BRL or USD). */
  amount: number;
  sourceCurrency?: "brl" | "usd";
  onFulfilled?: () => void;
  onError?: (message: string) => void;
}

type LoadState = "loading" | "ready" | "error";

export default function StripeOnramp({
  walletAddress,
  amount,
  sourceCurrency = "brl",
  onFulfilled,
  onError,
}: StripeOnrampProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Callbacks via ref so the mount effect stays stable across re-renders.
  const callbacksRef = useRef({ onFulfilled, onError });
  callbacksRef.current = { onFulfilled, onError };

  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function mount() {
      setState("loading");
      setErrorMessage(null);

      try {
        // 1. Server-side session — wallet locked to the merchant.
        const response = await fetch("/api/stripe/create-onramp-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress,
            destinationCurrency: "usdc",
            amount,
            sourceCurrency,
          }),
        });

        const payload = (await response.json()) as {
          clientSecret?: string;
          error?: string;
        };

        if (!response.ok || !payload.clientSecret) {
          throw new Error(
            payload.error ?? "Failed to initialize the onramp session."
          );
        }

        if (cancelled || !containerRef.current) return;

        // 2. Official Stripe Onramp SDK, loaded from Stripe's CDN.
        const stripeOnramp = await loadStripeOnrampSdk();
        if (cancelled || !containerRef.current) return;

        const onramp = stripeOnramp(getStripePublishableKey());
        const session: StripeOnrampSession = onramp.createSession({
          clientSecret: payload.clientSecret,
          appearance: { theme: "dark" },
        });

        session.addEventListener("onramp_ui_loaded", () => {
          if (!cancelled) setState("ready");
        });

        session.addEventListener("onramp_session_updated", (event) => {
          if (cancelled) return;
          const status = event.payload?.session?.status;
          if (status === "fulfillment_complete") {
            callbacksRef.current.onFulfilled?.();
          } else if (status === "rejected") {
            callbacksRef.current.onError?.("The onramp session was rejected.");
          }
        });

        session.mount(containerRef.current);
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Unexpected onramp error.";
        setErrorMessage(message);
        setState("error");
        callbacksRef.current.onError?.(message);
      }
    }

    void mount();

    return () => {
      cancelled = true;
    };
  }, [walletAddress, amount, sourceCurrency, reloadKey]);

  return (
    <div className="relative min-h-[420px]">
      {/* Stripe mounts its secure iframe here. Always rendered (never
          display:none) so the iframe can measure layout correctly. */}
      <div ref={containerRef} className="min-h-[420px] rounded-xl overflow-hidden" />

      {state !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-white/[0.06] bg-[#0d0f12]">
          {state === "loading" ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-emerald-400" />
              <p className="text-xs text-white/50">
                Starting secure Stripe onramp…
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <p className="text-sm font-medium text-red-300">
                Onramp unavailable
              </p>
              <p className="text-xs text-red-400/70">{errorMessage}</p>
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className="mt-1 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/[0.08]"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
