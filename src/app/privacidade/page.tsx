import Link from "next/link";
import LandingFooter from "@/components/LandingFooter";

// =============================================================================
// Política de Privacidade — Rendey LLC
//
// Privacy policy for the Valence crypto-fiat payment platform, including
// LGPD compliance and non-custodial wallet disclosures.
// =============================================================================

export const metadata = {
  title: "Política de Privacidade — Valence | Rendey LLC",
  description:
    "Política de privacidade da plataforma Valence. Dados, LGPD e carteiras não-custodiais.",
};

export default function PrivacidadePage() {
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
        <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-xs text-gray-500 mb-8">
          Última atualização: 10 de agosto de 2026 · Rendey LLC
        </p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Introdução</h2>
            <p>
              A Rendey LLC ("Rendey", "nós", "nosso") valoriza a privacidade
              dos seus usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos
              e protegemos informações quando você utiliza a plataforma Valence de pagamentos cripto-fiat
              ("Plataforma").
            </p>
            <p>
              Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº
              13.709/2018) e com as melhores práticas de proteção de dados aplicáveis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Dados Coletados</h2>
            <p>Podemos coletar os seguintes tipos de informações:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong className="text-white">Dados de cadastro:</strong> endereço de e-mail fornecido pelo usuário;</li>
              <li><strong className="text-white">Dados de transação:</strong> endereços de carteiras digitais, valores, timestamps e hashes de transações na blockchain;</li>
              <li><strong className="text-white">Dados de uso:</strong> informações sobre como você interage com a Plataforma (páginas visitadas, funcionalidades utilizadas);</li>
              <li><strong className="text-white">Dados técnicos:</strong> endereço IP, tipo de navegador, dispositivo e sistema operacional;</li>
              <li><strong className="text-white">Dados de pagamento:</strong> informações processadas por nossos parceiros (Transak, Stripe) — a Rendey LLC <strong className="text-white">não armazena</strong> dados de cartão de crédito ou chaves PIX diretamente.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Carteiras Não-Custodiais e Chaves Privadas</h2>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-4">
              <p className="text-emerald-400 font-semibold text-xs mb-1">
                Compromisso com Não-Custódia
              </p>
              <p className="text-gray-300">
                A Rendey LLC opera um modelo <strong className="text-white">não-custodial</strong>. Isso
                significa que:
              </p>
            </div>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>A Rendey LLC <strong className="text-white">nunca armazena, acessa ou controla</strong> suas chaves privadas de carteira digital;</li>
              <li>As chaves privadas são gerenciadas exclusivamente pelo usuário através de Circle Programmable Wallets;</li>
              <li>A Plataforma armazena apenas o <strong className="text-white">endereço público</strong> da sua carteira (necessário para receber e enviar transações);</li>
              <li>Mesmo em caso de invasão ou falha de segurança nos nossos servidores, seus ativos digitais permanecem protegidos pela sua chave privada.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Finalidade do Tratamento</h2>
            <p>Utilizamos suas informações para:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Operar e manter a Plataforma;</li>
              <li>Processar transações de pagamento e conversões de moeda;</li>
              <li>Cumprir obrigações legais e regulatórias, incluindo prevenção à lavagem de dinheiro (AML);</li>
              <li>Melhorar a experiência do usuário e desenvolver novas funcionalidades;</li>
              <li>Comunicar atualizações, alertas de segurança e informações relevantes sobre a Plataforma;</li>
              <li>Prevenir fraudes e atividades ilícitas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Base Legal para o Tratamento (LGPD)</h2>
            <p>O tratamento de dados é fundamentado nas seguintes bases legais:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong className="text-white">Consentimento:</strong> quando você fornece dados de forma voluntária;</li>
              <li><strong className="text-white">Execução de contrato:</strong> para cumprir os Termos de Uso e processar transações;</li>
              <li><strong className="text-white">Obrigação legal:</strong> para cumprir regulamentações AML/KYC aplicáveis;</li>
              <li><strong className="text-white">Legítimo interesse:</strong> para prevenir fraudes e melhorar nossos serviços.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Compartilhamento de Dados</h2>
            <p>Podemos compartilhar informações com:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong className="text-white">Parceiros de pagamento:</strong> Transak e Stripe, exclusivamente para processar transações;</li>
              <li><strong className="text-white">Circle:</strong> para gerenciamento de carteiras programmable wallets;</li>
              <li><strong className="text-white">Autoridades competentes:</strong> quando exigido por lei ou ordem judicial;</li>
              <li><strong className="text-white">Prestadores de serviço:</strong> provedores de infraestrutura cloud e analytics.</li>
            </ul>
            <p>
              Todos os prestadores de serviço são contratualmente obrigados a proteger seus dados e
              utilizá-los exclusivamente para as finalidades especificadas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Dados Públicos na Blockchain</h2>
            <p>
              Transações na blockchain Solana são <strong className="text-white">públicas e imutáveis</strong>.
              Endereços de carteira, valores e timestamps de transações são visíveis na rede. A Rendey LLC
              não controla a visibilidade desses dados e não pode deletá-los. Ao utilizar a Plataforma,
              você está ciente de que suas transações na blockchain são públicas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger suas informações, incluindo
              criptografia em trânsito (TLS/HTTPS), controle de acesso restrito e monitoramento contínuo.
              No entanto, nenhum sistema é 100% seguro, e não podemos garantir segurança absoluta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Retenção de Dados</h2>
            <p>
              Retemos seus dados pessoais pelo tempo necessário para cumprir as finalidades descritas
              nesta política, salvo quando um período de retenção mais longo é exigido por lei. Dados
              de transações na blockchain são retidos permanentemente devido à natureza imutável da
              tecnologia.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Seus Direitos (LGPD)</h2>
            <p>Conforme a LGPD, você tem direito a:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Confirmar a existência de tratamento de dados;</li>
              <li>Acessar seus dados pessoais;</li>
              <li>Corrigir dados incompletos ou desatualizados;</li>
              <li>Solicitar a anonimização, bloqueio ou exclusão de dados desnecessários;</li>
              <li>Solicitar a portabilidade dos dados;</li>
              <li>Eliminar os dados tratados com consentimento;</li>
              <li>Revogar o consentimento a qualquer momento.</li>
            </ul>
            <p>
              Para exercer seus direitos, entre em contato conosco pelo e-mail suporte@rendey.store.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Cookies</h2>
            <p>
              A Plataforma pode utilizar cookies e tecnologias similares para melhorar a experiência do
              usuário, analisar uso e personalizar conteúdo. Você pode configurar seu navegador para
              recusar cookies, mas isso pode afetar a funcionalidade da Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">12. Menores de Idade</h2>
            <p>
              A Plataforma não é destinada a menores de 18 anos. Não coletamos intencionalmente dados
              de menores de idade. Se descobrirmos que coletamos dados de um menor, tomaremos medidas
              imediatas para excluir essas informações.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">13. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. As alterações serão publicadas
              nesta página com a data de atualização revisada. Recomendamos que você revise esta política
              regularmente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">14. Contato</h2>
            <p>
              Para dúvidas sobre esta Política de Privacidade ou para exercer seus direitos, entre em
              contato com o Encarregado de Proteção de Dados (DPO) da Rendey LLC pelo e-mail:
              privacidade@rendey.store.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter variant="subpage" />
    </div>
  );
}
