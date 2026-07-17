import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Book } from "./types";
import WelcomeView from "./components/WelcomeView";
import BookListView from "./components/BookListView";
import BookFormView from "./components/BookFormView";
import BookDetailView from "./components/BookDetailView";
import StatsView from "./components/StatsView";
import TriviaView from "./components/TriviaView";
import AboutView from "./components/AboutView";
import CommunityDashboard from "./components/CommunityDashboard";
import { 
  BookMarked, 
  Plus, 
  BarChart3, 
  User as UserIcon, 
  LogOut, 
  AlertCircle, 
  CheckCircle, 
  Sparkles, 
  Wifi, 
  Signal, 
  Battery, 
  ShieldCheck, 
  Mail, 
  BookOpen,
  Download,
  Upload,
  Globe,
  Compass,
  Users,
  Heart,
  Youtube,
  ExternalLink
} from "lucide-react";
import { 
  auth, 
  getBooksByUserId, 
  addBook, 
  updateBook, 
  deleteBook, 
  logoutUser 
} from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";

type TabType = "list" | "add" | "stats" | "trivia" | "profile" | "community";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("list");
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  // View overrides (e.g., detail, edit, welcome)
  const [view, setView] = useState<"welcome" | "tabs" | "detail" | "edit">("welcome");

  // Status & Feedback States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Status bar simulated clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setError(null);
      if (user) {
        localStorage.removeItem("diario_lectura_active_guest");
        setCurrentUser(user);
        setView("tabs");
        await loadBooks(user.uid);
      } else {
        const savedGuest = localStorage.getItem("diario_lectura_active_guest");
        if (savedGuest) {
          const parsedUser = JSON.parse(savedGuest);
          setCurrentUser(parsedUser);
          setView("tabs");
          await loadBooks(parsedUser.uid);
        } else {
          setCurrentUser(null);
          setView("welcome");
          setBooks([]);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load books for a given userId
  const loadBooks = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      if (userId === "guest_local_user") {
        const localData = localStorage.getItem("diario_lectura_local_books");
        const parsed = localData ? JSON.parse(localData) : [];
        setBooks(parsed);
      } else {
        const data = await getBooksByUserId(userId);
        setBooks(data);
      }
    } catch (err: any) {
      console.error(err);
      setError("Error al cargar los libros.");
      setToast({ message: "Error al sincronizar datos", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Save book (add or update)
  const handleSaveBook = async (bookPayload: any) => {
    if (!currentUser) return;
    const isEditing = !!bookPayload.id;

    try {
      if (currentUser.uid === "guest_local_user") {
        const localData = localStorage.getItem("diario_lectura_local_books");
        let localBooks: Book[] = localData ? JSON.parse(localData) : [];
        
        if (isEditing) {
          localBooks = localBooks.map((b) => 
            b.id === bookPayload.id 
              ? { ...b, ...bookPayload, id: bookPayload.id } 
              : b
          );
          setToast({ message: "¡Libro actualizado localmente!", type: "success" });
        } else {
          const newBook: Book = {
            ...bookPayload,
            id: `local_${Date.now()}`,
            created_at: new Date().toISOString(),
            reader_id: 1
          };
          localBooks.unshift(newBook);
          setToast({ message: "¡Libro registrado localmente con éxito!", type: "success" });
        }
        localStorage.setItem("diario_lectura_local_books", JSON.stringify(localBooks));
        setBooks(localBooks);
        setSelectedBook(null);
        setActiveTab("list");
        setView("tabs");
      } else {
        if (isEditing) {
          await updateBook(bookPayload.id, bookPayload);
          setToast({ message: "¡Libro actualizado correctamente!", type: "success" });
        } else {
          await addBook(currentUser.uid, bookPayload);
          setToast({ message: "¡Libro registrado con éxito!", type: "success" });
        }

        // Reload books and reset views
        await loadBooks(currentUser.uid);
        setSelectedBook(null);
        setActiveTab("list");
        setView("tabs");
      }
    } catch (err: any) {
      console.error(err);
      setToast({ message: "Error al guardar el libro", type: "error" });
      throw err;
    }
  };

  // Direct registration of curated trending books
  const handleRegisterBookDirectly = async (bookData: { title: string; author: string; genre: string; cover_url: string; pages: number }) => {
    if (!currentUser) return;
    try {
      const newBookPayload = {
        reader_id: 1,
        title: bookData.title,
        author: bookData.author,
        genre: bookData.genre,
        cover_url: bookData.cover_url,
        pages: bookData.pages,
        start_date: new Date().toISOString().split("T")[0], // Start reading today!
        notes: "Añadido desde las tendencias de la comunidad.",
        ratings: [
          { category: "historia", stars: 5 },
          { category: "personajes", stars: 5 },
          { category: "estilo", stars: 5 },
          { category: "disfrute", stars: 5 }
        ]
      };

      if (currentUser.uid === "guest_local_user") {
        const localData = localStorage.getItem("diario_lectura_local_books");
        const localBooks: Book[] = localData ? JSON.parse(localData) : [];
        const newBook: Book = {
          ...newBookPayload,
          id: `local_${Date.now()}`,
          created_at: new Date().toISOString(),
          reader_id: 1
        };
        localBooks.unshift(newBook);
        localStorage.setItem("diario_lectura_local_books", JSON.stringify(localBooks));
        setBooks(localBooks);
      } else {
        await addBook(currentUser.uid, newBookPayload);
        await loadBooks(currentUser.uid);
      }
      setToast({ message: `¡"${bookData.title}" añadido a tu biblioteca!`, type: "success" });
      setActiveTab("list");
    } catch (err) {
      console.error("Error adding book directly:", err);
      setToast({ message: "No se pudo añadir el libro", type: "error" });
    }
  };

  // Delete book
  const handleDeleteBook = async () => {
    if (!currentUser || !selectedBook) return;

    try {
      if (currentUser.uid === "guest_local_user") {
        const localData = localStorage.getItem("diario_lectura_local_books");
        let localBooks: Book[] = localData ? JSON.parse(localData) : [];
        localBooks = localBooks.filter((b) => b.id !== selectedBook.id);
        localStorage.setItem("diario_lectura_local_books", JSON.stringify(localBooks));
        setBooks(localBooks);
        setToast({ message: "Libro eliminado localmente", type: "success" });
        setSelectedBook(null);
        setActiveTab("list");
        setView("tabs");
      } else {
        await deleteBook(selectedBook.id.toString());
        setToast({ message: "Libro eliminado de tu biblioteca", type: "success" });
        
        // Reload books and reset views
        await loadBooks(currentUser.uid);
        setSelectedBook(null);
        setActiveTab("list");
        setView("tabs");
      }
    } catch (err: any) {
      console.error(err);
      setToast({ message: "No se pudo eliminar el libro", type: "error" });
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("diario_lectura_active_guest");
      // Fire-and-forget logout asynchronously so network delays or iframe blocks don't hold up the UI
      logoutUser().catch((err) => console.warn("Firebase logout warning (safe to ignore):", err));
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      // Instantly clear all client-side auth states
      setCurrentUser(null);
      setView("welcome");
      setBooks([]);
      setSelectedBook(null);
      setActiveTab("list");
      setToast({ message: "Sesión cerrada correctamente", type: "success" });
    }
  };

  const handleExportData = () => {
    try {
      if (books.length === 0) {
        setToast({ message: "No hay libros en tu biblioteca para exportar", type: "error" });
        return;
      }
      const dataStr = JSON.stringify(books, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const filename = `mi_diario_lecturas_${new Date().toISOString().split('T')[0]}.json`;

      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', filename);
      link.click();
      setToast({ message: "Copia de seguridad descargada", type: "success" });
    } catch (err) {
      console.error(err);
      setToast({ message: "Error al exportar la biblioteca", type: "error" });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = event.target.files?.[0];
    if (!file) return;

    fileReader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) return;
        const parsedData = JSON.parse(text);
        
        if (Array.isArray(parsedData)) {
          const isValid = parsedData.every((item: any) => item && (item.title || item.author));
          if (!isValid) {
            setToast({ message: "El archivo no tiene un formato válido de libros", type: "error" });
            return;
          }

          if (currentUser?.uid === "guest_local_user") {
            localStorage.setItem("diario_lectura_local_books", JSON.stringify(parsedData));
            setBooks(parsedData);
            setToast({ message: "¡Biblioteca importada localmente!", type: "success" });
          } else {
            setToast({ message: "Importando libros en tu cuenta...", type: "success" });
            for (const book of parsedData) {
              const { id, created_at, ...cleanBook } = book;
              await addBook(currentUser!.uid, cleanBook);
            }
            await loadBooks(currentUser!.uid);
            setToast({ message: "¡Biblioteca importada y sincronizada!", type: "success" });
          }
        } else {
          setToast({ message: "El formato debe ser un arreglo de libros", type: "error" });
        }
      } catch (err) {
        console.error(err);
        setToast({ message: "Error al importar el archivo JSON", type: "error" });
      }
    };
    fileReader.readAsText(file, "UTF-8");
  };

  const handleSelectBook = (bookId: string | number) => {
    const book = books.find((b) => b.id === bookId);
    if (book) {
      setSelectedBook(book);
      setView("detail");
    }
  };

  return (
    <div className="min-h-screen bg-[#1E1C1A] text-[#3E3C3A] font-sans flex items-center justify-center p-0 sm:p-6 md:p-8 overflow-x-hidden">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -30, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -30, x: "-50%" }}
            className="fixed top-6 left-1/2 z-50 max-w-[320px] w-full bg-white rounded-2xl shadow-xl border border-[#E8E4DE] p-3.5 flex items-center gap-3"
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            )}
            <p className="text-xs font-bold text-[#3E3C3A] flex-1 leading-snug">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outer Smartphone Frame Wrapper (Desktop Only, Responsive Mobile Fills screen) */}
      <div className="w-full max-w-md md:max-w-5xl h-full sm:h-[840px] md:h-[760px] bg-[#2D2926] sm:rounded-[3rem] md:rounded-[2.5rem] sm:border-[10px] md:border-6 sm:border-[#3E3C3A] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative aspect-[9/19.5] md:aspect-auto">
        
        {/* Simulated Phone Top Bezel / Dynamic Island / Notch */}
        <div className="hidden sm:block md:hidden absolute top-0 inset-x-0 h-7 bg-[#2D2926] z-50">
          <div className="mx-auto w-32 h-4 bg-black rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0"></div>
        </div>

        {/* Simulated Phone Status Bar */}
        <div className="bg-white shrink-0 px-6 pt-3 pb-2 flex items-center justify-between text-xs font-semibold text-neutral-800 select-none z-40 border-b border-[#F5F2ED] sm:pt-6 md:pt-4">
          <span className="font-mono text-[11px]">{currentTime || "12:00"}</span>
          <div className="flex items-center gap-1.5 text-neutral-700 md:hidden">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 text-neutral-800" />
          </div>
          {/* Elegant Desktop Branding text instead of mobile icons on wide screens */}
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#C4A484] font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Mi Diario de Lectura</span>
          </div>
        </div>

        {/* Scrollable Screen Canvas Workspace */}
        <div className="flex-1 overflow-hidden bg-[#F9F7F2] relative flex flex-col">
          
          {loading && view !== "welcome" ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 bg-[#F9F7F2]">
              <div className="w-8 h-8 border-3 border-[#C4A484]/20 border-t-[#C4A484] rounded-full animate-spin"></div>
              <p className="text-[#8B7E74] font-mono text-[10px] uppercase tracking-widest font-bold">Cargando biblioteca...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* LOGIN SCREEN */}
              {view === "welcome" && (
                <WelcomeView 
                  key="welcome" 
                  onLoginSuccess={(user) => {
                    setCurrentUser(user);
                    setView("tabs");
                    loadBooks(user.uid);
                  }} 
                />
              )}

              {/* MAIN TAB SWITCHER */}
              {view === "tabs" && currentUser && (
                <motion.div 
                  key="tabs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {/* BIBLIOTECA TAB */}
                  {activeTab === "list" && (
                    <BookListView
                      books={books}
                      onSelectBook={handleSelectBook}
                      onAddBookClick={() => {
                        setSelectedBook(null);
                        setActiveTab("add");
                      }}
                    />
                  )}

                  {/* REGISTRAR TAB */}
                  {activeTab === "add" && (
                    <BookFormView
                      onSave={handleSaveBook}
                      onCancel={() => setActiveTab("list")}
                    />
                  )}

                  {/* ESTADISTICAS TAB */}
                  {activeTab === "stats" && (
                    <StatsView books={books} />
                  )}

                  {/* CURIOSIDADES / TRIVIA TAB */}
                  {activeTab === "trivia" && (
                    <TriviaView books={books} />
                  )}

                  {/* COMUNIDAD Y TENDENCIAS TAB */}
                  {activeTab === "community" && (
                    <CommunityDashboard
                      currentUser={currentUser}
                      userBooks={books}
                      onAddBookDirectly={handleRegisterBookDirectly}
                    />
                  )}

                  {/* PERFIL / CUENTA TAB */}
                  {activeTab === "profile" && (
                    <div className="flex flex-col h-full bg-[#F9F7F2] overflow-hidden">
                      <div className="p-4 bg-white border-b border-[#E8E4DE] shrink-0">
                        <h2 className="text-xl font-serif font-bold italic text-[#3E3C3A]">Mi Perfil</h2>
                      </div>

                      <div className="flex-1 overflow-y-auto p-5 space-y-6">
                        {/* User Avatar Card */}
                        <div className="bg-white border border-[#E8E4DE] rounded-3xl p-6 text-center space-y-4 shadow-2xs">
                          <div className="relative inline-block">
                            {currentUser.photoURL ? (
                              <img
                                src={currentUser.photoURL}
                                alt={currentUser.displayName || "Usuario"}
                                className="w-20 h-20 rounded-full mx-auto border-2 border-[#C4A484] object-cover"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-full bg-[#C4A484]/15 border-2 border-[#C4A484] flex items-center justify-center text-[#C4A484] mx-auto">
                                <UserIcon className="w-10 h-10" />
                              </div>
                            )}
                            <div className="absolute bottom-0 right-0 bg-[#C4A484] p-1.5 rounded-full border border-white text-white">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h3 className="font-serif font-bold text-base text-[#3E3C3A]">
                              {currentUser.displayName || "Lector Invitado"}
                            </h3>
                            <div className="flex items-center justify-center gap-1.5 text-xs text-[#8B7E74]">
                              <Mail className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[200px]">{currentUser.email || "Acceso Invitado"}</span>
                            </div>
                          </div>

                          <div className="pt-2">
                            <span className="text-[9px] font-mono font-bold tracking-widest uppercase bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                              {currentUser.isAnonymous ? "Acceso Demo Local" : "Sincronizado con Google"}
                            </span>
                          </div>
                        </div>

                        {/* App stats summary mini-bento */}
                        <div className="bg-white border border-[#E8E4DE] rounded-3xl p-5 shadow-2xs space-y-3">
                          <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#8B7E74]">
                            Información de la Cuenta
                          </span>

                          <div className="space-y-3 text-xs">
                            <div className="flex justify-between border-b border-[#F9F7F2] pb-2">
                              <span className="text-[#8B7E74]">Estado del Servidor</span>
                              <span className="font-bold text-emerald-600 font-mono flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Conectado (Cloud)
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-[#F9F7F2] pb-2">
                              <span className="text-[#8B7E74]">Motor de Base de datos</span>
                              <span className="font-bold text-neutral-800 font-mono">Firebase Firestore</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#8B7E74]">Sesión iniciada</span>
                              <span className="font-bold text-neutral-800 font-mono">
                                {currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString("es-ES") : "Hoy"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive About Manual / Features section */}
                        <div className="bg-white border border-[#E8E4DE] rounded-3xl p-5 shadow-2xs space-y-3">
                          <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#8B7E74]">
                            Manual del Alquimista
                          </span>
                          <p className="text-[11px] text-[#8B7E74] leading-relaxed">
                            ¿Quieres repasar todas las maravillosas funcionalidades que ofrece este santuario literario?
                          </p>
                          <button
                            onClick={() => setIsAboutOpen(true)}
                            className="w-full flex items-center justify-center gap-1.5 bg-[#C4A484] hover:bg-[#B39373] text-white py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-98"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Abrir Guía del Lector</span>
                          </button>
                        </div>

                        {/* PayPal Contribution & Creator Branding Section */}
                        <div className="bg-white border border-[#E8E4DE] rounded-3xl p-5 shadow-2xs space-y-4">
                          <div className="flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 text-[#C4A484] fill-[#C4A484]/10 animate-pulse" />
                            <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#8B7E74]">
                              Apoya este santuario lector
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-[#8B7E74] leading-relaxed">
                            Si esta app te acompaña en tu camino lector, puedes apoyar su desarrollo y seguir conectado con mis proyectos. Tu contribución voluntaria cuida de este rincón literario.
                          </p>
                          
                          {/* 
                            ENLACE DE PAYPAL: cambiar aquí si se actualiza en el futuro 
                          */}
                          <a
                            href="https://www.paypal.com/ncp/payment/2FS8SD7C4H8CE"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-1.5 bg-[#C4A484] hover:bg-[#B39373] text-white py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 text-center shadow-3xs"
                          >
                            <Heart className="w-3.5 h-3.5 fill-white/10" />
                            <span>Apoyar este proyecto</span>
                          </a>

                          {/* Subtle Creator Branding / Continuity Links */}
                          <div className="pt-3 border-t border-[#F9F7F2] space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono uppercase font-bold text-[#8B7E74]">
                                Creado por tecnoicymi
                              </span>
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" title="Proyecto Activo" />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              {/* 
                                ENLACE WEB: cambiar aquí si se actualiza en el futuro 
                              */}
                              <a
                                href="https://www.tecnoicymi.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 p-2 bg-[#F9F7F2] hover:bg-[#E8E4DE] text-[#3E3C3A] hover:text-[#C4A484] rounded-xl border border-[#E8E4DE]/60 text-[10px] font-medium font-mono transition-colors text-left"
                              >
                                <Globe className="w-3 h-3 text-[#C4A484]" />
                                <span className="truncate">tecnoicymi.com</span>
                                <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-40" />
                              </a>

                              {/* 
                                ENLACE YOUTUBE: cambiar aquí si se actualiza en el futuro 
                              */}
                              <a
                                href="http://www.youtube.com/@tecnoicymi"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 p-2 bg-[#F9F7F2] hover:bg-[#E8E4DE] text-[#3E3C3A] hover:text-red-600 rounded-xl border border-[#E8E4DE]/60 text-[10px] font-medium font-mono transition-colors text-left"
                              >
                                <Youtube className="w-3 h-3 text-red-500" />
                                <span className="truncate">@tecnoicymi</span>
                                <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-40" />
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Backup & Safety Controls */}
                        <div className="bg-white border border-[#E8E4DE] rounded-3xl p-5 shadow-2xs space-y-3">
                          <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#8B7E74]">
                            Copia de Seguridad (Recomendado)
                          </span>
                          <p className="text-[11px] text-[#8B7E74] leading-relaxed">
                            Resguarda tu biblioteca en un archivo descargable. Ideal para el modo Demo Local, para transferir tus libros a otro navegador o tener un respaldo seguro.
                          </p>

                          <div className="grid grid-cols-2 gap-2.5 pt-1">
                            <button
                              onClick={handleExportData}
                              className="flex items-center justify-center gap-1.5 bg-[#F9F7F2] hover:bg-[#E8E4DE] text-[#3E3C3A] py-2.5 px-3 rounded-xl text-xs font-bold border border-[#E8E4DE] transition-all cursor-pointer active:scale-98"
                            >
                              <Download className="w-3.5 h-3.5 text-[#C4A484]" />
                              <span>Exportar</span>
                            </button>
                            
                            <label className="flex items-center justify-center gap-1.5 bg-[#F9F7F2] hover:bg-[#E8E4DE] text-[#3E3C3A] py-2.5 px-3 rounded-xl text-xs font-bold border border-[#E8E4DE] transition-all cursor-pointer active:scale-98 text-center">
                              <Upload className="w-3.5 h-3.5 text-[#C4A484]" />
                              <span>Importar</span>
                              <input 
                                type="file" 
                                accept=".json" 
                                onChange={handleImportData} 
                                className="hidden" 
                              />
                            </label>
                          </div>
                        </div>

                        {/* Log out action */}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-500 py-3.5 rounded-2xl text-xs font-bold transition-all border border-red-100 shadow-3xs cursor-pointer active:scale-98"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Cerrar sesión</span>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* BOOK DETAILS SCREEN */}
              {view === "detail" && selectedBook && (
                <BookDetailView
                  key="detail"
                  book={selectedBook}
                  onEdit={() => setView("edit")}
                  onDelete={handleDeleteBook}
                  onBack={() => {
                    setSelectedBook(null);
                    setView("tabs");
                  }}
                />
              )}

              {/* EDIT BOOK SCREEN */}
              {view === "edit" && selectedBook && (
                <BookFormView
                  key="edit"
                  bookToEdit={selectedBook}
                  onSave={handleSaveBook}
                  onCancel={() => setView("detail")}
                />
              )}
            </AnimatePresence>
          )}

          {/* PERSISTENT BOTTOM SWITCHER NAVIGATION BAR */}
          {view === "tabs" && (
            <div className="absolute bottom-0 inset-x-0 bg-white border-t border-[#E8E4DE] py-1.5 px-1 flex justify-around items-center z-40 shadow-lg shrink-0 md:py-2 md:px-3 md:bottom-5 md:left-1/2 md:-translate-x-1/2 md:max-w-lg md:rounded-full md:border md:shadow-xl md:bg-white/95 md:backdrop-blur-xs">
              {/* Tab 1: List */}
              <button
                onClick={() => {
                  setSelectedBook(null);
                  setActiveTab("list");
                }}
                className={`flex-1 md:flex-none flex flex-col items-center gap-0.5 p-1 md:p-2.5 transition-colors cursor-pointer min-w-0 ${
                  activeTab === "list" ? "text-[#C4A484]" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                <BookMarked className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[8px] md:text-[9px] font-bold font-mono tracking-tight md:tracking-wider uppercase truncate max-w-full px-0.5">Biblioteca</span>
              </button>

              {/* Tab 2: Add */}
              <button
                onClick={() => {
                  setSelectedBook(null);
                  setActiveTab("add");
                }}
                className={`flex-1 md:flex-none flex flex-col items-center gap-0.5 p-1 md:p-2.5 transition-colors cursor-pointer min-w-0 ${
                  activeTab === "add" ? "text-[#C4A484]" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5 bg-[#3E3C3A] text-white rounded-full p-0.5 shadow-xs" />
                <span className="text-[8px] md:text-[9px] font-bold font-mono tracking-tight md:tracking-wider uppercase truncate max-w-full px-0.5">Registrar</span>
              </button>

              {/* Tab 3: Stats */}
              <button
                onClick={() => {
                  setSelectedBook(null);
                  setActiveTab("stats");
                }}
                className={`flex-1 md:flex-none flex flex-col items-center gap-0.5 p-1 md:p-2.5 transition-colors cursor-pointer min-w-0 ${
                  activeTab === "stats" ? "text-[#C4A484]" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[8px] md:text-[9px] font-bold font-mono tracking-tight md:tracking-wider uppercase truncate max-w-full px-0.5">Estadísticas</span>
              </button>

              {/* Tab 3.5: Comunidad */}
              <button
                onClick={() => {
                  setSelectedBook(null);
                  setActiveTab("community");
                }}
                className={`flex-1 md:flex-none flex flex-col items-center gap-0.5 p-1 md:p-2.5 transition-colors cursor-pointer min-w-0 ${
                  activeTab === "community" ? "text-[#C4A484]" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                <Compass className="w-4 h-4 md:w-5 md:h-5 animate-spin-slow" />
                <span className="text-[8px] md:text-[9px] font-bold font-mono tracking-tight md:tracking-wider uppercase truncate max-w-full px-0.5">Comunidad</span>
              </button>

              {/* Tab 4: Trivia / Oráculo */}
              <button
                onClick={() => {
                  setSelectedBook(null);
                  setActiveTab("trivia");
                }}
                className={`flex-1 md:flex-none flex flex-col items-center gap-0.5 p-1 md:p-2.5 transition-colors cursor-pointer min-w-0 ${
                  activeTab === "trivia" ? "text-[#C4A484]" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                <Globe className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[8px] md:text-[9px] font-bold font-mono tracking-tight md:tracking-wider uppercase truncate max-w-full px-0.5">Oráculo</span>
              </button>

              {/* Tab 5: Profile */}
              <button
                onClick={() => {
                  setSelectedBook(null);
                  setActiveTab("profile");
                }}
                className={`flex-1 md:flex-none flex flex-col items-center gap-0.5 p-1 md:p-2.5 transition-colors cursor-pointer min-w-0 ${
                  activeTab === "profile" ? "text-[#C4A484]" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Perfil"
                    className={`w-4 h-4 md:w-5 md:h-5 rounded-full object-cover border ${
                      activeTab === "profile" ? "border-[#C4A484]" : "border-transparent"
                    }`}
                  />
                ) : (
                  <UserIcon className="w-4 h-4 md:w-5 md:h-5" />
                )}
                <span className="text-[8px] md:text-[9px] font-bold font-mono tracking-tight md:tracking-wider uppercase truncate max-w-full px-0.5">Perfil</span>
              </button>
            </div>
          )}

        </div>

        {/* Simulated Phone Home Button Indicator Bar (iOS style) */}
        <div className="hidden sm:block md:hidden absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full z-50"></div>
      </div>
      
      {/* Immersive Guide Modal */}
      <AnimatePresence>
        {isAboutOpen && (
          <AboutView isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
