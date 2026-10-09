import React, { useState, useEffect } from 'react';
import { Rocket, FileSpreadsheet, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WelcomeOverlayProps {
  onStartTour: () => void;
}

export function WelcomeOverlay({ onStartTour }: WelcomeOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hasSeen = localStorage.getItem('nexus_welcome_seen');
    if (!hasSeen) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('nexus_welcome_seen', 'true');
  };

  const handleStartTour = () => {
    handleClose();
    onStartTour();
  };

  const handleImport = () => {
    handleClose();
    navigate('/import');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo ao Nexus Focus</h2>
            <p className="text-zinc-400">Como você deseja começar a organizar suas finanças?</p>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Card 1: Começar do Zero */}
          <button 
            onClick={handleStartTour}
            className="flex flex-col items-center text-center p-6 bg-zinc-800/50 hover:bg-blue-500/10 border border-zinc-700/50 hover:border-blue-500/50 rounded-2xl transition-all group"
          >
            <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Rocket size={32} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Começar do Zero</h3>
            <p className="text-sm text-zinc-400">
              Faça um tour guiado e aprenda a usar o aplicativo adicionando seus dados manualmente.
            </p>
          </button>

          {/* Card 2: Importar Histórico */}
          <button 
            onClick={handleImport}
            className="flex flex-col items-center text-center p-6 bg-zinc-800/50 hover:bg-green-500/10 border border-zinc-700/50 hover:border-green-500/50 rounded-2xl transition-all group"
          >
            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileSpreadsheet size={32} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Importar Histórico</h3>
            <p className="text-sm text-zinc-400">
              Traga seus dados do Excel ou Google Sheets usando nossa migração inteligente.
            </p>
          </button>
        </div>

        <div className="flex justify-center">
          <button 
            onClick={handleClose}
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            Pular por enquanto
          </button>
        </div>
      </div>
    </div>
  );
}
