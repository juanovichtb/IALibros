import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Globe, 
  Clock, 
  BookOpen, 
  Send, 
  RefreshCw, 
  HelpCircle, 
  Award, 
  Coins, 
  Bookmark,
  ChevronRight,
  TrendingUp,
  Sliders
} from "lucide-react";
import { Book } from "../types";

interface TriviaViewProps {
  books: Book[];
}

interface CuratedFact {
  id: string;
  category: "independiente" | "récord" | "historia" | "latam";
  title: string;
  subtitle: string;
  fact: string;
  icon: React.ReactNode;
  accentColor: string;
}

export default function TriviaView({ books }: TriviaViewProps) {
  // 1. Reading Index Comparison state
  const totalBooks = books.length;
  
  // Latin American Indices
  const countries = [
    { name: "España", value: 10.3, flag: "🇪🇸" },
    { name: "Chile", value: 5.4, flag: "🇨🇱" },
    { name: "Argentina", value: 4.6, flag: "🇦🇷" },
    { name: "Colombia", value: 1.9, flag: "🇨🇴" },
    { name: "Perú", value: 1.2, flag: "🇵🇪" },
  ];

  // Insert User's average (extrapolated or absolute)
  const chartData = useMemo(() => {
    const userBar = { name: "¡Tú (Biblioteca)!", value: totalBooks, flag: "✨", isUser: true };
    const all = [...countries, userBar];
    // Sort so it's a beautiful ranked bar chart
    return all.sort((a, b) => b.value - a.value);
  }, [totalBooks]);

  // Reading Habit Simulator
  const [dailyMinutes, setDailyMinutes] = useState(25);
  const estimatedBooksPerYear = useMemo(() => {
    // Average reading speed is 250 words per minute.
    // Average book is 65,000 words.
    // So 1 book takes about 260 minutes of reading.
    // Books/year = (DailyMinutes * 365) / 260
    return Math.max(1, Math.round((dailyMinutes * 365) / 260));
  }, [dailyMinutes]);

  // 2. Curated Fact Index
  const curatedFacts: CuratedFact[] = [
    {
      id: "most_expensive",
      category: "récord",
      title: "El Libro Más Caro del Mundo",
      subtitle: "El Codex Leicester de Da Vinci",
      fact: "Fue comprado por Bill Gates en 1994 por $30.8 millones de dólares (hoy equivale a más de $60 millones). Es un cuaderno científico donde Leonardo escribió de su puño y letra reflexiones sobre astronomía, agua y meteorología usando su famosa 'escritura especular' (leída en un espejo).",
      icon: <Coins className="w-5 h-5" />,
      accentColor: "from-amber-400 to-yellow-500 bg-amber-50 text-amber-950 border-amber-200"
    },
    {
      id: "most_sold",
      category: "récord",
      title: "El Best-Seller Más Grande",
      subtitle: "Don Quijote de la Mancha",
      fact: "Aunque no existen registros exactos del siglo XVII, los historiadores estiman que la obra de Miguel de Cervantes ha vendido más de 500 millones de copias, convirtiéndose en la obra de ficción más leída de la historia, muy por encima de éxitos modernos como Harry Potter.",
      icon: <Award className="w-5 h-5" />,
      accentColor: "from-purple-400 to-indigo-500 bg-purple-50 text-indigo-950 border-purple-200"
    },
    {
      id: "oldest_library",
      category: "historia",
      title: "La Biblioteca Activa Más Antigua",
      subtitle: "Monasterio de Santa Catalina",
      fact: "Ubicada en el Monte Sinaí, Egipto, fue fundada entre el año 548 y 565 d.C. por el emperador Justiniano. Ha operado ininterrumpidamente por 15 siglos y alberga tesoros como el 'Codex Sinaiticus' del siglo IV, una de las copias más antiguas de la Biblia.",
      icon: <Globe className="w-5 h-5" />,
      accentColor: "from-emerald-400 to-teal-500 bg-emerald-50 text-teal-950 border-emerald-200"
    },
    {
      id: "smell_science",
      category: "historia",
      title: "¿Por qué huelen tan bien los libros viejos?",
      subtitle: "La ciencia del olor a papel",
      fact: "El característico olor dulce a vainilla y almendras proviene de la degradación de los compuestos químicos orgánicos en las páginas de papel celulosa (lignina) a lo largo del tiempo. Es un aroma químico natural que provoca una profunda nostalgia y confort cerebral.",
      icon: <BookOpen className="w-5 h-5" />,
      accentColor: "from-rose-400 to-pink-500 bg-rose-50 text-rose-950 border-rose-200"
    }
  ];

  const [activeCuratedIndex, setActiveCuratedIndex] = useState(0);

  // 3. AI Query Oracle states
  const [query, setQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Suggested quick prompts
  const suggestions = [
    "¿Qué hito marcó la invención de la imprenta?",
    "¿Cuál es el libro más largo que se ha escrito?",
    "¿Qué es la biblioterapia?",
    "Curiosidades sobre Mary Shelley y Frankenstein"
  ];

  const handleAskAI = async (textToAsk: string) => {
    if (!textToAsk.trim()) return;
    setLoadingAi(true);
    setAiError(null);
    setAiAnswer(null);

    try {
      const response = await fetch("/api/trivia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToAsk }),
      });

      if (!response.ok) {
        throw new Error("Error en la conexión del servidor");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.details || data.error);
      }
      setAiAnswer(data.trivia);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.message || "Error de red o conexión";
      
      if (errorMessage.includes("GEMINI_API_KEY") || errorMessage.includes("required") || errorMessage.includes("key")) {
        setAiError(
          "El Oráculo requiere la clave API de Gemini para funcionar. Por favor, asegúrate de configurar tu 'GEMINI_API_KEY' en la pestaña de Ajustes (Settings) de AI Studio (menú superior izquierdo, icono de engranaje -> Secrets) y luego reinicia la aplicación."
        );
      } else {
        setAiError(
          `El oráculo está experimentando una interferencia temporal (${errorMessage}). Mientras se recupera, aquí tienes un dato de respaldo: ¿Sabías que el primer libro impreso en América fue la 'Escala espiritual para subir al cielo' en México (1539)?`
        );
      }
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSurpriseMe = () => {
    const randomPrompts = [
      "Dame una curiosidad literaria aleatoria y fascinante",
      "Dime un dato curioso sobre algún autor famoso y sus hábitos excéntricos de escritura",
      "¿Cuáles son algunas curiosidades fascinantes sobre la biblioteca del Congreso de EE.UU.?",
      "Dime una curiosidad increíble sobre libros perdidos o censurados en la historia",
      "Cuéntame el dato más curioso sobre la historia de los audiolibros o la lectura en voz alta"
    ];
    const randomIdx = Math.floor(Math.random() * randomPrompts.length);
    setQuery(randomPrompts[randomIdx]);
    handleAskAI(randomPrompts[randomIdx]);
  };

  return (
    <div id="trivia-container" className="flex flex-col h-full bg-[#F9F7F2] overflow-hidden">
      {/* Sticky Header */}
      <div className="p-4 bg-white border-b border-[#E8E4DE] shrink-0">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#C4A484]" />
          <h2 className="text-xl font-serif font-bold italic text-[#3E3C3A]">Alquimia Literaria</h2>
        </div>
        <p className="text-[#8B7E74] text-[10px] uppercase font-mono tracking-widest font-bold mt-1">
          Datos Curiosos, Índices & Oráculo de Inteligencia Artificial
        </p>
      </div>

      {/* Main Content Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-28">
        
        {/* Section 1: Latinoamerica Lee Comparative Index */}
        <div className="bg-white border border-[#E8E4DE] rounded-3xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-1.5 border-b border-[#F5F2ED] pb-2.5">
            <TrendingUp className="w-4 h-4 text-[#C4A484]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8B7E74]">
              ¿Cuánto Lee Latinoamérica al Año?
            </span>
          </div>

          <p className="text-xs text-[#8B7E74] leading-relaxed">
            La cantidad de libros leídos promedio por habitante varía drásticamente. ¡Compara la cantidad de libros que has registrado en tu diario actual con los promedios de la región!
          </p>

          {/* Bar Chart Representation */}
          <div className="space-y-3 pt-2">
            {chartData.map((country) => {
              // Normalized percentage for width (max is Spain 10.3 or user's count, let's dynamic scale max)
              const maxValue = Math.max(11, ...chartData.map(c => c.value));
              const percentage = (country.value / maxValue) * 100;

              return (
                <div key={country.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-medium flex items-center gap-1.5 ${country.isUser ? "text-[#C4A484] font-bold font-serif italic" : "text-[#3E3C3A]"}`}>
                      <span className="text-sm shrink-0">{country.flag}</span>
                      {country.name}
                    </span>
                    <span className={`font-mono text-[11px] font-bold ${country.isUser ? "text-[#C4A484]" : "text-[#8B7E74]"}`}>
                      {country.value.toFixed(country.value % 1 === 0 ? 0 : 1)} {country.value === 1 ? "libro" : "libros"}
                    </span>
                  </div>
                  
                  <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden border border-stone-200/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        country.isUser
                          ? "bg-gradient-to-r from-amber-400 to-[#C4A484]"
                          : "bg-stone-400"
                      }`}
                    ></motion.div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Educational Callout box based on performance */}
          <div className="bg-[#F9F7F2] border border-[#E8E4DE] rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#C4A484]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3E3C3A]">Diagnóstico Lector</span>
            </div>
            <p className="text-[11px] text-[#8B7E74] leading-relaxed">
              {totalBooks === 0 ? (
                "Tu estantería aún está limpia. ¡Registra tu primer libro terminado para comenzar tu viaje y medir tu marca contra los índices de Latinoamérica!"
              ) : totalBooks < 2 ? (
                "Has registrado tus primeros pasos literarios. Estás a la par del promedio anual de Perú. ¡Sigue adelante, cada página cuenta!"
              ) : totalBooks < 5 ? (
                "¡Excelente! Con tu diario superas los índices de Perú y Colombia, aproximándote al promedio de Argentina. Eres un lector activo."
              ) : totalBooks < 10 ? (
                "¡Brillante! Superas el promedio de Chile y Argentina, situándote entre la élite lectora de la región. Tu mente se enriquece día a día."
              ) : (
                "¡Impresionante maestría literaria! Tu lectura está al nivel de los mejores promedios de Europa. Eres un verdadero alquimista de páginas."
              )}
            </p>
          </div>
        </div>

        {/* Section 2: Interactive Habit Simulator */}
        <div className="bg-white border border-[#E8E4DE] rounded-3xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-1.5 border-b border-[#F5F2ED] pb-2.5">
            <Sliders className="w-4 h-4 text-[#C4A484]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8B7E74]">
              Simulador del Hábito Diario
            </span>
          </div>

          <p className="text-xs text-[#8B7E74] leading-relaxed">
            ¿Sabías que leer solo un poco cada día genera un impacto acumulativo enorme? Desliza el control para ver cuántos libros terminarías en un año según tus minutos diarios de lectura.
          </p>

          <div className="space-y-4 py-2">
            {/* Slider control */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#8B7E74] font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#C4A484]" /> Tiempo diario de lectura:
                </span>
                <span className="font-bold text-[#3E3C3A] font-mono text-sm bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                  {dailyMinutes} minutos
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(Number(e.target.value))}
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#C4A484]"
              />
            </div>

            {/* Simulated Projection */}
            <div className="grid grid-cols-2 gap-3 bg-[#F9F7F2] border border-[#E8E4DE] rounded-2xl p-4 text-center">
              <div>
                <span className="block text-[8px] font-mono font-bold text-[#8B7E74] uppercase tracking-wider mb-1">
                  Páginas al Año
                </span>
                <span className="text-xl font-serif font-bold text-[#3E3C3A] italic">
                  {((dailyMinutes * 365) / 1.5).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="block text-[9px] text-[#8B7E74] mt-0.5">Págs aprox</span>
              </div>
              <div className="border-l border-[#E8E4DE]">
                <span className="block text-[8px] font-mono font-bold text-[#8B7E74] uppercase tracking-wider mb-1">
                  Libros Equivalentes
                </span>
                <span className="text-xl font-serif font-bold text-[#C4A484] italic flex items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  {estimatedBooksPerYear}
                </span>
                <span className="block text-[9px] text-[#8B7E74] mt-0.5">Libros / año</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Curated Fact Slider */}
        <div className="bg-white border border-[#E8E4DE] rounded-3xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F5F2ED] pb-2.5">
            <div className="flex items-center gap-1.5">
              <Bookmark className="w-4 h-4 text-[#C4A484]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8B7E74]">
                Récords & Secretos Literarios
              </span>
            </div>
            
            {/* Dots navigation indicator */}
            <div className="flex gap-1">
              {curatedFacts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveCuratedIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors cursor-pointer ${
                    idx === activeCuratedIndex ? "bg-[#C4A484]" : "bg-stone-200"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="relative min-h-[170px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCuratedIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                {/* Fact Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-[#C4A484] px-2 py-0.5 rounded-full bg-[#C4A484]/10 border border-[#C4A484]/20">
                      {curatedFacts[activeCuratedIndex].category}
                    </span>
                    <h3 className="text-base font-serif font-bold italic text-[#3E3C3A] pt-1">
                      {curatedFacts[activeCuratedIndex].title}
                    </h3>
                    <p className="text-[11px] font-mono text-[#8B7E74] font-semibold">
                      {curatedFacts[activeCuratedIndex].subtitle}
                    </p>
                  </div>

                  {/* Fact Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-tr ${curatedFacts[activeCuratedIndex].accentColor}`}>
                    {curatedFacts[activeCuratedIndex].icon}
                  </div>
                </div>

                <p className="text-xs text-[#3E3C3A] leading-relaxed bg-[#F9F7F2]/40 p-3 rounded-2xl border border-[#E8E4DE]/50 font-serif italic">
                  "{curatedFacts[activeCuratedIndex].fact}"
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setActiveCuratedIndex((prev) => (prev + 1) % curatedFacts.length)}
                className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#C4A484] hover:text-[#3E3C3A] cursor-pointer transition-colors"
              >
                <span>Siguiente Curiosidad</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: AI Bookish Oracle */}
        <div className="bg-[#3E3C3A] text-[#F9F7F2] border border-stone-800 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-stone-700 pb-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#C4A484]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-300">
                Oráculo Literario AI
              </span>
            </div>
            
            <button
              onClick={handleSurpriseMe}
              disabled={loadingAi}
              className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase bg-stone-700/60 hover:bg-stone-700 text-[#C4A484] px-2.5 py-1 rounded-full border border-stone-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loadingAi ? "animate-spin" : ""}`} />
              Sorpréndeme
            </button>
          </div>

          <p className="text-xs text-stone-300 leading-relaxed">
            ¿Quieres saber más sobre libros, literatura, índices de lectura de algún país o curiosidades de tu autor preferido? Pregúntale a nuestro Bibliotecario Alquimista.
          </p>

          {/* Prompt Suggestions Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(sug);
                  handleAskAI(sug);
                }}
                disabled={loadingAi}
                className="text-[10px] font-mono text-stone-300 bg-stone-700 hover:bg-stone-600 hover:text-white border border-stone-600/50 px-2.5 py-1 rounded-xl transition-colors text-left cursor-pointer disabled:opacity-50"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Query Bar */}
          <div className="relative mt-2">
            <input
              type="text"
              placeholder="Escribe tu pregunta literaria..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAskAI(query);
              }}
              disabled={loadingAi}
              className="w-full pl-4 pr-12 py-3 bg-stone-800 border border-stone-700 rounded-2xl text-xs text-white placeholder-stone-400 focus:outline-none focus:border-[#C4A484] focus:ring-1 focus:ring-[#C4A484] disabled:opacity-60 transition-colors"
            />
            <button
              onClick={() => handleAskAI(query)}
              disabled={loadingAi || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#C4A484] hover:bg-[#b09172] text-[#3E3C3A] p-2 rounded-xl transition-all disabled:opacity-40 cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* AI Response Display Terminal */}
          <AnimatePresence mode="wait">
            {loadingAi && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-stone-800 border border-stone-700 rounded-2xl p-4 flex flex-col items-center justify-center space-y-2 text-center"
              >
                <div className="w-5 h-5 border-2 border-[#C4A484]/20 border-t-[#C4A484] rounded-full animate-spin"></div>
                <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                  Consultando Códices...
                </p>
              </motion.div>
            )}

            {aiAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-stone-800 border border-[#C4A484]/30 rounded-2xl p-4 space-y-2.5 relative"
              >
                <div className="flex items-center gap-1 text-[9px] font-mono text-[#C4A484] uppercase tracking-wider font-bold">
                  <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Respuesta del Oráculo</span>
                </div>
                <div className="text-xs text-stone-100 font-serif leading-relaxed italic border-l border-[#C4A484]/40 pl-3">
                  "{aiAnswer}"
                </div>
              </motion.div>
            )}

            {aiError && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-stone-800 border border-stone-700 rounded-2xl p-4 text-xs text-stone-300 leading-relaxed font-mono"
              >
                {aiError}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
