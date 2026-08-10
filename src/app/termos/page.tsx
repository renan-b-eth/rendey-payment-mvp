import Link from "next/link";
import LandingFooter from "@/components/LandingFooter";

// =============================================================================
// Termos de Uso — Rendey LLC
//
// Professional terms of use for the Valence crypto-fiat payment platform.
// =============================================================================

export const metadata = {
  title: "Termos de Uso — Valence | Rendey LLC",
  description:
    "Termos e condições de uso da plataforma Valence de pagamentos cripto-fiat.",
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white font-sans">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#0a0b0d]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">R</span>
            </div>
            <span className="text-sm font-bold tracking-tight">
              <span className="text-emerald-400">Valence</span>
            </span>
          </Link>
          <Link
            href="/terminal"
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            ← Voltar ao Terminal
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-xs text-gray-500 mb-8">
          Última atualização: 10 de agosto de 2026 · Rendey LLC
        </p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar ou utilizar a plataforma Valence ("Plataforma"), operada pela Rendey LLC
              ("Empresa", "nós", "nosso"), você ("Usuário", "você")
              concorda em cumprir e estar vinculado a estes Termos de Uso ("Termos"). Se você não
              concordar com qualquer parte destes Termos, não utilize a Plataforma.
            </p>
            <p>
              A Rendey LLC é uma empresa constituída e operante nos Estados Unidos da América, com operações
              voltadas para o mercado brasileiro de pagamentos digitais e ativos virtuais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Descrição do Serviço</h2>
            <p>
              A Plataforma Valence fornece uma infraestrutura de ponta a ponta para pagamentos que conectam
              moedas fiduciárias (incluindo, mas não se limitando a, BRL via PIX e cartões de
              crédito/débito) a ativos digitais na blockchain Solana. Os serviços incluem:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Geração e gerenciamento de carteiras digitais não-custodiais via Circle Programmable Wallets;</li>
              <li>Onramp fiduciário-cripto via parceiros como Transak (PIX) e Stripe Crypto Onramp;</li>
              <li>Iniciação de transações via tecnologia NFC (Near Field Communication);</li>
              <li>Liquidação instantânea de transações na rede Solana (Devnet no momento do MVP);</li>
              <li>Interface de terminal para envio e recebimento de SOL e USDC.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Elegibilidade</h2>
            <p>
              Para utilizar a Plataforma, você deve: (a) ter pelo menos 18 anos de idade; (b) possuir
              capacidade legal para celebrar contratos vinculantes; (c) não estar localizado em jurisdição
              na qual o uso de serviços de ativos virtuais seja proibido; e (d) fornecer informações
              verdadeiras e completas durante o cadastro, quando aplicável.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Carteiras Não-Custodiais</h2>
            <p>
              A Plataforma utiliza Circle Programmable Wallets para gerenciar ativos digitais. Essas
              carteiras são <strong className="text-white">não-custodiais</strong>, o que significa que a
              Rendey LLC <strong className="text-white">nunca detém, controla ou tem acesso às suas chaves
              privadas</strong>. Você é o único responsável pela segurança das suas chaves privadas e
              credenciais de acesso à sua carteira.
            </p>
            <p>
              A perda de chaves privadas resultará em perda irrecuperável dos ativos digitais associados.
              A Rendey LLC não se responsabiliza por perdas decorrentes da negligência do Usuário na
              proteção de suas credenciais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Transações e Liquidação</h2>
            <p>
              Todas as transações na blockchain Solana são imutáveis e irreversíveis após a confirmação
              na rede. A Plataforma opera na Solana Devnet para fins de demonstração (MVP). Em produção,
              transações em redes principais seguem os mesmos princípios de finalidade.
            </p>
            <p>
              A Rendey LLC não tem controle sobre o tempo de confirmação das transações na rede Solana
              e não se responsabiliza por atrasos causados por congestionamento da rede ou outros fatores
              externos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Taxas e Custos</h2>
            <p>
              O uso da Plataforma pode estar sujeito a taxas de rede (gas fees) da Solana, taxas de
              conversão de moeda, e comissões dos parceiros de onramp (Transak, Stripe). Todas as taxas
              serão informadas de forma transparente antes da confirmação de qualquer transação. A Rendey LLC
              se reserva o direito de alterar suas taxas mediante aviso prévio de 30 dias.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Uso Proibido</h2>
            <p>Você concorda em NÃO utilizar a Plataforma para:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Atividades ilegais, fraudulentas ou que violem regulamentações aplicáveis;</li>
              <li>Lavagem de dinheiro ou financiamento de atividades ilícitas;</li>
              <li>Evasão de sanções econômicas ou embargos;</li>
              <li>Envio de fundos para jurisdictions sob sanção;</li>
              <li>Qualquer uso que viole as leis e regulamentações aplicáveis em sua jurisdição.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Isenção de Responsabilidade</h2>
            <p>
              A Plataforma é fornecida "COMO ESTÁ" e "CONFORME DISPONÍVEL", sem
              garantias de qualquer espécie, expressas ou implícitas. A Rendey LLC não garante que a
              Plataforma será ininterrupta, segura ou livre de erros. Em nenhuma circunstância a Rendey LLC
              será responsável por danos diretos, indiretos, incidentais, especiais ou consequenciais
              decorrentes do uso da Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Modificações</h2>
            <p>
              A Rendey LLC reserva-se o direito de modificar estes Termos a qualquer momento. As
              alterações entrarão em vigor imediatamente após a publicação na Plataforma. O uso continuado
              da Plataforma após as alterações constitui aceitação dos novos Termos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Lei Aplicável e Foro</h2>
            <p>
              Estes Termos são regidos pelas leis dos Estados Unidos da América e, quando aplicável, pela
              legislação brasileira. Quaisquer disputas decorrentes destes Termos serão resolvidas nos
              tribunais competentes do Estado da Flórida, EUA, sem prejuízo dos direitos do consumidor
              brasileiro conforme o Código de Defesa do Consumidor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Contato</h2>
            <p>
              Em caso de dúvidas sobre estes Termos, entre em contato com a Rendey LLC através do e-mail
              suporte@rendey.store.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter variant="subpage" />
    </div>
  );
}
