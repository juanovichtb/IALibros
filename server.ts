import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { db } from "./database.js"; // note: using relative import or native ts imports

dotenv.config();

async function startServer() {
  // Initialize database
  await db.init();

  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // 1. READERS ENDPOINTS
  // GET /api/readers - List all readers
  app.get("/api/readers", async (req, res) => {
    try {
      const readers = await db.getReaders();
      res.json(readers);
    } catch (error: any) {
      console.error("Error en GET /api/readers:", error);
      res.status(500).json({ error: "Error al obtener los lectores", details: error.message });
    }
  });

  // POST /api/readers - Create a new reader
  app.post("/api/readers", async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || name.trim() === "") {
        return res.status(400).json({ error: "El nombre del lector es obligatorio" });
      }
      const newReader = await db.createReader(name.trim());
      res.status(201).json(newReader);
    } catch (error: any) {
      console.error("Error en POST /api/readers:", error);
      res.status(500).json({ error: "Error al crear el lector", details: error.message });
    }
  });


  // 2. BOOKS ENDPOINTS
  // GET /api/books?readerId=1 - List all books of a reader
  app.get("/api/books", async (req, res) => {
    try {
      const readerId = req.query.readerId;
      if (!readerId) {
        return res.status(400).json({ error: "El parámetro readerId es obligatorio" });
      }
      const books = await db.getBooks(Number(readerId));
      res.json(books);
    } catch (error: any) {
      console.error("Error en GET /api/books:", error);
      res.status(500).json({ error: "Error al obtener los libros", details: error.message });
    }
  });

  // GET /api/books/:id - Detail of a book with its ratings
  app.get("/api/books/:id", async (req, res) => {
    try {
      const bookId = Number(req.params.id);
      if (isNaN(bookId)) {
        return res.status(400).json({ error: "ID de libro inválido" });
      }
      const book = await db.getBook(bookId);
      if (!book) {
        return res.status(404).json({ error: "Libro no encontrado" });
      }
      res.json(book);
    } catch (error: any) {
      console.error(`Error en GET /api/books/${req.params.id}:`, error);
      res.status(500).json({ error: "Error al obtener el detalle del libro", details: error.message });
    }
  });

  // POST /api/books - Create a new book and its ratings
  app.post("/api/books", async (req, res) => {
    try {
      const {
        readerId,
        title,
        author,
        pages,
        coverUrl,
        startDate,
        endDate,
        genre,
        notes,
        ratings,
      } = req.body;

      if (!readerId) {
        return res.status(400).json({ error: "El ID del lector es obligatorio" });
      }
      if (!title || title.trim() === "") {
        return res.status(400).json({ error: "El título del libro es obligatorio" });
      }
      if (!author || author.trim() === "") {
        return res.status(400).json({ error: "El autor del libro es obligatorio" });
      }

      const bookData = {
        readerId: Number(readerId),
        title: title.trim(),
        author: author.trim(),
        pages: pages ? Number(pages) : 0,
        coverUrl: coverUrl || "",
        startDate: startDate || null,
        endDate: endDate || null,
        genre: genre || "",
        notes: notes || "",
      };

      const newBook = await db.createBook(bookData, ratings || []);
      res.status(201).json(newBook);
    } catch (error: any) {
      console.error("Error en POST /api/books:", error);
      res.status(500).json({ error: "Error al registrar el libro", details: error.message });
    }
  });

  // PUT /api/books/:id - Update a book and its ratings
  app.put("/api/books/:id", async (req, res) => {
    try {
      const bookId = Number(req.params.id);
      if (isNaN(bookId)) {
        return res.status(400).json({ error: "ID de libro inválido" });
      }

      const {
        readerId,
        title,
        author,
        pages,
        coverUrl,
        startDate,
        endDate,
        genre,
        notes,
        ratings,
      } = req.body;

      if (!readerId) {
        return res.status(400).json({ error: "El ID del lector es obligatorio" });
      }
      if (!title || title.trim() === "") {
        return res.status(400).json({ error: "El título del libro es obligatorio" });
      }
      if (!author || author.trim() === "") {
        return res.status(400).json({ error: "El autor del libro es obligatorio" });
      }

      const bookData = {
        readerId: Number(readerId),
        title: title.trim(),
        author: author.trim(),
        pages: pages ? Number(pages) : 0,
        coverUrl: coverUrl || "",
        startDate: startDate || null,
        endDate: endDate || null,
        genre: genre || "",
        notes: notes || "",
      };

      const updatedBook = await db.updateBook(bookId, bookData, ratings || []);
      res.json(updatedBook);
    } catch (error: any) {
      console.error(`Error en PUT /api/books/${req.params.id}:`, error);
      res.status(500).json({ error: "Error al actualizar el libro", details: error.message });
    }
  });

  // DELETE /api/books/:id - Delete a book and its ratings
  app.delete("/api/books/:id", async (req, res) => {
    try {
      const bookId = Number(req.params.id);
      if (isNaN(bookId)) {
        return res.status(400).json({ error: "ID de libro inválido" });
      }

      const deleted = await db.deleteBook(bookId);
      if (!deleted) {
        return res.status(404).json({ error: "Libro no encontrado" });
      }

      res.json({ success: true, message: "Libro eliminado con éxito" });
    } catch (error: any) {
      console.error(`Error en DELETE /api/books/${req.params.id}:`, error);
      res.status(500).json({ error: "Error al eliminar el libro", details: error.message });
    }
  });

  // 3. INFORMATION ENDPOINTS
  app.get("/api/db-info", (req, res) => {
    res.json({
      type: db.isMySQL() ? "MySQL (Producción / Local)" : "JSON Local Fallback (AI Studio Preview)",
      status: "conectado",
    });
  });

  // Vite Integration for Serving Frontend
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Servidor corriendo en http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Error fatal al iniciar el servidor:", err);
});
