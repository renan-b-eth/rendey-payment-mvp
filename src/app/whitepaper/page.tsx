import Link from "next/link";

// =============================================================================
// Valence Whitepaper — Enterprise-Grade Technical Document
//
// Published at: valence.rendey.store/whitepaper
//
// Sections:
//   1. Executive Summary & Core Objective
//   2. Architecture & Technical Components
//   3. End-to-End Process Flows
//   4. Security, Compliance & Non-Custodial Guarantee
// =============================================================================

// ---- Tailwind Color Maps (avoids JIT-unsafe dynamic interpolation) ----------
const COLOR_BG_10: Record<string, string> = {
  emerald: "bg-emerald-500/10",
  blue: "bg-blue-500/10",
  purple: "bg-purple-500/10",
  cyan: "bg-cyan-500/10",
  amber: "bg-amber-500/10",
  red: "bg-red-500/10",
  gray: "bg-gray-500/10",
};

const COLOR_BORDER_20: Record<string, string> = {
  emerald: "border-emerald-500/20",
  blue: "border-blue-500/20",
  purple: "border-purple-500/20",
  cyan: "border-cyan-500/20",
  amber: "border-amber-500/20",
  red: "border-red-500/20",
  gray: "border-gray-500/20",
};

const COLOR_BG_04: Record<string, string> = {
  red: "bg-red-500/[0.04]",
  amber: "bg-amber-500/[0.04]",
  blue: "bg-blue-500/[0.04]",
};

const COLOR_TEXT_400: Record<string, string> = {
  emerald: "text-emerald-400",
  blue: "text-blue-400",
  purple: "text-purple-400",
  cyan: "text-cyan-400",
  amber: "text-amber-400",
  red: "text-red-400",
  gray: "text-gray-400",
};

const COLOR_BG_15: Record<string, string> = {
  emerald: "bg-emerald-500/15",
  blue: "bg-blue-500/15",
  purple: "bg-purple-500/15",
  cyan: "bg-cyan-500/15",
  amber: "bg-amber-500/15",
  gray: "bg-gray-500/15",
};

const COLOR_BORDER_25: Record<string, string> = {
  emerald: "border-emerald-500/25",
  blue: "border-blue-500/25",
  purple: "border-purple-500/25",
  cyan: "border-cyan-500/25",
  amber: "border-amber-500/25",
  gray: "border-gray-500/25",
};

const COLOR_BG_20_LINE: Record<string, string> = {
  emerald: "bg-emerald-500/20",
  blue: "bg-blue-500/20",
  purple: "bg-purple-500/20",
  cyan: "bg-cyan-500/20",
  amber: "bg-amber-500/20",
  gray: "bg-gray-500/20",
};

// ---- Reusable Section Wrapper -----------------------------------------------
function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xs font-mono text-emerald-400/60 bg-emerald-500/10 px-2 py-0.5 rounded">
          {number}
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          {title}
        </h2>
      </div>
      <div className="space-y-4 text-gray-300 leading-relaxed">{children}</div>
    </section>
  );
}

// ---- Flow Diagram Component -------------------------------------------------
function FlowDiagram({ steps }: { steps: { label: string; sub: string; color: string }[] }) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-0 my-8">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center flex-1">
          <div className={`flex-1 rounded-xl ${COLOR_BG_10[step.color] ?? "bg-gray-500/10"} ${COLOR_BORDER_20[step.color] ?? "border-gray-500/20"} p-4 text-center`}>
            <p className="text-sm font-semibold text-white">{step.label}</p>
            <p className="text-[10px] text-gray-500 mt-1">{step.sub}</p>
          </div>
          {i < steps.length - 1 && (
            <div className="hidden sm:flex items-center justify-center px-1">
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-gray-600" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---- Step Card Component ----------------------------------------------------
function StepCard({
  number,
  title,
  description,
  details,
}: {
  number: string;
  title: string;
  description: string;
  details: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
          <span className="text-emerald-400 font-bold text-sm">{number}</span>
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <p className="text-sm text-gray-400 mb-4">{description}</p>
      <ul className="space-y-2">
        {details.map((d, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
            <span className="text-emerald-400 mt-1 shrink-0">→</span>
            <span>{d}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---- Stat Card --------------------------------------------------------------
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
      <p className="text-2xl font-bold text-emerald-400">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

// =============================================================================
// Whitepaper Page
// =============================================================================
export default function WhitepaperPage() {
  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white font-sans">
      {/* ---- Navigation ---- */}
      <nav className="border-b border-white/[0.06] bg-[#0a0b0d]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">V</span>
            </div>
            <span className="text-sm font-bold">
              <span className="text-emerald-400">Valence</span>
              <span className="text-gray-600 text-xs font-normal ml-1.5">Whitepaper</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-gray-500 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/terminal" className="text-xs text-gray-500 hover:text-white transition-colors">
              Terminal
            </Link>
            <span className="text-[10px] text-gray-700 font-mono">v1.0</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-20">
        {/* ================================================================ */}
        {/* TITLE BLOCK                                                      */}
        {/* ================================================================ */}
        <header className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Technical Whitepaper · v1.0</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Valence:
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400">
              NFC Tap-to-Pay
            </span>
            <br />
            Crypto-Fiat Gateway
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            A technical whitepaper detailing the architecture, settlement protocol,
            and security model for NFC-based crypto-fiat payments on the Solana blockchain.
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
            <span>Published: August 2026</span>
            <span>·</span>
            <span>Rendey Ltda.</span>
            <span>·</span>
            <span>valence.rendey.store</span>
          </div>
        </header>

        {/* ================================================================ */}
        {/* TABLE OF CONTENTS                                                */}
        {/* ================================================================ */}
        <nav className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Contents</h3>
          <ul className="space-y-2">
            {[
              { num: "1", title: "Executive Summary & Core Objective", id: "executive-summary" },
              { num: "2", title: "Architecture & Technical Components", id: "architecture" },
              { num: "3", title: "End-to-End Process Flows", id: "process-flows" },
              { num: "4", title: "Security, Compliance & Non-Custodial Guarantee", id: "security" },
            ].map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="flex items-center gap-3 text-sm text-gray-400 hover:text-emerald-400 transition-colors group">
                  <span className="text-xs font-mono text-emerald-400/50 w-6">{item.num}.</span>
                  <span className="group-hover:underline">{item.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* ================================================================ */}
        {/* 1. EXECUTIVE SUMMARY                                              */}
        {/* ================================================================ */}
        <Section id="executive-summary" number="01" title="Executive Summary & Core Objective">
          <p className="text-base">
            <strong className="text-white">Valence</strong> is an institutional-grade mobile NFC payment gateway
            built by <strong className="text-white">Rendey</strong> that bridges traditional fiat payment channels —
            including PIX (Brazil's instant payment system), credit/debit cards, and SEPA transfers — with
            instantaneous, low-cost stablecoin settlement on the{" "}
            <strong className="text-white">Solana blockchain</strong>.
          </p>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6 my-6">
            <h3 className="text-sm font-semibold text-emerald-400 mb-2">Mission Statement</h3>
            <p className="text-sm text-gray-300 italic">
              &ldquo;Eliminate friction in cross-border and local merchant payments by unifying contactless NFC
              payments with instant stablecoin settlement — powered by non-custodial programmable wallets.&rdquo;
            </p>
          </div>

          <h3 className="text-lg font-semibold text-white mt-8 mb-3">Why We Are Building Valence</h3>
          <p>
            Traditional payment gateways suffer from three critical inefficiencies that cost merchants
            billions annually:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
            {[
              {
                title: "Settlement Delays",
                desc: "Conventional processors (Stripe, PagSeguro) settle in T+2 to T+7 business days, creating cash flow pressure for SMBs.",
                color: "red",
              },
              {
                title: "Excessive Fees",
                desc: "Merchant discount rates (MDR) of 2–5% per transaction, plus hidden FX conversion charges for cross-border payments.",
                color: "amber",
              },
              {
                title: "Fragmented UX",
                desc: "Users navigate separate apps for banking, crypto wallets, and payment terminals — with no unified interface.",
                color: "blue",
              },
            ].map((item) => (
              <div key={item.title} className={`rounded-xl border ${COLOR_BORDER_20[item.color] ?? "border-gray-500/20"} ${COLOR_BG_04[item.color] ?? "bg-gray-500/[0.04]"} p-5`}>
                <h4 className={`text-sm font-semibold ${COLOR_TEXT_400[item.color] ?? "text-gray-400"} mb-2`}>{item.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <p>
            <strong className="text-white">Valence solves this</strong> by providing a single, elegant interface where
            merchants accept contactless NFC payments (or dynamic QR codes), and customers' fiat is
            instantly converted to USDC on Solana — settling in under 10 seconds with near-zero network
            fees (~$0.01). The merchant receives stablecoins in a{" "}
            <strong className="text-white">non-custodial wallet</strong> managed via Circle's Programmable
            Wallets API, ensuring zero platform custody risk.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            <StatCard value="< 10s" label="Settlement Time" />
            <StatCard value="$0.01" label="Avg. Network Fee" />
            <StatCard value="0.5%" label="Target MDR" />
            <StatCard value="24/7" label="Operational Hours" />
          </div>
        </Section>

        {/* ================================================================ */}
        {/* 2. ARCHITECTURE & TECHNICAL COMPONENTS                            */}
        {/* ================================================================ */}
        <Section id="architecture" number="02" title="Architecture & Technical Components">
          <p>
            Valence is built on a modular, event-driven architecture that separates concerns across
            four distinct layers: <strong className="text-white">Presentation</strong> (POS Terminal UI),{" "}
            <strong className="text-white">Gateway</strong> (Fiat Onramps),{" "}
            <strong className="text-white">Wallet</strong> (Circle Programmable Wallets), and{" "}
            <strong className="text-white">Settlement</strong> (Solana Blockchain).
          </p>

          <h3 className="text-lg font-semibold text-white mt-8 mb-3">System Topology</h3>
          <FlowDiagram
            steps={[
              { label: "Merchant Terminal", sub: "NFC Tap / QR Code", color: "emerald" },
              { label: "Gateway Layer", sub: "Transak (PIX) · Stripe", color: "blue" },
              { label: "Circle Wallet API", sub: "Programmable Wallets", color: "purple" },
              { label: "Solana Settlement", sub: "USDC · < 10s finality", color: "cyan" },
            ]}
          />

          <h3 className="text-lg font-semibold text-white mt-8 mb-3">Component Breakdown</h3>

          <div className="space-y-4">
            {[
              {
                title: "Presentation Layer — POS Terminal",
                tech: "Next.js 16 · React · Tailwind CSS · lucide-react",
                desc: "Mobile-first NFC Tap-to-Pay interface. Renders the charge amount input, NFC listener with pulse animations, payment state machine (idle → listening → processing → success), and real-time settlement ledger. Communicates with backend API routes via fetch().",
              },
              {
                title: "Gateway Layer — Fiat Onramps",
                tech: "Transak SDK v4 · Stripe Crypto Onramp",
                desc: "Handles fiat-to-crypto conversion. Transak processes BRL via PIX with instant settlement; Stripe processes card/bank payments via its Crypto Onramp session API. Both gateways are abstracted behind a unified interface — the POS Terminal triggers either path based on user selection.",
              },
              {
                title: "Wallet Layer — Circle Programmable Wallets",
                tech: "Circle W3S API · Web3 Developer Portal",
                desc: "Non-custodial Solana wallets are generated via Circle's /v1/w3s/developer/wallets endpoint. Each merchant receives a unique wallet tied to a Circle user token. Private keys are managed by Circle's MPC (Multi-Party Computation) infrastructure — Valence never has access to raw key material.",
              },
              {
                title: "Settlement Layer — Solana Blockchain",
                tech: "@solana/web3.js · Solana Devnet / Mainnet",
                desc: "USDC transfers execute as native SPL token instructions on Solana. Block finality in ~400ms, full settlement in < 10 seconds. Network fees are sub-cent ($0.00025 per transaction). Balance verification uses Connection.getBalance() against configurable RPC endpoints (Devnet for staging, Mainnet for production).",
              },
            ].map((comp) => (
              <div key={comp.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h4 className="text-sm font-semibold text-white mb-1">{comp.title}</h4>
                <p className="text-[10px] text-emerald-400/70 font-mono mb-2">{comp.tech}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{comp.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold text-white mt-8 mb-3">Environment Configuration</h3>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 font-mono text-xs text-gray-400 space-y-1 overflow-x-auto">
            <p><span className="text-gray-500"># Circle Web3 Developer API</span></p>
            <p><span className="text-emerald-400">CIRCLE_API_KEY</span>=your_circle_api_key</p>
            <p className="mt-2"><span className="text-gray-500"># Stripe (Crypto Onramp)</span></p>
            <p><span className="text-emerald-400">STRIPE_SECRET_KEY</span>=sk_live_...</p>
            <p><span className="text-emerald-400">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</span>=pk_live_...</p>
            <p className="mt-2"><span className="text-gray-500"># Solana RPC</span></p>
            <p><span className="text-emerald-400">NEXT_PUBLIC_SOLANA_RPC_URL</span>=https://api.devnet.solana.com</p>
          </div>
        </Section>

        {/* ================================================================ */}
        {/* 3. END-TO-END PROCESS FLOWS                                       */}
        {/* ================================================================ */}
        <Section id="process-flows" number="03" title="End-to-End Process Flows">
          <p>
            Every payment processed through Valence follows a four-step flow from initiation to
            final settlement. Each step is auditable, idempotent, and designed for graceful degradation
            in case of network or gateway failures.
          </p>

          <div className="space-y-6 mt-8">
            <StepCard
              number="01"
              title="Contactless Initiation"
              description="The customer initiates a payment by tapping their smartphone (NFC) or scanning a dynamic QR code presented by the merchant's POS terminal."
              details={[
                "Merchant enters the charge amount in BRL (or any supported fiat currency) on the Valence POS Terminal.",
                "Terminal generates a dynamic Solana Pay QR code encoding the merchant's wallet address, amount, and network (Devnet/Mainnet).",
                "Customer taps their NFC-enabled phone (Apple Pay, Google Pay, or Solana-compatible wallet) or scans the QR code.",
                "NFC listener uses the Web NFC API (or simulated polling for demo) to detect the card/phone tap event.",
                "Terminal transitions from 'Ready to Tap' → 'Listening' → 'Payment Detected' state.",
              ]}
            />

            <StepCard
              number="02"
              title="Fiat Processing & Risk Screening"
              description="The detected payment is routed through the appropriate regulated onramp (Transak for PIX, Stripe for cards) with automated compliance checks."
              details={[
                "Payment payload is serialized and forwarded to the selected gateway: Transak (BRL/PIX) or Stripe (USD/cards).",
                "The gateway performs automated KYC/AML screening on the customer's identity in the background.",
                "Risk scoring is applied: transactions below R$ 50,000/day pass automatically; larger amounts trigger manual review.",
                "Fiat authorization is confirmed — the gateway locks the BRL amount and initiates the conversion pipeline.",
                "Valence receives a webhook/confirmation with the authorized amount and conversion rate.",
              ]}
            />

            <StepCard
              number="03"
              title="Programmatic Stablecoin Conversion"
              description="Authorized fiat is converted to USDC via the gateway's internal liquidity pools, with the output routed to the merchant's Circle Programmable Wallet."
              details={[
                "The gateway converts BRL → USDC at the locked exchange rate (e.g., 1 USD = R$ 5.72).",
                "Network fee for Solana settlement is deducted (~$0.01 — orders of magnitude lower than traditional rails).",
                "Circle's W3S API receives a 'credit wallet' instruction targeting the merchant's non-custodial Solana wallet.",
                "The USDC mint instruction is queued in Circle's secure enclave for on-chain execution.",
                "Conversion receipt is logged with: timestamp, exchange rate, fee breakdown, and Circle transaction ID.",
              ]}
            />

            <StepCard
              number="04"
              title="Non-Custodial On-Chain Settlement"
              description="USDC is transferred to the merchant's wallet on Solana with sub-second finality. Full cryptographic audit trail is generated."
              details={[
                "Circle's MPC infrastructure signs and broadcasts the USDC transfer transaction to Solana.",
                "Transaction confirms in ~400ms (single block finality on Solana).",
                "The merchant's POS Terminal receives a settlement confirmation with the on-chain transaction hash.",
                "Balance is refreshed via Connection.getBalance() — the merchant sees updated USDC/SOL balances in real-time.",
                "A structured audit entry is appended to the Transaction Ledger with: TX ID, timestamp, BRL amount, USDC amount, method, and Solana confirmation status.",
              ]}
            />
          </div>

          <h3 className="text-lg font-semibold text-white mt-10 mb-3">Complete Flow Diagram</h3>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 overflow-x-auto">
            <div className="min-w-[600px] space-y-4">
              {[
                { step: "1", label: "NFC Tap / QR Scan", detail: "Customer initiates payment", color: "emerald" },
                { step: "2", label: "Fiat Authorization", detail: "Transak (PIX) or Stripe (Card) processes BRL", color: "blue" },
                { step: "3", label: "Compliance Screen", detail: "Automated KYC/AML risk scoring", color: "amber" },
                { step: "4", label: "USDC Conversion", detail: "BRL → USDC at locked rate via gateway", color: "purple" },
                { step: "5", label: "Circle Wallet Credit", detail: "USDC routed to non-custodial wallet", color: "cyan" },
                { step: "6", label: "Solana Settlement", detail: "On-chain transfer confirmed in < 10s", color: "emerald" },
                { step: "7", label: "Audit Log Entry", detail: "Structured ledger record with TX hash", color: "gray" },
              ].map((item, i) => (
                <div key={item.step} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg ${COLOR_BG_15[item.color] ?? "bg-gray-500/15"} ${COLOR_BORDER_25[item.color] ?? "border-gray-500/25"} flex items-center justify-center shrink-0`}>
                    <span className={`${COLOR_TEXT_400[item.color] ?? "text-gray-400"} text-xs font-bold`}>{item.step}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <div className={`h-px flex-1 ${COLOR_BG_20_LINE[item.color] ?? "bg-gray-500/20"}`} />
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="text-[10px] text-gray-500">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ================================================================ */}
        {/* 4. SECURITY, COMPLIANCE & NON-CUSTODIAL GUARANTEE                 */}
        {/* ================================================================ */}
        <Section id="security" number="04" title="Security, Compliance & Non-Custodial Guarantee">
          <p>
            Security and regulatory compliance are foundational to Valence's architecture. The platform
            is designed to meet institutional-grade standards while maintaining the self-custodial
            principles of decentralized finance.
          </p>

          <h3 className="text-lg font-semibold text-white mt-8 mb-3">Zero Platform Custody</h3>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6 my-4">
            <p className="text-sm text-gray-300 leading-relaxed">
              <strong className="text-emerald-400">Core Principle:</strong> At no point does Valence hold, control,
              or have access to merchant or customer funds. All wallets are{" "}
              <strong className="text-white">non-custodial</strong> — private keys are managed by Circle's
              Multi-Party Computation (MPC) infrastructure. Valence's application code never sees raw key
              material, making platform-level fund theft architecturally impossible.
            </p>
          </div>

          <h3 className="text-lg font-semibold text-white mt-8 mb-3">Security Framework</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            {[
              {
                title: "MPC Key Management",
                desc: "Private keys are sharded across Circle's secure enclaves using Threshold Signature Scheme (TSS). No single party ever holds the complete key.",
                icon: "🔐",
              },
              {
                title: "Encrypted Audit Trail",
                desc: "Every transaction generates a cryptographically signed audit entry with immutable timestamps, on-chain TX hashes, and structured metadata.",
                icon: "📋",
              },
              {
                title: "KYB/AML Compliance",
                desc: "Merchant onboarding includes full KYB (Know Your Business) verification. Transak and Stripe handle customer-side KYC/AML screening automatically.",
                icon: "✅",
              },
              {
                title: "Network Isolation",
                desc: "Staging environment uses Solana Devnet with sandbox API keys. Production routes are isolated with environment-specific configuration.",
                icon: "🛡️",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{item.icon}</span>
                  <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold text-white mt-8 mb-3">Regulatory Alignment</h3>
          <p>
            Valence is designed to operate within existing regulatory frameworks for digital asset
            service providers (VASPs) in Brazil and internationally:
          </p>
          <ul className="space-y-2 my-4">
            {[
              "Central Bank of Brazil (BCB) — Compliant with Resolution No. 331/2022 on virtual asset service providers.",
              "PIX Integration — Operates through licensed payment institutions (Transak holds CBUPI authorization).",
              "Stripe Crypto Onramp — Leverages Stripe's existing Money Transmitter Licenses (MTLs) in applicable jurisdictions.",
              "GDPR/LGPD — User data is processed minimally; wallet addresses are pseudonymous on-chain identifiers.",
              "Travel Rule — Circle's Programmable Wallets API supports FATF Travel Rule compliance for transfers above threshold amounts.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                <span className="text-emerald-400 mt-1 shrink-0">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <h3 className="text-lg font-semibold text-white mt-8 mb-3">Technical Security Measures</h3>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 font-mono text-xs text-gray-400 space-y-2 overflow-x-auto">
            <p><span className="text-gray-500">// Environment Security</span></p>
            <p>• API keys stored server-side only (no NEXT_PUBLIC_ prefix for secrets)</p>
            <p>• .env.local excluded from version control via .gitignore</p>
            <p>• Environment variables injected at build time, never exposed to client bundle</p>
            <p className="mt-2"><span className="text-gray-500">// Input Validation</span></p>
            <p>• Base58 regex guard: /^[1-9A-HJ-NP-Za-km-z]&#123;32,44&#125;$/ before PublicKey instantiation</p>
            <p>• Server-side request body validation on all API routes</p>
            <p>• Idempotency keys on wallet generation to prevent duplicate creation</p>
            <p className="mt-2"><span className="text-gray-500">// Runtime Safety</span></p>
            <p>• Graceful fallback to mock data when external APIs are unreachable</p>
            <p>• Error boundaries on all async operations (fetch, Connection, sign)</p>
            <p>• Zero runtime crashes from malformed wallet addresses</p>
          </div>
        </Section>

        {/* ---- Closing ---- */}
        <div className="text-center py-12 border-t border-white/[0.06]">
          <p className="text-sm text-gray-500 mb-2">
            This whitepaper is published by <strong className="text-gray-400">Rendey Ltda.</strong> for
            informational purposes.
          </p>
          <p className="text-xs text-gray-600">
            © 2026 Valence by Rendey · Solana · Circle · Stripe
          </p>
        </div>
      </main>

      {/* ---- Footer ---- */}
      <footer className="border-t border-white/[0.06] py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-gray-600 hover:text-white transition-colors">Home</Link>
            <Link href="/terminal" className="text-xs text-gray-600 hover:text-white transition-colors">Terminal</Link>
          </div>
          <p className="text-[10px] text-gray-700">
            © 2026 Valence by Rendey · Built for Brazil
          </p>
        </div>
      </footer>
    </div>
  );
}
