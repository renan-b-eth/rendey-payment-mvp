import Link from "next/link";
import LandingFooter from "@/components/LandingFooter";

// =============================================================================
// Landing Page — Valence (Rendey)
//
// Portuguese (pt-BR) landing page explaining the product and directing users
// to the Terminal (Dashboard), Whitepaper, and legal pages.
// =============================================================================

export const metadata = {
  title: "Valence — Pagamento Cripto-Fiat Instantâneo | Rendey",
  description:
    "Valence conecta PIX e cartões brasileiros a liquidação instantânea na Solana via NFC e carteiras digitais. O futuro dos pagamentos é agora.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white font-sans">
      {/* ================================================================ */}
      {/* HEADER                                                          */}
      {/* ================================================================ */}
      <header className="border-b border-white/[0.06] bg-[#0a0b0d]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">R</span>
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-emerald-400">Valence</span>
              <span className="text-gray-500 text-xs ml-2 font-normal">by Rendey</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/terminal"
              className="text-xs bg-emerald-500/15 text-emerald-400 px-4 py-2 rounded-xl font-medium border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors"
            >
              Acessar Terminal
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ================================================================ */}
        {/* HERO SECTION                                                    */}
        {/* ================================================================ */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-emerald-400 font-medium">
              Solana Devnet · MVP ao Vivo
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
            <span className="text-white">Pagamento Fiat</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Liquidação Web3
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Valence é a ponte entre o sistema financeiro tradicional brasileiro
            (PIX, cartões) e a liquidação instantânea na blockchain Solana — via{" "}
            <strong className="text-gray-200">NFC</strong> e{" "}
            <strong className="text-gray-200">carteiras digitais não-custodiais</strong>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/terminal"
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span>Acessar Terminal</span>
              <span>→</span>
            </Link>
            <Link
              href="/whitepaper"
              className="border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] text-gray-300 font-semibold px-8 py-3.5 rounded-xl transition-all text-sm"
            >
              Ler Whitepaper
            </Link>
          </div>
        </section>

        {/* ================================================================ */}
        {/* HOW IT WORKS                                                    */}
        {/* ================================================================ */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-12">
            Como Funciona
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-4">
                <span className="text-emerald-400 text-lg font-bold">1</span>
              </div>
              <h3 className="text-sm font-semibold mb-2">Inicie via NFC</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Aproxime seu celular ou cartão NFC de um terminal compatível.
                A transação é iniciada instantaneamente via contato, sem QR codes ou
                apps intermediários.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center mb-4">
                <span className="text-blue-400 text-lg font-bold">2</span>
              </div>
              <h3 className="text-sm font-semibold mb-2">Deposite em Fiat</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Use PIX ou cartão de crédito/débito via integrções Transak e Stripe
                Crypto Onramp. O valor em BRL é convertido para USDC/SOL
                automaticamente.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center mb-4">
                <span className="text-cyan-400 text-lg font-bold">3</span>
              </div>
              <h3 className="text-sm font-semibold mb-2">Liquidar na Solana</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Fundos são creditados na sua carteira Circle Programmable
                Wallet (não-custodial) e settle na Solana em menos de 1 segundo.
                Sem intermediários, sem taxas ocultas.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* ARCHITECTURE OVERVIEW                                           */}
        {/* ================================================================ */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-4">
            Arquitetura Técnica
          </h2>
          <p className="text-sm text-gray-400 text-center max-w-xl mx-auto mb-12">
            Uma visão geral da infraestrutura que conecta o mundo financeiro tradicional à Web3.
          </p>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 font-mono text-xs text-gray-400 leading-loose overflow-x-auto">
            <pre className="whitespace-pre">{`
  ┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
  │   USUÁRIO    │────▶│   TERMINAL NFC   │────▶│   VALENCE API   │
  │  (Celular)   │     │  (Aproximação)   │     │   (Backend)     │
  └──────────────┘     └──────────────────┘     └────────┬────────┘
                                                         │
                            ┌────────────────────────────┼────────────────┐
                            │                            │                │
                   ┌────────▼────────┐     ┌─────────────▼──┐   ┌────────▼────────┐
                   │    TRANSAK      │     │    STRIPE      │   │    CIRCLE       │
                   │  (PIX → USDC)   │     │ (Card → USDC)  │   │   WALLET API    │
                   └─────────────────┘     └────────────────┘   └────────┬────────┘
                                                                         │
                                                              ┌──────────▼──────────┐
                                                              │   SOLANA DEVNET     │
                                                              │  (Instant Settle)   │
                                                              └─────────────────────┘
            `}</pre>
          </div>
        </section>

        {/* ================================================================ */}
        {/* FEATURES GRID                                                   */}
        {/* ================================================================ */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-12">
            Recursos Principais
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="text-emerald-400 text-lg mb-3">⚡</div>
              <h3 className="text-sm font-semibold mb-2">Liquid Instantâneo</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Transações na Solana são confirmadas em ~400ms. Sem espera, sem
                clearings de T+1 ou T+2. O dinheiro chega na hora.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="text-blue-400 text-lg mb-3">📱</div>
              <h3 className="text-sm font-semibold mb-2">NFC Tap-to-Pay</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Pagamentos por aproximação usando a antena NFC do celular.
                Sem necessidade de abrir apps ou escanear QR codes.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="text-cyan-400 text-lg mb-3">🔒</div>
              <h3 className="text-sm font-semibold mb-2">Não-Custodial</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Suas chaves privadas ficam sob seu controle via Circle
                Programmable Wallets. A Rendey nunca tem acesso aos seus fundos.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="text-purple-400 text-lg mb-3">🇧🇷</div>
              <h3 className="text-sm font-semibold mb-2">Feito para o Brasil</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Integração nativa com PIX, suporte a BRL, taxas transparentes
                e compliance com a legislação brasileira e LGPD.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* CTA SECTION                                                     */}
        {/* ================================================================ */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent p-12">
            <h2 className="text-2xl font-bold mb-4">
              Pronto para experimentar?
            </h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto mb-8">
              Crie sua carteira, deposite via PIX e receba USDC na Solana em segundos.
            </p>
            <Link
              href="/terminal"
              className="inline-flex bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-all text-sm items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span>Acessar Terminal</span>
              <span>→</span>
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
