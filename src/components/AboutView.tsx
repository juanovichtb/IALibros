import React from "react";
import { motion } from "motion/react";
import { 
  X, 
  BookOpen, 
  Sparkles, 
  BarChart3, 
  Image as ImageIcon, 
  Database, 
  Share2, 
  BookMarked,
  Layers,
  HelpCircle,
  FileJson,
  CheckCircle2,
  Lock
} from "lucide-react";

interface AboutViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutView({ isOpen, onClose }: AboutViewProps) {
  if (!isOpen) return null;

  return (
    <div id="about-modal-backdrop" className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="bg-[#F9F7F2] w-full max-w-lg h-[90vh] sm:h-[680px] rounded-t-[2.5rem] sm:rounded-[2.5rem] border-t sm:border border-[#E8E4DE] shadow-2xl flex flex-col overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-6 bg-white border-b border-[#E8E4DE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#3E3C3A] text-white p-2 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold italic text-[#3E3C3A] leading-tight">Guía de la Aplicación</h2>
              <p className="text-[9px] font-mono font-bold tracking-widest text-[#8B7E74] uppercase">Manual de Funcionalidades</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F9F7F2] text-[#8B7E74] transition-colors cursor-pointer active:scale-95"
            aria-label="Cerrar guía"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Intro Section */}
          <div className="text-center space-y-2 pb-2">
            <h3 className="font-serif text-xl font-bold italic text-[#3E3C3A]">Un Santuario para tus Lecturas</h3>
            <p className="text-xs text-[#8B7E74] leading-relaxed max-w-sm mx-auto">
              <strong>Mi Diario de Lectura</strong> es un espacio digital íntimo e intuitivo diseñado para amantes de los libros. Su estética minimalista en estilo <em>Bento Dashboard</em> fusiona la calidez del papel clásico con herramientas de productividad de vanguardia.
            </p>
          </div>

          {/* Core Feature Bento Grid */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8B7E74] border-b border-[#E8E4DE] pb-1">
              ¿Qué puedes hacer en la aplicación?
            </h4>

            {/* Feature 1 */}
            <div className="bg-white border border-[#E8E4DE] rounded-2xl p-4 flex gap-4 shadow-3xs">
              <div className="bg-[#C4A484]/15 text-[#C4A484] p-2.5 rounded-xl shrink-0 h-fit">
                <BookMarked className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-bold font-serif text-[#3E3C3A]">1. Registro Íntimo de Libros</h5>
                <p className="text-[11px] text-[#8B7E74] leading-relaxed">
                  Registra títulos, autores, números de páginas, fechas de inicio y añade reflexiones profundas. Categoriza tus obras por formatos (Físico, Digital, Audiolibro) y estados de lectura (Leyendo, Pendiente, Terminado, Abandonado).
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-[#E8E4DE] rounded-2xl p-4 flex gap-4 shadow-3xs">
              <div className="bg-amber-500/10 text-amber-700 p-2.5 rounded-xl shrink-0 h-fit">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-bold font-serif text-[#3E3C3A]">2. Panel de Estadísticas y Ritmo</h5>
                <p className="text-[11px] text-[#8B7E74] leading-relaxed">
                  Visualiza gráficos de barra e histogramas sobre tus libros terminados por mes, desglose de formatos más utilizados, promedio de calificaciones por estrellas y el gran total de páginas consumidas para motivarte a cumplir tus metas de lectura.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-[#E8E4DE] rounded-2xl p-4 flex gap-4 shadow-3xs">
              <div className="bg-[#3E3C3A]/5 text-[#3E3C3A] p-2.5 rounded-xl shrink-0 h-fit">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-bold font-serif text-[#3E3C3A]">3. Tarjetas Estéticas Compartibles</h5>
                <p className="text-[11px] text-[#8B7E74] leading-relaxed">
                  Selecciona cualquier libro terminado y genera una <strong>tarjeta estética de reflexión</strong>. Elige entre variados fondos atmosféricos (Papel Vintage, Carbón Cósmico, Atardecer Cálido, Café Acogedor) y descárgala o compártela como una postal literaria interactiva.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border border-[#E8E4DE] rounded-2xl p-4 flex gap-4 shadow-3xs">
              <div className="bg-[#C4A484]/15 text-[#C4A484] p-2.5 rounded-xl shrink-0 h-fit">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-bold font-serif text-[#3E3C3A]">4. El Oráculo de Sabiduría (IA)</h5>
                <p className="text-[11px] text-[#8B7E74] leading-relaxed">
                  Realiza consultas literarias y recibe datos fascinantes del mundo de los libros, récords históricos de lectura, o estadísticas del hábito lector en Latinoamérica. Funciona con Inteligencia Artificial o de forma offline.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-white border border-[#E8E4DE] rounded-2xl p-4 flex gap-4 shadow-3xs">
              <div className="bg-emerald-500/10 text-emerald-700 p-2.5 rounded-xl shrink-0 h-fit">
                <Database className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-bold font-serif text-[#3E3C3A]">5. Sincronización Real sin Contraseñas</h5>
                <p className="text-[11px] text-[#8B7E74] leading-relaxed">
                  Ingresa con un simple <strong>Nickname</strong> y tus libros se resguardarán en la base de datos en la nube (Google Firebase Firestore). Puedes acceder desde cualquier celular o computadora escribiendo el mismo apodo.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-white border border-[#E8E4DE] rounded-2xl p-4 flex gap-4 shadow-3xs">
              <div className="bg-[#8B7E74]/15 text-[#8B7E74] p-2.5 rounded-xl shrink-0 h-fit">
                <FileJson className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-bold font-serif text-[#3E3C3A]">6. Exportación & Copias de Seguridad</h5>
                <p className="text-[11px] text-[#8B7E74] leading-relaxed">
                  Tus datos son tuyos. En la pestaña de Perfil podrás descargar un archivo JSON con toda tu biblioteca histórica para respaldarla localmente o importarla en otro navegador al instante.
                </p>
              </div>
            </div>
          </div>

          {/* AI Connectivity Guide */}
          <div className="bg-amber-50/50 border border-amber-200/60 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-800">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider">El Sistema Dual de Inteligencia Artificial</h4>
            </div>
            
            <p className="text-[11px] text-amber-900 leading-relaxed">
              El Oráculo Literario está diseñado para ser infalible y adaptable a cualquier situación:
            </p>

            <ul className="space-y-2.5 text-[11px] text-amber-950">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span><strong>Con Clave de IA:</strong> Al configurar tu propia clave <code>GEMINI_API_KEY</code> en los ajustes (Secrets) de la plataforma, el Oráculo se conecta en vivo con los modelos más recientes de Gemini para resolver cualquier duda, redactar metáforas o sugerir tus siguientes lecturas.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span><strong>Modo de Contingencia Local:</strong> Si no hay clave de API o los servidores de Google se encuentran congestionados por alta demanda, se activa el <strong>Códice Alquimista Local</strong>, que provee respuestas seleccionadas de forma inteligente sobre más de 12 temas literarios clave.</span>
              </li>
            </ul>
          </div>

          {/* Privacy & Security Pledge */}
          <div className="bg-stone-100 border border-[#E8E4DE] rounded-3xl p-5 flex items-center gap-4">
            <Lock className="w-8 h-8 text-[#8B7E74] shrink-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#3E3C3A]">Privacidad Absoluta</h4>
              <p className="text-[11px] text-[#8B7E74] leading-relaxed">
                Tus reflexiones personales son sagradas. La base de datos de Firebase protege la separación de bibliotecas de modo que solo tú puedas ver y modificar tus registros de lectura.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Button */}
        <div className="p-5 bg-white border-t border-[#E8E4DE] shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-[#3E3C3A] hover:bg-[#2D2926] text-white py-3 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
          >
            ¡Entendido, let's read!
          </button>
        </div>
      </motion.div>
    </div>
  );
}
