import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "wouter";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/useTheme";
import { setAuthUser, type UserRole, type AuthUser } from "@/lib/auth";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FloatingMusicNotes } from "@/components/FloatingMusicNotes";

interface AccountProfile {
  email: string;
  password: string;
  role: UserRole;
  displayName: string;
  displayNameAr: string;
  title: string;
  titleAr: string;
  initial: string;
  ringDark: string;
  ringLight: string;
  juryId?: number;
}

const accounts: AccountProfile[] = [
  {
    email: "s.almansoori@aha.gov.ae",
    password: "Sultan@2026",
    role: "sultan",
    displayName: "Dr. Sultan Al Mansoori",
    displayNameAr: "د. سلطان المنصوري",
    title: "Final Decision Authority",
    titleAr: "صاحب القرار النهائي",
    initial: "S",
    ringDark: "from-amber-500/20 to-amber-700/5 border-amber-500/30",
    ringLight: "from-amber-100 to-amber-50 border-amber-300",
  },
  {
    email: "f.alrashidi@aha.gov.ae",
    password: "Reviewer@2026",
    role: "reviewer",
    displayName: "Fatima Al Rashidi",
    displayNameAr: "فاطمة الراشدي",
    title: "Application Reviewer",
    titleAr: "مراجع الطلبات",
    initial: "F",
    ringDark: "from-teal-700/20 to-teal-900/5 border-teal-600/30",
    ringLight: "from-teal-50 to-emerald-50 border-teal-300",
  },
  {
    email: "a.almazrouei@aha.gov.ae",
    password: "Jury@2026",
    role: "jury",
    displayName: "Prof. Ahmad Al Mazrouei",
    displayNameAr: "أ.د. أحمد المزروعي",
    title: "Jury Member",
    titleAr: "عضو لجنة التحكيم",
    initial: "A",
    ringDark: "from-indigo-600/20 to-indigo-900/5 border-indigo-500/30",
    ringLight: "from-indigo-50 to-blue-50 border-indigo-300",
    juryId: 1,
  },
  {
    email: "n.alkaabi@aha.gov.ae",
    password: "Admin@2026",
    role: "sysadmin",
    displayName: "Nasser Al Kaabi",
    displayNameAr: "ناصر الكعبي",
    title: "System Administrator",
    titleAr: "مسؤول النظام",
    initial: "N",
    ringDark: "from-rose-600/15 to-rose-900/5 border-rose-500/25",
    ringLight: "from-rose-50 to-pink-50 border-rose-200",
  },
  {
    email: "audit@aha.gov.ae",
    password: "Audit@2026",
    role: "audit",
    displayName: "Audit Office",
    displayNameAr: "مكتب التدقيق",
    title: "Audit User · Read Only",
    titleAr: "مستخدم التدقيق · للقراءة فقط",
    initial: "AU",
    ringDark: "from-slate-500/15 to-slate-800/5 border-slate-400/20",
    ringLight: "from-slate-100 to-slate-50 border-slate-300",
  },
];

export default function LoginPage() {
  const { t, lang } = useLanguage();
  const { isDark } = useTheme();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const found = accounts.find(
        (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password
      );
      if (!found) {
        setLoading(false);
        setError(lang === "ar" ? "بيانات الاعتماد غير صحيحة" : "Incorrect email or password");
        return;
      }
      const user: AuthUser = {
        id: Date.now(),
        name: found.displayName,
        nameAr: found.displayNameAr,
        email: found.email,
        role: found.role,
        status: "active",
        createdAt: new Date().toISOString(),
        juryId: found.juryId,
      };
      setAuthUser(user, btoa(found.email + ":" + Date.now()));
      navigate("/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* ===== LEFT PANEL — Brand & decoration ===== */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden">
        {isDark ? (
          <div className="absolute inset-0 bg-gradient-to-br from-[#060d1f] via-[#0a1628] to-[#061810]" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#f5edd4] via-[#eedfc0] to-[#e8d5a8]" />
        )}

        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: isDark
              ? "radial-gradient(circle, rgba(200,169,110,0.12) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(200,169,110,0.3) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className={`absolute inset-0 arabic-pattern ${isDark ? "opacity-25" : "opacity-15"}`} />
        <FloatingMusicNotes count={12} rings equalizer={false} goldColor={isDark ? "#C8A96E" : "#A87828"} />

        <div className="relative z-10 text-center px-8 max-w-sm">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
            className="w-20 h-20 rounded-full gold-gradient mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-gold/30"
          >
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-navy" fill="currentColor">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p
              className={`text-4xl font-arabic mb-4 leading-tight ${isDark ? "text-gold" : "text-[#8B5E0A]"}`}
              dir="rtl"
            >
              هيئة أبوظبي للتراث
            </p>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              {lang === "ar" ? "بوابة الإدارة" : "Administration Portal"}
            </h1>
            <p className="text-foreground/50 text-sm">
              {lang === "ar"
                ? "خدمة تقييم شعراء الوطن"
                : "National Poets Evaluation Service"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 p-5 glass-panel rounded-2xl border border-gold/15 text-right"
            dir="rtl"
          >
            <svg
              className={`w-5 h-5 mb-3 ${isDark ? "text-gold/40" : "text-[#8B5E0A]/40"}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <p className={`font-arabic text-lg leading-loose ${isDark ? "text-foreground/80" : "text-foreground/70"}`}>
              يا صحراء الوطن يا أرض الأجداد<br />
              في رمالك تاريخ وفي ترابك أمجاد
            </p>
            <p className="text-foreground/30 text-xs mt-3">— محمد المنصوري</p>
          </motion.div>
        </div>
      </div>

      {/* ===== RIGHT PANEL — Sign-in form ===== */}
      <div className="w-full lg:w-1/2 flex flex-col bg-background">
        <div className="flex items-center justify-between p-6 border-b border-border/30">
          <Link href="/" className="flex items-center gap-2 text-foreground/50 hover:text-foreground text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {lang === "ar" ? "عودة للرئيسية" : "Back to site"}
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-8 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="mb-6">
              <h2 className="text-3xl font-display font-bold mb-1">
                {lang === "ar" ? "تسجيل الدخول" : "Sign in to your account"}
              </h2>
              <p className="text-foreground/50 text-sm">
                {lang === "ar"
                  ? "اختر دورك للمتابعة إلى لوحة التحكم"
                  : "Select your role or enter your credentials below"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-foreground/60 mb-1.5 font-medium">
                  {lang === "ar" ? "البريد الإلكتروني" : "Email Address"}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/10 transition-all"
                  placeholder="name@aha.gov.ae"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground/60 mb-1.5 font-medium">
                  {lang === "ar" ? "كلمة المرور" : "Password"}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/10 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-sm text-red-400 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3.5 rounded-xl gold-gradient text-navy font-bold text-base disabled:opacity-50 transition-all shadow-lg shadow-gold/20 mt-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full inline-block"
                    />
                    {lang === "ar" ? "جاري التحقق…" : "Verifying…"}
                  </span>
                ) : (lang === "ar" ? "تسجيل الدخول" : "Sign In")}
              </motion.button>

              <p className="text-center text-[11px] text-foreground/30 mt-3">
                {lang === "ar"
                  ? "نظام تقييم الشعراء المعتمد من هيئة أبوظبي للتراث"
                  : "Authorized system of Abu Dhabi Heritage Authority"}
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
