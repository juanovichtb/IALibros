import { useState } from "react";
import { motion } from "motion/react";
import { BookOpen, Sparkles, Shield, AlertCircle } from "lucide-react";
import { loginWithGoogle, loginAnonymously } from "../firebase";
import { User } from "firebase/auth";

interface WelcomeViewProps {
  key?: any;
  onLoginSuccess: (user: User) => void;
}

export default function WelcomeView({ onLoginSuccess }: WelcomeViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await loginWithGoogle();
      onLoginSuccess(user);
    } catch (err: any) {
      console.error(err);
      // Iframe restriction detection
      if (err.code === "auth/popup-blocked" || err.message?.includes("iframe")) {
        setError(
          "El navegador bloqueó la ventana emergente de Google. Si estás usando el visor de AI Studio, haz clic abajo en 'Continuar con Acceso Demo' para probar la aplicación al instante."
        );
      } else {
        setError("No se pudo iniciar sesión con Google. Por favor, reintenta o usa el Acceso Demo.");
      }
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
      console.error(err);
      setError("No se pudo iniciar sesión en modo Demo. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="welcome-view-container" className="flex-1 flex flex-col items-center justify-between px-6 py-10 h-full bg-[#F9F7F2]">
      {/* Upper Brand Section */}
      <div className="w-full flex flex-col items-center justify-center space-y-6 pt-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
          className="relative"
        >
          <div className="bg-[#3E3C3A] text-white p-6 rounded-[2rem] shadow-md border-4 border-white">
            <BookOpen className="w-14 h-14" />
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1 -right-1 bg-[#C4A484] text-white p-1.5 rounded-full"
          >
            <Sparkles className="w-4 h-4" />
          </motion.div>
        </motion.div>

        <div className="text-center space-y-2">
          <h1 id="welcome-title" className="font-serif text-4xl font-bold tracking-tight text-[#3E3C3A] italic">
            Mi Diario
          </h1>
          <p id="welcome-subtitle" className="font-mono text-[#8B7E74] text-xs uppercase tracking-widest font-semibold">
            DE LECTURA • BENTO MOBILE
          </p>
        </div>

        <p className="text-[#8B7E74] text-sm text-center max-w-xs leading-relaxed">
          Registra, califica y organiza todas tus lecturas en una interfaz bento optimizada para tu celular.
        </p>
      </div>

      {/* Buttons and Bottom Section */}
      <div className="w-full space-y-4 max-w-sm pb-4">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs flex gap-2"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
            <p className="leading-tight font-medium">{error}</p>
          </motion.div>
        )}

        <div className="space-y-3">
          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-50 text-neutral-800 border border-[#E8E4DE] px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all shadow-xs cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.354 0 3.373 2.736 1.5 6.71l3.766 3.055z"
              />
              <path
                fill="#34A853"
                d="M16.04 15.345c-1.012.678-2.33 1.082-4.04 1.082a7.073 7.073 0 0 1-6.734-4.855L1.5 14.628A11.968 11.968 0 0 0 12 24c3.245 0 6.19-1.077 8.364-2.91l-4.324-5.745z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.273c0-.818-.073-1.605-.205-2.364H12v4.51h6.46a5.523 5.523 0 0 1-2.4 3.636l4.324 5.745c2.53-2.33 4.106-5.76 4.106-9.527z"
              />
              <path
                fill="#FBBC05"
                d="M5.266 14.235a7.045 7.045 0 0 1-.357-2.235c0-.78.13-1.53.357-2.235L1.5 6.71A11.944 11.944 0 0 0 0 12c0 1.92.454 3.736 1.5 5.29l3.766-3.055z"
              />
            </svg>
            <span>{loading ? "Iniciando..." : "Iniciar sesión con Google"}</span>
          </button>

          {/* Anonymous/Demo Fallback Button */}
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#3E3C3A] hover:bg-[#2D2926] text-white px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all shadow-xs cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <Shield className="w-4 h-4 text-[#C4A484]" />
            <span>Continuar con Acceso Demo</span>
          </button>
        </div>

        <p className="text-[10px] text-[#8B7E74]/60 text-center font-mono uppercase tracking-widest">
          Tus datos se guardarán de forma segura en Firestore
        </p>
      </div>
    </div>
  );
}
