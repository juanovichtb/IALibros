import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Book } from "../types";
import {
  X,
  Sparkles,
  Download,
  Check,
  Type,
  Palette,
  Sliders,
  AlignLeft,
  AlignCenter,
  Instagram,
  Heart,
  Star,
  Copy,
  BookOpen
} from "lucide-react";

interface AestheticCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  avgRating: number;
}

type ThemeType = "beige" | "dark" | "sunset" | "typewriter";
type FontType = "serif" | "sans" | "mono";
type FormatType = "916" | "11"; // 9:16 Story vs 1:1 Post

export default function AestheticCardModal({
  isOpen,
  onClose,
  book,
  avgRating
}: AestheticCardModalProps) {
  const [theme, setTheme] = useState<ThemeType>("beige");
  const [font, setFont] = useState<FontType>("serif");
  const [format, setFormat] = useState<FormatType>("916");
  const [align, setAlign] = useState<"center" | "left">("center");
  const [showCover, setShowCover] = useState(true);
  const [showRating, setShowRating] = useState(avgRating > 0);
  const [showWatermark, setShowWatermark] = useState(true);
  const [quoteText, setQuoteText] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"theme" | "text" | "elements">("theme");

  // Prepopulate with notes or a default beautiful greeting
  useEffect(() => {
    if (book.notes && book.notes.trim() !== "") {
      // Limit to first 280 characters for beautiful visual layout
      setQuoteText(book.notes.substring(0, 280));
    } else {
      setQuoteText(`"Un libro hermoso que te atrapa desde las primeras páginas..."`);
    }
  }, [book]);

  if (!isOpen) return null;

  // Aesthetic Themes CSS
  const getThemeClasses = () => {
    switch (theme) {
      case "dark":
        return {
          bg: "bg-[#1A1918] border-stone-800",
          text: "text-[#F5F2EB]",
          textSub: "text-[#C4A484] font-mono",
          quoteText: "text-[#E5E1DA] italic",
          border: "border-stone-800",
          accentBg: "bg-stone-900",
          starsColor: "text-amber-400",
          badgeBg: "bg-amber-400/10 text-amber-300 border-amber-400/20",
          canvasBg: "#1A1918",
          canvasTextColor: "#F5F2EB",
          canvasSubColor: "#C4A484"
        };
      case "sunset":
        return {
          bg: "bg-gradient-to-tr from-[#FDE2E4] via-[#FFF1E6] to-[#E2ECE9] border-[#E8E4DE]",
          text: "text-[#4A3E3D]",
          textSub: "text-[#8A7371] font-mono",
          quoteText: "text-[#5C4D4C] italic",
          border: "border-[#E8E4DE]/60",
          accentBg: "bg-white/40 backdrop-blur-xs",
          starsColor: "text-amber-500",
          badgeBg: "bg-white/60 text-[#4A3E3D] border-[#E8E4DE]",
          canvasBg: "sunset", // handled specially
          canvasTextColor: "#4A3E3D",
          canvasSubColor: "#8A7371"
        };
      case "typewriter":
        return {
          bg: "bg-[#F2EFE9] border-[#DCDAD4] shadow-inner",
          text: "text-[#1E1E1E]",
          textSub: "text-[#6E6D6A] font-mono",
          quoteText: "text-[#2A2A2A] font-serif tracking-tight",
          border: "border-b border-[#DCDAD4] border-dashed",
          accentBg: "bg-[#EAE6DF]",
          starsColor: "text-amber-600",
          badgeBg: "bg-[#EAE6DF] text-[#1E1E1E] border-[#DCDAD4]",
          canvasBg: "#F2EFE9",
          canvasTextColor: "#1E1E1E",
          canvasSubColor: "#6E6D6A"
        };
      case "beige":
      default:
        return {
          bg: "bg-[#FDFBF7] border-[#E8E4DE]",
          text: "text-[#3E3C3A]",
          textSub: "text-[#8B7E74] font-mono",
          quoteText: "text-[#3E3C3A] italic",
          border: "border-[#E8E4DE]",
          accentBg: "bg-[#F9F7F2]",
          starsColor: "text-amber-500",
          badgeBg: "bg-[#C4A484]/10 text-[#C4A484] border-[#C4A484]/20",
          canvasBg: "#FDFBF7",
          canvasTextColor: "#3E3C3A",
          canvasSubColor: "#8B7E74"
        };
    }
  };

  const getFontFamily = () => {
    switch (font) {
      case "sans":
        return "font-sans";
      case "mono":
        return "font-mono";
      case "serif":
      default:
        return "font-serif";
    }
  };

  const styles = getThemeClasses();
  const fontFamily = getFontFamily();

  // Draw & Exporter Canvas function
  const handleDownloadImage = () => {
    setIsDownloading(true);
    
    // Slight delay to allow state changes to sync & show nice button spinner
    setTimeout(() => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setIsDownloading(false);
          return;
        }

        const isStory = format === "916";
        const width = 1080;
        const height = isStory ? 1920 : 1080;

        canvas.width = width;
        canvas.height = height;

        // Draw Background
        if (theme === "dark") {
          ctx.fillStyle = "#1A1918";
          ctx.fillRect(0, 0, width, height);
          // Draw subtle stars
          ctx.fillStyle = "rgba(196, 164, 132, 0.15)";
          for (let i = 0; i < 60; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 3.5 + 1;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (theme === "sunset") {
          const gradient = ctx.createLinearGradient(0, 0, width, height);
          gradient.addColorStop(0, "#FDE2E4");
          gradient.addColorStop(0.5, "#FFF1E6");
          gradient.addColorStop(1, "#E2ECE9");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        } else if (theme === "typewriter") {
          ctx.fillStyle = "#F2EFE9";
          ctx.fillRect(0, 0, width, height);
          // Draw subtle dashed lines like writer paper
          ctx.strokeStyle = "rgba(110, 109, 106, 0.04)";
          ctx.lineWidth = 2;
          for (let y = 120; y < height; y += 45) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }
        } else {
          // beige theme
          ctx.fillStyle = "#FDFBF7";
          ctx.fillRect(0, 0, width, height);
          // Thin double borders
          ctx.strokeStyle = "rgba(196, 164, 132, 0.15)";
          ctx.lineWidth = 14;
          ctx.strokeRect(45, 45, width - 90, height - 90);
          ctx.strokeStyle = "rgba(196, 164, 132, 0.06)";
          ctx.lineWidth = 4;
          ctx.strokeRect(65, 65, width - 130, height - 130);
        }

        // Font family selections mapping to standard canvas safe fonts
        let fontName = "Georgia, 'Times New Roman', serif";
        if (font === "sans") {
          fontName = "'Inter', system-ui, -apple-system, sans-serif";
        } else if (font === "mono") {
          fontName = "'JetBrains Mono', 'Courier New', monospace";
        }

        let labelFont = "'JetBrains Mono', 'Courier New', monospace";

        // Layout variables
        let currentY = isStory ? 240 : 140;
        const drawX = width / 2;

        // Top Header Watermark (only Story format)
        if (isStory) {
          ctx.fillStyle = theme === "dark" ? "#C4A484" : "#8B7E74";
          ctx.font = `bold 22px ${labelFont}`;
          ctx.textAlign = "center";
          ctx.letterSpacing = "6px";
          ctx.fillText("MI DIARIO DE LECTURA", drawX, currentY);
          currentY += 120;
        }

        const finishDrawingText = () => {
          // Book Title
          ctx.fillStyle = theme === "dark" ? "#F5F2EB" : "#3E3C3A";
          ctx.textAlign = "center";
          ctx.font = `italic bold 44px ${fontName}`;
          
          // Truncate title if super long
          let displayTitle = book.title;
          if (displayTitle.length > 40) {
            displayTitle = displayTitle.substring(0, 38) + "...";
          }
          ctx.fillText(displayTitle, drawX, currentY);
          currentY += 55;

          // Book Author
          ctx.font = `italic 28px ${fontName}`;
          ctx.fillStyle = theme === "dark" ? "#C4A484" : "#8B7E74";
          ctx.fillText(`por ${book.author}`, drawX, currentY);
          currentY += 100;

          // Large Quote Indicator
          ctx.fillStyle = theme === "dark" ? "rgba(196, 164, 132, 0.25)" : "rgba(196, 164, 132, 0.35)";
          ctx.font = `italic bold 130px ${fontName}`;
          ctx.fillText("“", drawX, currentY);
          currentY += 45;

          // Quote Note Text
          ctx.fillStyle = theme === "dark" ? "#E5E1DA" : "#3E3C3A";
          ctx.font = `italic 34px ${fontName}`;
          ctx.textAlign = align === "center" ? "center" : "left";

          const maxTextW = 760;
          const textX = align === "center" ? drawX : (width - maxTextW) / 2;
          const lineHeight = 52;
          
          const words = quoteText.split(" ");
          let line = "";
          const lines = [];

          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + " ";
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxTextW && n > 0) {
              lines.push(line);
              line = words[n] + " ";
            } else {
              line = testLine;
            }
          }
          lines.push(line);

          // Limit lines to prevent overflow
          const maxLines = isStory ? 10 : 6;
          const linesToDraw = lines.slice(0, maxLines);

          for (let i = 0; i < linesToDraw.length; i++) {
            ctx.fillText(linesToDraw[i].trim(), textX, currentY);
            currentY += lineHeight;
          }
          
          if (lines.length > maxLines) {
            ctx.fillText("...", textX, currentY);
            currentY += lineHeight;
          }

          currentY += 30;

          // Close quote
          ctx.fillStyle = theme === "dark" ? "rgba(196, 164, 132, 0.25)" : "rgba(196, 164, 132, 0.35)";
          ctx.font = `italic bold 130px ${fontName}`;
          ctx.textAlign = "center";
          ctx.fillText("”", drawX, currentY);
          currentY += 70;

          // Rating Stars (if enabled)
          if (showRating && avgRating > 0) {
            const starSize = 34;
            const spacing = 10;
            const totalW = (starSize * 5) + (spacing * 4);
            const startX = (width - totalW) / 2;

            ctx.fillStyle = "#F59E0B"; // Amber Gold
            for (let i = 1; i <= 5; i++) {
              const starX = startX + (i - 1) * (starSize + spacing) + starSize / 2;
              if (i <= Math.round(avgRating)) {
                drawStar(ctx, starX, currentY, 5, starSize / 2, starSize / 4);
              } else {
                ctx.strokeStyle = theme === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)";
                ctx.lineWidth = 3;
                drawStarOutline(ctx, starX, currentY, 5, starSize / 2, starSize / 4);
              }
            }
            currentY += 90;
          }

          // Bottom Watermark
          if (isStory && showWatermark) {
            ctx.fillStyle = theme === "dark" ? "rgba(196, 164, 132, 0.4)" : "rgba(139, 126, 116, 0.5)";
            ctx.font = `bold 18px ${labelFont}`;
            ctx.letterSpacing = "4px";
            ctx.textAlign = "center";
            ctx.fillText("MI DIARIO DE LECTURA • COMPARTIR", drawX, height - 120);
          }

          // Convert canvas and download
          const dataUrl = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `${book.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_story.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setIsDownloading(false);
        };

        // Draw Cover Image if present & enabled
        if (showCover && book.cover_url && book.cover_url.trim() !== "") {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const coverW = 280;
            const coverH = 373; // 3:4 aspect ratio
            const coverX = (width - coverW) / 2;

            // Draw shadow for cover
            ctx.shadowColor = "rgba(0, 0, 0, 0.14)";
            ctx.shadowBlur = 25;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 12;

            // Draw image on canvas
            ctx.drawImage(img, coverX, currentY, coverW, coverH);

            // Reset shadow
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            currentY += coverH + 70;
            finishDrawingText();
          };
          img.onerror = () => {
            // Draw visual book placeholder
            drawBookPlaceholderBox(ctx, width, currentY);
            currentY += 120;
            finishDrawingText();
          };
          img.src = book.cover_url;
        } else {
          currentY += 60;
          finishDrawingText();
        }
      } catch (err) {
        console.error("Error creating card canvas:", err);
        setIsDownloading(false);
      }
    }, 400);
  };

  const drawBookPlaceholderBox = (ctx: CanvasRenderingContext2D, width: number, y: number) => {
    const boxW = 240;
    const boxH = 60;
    const boxX = (width - boxW) / 2;
    ctx.strokeStyle = theme === "dark" ? "rgba(196, 164, 132, 0.3)" : "rgba(139, 126, 116, 0.2)";
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, y, boxW, boxH);
  };

  const drawStar = (
    cx: CanvasRenderingContext2D,
    cx_pos: number,
    cy_pos: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) => {
    let rot = (Math.PI / 2) * 3;
    let x = cx_pos;
    let y = cy_pos;
    let step = Math.PI / spikes;

    cx.beginPath();
    cx.moveTo(cx_pos, cy_pos - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx_pos + Math.cos(rot) * outerRadius;
      y = cy_pos + Math.sin(rot) * outerRadius;
      cx.lineTo(x, y);
      rot += step;

      x = cx_pos + Math.cos(rot) * innerRadius;
      y = cy_pos + Math.sin(rot) * innerRadius;
      cx.lineTo(x, y);
      rot += step;
    }
    cx.lineTo(cx_pos, cy_pos - outerRadius);
    cx.closePath();
    cx.fill();
  };

  const drawStarOutline = (
    cx: CanvasRenderingContext2D,
    cx_pos: number,
    cy_pos: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) => {
    let rot = (Math.PI / 2) * 3;
    let x = cx_pos;
    let y = cy_pos;
    let step = Math.PI / spikes;

    cx.beginPath();
    cx.moveTo(cx_pos, cy_pos - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx_pos + Math.cos(rot) * outerRadius;
      y = cy_pos + Math.sin(rot) * outerRadius;
      cx.lineTo(x, y);
      rot += step;

      x = cx_pos + Math.cos(rot) * innerRadius;
      y = cy_pos + Math.sin(rot) * innerRadius;
      cx.lineTo(x, y);
      rot += step;
    }
    cx.lineTo(cx_pos, cy_pos - outerRadius);
    cx.closePath();
    cx.stroke();
  };

  const handleCopyText = () => {
    const textToCopy = `“${quoteText}”\n\n— ${book.title}, por ${book.author}\n⭐ Calificación: ${avgRating.toFixed(1)}/5\nCompartido desde mi Diario de Lectura`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="share-modal-container" className="fixed inset-0 bg-stone-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl border border-[#E8E4DE] shadow-2xl max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 overflow-hidden h-full max-h-[95vh] md:max-h-[85vh] font-sans text-[#3E3C3A]"
      >
        {/* Visual Preview Left Section (7 columns) */}
        <div className="md:col-span-7 bg-[#F4EFEA] p-4 sm:p-6 flex flex-col items-center justify-center border-r border-[#E8E4DE] relative overflow-hidden min-h-[380px] md:min-h-0">
          {/* Backdrops or layout specs details */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 text-[9px] font-mono font-bold text-[#8B7E74] bg-white/70 px-2.5 py-1 rounded-full border border-[#E8E4DE]">
            <Instagram className="w-3.5 h-3.5 text-pink-600" />
            <span>VISTA DE INSTAGRAM STORY ({format === "916" ? "9:16" : "1:1"})</span>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 md:hidden p-2 bg-white rounded-full border border-[#E8E4DE] shadow-xs cursor-pointer text-[#3E3C3A]"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Aesthetic Styled Preview Card Frame */}
          <div
            id="share-aesthetic-card"
            className={`transition-all duration-300 relative shadow-md border ${styles.bg} ${fontFamily} flex flex-col justify-between p-6 sm:p-8 select-none ${
              format === "916"
                ? "aspect-[9/16] w-[260px] sm:w-[280px] md:w-[300px] rounded-2xl"
                : "aspect-square w-[260px] sm:w-[280px] md:w-[320px] rounded-2xl"
            }`}
          >
            {/* Soft decorative background frames */}
            {theme === "beige" && (
              <div className="absolute inset-2 border border-[#C4A484]/15 rounded-xl pointer-events-none" />
            )}

            {/* Card Header watermark */}
            {format === "916" ? (
              <div className="text-center pt-1">
                <span className={`text-[8px] font-mono uppercase tracking-[0.25em] font-bold block ${styles.textSub}`}>
                  Mi Diario de Lectura
                </span>
              </div>
            ) : <div />}

            {/* Central Book Showcase & Quote */}
            <div className="space-y-4 my-auto flex flex-col items-center text-center">
              {showCover && book.cover_url && book.cover_url.trim() !== "" ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="aspect-[3/4] w-20 sm:w-24 bg-white/20 rounded-lg shadow-sm overflow-hidden border border-white/10 shrink-0"
                >
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ) : null}

              <div className="space-y-0.5">
                <h4 className={`text-sm sm:text-base font-bold italic tracking-tight leading-tight max-w-[240px] ${styles.text}`}>
                  {book.title}
                </h4>
                <p className={`text-[10px] sm:text-xs italic ${styles.textSub}`}>
                  por {book.author}
                </p>
              </div>

              {/* Big decorative quotes */}
              <div className="space-y-1 w-full relative">
                <span className="text-3xl text-[#C4A484]/30 font-serif leading-none block -mb-2">“</span>
                <p className={`text-xs sm:text-[13px] leading-relaxed max-w-[240px] mx-auto px-1 ${
                  align === "center" ? "text-center" : "text-left"
                } ${styles.quoteText}`}>
                  {quoteText || "Sin notas escritas..."}
                </p>
                <span className="text-3xl text-[#C4A484]/30 font-serif leading-none block -mt-1">”</span>
              </div>
            </div>

            {/* Footer Star Rating & Logo Badge */}
            <div className="flex flex-col items-center gap-2 pt-2">
              {showRating && avgRating > 0 && (
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${
                        star <= Math.round(avgRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-stone-300/40"
                      }`}
                    />
                  ))}
                </div>
              )}

              {format === "916" && showWatermark && (
                <div className={`text-[7px] font-mono uppercase tracking-[0.2em] opacity-40 font-bold ${styles.textSub}`}>
                  ♥ Lector Apasionado
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customization Controls Right Section (5 columns) */}
        <div className="md:col-span-5 p-5 flex flex-col justify-between overflow-y-auto bg-white max-h-[50vh] md:max-h-none">
          
          {/* Header Action Row */}
          <div className="flex items-center justify-between border-b border-[#F4EFEA] pb-3 mb-4">
            <div className="flex items-center gap-1.5 text-neutral-800">
              <Sparkles className="w-4 h-4 text-[#C4A484]" />
              <h3 className="font-serif font-bold text-sm sm:text-base">Aesthetic Card Creator</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-stone-100 rounded-full transition-colors cursor-pointer text-[#8B7E74] hidden md:block"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Setting Tabs Navigation */}
          <div className="flex border-b border-[#F4EFEA] mb-4 text-xs font-mono font-bold uppercase tracking-wider text-stone-400">
            <button
              onClick={() => setActiveTab("theme")}
              className={`flex-1 pb-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "theme" ? "border-[#C4A484] text-[#3E3C3A]" : "border-transparent hover:text-[#3E3C3A]"
              }`}
            >
              <Palette className="w-3.5 h-3.5 inline mr-1" /> Estilo
            </button>
            <button
              onClick={() => setActiveTab("text")}
              className={`flex-1 pb-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "text" ? "border-[#C4A484] text-[#3E3C3A]" : "border-transparent hover:text-[#3E3C3A]"
              }`}
            >
              <Type className="w-3.5 h-3.5 inline mr-1" /> Texto
            </button>
            <button
              onClick={() => setActiveTab("elements")}
              className={`flex-1 pb-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "elements" ? "border-[#C4A484] text-[#3E3C3A]" : "border-transparent hover:text-[#3E3C3A]"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 inline mr-1" /> Opciones
            </button>
          </div>

          {/* Dynamic Tabs Content container */}
          <div className="flex-1 space-y-4 mb-5 text-left">
            {activeTab === "theme" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Themes List */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#8B7E74]">Paleta de Colores</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setTheme("beige")}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        theme === "beige"
                          ? "border-[#C4A484] bg-[#FDFBF7] ring-1 ring-[#C4A484]"
                          : "border-[#E8E4DE] hover:border-stone-300"
                      }`}
                    >
                      <span>Beige Estético</span>
                      <div className="w-3 h-3 rounded-full bg-[#FDFBF7] border border-[#E8E4DE]" />
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        theme === "dark"
                          ? "border-[#C4A484] bg-stone-900 ring-1 ring-[#C4A484] text-white"
                          : "border-[#E8E4DE] hover:border-stone-300"
                      }`}
                    >
                      <span>Noche Oscura</span>
                      <div className="w-3 h-3 rounded-full bg-[#1A1918]" />
                    </button>
                    <button
                      onClick={() => setTheme("sunset")}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        theme === "sunset"
                          ? "border-[#C4A484] bg-gradient-to-tr from-[#FDE2E4] to-[#E2ECE9] ring-1 ring-[#C4A484]"
                          : "border-[#E8E4DE] hover:border-stone-300"
                      }`}
                    >
                      <span>Atardecer Rosa</span>
                      <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-[#FDE2E4] to-[#E2ECE9]" />
                    </button>
                    <button
                      onClick={() => setTheme("typewriter")}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        theme === "typewriter"
                          ? "border-[#C4A484] bg-[#F2EFE9] ring-1 ring-[#C4A484]"
                          : "border-[#E8E4DE] hover:border-stone-300"
                      }`}
                    >
                      <span>Máquina Escribir</span>
                      <div className="w-3 h-3 rounded-full bg-[#F2EFE9] border border-[#DCDAD4]" />
                    </button>
                  </div>
                </div>

                {/* Fonts List */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#8B7E74]">Tipografía</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => setFont("serif")}
                      className={`py-2 rounded-xl border text-xs transition-all font-serif font-bold cursor-pointer ${
                        font === "serif"
                          ? "border-[#C4A484] bg-[#C4A484]/5 ring-1 ring-[#C4A484] text-[#3E3C3A]"
                          : "border-[#E8E4DE] hover:border-stone-300"
                      }`}
                    >
                      Abc (Serif)
                    </button>
                    <button
                      onClick={() => setFont("sans")}
                      className={`py-2 rounded-xl border text-xs transition-all font-sans font-bold cursor-pointer ${
                        font === "sans"
                          ? "border-[#C4A484] bg-[#C4A484]/5 ring-1 ring-[#C4A484] text-[#3E3C3A]"
                          : "border-[#E8E4DE] hover:border-stone-300"
                      }`}
                    >
                      Abc (Sans)
                    </button>
                    <button
                      onClick={() => setFont("mono")}
                      className={`py-2 rounded-xl border text-xs transition-all font-mono font-bold cursor-pointer ${
                        font === "mono"
                          ? "border-[#C4A484] bg-[#C4A484]/5 ring-1 ring-[#C4A484] text-[#3E3C3A]"
                          : "border-[#E8E4DE] hover:border-stone-300"
                      }`}
                    >
                      Abc (Mono)
                    </button>
                  </div>
                </div>

                {/* Aspect Ratio format */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#8B7E74]">Formato / Aspecto</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFormat("916")}
                      className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-2 justify-center transition-all cursor-pointer ${
                        format === "916"
                          ? "border-[#C4A484] bg-[#C4A484]/5 ring-1 ring-[#C4A484] text-[#3E3C3A]"
                          : "border-[#E8E4DE] hover:border-stone-300"
                      }`}
                    >
                      <div className="w-3.5 h-6 border-2 border-stone-400 rounded-sm" />
                      <span>Historia (9:16)</span>
                    </button>
                    <button
                      onClick={() => setFormat("11")}
                      className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-2 justify-center transition-all cursor-pointer ${
                        format === "11"
                          ? "border-[#C4A484] bg-[#C4A484]/5 ring-1 ring-[#C4A484] text-[#3E3C3A]"
                          : "border-[#E8E4DE] hover:border-stone-300"
                      }`}
                    >
                      <div className="w-5 h-5 border-2 border-stone-400 rounded-sm" />
                      <span>Cuadrado Feed (1:1)</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "text" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Quote text editor */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#8B7E74]">Texto de la Cita / Reseña</span>
                    <span className="text-[9px] font-mono text-[#8B7E74]">{quoteText.length}/280</span>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={280}
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    placeholder="Escribe la cita inspiradora o nota que quieres destacar en tu historia..."
                    className="w-full p-3 rounded-2xl bg-[#F9F7F2] border border-[#E8E4DE] text-xs focus:outline-none focus:border-[#C4A484] text-[#3E3C3A] font-medium leading-relaxed resize-none font-serif"
                  />
                </div>

                {/* Text alignment controls */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#8B7E74]">Alineación del Texto</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAlign("center")}
                      className={`flex-1 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        align === "center"
                          ? "border-[#C4A484] bg-[#C4A484]/5 ring-1 ring-[#C4A484]"
                          : "border-[#E8E4DE] hover:border-stone-300"
                      }`}
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                      <span>Centrado</span>
                    </button>
                    <button
                      onClick={() => setAlign("left")}
                      className={`flex-1 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        align === "left"
                          ? "border-[#C4A484] bg-[#C4A484]/5 ring-1 ring-[#C4A484]"
                          : "border-[#E8E4DE] hover:border-stone-300"
                      }`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span>Izquierda</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "elements" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3.5"
              >
                <span className="text-[10px] font-mono uppercase font-bold text-[#8B7E74] block">Opciones de Visualización</span>
                
                {/* Toggle cover */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-[#E8E4DE] hover:bg-[#F9F7F2] transition-colors cursor-pointer select-none">
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="text-xs font-semibold text-[#3E3C3A]">Mostrar portada de libro</span>
                    <span className="text-[9px] text-[#8B7E74]">Incluye la carátula pequeña sobre los textos</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showCover}
                    onChange={(e) => setShowCover(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C4A484] focus:ring-[#C4A484] accent-[#C4A484] cursor-pointer"
                  />
                </label>

                {/* Toggle rating */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-[#E8E4DE] hover:bg-[#F9F7F2] transition-colors cursor-pointer select-none">
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="text-xs font-semibold text-[#3E3C3A]">Mostrar estrellas de calificación</span>
                    <span className="text-[9px] text-[#8B7E74]">Muestra el rating promedio del libro</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showRating}
                    onChange={(e) => setShowRating(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C4A484] focus:ring-[#C4A484] accent-[#C4A484] cursor-pointer"
                  />
                </label>

                {/* Toggle watermark */}
                {format === "916" && (
                  <label className="flex items-center justify-between p-3 rounded-xl border border-[#E8E4DE] hover:bg-[#F9F7F2] transition-colors cursor-pointer select-none">
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-xs font-semibold text-[#3E3C3A]">Marca de agua en pie de página</span>
                      <span className="text-[9px] text-[#8B7E74]">Sello elegante "Mi Diario de Lectura"</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showWatermark}
                      onChange={(e) => setShowWatermark(e.target.checked)}
                      className="w-4 h-4 rounded text-[#C4A484] focus:ring-[#C4A484] accent-[#C4A484] cursor-pointer"
                    />
                  </label>
                )}
              </motion.div>
            )}
          </div>

          {/* Bottom Action buttons */}
          <div className="space-y-2 border-t border-[#F4EFEA] pt-4 mt-auto">
            <button
              onClick={handleDownloadImage}
              disabled={isDownloading}
              className="w-full flex items-center justify-center gap-2 bg-[#C4A484] hover:bg-[#B39373] text-white py-3.5 rounded-2xl font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${isDownloading ? "animate-bounce" : ""}`} />
              <span>{isDownloading ? "Generando imagen..." : "Descargar Tarjeta / Story"}</span>
            </button>

            <button
              onClick={handleCopyText}
              className="w-full flex items-center justify-center gap-2 bg-[#3E3C3A] hover:bg-[#2D2926] text-white py-3 rounded-2xl font-semibold text-xs transition-all shadow-xs cursor-pointer active:scale-98"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>¡Copiado al Portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#C4A484]" />
                  <span>Copiar Cita con Formato Texto</span>
                </>
              )}
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
