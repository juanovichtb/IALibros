import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const JSON_DB_FILE = path.join(process.cwd(), "diario_lectura.json");

// Structure for JSON fallback database
interface JsonDbSchema {
  readers: Array<{ id: number; name: string; created_at: string }>;
  books: Array<{
    id: number;
    reader_id: number;
    title: string;
    author: string;
    pages: number;
    cover_url: string;
    start_date: string | null;
    end_date: string | null;
    genre: string;
    notes: string;
    created_at: string;
    updated_at: string;
  }>;
  book_ratings: Array<{
    id: number;
    book_id: number;
    category: string;
    stars: number;
  }>;
}

// Global pool variable
let pool: mysql.Pool | null = null;
let useJsonDb = false;

// Initialize Database Connection
async function initDb() {
  const hasEnv = process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME;

  if (hasEnv) {
    try {
      console.log(`[DB] Intentando conectar a MySQL en ${process.env.DB_HOST}...`);
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || "3306"),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      // Test connection
      const connection = await pool.getConnection();
      console.log("[DB] Conexión exitosa a MySQL.");
      connection.release();

      // Ensure tables exist on MySQL if connected
      await ensureMySqlTables();
      return;
    } catch (err: any) {
      console.error("[DB] Error al conectar a MySQL:", err.message);
      console.log("[DB] Usando fallback de base de datos JSON local.");
      useJsonDb = true;
    }
  } else {
    console.log("[DB] No se detectaron variables de entorno para MySQL. Usando base de datos JSON local.");
    useJsonDb = true;
  }

  // Initialize JSON database if needed
  ensureJsonDbFile();
}

// Ensure MySQL tables exist (useful for easy setups)
async function ensureMySqlTables() {
  if (!pool) return;
  try {
    console.log("[DB] Verificando y creando tablas de MySQL si no existen...");
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS readers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reader_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        pages INT DEFAULT 0,
        cover_url VARCHAR(1024),
        start_date DATE,
        end_date DATE,
        genre VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (reader_id) REFERENCES readers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS book_ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        book_id INT NOT NULL,
        category VARCHAR(100) NOT NULL,
        stars TINYINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log("[DB] Tablas de MySQL listas.");
  } catch (error: any) {
    console.error("[DB] Error al inicializar tablas en MySQL:", error.message);
  }
}

// Helpers for JSON database
function ensureJsonDbFile() {
  if (!fs.existsSync(JSON_DB_FILE)) {
    const initialDb: JsonDbSchema = {
      readers: [
        { id: 1, name: "Lector Principal", created_at: new Date().toISOString() }
      ],
      books: [],
      book_ratings: []
    };
    fs.writeFileSync(JSON_DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8");
    console.log("[DB] Archivo de base de datos JSON creado:", JSON_DB_FILE);
  }
}

function readJsonDb(): JsonDbSchema {
  ensureJsonDbFile();
  try {
    const content = fs.readFileSync(JSON_DB_FILE, "utf-8");
    return JSON.parse(content) as JsonDbSchema;
  } catch (err) {
    console.error("[DB] Error al leer la base de datos JSON, reiniciando:", err);
    return { readers: [], books: [], book_ratings: [] };
  }
}

function writeJsonDb(data: JsonDbSchema) {
  fs.writeFileSync(JSON_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Expose Database API
export const db = {
  async init() {
    await initDb();
  },

  isMySQL() {
    return !useJsonDb && pool !== null;
  },

  // GET READERS
  async getReaders() {
    if (this.isMySQL() && pool) {
      const [rows] = await pool.query("SELECT * FROM readers ORDER BY id ASC");
      return rows as any[];
    } else {
      const data = readJsonDb();
      return data.readers;
    }
  },

  // CREATE READER
  async createReader(name: string) {
    if (this.isMySQL() && pool) {
      const [result] = await pool.query("INSERT INTO readers (name) VALUES (?)", [name]);
      const insertId = (result as any).insertId;
      return { id: insertId, name, created_at: new Date().toISOString() };
    } else {
      const data = readJsonDb();
      const newId = data.readers.length > 0 ? Math.max(...data.readers.map(r => r.id)) + 1 : 1;
      const newReader = { id: newId, name, created_at: new Date().toISOString() };
      data.readers.push(newReader);
      writeJsonDb(data);
      return newReader;
    }
  },

  // GET BOOKS BY READER
  async getBooks(readerId: number) {
    if (this.isMySQL() && pool) {
      // Fetch books and average rating in a single query
      const query = `
        SELECT b.*, 
               COALESCE(AVG(r.stars), 0) as average_rating
        FROM books b
        LEFT JOIN book_ratings r ON b.id = r.book_id
        WHERE b.reader_id = ?
        GROUP BY b.id
        ORDER BY b.id DESC
      `;
      const [rows] = await pool.query(query, [readerId]);
      return rows as any[];
    } else {
      const data = readJsonDb();
      const filteredBooks = data.books.filter(b => b.reader_id === Number(readerId));
      
      // Calculate averages
      return filteredBooks.map(book => {
        const ratings = data.book_ratings.filter(r => r.book_id === book.id);
        const avg = ratings.length > 0 
          ? ratings.reduce((acc, curr) => acc + curr.stars, 0) / ratings.length 
          : 0;
        return {
          ...book,
          average_rating: parseFloat(avg.toFixed(2))
        };
      }).sort((a, b) => b.id - a.id);
    }
  },

  // GET BOOK BY ID WITH RATINGS
  async getBook(bookId: number) {
    if (this.isMySQL() && pool) {
      const [books] = await pool.query("SELECT * FROM books WHERE id = ?", [bookId]);
      const bookList = books as any[];
      if (bookList.length === 0) return null;

      const [ratings] = await pool.query("SELECT id, category, stars FROM book_ratings WHERE book_id = ?", [bookId]);
      return {
        ...bookList[0],
        ratings: ratings as any[]
      };
    } else {
      const data = readJsonDb();
      const book = data.books.find(b => b.id === Number(bookId));
      if (!book) return null;

      const ratings = data.book_ratings
        .filter(r => r.book_id === Number(bookId))
        .map(r => ({ id: r.id, category: r.category, stars: r.stars }));

      return {
        ...book,
        ratings
      };
    }
  },

  // CREATE BOOK WITH RATINGS
  async createBook(bookData: {
    readerId: number;
    title: string;
    author: string;
    pages?: number;
    coverUrl?: string;
    startDate?: string;
    endDate?: string;
    genre?: string;
    notes?: string;
  }, ratings: Array<{ category: string; stars: number }>) {
    if (this.isMySQL() && pool) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const insertBookQuery = `
          INSERT INTO books 
            (reader_id, title, author, pages, cover_url, start_date, end_date, genre, notes) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [bookResult] = await connection.query(insertBookQuery, [
          bookData.readerId,
          bookData.title,
          bookData.author,
          bookData.pages || 0,
          bookData.coverUrl || "",
          bookData.startDate || null,
          bookData.endDate || null,
          bookData.genre || "",
          bookData.notes || ""
        ]);

        const bookId = (bookResult as any).insertId;

        if (ratings && ratings.length > 0) {
          const insertRatingQuery = `INSERT INTO book_ratings (book_id, category, stars) VALUES (?, ?, ?)`;
          for (const rating of ratings) {
            await connection.query(insertRatingQuery, [bookId, rating.category, rating.stars]);
          }
        }

        await connection.commit();
        return { id: bookId, ...bookData, ratings };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } else {
      const data = readJsonDb();
      const bookId = data.books.length > 0 ? Math.max(...data.books.map(b => b.id)) + 1 : 1;
      
      const newBook = {
        id: bookId,
        reader_id: Number(bookData.readerId),
        title: bookData.title,
        author: bookData.author,
        pages: Number(bookData.pages || 0),
        cover_url: bookData.coverUrl || "",
        start_date: bookData.startDate || null,
        end_date: bookData.endDate || null,
        genre: bookData.genre || "",
        notes: bookData.notes || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      data.books.push(newBook);

      if (ratings && ratings.length > 0) {
        let ratingId = data.book_ratings.length > 0 ? Math.max(...data.book_ratings.map(r => r.id)) + 1 : 1;
        for (const rating of ratings) {
          data.book_ratings.push({
            id: ratingId++,
            book_id: bookId,
            category: rating.category,
            stars: Number(rating.stars)
          });
        }
      }

      writeJsonDb(data);
      return { ...newBook, ratings };
    }
  },

  // UPDATE BOOK WITH RATINGS
  async updateBook(bookId: number, bookData: {
    readerId: number;
    title: string;
    author: string;
    pages?: number;
    coverUrl?: string;
    startDate?: string;
    endDate?: string;
    genre?: string;
    notes?: string;
  }, ratings: Array<{ category: string; stars: number }>) {
    if (this.isMySQL() && pool) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const updateBookQuery = `
          UPDATE books 
          SET reader_id = ?, title = ?, author = ?, pages = ?, cover_url = ?, start_date = ?, end_date = ?, genre = ?, notes = ?, updated_at = NOW()
          WHERE id = ?
        `;
        
        await connection.query(updateBookQuery, [
          bookData.readerId,
          bookData.title,
          bookData.author,
          bookData.pages || 0,
          bookData.coverUrl || "",
          bookData.startDate || null,
          bookData.endDate || null,
          bookData.genre || "",
          bookData.notes || "",
          bookId
        ]);

        // Delete old ratings
        await connection.query("DELETE FROM book_ratings WHERE book_id = ?", [bookId]);

        // Insert new ratings
        if (ratings && ratings.length > 0) {
          const insertRatingQuery = `INSERT INTO book_ratings (book_id, category, stars) VALUES (?, ?, ?)`;
          for (const rating of ratings) {
            await connection.query(insertRatingQuery, [bookId, rating.category, rating.stars]);
          }
        }

        await connection.commit();
        return { id: bookId, ...bookData, ratings };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } else {
      const data = readJsonDb();
      const bookIndex = data.books.findIndex(b => b.id === Number(bookId));
      if (bookIndex === -1) throw new Error("Libro no encontrado");

      data.books[bookIndex] = {
        ...data.books[bookIndex],
        reader_id: Number(bookData.readerId),
        title: bookData.title,
        author: bookData.author,
        pages: Number(bookData.pages || 0),
        cover_url: bookData.coverUrl || "",
        start_date: bookData.startDate || null,
        end_date: bookData.endDate || null,
        genre: bookData.genre || "",
        notes: bookData.notes || "",
        updated_at: new Date().toISOString()
      };

      // Remove old ratings
      data.book_ratings = data.book_ratings.filter(r => r.book_id !== Number(bookId));

      // Add new ratings
      if (ratings && ratings.length > 0) {
        let ratingId = data.book_ratings.length > 0 ? Math.max(...data.book_ratings.map(r => r.id)) + 1 : 1;
        for (const rating of ratings) {
          data.book_ratings.push({
            id: ratingId++,
            book_id: Number(bookId),
            category: rating.category,
            stars: Number(rating.stars)
          });
        }
      }

      writeJsonDb(data);
      return { id: Number(bookId), ...bookData, ratings };
    }
  },

  // DELETE BOOK
  async deleteBook(bookId: number) {
    if (this.isMySQL() && pool) {
      const [result] = await pool.query("DELETE FROM books WHERE id = ?", [bookId]);
      return (result as any).affectedRows > 0;
    } else {
      const data = readJsonDb();
      const originalLength = data.books.length;
      data.books = data.books.filter(b => b.id !== Number(bookId));
      data.book_ratings = data.book_ratings.filter(r => r.book_id !== Number(bookId));
      writeJsonDb(data);
      return data.books.length < originalLength;
    }
  }
};
