import React, { useState } from 'react';
import { useAuth } from './FirebaseContext';
import { Coffee, Mail, Lock, User, LogIn, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

interface AuthViewProps {
  onClose?: () => void;
}

export function AuthView({ onClose }: AuthViewProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    
    if (isSignUp && !name.trim()) {
      setErrorMessage("Veuillez saisir votre nom.");
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setErrorMessage("Le mot de passe doit contenir au moins 6 caractères.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      if (onClose) onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMessage("Cette adresse e-mail est déjà utilisée.");
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorMessage("Identifiants incorrects ou utilisateur introuvable.");
      } else if (err.code === 'auth/invalid-email') {
        setErrorMessage("Format de l'e-mail invalide.");
      } else {
        setErrorMessage(err.message || "Une erreur s'est produite lors de la connexion.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      if (onClose) onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setErrorMessage("Le popup de connexion a été bloqué. Autorisez les popups pour ce site dans votre navigateur.");
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setErrorMessage(null);
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMessage("Ce domaine n'est pas autorisé pour la connexion Google. Contactez l'administrateur.");
      } else {
        setErrorMessage("Erreur de connexion avec Google. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-8 overflow-y-auto bg-stone-50/50">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-stone-200/80 p-6 md:p-8 shadow-xl space-y-6 relative">
        
        {/* Brand identity */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-amber-500 text-white p-3 rounded-2xl shadow-md transform hover:rotate-12 transition-transform duration-300">
            <Coffee className="w-6 h-6 fill-white" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-stone-900 font-sans">
              Rejoindre le P'tit Déj 🥐
            </h2>
            <p className="text-xs text-stone-500 max-w-[250px] mx-auto mt-1 leading-relaxed">
              Sauvegardez vos plannings en ligne et synchronisez vos absences avec toute l'équipe.
            </p>
          </div>
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start gap-2 text-xs text-rose-800 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-semibold leading-normal">{errorMessage}</p>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-stone-500 uppercase tracking-wider block">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  required
                  placeholder="Jean Dupont/Équipe Matin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1.5 focus:ring-amber-500 focus:bg-white transition-all font-sans font-medium"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-stone-500 uppercase tracking-wider block">
              Adresse E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="email"
                required
                placeholder="jean.dupont@entreprise.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1.5 focus:ring-amber-500 focus:bg-white transition-all font-sans font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-stone-500 uppercase tracking-wider block">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="password"
                required
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1.5 focus:ring-amber-500 focus:bg-white transition-all font-sans font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 rounded-xl shadow-xs hover:shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5 text-xs select-none disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? "Créer mon compte" : "Se connecter"}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-stone-200" />
          <span className="flex-shrink mx-4 text-stone-400 text-[10px] font-bold font-mono">OU</span>
          <div className="flex-grow border-t border-stone-200" />
        </div>

        {/* Google OAuth Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white hover:bg-stone-50 text-stone-700 font-bold py-3 px-4 border border-stone-200 rounded-xl shadow-xs hover:shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2.5 text-xs select-none disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-stone-400" />
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                   d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuer avec Google</span>
            </>
          )}
        </button>

        {/* Change Mode Trigger */}
        <div className="text-center pt-1 select-none">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[11px] font-bold text-amber-700 hover:text-amber-800 focus:outline-none"
          >
            {isSignUp ? "Vous avez déjà un compte ? Connectez-vous" : "Pas encore de compte ? S'inscrire"}
          </button>
        </div>

      </div>
    </div>
  );
}
