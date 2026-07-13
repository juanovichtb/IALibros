import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Book } from "../types";
import { ArrowLeft, Edit2, Trash2, Calendar, BookOpen, Quote, Star, BarChart3, Clock, AlertTriangle, Sparkles } from "lucide-react";
import AestheticCardModal from "./AestheticCardModal";

interface BookDetailViewProps {
  key?: any;
  book: Book;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onBack: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  historia: "Historia / Trama",
  personajes: "Personajes",
  estilo: "Estilo de Escritura",
  disfrute: "Disfrute Personal",
};

export default function BookDetailView({
  book,
  onEdit,
  onDelete,
  onBack,
}: BookDetailViewProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Calculate average rating
  const avgRating = book.ratings && book.ratings.length > 0
    ? book.ratings.reduce((acc, curr) => acc + curr.stars, 0) / book.ratings.length
    : 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      setIsDeleting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${star <= rating ? "fill-amber-500 text-amber-500" : "text-stone-200"}`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/D";
    try {
      const parts = dateStr.split("T")[0].split("-");
      if (parts.length !== 3) return dateStr;
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  const hasCover = book.cover_url && book.cover_url.trim() !== "";

  return (
    <div className="flex flex-col h-full bg-[#F9F7F2]">
      {/* Sticky Top Header */}
      <div className="p-4 bg-white border-b border-[#E8E4DE] flex items-center justify-between shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[#3E3C3A] hover:text-[#C4A484] transition-colors text-xs font-bold font-mono uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        <div className="flex gap-1.5">
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#E8E4DE] hover:border-[#C4A484] text-[#C4A484] hover:bg-[#C4A484]/5 rounded-xl bg-white transition-all cursor-pointer active:scale-95 text-xs font-bold font-mono uppercase tracking-wider"
            title="Diseñar tarjeta estética para Instagram"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Compartir</span>
          </button>
          <button
            onClick={onEdit}
            className="p-2 border border-[#E8E4DE] hover:border-[#C4A484] text-[#3E3C3A] hover:text-[#C4A484] rounded-xl bg-white transition-all cursor-pointer active:scale-95"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 border border-red-100 text-red-500 hover:bg-red-50 rounded-xl bg-white transition-all cursor-pointer active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Overlay Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-3xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl border border-[#E8E4DE] max-w-xs w-full p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center gap-3 text-red-500">
              <div className="bg-red-50 p-2 rounded-full">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-[#3E3C3A] text-base">¿Eliminar libro?</h3>
            </div>
            <p className="text-[#8B7E74] text-xs leading-relaxed">
              ¿Estás seguro de que deseas eliminar <strong>"{book.title}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-3 py-2 border border-[#E8E4DE] text-[#3E3C3A] rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                {isDeleting ? "Borrando..." : "Sí, borrar"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Scrollable Book Details Screen */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-28">
        
        {/* Title, Author & Cover Card */}
        <div className="bg-white rounded-3xl border border-[#E8E4DE] p-5 space-y-4 shadow-2xs flex flex-col items-center text-center">
          
          {/* Visual Book Cover */}
          <div className="aspect-[3/4] w-36 bg-[#F9F7F2] rounded-2xl border border-[#E8E4DE] overflow-hidden shadow-xs flex items-center justify-center relative">
            {hasCover ? (
              <img
                src={book.cover_url}
                alt={book.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 p-3 text-stone-300">
                <BookOpen className="w-10 h-10 text-[#C4A484]/40" />
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold">Sin portada</span>
              </div>
            )}
          </div>

          <div className="space-y-1 w-full">
            <span className="text-[10px] font-mono tracking-widest uppercase bg-[#C4A484]/10 text-[#C4A484] px-2.5 py-0.5 rounded-full border border-[#C4A484]/10 inline-block">
              {book.genre || "Lectura"}
            </span>
            <h1 className="text-xl font-serif font-bold text-[#3E3C3A] leading-tight pt-1 italic">
              {book.title}
            </h1>
            <p className="text-sm text-[#8B7E74] italic">
              por {book.author}
            </p>
          </div>

          {/* Quick specs horizontal list */}
          <div className="grid grid-cols-3 gap-2 w-full pt-2 border-t border-[#F9F7F2] text-[10px] text-[#8B7E74] font-mono uppercase tracking-wider font-semibold">
            <div className="flex flex-col items-center">
              <span className="opacity-50 text-[8px]">PÁGINAS</span>
              <span className="text-neutral-700 font-bold mt-0.5">{book.pages || "N/C"}</span>
            </div>
            <div className="flex flex-col items-center border-x border-[#E8E4DE]/60">
              <span className="opacity-50 text-[8px]">INICIÓ</span>
              <span className="text-neutral-700 font-bold mt-0.5 truncate max-w-[70px]">
                {book.start_date ? formatDate(book.start_date).split(" de ")[0] + " " + formatDate(book.start_date).split(" de ")[1]?.substring(0,3) : "N/D"}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="opacity-50 text-[8px]">TERMINÓ</span>
              <span className="text-neutral-700 font-bold mt-0.5 truncate max-w-[70px]">
                {book.end_date ? formatDate(book.end_date).split(" de ")[0] + " " + formatDate(book.end_date).split(" de ")[1]?.substring(0,3) : "N/D"}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Category Stars Ratings (Bento block) */}
        <div className="bg-white rounded-3xl border border-[#E8E4DE] p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#F9F7F2] pb-3">
            <h3 className="text-xs font-mono tracking-wider text-[#8B7E74] uppercase font-bold flex items-center gap-1">
              <BarChart3 className="w-4 h-4 text-[#C4A484]" /> Calificaciones
            </h3>
            <div className="flex items-center gap-1 bg-[#C4A484]/5 px-2 py-1 rounded-lg border border-[#C4A484]/10">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-mono font-bold text-[#3E3C3A]">
                {avgRating > 0 ? avgRating.toFixed(1) : "N/C"}
              </span>
            </div>
          </div>

          <div className="space-y-3.5">
            {book.ratings && book.ratings.length > 0 ? (
              book.ratings.map((rating) => (
                <div
                  key={rating.category}
                  className="flex justify-between items-center py-0.5"
                >
                  <span className="text-xs font-bold text-[#3E3C3A]">
                    {CATEGORY_LABELS[rating.category] || rating.category}
                  </span>
                  {renderStars(rating.stars)}
                </div>
              ))
            ) : (
              <p className="text-xs text-[#8B7E74] italic">No se han ingresado estrellas en este libro.</p>
            )}
          </div>
        </div>

        {/* Reader Personal Notes (Bento block) */}
        <div className="bg-white rounded-3xl border border-[#E8E4DE] p-5 space-y-3 shadow-2xs">
          <h3 className="text-xs font-mono tracking-wider text-[#8B7E74] uppercase font-bold flex items-center gap-1.5">
            <Quote className="w-4 h-4 text-[#C4A484]" /> Mis Notas y Reseña
          </h3>
          
          {book.notes && book.notes.trim() !== "" ? (
            <div className="bg-[#F9F7F2] border-l-4 border-[#C4A484] p-4 rounded-r-2xl rounded-l-md shadow-2xs">
              <p className="text-[#3E3C3A] text-xs leading-relaxed whitespace-pre-line italic">
                "{book.notes}"
              </p>
            </div>
          ) : (
            <div className="py-4 border border-dashed border-[#E8E4DE] rounded-2xl text-center bg-[#F9F7F2]/30">
              <p className="text-xs text-[#8B7E74]/70 italic">No registraste notas para esta lectura.</p>
            </div>
          )}
        </div>
        
      </div>

      <AnimatePresence>
        {showShareModal && (
          <AestheticCardModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            book={book}
            avgRating={avgRating}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
