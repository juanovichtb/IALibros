import { useMemo } from "react";
import { motion } from "motion/react";
import { Book } from "../types";
import { BarChart3, BookOpen, Layers, Award, Sparkles, Star } from "lucide-react";

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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
        
        {/* Row 1: Greeting & Quote Card */}
        <div className="bg-white border border-[#E8E4DE] rounded-3xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#C4A484]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Inspiración de hoy</span>
          </div>
          <p className="text-[#3E3C3A] font-serif text-sm italic leading-relaxed">
            {randomQuote}
          </p>
        </div>

        {/* Row 2: Grid of Counters */}
        <div className="grid grid-cols-2 gap-3">
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

        {/* Row 3: Goal progress radial mockup */}
        <div className="bg-white border border-[#E8E4DE] p-5 rounded-3xl shadow-2xs space-y-3">
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
        <div className="bg-white border border-[#E8E4DE] p-5 rounded-3xl shadow-2xs space-y-3">
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
        <div className="bg-white border border-[#E8E4DE] p-5 rounded-3xl shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-[#8B7E74] font-mono font-bold">Género Predilecto</span>
            <h3 className="text-lg font-serif font-bold text-[#3E3C3A] mt-1 italic">{topGenre}</h3>
          </div>
          <div className="bg-[#3E3C3A] text-white p-3 rounded-2xl shadow-2xs">
            <BookOpen className="w-5 h-5 text-[#C4A484]" />
          </div>
        </div>

      </div>
    </div>
  );
}
