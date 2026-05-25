import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { collection, query, limit, onSnapshot, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { MatchCard } from "../../components/MatchCard";
import { CategorySection } from "../../components/CategorySection";
import axios from "axios";
import { motion } from "motion/react";
import { Trophy, Tv, Film, MonitorPlay, ChevronLeft, Newspaper, Search, Calendar, Play, Radio, Users, Activity, Flame, Info, Percent } from "lucide-react";
import { MatchSkeleton } from "../../components/Skeleton";
import { useSettings } from "../SettingsContext";

// ... (LEAGUE_STANDINGS remains unchanged)

export function Home() {
  const { t } = useSettings();
  const location = useLocation();
  const isMatchesPage = location.pathname === "/matches";
  const [matches, setMatches] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [latestMedia, setLatestMedia] = useState<any[]>([]);
  const [allMediaItems, setAllMediaItems] = useState<any[]>([]);
  const [customCategories, setCustomCategories] = useState<any[]>([]);
  const [latestAll, setLatestAll] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [turkishSeries, setTurkishSeries] = useState<any[]>([]);
  const [arabicMovies, setArabicMovies] = useState<any[]>([]);
  const [indianMovies, setIndianMovies] = useState<any[]>([]);
  const [documentaries, setDocumentaries] = useState<any[]>([]);
  const [actionMovies, setActionMovies] = useState<any[]>([]);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "live" | "upcoming" | "finished">("all");
  const [selectedLeague, setSelectedLeague] = useState<"laliga" | "pl" | "champions">("laliga");

  useEffect(() => {
    const loadCV = () => {
      try {
        const list = JSON.parse(localStorage.getItem("stad_continue_watching") || "[]");
        setContinueWatching(list);
      } catch (e) {
        console.error(e);
      }
    };
    loadCV();
    window.addEventListener("continueWatchingChanged", loadCV);
    window.addEventListener("storage", loadCV);
    return () => {
      window.removeEventListener("continueWatchingChanged", loadCV);
      window.removeEventListener("storage", loadCV);
    };
  }, []);

  useEffect(() => {
    const qMatches = query(
      collection(db, "matches"), 
      orderBy("updatedAt", "desc"), 
      ...(isMatchesPage ? [] : [limit(6)])
    );
    const unsubMatches = onSnapshot(qMatches, (snap) => {
      const allMatches = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), collection: 'match' }));
      const now = new Date();
      const activeMatches = allMatches.filter((match: any) => {
        if (!match.time) return false;
        const matchDate = new Date(match.time);
        const diffMinutes = (now.getTime() - matchDate.getTime()) / (1000 * 60);
        const isFinished = match.status === "finished" || diffMinutes > 120;
        return !isFinished;
      });

      const isAdmin = localStorage.getItem("admin_authenticated") === "true";
      if (isAdmin) {
        allMatches.forEach(async (match: any) => {
          if (!match.time) return;
          const matchDate = new Date(match.time);
          const diffMinutes = (now.getTime() - matchDate.getTime()) / (1000 * 60);
          const isFinished = match.status === "finished" || diffMinutes > 120;
          if (isFinished) {
            try {
              await deleteDoc(doc(db, "matches", match.id));
              console.log(`Auto-deleted finished match: ${match.teamA} vs ${match.teamB}`);
            } catch (err) {
              console.error("Failed to auto-delete finished match:", err);
              try {
                handleFirestoreError(err, OperationType.DELETE, `matches/${match.id}`);
              } catch (reportErr) {
                console.error("Reported error:", reportErr);
              }
            }
          }
        });
      }

      setMatches(allMatches);
      setLoading(false);

      setLatestAll(prev => {
        const other = prev.filter((i: any) => i.collection !== 'match');
        const combined = [...other, ...activeMatches.slice(0, 4)];
        const unique = Array.from(new Map(combined.map(item => [`${item.collection}-${item.id}`, item])).values());
        return unique.sort((a: any, b: any) => 
          (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0)
        ).slice(0, 15);
      });
    });

    const qMedia = query(collection(db, "media"), orderBy("updatedAt", "desc"), limit(500));
    const unsubMedia = onSnapshot(qMedia, (snap) => {
      const allMedia = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), collection: 'media' }));
      setAllMediaItems(allMedia);
      setLatestMedia(allMedia.slice(0, 8));
      setTurkishSeries(allMedia.filter((m: any) => m.category === "turkish_series"));
      setArabicMovies(allMedia.filter((m: any) => m.category === "arabic_movies"));
      setIndianMovies(allMedia.filter((m: any) => m.category === "indian_movies"));
      setDocumentaries(allMedia.filter((m: any) => m.category === "documentary"));
      setActionMovies(allMedia.filter((m: any) => m.category === "action"));
      
      setLatestAll(prev => {
        const other = prev.filter((i: any) => i.collection !== 'media');
        const combined = [...other, ...allMedia.slice(0, 6)];
        const unique = Array.from(new Map(combined.map(item => [`${item.collection}-${item.id}`, item])).values());
        return unique.sort((a: any, b: any) => 
          (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0)
        ).slice(0, 15);
      });
    });

    const qChannels = query(collection(db, "channels"), orderBy("updatedAt", "desc"), limit(500));
    const unsubChannels = onSnapshot(qChannels, (snap) => {
      const allChannels = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), collection: 'channel' }));
      setChannels(allChannels);
      
      setLatestAll(prev => {
        const other = prev.filter((i: any) => i.collection !== 'channel');
        const combined = [...other, ...allChannels.slice(0, 6)];
        const unique = Array.from(new Map(combined.map(item => [`${item.collection}-${item.id}`, item])).values());
        return unique.sort((a: any, b: any) => 
          (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0)
        ).slice(0, 15);
      });
    });

    const unsubCats = onSnapshot(collection(db, "categories"), (snap) => {
      const cats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomCategories(cats);
    });

    axios.get("/api/tmdb/trending")
      .then(res => setTrending(res.data.results || []))
      .catch(err => {
        console.warn("Failed to load trending items:", err);
        setTrending([]);
      });

    return () => {
      unsubMatches();
      unsubChannels();
      unsubMedia();
      unsubCats();
    };
  }, []);

  const now = new Date();

  const filteredMatches = matches.filter((match: any) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      (match.teamA || "").toLowerCase().includes(q) ||
      (match.teamB || "").toLowerCase().includes(q) ||
      (match.league || "").toLowerCase().includes(q) ||
      (match.commentator || "").toLowerCase().includes(q);

    if (!matchesSearch) return false;

    const matchDate = new Date(match.time);
    const diffMins = (now.getTime() - matchDate.getTime()) / (1000 * 60);
    const isLive = match.status === "live" || (match.status !== "finished" && diffMins >= 0 && diffMins <= 120);
    const isFinished = match.status === "finished" || diffMins > 120;

    if (activeTab === "live") return isLive;
    if (activeTab === "upcoming") return !isLive && !isFinished;
    if (activeTab === "finished") return isFinished;
    return true;
  });

  if (isMatchesPage) {
    return (
      <div className="-mx-3 sm:-mx-6 lg:-mx-12 min-h-screen bg-[#0a0f1d] text-white pb-24 px-4 sm:px-8 lg:px-12 pt-6 font-sans text-right" style={{ direction: "rtl" }}>
        <div className="bg-[#141f32] rounded-2xl p-4 sm:p-5 border border-white/5 shadow-md mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: "all", label: "كل المباريات" },
              { id: "live", label: "مباشر الآن 🟢" },
              { id: "upcoming", label: "القادمة ⚽" },
              { id: "finished", label: "المنتهية 🏁" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id 
                    ? "bg-brand text-slate-950 shadow-md shadow-brand/20" 
                    : "bg-slate-900/50 text-gray-400 hover:text-white border border-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative group max-w-sm w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
            <input 
              type="text" 
              placeholder="ابحث بالفريق، البطولة، أو المعلق..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0f1d]/75 border border-white/5 rounded-xl py-2 pr-9 pl-3 text-xs outline-none focus:border-brand/60 focus:bg-[#141f32] transition-all text-white placeholder-gray-500"
            />
          </div>
        </div>

        <div className="w-full space-y-5">
          <h2 className="text-sm font-black text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-brand animate-pulse" />
            <span>نتائج ولقاءات التصفية ({filteredMatches.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              [1, 2, 3, 4].map(idx => <MatchSkeleton key={idx} />)
            ) : filteredMatches.length > 0 ? (
              filteredMatches.map((m: any, idx: number) => (
                <div key={`${m.id}-${idx}`} className="w-full">
                  <MatchCard match={m} />
                </div>
              ))
            ) : (
              <div className="col-span-full bg-[#141f32] rounded-2xl p-12 text-center border border-white/5">
                <Trophy className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white">لا يوجد مباريات تطابق هذا التصنيف</h3>
                <p className="text-[11px] text-gray-500 mt-1">تأكد من كتابة أحرف البحث بشكل صحيح أو انتقل لتبويب آخر</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-3 sm:px-6 lg:px-0 overflow-x-hidden text-right" style={{ direction: "rtl" }}>
      
      {/* Continue Watching Section - reduced sizes */}
      {continueWatching.length > 0 && (
        <section className="bg-white dark:bg-[#121212] rounded-2xl p-4 border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-brand/10 rounded-xl border border-brand/15">
              <Tv className="text-brand w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">تابع المشاهدة</h2>
              <p className="text-[9px] text-gray-400">استكمل من حيث توقفت</p>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
            {continueWatching.slice(0, 10).map((item: any) => (
              <motion.div 
                key={`${item.type}-${item.id}`}
                whileHover={{ y: -3, scale: 1.02 }}
                className="flex-shrink-0 w-[90px] sm:w-[110px] snap-start"
              >
                <Link to={item.type === 'match' ? `/match/${item.id}` : `/${item.type}/${item.id}`} className="block">
                  <div className="relative aspect-[3/2] rounded-xl overflow-hidden bg-slate-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 shadow-sm">
                    {item.type === 'match' ? (
                      <div className="w-full h-full flex items-center justify-center gap-1 p-1 bg-slate-100 dark:bg-neutral-800">
                        <img src={item.logoA || "https://placehold.co/40x40"} alt="A" className="w-6 h-6 object-contain" />
                        <span className="text-gray-400 text-[6px]">VS</span>
                        <img src={item.logoB || "https://placehold.co/40x40"} alt="B" className="w-6 h-6 object-contain" />
                      </div>
                    ) : (
                      <img 
                        src={item.type === 'channel' ? (item.logo || "https://placehold.co/100") : (item.poster || "https://placehold.co/100")} 
                        alt={item.name} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand/40">
                      <div className="h-full bg-brand" style={{ width: '65%' }} />
                    </div>
                    <div className="absolute top-1 right-1 bg-black/60 backdrop-blur text-white text-[7px] font-bold px-1 py-0.5 rounded-md">
                      {item.type === 'channel' ? 'قناة' : item.type === 'match' ? 'مباراة' : 'فيلم'}
                    </div>
                  </div>
                  <h4 className="mt-1 text-[9px] font-medium text-gray-800 dark:text-gray-200 text-center line-clamp-1" title={item.name}>
                    {item.name}
                  </h4>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Live Matches Section - reduced cards (only 4) */}
      {matches.some((m: any) => {
        const matchDate = new Date(m.time);
        const diffMinutes = (now.getTime() - matchDate.getTime()) / (1000 * 60);
        return m.status === "live" || (m.status !== "finished" && diffMinutes >= 0 && diffMinutes <= 120);
      }) && (
        <section className="bg-white dark:bg-[#121212] rounded-2xl p-4 border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 bg-brand rounded-full"></span>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                مباريات اليوم المباشرة
                {matches.filter((m: any) => m.status === "live").length > 0 && (
                  <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                    LIVE
                  </span>
                )}
              </h2>
            </div>
            <Link to="/matches" className="text-[10px] font-bold text-brand hover:underline flex items-center gap-0.5">
              <span>الكل</span>
              <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2].map(idx => <MatchSkeleton key={idx} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {matches.filter((m: any) => {
                const matchDate = new Date(m.time);
                const diffMinutes = (now.getTime() - matchDate.getTime()) / (1000 * 60);
                const isLive = m.status === "live" || (m.status !== "finished" && diffMinutes >= 0 && diffMinutes <= 120);
                return isLive;
              }).slice(0, 4).map((m: any, idx: number) => (
                <MatchCard key={`${m.id}-${idx}`} match={m} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Categories Sections - smaller spacing, less items per section */}
      <div className="space-y-5">
        <div className="bg-white dark:bg-[#121212] rounded-2xl p-4 border border-black/5 dark:border-white/5 shadow-sm">
          <CategorySection 
            title="القنوات الرياضية الناقلة" 
            icon={Tv} 
            items={channels.filter(c => {
              const g = (c.group || "").toLowerCase();
              return g === "sports" || g.includes("sport") || g.includes("bein") || g.includes("رياض") || g.includes("دوري") || g.includes("كأس") || g.includes("ssc") || g.includes("alkass");
            }).slice(0, 12)} 
            type="channel"
            filter={{ key: 'group', value: 'sports' }}
          />
        </div>

        <div className="bg-white dark:bg-[#121212] rounded-2xl p-4 border border-black/5 dark:border-white/5 shadow-sm">
          <CategorySection 
            title="أفلام عربية حصرية" 
            icon={Film} 
            items={arabicMovies.slice(0, 12)} 
            type="media"
            filter={{ key: 'category', value: 'arabic_movies' }}
          />
        </div>

        <div className="bg-white dark:bg-[#121212] rounded-2xl p-4 border border-black/5 dark:border-white/5 shadow-sm">
          <CategorySection 
            title="مسلسلات تركية حصرية" 
            icon={MonitorPlay} 
            items={turkishSeries.slice(0, 12)} 
            type="media"
            filter={{ key: 'category', value: 'turkish_series' }}
          />
        </div>

        <div className="bg-white dark:bg-[#121212] rounded-2xl p-4 border border-black/5 dark:border-white/5 shadow-sm">
          <CategorySection 
            title="أفلام وثائقية عالمية" 
            icon={MonitorPlay} 
            items={documentaries.slice(0, 12)} 
            type="media"
            filter={{ key: 'category', value: 'documentary' }}
          />
        </div>

        <div className="bg-white dark:bg-[#121212] rounded-2xl p-4 border border-black/5 dark:border-white/5 shadow-sm">
          <CategorySection 
            title="أفلام أكشن وحركة" 
            icon={Film} 
            items={actionMovies.slice(0, 12)} 
            type="media"
            filter={{ key: 'category', value: 'action' }}
          />
        </div>

        <div className="bg-white dark:bg-[#121212] rounded-2xl p-4 border border-black/5 dark:border-white/5 shadow-sm">
          <CategorySection 
            title="القنوات الإخبارية" 
            icon={Newspaper} 
            items={channels.filter(c => {
              const g = (c.group || "").toLowerCase();
              return g === "news" || g.includes("news") || g.includes("إخبار") || g.includes("أخبار") || g.includes("حدث") || g.includes("جزيرة") || g.includes("عربية");
            }).slice(0, 12)} 
            type="channel"
            filter={{ key: 'group', value: 'news' }}
          />
        </div>

        {customCategories.map(cat => {
          const catItems = cat.type === 'channel'
            ? channels.filter((c: any) => (c.group || "").toLowerCase() === cat.id.toLowerCase())
            : allMediaItems.filter((m: any) => (m.category || "").toLowerCase() === cat.id.toLowerCase());
          if (catItems.length === 0) return null;
          return (
            <div key={cat.id} className="bg-[#141f32]/80 backdrop-blur-md rounded-2xl p-4 border border-white/5 shadow-lg">
              <CategorySection 
                title={cat.name} 
                icon={cat.type === 'channel' ? Tv : cat.type === 'movie' ? Film : MonitorPlay} 
                items={catItems.slice(0, 12)} 
                type={cat.type === 'channel' ? "channel" : "media"}
                filter={cat.type === 'channel' ? { key: 'group', value: cat.id } : { key: 'category', value: cat.id }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
