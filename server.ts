import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { db } from "./database.js"; // note: using relative import or native ts imports
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Lazy initialize Gemini client to avoid crashes if API key is missing on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

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

  // POST /api/trivia - Query Gemini for interesting literary facts and lore with a smart local database fallback
  app.post("/api/trivia", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({ error: "El prompt es obligatorio" });
    }

    const lowercasePrompt = prompt.toLowerCase();
    let localAnswer = "";

    // Comprehensive Local Knowledge Base (Alchemist Codex)
    if (lowercasePrompt.includes("peru") || lowercasePrompt.includes("perú") || lowercasePrompt.includes("latinoamerica") || lowercasePrompt.includes("latinoamérica") || lowercasePrompt.includes("chile") || lowercasePrompt.includes("colombia") || lowercasePrompt.includes("argentina") || lowercasePrompt.includes("índice") || lowercasePrompt.includes("indice") || lowercasePrompt.includes("país") || lowercasePrompt.includes("pais")) {
      localAnswer = "El índice de lectura en nuestra región es un reto hermoso: mientras en Chile se lee un promedio de 5.4 libros al año y en España 10.3, en Perú y Colombia ronda entre 1.2 y 1.9. ¡Cada página que registras en tu diario es una victoria para elevar estas cifras!";
    } else if (lowercasePrompt.includes("caro") || lowercasePrompt.includes("precio") || lowercasePrompt.includes("costo") || lowercasePrompt.includes("da vinci") || lowercasePrompt.includes("leicester")) {
      localAnswer = "El Codex Leicester de Leonardo da Vinci es el más costoso de la historia, adquirido por Bill Gates por $30.8 millones de dólares en 1994. Contiene anotaciones científicas sobre fósiles, astronomía y agua escritas de su puño y letra usando 'escritura especular' (leída en un espejo).";
    } else if (lowercasePrompt.includes("quijote") || lowercasePrompt.includes("cervantes") || lowercasePrompt.includes("vendido") || lowercasePrompt.includes("copias") || lowercasePrompt.includes("best-seller")) {
      localAnswer = "Don Quijote de la Mancha de Miguel de Cervantes es considerado la novela de ficción más vendida y leída de la historia humana, con un estimado de más de 500 millones de copias desde su publicación en 1605. ¡Una obra maestra inigualable!";
    } else if (lowercasePrompt.includes("largo") || lowercasePrompt.includes("proust") || lowercasePrompt.includes("palabras")) {
      localAnswer = "La novela más larga del mundo es 'En busca del tiempo perdido' de Marcel Proust, con más de 1.2 millones de palabras y unas 3,000 páginas llenas de profundas reflexiones sobre la memoria, el tiempo, la nostalgia y el icónico aroma de una magdalena.";
    } else if (lowercasePrompt.includes("imprenta") || lowercasePrompt.includes("gutenberg") || lowercasePrompt.includes("tipos móviles") || lowercasePrompt.includes("biblia")) {
      localAnswer = "La imprenta de tipos móviles creada por Johannes Gutenberg en 1440 revolucionó la humanidad. El primer gran libro impreso fue la Biblia de 42 líneas. Antes de esto, copiar un solo libro a mano podía tomar meses de arduo esfuerzo para los monjes copistas.";
    } else if (lowercasePrompt.includes("biblioterapia") || lowercasePrompt.includes("terapia") || lowercasePrompt.includes("salud") || lowercasePrompt.includes("estrés") || lowercasePrompt.includes("sueño")) {
      localAnswer = "La biblioterapia es la ciencia de sanar la mente y el alma mediante la lectura. Se ha demostrado que leer solo 6 minutos en silencio puede reducir el estrés en un 68%, superando los efectos de escuchar música o dar un paseo.";
    } else if (lowercasePrompt.includes("shelley") || lowercasePrompt.includes("frankenstein") || lowercasePrompt.includes("terror") || lowercasePrompt.includes("byron")) {
      localAnswer = "Mary Shelley escribió 'Frankenstein o el moderno Prometeo' con tan solo 18 años, durante un verano lluvioso y frío en Suiza (1816), respondiendo a un desafío de Lord Byron para ver quién creaba la mejor historia de terror de la historia.";
    } else if (lowercasePrompt.includes("olor") || lowercasePrompt.includes("aroma") || lowercasePrompt.includes("viejo") || lowercasePrompt.includes("viejos") || lowercasePrompt.includes("lignina")) {
      localAnswer = "El característico aroma de los libros viejos se debe a la degradación química de la celulosa y la lignina del papel antiguo. Al envejecer, estos liberan pequeñas trazas orgánicas que huelen dulce a vainilla, almendras y flores silvestres.";
    } else if (lowercasePrompt.includes("biblioteca") || lowercasePrompt.includes("egipto") || lowercasePrompt.includes("antigua") || lowercasePrompt.includes("asurbanipal") || lowercasePrompt.includes("alejandría")) {
      localAnswer = "La biblioteca activa más antigua es la del Monasterio de Santa Catalina en el Monte Sinaí (Egipto), operando desde el siglo VI d.C. Resguarda valiosos tesoros del saber medieval y miles de manuscritos antiguos e invaluables.";
    } else if (lowercasePrompt.includes("primero") || lowercasePrompt.includes("américa") || lowercasePrompt.includes("america") || lowercasePrompt.includes("méxico") || lowercasePrompt.includes("mexico") || lowercasePrompt.includes("escala")) {
      localAnswer = "El primer libro impreso en todo el continente americano fue 'La escala espiritual para subir al cielo' de San Juan Clímaco, editado en la Ciudad de México en 1539, casi un siglo antes de que se estableciera la imprenta en Norteamérica.";
    } else {
      const fallbacks = [
        "Sherlock Holmes nunca dijo la frase exacta 'Elemental, mi querido Watson' en ninguna de las novelas escritas por Arthur Conan Doyle.",
        "Alejandro Magno dormía con una copia de la Ilíada de Homero (anotada por su tutor Aristóteles) y una daga debajo de su almohada.",
        "La palabra 'Utopía', acuñada por Tomás Moro en su novela de 1516, viene del griego y significa literalmente 'No-lugar' o un lugar ideal que no existe.",
        "El autor de 'Alicia en el país de las maravillas', Lewis Carroll, era en realidad un respetado matemático y lógico de la Universidad de Oxford.",
        "La biblioteca del Congreso de los EE.UU. guarda más de 170 millones de registros en estantes que, si se pusieran en fila, medirían más de 1,300 kilómetros."
      ];
      const randomIdx = Math.floor(Math.random() * fallbacks.length);
      localAnswer = fallbacks[randomIdx];
    }

    try {
      // Attempt live Gemini query using a list of model fallbacks
      const ai = getGeminiClient();
      const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
      let lastError: any = null;
      let textResponse = "";

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: "Eres un bibliotecario y alquimista literario experto en datos curiosos del mundo de los libros, récords de lectura, autores célebres, libros antiguos, orígenes de palabras y datos sobre índices de lectura globales y de Latinoamérica. Proporciona respuestas breves (máximo 3 o 4 líneas), poéticas, fascinantes, enriquecedoras, con excelente ortografía, en español latinoamericano, y que inspiren un amor profundo por la lectura. Si te preguntan sobre datos estadísticos aproximados de lectura en Latinoamérica, sé preciso y objetivo pero siempre motivador.",
            },
          });
          if (response && response.text) {
            textResponse = response.text;
            break;
          }
        } catch (e: any) {
          lastError = e;
          console.warn(`[Server] El modelo ${modelName} falló con error:`, e.message || e);
          // Continue to next model
        }
      }

      if (textResponse) {
        return res.json({ trivia: textResponse });
      }

      // If all models failed, throw the last error so it triggers the local codex fallback
      throw lastError || new Error("No se pudo obtener respuesta de ningún modelo de IA.");
    } catch (error: any) {
      console.warn("[Server] Gemini API no disponible en ningún modelo de contingencia. Utilizando Códices de Conocimiento Local. Razón:", error.message || error);
      
      // Send the beautiful, curated fallback with a delicate hint on how to connect Gemini
      const note = "\n\n*(Alquimia de Códice Local: Conecta tu clave GEMINI_API_KEY en los Ajustes (Settings -> Secrets) de AI Studio en la parte superior izquierda para liberar la Inteligencia Artificial ilimitada en vivo)*";
      return res.json({ trivia: `${localAnswer}${note}` });
    }
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
