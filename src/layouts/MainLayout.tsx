import { Outlet, useLocation, Link } from "react-router-dom";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { Footer } from "../components/Footer";
import { FloatingContact } from "../components/FloatingContact";
import { NotificationToast } from "../components/NotificationToast";
import { useState, useEffect, useRef } from "react";
import { Tv, ExternalLink, Home, Trophy, Heart, Search, Film } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { AdScriptRunner } from "../components/AdScriptRunner";
import { useSettings } from "../lib/SettingsContext";

export function MainLayout() {
  const { t } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  const [adsConfig, setAdsConfig] = useState({
    appcreator24HardNav: false,
    startioWebBanner: "",
    popunderCode: "",
    interstitialCode: "",
    startioAppId: "204179223"
  });

  // Listen to live advertisements and revenue configuration from Firebase Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "configs", "ads"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setAdsConfig({
          appcreator24HardNav: d.appcreator24HardNav ?? false,
          startioWebBanner: d.startioWebBanner ?? "",
          popunderCode: d.popunderCode ?? "",
          interstitialCode: d.interstitialCode ?? "",
          startioAppId: d.startioAppId ?? "204179223"
        });
      }
    }, (error) => {
      console.warn("Could not load ads configs from Firestore dynamically:", error);
      // Fallback to local storage
      try {
        const stored = localStorage.getItem("local_ads_config");
        if (stored) {
          setAdsConfig(JSON.parse(stored));
        }
      } catch (e) {}
    });

    return () => unsub();
  }, []);

  // Sync Start.io Web App ID to the document window context
  useEffect(() => {
    if (adsConfig.startioAppId) {
      (window as any).startio = {
        appId: adsConfig.startioAppId
      };
      
      // Attempt to load Start.io script if not already present
      if (!document.getElementById("startio-sdk") && adsConfig.startioAppId) {
        const script = document.createElement("script");
        script.id = "startio-sdk";
        script.src = "https://sdk.startapp.com/web/sdk.js";
        script.async = true;
        document.head.appendChild(script);
      }
    }
  }, [adsConfig.startioAppId]);

  // Keep track of previous path without displaying any ad triggers
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null || touchStartY === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    // Trigger swipe if horizontal movement is greater than vertical and exceeds threshold
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0) {
        // Swipe to the left -> Show Sidebar (which is on the right)
        setSidebarOpen(true);
      } else {
        // Swipe to the right -> Hide Sidebar
        setSidebarOpen(false);
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-[#F5F7FB] text-[#111827] selection:bg-brand selection:text-white flex flex-col transition-colors duration-300 overflow-x-hidden pb-16 lg:pb-0"
      style={{ direction: "rtl" }}
    >
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 overflow-x-hidden mx-3 sm:mx-6 lg:mx-8 my-4 bg-white border border-[#E5E7EB] shadow-sm p-4 sm:p-6 lg:p-10 pt-20 sm:pt-24 lg:pt-28 pb-10 sm:pb-16 rounded-[24px] sm:rounded-[32px] transition-all duration-300 animate-in fade-in duration-500">
          <Outlet />
          {adsConfig.startioWebBanner && (
            <div className="my-6 w-full flex justify-center items-center font-sans text-center">
              <AdScriptRunner html={adsConfig.startioWebBanner} />
            </div>
          )}
          <Footer />
        </main>
      </div>

      {/* Mobile Bottom Navigation - Elegant Premium Light OTT style */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-2xl border-t border-[#E5E7EB] z-50 flex items-center justify-around px-2 lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 px-1 focus:outline-none focus:text-brand transition-all duration-200 ${location.pathname === "/" ? "text-brand font-black scale-105" : "text-gray-500 hover:text-[#111827]"}`}
        >
          <Home className="w-[18px] h-[18px]" />
          <span className="text-[10px] truncate max-w-full font-bold">{t('home') || "الرئيسية"}</span>
        </Link>
        <Link 
          to="/matches" 
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 px-1 focus:outline-none focus:text-brand transition-all duration-200 ${location.pathname === "/matches" ? "text-brand font-black scale-105" : "text-gray-500 hover:text-[#111827]"}`}
        >
          <Trophy className="w-[18px] h-[18px]" />
          <span className="text-[10px] truncate max-w-full font-bold">{t('matches') || "المباريات"}</span>
        </Link>
        <Link 
          to="/channels" 
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 px-1 focus:outline-none focus:text-brand transition-all duration-200 ${location.pathname === "/channels" ? "text-brand font-black scale-105" : "text-gray-500 hover:text-[#111827]"}`}
        >
          <Tv className="w-[18px] h-[18px]" />
          <span className="text-[10px] truncate max-w-full font-bold">{t('channels') || "القنوات"}</span>
        </Link>
        <Link 
          to="/media" 
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 px-1 focus:outline-none focus:text-brand transition-all duration-200 ${location.pathname === "/media" ? "text-brand font-black scale-105" : "text-gray-500 hover:text-[#111827]"}`}
        >
          <Film className="w-[18px] h-[18px]" />
          <span className="text-[10px] truncate max-w-full font-bold">{t('movies') || "السينما"}</span>
        </Link>
        <Link 
          to="/favorites" 
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 px-1 focus:outline-none focus:text-brand transition-all duration-200 ${location.pathname === "/favorites" ? "text-brand font-black scale-105" : "text-gray-500 hover:text-[#111827]"}`}
        >
          <Heart className="w-[18px] h-[18px]" />
          <span className="text-[10px] truncate max-w-full font-bold">{t('favorites') || "المفضلة"}</span>
        </Link>
      </nav>

      <FloatingContact />
      <NotificationToast />
      {adsConfig.popunderCode && (
        <AdScriptRunner html={adsConfig.popunderCode} />
      )}
    </div>
  );
}
