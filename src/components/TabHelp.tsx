import React, { useState } from 'react';
import { Joyride, Step, CallBackProps, STATUS } from 'react-joyride';
import { 
  LayoutDashboard, 
  Target, 
  MessageCircle, 
  Apple, 
  Smartphone,
  ChevronRight
} from 'lucide-react';

// 3. Lógica de Gerenciamento de Estado (React Joyride) - Objeto TOUR_STEPS
const TOUR_STEPS: Record<string, Step[]> = {
  dashboard: [
    {
      target: 'body',
      content: 'Bem-vindo ao Tour do Dashboard! Vamos te mostrar o essencial.',
      placement: 'center',
    },
    {
      target: '#resumo-saldos',
      content: 'Aqui você acompanha seus saldos consolidados: receitas, despesas e saldo atual.',
    },
    {
      target: '#grafico-despesas',
      content: 'Neste gráfico, suas despesas são categorizadas para melhor visualização.',
    },
    {
      target: '#btn-nova-transacao',
      content: 'Sempre que precisar adicionar um novo gasto ou receita manualmente, clique aqui.',
    },
  ],
  caixinhas: [
    {
      target: 'body',
      content: 'Vamos criar sua primeira Caixinha (Meta)!',
      placement: 'center',
    },
    {
      target: '#tab-metas',
      content: 'Primeiro, navegue até a aba "Metas" clicando aqui no menu lateral.',
    },
    {
      target: '#btn-nova-meta',
      content: 'Clique neste botão para criar um novo objetivo financeiro.',
    },
    {
      target: '#form-meta',
      content: 'Defina o nome, o valor que deseja alcançar e o prazo. Simples assim!',
    }
  ],
  whatsapp: [
    {
      target: 'body',
      content: 'Conectando o WhatsApp ao Nexus Focus',
      placement: 'center',
    },
    {
      target: '#tab-mais',
      content: 'Acesse o menu "Mais" para ver as integrações disponíveis.',
    },
    {
      target: '#btn-whatsapp',
      content: 'Clique na opção do WhatsApp para ler o QR Code e conectar seu número de forma rápida.',
    },
  ],
  apple_wallet: [
    {
      target: 'body',
      content: 'Automação com Apple Wallet e iOS',
      placement: 'center',
    },
    {
      target: '#ios-shortcut',
      content: 'Baixe o atalho oficial para o iPhone diretamente da nossa aba de automações.',
    },
    {
      target: '#ios-config',
      content: 'Cole seu token exclusivo no aplicativo Atalhos do iOS para registrar gastos via Apple Pay.',
    },
  ],
  pwa: [
    {
      target: 'body',
      content: 'Instalação do Aplicativo (PWA)',
      placement: 'center',
    },
    {
      target: 'body',
      content: 'Se você estiver no celular, clique em "Compartilhar" e depois "Adicionar à Tela de Início". No PC, clique no ícone de download na barra de endereços.',
      placement: 'center',
    },
  ]
};

// Sub-componente (Dumb Component) para os cards de tutorial
interface TutorialCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const TutorialCard: React.FC<TutorialCardProps> = ({ title, description, icon, onClick }) => (
  <button 
    onClick={onClick}
    className="bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 p-5 rounded-2xl flex items-start gap-4 transition-all text-left group w-full"
  >
    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="font-bold text-white text-base mb-1 group-hover:text-blue-400 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-zinc-400 leading-snug">
        {description}
      </p>
    </div>
    <div className="flex-shrink-0 mt-3 text-zinc-600 group-hover:text-blue-500 transition-colors">
      <ChevronRight size={20} />
    </div>
  </button>
);

export function TabHelp() {
  const [activeTour, setActiveTour] = useState<string | null>(null);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    // Reseta o estado quando finalizado ou pulado
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setActiveTour(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full pb-24">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Central de Ajuda e Tutoriais</h1>
        <p className="text-zinc-400 max-w-2xl">
          Aprenda a configurar seu aplicativo e dominar todas as integrações. Escolha um guia abaixo para iniciar o tour interativo.
        </p>
      </div>
      
      <div className="space-y-10">
        
        {/* Seção 1: Conceitos Básicos */}
        <section>
          <h2 className="text-xl font-bold text-zinc-100 mb-4 border-b border-zinc-800 pb-2">Conceitos Básicos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TutorialCard 
              title="Visão Geral do Dashboard" 
              description="Aprenda a ler seus saldos consolidados, gráficos e como registrar uma transação manualmente." 
              icon={<LayoutDashboard size={24} />} 
              onClick={() => setActiveTour('dashboard')} 
            />
            <TutorialCard 
              title="Como criar Metas (Caixinhas)" 
              description="Configure objetivos financeiros para poupar dinheiro e acompanhe seu progresso." 
              icon={<Target size={24} />} 
              onClick={() => setActiveTour('caixinhas')} 
            />
          </div>
        </section>

        {/* Seção 2: Integrações Avançadas */}
        <section>
          <h2 className="text-xl font-bold text-zinc-100 mb-4 border-b border-zinc-800 pb-2">Integrações Avançadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TutorialCard 
              title="Conectar WhatsApp" 
              description="Sincronize seu WhatsApp para adicionar gastos conversando com nossa IA." 
              icon={<MessageCircle size={24} />} 
              onClick={() => setActiveTour('whatsapp')} 
            />
            <TutorialCard 
              title="Automação com Apple Wallet" 
              description="Crie atalhos no iOS para registrar compras do Apple Pay instantaneamente." 
              icon={<Apple size={24} />} 
              onClick={() => setActiveTour('apple_wallet')} 
            />
            <TutorialCard 
              title="Instalar App (PC ou Celular)" 
              description="Saiba como instalar o Nexus Focus como aplicativo nativo no seu dispositivo." 
              icon={<Smartphone size={24} />} 
              onClick={() => setActiveTour('pwa')} 
            />
          </div>
        </section>

      </div>

      <Joyride
        steps={activeTour ? TOUR_STEPS[activeTour] : []}
        run={!!activeTour}
        continuous={true}
        showSkipButton={true}
        callback={handleJoyrideCallback}
        locale={{
          back: 'Anterior',
          close: 'Fechar',
          last: 'Concluir',
          next: 'Próximo',
          skip: 'Pular',
        }}
        styles={{
          options: {
            primaryColor: '#2563eb', // Azul vibrante
            textColor: '#1e293b',
            backgroundColor: '#ffffff',
            arrowColor: '#ffffff',
            zIndex: 10000,
          }
        }}
      />
    </div>
  );
}
