import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "motion/react";
import { Tv, Film, Trophy, MonitorPlay, Sparkles } from "lucide-react";
import { useSettings } from "../SettingsContext";

export function LatestAdditions() {
  const { t } = useSettings();
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "match" | "channel" | "media">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    let fetchedMatches: any[] = [];
    let fetchedChannels: any[] = [];
    let fetchedMedia: any[] = [];

    const combineAndSet = () => {
      const combined = [
        ...fetchedMatches,
        ...fetchedChannels,
        ...fetchedMedia,
      ];
      // Sort by updatedAt desc
      const sorted = combined.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
        const timeB = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setItems(sorted);
      setLoading(false);
    };

    // 1. Matches
    const qMatches = query(collection(db, "matches"), orderBy("updatedAt", "desc"), limit(20));
    const unsubMatches = onSnapshot(qMatches, (snap) => {
      fetchedMatches = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        collection: "match"
      }));
      combineAndSet();
    }, () => {
      combineAndSet();
    });

    // 2. Channels
    const qChannels = query(collection(db, "channels"), orderBy("updatedAt", "desc"), limit(30));
    const unsubChannels = onSnapshot(qChannels, (snap) => {
      fetchedChannels = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        collection: "channel"
      }));
      combineAndSet();
    }, () => {
      combineAndSet();
    });

    // 3. Media
    const qMedia = query(collection(db, "media"), orderBy("updatedAt", "desc"), limit(40));
    const unsubMedia = onSnapshot(qMedia, (snap) => {
      fetchedMedia = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        collection: "media"
      }));
      combineAndSet();
    }, () => {
      combineAndSet();
    });

    return () => {
      unsubMatches();
      unsubChannels();
      unsubMedia();
    };
  }, []);

  const filteredItems = items.filter(item => {
    if (filter === "all") return true;
    return item.collection === filter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand/20 rounded-2xl shadow-[0_0_15px_rgba(5,150,105,0.2)]">
            <Sparkles className="text-brand w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black">{t('latest_additions')}</h1>
            <p className="text-xs text-gray-500 mt-1">تصفح آخر ما تم إضافته للتطبيق من مباريات وبث مباشر وأفلام ومسلسلات</p>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === "all"
                ? "bg-brand text-white shadow-lg shadow-brand/20"
                : "bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10"
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setFilter("match")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              filter === "match"
                ? "bg-brand text-white shadow-lg shadow-brand/20"
                : "bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            المباريات
          </button>
          <button
            onClick={() => setFilter("channel")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              filter === "channel"
                ? "bg-brand text-white shadow-lg shadow-brand/20"
                : "bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10"
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            قنوات البث المباشر
          </button>
          <button
            onClick={() => setFilter("media")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              filter === "media"
                ? "bg-brand text-white shadow-lg shadow-brand/20"
                : "bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            الأفلام والمسلسلات
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((i) => (
            <div key={i} className="aspect-[2/3] bg-black/5 dark:bg-white/5 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => {
              const displayTitle = item.collection === "match" 
                ? `${item.teamA} VS ${item.teamB}`
                : (item.name || item.title);

              const imageSrc = item.collection === "match"
                ? (item.logoA || "https://placehold.co/400x600/1a1a1a/white?text=Match")
                : item.collection === "channel"
                ? (item.logo || "https://placehold.co/400x600/1a1a1a/red?text=Channel")
                : (item.poster || "https://placehold.co/400x600/1a1a1a/white?text=No+Poster");

              const badgeText = item.collection === "match"
                ? "مباراة"
                : item.collection === "channel"
                ? "قناة"
                : item.type === "series"
                ? "مسلسل"
                : "فيلم";

              const badgeBg = item.collection === "match"
                ? "bg-red-600/90 text-white"
                : item.collection === "channel"
                ? "bg-brand/90 text-white"
                : item.type === "series"
                ? "bg-indigo-600/90 text-white"
                : "bg-teal-600/90 text-white";

              return (
                <motion.div
                  key={`${item.collection}-${item.id}-${index}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ y: -6 }}
                  className="group relative"
                >
                  <Link to={`/${item.collection}/${item.id}`} className="block">
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#1a1a1a] border border-black/5 dark:border-white/5 shadow-lg group-hover:border-brand/40 transition-all duration-300">
                      <img
                        src={imageSrc}
                        alt={displayTitle}
                        className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${
                          (item.collection === 'channel' || item.collection === 'match') 
                            ? 'object-contain p-2.5 bg-slate-50 dark:bg-neutral-900/40' 
                            : 'object-cover'
                        }`}
                        loading="lazy"
                      />

                      {/* Collection Badge */}
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg backdrop-blur-md shadow-md transform scale-100 group-hover:scale-105 transition-all duration-300 ${badgeBg}`}>
                          {badgeText}
                        </span>
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <h3 className="mt-2.5 font-bold text-[10px] sm:text-xs text-center leading-snug text-gray-700 dark:text-gray-300 group-hover:text-brand transition-colors px-1 break-words">
                      {displayTitle}
                    </h3>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {filteredItems.length === 0 && !loading && (
        <div className="py-20 text-center text-gray-500 bg-[#161616] rounded-3xl border border-dashed border-white/10">
               <Trophy className="w-12 h-12 mb-4 mx-auto opacity-20 text-brand" />
               <p className="font-bold">لا يوجد محتوى في هذا القسم حالياً</p>
        </div>
      )}
    </div>
  );
}
