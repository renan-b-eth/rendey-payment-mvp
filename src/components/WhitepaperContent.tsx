"use client";

import { useState } from "react";
import { Globe } from "lucide-react";

// =============================================================================
// WhitepaperContent — Bilingual (EN/pt-BR) Technical Document
//
// Defaults to English. Toggle button switches between EN and pt-BR.
// =============================================================================

type Lang = "en" | "pt";

export default function WhitepaperContent() {
  const [lang, setLang] = useState<Lang>("en");

  const toggleLang = () => setLang((prev) => (prev === "en" ? "pt" : "en"));

  return (
    <>
      {/* Language Toggle */}
      <div className="flex items-center justify-between mb-8">
        <div />
        <button
          onClick={toggleLang}
          className="flex items-center gap-2 text-xs bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2 text-gray-300 hover:bg-white/[0.08] hover:text-white transition-all"
        >
          <Globe size={14} />
          {lang === "en" ? "Português (pt-BR)" : "English (EN)"}
        </button>
      </div>

      {lang === "en" ? <EnglishContent /> : <PortugueseContent />}
    </>
  );
}

// =============================================================================
// English Content
// =============================================================================
function EnglishContent() {
  return (
    <div className="space-y-12 text-gray-300 text-sm leading-relaxed">
      {/* Section 1 */}
      <section id="resumo">
        <h2 className="text-2xl font-bold text-white mb-4">1. Executive Summary</h2>
        <p>
          Valence is a payment platform that bridges the traditional Brazilian financial system
          — PIX and credit/debit cards — to instant settlement on the Solana blockchain.
          The system enables consumers and merchants to initiate transactions via{" "}
          <strong className="text-white">NFC (Near Field Communication)</strong>, convert fiat to
          regulated digital assets via onramps, and settle funds in less than 1 second on Solana
          using <strong className="text-white">Circle non-custodial wallets</strong>.
        </p>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 mt-6">
          <p className="text-emerald-400 font-semibold text-xs mb-2">Target Metrics (Mainnet)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold text-white">{"<1s"}</p>
              <p className="text-[10px] text-gray-500">Settlement Time</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{"$0.00025"}</p>
              <p className="text-[10px] text-gray-500">Cost per Tx (Solana)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">~400ms</p>
              <p className="text-[10px] text-gray-500">Finality</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">65k+</p>
              <p className="text-[10px] text-gray-500">TPS Capacity</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 */}
      <section id="problema">
        <h2 className="text-2xl font-bold text-white mb-4">2. The Problem</h2>
        <p>
          The current financial system for international and cross-platform payments has critical
          inefficiencies:
        </p>
        <div className="space-y-3 mt-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <h3 className="text-sm font-semibold text-white mb-1">⏱️ Slow Settlement</h3>
            <p className="text-xs text-gray-400">
              International transfers take 1-5 business days to settle. PIX is instant in Brazil,
              but conversion to digital assets remains a bottleneck.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <h3 className="text-sm font-semibold text-white mb-1">💸 High Fees</h3>
            <p className="text-xs text-gray-400">
              Brokers and intermediaries charge 1-3% spreads on fiat-to-crypto conversions, plus
              fixed fees that make small-value transactions expensive.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <h3 className="text-sm font-semibold text-white mb-1">📱 Fragmented UX</h3>
            <p className="text-xs text-gray-400">
              The current flow requires multiple apps: bank → exchange → wallet → payment. Each
              step introduces friction and drop-off risk.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section id="solucao">
        <h2 className="text-2xl font-bold text-white mb-4">3. Our Solution</h2>
        <p>
          Valence unifies the entire flow into a cohesive experience: the user taps their phone
          (NFC), selects the amount in BRL, and the system automatically processes the fiat→crypto
          conversion and Solana settlement — all in seconds.
        </p>
        <p className="mt-3">The solution pillars are:</p>
        <ol className="list-decimal list-inside space-y-2 mt-3 ml-2">
          <li><strong className="text-white">NFC Initiation</strong> — No QR codes, no app opening required;</li>
          <li><strong className="text-white">Integrated Onramps</strong> — Transak (PIX) and Stripe (Card) for instant conversion;</li>
          <li><strong className="text-white">Non-Custodial Custody</strong> — Circle Programmable Wallets with user-controlled keys;</li>
          <li><strong className="text-white">Solana Settlement</strong> — Finality in ~400ms with minimal cost.</li>
        </ol>
      </section>

      {/* Section 4 */}
      <section id="arquitetura">
        <h2 className="text-2xl font-bold text-white mb-4">4. System Architecture</h2>
        <p>
          The architecture follows an event-driven microservices model with decoupled components
          communicating via REST APIs and webhooks.
        </p>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mt-6 font-mono text-[11px] text-gray-400 leading-loose overflow-x-auto">
          <pre className="whitespace-pre">{`
┌─────────────────────────────────────────────────────────────────┐
│                        VALENCE PLATFORM                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐                                               │
│  │  Mobile/Web  │◀── NFC Tap / QR / Manual Entry               │
│  │  Interface   │                                               │
│  └──────┬───────┘                                               │
│         │  HTTPS/WSS                                            │
│         ▼                                                       │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │  API Gateway │────▶│  Tx Engine   │────▶│  Ledger      │    │
│  │  (Next.js)   │     │  (Routing)   │     │  (Events)    │    │
│  └──────┬───────┘     └──────┬───────┘     └──────────────┘    │
│         │                     │                                  │
│    ┌────┴────┐          ┌─────┴─────┐                           │
│    ▼         ▼          ▼           ▼                            │
│ ┌──────┐ ┌──────┐ ┌──────────┐ ┌──────────┐                   │
│ │Transak│ │Stripe│ │  Circle  │ │  Solana  │                   │
│ │(PIX) │ │(Card)│ │  Wallet  │ │  Chain   │                   │
│ └──────┘ └──────┘ └──────────┘ └──────────┘                   │
└─────────────────────────────────────────────────────────────────┘
          `}</pre>
        </div>
      </section>

      {/* Section 5 */}
      <section id="nfc">
        <h2 className="text-2xl font-bold text-white mb-4">5. NFC Initiation (Contactless)</h2>
        <p>
          The NFC flow allows users to initiate a transaction by bringing their device close to a
          reader terminal, without needing to open specific apps.
        </p>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mt-6">
          <h3 className="text-sm font-semibold text-white mb-3">NFC Initiation Flow</h3>
          <div className="space-y-3 text-xs text-gray-400">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold shrink-0">1</span>
              <p>NFC reader emits polling signal via Web NFC API (or physical reader)</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold shrink-0">2</span>
              <p>User device responds with payload containing wallet address + chain ID</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold shrink-0">3</span>
              <p>Terminal creates a transaction session with the captured address</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold shrink-0">4</span>
              <p>User selects BRL amount and confirms on device</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold shrink-0">5</span>
              <p>Valence API automatically initiates the onramp flow (Transak/Stripe)</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold shrink-0">6</span>
              <p>After fiat→USDC conversion, funds are transferred to the Solana wallet</p>
            </div>
          </div>
        </div>
        <p className="mt-4">
          In the current MVP, the NFC module is simulated on the frontend to demonstrate the UX.
          The full implementation will use the browser's{" "}
          <strong className="text-white">Web NFC API</strong> for NDEF tag reading, or integration
          with physical NFC terminals via the ISO 14443 protocol.
        </p>
      </section>

      {/* Section 6 */}
      <section id="onramps">
        <h2 className="text-2xl font-bold text-white mb-4">6. Fiat Onramps: Transak & Stripe</h2>
        <p>
          Valence integrates two regulated onramp providers to offer multiple fiat capital entry
          options:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 text-xs font-bold">T</span>
              </div>
              <span className="text-sm font-semibold text-blue-300">Transak</span>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li>• Method: PIX (instant)</li>
              <li>• Currency: BRL → USDC/SOL</li>
              <li>• Fee: ~1.5-2.5% included in spread</li>
              <li>• KYC: Simplified verification up to R$ 5,000</li>
              <li>• Time: ~30s for payment detection</li>
            </ul>
          </div>
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.05] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <span className="text-purple-400 text-xs font-bold">S</span>
              </div>
              <span className="text-sm font-semibold text-purple-300">Stripe Crypto</span>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li>• Method: Credit/Debit card</li>
              <li>• Currency: BRL/USD → USDC</li>
              <li>• Fee: ~2-3% (processing + conversion)</li>
              <li>• KYC: Only above regulatory thresholds</li>
              <li>• Time: ~10-60s depending on processor</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 7 */}
      <section id="circle">
        <h2 className="text-2xl font-bold text-white mb-4">7. Circle Programmable Wallets</h2>
        <p>
          Digital asset custody is managed via{" "}
          <strong className="text-white">Circle Programmable Wallets</strong>, a solution enabling
          non-custodial wallets with full user control over private keys.
        </p>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mt-6">
          <h3 className="text-sm font-semibold text-white mb-3">Custody Characteristics</h3>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <p><strong className="text-white">Non-Custodial:</strong> Rendey LLC never holds user private keys</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <p><strong className="text-white">Multi-Chain:</strong> Native support for Solana, Ethereum, and other networks</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <p><strong className="text-white">Token Support:</strong> SOL, USDC, USDT and SPL tokens on Solana</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <p><strong className="text-white">Recovery:</strong> MPC-based recovery mechanisms to protect against key loss</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <p><strong className="text-white">Compliance:</strong> Blockchain screening list integration</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-6">
          <p className="text-amber-400 font-semibold text-xs mb-1">Security Note</p>
          <p className="text-gray-300 text-xs">
            Non-custodial wallet security fundamentally depends on the user protecting their private
            keys. Valence implements MPC (Multi-Party Computation) to distribute key fragments,
            eliminating the single point of failure typical of non-custodial wallets.
          </p>
        </div>
      </section>

      {/* Section 8 */}
      <section id="solana">
        <h2 className="text-2xl font-bold text-white mb-4">8. Solana for Instant Settlement</h2>
        <p>
          The Solana blockchain was chosen as the settlement layer for its technical characteristics
          that make it ideal for high-frequency, low-cost payments.
        </p>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mt-6">
          <h3 className="text-sm font-semibold text-white mb-3">Why Solana?</h3>
          <div className="space-y-3 text-xs text-gray-400">
            <div>
              <p className="font-semibold text-white mb-1">🚀 Throughput</p>
              <p>Capacity to process 65,000+ transactions per second, supporting demand spikes during Black Friday and similar events.</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">⚡ Finality</p>
              <p>Finality in ~400ms — the merchant gets near-instant confirmation of the transaction.</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">💲 Cost</p>
              <p>Average cost of $0.00025 per transaction, enabling micro-payments and small-value transactions that would be unviable on other chains.</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">🔗 DeFi Ecosystem</p>
              <p>Mature DeFi ecosystem with DEXs (Raydium, Jupiter), lending protocols, and stablecoin infrastructure (native USDC on Solana).</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 9 */}
      <section id="seguranca">
        <h2 className="text-2xl font-bold text-white mb-4">9. Security & Compliance</h2>
        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Anti-Money Laundering (AML)</h3>
            <p className="text-xs text-gray-400">
              Integration with blockchain screening providers to verify addresses against sanctions
              lists (OFAC, UN) and suspicious transaction databases. Values above regulatory thresholds
              trigger enhanced KYC flows via our partners (Transak/Stripe).
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Data Protection</h3>
            <p className="text-xs text-gray-400">
              Personal data is minimized and processed in accordance with Brazil's LGPD and
              international data protection standards. The non-custodial model ensures that sensitive
              financial data (private keys) never flows through or is stored on our servers.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Audit & Transparency</h3>
            <p className="text-xs text-gray-400">
              All transactions on Solana are public and auditable. The platform maintains internal
              audit logs for all API operations, including wallet generation, onramp calls, and
              outbound transactions.
            </p>
          </div>
        </div>
      </section>

      {/* Section 10 */}
      <section id="roadmap">
        <h2 className="text-2xl font-bold text-white mb-4">10. Roadmap</h2>
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 font-medium">Completed</span>
              <span className="text-xs text-gray-500">Q3 2026</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">MVP — Valence v0.1</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Circle wallet generation on Solana Devnet</li>
              <li>• Onramp via Transak (PIX mock) and Stripe (simulated)</li>
              <li>• SOL/USDC send/receive terminal</li>
              <li>• QR Code for receiving payments</li>
              <li>• Complete dark mode web interface</li>
            </ul>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] rounded-full bg-blue-500/20 text-blue-400 px-2 py-0.5 font-medium">In Progress</span>
              <span className="text-xs text-gray-500">Q4 2026</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">v0.2 — NFC + Localization</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Functional NFC Tap-to-Pay module</li>
              <li>• Complete pt-BR localization</li>
              <li>• Whitepaper and legal documentation</li>
              <li>• Web NFC API integration</li>
            </ul>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] rounded-full bg-gray-500/20 text-gray-400 px-2 py-0.5 font-medium">Planned</span>
              <span className="text-xs text-gray-500">Q1 2027</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">v1.0 — Mainnet Launch</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Migration to Solana Mainnet</li>
              <li>• Production onramps (Transak + Stripe live)</li>
              <li>• Automated KYC/AML</li>
              <li>• React Native mobile app</li>
              <li>• Third-party integration API</li>
            </ul>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] rounded-full bg-gray-500/20 text-gray-400 px-2 py-0.5 font-medium">Vision</span>
              <span className="text-xs text-gray-500">2027+</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">v2.0 — Expansion</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Multi-chain support (EVM, Base, Polygon)</li>
              <li>• Token-based loyalty program</li>
              <li>• Merchant dashboard and analytics</li>
              <li>• Popular DeFi wallet integration (Phantom, Solflare)</li>
              <li>• LATAM expansion (Argentina, Mexico, Colombia)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent p-8 text-center">
        <h2 className="text-lg font-bold text-white mb-2">Contact</h2>
        <p className="text-xs text-gray-400 mb-4">
          For technical inquiries or partnerships, reach out to the engineering team.
        </p>
        <p className="text-sm text-emerald-400 font-medium">engenharia@rendey.store</p>
      </section>
    </div>
  );
}

// =============================================================================
// Portuguese Content
// =============================================================================
function PortugueseContent() {
  return (
    <div className="space-y-12 text-gray-300 text-sm leading-relaxed">
      {/* Section 1 */}
      <section id="resumo">
        <h2 className="text-2xl font-bold text-white mb-4">1. Resumo Executivo</h2>
        <p>
          Valence é uma plataforma de pagamento que conecta o sistema financeiro tradicional
          brasileiro — PIX e cartões de crédito/débito — à liquidação instantânea na blockchain
          Solana. O sistema permite que consumidores e comerciantes iniciem transações via{" "}
          <strong className="text-white">NFC (Near Field Communication)</strong>, convertam fiat em
          ativos digitais via onramps regulados, e settle fundos em menos de 1 segundo na Solana
          utilizando <strong className="text-white">carteiras não-custodiais Circle</strong>.
        </p>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 mt-6">
          <p className="text-emerald-400 font-semibold text-xs mb-2">Métricas-Alvo (Mainnet)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold text-white">{"<1s"}</p>
              <p className="text-[10px] text-gray-500">Tempo de Settlement</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{"$0.00025"}</p>
              <p className="text-[10px] text-gray-500">Custo por Tx (Solana)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">~400ms</p>
              <p className="text-[10px] text-gray-500">Finalidade</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">65k+</p>
              <p className="text-[10px] text-gray-500">TPS Capacidade</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 */}
      <section id="problema">
        <h2 className="text-2xl font-bold text-white mb-4">2. O Problema</h2>
        <p>
          O sistema financeiro atual para pagamentos internacionais e entre plataformas apresenta
          ineficiências críticas:
        </p>
        <div className="space-y-3 mt-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <h3 className="text-sm font-semibold text-white mb-1">⏱️ Liquidação Lenta</h3>
            <p className="text-xs text-gray-400">
              Transferências internacionais levam de 1 a 5 dias úteis para liquidar. PIX é
              instantâneo no Brasil, mas a conversão para moeda digital ainda é um gargalo.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <h3 className="text-sm font-semibold text-white mb-1">💸 Taxas Elevadas</h3>
            <p className="text-xs text-gray-400">
              Corretoras e intermediários cobram spreads de 1-3% em conversões fiat-cripto, além
              de taxas fixas que encarecem transações de pequeno valor.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <h3 className="text-sm font-semibold text-white mb-1">📱 UX Fragmentada</h3>
            <p className="text-xs text-gray-400">
              O fluxo atual exige múltiplos apps: bancário → corretora → carteira → pagamento.
              Cada etapa introduz fricção e risco de abandono.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section id="solucao">
        <h2 className="text-2xl font-bold text-white mb-4">3. Nossa Solução</h2>
        <p>
          Valence unifica todo o fluxo em uma experiência coesa: o usuário aproxima o celular
          (NFC), seleciona o valor em BRL, e o sistema processa automaticamente a conversão
          fiat→cripto e o settlement na Solana — tudo em segundos.
        </p>
        <p className="mt-3">Os pilares da solução são:</p>
        <ol className="list-decimal list-inside space-y-2 mt-3 ml-2">
          <li><strong className="text-white">Iniciação por NFC</strong> — Sem QR codes, sem abertura de apps;</li>
          <li><strong className="text-white">Onramps Integrados</strong> — Transak (PIX) e Stripe (Cartão) para conversão instantânea;</li>
          <li><strong className="text-white">Custódia Não-Custodial</strong> — Circle Programmable Wallets com chaves do usuário;</li>
          <li><strong className="text-white">Settlement na Solana</strong> — Finalidade em ~400ms com custo mínimo.</li>
        </ol>
      </section>

      {/* Section 4 */}
      <section id="arquitetura">
        <h2 className="text-2xl font-bold text-white mb-4">4. Arquitetura do Sistema</h2>
        <p>
          A arquitetura segue um modelo de microserviços event-driven, com componentes
          desacoplados que se comunicam via APIs REST e webhooks.
        </p>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mt-6 font-mono text-[11px] text-gray-400 leading-loose overflow-x-auto">
          <pre className="whitespace-pre">{`
┌─────────────────────────────────────────────────────────────────┐
│                        VALENCE PLATFORM                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐                                               │
│  │  Mobile/Web  │◀── NFC Tap / QR / Manual Entry               │
│  │  Interface   │                                               │
│  └──────┬───────┘                                               │
│         │  HTTPS/WSS                                            │
│         ▼                                                       │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │  API Gateway │────▶│  Tx Engine   │────▶│  Ledger      │    │
│  │  (Next.js)   │     │  (Routing)   │     │  (Events)    │    │
│  └──────┬───────┘     └──────┬───────┘     └──────────────┘    │
│         │                     │                                  │
│    ┌────┴────┐          ┌─────┴─────┐                           │
│    ▼         ▼          ▼           ▼                            │
│ ┌──────┐ ┌──────┐ ┌──────────┐ ┌──────────┐                   │
│ │Transak│ │Stripe│ │  Circle  │ │  Solana  │                   │
│ │(PIX) │ │(Card)│ │  Wallet  │ │  Chain   │                   │
│ └──────┘ └──────┘ └──────────┘ └──────────┘                   │
└─────────────────────────────────────────────────────────────────┘
          `}</pre>
        </div>
      </section>

      {/* Section 5 */}
      <section id="nfc">
        <h2 className="text-2xl font-bold text-white mb-4">5. Iniciação por NFC (Contactless)</h2>
        <p>
          O fluxo NFC permite que o usuário inicie uma transação aproximando seu dispositivo de
          um terminal leitor, sem a necessidade de abrir aplicativos específicos.
        </p>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mt-6">
          <h3 className="text-sm font-semibold text-white mb-3">Fluxo de Iniciação NFC</h3>
          <div className="space-y-3 text-xs text-gray-400">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold shrink-0">1</span>
              <p>Leitor NFC emite sinal de polling via Web NFC API (ou leitor físico)</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold shrink-0">2</span>
              <p>Dispositivo do usuário responde com payload contendo endereço da carteira + chain ID</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold shrink-0">3</span>
              <p>Terminal cria uma sessão de transação com o endereço capturado</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold shrink-0">4</span>
              <p>Usuário seleciona valor em BRL e confirma no dispositivo</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold shrink-0">5</span>
              <p>API Valence inicia o fluxo de onramp (Transak/Stripe) automaticamente</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold shrink-0">6</span>
              <p>Após conversão fiat→USDC, fundos são transferidos para a carteira na Solana</p>
            </div>
          </div>
        </div>
        <p className="mt-4">
          No MVP atual, o módulo NFC é simulado no frontend para demonstrar a UX. A
          implementação completa utilizará a{" "}
          <strong className="text-white">Web NFC API</strong> do navegador para leitura de tags NDEF,
          ou integração com terminais NFC físicos via protocolo ISO 14443.
        </p>
      </section>

      {/* Section 6 */}
      <section id="onramps">
        <h2 className="text-2xl font-bold text-white mb-4">6. Onramps Fiat: Transak e Stripe</h2>
        <p>
          Valence integra dois provedores de onramp regulados para oferecer múltiplas opções de
          entrada de capital fiduciário:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 text-xs font-bold">T</span>
              </div>
              <span className="text-sm font-semibold text-blue-300">Transak</span>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li>• Método: PIX (instantâneo)</li>
              <li>• Moeda: BRL → USDC/SOL</li>
              <li>• Taxa: ~1.5-2.5% incluída no spread</li>
              <li>• KYC: Verificação simplificada para valores até R$ 5.000</li>
              <li>• Tempo: ~30s para detecção do pagamento</li>
            </ul>
          </div>
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.05] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <span className="text-purple-400 text-xs font-bold">S</span>
              </div>
              <span className="text-sm font-semibold text-purple-300">Stripe Crypto</span>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li>• Método: Cartão de crédito/débito</li>
              <li>• Moeda: BRL/USD → USDC</li>
              <li>• Taxa: ~2-3% (processamento + conversão)</li>
              <li>• KYC: Apenas para valores acima de limiares regulatórios</li>
              <li>• Tempo: ~10-60s dependendo do procesador</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 7 */}
      <section id="circle">
        <h2 className="text-2xl font-bold text-white mb-4">7. Circle Programmable Wallets</h2>
        <p>
          A custódia de ativos digitais é gerenciada via{" "}
          <strong className="text-white">Circle Programmable Wallets</strong>, uma solução que
          permite carteiras não-custodiais com controle total do usuário sobre suas chaves
          privadas.
        </p>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mt-6">
          <h3 className="text-sm font-semibold text-white mb-3">Características da Custódia</h3>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <p><strong className="text-white">Non-Custodial:</strong> A Rendey LLC nunca detém chaves privadas do usuário</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <p><strong className="text-white">Multi-Chain:</strong> Suporte nativo a Solana, Ethereum, e outras redes</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <p><strong className="text-white">Token Support:</strong> SOL, USDC, USDT e tokens SPL na Solana</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <p><strong className="text-white">Recovery:</strong> Mecanismos de recuperação via MPC para proteção contra perda de chaves</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <p><strong className="text-white">Compliance:</strong> Integração com listas de verificação blockchain para screening</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-6">
          <p className="text-amber-400 font-semibold text-xs mb-1">Nota de Segurança</p>
          <p className="text-gray-300 text-xs">
            A segurança das carteiras não-custodiais depende fundamentalmente da proteção das
            chaves privadas pelo usuário. Valence implementa MPC (Multi-Party Computation) para
            distribuir fragments de chave, eliminando o ponto único de falha tradicional de
            carteiras non-custodial.
          </p>
        </div>
      </section>

      {/* Section 8 */}
      <section id="solana">
        <h2 className="text-2xl font-bold text-white mb-4">8. Solana para Liquidação Instantânea</h2>
        <p>
          A blockchain Solana foi escolhida como camada de settlement por suas características
          técnicas que a tornam ideal para pagamentos de alta frequência e baixo custo.
        </p>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mt-6">
          <h3 className="text-sm font-semibold text-white mb-3">Por que Solana?</h3>
          <div className="space-y-3 text-xs text-gray-400">
            <div>
              <p className="font-semibold text-white mb-1">🚀 Throughput</p>
              <p>Capacidade de processar até 65.000+ transações por segundo, suportando picos de demanda em Black Friday e eventos similares.</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">⚡ Finalidade</p>
              <p>Finalidade de ~400ms — o comerciante tem confirmação praticamente instantânea da transação.</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">💲 Custo</p>
              <p>Custo médio de $0.00025 por transação, viabilizando micro-pagamentos e transações de pequeno valor que seriam inviáveis em outras chains.</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">🔗 DeFi Ecosystem</p>
              <p>Ecosistema DeFi maduro com DEXs (Raydium, Jupiter), protocolos de empréstimo, e infraestrutura de stablecoins (USDC nativo na Solana).</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 9 */}
      <section id="seguranca">
        <h2 className="text-2xl font-bold text-white mb-4">9. Segurança e Compliance</h2>
        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Prevenção à Lavagem de Dinheiro (AML)</h3>
            <p className="text-xs text-gray-400">
              Integração com provedores de screening blockchain para verificar endereços contra
              listas de sanções (OFAC, UN) e bases de dados de transações suspeitas. Valores acima
              de limiares regulatórios acionam fluxo de KYC reforçado via nossos parceiros (Transak/Stripe).
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-white mb-2">LGPD e Proteção de Dados</h3>
            <p className="text-xs text-gray-400">
              Dados pessoais são minimizados e processados conforme a LGPD brasileira. O modelo
              não-custodial garante que dados financeiros sensíveis (chaves privadas) nunca
              trafegam ou são armazenados nos nossos servidores.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Auditoria e Transparência</h3>
            <p className="text-xs text-gray-400">
              Todas as transações na Solana são públicas e auditáveis. A Plataforma mantém logs
              de auditoria internos para todas as operações de API, incluindo geração de carteiras,
              chamadas de onramp e transações de saída.
            </p>
          </div>
        </div>
      </section>

      {/* Section 10 */}
      <section id="roadmap">
        <h2 className="text-2xl font-bold text-white mb-4">10. Roadmap</h2>
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 font-medium">Concluído</span>
              <span className="text-xs text-gray-500">Q3 2026</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">MVP — Valence v0.1</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Geração de carteiras Circle na Solana Devnet</li>
              <li>• Onramp via Transak (PIX mock) e Stripe (simulado)</li>
              <li>• Terminal de envio/recebimento SOL/USDC</li>
              <li>• QR Code para recebimento</li>
              <li>• Interface web dark mode completa</li>
            </ul>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] rounded-full bg-blue-500/20 text-blue-400 px-2 py-0.5 font-medium">Em Progresso</span>
              <span className="text-xs text-gray-500">Q4 2026</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">v0.2 — NFC + Localização</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Módulo NFC Tap-to-Pay funcional</li>
              <li>• Localização pt-BR completa</li>
              <li>• Whitepaper e documentação legal</li>
              <li>• Integração Web NFC API</li>
            </ul>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] rounded-full bg-gray-500/20 text-gray-400 px-2 py-0.5 font-medium">Planejado</span>
              <span className="text-xs text-gray-500">Q1 2027</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">v1.0 — Mainnet Launch</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Migração para Solana Mainnet</li>
              <li>• Onramps em produção (Transak + Stripe live)</li>
              <li>• KYC/AML automatizado</li>
              <li>• App mobile React Native</li>
              <li>• API para integração de terceiros</li>
            </ul>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] rounded-full bg-gray-500/20 text-gray-400 px-2 py-0.5 font-medium">Visão</span>
              <span className="text-xs text-gray-500">2027+</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">v2.0 — Expansão</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Suporte a múltiplas chains (EVM, Base, Polygon)</li>
              <li>• Programa de fidelidade com tokens</li>
              <li>• Merchant dashboard e analytics</li>
              <li>• Integração com carteiras DeFi populares (Phantom, Solflare)</li>
              <li>• Expansão LATAM (Argentina, México, Colômbia)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent p-8 text-center">
        <h2 className="text-lg font-bold text-white mb-2">Contato</h2>
        <p className="text-xs text-gray-400 mb-4">
          Para mais informações técnicas ou parcerias, entre em contato com a equipe de engenharia.
        </p>
        <p className="text-sm text-emerald-400 font-medium">engenharia@rendey.store</p>
      </section>
    </div>
  );
}
