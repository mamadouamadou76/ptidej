import React, { useState, useEffect } from 'react';
import { Coffee, Smartphone, Download, Check, Info, Share, HelpCircle, Laptop } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function MobileFrame({ children, fullWidth = false }: MobileFrameProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showInstallGuide, setShowInstallGuide] = useState<boolean>(false);

  useEffect(() => {
    // Listen for the PWA install prompt trigger
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already in standalone browser view mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Prompt not supported or already installed, show manual instructions
      setShowInstallGuide(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-stone-800 font-sans flex flex-col items-center">
      {/* Background soft ambient accents */}
      <div className="fixed inset-0 bg-radial from-amber-50/30 via-stone-50/10 to-stone-100/10 -z-10 pointer-events-none" />

      {/* Main Container: Full viewport on mobile, Centered elegantly on desktop for maximum comfort */}
      <div className={`w-full ${fullWidth ? 'max-w-full' : 'max-w-lg md:max-w-2xl'} min-h-screen bg-white shadow-xl md:shadow-2xl md:border-x border-stone-200/65 flex flex-col relative overflow-hidden`}>
        
        {/* PWA Direct Installation Ribbon bar if available and not installed yet */}
        {!isInstalled && (
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2.5 flex items-center justify-between shadow-sm select-none">
            <div className="flex items-center gap-2">
              <div className="bg-white/25 p-1 rounded-lg">
                <Coffee className="w-4 h-4 text-white fill-white" />
              </div>
              <p className="text-xs font-semibold leading-tight">
                Installez l'application sur votre écran d'accueil !
              </p>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                id="btn-pwa-install-banner"
                onClick={handleInstallClick}
                className="bg-white text-amber-950 font-bold text-[10.5px] px-3 py-1 rounded-lg shadow-sm active:scale-95 transition-all flex items-center gap-1 hover:bg-amber-50"
              >
                <Download className="w-3 h-3 text-amber-700 stroke-[3]" />
                <span>Installer</span>
              </button>
              <button 
                onClick={() => setShowInstallGuide(!showInstallGuide)}
                className="text-white/80 hover:text-white p-1 rounded-full transition-colors"
                title="Aide installation"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Manual Step-by-Step Installation Popup Guide */}
        {showInstallGuide && (
          <div className="bg-amber-50/95 border-b border-amber-200/80 px-5 py-4 space-y-3 relative z-50">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-amber-950 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <Smartphone className="w-4 h-4 text-amber-700" />
                <span>Guide d'installation rapide (PWA)</span>
              </h4>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold font-mono px-1"
              >
                [ Fermer ]
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs leading-relaxed text-stone-700">
              <div className="p-2.5 bg-white rounded-xl border border-amber-100">
                <p className="font-bold text-stone-900 mb-1 flex items-center gap-1">
                  <span className="bg-amber-100 text-amber-900 font-bold w-4 h-4 rounded-full flex items-center justify-center text-[10px]">1</span>
                  <span>Sur iOS (Safari) :</span>
                </p>
                <p className="text-[11px] text-stone-600">
                  Appuyez sur le bouton <strong className="text-amber-900 inline-flex items-center gap-0.5">Partager <Share className="w-3 h-3" /></strong> en bas, puis choisissez <strong>"Sur l'écran d'accueil"</strong>.
                </p>
              </div>
              
              <div className="p-2.5 bg-white rounded-xl border border-amber-100">
                <p className="font-bold text-stone-900 mb-1 flex items-center gap-1">
                  <span className="bg-amber-100 text-amber-900 font-bold w-4 h-4 rounded-full flex items-center justify-center text-[10px]">2</span>
                  <span>Sur Android / Chrome :</span>
                </p>
                <p className="text-[11px] text-stone-600">
                  Cliquez sur les <strong>3 petits points</strong> en haut à droite, puis sélectionnez <strong>"Ajouter à l'écran d'accueil"</strong> ou installer.
                </p>
              </div>
            </div>
            <p className="text-[10px] text-amber-800 text-center italic mt-1 bg-amber-100/50 py-1 rounded">
              L'application s'ouvrira en plein écran sans les barres de navigation classiques !
            </p>
          </div>
        )}

        {/* Responsive Content Core */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
