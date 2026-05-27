import { Menu, Search, User, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { NotificationDropdown } from "./NotificationDropdown";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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

  return (
    <header className="fixed top-2.5 sm:top-4 left-2.5 sm:left-4 right-2.5 sm:right-4 h-14 sm:h-16 bg-white/95 backdrop-blur-2xl z-50 flex items-center justify-between px-3 sm:px-6 lg:px-8 border border-[#E5E7EB] rounded-2xl sm:rounded-3xl shadow-sm transition-all text-[#111827]">
      <div className="flex items-center gap-1.5 sm:gap-3">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand rounded-xl transition-all text-gray-700"
          id="menu-toggle"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <Link to="/" className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-brand rounded-lg p-1">
          <span className="bg-brand text-white px-2.5 py-1 rounded-xl font-extrabold shadow-md group-hover:scale-105 transition-transform text-xs sm:text-sm uppercase">اساد TV</span>
          <span className="text-gray-900 hidden sm:inline">ستاد</span>
        </Link>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <Link 
          to="/search" 
          className="p-2 bg-gray-100 hover:bg-brand/10 text-gray-700 hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand rounded-xl transition-all flex items-center justify-center"
          title="بحث"
        >
          <Search className="w-4.5 h-4.5 sm:w-5 h-5" />
        </Link>
        <div className="relative">
          <button 
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 bg-gray-100 hover:bg-brand/10 text-gray-700 hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand rounded-xl transition-all relative flex items-center justify-center"
          >
            <Bell className="w-4.5 h-4.5 sm:w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-brand rounded-full ring-2 ring-white"></span>
          </button>
          <NotificationDropdown isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>
        
        {isAdmin ? (
          <Link 
            to="/admin" 
            className="flex items-center gap-2 bg-brand text-white px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl font-black text-xs hover:bg-brand-hover active:scale-95 hover:shadow-[0_0_20px_rgba(0,194,255,0.4)] transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-white"
          >
            <User className="w-4 h-4 text-white" />
            <span className="font-extrabold">التحكم</span>
          </Link>
        ) : (
          <Link 
            to="/admin" 
            className="flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl font-semibold text-xs transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <User className="w-4 h-4 text-gray-500" />
            <span>تسجيل الدخول</span>
          </Link>
        )}
      </div>
    </header>
  );
}
