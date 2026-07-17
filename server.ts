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

  // POST /api/synopsis - Generate a brief, captivating, spoiler-free book synopsis with AI (and local fallback)
  app.post("/api/synopsis", async (req, res) => {
    const { title, author } = req.body;
    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "El título es obligatorio" });
    }

    const cleanTitle = title.trim();
    const cleanAuthor = author ? author.trim() : "Autor Desconocido";
    const lowerTitle = cleanTitle.toLowerCase();
    
    let localSynopsis = "";

    // Curator's Codex of Famous Book Fallbacks
    if (lowerTitle.includes("quijote") || lowerTitle.includes("cervantes")) {
      localSynopsis = "En un rincón de la Mancha, un hidalgo enloquecido por las novelas de caballería decide armarse caballero andante para deshacer entuertos y ganarse el amor de la mítica Dulcinea. Junto a su fiel escudero Sancho Panza, emprenderá una aventura cómica y trágica que cuestionará los límites de la realidad y la cordura humana. ¿Te atreves a enfrentar hoy tus propios molinos de viento?";
    } else if (lowerTitle.includes("cien años") || lowerTitle.includes("soledad") || lowerTitle.includes("gabriel garcía") || lowerTitle.includes("gabo")) {
      localSynopsis = "La saga mística e ineludible de la familia Buendía a lo largo de siete generaciones en el mítico pueblo caribeño de Macondo. Envolviendo realismo mágico, guerras civiles, amores prohibidos, milagros y una soledad ancestral que marca el destino de sus protagonistas de principio a fin. Un reflejo dorado del alma humana y de la historia latinoamericana. ¿Qué secreto místico aguarda en las páginas que lees hoy?";
    } else if (lowerTitle.includes("principito") || lowerTitle.includes("saint-exupéry") || lowerTitle.includes("exupery")) {
      localSynopsis = "Tras quedar varado en el desierto del Sahara, un aviador conoce a un pequeño príncipe venido de un asteroide lejano. A través de sus conversaciones sobre planetas habitados por adultos peculiares, una rosa vanidosa, y un zorro que anhela ser domesticado, redescubrimos las verdades más sencillas y puras de la existencia: lo esencial es invisible a los ojos. Deja que este dulce viaje ablande tu corazón en tu lectura de hoy.";
    } else if (lowerTitle.includes("sombra del viento") || lowerTitle.includes("ruiz zafón") || lowerTitle.includes("zafon")) {
      localSynopsis = "En la Barcelona de la posguerra, el joven Daniel Sempere es conducido por su padre al Cementerio de los Libros Olvidados, donde adopta un libro maldito que cambiará su vida para siempre. Una intriga gótica repleta de misterios, amores trágicos, secretos familiares y un homenaje incondicional al poder salvador de la lectura en épocas oscuras. Un laberinto de intrigas te aguarda: ¿continuamos descifrándolo hoy?";
    } else if (lowerTitle.includes("frankenstein") || lowerTitle.includes("shelley") || lowerTitle.includes("prometeo")) {
      localSynopsis = "El joven científico Víctor Frankenstein logra vencer a la muerte infundiendo vida a una criatura creada a partir de restos humanos. Sin embargo, horrorizado por su propio éxito, la abandona a su suerte, desatando una trágica odisea de rechazo, soledad, venganza y profundos cuestionamientos sobre la moral de la ciencia y el anhelo inherente de afecto que habita en todo ser viviente. ¿Quién es el verdadero monstruo en esta historia?";
    } else if (lowerTitle.includes("dracula") || lowerTitle.includes("drácula") || lowerTitle.includes("stoker")) {
      localSynopsis = "El joven abogado Jonathan Harker viaja al recóndito castillo del Conde Drácula en Transilvania, solo para descubrir que su anfitrión es un vampiro ancestral sediento de sangre y poder que planea invadir Londres. Una obra cumbre de la literatura gótica que explora la inmortalidad, el deseo, la superstición y la eterna batalla entre la luz y la oscuridad. Un clásico inmortal que hiela la sangre e ilumina la imaginación.";
    } else if (lowerTitle.includes("1984") || lowerTitle.includes("orwell")) {
      localSynopsis = "En una sociedad totalitaria dominada por el Gran Hermano, la Policía del Pensamiento y la manipulación absoluta de la verdad, Winston Smith se atreve a cometer el crimen más peligroso de todos: enamorarse y conservar un diario secreto. Una perturbadora profecía y profunda advertencia sobre el control social, la censura y la resistencia de la libertad individual ante el poder absoluto. ¿Qué tan libre es tu pensamiento hoy?";
    } else if (lowerTitle.includes("un mundo feliz") || lowerTitle.includes("huxley") || lowerTitle.includes("brave new world")) {
      localSynopsis = "Una distopía donde la humanidad es diseñada genéticamente, condicionada psicológicamente y anestesiada con la droga 'soma' para garantizar un orden social perfecto y una felicidad artificial. El choque cultural con un 'salvaje' criado fuera de este sistema pondrá en tela de juicio el precio que estamos dispuestos a pagar por la estabilidad a cambio de nuestra alma, arte y libertad. ¿Preferirías la verdad o el confort?";
    } else if (lowerTitle.includes("ficciones") || lowerTitle.includes("borges") || lowerTitle.includes("aleph")) {
      localSynopsis = "El laberíntico e inigualable universo ficcional de Jorge Luis Borges, poblado por bibliotecas infinitas que abarcan el cosmos, espejos que duplican la realidad, laberintos de tiempo, enciclopedias apócrifas y hombres memoriosos. Un banquete intelectual único que expande la mente y redefine los límites de la literatura fantástica mundial. ¿Listo para perderte y encontrarte en las intrincadas veredas de este laberinto hoy?";
    } else if (lowerTitle.includes("pedro páramo") || lowerTitle.includes("pedro paramo") || lowerTitle.includes("rulfo")) {
      localSynopsis = "Juan Preciado viaja a Comala en busca de su padre, un cacique llamado Pedro Páramo, pero encuentra un pueblo fantasma habitado únicamente por murmullos de almas en pena y ecos de un pasado violento y desolado. Una obra maestra del realismo mágico hispanoamericano, donde los vivos y los muertos se mezclan en una atmósfera polvorienta y mística suspendida en el tiempo. Déjate envolver por la mística del desierto.";
    } else if (lowerTitle.includes("rayuela") || lowerTitle.includes("cortázar") || lowerTitle.includes("cortazar")) {
      localSynopsis = "La revolucionaria contranovela de Julio Cortázar que invita al lector a recorrer, como en el juego infantil de la rayuela, los desvelos de Horacio Oliveira en París y Buenos Aires, buscando la unidad de la vida junto a la Maga. Un canto de jazz literario, repleto de juegos lingüísticos, libertad formal y amor bohemio que cambió la literatura en español para siempre. ¿En qué casillero de tu propia rayuela espiritual te encuentras hoy?";
    } else if (lowerTitle.includes("metamorfosis") || lowerTitle.includes("kafka")) {
      localSynopsis = "Al despertar una mañana tras un sueño intranquilo, Gregorio Samsa se encuentra en su cama transformado en un monstruoso insecto. El drama existencial de un hombre atrapado en su propia inutilidad laboral y el progresivo rechazo de su propia familia ante lo incomprensible. Una brillante y desoladora metáfora de la alineación moderna y el desamparo humano ante un mundo frío e indiferente. ¿Cómo afrontarás las transformaciones de la vida hoy?";
    } else if (lowerTitle.includes("hábitos") || lowerTitle.includes("habitos") || lowerTitle.includes("clear") || lowerTitle.includes("atómicos") || lowerTitle.includes("atomicos")) {
      localSynopsis = "El aclamado manual de James Clear que demuestra cómo pequeños cambios del 1% diario en nuestras rutinas pueden acumularse para transformar radicalmente nuestras vidas a largo plazo. Mediante bases científicas y ejemplos prácticos, enseña a diseñar sistemas infalibles para eliminar malos hábitos y consolidar conductas de éxito. ¡Registrar tus lecturas en este diario ya es un hábito atómico que transformará tu futuro intelectual!";
    } else {
      // Elegant, context-aware generic fallback
      localSynopsis = `Te adentras en las páginas de "${cleanTitle}" de ${cleanAuthor}, una obra repleta de mundos por descubrir, reflexiones profundas y emociones en estado puro. Cada capítulo es una invitación a expandir tu mente, empatizar con los personajes y desconectarte del ruido exterior para reconectar con lo esencial de la existencia. Esperamos que disfrutes cada línea y que tu jornada de lectura de hoy sea sumamente inspiradora, provechosa y transformadora.`;
    }

    try {
      const ai = getGeminiClient();
      const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
      let lastError: any = null;
      let textResponse = "";

      const prompt = `Genera una sinopsis atrapante, poética, mística y completamente libre de spoilers (en español, de máximo 3 o 4 líneas) para el libro "${cleanTitle}" escrito por "${cleanAuthor}". Concluye con una pequeña frase motivadora o pregunta para inspirar al lector a continuar con su lectura de hoy.`;

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: "Eres un crítico literario místico, bibliotecario erudito y compañero de lectura empático. Escribes de manera hermosa, poética, inspiradora, libre de spoilers, en español latinoamericano pulcro. Tu misión es entusiasmar al lector para que continúe leyendo.",
            },
          });
          if (response && response.text) {
            textResponse = response.text;
            break;
          }
        } catch (e: any) {
          lastError = e;
          console.warn(`[Server/Synopsis] El modelo ${modelName} falló:`, e.message || e);
        }
      }

      if (textResponse) {
        return res.json({ synopsis: textResponse, isAi: true });
      }

      throw lastError || new Error("No se pudo obtener respuesta de ningún modelo de IA.");
    } catch (error: any) {
      console.warn("[Server/Synopsis] Gemini API no disponible. Usando Códices de Sinopsis Local.");
      const note = "\n\n*(Alquimia de Códice Local: Conecta tu clave GEMINI_API_KEY en los Ajustes de AI Studio para activar la IA en vivo)*";
      return res.json({ synopsis: `${localSynopsis}${note}`, isAi: false });
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
