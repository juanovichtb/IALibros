import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  Flame, 
  Sparkles, 
  BookOpen, 
  Plus, 
  Loader2, 
  Compass, 
  Check, 
  Copy, 
  AlertCircle, 
  ChevronRight,
  TrendingUp,
  BookMarked
} from "lucide-react";
import { Book } from "../types";
import { getCommunityBooks } from "../firebase";

interface CommunityDashboardProps {
  currentUser: any;
  userBooks: Book[];
  onAddBookDirectly: (bookData: { title: string; author: string; genre: string; cover_url: string; pages: number }) => void;
}

// Hand-curated inspiring books currently in trend
const CURATED_TRENDS = [
  {
    title: "Hábitos Atómicos",
    author: "James Clear",
    genre: "Autoayuda / Productividad",
    cover_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
    pages: 328,
    description: "Pequeños cambios, resultados extraordinarios. Un método sencillo para desarrollar buenos hábitos y eliminar los malos."
  },
  {
    title: "La Sombra del Viento",
    author: "Carlos Ruiz Zafón",
    genre: "Misterio / Ficción histórica",
    cover_url: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400",
    pages: 569,
    description: "Un amanecer de 1945, un muchacho es conducido por su padre a un misterioso lugar oculto en el corazón de Barcelona: el Cementerio de los Libros Olvidados."
  },
  {
    title: "Cien Años de Soledad",
    author: "Gabriel García Márquez",
    genre: "Realismo Mágico",
    cover_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
    pages: 471,
    description: "La épica e inmortal historia de la dinastía Buendía en el místico pueblo de Macondo, donde los milagros y las tragedias se entrelazan."
  }
];

export default function CommunityDashboard({
  currentUser,
  userBooks,
  onAddBookDirectly
}: CommunityDashboardProps) {
  const [communityBooks, setCommunityBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"community" | "trends" | "ai_synopsis">("community");
  
  // AI synopsis states
  const [synopsisSource, setSynopsisSource] = useState<"mis_libros" | "trends" | "comunidad" | "custom">("mis_libros");
  const [selectedSynopsisBook, setSelectedSynopsisBook] = useState<{ title: string; author: string; cover_url?: string; genre?: string } | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customAuthor, setCustomAuthor] = useState("");
  const [generatingSynopsis, setGeneratingSynopsis] = useState(false);
  const [generatedSynopsis, setGeneratedSynopsis] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [synopsisError, setSynopsisError] = useState<string | null>(null);

  // Fetch community books on mount
  useEffect(() => {
    async function loadCommunity() {
      setLoading(true);
      try {
        const list = await getCommunityBooks();
        setCommunityBooks(list);
      } catch (err) {
        console.error("Error cargando libros de la comunidad:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCommunity();
  }, [userBooks]);

  // Extract human-readable username from userId (e.g. nickname_lucas -> Lucas)
  const formatUserNickname = (userId: string) => {
    if (!userId) return "Lector Anónimo";
    if (userId === "guest_local_user") return "Lector Local";
    if (userId.startsWith("nickname_")) {
      const name = userId.replace("nickname_", "");
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return "Lector de la Nube";
  };

  // Filter books current user is reading ("Leyendo")
  const currentlyReadingBooks = useMemo(() => {
    return userBooks.filter(b => b.start_date && !b.end_date);
  }, [userBooks]);

  // Extract trending books dynamically from communityBooks
  const dynamicTrends = useMemo(() => {
    const counts: Record<string, { count: number; book: any }> = {};
    communityBooks.forEach(b => {
      const key = `${b.title.trim().toLowerCase()} - ${b.author.trim().toLowerCase()}`;
      if (counts[key]) {
        counts[key].count += 1;
      } else {
        counts[key] = { count: 1, book: b };
      }
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({
        title: item.book.title,
        author: item.book.author,
        genre: item.book.genre || "Lectura General",
        count: item.count,
        cover_url: item.book.cover_url
      }));
  }, [communityBooks]);

  // Unique community books helper
  const uniqueCommunityBooks = useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];
    communityBooks.forEach(b => {
      const key = `${b.title.trim().toLowerCase()} - ${b.author.trim().toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(b);
      }
    });
    return list;
  }, [communityBooks]);

  // Combined trends list (dynamic trends + curated trends)
  const allTrendsCombined = useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];
    
    // First, add community dynamic trends
    dynamicTrends.forEach(b => {
      const key = `${b.title.trim().toLowerCase()} - ${b.author.trim().toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          title: b.title,
          author: b.author,
          cover_url: b.cover_url,
          genre: b.genre,
          source: "Comunidad"
        });
      }
    });

    // Next, add curated trends
    CURATED_TRENDS.forEach(b => {
      const key = `${b.title.trim().toLowerCase()} - ${b.author.trim().toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          title: b.title,
          author: b.author,
          cover_url: b.cover_url,
          genre: b.genre,
          source: "Recomendado"
        });
      }
    });

    return list;
  }, [dynamicTrends]);

  // Set default book for synopsis when subtab or source category changes
  useEffect(() => {
    if (activeSubTab !== "ai_synopsis") return;

    setGeneratedSynopsis(null);
    setSynopsisError(null);

    if (synopsisSource === "mis_libros") {
      if (currentlyReadingBooks.length > 0) {
        const first = currentlyReadingBooks[0];
        setSelectedSynopsisBook({ title: first.title, author: first.author, cover_url: first.cover_url, genre: first.genre });
      } else {
        setSelectedSynopsisBook(null);
      }
    } else if (synopsisSource === "trends") {
      if (allTrendsCombined.length > 0) {
        const first = allTrendsCombined[0];
        setSelectedSynopsisBook({ title: first.title, author: first.author, cover_url: first.cover_url, genre: first.genre });
      } else {
        setSelectedSynopsisBook(null);
      }
    } else if (synopsisSource === "comunidad") {
      if (uniqueCommunityBooks.length > 0) {
        const first = uniqueCommunityBooks[0];
        setSelectedSynopsisBook({ title: first.title, author: first.author, cover_url: first.cover_url, genre: first.genre });
      } else {
        setSelectedSynopsisBook(null);
      }
    } else if (synopsisSource === "custom") {
      setSelectedSynopsisBook({ title: customTitle, author: customAuthor });
    }
  }, [activeSubTab, synopsisSource, currentlyReadingBooks, allTrendsCombined, uniqueCommunityBooks]);

  // Automatically update selectedSynopsisBook when custom inputs change
  useEffect(() => {
    if (synopsisSource === "custom") {
      setSelectedSynopsisBook({ title: customTitle, author: customAuthor });
    }
  }, [customTitle, customAuthor, synopsisSource]);

  // Generate Synopsis with AI
  const handleGenerateSynopsis = async () => {
    const book = synopsisSource === "custom" 
      ? { title: customTitle, author: customAuthor }
      : selectedSynopsisBook;

    if (!book || !book.title.trim()) {
      setSynopsisError("Por favor ingresa un título de libro.");
      return;
    }
    
    setGeneratingSynopsis(true);
    setGeneratedSynopsis(null);
    setSynopsisError(null);

    try {
      const response = await fetch("/api/synopsis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: book.title,
          author: book.author || "Autor Desconocido"
        })
      });

      if (!response.ok) {
        throw new Error("No se pudo obtener la sinopsis.");
      }

      const data = await response.json();
      setGeneratedSynopsis(data.synopsis);
    } catch (err: any) {
      console.error(err);
      setSynopsisError("No pudimos canalizar la sabiduría del oráculo en este momento. Inténtalo de nuevo.");
    } finally {
      setGeneratingSynopsis(false);
    }
  };

  const handleCopy = () => {
    if (!generatedSynopsis) return;
    navigator.clipboard.writeText(generatedSynopsis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#F9F7F2] overflow-hidden">
      {/* Sticky Header with SubTab Switcher */}
      <div className="p-4 bg-white border-b border-[#E8E4DE] shrink-0 space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#C4A484]/10 rounded-lg text-[#C4A484]">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold italic text-[#3E3C3A]">Orbe de Lectores</h2>
            <p className="text-[10px] text-[#8B7E74] font-mono tracking-wider uppercase">Exploración & Alquimia Literaria</p>
          </div>
        </div>

        {/* Sub-Navigation Buttons */}
        <div className="flex bg-[#F9F7F2] p-1 rounded-2xl border border-[#E8E4DE]">
          <button
            onClick={() => {
              setActiveSubTab("community");
              setGeneratedSynopsis(null);
            }}
            className={`flex-1 py-2 text-[11px] font-bold font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeSubTab === "community"
                ? "bg-[#C4A484] text-white shadow-xs"
                : "text-[#8B7E74] hover:text-[#3E3C3A]"
            }`}
          >
            Comunidad
          </button>
          <button
            onClick={() => {
              setActiveSubTab("trends");
              setGeneratedSynopsis(null);
            }}
            className={`flex-1 py-2 text-[11px] font-bold font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeSubTab === "trends"
                ? "bg-[#C4A484] text-white shadow-xs"
                : "text-[#8B7E74] hover:text-[#3E3C3A]"
            }`}
          >
            Tendencias
          </button>
          <button
            onClick={() => {
              setActiveSubTab("ai_synopsis");
            }}
            className={`flex-1 py-2 text-[11px] font-bold font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeSubTab === "ai_synopsis"
                ? "bg-[#C4A484] text-white shadow-xs"
                : "text-[#8B7E74] hover:text-[#3E3C3A]"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Sinopsis IA</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28 content-start">
        <AnimatePresence mode="wait">
          {/* 1. COMMUNITY FEEDS SUBTAB */}
          {activeSubTab === "community" && (
            <motion.div
              key="community"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Stat Bento card */}
              <div className="bg-white border border-[#E8E4DE] rounded-3xl p-5 shadow-2xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[#8B7E74] uppercase tracking-wider">Actividad en la Nube</span>
                  <p className="text-sm font-serif font-bold text-[#3E3C3A] italic">Santuario compartido</p>
                </div>
                <div className="flex items-center gap-4 text-center">
                  <div className="bg-[#F9F7F2] border border-[#E8E4DE] px-3 py-1.5 rounded-2xl">
                    <span className="block text-lg font-serif font-bold text-[#C4A484]">{communityBooks.length}</span>
                    <span className="text-[8px] font-mono font-bold text-[#8B7E74] uppercase">Registros</span>
                  </div>
                </div>
              </div>

              {/* Feed of books */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B7E74] flex items-center gap-1.5 px-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>Bitácoras de Lectores</span>
                </h3>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-2">
                    <Loader2 className="w-6 h-6 text-[#C4A484] animate-spin" />
                    <p className="text-xs text-[#8B7E74] font-mono">Sincronizando con el orbe...</p>
                  </div>
                ) : communityBooks.length === 0 ? (
                  <div className="bg-white border border-[#E8E4DE] rounded-3xl p-8 text-center space-y-3">
                    <p className="text-xs text-[#8B7E74] leading-relaxed">
                      El orbe de la nube está sereno. ¡Sé el primero en inspirar a la comunidad registrando tus lecturas!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {communityBooks.map((book, idx) => {
                      const isReading = book.start_date && !book.end_date;
                      const hasCover = book.cover_url && book.cover_url.trim() !== "";
                      const readerName = formatUserNickname(book.userId);

                      return (
                        <motion.div
                          key={book.id || idx}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                          className="bg-white border border-[#E8E4DE] rounded-3xl p-4 flex gap-4 hover:border-[#C4A484]/40 transition-all shadow-3xs relative overflow-hidden"
                        >
                          {/* Mini visual state flag */}
                          <div className="absolute top-0 right-0">
                            {isReading ? (
                              <span className="bg-amber-500/10 text-amber-800 border-l border-b border-[#E8E4DE] rounded-bl-xl px-2.5 py-1 text-[8px] font-mono font-bold uppercase tracking-widest flex items-center gap-1 animate-pulse">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                Leyendo
                              </span>
                            ) : (
                              <span className="bg-emerald-500/10 text-emerald-800 border-l border-b border-[#E8E4DE] rounded-bl-xl px-2.5 py-1 text-[8px] font-mono font-bold uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                Terminado
                              </span>
                            )}
                          </div>

                          {/* Cover Thumbnail */}
                          <div className="w-12 h-16 bg-[#D1CCC5] rounded-xl flex-shrink-0 flex items-center justify-center text-[8px] uppercase font-bold text-white/80 relative overflow-hidden shadow-3xs border border-[#E8E4DE]">
                            {hasCover ? (
                              <img
                                src={book.cover_url}
                                alt={book.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <BookOpen className="w-4 h-4 text-white/50" />
                            )}
                          </div>

                          {/* Text Detail */}
                          <div className="flex-1 space-y-1.5 min-w-0 pr-16">
                            <div>
                              <p className="text-xs font-serif font-bold text-[#3E3C3A] leading-snug truncate">
                                {book.title}
                              </p>
                              <p className="text-[10px] text-[#8B7E74] truncate">
                                por {book.author}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-mono font-bold text-[#C4A484] bg-[#C4A484]/10 px-2 py-0.5 rounded-full">
                                @{readerName}
                              </span>
                              {book.genre && (
                                <span className="text-[9px] font-mono text-[#8B7E74] bg-[#F9F7F2] px-2 py-0.5 rounded-full truncate max-w-[100px]">
                                  {book.genre}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 2. TRENDS SUBTAB */}
          {activeSubTab === "trends" && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Dynamic Trends Section */}
              {dynamicTrends.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B7E74] flex items-center gap-1.5 px-1">
                    <TrendingUp className="w-4 h-4 text-[#C4A484]" />
                    <span>Más Registrados por la Comunidad</span>
                  </h3>
                  <div className="bg-white border border-[#E8E4DE] rounded-3xl p-5 space-y-3.5 shadow-2xs">
                    {dynamicTrends.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-[#F9F7F2] pb-2.5 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-[#C4A484] w-5">#{idx + 1}</span>
                          <div>
                            <p className="text-xs font-bold text-[#3E3C3A]">{t.title}</p>
                            <p className="text-[10px] text-[#8B7E74]">por {t.author}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                          {t.count} {t.count === 1 ? "lector" : "lectores"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hand-curated literary trends */}
              <div className="space-y-4">
                <div className="space-y-1 px-1">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B7E74] flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span>Lecturas en Tendencia Global</span>
                  </h3>
                  <p className="text-[10px] text-[#8B7E74] leading-relaxed">
                    Las obras del momento recomendadas para ampliar tus horizontes. Haz clic en el botón de agregar para sumarlos directamente a tu biblioteca.
                  </p>
                </div>

                <div className="space-y-3">
                  {CURATED_TRENDS.map((trend, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -2 }}
                      className="bg-white border border-[#E8E4DE] rounded-3xl p-4 flex gap-4 shadow-3xs hover:border-[#C4A484]/40 transition-all relative overflow-hidden"
                    >
                      {/* Cover preview */}
                      <div className="w-16 h-22 bg-[#D1CCC5] rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden relative shadow-3xs border border-[#E8E4DE]">
                        <img
                          src={trend.cover_url}
                          alt={trend.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info & action */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] font-mono font-bold uppercase text-[#C4A484] bg-[#C4A484]/10 px-2 py-0.5 rounded-full truncate">
                              {trend.genre}
                            </span>
                            <span className="text-[8px] font-mono text-[#8B7E74] shrink-0">
                              {trend.pages} págs
                            </span>
                          </div>
                          <p className="text-xs font-serif font-bold text-[#3E3C3A] leading-tight truncate">
                            {trend.title}
                          </p>
                          <p className="text-[10px] text-[#8B7E74] truncate">
                            por {trend.author}
                          </p>
                          <p className="text-[10px] text-[#8B7E74]/70 leading-relaxed line-clamp-2 pt-0.5">
                            {trend.description}
                          </p>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => {
                              onAddBookDirectly({
                                title: trend.title,
                                author: trend.author,
                                genre: trend.genre.split(" / ")[0],
                                cover_url: trend.cover_url,
                                pages: trend.pages
                              });
                            }}
                            className="flex items-center gap-1.5 bg-[#3E3C3A] hover:bg-[#2D2926] text-white text-[10px] font-bold font-mono uppercase tracking-widest px-3.5 py-1.5 rounded-full cursor-pointer transition-all active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Añadir a mi lista</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. AI SYNOPSIS COMPANION SUBTAB */}
          {activeSubTab === "ai_synopsis" && (
            <motion.div
              key="ai_synopsis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Introduction card */}
              <div className="bg-white border border-[#E8E4DE] rounded-3xl p-5 space-y-2.5 shadow-2xs">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#C4A484] bg-[#C4A484]/10 px-2.5 py-1 rounded-full inline-block">
                  Alquimia de Sinopsis con IA
                </span>
                <p className="text-xs text-[#8B7E74] leading-relaxed">
                  ¿Quieres explorar un nuevo libro o inspirarte con lecturas populares? Selecciona un libro de tu biblioteca, de las tendencias de la comunidad o ingresa uno personalizado, y la IA canalizará una sinopsis mágica, hermosa y libre de spoilers.
                </p>
              </div>

              {/* Source Selector (mis_libros, trends, comunidad, custom) */}
              <div className="flex bg-white p-1 rounded-2xl border border-[#E8E4DE] overflow-x-auto scrollbar-none gap-1">
                <button
                  onClick={() => setSynopsisSource("mis_libros")}
                  className={`flex-1 py-1.5 px-3 text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    synopsisSource === "mis_libros"
                      ? "bg-[#C4A484] text-white"
                      : "text-[#8B7E74] hover:text-[#3E3C3A] hover:bg-[#F9F7F2]"
                  }`}
                >
                  Mis Lecturas ({currentlyReadingBooks.length})
                </button>
                <button
                  onClick={() => setSynopsisSource("trends")}
                  className={`flex-1 py-1.5 px-3 text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    synopsisSource === "trends"
                      ? "bg-[#C4A484] text-white"
                      : "text-[#8B7E74] hover:text-[#3E3C3A] hover:bg-[#F9F7F2]"
                  }`}
                >
                  Tendencias ({allTrendsCombined.length})
                </button>
                <button
                  onClick={() => setSynopsisSource("comunidad")}
                  className={`flex-1 py-1.5 px-3 text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    synopsisSource === "comunidad"
                      ? "bg-[#C4A484] text-white"
                      : "text-[#8B7E74] hover:text-[#3E3C3A] hover:bg-[#F9F7F2]"
                  }`}
                >
                  Comunidad ({uniqueCommunityBooks.length})
                </button>
                <button
                  onClick={() => setSynopsisSource("custom")}
                  className={`flex-1 py-1.5 px-3 text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    synopsisSource === "custom"
                      ? "bg-[#C4A484] text-white"
                      : "text-[#8B7E74] hover:text-[#3E3C3A] hover:bg-[#F9F7F2]"
                  }`}
                >
                  Buscador
                </button>
              </div>

              {/* Source-specific view */}
              <div className="space-y-3">
                {/* A. MIS LIBROS */}
                {synopsisSource === "mis_libros" && (
                  currentlyReadingBooks.length === 0 ? (
                    <div className="bg-white border border-[#E8E4DE] rounded-3xl p-6 text-center space-y-3">
                      <BookMarked className="w-8 h-8 text-[#C4A484]/40 mx-auto" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-[#3E3C3A]">No tienes lecturas activas</p>
                        <p className="text-[10px] text-[#8B7E74] leading-relaxed max-w-xs mx-auto">
                          Marca algún libro como "Leyendo" con una fecha de inicio en tu biblioteca, o selecciona la pestaña de <strong>Tendencias</strong> para explorar obras populares.
                        </p>
                      </div>
                      <button
                        onClick={() => setSynopsisSource("trends")}
                        className="text-[10px] text-[#C4A484] hover:text-[#B39373] font-bold font-mono uppercase tracking-widest bg-[#C4A484]/10 hover:bg-[#C4A484]/15 px-4 py-2 rounded-full transition-all cursor-pointer mt-2"
                      >
                        Ver Libros en Tendencia
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#8B7E74] block px-1">
                        Desliza y selecciona una de tus lecturas activas:
                      </span>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
                        {currentlyReadingBooks.map((book, idx) => {
                          const isSelected = selectedSynopsisBook?.title === book.title;
                          return (
                            <button
                              key={book.id || idx}
                              onClick={() => {
                                setSelectedSynopsisBook({ title: book.title, author: book.author, cover_url: book.cover_url, genre: book.genre });
                                setGeneratedSynopsis(null);
                                setSynopsisError(null);
                              }}
                              className={`flex-shrink-0 w-32 p-2.5 rounded-2xl border text-left transition-all snap-start ${
                                isSelected 
                                  ? "border-[#C4A484] bg-[#C4A484]/5 shadow-sm scale-98" 
                                  : "border-[#E8E4DE] bg-white hover:border-stone-300"
                              }`}
                            >
                              <div className="w-full aspect-[3/4] bg-[#D1CCC5] rounded-xl overflow-hidden mb-2 relative shadow-3xs border border-[#E8E4DE]/60">
                                {book.cover_url ? (
                                  <img src={book.cover_url} alt={book.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                                    <BookOpen className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              <p className="text-[10px] font-bold text-[#3E3C3A] truncate leading-tight">{book.title}</p>
                              <p className="text-[9px] text-[#8B7E74] truncate">{book.author}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}

                {/* B. TRENDS */}
                {synopsisSource === "trends" && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#8B7E74] block px-1">
                      Selecciona un libro popular del momento:
                    </span>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
                      {allTrendsCombined.map((book, idx) => {
                        const isSelected = selectedSynopsisBook?.title === book.title;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedSynopsisBook({ title: book.title, author: book.author, cover_url: book.cover_url, genre: book.genre });
                              setGeneratedSynopsis(null);
                              setSynopsisError(null);
                            }}
                            className={`flex-shrink-0 w-32 p-2.5 rounded-2xl border text-left transition-all snap-start relative ${
                              isSelected 
                                ? "border-[#C4A484] bg-[#C4A484]/5 shadow-sm scale-98" 
                                : "border-[#E8E4DE] bg-white hover:border-stone-300"
                            }`}
                          >
                            <span className="absolute top-1.5 right-1.5 bg-[#C4A484] text-white text-[6px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full z-10">
                              {book.source}
                            </span>
                            <div className="w-full aspect-[3/4] bg-[#D1CCC5] rounded-xl overflow-hidden mb-2 relative shadow-3xs border border-[#E8E4DE]/60">
                              {book.cover_url ? (
                                <img src={book.cover_url} alt={book.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-400">
                                  <BookOpen className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-[#3E3C3A] truncate leading-tight">{book.title}</p>
                            <p className="text-[9px] text-[#8B7E74] truncate">{book.author}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* C. COMUNIDAD */}
                {synopsisSource === "comunidad" && (
                  uniqueCommunityBooks.length === 0 ? (
                    <div className="bg-white border border-[#E8E4DE] rounded-3xl p-6 text-center space-y-3">
                      <p className="text-xs text-[#8B7E74]">Aún no hay registros de otros lectores en la comunidad.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#8B7E74] block px-1">
                        Selecciona un libro compartido por otros lectores:
                      </span>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
                        {uniqueCommunityBooks.map((book, idx) => {
                          const isSelected = selectedSynopsisBook?.title === book.title;
                          return (
                            <button
                              key={book.id || idx}
                              onClick={() => {
                                setSelectedSynopsisBook({ title: book.title, author: book.author, cover_url: book.cover_url, genre: book.genre });
                                setGeneratedSynopsis(null);
                                setSynopsisError(null);
                              }}
                              className={`flex-shrink-0 w-32 p-2.5 rounded-2xl border text-left transition-all snap-start ${
                                isSelected 
                                  ? "border-[#C4A484] bg-[#C4A484]/5 shadow-sm scale-98" 
                                  : "border-[#E8E4DE] bg-white hover:border-stone-300"
                              }`}
                            >
                              <div className="w-full aspect-[3/4] bg-[#D1CCC5] rounded-xl overflow-hidden mb-2 relative shadow-3xs border border-[#E8E4DE]/60">
                                {book.cover_url ? (
                                  <img src={book.cover_url} alt={book.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                                    <BookOpen className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              <p className="text-[10px] font-bold text-[#3E3C3A] truncate leading-tight">{book.title}</p>
                              <p className="text-[9px] text-[#8B7E74] truncate">{book.author}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}

                {/* D. CUSTOM */}
                {synopsisSource === "custom" && (
                  <div className="bg-white border border-[#E8E4DE] rounded-3xl p-5 space-y-3 shadow-3xs">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#8B7E74] block">
                      Escribe el libro de tu elección:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase font-bold text-[#8B7E74]">Título del Libro</label>
                        <input
                          type="text"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder="Ej: El Alquimista"
                          className="w-full px-3.5 py-2 bg-[#F9F7F2] border border-[#E8E4DE] rounded-xl text-xs text-[#3E3C3A] focus:outline-none focus:ring-1 focus:ring-[#C4A484]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase font-bold text-[#8B7E74]">Autor</label>
                        <input
                          type="text"
                          value={customAuthor}
                          onChange={(e) => setCustomAuthor(e.target.value)}
                          placeholder="Ej: Paulo Coelho"
                          className="w-full px-3.5 py-2 bg-[#F9F7F2] border border-[#E8E4DE] rounded-xl text-xs text-[#3E3C3A] focus:outline-none focus:ring-1 focus:ring-[#C4A484]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Selection Summary Panel & Generation Action */}
              {selectedSynopsisBook && (
                <div className="bg-white border border-[#E8E4DE] rounded-3xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-14 bg-[#D1CCC5] rounded-lg overflow-hidden relative shadow-3xs flex-shrink-0">
                      {selectedSynopsisBook.cover_url ? (
                        <img src={selectedSynopsisBook.cover_url} alt={selectedSynopsisBook.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                          <BookOpen className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-[#C4A484]">Libro Seleccionado</span>
                      <h4 className="font-serif text-sm font-bold text-[#3E3C3A] italic leading-tight truncate">
                        {selectedSynopsisBook.title || "Escribe un título..."}
                      </h4>
                      <p className="text-[10px] text-[#8B7E74] truncate">
                        de {selectedSynopsisBook.author || "Autor..."}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateSynopsis}
                    disabled={generatingSynopsis || (synopsisSource === "custom" && !customTitle.trim())}
                    className="w-full flex items-center justify-center gap-2 bg-[#C4A484] hover:bg-[#B39373] text-white py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer active:scale-98 disabled:opacity-40 shadow-xs"
                  >
                    {generatingSynopsis ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Invocando sabiduría del Oráculo de IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white animate-pulse" />
                        <span>Generar Sinopsis con IA</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Error display */}
              {synopsisError && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
                  <p className="leading-relaxed">{synopsisError}</p>
                </div>
              )}

              {/* Generated result panel */}
              <AnimatePresence>
                {generatedSynopsis && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white border-2 border-[#C4A484]/20 rounded-3xl p-5 space-y-4 shadow-2xs relative"
                  >
                    {/* Decorative parchment look */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <button
                        onClick={handleCopy}
                        className="p-2 rounded-xl bg-white hover:bg-stone-50 border border-[#E8E4DE] text-[#8B7E74] hover:text-[#3E3C3A] transition-colors cursor-pointer"
                        title="Copiar Sinopsis"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-[#8B7E74]">
                        Sinopsis Poética & Libre de Spoilers
                      </span>
                      <h4 className="font-serif text-sm font-bold text-[#3E3C3A] italic leading-tight">
                        {selectedSynopsisBook?.title}
                      </h4>
                      <p className="text-[10px] text-[#8B7E74]">
                        de {selectedSynopsisBook?.author}
                      </p>
                    </div>

                    <div className="text-xs text-[#5D5750] leading-relaxed font-serif italic border-l-2 border-[#C4A484] pl-3.5 py-2 bg-[#F9F7F2]/50 rounded-r-xl">
                      {generatedSynopsis.split("\n").map((line, idx) => (
                        <p key={idx} className="mb-2 last:mb-0">{line}</p>
                      ))}
                    </div>

                    <div className="text-[9px] font-mono text-[#8B7E74]/70 text-center">
                      • Generado de forma segura y libre de spoilers para tu goce literario •
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
