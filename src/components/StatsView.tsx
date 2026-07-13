import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Book } from "../types";
import { BarChart3, BookOpen, Layers, Award, Sparkles, Star, Compass, Feather, Lock, Trophy, X } from "lucide-react";

interface StatsViewProps {
  books: Book[];
}

const INSIGHTS_QUOTES = [
  "«Un libro es como un jardín que se lleva en el bolsillo». — Proverbio",
  "«Leemos para saber que no estamos solos». — C.S. Lewis",
  "«La lectura es a la mente lo que el ejercicio al cuerpo». — Joseph Addison",
  "«Un libro debe ser el hacha que rompa el mar helado que hay dentro de nosotros». — Franz Kafka"
];

export default function StatsView({ books }: StatsViewProps) {
  // 1. Total books
  const totalBooks = books.length;

  // 2. Total pages read
  const totalPages = useMemo(() => {
    return books.reduce((acc, curr) => acc + (curr.pages ? Number(curr.pages) : 0), 0);
  }, [books]);

  // Selected Badge State for Detail Modal
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);

  // Dynamic Badge Calculations
  const uniqueGenresCount = useMemo(() => {
    const genres = new Set(books.map(b => b.genre?.trim().toLowerCase()).filter(Boolean));
    return genres.size;
  }, [books]);

  const deepNotesCount = useMemo(() => {
    return books.filter(b => b.notes && b.notes.trim().length >= 100).length;
  }, [books]);

  const hasPerfectBook = useMemo(() => {
    return books.some(b => b.ratings && b.ratings.some(r => r.stars === 5));
  }, [books]);

  const badges = useMemo(() => {
    return [
      {
        id: "first_book",
        name: "Primera Alquimia",
        description: "¡Has encendido la chispa de la lectura al registrar tu primer libro!",
        icon: "sparkles",
        unlocked: totalBooks >= 1,
        progress: Math.min(totalBooks, 1),
        target: 1,
        progressText: `${Math.min(totalBooks, 1)} / 1 libro`,
        rarity: "Común",
        colorClass: "from-emerald-400 to-teal-500 text-teal-950 bg-emerald-50 border-emerald-200"
      },
      {
        id: "book_devourer",
        name: "Devorador de Tinta",
        description: "Tu estantería empieza a cobrar vida. ¡Sigue devorando grandes historias!",
        icon: "book",
        unlocked: totalBooks >= 5,
        progress: Math.min(totalBooks, 5),
        target: 5,
        progressText: `${totalBooks} / 5 libros`,
        rarity: "Común",
        colorClass: "from-blue-400 to-indigo-500 text-indigo-950 bg-blue-50 border-blue-200"
      },
      {
        id: "page_master",
        name: "Señor del Tiempo",
        description: "Mil páginas de mundos paralelos, personajes memorables y hermosas reflexiones.",
        icon: "layers",
        unlocked: totalPages >= 1000,
        progress: Math.min(totalPages, 1000),
        target: 1000,
        progressText: `${totalPages.toLocaleString()} / 1,000 págs`,
        rarity: "Raro",
        colorClass: "from-purple-400 to-fuchsia-500 text-fuchsia-950 bg-purple-50 border-purple-200"
      },
      {
        id: "genre_explorer",
        name: "Viajero Multiverso",
        description: "No te quedas en un solo lugar. Exploras diferentes universos literarios.",
        icon: "compass",
        unlocked: uniqueGenresCount >= 3,
        progress: Math.min(uniqueGenresCount, 3),
        target: 3,
        progressText: `${uniqueGenresCount} / 3 géneros`,
        rarity: "Raro",
        colorClass: "from-amber-400 to-orange-500 text-orange-950 bg-amber-50 border-amber-200"
      },
      {
        id: "perfect_score",
        name: "Crítico de Élite",
        description: "Has calificado una obra maestra con 5 estrellas perfectas en algún atributo.",
        icon: "star",
        unlocked: hasPerfectBook,
        progress: hasPerfectBook ? 1 : 0,
        target: 1,
        progressText: hasPerfectBook ? "¡Conseguido!" : "0 / 1 libro perfecto",
        rarity: "Épico",
        colorClass: "from-pink-400 to-rose-500 text-rose-950 bg-pink-50 border-pink-200"
      },
      {
        id: "deep_writer",
        name: "Pluma de Oro",
        description: "Escribes pensamientos profundos (notas de más de 100 letras) en tus registros literarios.",
        icon: "feather",
        unlocked: deepNotesCount >= 2,
        progress: Math.min(deepNotesCount, 2),
        target: 2,
        progressText: `${deepNotesCount} / 2 notas detalladas`,
        rarity: "Legendario",
        colorClass: "from-yellow-400 to-amber-500 text-amber-950 bg-yellow-50 border-yellow-200"
      }
    ];
  }, [totalBooks, totalPages, uniqueGenresCount, hasPerfectBook, deepNotesCount]);

  const unlockedBadgesCount = useMemo(() => {
    return badges.filter(b => b.unlocked).length;
  }, [badges]);

  // 3. Average ratings by category
  const categoryAverages = useMemo(() => {
    const sums: Record<string, number> = { historia: 0, personajes: 0, estilo: 0, disfrute: 0 };
    const counts: Record<string, number> = { historia: 0, personajes: 0, estilo: 0, disfrute: 0 };

    books.forEach((book) => {
      book.ratings?.forEach((rating) => {
        if (sums[rating.category] !== undefined) {
          sums[rating.category] += rating.stars;
          counts[rating.category] += 1;
        }
      });
    });

    const avgs: Record<string, number> = {};
    Object.keys(sums).forEach((cat) => {
      avgs[cat] = counts[cat] > 0 ? sums[cat] / counts[cat] : 0;
    });

    return avgs;
  }, [books]);

  // 4. Most popular genre
  const topGenre = useMemo(() => {
    if (books.length === 0) return "Ninguno";
    const genresMap: Record<string, number> = {};
    books.forEach((b) => {
      if (b.genre) {
        genresMap[b.genre] = (genresMap[b.genre] || 0) + 1;
      }
    });

    let bestGenre = "Ninguno";
    let maxCount = 0;
    Object.entries(genresMap).forEach(([g, count]) => {
      if (count > maxCount) {
        maxCount = count;
        bestGenre = g;
      }
    });

    return bestGenre;
  }, [books]);

  // Get a random quote based on the number of books read
  const randomQuote = useMemo(() => {
    const index = books.length % INSIGHTS_QUOTES.length;
    return INSIGHTS_QUOTES[index];
  }, [books.length]);

  const readingGoal = 12; // Default mobile goal
  const goalPercent = Math.min(100, Math.round((totalBooks / readingGoal) * 100));

  return (
    <div className="flex flex-col h-full bg-[#F9F7F2] overflow-hidden">
      {/* Sticky Header */}
      <div className="p-4 bg-white border-b border-[#E8E4DE] shrink-0">
        <h2 className="text-xl font-serif font-bold italic text-[#3E3C3A]">Mis Estadísticas</h2>
      </div>

      {/* Scrollable Stats Bento Blocks */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4 pb-28 content-start">
        
        {/* Row 1: Greeting & Quote Card */}
        <div className="bg-white border border-[#E8E4DE] rounded-3xl p-5 shadow-2xs space-y-2 md:col-span-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#C4A484]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Inspiración de hoy</span>
          </div>
          <p className="text-[#3E3C3A] font-serif text-sm italic leading-relaxed">
            {randomQuote}
          </p>
        </div>

        {/* Row 2: Grid of Counters */}
        <div className="grid grid-cols-2 gap-3 md:col-span-2">
          {/* Total Books read */}
          <div className="bg-[#2D2926] text-[#F9F7F2] p-4 rounded-3xl flex flex-col justify-between h-28 shadow-xs">
            <span className="text-[9px] uppercase tracking-wider opacity-60 font-mono font-bold">Libros Leídos</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-serif font-bold">{totalBooks}</span>
              <span className="text-[10px] opacity-50 font-mono">ejem.</span>
            </div>
            <div className="flex items-center gap-1.5 opacity-80 text-[10px]">
              <BookOpen className="w-3 h-3 text-[#C4A484]" />
              <span>Colección activa</span>
            </div>
          </div>

          {/* Total Pages Read */}
          <div className="bg-white border border-[#E8E4DE] p-4 rounded-3xl flex flex-col justify-between h-28 shadow-2xs">
            <span className="text-[9px] uppercase tracking-wider text-[#8B7E74] font-mono font-bold">Páginas Leídas</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-serif font-bold text-[#3E3C3A]">{totalPages.toLocaleString()}</span>
              <span className="text-[9px] text-[#8B7E74] font-mono">págs.</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#8B7E74] text-[10px]">
              <Layers className="w-3 h-3 text-[#C4A484]" />
              <span>Hojas recorridas</span>
            </div>
          </div>
        </div>

        {/* Medallas de Lectura (Achievements) Section */}
        <div className="bg-white border border-[#E8E4DE] rounded-3xl p-5 shadow-2xs space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#C4A484]" />
              <span className="text-[10px] uppercase tracking-wider text-[#8B7E74] font-mono font-bold">Mis Medallas de Lectura</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#C4A484] bg-[#C4A484]/10 px-2.5 py-1 rounded-full border border-[#C4A484]/20 uppercase tracking-wider">
              {unlockedBadgesCount} de {badges.length} Desbloqueadas
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {badges.map((badge) => {
              const getBadgeIcon = (iconName: string) => {
                switch (iconName) {
                  case "sparkles": return <Sparkles className="w-5 h-5" />;
                  case "book": return <BookOpen className="w-5 h-5" />;
                  case "layers": return <Layers className="w-5 h-5" />;
                  case "compass": return <Compass className="w-5 h-5" />;
                  case "star": return <Star className="w-5 h-5" />;
                  case "feather": return <Feather className="w-5 h-5" />;
                  default: return <Award className="w-5 h-5" />;
                }
              };

              return (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all relative group cursor-pointer ${
                    badge.unlocked 
                      ? "bg-white border-[#E8E4DE] hover:border-[#C4A484] hover:shadow-xs" 
                      : "bg-[#F9F7F2]/50 border-[#E8E4DE]/50 opacity-65 hover:opacity-85"
                  }`}
                >
                  {/* Badge Circle Ornament */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center relative transition-all duration-300 ${
                    badge.unlocked 
                      ? `bg-gradient-to-tr ${badge.colorClass} shadow-xs group-hover:scale-105` 
                      : "bg-stone-100 text-stone-400 border border-stone-200"
                  }`}>
                    {getBadgeIcon(badge.icon)}
                    
                    {!badge.unlocked && (
                      <div className="absolute -bottom-1 -right-1 bg-white border border-stone-200 text-stone-400 p-0.5 rounded-full shadow-2xs">
                        <Lock className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] font-bold text-[#3E3C3A] text-center mt-2 truncate max-w-full">
                    {badge.name}
                  </span>
                  
                  <span className={`text-[8px] font-mono font-bold mt-1 px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                    badge.unlocked 
                      ? "bg-emerald-50 text-emerald-700" 
                      : "bg-stone-100 text-stone-400"
                  }`}>
                    {badge.unlocked ? "Obtenido" : "Bloqueado"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Goal progress radial mockup */}
        <div className="bg-white border border-[#E8E4DE] p-5 rounded-3xl shadow-2xs space-y-3 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8B7E74] font-mono font-bold">Meta Anual</span>
            <span className="text-xs font-mono font-bold text-[#3E3C3A]">{totalBooks} de {readingGoal}</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Simple Horizontal Progress Bar */}
            <div className="flex-1 space-y-1">
              <div className="w-full h-2.5 bg-[#F9F7F2] border border-[#E8E4DE] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#C4A484] rounded-full transition-all duration-500" 
                  style={{ width: `${goalPercent}%` }}
                ></div>
              </div>
              <p className="text-[9px] text-[#8B7E74] text-right font-mono font-bold uppercase tracking-wider">
                {goalPercent}% completado
              </p>
            </div>

            <div className="bg-[#C4A484]/10 p-2.5 rounded-2xl border border-[#C4A484]/20 text-[#C4A484]">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Row 4: Ratings Breakdown */}
        <div className="bg-white border border-[#E8E4DE] p-5 rounded-3xl shadow-2xs space-y-3 md:col-span-1">
          <span className="text-[10px] uppercase tracking-wider text-[#8B7E74] font-mono font-bold flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-[#C4A484]" /> Promedio por Atributo
          </span>

          <div className="space-y-2.5">
            {[
              { id: "historia", label: "Historia / Trama" },
              { id: "personajes", label: "Personajes" },
              { id: "estilo", label: "Estilo" },
              { id: "disfrute", label: "Disfrute" }
            ].map((cat) => {
              const avg = categoryAverages[cat.id] || 0;
              const pct = (avg / 5) * 100;

              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#3E3C3A]">{cat.label}</span>
                    <div className="flex items-center gap-1 text-[#8B7E74] font-mono">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{avg > 0 ? avg.toFixed(1) : "N/C"}</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-[#F9F7F2] border border-[#E8E4DE] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 rounded-full" 
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 5: Favorite Genre Bento Block */}
        <div className="bg-white border border-[#E8E4DE] p-5 rounded-3xl shadow-2xs flex items-center justify-between md:col-span-2">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-[#8B7E74] font-mono font-bold">Género Predilecto</span>
            <h3 className="text-lg font-serif font-bold text-[#3E3C3A] mt-1 italic">{topGenre}</h3>
          </div>
          <div className="bg-[#3E3C3A] text-white p-3 rounded-2xl shadow-2xs">
            <BookOpen className="w-5 h-5 text-[#C4A484]" />
          </div>
        </div>

      </div>

      {/* Badge Detail Modal Overlay */}
      <AnimatePresence>
        {selectedBadge && (
          <div id="badge-detail-modal" className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-[#E8E4DE] shadow-2xl p-6 max-w-sm w-full text-center relative font-sans text-[#3E3C3A]"
            >
              <button
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 p-1.5 hover:bg-stone-100 rounded-full transition-colors cursor-pointer text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-4 pt-2">
                {/* Rarity Tag */}
                <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border inline-block ${
                  selectedBadge.rarity === "Legendario"
                    ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                    : selectedBadge.rarity === "Épico"
                    ? "bg-pink-50 text-pink-700 border-pink-200"
                    : selectedBadge.rarity === "Raro"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-stone-50 text-stone-600 border-stone-200"
                }`}>
                  Medalla {selectedBadge.rarity}
                </span>

                {/* Badge Circle inside modal */}
                <div className="flex justify-center py-2">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center relative shadow-md bg-gradient-to-tr ${
                    selectedBadge.unlocked
                      ? selectedBadge.colorClass
                      : "from-stone-100 to-stone-200 text-stone-400 border border-stone-300"
                  }`}>
                    {selectedBadge.unlocked ? (
                      <Trophy className="w-10 h-10 text-amber-500" />
                    ) : (
                      <Lock className="w-8 h-8 text-stone-400" />
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-serif font-bold italic">{selectedBadge.name}</h3>
                  <p className="text-xs text-[#8B7E74] max-w-xs mx-auto leading-relaxed">
                    {selectedBadge.description}
                  </p>
                </div>

                {/* Progress bar inside detail */}
                <div className="bg-[#F9F7F2] border border-[#E8E4DE] rounded-2xl p-3.5 space-y-2 text-left">
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase tracking-wider text-[#8B7E74]">
                    <span>Progreso del Logro</span>
                    <span>{selectedBadge.progressText}</span>
                  </div>

                  <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        selectedBadge.unlocked ? "bg-[#C4A484]" : "bg-stone-400"
                      }`}
                      style={{ width: `${Math.min(100, (selectedBadge.progress / selectedBadge.target) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {selectedBadge.unlocked ? (
                  <div className="pt-2 text-xs font-serif italic text-emerald-700 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#C4A484]" />
                    <span>¡Logro desbloqueado con orgullo!</span>
                  </div>
                ) : (
                  <p className="pt-2 text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                    Sigue leyendo y registrando libros para obtenerla
                  </p>
                )}

                <button
                  onClick={() => setSelectedBadge(null)}
                  className="w-full bg-[#3E3C3A] hover:bg-[#2D2926] text-[#F9F7F2] py-3 rounded-2xl font-bold text-xs transition-colors cursor-pointer mt-2"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
