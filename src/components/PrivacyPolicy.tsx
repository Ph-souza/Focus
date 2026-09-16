import React, { useEffect } from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PrivacyPolicy() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 font-sans selection:bg-emerald-500/30 selection:text-emerald-900 dark:selection:text-emerald-100">
      {/* Header Corporativo */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Voltar ao Início</span>
          </Link>
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold tracking-tight">
            <Shield size={18} className="text-emerald-500" />
            <span>Nexus Focus</span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <article className="prose prose-zinc dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight max-w-none">
          <div className="mb-12">
            <h1 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-zinc-100 mb-4 tracking-tighter">
              Política de Privacidade – Nexus Focus
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">
              Última atualização: Setembro de 2026
            </p>
          </div>

          <section className="space-y-6">
            <p>
              A Nexus IT valoriza a privacidade dos usuários do Nexus Focus. Esta Política de Privacidade explica como coletamos, usamos, compartilhamos e protegemos suas informações pessoais ao utilizar nossa plataforma, site e serviços integrados, incluindo o Mentor IA e a integração via WhatsApp.
            </p>

            <h2 className="text-2xl text-zinc-900 dark:text-zinc-100">1. Informações que Coletamos</h2>
            <p>Para entregar a melhor experiência de gestão e produtividade, coletamos os seguintes dados:</p>
            <ul className="list-disc pl-5 space-y-2 marker:text-emerald-500">
              <li><strong>Dados de Conta e Autenticação:</strong> Ao criar uma conta (ex: via Google), coletamos seu nome, endereço de e-mail e foto de perfil para autenticação segura.</li>
              <li><strong>Dados Financeiros e de Rotina:</strong> Informações que você insere voluntariamente na plataforma, como orçamentos, metas, categorias de gastos e tarefas.</li>
              <li><strong>Dados de Interação (WhatsApp e Mentor IA):</strong> Mensagens de texto ou áudio enviadas ao nosso número oficial de WhatsApp para o registro automatizado de rotinas e gastos.</li>
              <li><strong>Dados de Pagamento:</strong> Não armazenamos os dados do seu cartão de crédito. Todo o processamento financeiro das assinaturas é feito com criptografia de ponta a ponta por nosso parceiro oficial (Mercado Pago).</li>
            </ul>

            <h2 className="text-2xl text-zinc-900 dark:text-zinc-100">2. Como Usamos Suas Informações</h2>
            <p>Seus dados são utilizados estritamente para o funcionamento e aprimoramento do ecossistema Nexus Focus:</p>
            <ul className="list-disc pl-5 space-y-2 marker:text-emerald-500">
              <li>Fornecer o raciocínio financeiro em tempo real através do Mentor IA.</li>
              <li>Sincronizar seu fluxo de caixa e tarefas entre a plataforma web e o WhatsApp.</li>
              <li>Processar o faturamento da sua assinatura Pro via Mercado Pago.</li>
              <li>Enviar alertas de segurança, atualizações técnicas e avisos de rotina (Timeboxing/Metas).</li>
            </ul>

            <h2 className="text-2xl text-zinc-900 dark:text-zinc-100">3. Compartilhamento de Dados</h2>
            <p>A Nexus IT não vende, aluga ou comercializa seus dados pessoais sob nenhuma circunstância. Suas informações são compartilhadas apenas com infraestruturas essenciais para o funcionamento do serviço:</p>
            <ul className="list-disc pl-5 space-y-2 marker:text-emerald-500">
              <li><strong>Infraestrutura Cloud:</strong> Google Cloud / Firebase para armazenamento de banco de dados seguro em tempo real.</li>
              <li><strong>Processamento de Pagamentos:</strong> Mercado Pago, exclusivamente para o faturamento da assinatura.</li>
              <li><strong>Comunicações Integradas:</strong> Meta (WhatsApp API) para viabilizar as interações com o Mentor IA.</li>
            </ul>

            <h2 className="text-2xl text-zinc-900 dark:text-zinc-100">4. Segurança dos Dados</h2>
            <p>
              Aplicamos padrões de segurança de nível executivo. Seus dados são protegidos por criptografia de ponta a ponta durante a transmissão (SSL/TLS) e no armazenamento no banco de dados. Os tokens de integração de aplicativos de terceiros (como o WhatsApp) são temporários e possuem validade estrita.
            </p>

            <h2 className="text-2xl text-zinc-900 dark:text-zinc-100">5. Seus Direitos</h2>
            <p>Você tem controle total sobre seus dados. A qualquer momento, você pode:</p>
            <ul className="list-disc pl-5 space-y-2 marker:text-emerald-500">
              <li>Acessar e exportar os dados inseridos na plataforma.</li>
              <li>Corrigir informações incompletas ou incorretas.</li>
              <li>Solicitar a exclusão definitiva da sua conta e de todo o seu histórico financeiro e de tarefas do nosso banco de dados.</li>
            </ul>

            <h2 className="text-2xl text-zinc-900 dark:text-zinc-100">6. Contato</h2>
            <p>
              Se você tiver dúvidas sobre esta Política de Privacidade ou sobre o tratamento dos seus dados, entre em contato com nossa equipe de infraestrutura e suporte corporativo através do e-mail: <a href="mailto:suporte@nexusit.tec.br" className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 underline font-semibold">suporte@nexusit.tec.br</a>
            </p>
          </section>
        </article>
      </main>

      {/* Footer Simples */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/50 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          © {new Date().getFullYear()} Nexus Focus. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
