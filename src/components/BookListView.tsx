import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, BookMarked, Star, Filter, SlidersHorizontal, BookOpen, Plus } from "lucide-react";
import { Book } from "../types";

interface BookListViewProps {
  books: Book[];
  onSelectBook: (id: string | number) => void;
  onAddBookClick: () => void;
}

export default function BookListView({
  books,
  onSelectBook,
  onAddBookClick,
}: BookListViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Get unique genres for filter
  const genres = useMemo(() => {
    const list = books.map((b) => b.genre?.trim()).filter(Boolean) as string[];
    return Array.from(new Set(list)).sort();
  }, [books]);

  // Filter books
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchSearch =
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase());

      const matchGenre = !selectedGenre || book.genre === selectedGenre;

      return matchSearch && matchGenre;
    });
  }, [books, searchTerm, selectedGenre]);

  // Calculate average rating
  const getAverageRating = (book: Book) => {
    if (!book.ratings || book.ratings.length === 0) return 0;
    const sum = book.ratings.reduce((acc, curr) => acc + curr.stars, 0);
    return sum / book.ratings.length;
  };

  // Format star rating
  const renderStars = (rating: number) => {
    const rounded = Math.round(rating);
    return (
      <div className="flex items-center gap-0.5 text-amber-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${star <= rounded ? "fill-amber-500 text-amber-500" : "text-stone-300"}`}
          />
        ))}
        {rating > 0 && (
          <span className="text-[10px] text-[#8B7E74] ml-1 font-bold font-mono">
            {rating.toFixed(1)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div id="book-list-container" className="flex flex-col h-full bg-[#F9F7F2] overflow-hidden">
      {/* Sticky Header with Search */}
      <div className="p-4 bg-white border-b border-[#E8E4DE] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold italic text-[#3E3C3A]">Mi Biblioteca</h2>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl border transition-all ${
              showFilters || selectedGenre 
                ? "bg-[#C4A484]/15 border-[#C4A484] text-[#3E3C3A]" 
                : "border-[#E8E4DE] text-[#8B7E74]"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B7E74] w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por título o autor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F9F7F2] border border-[#E8E4DE] rounded-xl text-sm text-[#3E3C3A] placeholder-[#8B7E74]/60 focus:outline-none focus:ring-1 focus:ring-[#C4A484] focus:border-[#C4A484] transition-colors"
          />
        </div>

        {/* Dropdown Filters (Collapsible) */}
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-2"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#8B7E74]" />
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#F9F7F2] border border-[#E8E4DE] rounded-xl text-xs text-[#3E3C3A] focus:outline-none focus:ring-1 focus:ring-[#C4A484]"
              >
                <option value="">Todos los géneros</option>
                {genres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {selectedGenre && (
                <button 
                  onClick={() => setSelectedGenre("")}
                  className="text-xs text-[#C4A484] font-medium px-2 py-1"
                >
                  Limpiar
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Scrollable Book Cards Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book, index) => {
            const hasCover = book.cover_url && book.cover_url.trim() !== "";
            const avgRating = getAverageRating(book);

            return (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                onClick={() => onSelectBook(book.id)}
                className="flex p-3 bg-white rounded-2xl border border-[#E8E4DE] hover:border-[#C4A484] transition-all cursor-pointer active:scale-99 shadow-2xs"
              >
                {/* Book cover thumbnail */}
                <div className="w-11 h-15 bg-[#D1CCC5] rounded-lg shadow-2xs mr-3 flex-shrink-0 flex items-center justify-center text-[8px] uppercase font-bold text-white/80 relative overflow-hidden">
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

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#3E3C3A] leading-tight line-clamp-1">
                      {book.title}
                    </h4>
                    <p className="text-xs text-[#8B7E74] italic truncate">{book.author}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] bg-[#F9F7F2] border border-[#E8E4DE] px-1.5 py-0.5 rounded-md text-[#8B7E74] uppercase font-mono font-bold tracking-tight">
                      {book.genre || "Lectura"}
                    </span>
                    <div>
                      {avgRating > 0 ? (
                        renderStars(avgRating)
                      ) : (
                        <span className="text-[10px] text-[#8B7E74]/60 font-mono">Sin calificar</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <BookMarked className="w-12 h-12 text-[#8B7E74]/40 mb-3" />
            <h3 className="font-serif font-bold text-[#3E3C3A] text-base mb-1">
              {books.length === 0 ? "Biblioteca vacía" : "No se encontraron libros"}
            </h3>
            <p className="text-[#8B7E74] text-xs max-w-xs mx-auto mb-5 leading-relaxed">
              {books.length === 0
                ? "Empieza a registrar las portadas, calificaciones por categorías y notas de tus lecturas."
                : "Prueba modificando el filtro de género o la búsqueda."}
            </p>
            {books.length === 0 && (
              <button
                onClick={onAddBookClick}
                className="bg-[#3E3C3A] hover:bg-[#2D2926] text-white px-5 py-3 rounded-2xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar primer libro</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
