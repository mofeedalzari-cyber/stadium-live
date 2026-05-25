import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { Trophy, Tv, Film, Play, X, Bell } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ToastItem {
  id: string;
  type: "match" | "channel" | "media";
  title: string;
  message: string;
  image?: string;
  link: string;
  timestamp: number;
}

const SHOWN_KEY = "notified_banners_session_ids";

const getShownIds = (): string[] => {
  try {
    return JSON.parse(sessionStorage.getItem(SHOWN_KEY) || "[]");
  } catch (e) {
    return [];
  }
};

const addShownId = (id: string) => {
  try {
    const list = getShownIds();
    if (!list.includes(id)) {
      list.push(id);
      sessionStorage.setItem(SHOWN_KEY, JSON.stringify(list));
    }
  } catch (e) {}
};

const playChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // First high beep
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
    gain1.gain.setValueAtTime(0.06, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);
    
    // Second higher beep right after for double-chime effect
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        osc2.frequency.setValueAtTime(1174.66, ctx.currentTime); // D6
        gain2.gain.setValueAtTime(0.06, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.25);
      } catch (e) {}
    }, 100);
  } catch (err) {
    console.warn("Sound play blocked or failed:", err);
  }
};

export function NotificationToast() {
  const [activeToast, setActiveToast] = useState<ToastItem | null>(null);
  const navigate = useNavigate();
  const mountedAt = useRef<number>(Date.now());
  const initialLoadFetched = useRef<{ [key: string]: boolean }>({
    matches: false,
    channels: false,
    media: false,
  });

  const getMillis = (timestamp: any): number => {
    if (!timestamp) return 0;
    if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
    if (timestamp.seconds) return timestamp.seconds * 1000;
    if (timestamp instanceof Date) return timestamp.getTime();
    if (typeof timestamp === "string") return new Date(timestamp).getTime();
    if (typeof timestamp === "number") return timestamp;
    return 0;
  };

  useEffect(() => {
    // 1. Listen to matches
    const qMatches = query(collection(db, "matches"), orderBy("updatedAt", "desc"), limit(1));
    const unsubMatches = onSnapshot(qMatches, (snap) => {
      if (!initialLoadFetched.current.matches) {
        initialLoadFetched.current.matches = true;
        return; // Ignore the initial snapshot emitted on database link
      }

      snap.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const docData = change.doc.data();
          const docId = change.doc.id;
          const updatedTime = getMillis(docData.updatedAt || docData.createdAt);
          
          // Only notify if updated index is AFTER mounting and hasn't been shown in this session
          if (updatedTime > mountedAt.current && !getShownIds().includes(docId)) {
            const teamA = docData.teamA || "فريق أ";
            const teamB = docData.teamB || "فريق ب";
            const leagueName = docData.league || "البطولة";
            
            triggerToast({
              id: docId,
              type: "match",
              title: "مباراة مباشرة جديدة 🏆",
              message: `شاهد الآن البث المباشر: ${teamB} ضد ${teamA} في ${leagueName}`,
              image: docData.logoA || docData.logoB || undefined,
              link: `/match/${docId}`,
              timestamp: updatedTime
            });
          }
        }
      });
    });

    // 2. Listen to channels
    const qChannels = query(collection(db, "channels"), orderBy("updatedAt", "desc"), limit(1));
    const unsubChannels = onSnapshot(qChannels, (snap) => {
      if (!initialLoadFetched.current.channels) {
        initialLoadFetched.current.channels = true;
        return;
      }

      snap.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const docData = change.doc.data();
          const docId = change.doc.id;
          const updatedTime = getMillis(docData.updatedAt || docData.createdAt);

          if (updatedTime > mountedAt.current && !getShownIds().includes(docId)) {
            triggerToast({
              id: docId,
              type: "channel",
              title: "قناة بث مباشر جديدة 📺",
              message: `تم إضافة قناة ${docData.name || ""} - شاهد الآن بجودة عالية!`,
              image: docData.logo || undefined,
              link: `/channel/${docId}`,
              timestamp: updatedTime
            });
          }
        }
      });
    });

    // 3. Listen to media (movies & series)
    const qMedia = query(collection(db, "media"), orderBy("updatedAt", "desc"), limit(1));
    const unsubMedia = onSnapshot(qMedia, (snap) => {
      if (!initialLoadFetched.current.media) {
        initialLoadFetched.current.media = true;
        return;
      }

      snap.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const docData = change.doc.data();
          const docId = change.doc.id;
          const updatedTime = getMillis(docData.updatedAt || docData.createdAt);

          if (updatedTime > mountedAt.current && !getShownIds().includes(docId)) {
            const isSeries = docData.type === "series";
            const mediaType = isSeries ? "مسلسل" : "فيلم";
            const title = docData.title || docData.name || "ميديا جديدة";
            triggerToast({
              id: docId,
              type: "media",
              title: isSeries ? "مسلسل جديد جديد 🍿" : "فيلم سينمائي جديد 🎬",
              message: `شاهد الآن ${mediaType}: ${title} بجودة عالية وبدون إعلانات`,
              image: docData.poster || undefined,
              link: `/media/${docId}`,
              timestamp: updatedTime
            });
          }
        }
      });
    });

    return () => {
      unsubMatches();
      unsubChannels();
      unsubMedia();
    };
  }, []);

  const triggerToast = (item: ToastItem) => {
    addShownId(item.id);
    setActiveToast(item);
    playChime();
  };

  // Auto close toast after 8 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const handleToastClick = () => {
    if (activeToast) {
      navigate(activeToast.link);
      setActiveToast(null);
    }
  };

  return (
    <AnimatePresence>
      {activeToast && (
        <motion.div
          initial={{ opacity: 0, y: -80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.9 }}
          transition={{ type: "spring", damping: 15, stiffness: 180 }}
          className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[390px] bg-white/95 dark:bg-[#121212]/95 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] z-[99999] overflow-hidden p-4 group select-none cursor-pointer hover:border-brand/40 transition-colors"
          style={{ direction: "rtl" }}
          onClick={handleToastClick}
        >
          {/* Subtle Dynamic Ambient BG Match Color */}
          <div className="absolute inset-0 bg-brand/[0.02] dark:bg-brand/[0.04] pointer-events-none" />

          <div className="flex gap-3.5 relative">
            {/* Left Image / Dynamic Symbol */}
            <div className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center">
              {activeToast.image ? (
                <img src={activeToast.image} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full bg-brand/10 text-brand flex items-center justify-center">
                  {activeToast.type === "match" ? (
                    <Trophy className="w-6 h-6" />
                  ) : activeToast.type === "channel" ? (
                    <Tv className="w-6 h-6" />
                  ) : (
                    <Film className="w-6 h-6" />
                  )}
                </div>
              )}
            </div>

            {/* Middle Content */}
            <div className="flex-1 min-w-0 pr-0.5">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="p-1 bg-brand/10 text-brand rounded-full shrink-0">
                  <Bell className="w-3 h-3 animate-bounce" />
                </span>
                <span className="text-[11px] font-black text-brand tracking-wider">
                  {activeToast.type === "match" ? "بث مباشر" : activeToast.type === "channel" ? "قناة جديدة" : "إضافة جديدة"}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 mr-auto font-black">
                  الآن
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-black text-[#0f172a] dark:text-white line-clamp-1 mb-0.5">
                {activeToast.title}
              </h4>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                {activeToast.message}
              </p>
            </div>

            {/* Action buttons (Close + Navigate hint) */}
            <div className="flex flex-col justify-between items-end shrink-0 pl-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveToast(null);
                }}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                title="إغلاق التنبيه"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="p-1.5 bg-brand text-white rounded-full group-hover:scale-110 active:scale-90 transition-all duration-200">
                <Play className="w-2.5 h-2.5 fill-current" />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
