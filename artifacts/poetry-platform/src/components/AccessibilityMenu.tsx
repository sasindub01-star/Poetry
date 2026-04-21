import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccessibility, type FontSize, type Contrast, type Density } from "@/hooks/useAccessibility";
import { useLanguage } from "@/hooks/useLanguage";

const fontOptions: { value: FontSize; label: string; labelAr: string; sample: string }[] = [
  { value: "normal", label: "Normal", labelAr: "عادي", sample: "Aa" },
  { value: "large", label: "Large", labelAr: "كبير", sample: "Aa" },
  { value: "xlarge", label: "Extra Large", labelAr: "كبير جداً", sample: "Aa" },
];

const contrastOptions: { value: Contrast; label: string; labelAr: string }[] = [
  { value: "normal", label: "Normal", labelAr: "عادي" },
  { value: "high", label: "High", labelAr: "عالي" },
];

const densityOptions: { value: Density; label: string; labelAr: string }[] = [
  { value: "compact", label: "Compact", labelAr: "مضغوط" },
  { value: "normal", label: "Normal", labelAr: "عادي" },
  { value: "comfortable", label: "Comfortable", labelAr: "مريح" },
];

export function AccessibilityMenu() {
  const { lang } = useLanguage();
  const { fontSize, contrast, density, setFontSize, setContrast, setDensity, reset } = useAccessibility();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const labelText = lang === "ar" ? "إمكانية الوصول" : "Accessibility";
  const fontLabel = lang === "ar" ? "حجم الخط" : "Font Size";
  const contrastLabel = lang === "ar" ? "التباين" : "Contrast";
  const densityLabel = lang === "ar" ? "الكثافة" : "Density";
  const resetLabel = lang === "ar" ? "إعادة تعيين" : "Reset";

  return (
    <div ref={ref} className="relative z-[120]">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={labelText}
        title={labelText}
        className="w-9 h-9 rounded-full border border-gold/20 bg-gold/5 hover:bg-gold/10 hover:border-gold/40 flex items-center justify-center transition-all text-foreground/70 hover:text-gold"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="7.5" r="1.2" fill="currentColor" />
          <path strokeLinecap="round" d="M8 11h8M10.5 11l-1 7M13.5 11l1 7M12 14v0" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 rounded-xl glass-panel border border-gold/20 shadow-2xl shadow-black/30 z-[140] p-4"
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
              <p className="text-xs font-bold text-gold uppercase tracking-wider">{labelText}</p>
              <button
                onClick={reset}
                className="text-xs text-foreground/40 hover:text-gold transition-colors"
              >
                {resetLabel}
              </button>
            </div>

            {/* Font size */}
            <div className="mb-4">
              <p className="text-xs text-foreground/60 mb-2 font-medium">{fontLabel}</p>
              <div className="grid grid-cols-3 gap-1.5">
                {fontOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFontSize(opt.value)}
                    className={`py-2 rounded-lg border text-center transition-all ${
                      fontSize === opt.value
                        ? "gold-gradient text-navy border-gold"
                        : "border-border text-foreground/70 hover:border-gold/40"
                    }`}
                  >
                    <div
                      className="font-display font-semibold leading-none"
                      style={{
                        fontSize:
                          opt.value === "normal" ? "0.85rem" : opt.value === "large" ? "1rem" : "1.2rem",
                      }}
                    >
                      {opt.sample}
                    </div>
                    <div className="text-[10px] mt-0.5 opacity-80">
                      {lang === "ar" ? opt.labelAr : opt.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Contrast */}
            <div className="mb-4">
              <p className="text-xs text-foreground/60 mb-2 font-medium">{contrastLabel}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {contrastOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setContrast(opt.value)}
                    className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                      contrast === opt.value
                        ? "gold-gradient text-navy border-gold"
                        : "border-border text-foreground/70 hover:border-gold/40"
                    }`}
                  >
                    {lang === "ar" ? opt.labelAr : opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Density */}
            <div>
              <p className="text-xs text-foreground/60 mb-2 font-medium">{densityLabel}</p>
              <div className="grid grid-cols-3 gap-1.5">
                {densityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDensity(opt.value)}
                    className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                      density === opt.value
                        ? "gold-gradient text-navy border-gold"
                        : "border-border text-foreground/70 hover:border-gold/40"
                    }`}
                  >
                    {lang === "ar" ? opt.labelAr : opt.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
