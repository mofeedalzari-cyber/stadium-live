import { Home, Trophy, Tv, Film, MonitorPlay, Newspaper, Heart, Settings, LayoutDashboard, X, Info, LogOut, Zap, ListPlus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { useState, useEffect } from "react";
import { useSettings } from "../lib/SettingsContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

const menuItemsWithLabels = [
  { icon: Home, key: "home", path: "/" },
  { icon: Trophy, key: "matches", path: "/matches" },
  { icon: Tv, key: "channels", path: "/channels" },
  { icon: Film, key: "movies", path: "/media" },
  { icon: Heart, key: "favorites", path: "/favorites" },
];

const categoryItems = [
  { icon: Trophy, key: "sports", path: "/channels?group=sports" },
  { icon: Tv, key: "telephony_channels", path: "/channels?group=telephony" },
  { icon: Newspaper, key: "news", path: "/channels?group=news" },
  { icon: Film, key: "arabic_movies", path: "/media?category=arabic_movies" },
  { icon: Film, key: "indian_movies", path: "/media?category=indian_movies" },
  { icon: Tv, key: "turkish_series", path: "/media?category=turkish_series" },
  { icon: MonitorPlay, key: "documentary", path: "/media?category=documentary" },
  { icon: Zap, key: "action", path: "/media?category=action" },
];

const otherItems = [
  { icon: LayoutDashboard, key: "admin", path: "/admin" },
  { icon: Settings, key: "settings", path: "/settings" },
  { icon: Info, key: "about", path: "/about" },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [customCategories, setCustomCategories] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categories"), (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomCategories(cats);
    });
    return () => unsub();
  }, []);

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

  const handleLogout = async () => {
    localStorage.removeItem("admin_authenticated");
    setIsAdmin(false);
    window.dispatchEvent(new Event("adminAuthChange"));
    navigate("/");
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : (window.innerWidth < 1024 ? "130%" : 0) }}
        className={cn(
          "fixed top-4 bottom-4 right-4 h-[calc(100vh-2rem)] w-72 bg-white backdrop-blur-xl z-[70] shadow-2xl rounded-3xl border border-[#E5E7EB] pt-14 pb-6 px-4 transition-all duration-300 flex flex-col",
          "lg:sticky lg:top-[7rem] lg:right-auto lg:bottom-auto lg:h-[calc(100vh-9rem)] lg:w-64 lg:bg-white/80 lg:my-4 lg:mr-8 lg:ml-0 lg:pt-6 lg:pb-6 lg:rounded-3xl lg:border lg:border-[#E5E7EB] lg:shadow-md lg:translate-x-0 text-[#111827]",
          !isOpen && "translate-x-[130%] lg:translate-x-0"
        )}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 left-4 p-2 lg:hidden hover:bg-gray-100 text-gray-700 hover:text-brand rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>
        
        <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {menuItemsWithLabels.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && onClose()}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 sm:py-2.5 rounded-2xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-brand focus:scale-105 hover:scale-101",
                    isActive 
                      ? "bg-brand text-white shadow-md shadow-brand/20 font-extrabold" 
                      : "hover:bg-gray-100 text-gray-600 hover:text-gray-950"
                  )}
                >
                  <item.icon className={cn("w-4.5 h-4.5 shrink-0", isActive ? "text-white" : "text-gray-500 group-hover:text-brand transition-colors")} />
                  <span className="text-sm font-semibold">{t(item.key)}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-4 pb-3">
            <h3 className="px-4 text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-2.5">{t('categories')}</h3>
            <div className="space-y-1">
              {[
                ...categoryItems,
                ...customCategories.map(cat => ({
                  icon: cat.type === 'channel' ? Tv : cat.type === 'movie' ? Film : MonitorPlay,
                  key: cat.id,
                  name: cat.name,
                  path: cat.type === 'channel' ? `/channels?group=${cat.id}` : `/media?category=${cat.id}`
                }))
              ].map((item: any) => {
                const isActive = location.pathname + location.search === item.path || location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => window.innerWidth < 1024 && onClose()}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 sm:py-2.5 rounded-2xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-brand focus:scale-105 hover:scale-101",
                      isActive 
                        ? "bg-brand/10 text-brand font-black border border-brand/25" 
                        : "hover:bg-gray-100 text-gray-600 hover:text-gray-950"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-brand" : "text-gray-500 group-hover:text-brand transition-colors")} />
                    <span className="text-xs font-semibold">{item.name || t(item.key)}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 mt-4 space-y-1">
            {otherItems.filter(i => i.path !== '/admin' || isAdmin).map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && onClose()}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 sm:py-2.5 rounded-2xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-brand focus:scale-105 hover:scale-101",
                    isActive 
                      ? "bg-brand text-white shadow-md shadow-brand/20 font-extrabold" 
                      : "hover:bg-gray-100 text-gray-600 hover:text-gray-950"
                  )}
                >
                  <item.icon className={cn("w-4.5 h-4.5 shrink-0", isActive ? "text-white" : "text-gray-500 group-hover:text-brand transition-colors")} />
                  <span className="text-sm font-semibold">{t(item.key)}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {isAdmin && (
          <button
            onClick={handleLogout}
            className="mt-4 flex items-center gap-3 px-4 py-3 sm:py-2.5 rounded-2xl transition-all text-[#FF3B30] hover:bg-[#FF3B30]/15 w-full font-black text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3B30]"
          >
            <LogOut className="w-4.5 h-4.5 shrink-0" />
            <span>{t('logout')}</span>
          </button>
        )}
      </motion.aside>
    </>
  );
}
