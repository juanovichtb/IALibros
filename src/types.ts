/**
 * Types for "Mi Diario de Lectura"
 */

export interface Reader {
  id: string | number;
  name: string;
  created_at?: string;
}

export interface BookRating {
  id?: string | number;
  book_id?: string | number;
  category: string; // 'historia' | 'personajes' | 'estilo' | 'disfrute' | string
  stars: number; // 1 to 5
}

export interface Book {
  id: string | number;
  reader_id: string | number;
  title: string;
  author: string;
  pages?: number;
  cover_url?: string;
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
  genre?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  ratings?: BookRating[];
}
