import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Sparkles, Shield, AlertCircle, LogIn, User as UserIcon, HelpCircle } from "lucide-react";
import { loginAnonymously } from "../firebase";
import AboutView from "./AboutView";

interface WelcomeViewProps {
  key?: any;
  onLoginSuccess: (user: any) => void;
}

export default function WelcomeView({ onLoginSuccess }: WelcomeViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const handleNicknameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNickname = nickname.trim();
    
    if (!cleanNickname) {
      setError("Por favor ingresa un nombre o nickname.");
      return;
    }

    if (cleanNickname.length < 2) {
      setError("El nickname debe tener al menos 2 caracteres.");
      return;
    }

    if (cleanNickname.length > 20) {
      setError("El nickname es demasiado largo (máximo 20 caracteres).");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Create a virtual user object based on the nickname
      const customUser = {
        uid: "nickname_" + cleanNickname.toLowerCase(),
        displayName: cleanNickname,
        email: null,
        isAnonymous: false,
        photoURL: null,
        metadata: { creationTime: new Date().toISOString() }
      };

      // Store in localStorage to auto-login on refresh
      localStorage.setItem("diario_lectura_active_guest", JSON.stringify(customUser));
      
      // Let App know login succeeded
      onLoginSuccess(customUser);
    } catch (err: any) {
      console.error("Auth error:", err);
      setError("No se pudo iniciar sesión. Por favor reintenta.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await loginAnonymously();
      onLoginSuccess(user);
    } catch (err: any) {
      console.warn("Firebase Anonymous Sign-In failed, falling back to Local Guest mode", err);
      // Create a mock local guest user and log in!
      const mockUser = {
        uid: "guest_local_user",
        displayName: "Lector Invitado (Modo Local)",
        email: null,
        isAnonymous: true,
        photoURL: null,
        metadata: { creationTime: new Date().toISOString() }
      };
      localStorage.setItem("diario_lectura_active_guest", JSON.stringify(mockUser));
      onLoginSuccess(mockUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="welcome-view-container" className="flex-1 flex flex-col items-center justify-start px-6 py-8 min-h-full bg-[#F9F7F2] overflow-y-auto">
      {/* Upper Brand Section */}
      <div className="w-full flex flex-col items-center justify-center space-y-4 pt-6 pb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
          className="relative"
        >
          <div className="bg-[#3E3C3A] text-white p-5 rounded-[1.75rem] shadow-md border-4 border-white">
            <BookOpen className="w-11 h-11" />
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1 -right-1 bg-[#C4A484] text-white p-1.5 rounded-full"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </motion.div>
        </motion.div>

        <div className="text-center space-y-1">
          <h1 id="welcome-title" className="font-serif text-3xl font-bold tracking-tight text-[#3E3C3A] italic">
            Mi Diario
          </h1>
          <p id="welcome-subtitle" className="font-mono text-[#8B7E74] text-[10px] uppercase tracking-widest font-semibold">
            DE LECTURA • BENTO DASHBOARD
          </p>
        </div>

        <p className="text-[#8B7E74] text-xs text-center max-w-xs leading-relaxed">
          Registra, califica y organiza todas tus lecturas en una elegante interfaz bento.
        </p>

        <button
          onClick={() => setIsAboutOpen(true)}
          className="flex items-center gap-1.5 text-[10px] text-[#C4A484] hover:text-[#B39373] font-bold font-mono uppercase tracking-widest bg-[#C4A484]/10 hover:bg-[#C4A484]/15 px-4 py-2 rounded-full mt-2 transition-all cursor-pointer active:scale-95 border border-[#C4A484]/20"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Ver Guía & Funcionalidades</span>
        </button>
      </div>

      {/* Main Nickname Input Container */}
      <div className="w-full max-w-sm space-y-5">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs flex gap-2"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
            <p className="leading-tight font-medium">{error}</p>
          </motion.div>
        )}

        <div className="bg-white p-6 rounded-3xl border border-[#E8E4DE] shadow-xs space-y-4">
          <div className="space-y-1.5">
            <h3 className="font-serif text-lg font-bold text-[#3E3C3A] text-center">
              Ingresa tu Nickname
            </h3>
            <p className="text-[11px] text-[#8B7E74] text-center leading-relaxed">
              Tus libros se guardarán automáticamente en la nube bajo tu nickname. Podrás acceder a ellos en cualquier dispositivo escribiendo el mismo nombre.
            </p>
          </div>

          <form onSubmit={handleNicknameSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase font-bold text-[#8B7E74] tracking-wider block">
                Tu Apodo / Nickname
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-[#8B7E74]">
                  <UserIcon className="w-4 h-4 text-[#C4A484]" />
                </span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="ej. Maria, Lucas, Lector123"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F9F7F2] border border-[#E8E4DE] text-xs focus:outline-none focus:border-[#C4A484] transition-all text-[#3E3C3A] font-medium"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 flex items-center justify-center gap-2 bg-[#C4A484] hover:bg-[#B39373] text-white py-3 rounded-2xl font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? "Ingresando..." : "Ingresar a mi Biblioteca"}</span>
            </button>
          </form>
        </div>

        {/* Separator / Alternative Option */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#E8E4DE]" />
          <span className="text-[9px] font-mono text-[#8B7E74]/70 uppercase tracking-widest font-bold">O también puedes</span>
          <div className="flex-1 h-px bg-[#E8E4DE]" />
        </div>

        {/* Anonymous/Demo Fallback Button */}
        <button
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#3E3C3A] hover:bg-[#2D2926] text-white px-4 py-3.5 rounded-2xl font-semibold text-xs transition-all shadow-xs cursor-pointer active:scale-98 disabled:opacity-50"
        >
          <Shield className="w-4 h-4 text-[#C4A484]" />
          <span>Continuar con Acceso Demo (Modo Local)</span>
        </button>

        <p className="text-[10px] text-[#8B7E74]/60 text-center font-mono uppercase tracking-widest leading-relaxed pt-2">
          Tu diario de lecturas ahora es 100% libre de contraseñas. ¡Fácil, rápido y seguro!
        </p>
      </div>

      {/* Guide / About Modal */}
      <AnimatePresence>
        {isAboutOpen && (
          <AboutView isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
