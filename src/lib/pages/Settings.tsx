import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Settings as SettingsIcon, Languages, Moon, Sun, ChevronLeft, Globe, Palette, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useSettings } from "../SettingsContext";
import { Link } from "react-router-dom";

export function Settings() {
  const { language, setLanguage, theme, setTheme, t } = useSettings();
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem("admin_authenticated") === "true";
  });
  const [pinInput, setPinInput] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState("");

  useEffect(() => {
    const checkAdmin = () => {
      setIsAdmin(localStorage.getItem("admin_authenticated") === "true");
    };
    checkAdmin();
    window.addEventListener("storage", checkAdmin);
    window.addEventListener("adminAuthChange", checkAdmin);
    return () => {
      window.removeEventListener("storage", checkAdmin);
      window.removeEventListener("adminAuthChange", checkAdmin);
    };
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === "Mofe@2025#") {
      localStorage.setItem("admin_authenticated", "true");
      setIsAdmin(true);
      setPinError("");
      setPinSuccess("تم تفعيل صلاحيات الإدارة بنجاح!");
      setPinInput("");
      window.dispatchEvent(new Event("adminAuthChange"));
      setTimeout(() => setPinSuccess(""), 4000);
    } else {
      setPinError("رمز المرور خاطئ! يرجى إدخال الرمز الصحيح.");
      setPinSuccess("");
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("admin_authenticated");
    setIsAdmin(false);
    setPinInput("");
    setPinError("");
    setPinSuccess("");
    window.dispatchEvent(new Event("adminAuthChange"));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20 animate-in fade-in duration-500">
      <header className="flex items-center gap-4 mb-12">
        <div className="w-12 h-12 bg-red-700/10 rounded-2xl flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-red-700" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter">{t('settings')}</h1>
          <p className="text-gray-500 text-sm">تخصيص تجربة التطبيق الخاصة بك</p>
        </div>
      </header>

      <div className="grid gap-6">
        {/* Language Section */}
        <motion.section 
          whileHover={{ y: -2 }}
          className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 border border-black/5 dark:border-white/5 space-y-6 shadow-sm"
        >
          <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/5 pb-4">
            <Globe className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold">{t('language')}</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setLanguage('ar')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                language === 'ar' 
                ? 'border-red-700 bg-red-700/10 text-red-700 dark:text-white' 
                : 'border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 hover:border-black/10 dark:hover:border-white/10'
              }`}
            >
              <span className="text-2xl">🇸🇦</span>
              <span className="font-bold">العربية</span>
            </button>
            <button 
              onClick={() => setLanguage('en')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                language === 'en' 
                ? 'border-red-700 bg-red-700/10 text-red-700 dark:text-white' 
                : 'border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 hover:border-black/10 dark:hover:border-white/10'
              }`}
            >
              <span className="text-2xl">🇺🇸</span>
              <span className="font-bold">English</span>
            </button>
          </div>
        </motion.section>

        {/* Theme Section */}
        <motion.section 
          whileHover={{ y: -2 }}
          className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 border border-black/5 dark:border-white/5 space-y-6 shadow-sm"
        >
          <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/5 pb-4">
            <Palette className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold">{t('theme')}</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                theme === 'dark' 
                ? 'border-red-700 bg-red-700/10 text-red-700 dark:text-white' 
                : 'border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 hover:border-black/10 dark:hover:border-white/10'
              }`}
            >
              <Moon className="w-6 h-6" />
              <span className="font-bold">{t('dark_mode')}</span>
            </button>
            <button 
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                theme === 'light' 
                ? 'border-red-700 bg-red-700/10 text-red-700 dark:text-[#0f172a]' 
                : 'border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 hover:border-black/10 dark:hover:border-white/10'
              }`}
            >
              <Sun className="w-6 h-6" />
              <span className="font-bold">{t('light_mode')}</span>
            </button>
          </div>
        </motion.section>

        {/* Admin PIN Settings Section */}
        <motion.section 
          whileHover={{ y: -2 }}
          className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 border border-black/5 dark:border-white/5 space-y-6 shadow-sm"
        >
          <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/5 pb-4">
            <Lock className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold">صلاحيات الإدارة (Admin Verification)</h2>
          </div>
          
          {isAdmin ? (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                <div className="text-right" style={{ direction: "rtl" }}>
                  <h3 className="font-bold text-emerald-600 dark:text-emerald-400">صلاحية الإدارة مفعلة</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">أنت مسجل كالمشرف ولديك الصلاحية لإضافة وحذف بث المباريات المباشر والقنوات التلفزيونية.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Link 
                  to="/admin" 
                  className="flex-grow bg-brand text-white py-3.5 rounded-2xl font-black shadow-lg shadow-brand/20 hover:bg-brand-hover text-center transition-all text-sm"
                >
                  لوحة التحكم الإدارية
                </Link>
                <button 
                  onClick={handleAdminLogout}
                  className="px-6 bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 py-3.5 rounded-2xl font-bold transition-all text-sm"
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-right" style={{ direction: "rtl" }}>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed text-justify">
                يتطلب الوصول إلى هذا القسم رمز مرور (PIN) أدخل رمز المرور المسجل مسبقاً للتحقق من صلاحية الإدارة وتعديل بث المباريات المباشر.
              </p>
              
              <form onSubmit={handlePinSubmit} className="space-y-4 text-left">
                <div className="relative">
                  <input 
                    type={showPin ? "text" : "password"}
                    placeholder="رمز المرور الإداري (PIN)"
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value)}
                    required
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 pl-12 text-center text-[#0f172a] dark:text-white outline-none focus:border-brand transition-all font-mono tracking-widest text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand transition-colors p-1"
                  >
                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {pinError && (
                  <p className="text-xs text-red-500 font-bold bg-red-500/10 p-2.5 rounded-lg border border-red-500/15 text-right">
                    {pinError}
                  </p>
                )}

                {pinSuccess && (
                  <p className="text-xs text-emerald-500 font-bold bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/15 text-right">
                    {pinSuccess}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-brand text-white py-3.5 rounded-xl font-black shadow-lg shadow-brand/25 hover:bg-brand-hover active:scale-[0.98] transition-all text-sm"
                >
                  تأكيد رمز المرور والتحقق
                </button>
              </form>
            </div>
          )}
        </motion.section>

        {/* Info Section */}
        <section className="bg-black/5 dark:bg-white/5 rounded-3xl p-8 border border-black/5 dark:border-white/5 text-center space-y-4">
          <p className="text-gray-500 text-sm">
            {language === 'ar' 
              ? 'تغيير الإعدادات سيؤثر على مظهر وتجربة التطبيق فوراً.' 
              : 'Changing settings will affect the app appearance and experience immediately.'}
          </p>
          <div className="pt-4 flex justify-center gap-6">
            <div className="text-center">
              <div className="text-[#0f172a] dark:text-white font-bold">1.0.0</div>
              <div className="text-gray-500 text-xs uppercase">Version</div>
            </div>
            <div className="w-px h-8 bg-black/10 dark:bg-white/10"></div>
            <div className="text-center">
              <div className="text-[#0f172a] dark:text-white font-bold">Beta</div>
              <div className="text-gray-500 text-xs uppercase">Status</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
