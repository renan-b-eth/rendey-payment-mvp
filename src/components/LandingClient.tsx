"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowDownToLine,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  FileText,
  Globe,
  Landmark,
  Lock,
  Nfc,
  QrCode,
  Shield,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";

// =============================================================================
// Valence Landing Page — Client Component
//
// Rich, professional, information-dense presentation page featuring:
//   1. Hero with animated live stats + interactive terminal preview mockup
//   2. Trust bar & partner logos
//   3. How-it-works (3 steps)
//   4. Interactive product feature grid (tabbed)
//   5. Architecture flow diagram
//   6. Comparison table (Valence vs traditional acquirers)
//   7. Stats band
//   8. Security & compliance section
//   9. FAQ accordion
//   10. Final CTA + comprehensive footer
// =============================================================================

// ---- Types ------------------------------------------------------------------
interface FeatureTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  bullets: string[];
}

interface FaqItem {
  question: string;
  answer: string;
}

// ---- Static data -------------------------------------------------------------
const FEATURE_TABS: FeatureTab[] = [
  {
    id: "nfc",
    label: "NFC Tap-to-Pay",
    icon: <Nfc size={14} />,
    title: "Contactless payments, zero hardware",
    description:
      "Turn any smartphone into a payment terminal. Customers tap their phone or card — no expensive POS machines, no card readers, no cables.",
    bullets: [
      "NFC, PIX QR, and Solana Pay QR supported",
      "4-state payment machine: idle → listening → processing → settled",
      "Sub-second interaction feedback with pulse animations",
      "Works on any modern mobile browser",
    ],
  },
  {
    id: "onramps",
    label: "Fiat Onramps",
    icon: <ArrowDownToLine size={14} />,
    title: "PIX & cards, converted instantly",
    description:
      "Regulated onramps handle the fiat side. Transak processes BRL via PIX; Stripe Crypto Onramp processes cards and bank transfers.",
    bullets: [
      "Transak: BRL via PIX with instant lock",
      "Stripe Crypto Onramp: cards, ACH, SEPA",
      "Automated KYC/AML screening on every transaction",
      "Locked exchange rates — zero slippage for merchants",
    ],
  },
  {
    id: "wallets",
    label: "Circle Wallets",
    icon: <Wallet size={14} />,
    title: "Non-custodial, MPC-secured wallets",
    description:
      "Every merchant receives a programmable Solana wallet via Circle's W3S API. Private keys are sharded across Circle's MPC enclaves — Valence never holds key material.",
    bullets: [
      "Programmable Wallets via Circle /v1/w3s/developer",
      "Threshold Signature Scheme (TSS) key sharding",
      "Idempotency keys prevent duplicate wallet creation",
      "Graceful degradation with sandbox mock fallback",
    ],
  },
  {
    id: "settlement",
    label: "Solana Settlement",
    icon: <Zap size={14} />,
    title: "Finality in under 10 seconds",
    description:
      "USDC lands in the merchant's wallet on Solana with ~400ms block confirmations. Network fees average $0.00025 per transaction.",
    bullets: [
      "Native SPL USDC transfers on Solana",
      "Balance verification via Connection.getBalance()",
      "Devnet staging → Mainnet production toggle",
      "Every transaction generates an immutable audit entry",
    ],
  },
];

const FAQS: FaqItem[] = [
  {
    question: "Is Valence custodial? Do you hold my funds?",
    answer:
      "No. Valence is architecturally incapable of holding funds. All wallets are non-custodial, generated through Circle's Programmable Wallets (W3S) API. Private keys are managed by Circle's Multi-Party Computation (MPC) infrastructure — Valence's application code never sees raw key material.",
  },
  {
    question: "How fast is settlement really?",
    answer:
      "Solana produces blocks roughly every 400ms. From the moment a customer taps, fiat authorization happens in 2–4 seconds via the onramp, and on-chain USDC transfer confirms in under 1 second. End-to-end, a payment is fully settled in under 10 seconds — compared to T+2 to T+7 days with traditional acquirers.",
  },
  {
    question: "Which payment methods are supported?",
    answer:
      "On the fiat side: PIX (via Transak), credit/debit cards and bank transfers (via Stripe Crypto Onramp), and SEPA for EUR. On the crypto side: NFC tap-to-pay, Solana Pay QR codes, and direct SPL USDC transfers. All methods settle to the same non-custodial wallet.",
  },
  {
    question: "What are the fees?",
    answer:
      "Our target Merchant Discount Rate (MDR) is 0.5% — compared to 2–5% with traditional acquirers. Solana network fees average $0.00025 per transaction and are absorbed at the platform level. No hidden FX spread: rates are locked at authorization time.",
  },
  {
    question: "Is this available on mainnet today?",
    answer:
      "The current deployment runs on Solana Devnet with sandbox onramp credentials for staging and compliance review. Switching to Mainnet production only requires updating the RPC endpoint and API keys — the codebase is environment-agnostic by design.",
  },
  {
    question: "How do you handle compliance (KYC/AML)?",
    answer:
      "Merchant onboarding includes full KYB (Know Your Business) verification with CNPJ validation. Customer-side KYC/AML is performed automatically by the regulated onramps (Transak and Stripe) on every transaction. Transactions above R$ 50,000/day trigger manual review, and Circle's API supports FATF Travel Rule compliance.",
  },
];

const COMPARISON_ROWS: { label: string; valence: string; traditional: string; valenceGood: boolean }[] = [
  { label: "Settlement time", valence: "< 10 seconds", traditional: "T+2 to T+7 days", valenceGood: true },
  { label: "Merchant fee (MDR)", valence: "~0.5%", traditional: "2–5%", valenceGood: true },
  { label: "Network fee", valence: "~$0.00025 / tx", traditional: "Interchange + scheme fees", valenceGood: true },
  { label: "Hardware required", valence: "None (smartphone)", traditional: "POS machine (R$ 300–1,500)", valenceGood: true },
  { label: "Custody risk", valence: "Zero — non-custodial wallets", traditional: "Processor holds funds in transit", valenceGood: true },
  { label: "Operating hours", valence: "24/7/365 — blockchain rails", traditional: "Banking hours for settlement", valenceGood: true },
  { label: "Chargeback window", valence: "No chargebacks — final settlement", traditional: "Up to 180 days", valenceGood: true },
];

const ARCH_COLORS: Record<string, { bg: string; border: string }> = {
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/20" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/20" },
};

// ---- Count-up hook ------------------------------------------------------------
function useCountUp(target: number, duration = 1400, decimals = 2): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(parseFloat((target * eased).toFixed(decimals)));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, decimals]);
  return value;
}

// ---- FAQ accordion item --------------------------------------------------------
function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
      >
        <span className="text-sm font-semibold text-white">{item.question}</span>
        <ChevronDown
          size={16}
          className={`text-gray-500 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Landing Page Client Component
// =============================================================================
export default function LandingClient() {
  const [activeTab, setActiveTab] = useState("nfc");

  // Animated hero stats
  const settledThisMonth = useCountUp(128040, 1600, 0);
  const avgSettlement = useCountUp(6.4, 1600, 1);
  const activeMerchants = useCountUp(342, 1600, 0);

  const activeFeature = FEATURE_TABS.find((t) => t.id === activeTab) ?? FEATURE_TABS[0];

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white font-sans">
      {/* ============================ NAVIGATION ============================ */}
      <nav className="border-b border-white/[0.06] bg-[#0a0b0d]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">V</span>
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-emerald-400">Valence</span>
              <span className="text-gray-600 text-xs font-normal ml-2">by Rendey</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#comparison" className="hover:text-white transition-colors">Compare</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/whitepaper"
              className="hidden sm:block text-gray-400 hover:text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors"
            >
              Whitepaper
            </Link>
            <Link
              href="/terminal"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              Launch App <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.06] via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-emerald-500/[0.08] rounded-full blur-[130px]" />
        <div className="absolute top-40 right-[10%] w-[300px] h-[300px] bg-cyan-500/[0.06] rounded-full blur-[100px]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium">Live on Solana Devnet · Public Beta</span>
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.1]">
                Tap-to-Pay.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400">
                  Settled in Seconds.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-gray-400 mt-6 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Valence is an institutional-grade payment gateway that turns any smartphone into
                an NFC terminal — bridging PIX and card payments with instant USDC settlement
                on Solana, through non-custodial programmable wallets.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mt-8">
                <Link
                  href="/terminal"
                  className="group relative w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold px-7 py-3.5 rounded-2xl text-base transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2.5"
                >
                  <Smartphone size={18} />
                  Launch POS & Terminal
                </Link>
                <Link
                  href="/whitepaper"
                  className="group w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white font-semibold px-7 py-3.5 rounded-2xl text-base transition-all"
                >
                  <FileText size={18} />
                  Read Whitepaper
                </Link>
              </div>

              {/* Live stats */}
              <div className="grid grid-cols-3 gap-4 mt-10 max-w-lg mx-auto lg:mx-0">
                <div>
                  <p className="text-2xl font-bold text-white tabular-nums">
                    R$ {settledThisMonth.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Settled this month</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white tabular-nums">{avgSettlement.toFixed(1)}s</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Avg. settlement</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white tabular-nums">{Math.round(activeMerchants)}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Active merchants</p>
                </div>
              </div>
            </div>

            {/* Right: terminal mockup */}
            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute -inset-8 bg-gradient-to-br from-emerald-500/15 via-cyan-500/10 to-blue-500/15 rounded-[3rem] blur-2xl" />
              <div className="relative rounded-[2rem] border border-white/[0.1] bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-1.5 shadow-2xl shadow-black/40">
                <div className="rounded-[1.7rem] bg-[#0d0f12] border border-white/[0.06] overflow-hidden">
                  {/* Phone status bar */}
                  <div className="flex items-center justify-between px-5 pt-3">
                    <span className="text-[10px] text-gray-500 font-mono">14:32</span>
                    <div className="w-16 h-4 bg-black rounded-full" />
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-2 rounded-sm bg-gray-600" />
                    </div>
                  </div>
                  {/* App header */}
                  <div className="px-5 mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                        <Zap size={11} className="text-white" />
                      </div>
                      <span className="text-xs font-bold">Valence POS</span>
                    </div>
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">DEVNET</span>
                  </div>
                  {/* Amount display */}
                  <div className="px-5 mt-5 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Charge Amount</p>
                    <p className="text-4xl font-bold mt-1 tabular-nums">R$ 149,90</p>
                    <p className="text-[11px] text-emerald-400 mt-1">≈ $26.21 USDC on Solana</p>
                  </div>
                  {/* NFC pulse */}
                  <div className="flex justify-center mt-6 mb-2">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full border-2 border-cyan-400/50 flex items-center justify-center animate-pulse">
                        <div className="w-16 h-16 rounded-full border border-cyan-400/30 flex items-center justify-center">
                          <Nfc size={28} className="text-cyan-400" />
                        </div>
                      </div>
                      <div className="absolute inset-0 w-24 h-24 rounded-full border border-cyan-400/20 animate-ping" style={{ animationDuration: "2.4s" }} />
                    </div>
                  </div>
                  <p className="text-center text-[11px] text-gray-400 mb-5">Ready to tap</p>
                  {/* Mini ledger */}
                  <div className="border-t border-white/[0.06] px-5 py-3 space-y-2">
                    {[
                      { m: "NFC", v: "R$ 89,00", c: "text-cyan-400" },
                      { m: "PIX", v: "R$ 250,00", c: "text-blue-400" },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={10} className="text-emerald-400" />
                          <span className={`${r.c} font-medium`}>{r.m}</span>
                        </div>
                        <span className="text-gray-500 font-mono">{r.v}</span>
                        <span className="text-emerald-400 font-mono">Settled</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -left-6 top-16 hidden sm:flex items-center gap-2 bg-[#12141a] border border-white/[0.08] rounded-xl px-3 py-2 shadow-xl">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span className="text-[10px] text-gray-300 font-medium">Non-Custodial</span>
              </div>
              <div className="absolute -right-5 bottom-24 hidden sm:flex items-center gap-2 bg-[#12141a] border border-white/[0.08] rounded-xl px-3 py-2 shadow-xl">
                <Clock size={14} className="text-cyan-400" />
                <span className="text-[10px] text-gray-300 font-medium">{"< 10s"} settlement</span>
              </div>
            </div>
          </div>

          {/* Partner bar */}
          <div className="mt-16 pt-8 border-t border-white/[0.06]">
            <p className="text-center text-[10px] text-gray-600 uppercase tracking-[0.2em] mb-5">
              Built on infrastructure from
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-60">
              {[
                { name: "Solana", icon: <Zap size={16} /> },
                { name: "Circle", icon: <Globe size={16} /> },
                { name: "Stripe", icon: <CreditCard size={16} /> },
                { name: "Transak", icon: <Landmark size={16} /> },
                { name: "PIX · BCB", icon: <QrCode size={16} /> },
              ].map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-gray-400">
                  {p.icon}
                  <span className="text-sm font-semibold tracking-wide">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================ HOW IT WORKS ============================ */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 scroll-mt-20">
        <div className="text-center mb-14">
          <p className="text-xs text-emerald-400 uppercase tracking-wider font-medium mb-3">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            From tap to settlement in <span className="text-emerald-400">three steps</span>
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            No hardware to buy, no custody risk, no waiting days for your money. The entire flow is
            automated, auditable, and non-custodial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Smartphone size={22} />,
              step: "01",
              title: "Merchant enters amount",
              description:
                "Open the Valence POS on any smartphone. Type the charge in BRL — the live USDC conversion is shown instantly at the locked rate.",
              detail: "NFC · PIX QR · Solana Pay",
            },
            {
              icon: <Nfc size={22} />,
              step: "02",
              title: "Customer taps or pays via PIX",
              description:
                "The customer taps their phone/card or scans the dynamic QR. Regulated onramps (Transak / Stripe) authorize the fiat with automated KYC/AML checks.",
              detail: "Transak · Stripe Crypto Onramp",
            },
            {
              icon: <Zap size={22} />,
              step: "03",
              title: "USDC settles on Solana",
              description:
                "Fiat converts to USDC at the locked rate and lands in the merchant's non-custodial Circle wallet. Full audit entry written to the ledger.",
              detail: "< 10s · ~$0.00025 fee",
            },
          ].map((s) => (
            <div
              key={s.step}
              className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-7 hover:bg-white/[0.04] hover:border-emerald-500/20 transition-all"
            >
              <span className="absolute top-6 right-6 text-4xl font-bold text-white/[0.04] group-hover:text-emerald-500/10 transition-colors">
                {s.step}
              </span>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                {s.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{s.description}</p>
              <p className="text-[10px] text-emerald-400/70 font-mono mt-4 uppercase tracking-wider">{s.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================ FEATURE TABS ============================ */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
          <div className="px-6 sm:px-10 pt-8 sm:pt-10 pb-0">
            <p className="text-xs text-cyan-400 uppercase tracking-wider font-medium mb-2">Platform</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">One terminal, four pillars</h2>
          </div>

          {/* Tab bar */}
          <div className="px-6 sm:px-10 mt-6 flex gap-2 overflow-x-auto pb-1">
            {FEATURE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  activeTab === tab.id
                    ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                    : "bg-white/[0.03] text-gray-500 border-white/[0.06] hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-white">{activeFeature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed mt-3">{activeFeature.description}</p>
              <Link
                href="/terminal"
                className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-medium mt-5 transition-colors"
              >
                Try it in the terminal <ArrowRight size={14} />
              </Link>
            </div>
            <ul className="space-y-3">
              {activeFeature.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-gray-300">
                  <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============================ ARCHITECTURE FLOW ============================ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-8 sm:p-12">
          <div className="text-center mb-10">
            <p className="text-xs text-cyan-400 uppercase tracking-wider font-medium mb-3">Architecture</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">End-to-end, nothing in between</h2>
            <p className="text-sm text-gray-500 mt-3 max-w-xl mx-auto">
              Funds flow directly from regulated onramps into the merchant's non-custodial wallet.
              Valence orchestrates — it never touches the money.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center max-w-4xl mx-auto">
            {[
              { label: "Customer Tap", sub: "NFC / QR", color: "emerald" },
              { label: "POS Terminal", sub: "Valence App", color: "cyan" },
              { label: "Fiat Onramp", sub: "Transak · Stripe", color: "blue" },
              { label: "Circle Wallet", sub: "MPC Non-Custodial", color: "purple" },
              { label: "Settlement", sub: "Solana < 10s", color: "emerald" },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div
                  className={`flex-1 rounded-xl ${ARCH_COLORS[step.color]?.bg ?? "bg-gray-500/10"} ${ARCH_COLORS[step.color]?.border ?? "border-gray-500/20"} border p-4 text-center`}
                >
                  <p className="text-sm font-semibold text-white">{step.label}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{step.sub}</p>
                </div>
                {i < 4 && <span className="text-gray-600 hidden sm:block">→</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ COMPARISON TABLE ============================ */}
      <section id="comparison" className="max-w-4xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20">
        <div className="text-center mb-10">
          <p className="text-xs text-emerald-400 uppercase tracking-wider font-medium mb-3">Why switch</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Valence vs. traditional acquirers
          </h2>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-3 border-b border-white/[0.06]">
            <div className="px-5 py-4" />
            <div className="px-5 py-4 text-center bg-emerald-500/[0.06] border-x border-emerald-500/10">
              <div className="flex items-center justify-center gap-1.5">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold">V</span>
                </div>
                <span className="text-sm font-bold text-emerald-300">Valence</span>
              </div>
            </div>
            <div className="px-5 py-4 text-center">
              <span className="text-sm font-semibold text-gray-500">Traditional</span>
            </div>
          </div>
          {/* Rows */}
          {COMPARISON_ROWS.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01] transition-colors"
            >
              <div className="px-5 py-3.5 text-xs text-gray-400 font-medium flex items-center">
                {row.label}
              </div>
              <div className="px-5 py-3.5 text-center bg-emerald-500/[0.04] border-x border-emerald-500/[0.07] flex items-center justify-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-200 font-semibold">{row.valence}</span>
              </div>
              <div className="px-5 py-3.5 text-center flex items-center justify-center gap-2">
                <X size={13} className="text-gray-600 shrink-0" />
                <span className="text-xs text-gray-500">{row.traditional}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================ STATS BAND ============================ */}
      <section className="border-y border-white/[0.06] bg-gradient-to-r from-emerald-500/[0.05] via-cyan-500/[0.05] to-blue-500/[0.05]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {[
            { icon: <Clock size={18} />, value: "< 10s", label: "Settlement finality" },
            { icon: <TrendingUp size={18} />, value: "0.5%", label: "Target MDR" },
            { icon: <Zap size={18} />, value: "$0.00025", label: "Avg. network fee" },
            { icon: <Globe size={18} />, value: "24/7", label: "Always-on rails" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-emerald-400 mx-auto mb-3">
                {s.icon}
              </div>
              <p className="text-3xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================ SECURITY ============================ */}
      <section id="security" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
          {/* Left copy */}
          <div className="lg:col-span-2">
            <p className="text-xs text-emerald-400 uppercase tracking-wider font-medium mb-3">
              Security & Compliance
            </p>
            <h2 className="text-3xl font-bold tracking-tight">
              Non-custodial by architecture, not by promise
            </h2>
            <p className="text-gray-400 mt-4 leading-relaxed text-sm">
              Most payment platforms ask you to trust them. Valence removes the need for trust:
              funds flow through regulated onramps directly into wallets whose keys live inside
              Circle's MPC enclaves. Our application layer never touches key material or holds
              funds — platform-level custody risk is eliminated by design.
            </p>
            <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-300">Zero Custody Guarantee</p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Even in a worst-case compromise of Valence servers, no attacker could move
                    merchant funds — key shares never exist on our infrastructure.
                  </p>
                </div>
              </div>
            </div>
            <Link
              href="/whitepaper"
              className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-medium mt-6 transition-colors"
            >
              <FileText size={14} /> Read the full security model in the whitepaper
            </Link>
          </div>

          {/* Right: security cards */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: <Lock size={18} />,
                title: "MPC Key Management",
                desc: "Private keys sharded via Threshold Signature Scheme across Circle's secure enclaves. No party ever holds a complete key.",
                accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
              },
              {
                icon: <ShieldCheck size={18} />,
                title: "KYB + KYC/AML",
                desc: "Merchant KYB with CNPJ validation at onboarding. Customer-side screening runs automatically on every onramp transaction.",
                accent: "text-blue-400 bg-blue-500/10 border-blue-500/20",
              },
              {
                icon: <Building2 size={18} />,
                title: "Regulatory Alignment",
                desc: "Designed for BCB Resolution 331/2022, FATF Travel Rule via Circle, GDPR/LGPD data minimization, and PIX through licensed institutions.",
                accent: "text-purple-400 bg-purple-500/10 border-purple-500/20",
              },
              {
                icon: <Shield size={18} />,
                title: "Encrypted Audit Trail",
                desc: "Every transaction writes a structured ledger entry with timestamp, amounts, method, and TX hash — exportable for accounting and audits.",
                accent: "text-amber-400 bg-amber-500/10 border-amber-500/20",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.03] transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-3 ${card.accent}`}>
                  {card.icon}
                </div>
                <h4 className="text-sm font-semibold text-white mb-1.5">{card.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ FAQ ============================ */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20">
        <div className="text-center mb-10">
          <p className="text-xs text-cyan-400 uppercase tracking-wider font-medium mb-3">FAQ</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Frequently asked questions</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <FaqRow key={faq.question} item={faq} />
          ))}
        </div>
      </section>

      {/* ============================ FINAL CTA ============================ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="relative rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 border border-emerald-500/20 p-8 sm:p-14 text-center overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/[0.1] rounded-full blur-[100px]" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Ready to accept the future of payments?
            </h2>
            <p className="text-gray-400 mb-10 max-w-xl mx-auto">
              Launch the POS terminal and process your first NFC tap-to-pay transaction in under a
              minute — or read the technical whitepaper for the full architecture.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/terminal"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all shadow-lg shadow-emerald-500/20"
              >
                <Smartphone size={20} /> Launch POS & Terminal
              </Link>
              <Link
                href="/whitepaper"
                className="inline-flex items-center gap-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-all"
              >
                <FileText size={20} /> Read Whitepaper
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ FOOTER ============================ */}
      <footer className="border-t border-white/[0.06] pt-14 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                  <span className="text-white text-[11px] font-bold">V</span>
                </div>
                <span className="text-base font-bold">
                  <span className="text-emerald-400">Valence</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Institutional-grade NFC tap-to-pay gateway bridging PIX and card payments with
                instant stablecoin settlement on Solana.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-[10px] rounded-full bg-emerald-500/15 text-emerald-400 px-2 py-0.5 border border-emerald-500/20">
                  DEVNET LIVE
                </span>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><Link href="/terminal" className="hover:text-white transition-colors">POS Terminal</Link></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#comparison" className="hover:text-white transition-colors">Why Valence</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><Link href="/whitepaper" className="hover:text-white transition-colors">Whitepaper</Link></li>
                <li>
                  <a
                    href="https://explorer.solana.com/?cluster=devnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Solana Explorer
                  </a>
                </li>
                <li>
                  <a
                    href="https://developers.circle.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Circle Docs
                  </a>
                </li>
                <li>
                  <a
                    href="https://transak.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Transak
                  </a>
                </li>
              </ul>
            </div>

            {/* Infrastructure */}
            <div>
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-4">Infrastructure</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li className="flex items-center gap-2"><Zap size={12} className="text-gray-600" /> Solana</li>
                <li className="flex items-center gap-2"><Globe size={12} className="text-gray-600" /> Circle W3S</li>
                <li className="flex items-center gap-2"><CreditCard size={12} className="text-gray-600" /> Stripe Onramp</li>
                <li className="flex items-center gap-2"><Landmark size={12} className="text-gray-600" /> Transak PIX</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-gray-600">
              © 2026 Rendey Ltda. · Valence — Built for Brazil
            </p>
            <p className="text-[10px] text-gray-700 font-mono">
              valence.rendey.store
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
