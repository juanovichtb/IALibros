import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { motion } from "motion/react";
import { Book, BookRating } from "../types";
import { Star, Upload, Link, Info, Save, X } from "lucide-react";

interface BookFormViewProps {
  key?: any;
  bookToEdit?: Book | null;
  onSave: (bookData: any) => Promise<void>;
  onCancel: () => void;
}

const GENRE_SUGGESTIONS = [
  "Ficción",
  "Fantasía",
  "Ciencia Ficción",
  "Misterio",
  "Novela Histórica",
  "Biografía",
  "Ensayo",
  "Autoayuda",
  "Poesía",
  "Terror",
  "Divulgación"
];

const RATING_CATEGORIES = [
  { id: "historia", label: "Historia / Trama", desc: "Qué tan enganchante es la historia" },
  { id: "personajes", label: "Personajes", desc: "Desarrollo y empatía de los protagonistas" },
  { id: "estilo", label: "Estilo de Escritura", desc: "La prosa, el vocabulario y ritmo" },
  { id: "disfrute", label: "Disfrute Personal", desc: "Tu conexión emocional general" }
];

export default function BookFormView({
  bookToEdit,
  onSave,
  onCancel,
}: BookFormViewProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [genre, setGenre] = useState("");
  const [notes, setNotes] = useState("");
  
  // Ratings state
  const [ratings, setRatings] = useState<Record<string, number>>({
    historia: 5,
    personajes: 5,
    estilo: 5,
    disfrute: 5,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [coverSourceMode, setCoverSourceMode] = useState<"url" | "upload">("url");

  // Populate form if editing
  useEffect(() => {
    if (bookToEdit) {
      setTitle(bookToEdit.title || "");
      setAuthor(bookToEdit.author || "");
      setPages(bookToEdit.pages != null ? bookToEdit.pages.toString() : "");
      setCoverUrl(bookToEdit.cover_url || "");
      setGenre(bookToEdit.genre || "");
      setNotes(bookToEdit.notes || "");
      
      if (bookToEdit.start_date) {
        setStartDate(bookToEdit.start_date.split("T")[0] || "");
      } else {
        setStartDate("");
      }
      if (bookToEdit.end_date) {
        setEndDate(bookToEdit.end_date.split("T")[0] || "");
      } else {
        setEndDate("");
      }

      if (bookToEdit.ratings) {
        const ratingsMap: Record<string, number> = {};
        bookToEdit.ratings.forEach((r) => {
          if (r && r.category) {
            ratingsMap[r.category] = r.stars;
          }
        });
        setRatings({
          historia: ratingsMap.historia || 5,
          personajes: ratingsMap.personajes || 5,
          estilo: ratingsMap.estilo || 5,
          disfrute: ratingsMap.disfrute || 5,
        });
      }
    } else {
      // Clear form
      setTitle("");
      setAuthor("");
      setPages("");
      setCoverUrl("");
      setStartDate("");
      setEndDate("");
      setGenre("");
      setNotes("");
      setRatings({
        historia: 5,
        personajes: 5,
        estilo: 5,
        disfrute: 5,
      });
    }
  }, [bookToEdit]);

  const handleRatingChange = (category: string, stars: number) => {
    setRatings((prev) => ({
      ...prev,
      [category]: stars,
    }));
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFormError("La imagen debe pesar menos de 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Str = uploadEvent.target?.result as string;
      setCoverUrl(base64Str);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      setFormError("El título y el autor son obligatorios.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    const bookRatings: BookRating[] = Object.entries(ratings).map(([category, stars]) => ({
      category,
      stars: Number(stars),
    }));

    const bookPayload: any = {
      title: title.trim(),
      author: author.trim(),
      pages: pages.trim() ? Number(pages) : null,
      cover_url: coverUrl.trim(),
      start_date: startDate || null,
      end_date: endDate || null,
      genre: genre.trim() || null,
      notes: notes.trim() || null,
      ratings: bookRatings,
    };

    if (bookToEdit) {
      bookPayload.id = bookToEdit.id;
    }

    try {
      await onSave(bookPayload);
    } catch (err: any) {
      setFormError(err.message || "Error al guardar el libro.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F9F7F2]">
      {/* Sticky Top Header */}
      <div className="p-4 bg-white border-b border-[#E8E4DE] flex items-center justify-between shrink-0">
        <h2 className="text-xl font-serif font-bold italic text-[#3E3C3A]">
          {bookToEdit ? "Editar Libro" : "Registrar Libro"}
        </h2>
        <button 
          onClick={onCancel}
          className="p-1.5 rounded-full hover:bg-neutral-100 text-[#8B7E74]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Form Body */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-6 pb-28">
        {formError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
            {formError}
          </div>
        )}

        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B7E74] mb-1">
              Título del Libro <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej. Cien años de soledad"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8E4DE] rounded-xl text-sm text-[#3E3C3A] focus:ring-1 focus:ring-[#C4A484] focus:border-[#C4A484] focus:outline-none"
              required
            />
          </div>

          {/* Autor */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B7E74] mb-1">
              Autor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej. Gabriel García Márquez"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8E4DE] rounded-xl text-sm text-[#3E3C3A] focus:ring-1 focus:ring-[#C4A484] focus:border-[#C4A484] focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Páginas */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B7E74] mb-1">
                Páginas
              </label>
              <input
                type="number"
                placeholder="Ej. 496"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8E4DE] rounded-xl text-sm text-[#3E3C3A] focus:ring-1 focus:ring-[#C4A484] focus:border-[#C4A484] focus:outline-none"
                min="0"
              />
            </div>

            {/* Género */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B7E74] mb-1">
                Género
              </label>
              <input
                type="text"
                list="genre-suggestions"
                placeholder="Ej. Ficción"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E8E4DE] rounded-xl text-sm text-[#3E3C3A] focus:ring-1 focus:ring-[#C4A484] focus:border-[#C4A484] focus:outline-none"
              />
              <datalist id="genre-suggestions">
                {GENRE_SUGGESTIONS.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Fecha Inicio */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B7E74] mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#E8E4DE] rounded-xl text-xs text-[#3E3C3A] focus:ring-1 focus:ring-[#C4A484] focus:outline-none"
              />
            </div>

            {/* Fecha Fin */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B7E74] mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#E8E4DE] rounded-xl text-xs text-[#3E3C3A] focus:ring-1 focus:ring-[#C4A484] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Portada Cover Image Block */}
        <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#E8E4DE]">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8B7E74]">
            Imagen de Portada
          </span>

          <div className="flex bg-[#F9F7F2] p-0.5 rounded-xl border border-[#E8E4DE]">
            <button
              type="button"
              onClick={() => setCoverSourceMode("url")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                coverSourceMode === "url" ? "bg-white text-[#C4A484] shadow-2xs" : "text-[#8B7E74]"
              }`}
            >
              <Link className="w-3 h-3" />
              <span>Dirección URL</span>
            </button>
            <button
              type="button"
              onClick={() => setCoverSourceMode("upload")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                coverSourceMode === "upload" ? "bg-white text-[#C4A484] shadow-2xs" : "text-[#8B7E74]"
              }`}
            >
              <Upload className="w-3 h-3" />
              <span>Subir Archivo</span>
            </button>
          </div>

          {coverSourceMode === "url" ? (
            <input
              type="text"
              placeholder="Pega la dirección URL de la imagen..."
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E8E4DE] rounded-xl text-xs text-[#3E3C3A] focus:outline-none focus:ring-1 focus:ring-[#C4A484]"
            />
          ) : (
            <div className="border border-dashed border-[#E8E4DE] rounded-xl p-4 text-center bg-[#F9F7F2]/50 relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-5 h-5 text-[#8B7E74] mx-auto mb-1" />
              <span className="text-xs font-semibold text-[#3E3C3A] block">Haz clic para subir imagen</span>
              <span className="text-[9px] text-[#8B7E74] block">Soporta PNG, JPG menor a 2MB</span>
            </div>
          )}

          {coverUrl && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="aspect-[3/4] w-20 bg-[#F9F7F2] rounded-lg border border-[#E8E4DE] overflow-hidden relative shadow-2xs">
                <img
                  src={coverUrl}
                  alt="Vista previa"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <button 
                type="button"
                onClick={() => setCoverUrl("")}
                className="text-xs text-red-500 font-semibold"
              >
                Quitar portada
              </button>
            </div>
          )}
        </div>

        {/* Categorized Stars Ratings */}
        <div className="space-y-4 bg-white p-4 rounded-2xl border border-[#E8E4DE]">
          <div className="flex items-center justify-between">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8B7E74]">
              Calificaciones
            </span>
            <span className="text-[9px] bg-[#F9F7F2] border border-[#E8E4DE] px-2 py-0.5 rounded-full text-[#8B7E74] flex items-center gap-1 font-mono">
              <Info className="w-3 h-3" /> 1 a 5 estrellas
            </span>
          </div>

          <div className="space-y-4">
            {RATING_CATEGORIES.map((category) => {
              const currentStars = ratings[category.id] || 5;

              return (
                <div key={category.id} className="border-b border-[#F9F7F2] pb-3 last:border-none last:pb-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-[#3E3C3A]">{category.label}</span>
                    <span className="text-xs font-mono font-bold text-[#C4A484]">{currentStars} / 5</span>
                  </div>
                  
                  {/* Rating Stars Row */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingChange(category.id, star)}
                          className="p-1 hover:scale-115 transition-transform"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= currentStars ? "fill-amber-400 text-amber-400" : "text-stone-200"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes input */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B7E74]">
            Notas y reseñas personales (Opcional)
          </label>
          <textarea
            placeholder="Escribe tus fragmentos favoritos, opiniones o notas del libro..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 bg-white border border-[#E8E4DE] rounded-xl text-xs text-[#3E3C3A] focus:ring-1 focus:ring-[#C4A484] focus:border-[#C4A484] focus:outline-none min-h-[100px]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 border border-[#E8E4DE] text-[#3E3C3A] hover:bg-neutral-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-[#3E3C3A] hover:bg-[#2D2926] text-white py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:bg-neutral-300"
          >
            <Save className="w-4 h-4 text-[#C4A484]" />
            <span>{isSubmitting ? "Guardando..." : "Guardar libro"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
