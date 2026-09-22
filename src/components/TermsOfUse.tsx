import React, { useEffect } from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TermsOfUse() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#121216] text-zinc-700 dark:text-zinc-300 font-sans selection:bg-emerald-500/30 selection:text-emerald-900 dark:selection:text-emerald-100">
      {/* Header Corporativo */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#121216]/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/50">
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
              Termos de Uso – Nexus Focus
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">
              Última atualização: Setembro de 2026
            </p>
          </div>

          <section className="space-y-6">
            <p>
              Bem-vindo ao Nexus Focus, um produto desenvolvido pela Nexus IT. Ao acessar nossa plataforma, utilizar o Mentor IA ou interagir com nossos serviços via WhatsApp, você concorda integralmente com os termos descritos abaixo.
            </p>

            <h2 className="text-2xl text-zinc-900 dark:text-zinc-100">1. Aceitação e Descrição do Serviço</h2>
            <p>
              O Nexus Focus é um ecossistema de gestão de rotina e controle financeiro. A assinatura corporativa ("Nexus Focus Pro") concede acesso irrestrito a funcionalidades que incluem, mas não se limitam a: sincronização em nuvem, gestão de caixinhas, Timeboxing e interação com nosso Mentor IA (via painel web e WhatsApp).
            </p>

            <h2 className="text-2xl text-zinc-900 dark:text-zinc-100">2. Natureza das Informações (Isenção de Responsabilidade Financeira)</h2>
            <p>
              O Mentor IA e os relatórios gerados pela plataforma utilizam inteligência artificial para organizar seus dados e sugerir otimizações de rotina e gastos. No entanto, o Nexus Focus não atua como consultoria financeira, de investimentos, contábil ou jurídica. As dicas financeiras (ex: "Dica Financeira do Dia") são sugestões automatizadas baseadas em seus inputs. O usuário é o único responsável por suas decisões financeiras.
            </p>

            <h2 className="text-2xl text-zinc-900 dark:text-zinc-100">3. Assinatura, Faturamento e Cancelamento</h2>
            <ul className="list-disc pl-5 space-y-2 marker:text-emerald-500">
              <li><strong>Processamento:</strong> O pagamento do plano Pro (R$ 19,90/mês) é processado de forma segura via Mercado Pago.</li>
              <li><strong>Renovação Automática:</strong> A assinatura é contínua e renovada automaticamente a cada mês, a menos que seja cancelada antes do próximo ciclo de faturamento.</li>
              <li><strong>Cancelamento:</strong> Você pode cancelar a qualquer momento diretamente pelo seu painel (Dashboard), sem multas ou complicações. O acesso aos recursos Pro continuará até o fim do período já pago. Não oferecemos reembolsos proporcionais para meses parcialmente utilizados.</li>
            </ul>

            <h2 className="text-2xl text-zinc-900 dark:text-zinc-100">4. Uso Aceitável e Integração com WhatsApp</h2>
            <p>Ao utilizar a integração do Mentor via WhatsApp (provida pela Meta Cloud API), você concorda em:</p>
            <ul className="list-disc pl-5 space-y-2 marker:text-emerald-500">
              <li>Não enviar mensagens em massa, correntes ou qualquer conteúdo que viole as diretrizes da Meta.</li>
              <li>Ser o titular e responsável pelo número de telefone conectado à sua conta através do nosso sistema de autenticação segura.</li>
            </ul>
            <p>
              A Nexus IT reserva-se o direito de desconectar o número ou suspender a conta caso seja detectado uso abusivo, fraudulento ou sobrecarga intencional dos nossos servidores de Inteligência Artificial.
            </p>

            <h2 className="text-2xl text-zinc-900 dark:text-zinc-100">5. Disponibilidade do Sistema (SLA)</h2>
            <p>
              Trabalhamos para manter a plataforma no ar 24/7 com alta performance. No entanto, por dependermos de serviços de terceiros (Google Firebase, Render, Meta, Mercado Pago), podem ocorrer instabilidades temporárias. A Nexus IT não se responsabiliza por eventuais perdas diretas ou indiretas decorrentes de manutenções ou quedas do sistema.
            </p>

            <h2 className="text-2xl text-zinc-900 dark:text-zinc-100">6. Propriedade Intelectual</h2>
            <p>
              Toda a identidade visual, interfaces (incluindo o design monocromático e a logotipo em camadas), códigos, mecânicas do sistema "Nexus Flow" e textos são de propriedade exclusiva da Nexus IT. É terminantemente proibida a cópia, engenharia reversa ou reprodução não autorizada.
            </p>

            <h2 className="text-2xl text-zinc-900 dark:text-zinc-100">7. Foro e Legislação Aplicável</h2>
            <p>
              Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca da sede da Nexus IT para dirimir quaisquer dúvidas ou controvérsias oriundas deste documento.
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
