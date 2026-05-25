import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { collection, query, limit, onSnapshot, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { MatchCard } from "../../components/MatchCard";
import { CategorySection } from "../../components/CategorySection";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Tv, Film, MonitorPlay, ChevronLeft, Newspaper, Search, Calendar, Play, Radio, Users, Activity, Flame, Info, Percent, Sparkles } from "lucide-react";
import { MatchSkeleton } from "../../components/Skeleton";
import { useSettings } from "../SettingsContext";

// Interactive League Standings styled per Sofascore
const LEAGUE_STANDINGS: any = {
  pl: [
    { rank: 1, team: "مانشستر سيتي", matches: 34, gd: "+48", points: 82, logo: "https://placehold.co/80x80/2563eb/fff?text=MCI" },
    { rank: 2, team: "أرسنال", matches: 34, gd: "+46", points: 80, logo: "https://placehold.co/80x80/009bd6/fff?text=ARS" },
    { rank: 3, team: "ليفربول", matches: 34, gd: "+35", points: 75, logo: "https://placehold.co/80x80/00a3bf/fff?text=LIV" },
    { rank: 4, team: "أستون فيلا", matches: 34, gd: "+18", points: 67, logo: "https://placehold.co/80x80/7c2d12/fff?text=AVL" },
    { rank: 5, team: "توتنهام", matches: 33, gd: "+12", points: 60, logo: "https://placehold.co/80x80/1e293b/fff?text=TOT" },
  ],
  laliga: [
    { rank: 1, team: "ريال مدريد", matches: 34, gd: "+52", points: 87, logo: "https://placehold.co/80x80/ea580c/fff?text=RMA" },
    { rank: 2, team: "برشلونة", matches: 34, gd: "+31", points: 73, logo: "https://placehold.co/80x80/1e3a8a/fff?text=BAR" },
    { rank: 3, team: "جيرونا", matches: 34, gd: "+29", points: 74, logo: "https://placehold.co/80x80/00C2FF/fff?text=GIR" },
    { rank: 4, team: "أتلتيكو مدريد", matches: 34, gd: "+23", points: 67, logo: "https://placehold.co/80x80/112a46/fff?text=ATM" },
    { rank: 5, team: "أتلتيك بيلباو", matches: 34, gd: "+17", points: 61, logo: "https://placehold.co/80x80/0d9488/fff?text=ATH" },
  ],
  champions: [
    { rank: 1, team: "بايرن ميونخ", matches: 12, gd: "+16", points: 28, logo: "https://placehold.co/80x80/04529c/fff?text=FCB" },
    { rank: 2, team: "ريال مدريد", matches: 12, gd: "+15", points: 28, logo: "https://placehold.co/80x80/ea580c/fff?text=RMA" },
    { rank: 3, team: "باريس سان جيرمان", matches: 12, gd: "+8", points: 22, logo: "https://placehold.co/80x80/0284c7/fff?text=PSG" },
    { rank: 4, team: "بروسيا دورتموند", matches: 12, gd: "+9", points: 21, logo: "https://placehold.co/80x80/00c2ff/fff?text=BVB" },
  ]
};

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

  // Match Center States
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
    // Real-time matches - Latest first
    const qMatches = query(
      collection(db, "matches"), 
      orderBy("updatedAt", "desc"), 
      ...(isMatchesPage ? [] : [limit(6)])
    );
    const unsubMatches = onSnapshot(qMatches, (snap) => {
      const allMatches = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), collection: 'match' }));
      
      const now = new Date();
      // Filter out finished matches
      const activeMatches = allMatches.filter((match: any) => {
        if (!match.time) return false;
        const matchDate = new Date(match.time);
        const diffMinutes = (now.getTime() - matchDate.getTime()) / (1000 * 60);
        const isFinished = match.status === "finished" || diffMinutes > 120;
        return !isFinished;
      });

      // If the user is admin, automatically delete finished matches from Firestore
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
      setLatestMedia(allMedia.slice(0, 10));
      setTurkishSeries(allMedia.filter((m: any) => m.category === "turkish_series"));
      setArabicMovies(allMedia.filter((m: any) => m.category === "arabic_movies"));
      setIndianMovies(allMedia.filter((m: any) => m.category === "indian_movies"));
      setDocumentaries(allMedia.filter((m: any) => m.category === "documentary"));
      setActionMovies(allMedia.filter((m: any) => m.category === "action"));
      
      setLatestAll(prev => {
        const other = prev.filter((i: any) => i.collection !== 'media');
        const combined = [...other, ...allMedia.slice(0, 8)];
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
        const combined = [...other, ...allChannels.slice(0, 8)];
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
      <div className="-mx-3 sm:-mx-6 lg:-mx-12 min-h-screen bg-gradient-to-b from-[#0a0f1d] to-[#05080f] text-white pb-24 px-4 sm:px-8 lg:px-12 pt-6 font-sans text-right" style={{ direction: "rtl" }}>
        <div className="bg-[#141f32]/50 backdrop-blur-sm rounded-[2rem] p-5 sm:p-6 border border-white/10 shadow-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: "all", label: "كل المباريات", icon: Activity },
              { id: "live", label: "مباشر الآن", icon: Radio, live: true },
              { id: "upcoming", label: "القادمة", icon: Calendar },
              { id: "finished", label: "المنتهية", icon: Trophy }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-300 active:scale-95 flex items-center gap-1.5 ${
                  activeTab === tab.id 
                    ? "bg-brand text-slate-950 shadow-md shadow-brand/20" 
                    : "bg-slate-900/50 text-gray-400 hover:text-white border border-white/5"
                }`}
              >
                {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                {tab.label}
                {tab.live && activeTab === tab.id && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
              </button>
            ))}
          </div>

          <div className="relative group max-w-sm w-full">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
            <input 
              type="text" 
              placeholder="ابحث بالفريق، البطولة، أو المعلق..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0f1d]/80 border border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-sm outline-none focus:border-brand/60 focus:bg-[#141f32] transition-all text-white placeholder-gray-500"
            />
          </div>
        </div>

        <div className="w-full space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-brand rounded-full" />
            <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
              <Radio className="w-4 h-4 text-brand animate-pulse" />
              <span>نتائج ولقاءات التصفية ({filteredMatches.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              [1, 2, 3, 4].map(idx => <MatchSkeleton key={idx} />)
            ) : filteredMatches.length > 0 ? (
              filteredMatches.map((m: any, idx: number) => (
                <motion.div 
                  key={`${m.id}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="w-full"
                >
                  <MatchCard match={m} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full bg-[#141f32]/50 rounded-3xl p-12 text-center border border-white/5 flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 bg-[#0a0f1d]/50 rounded-full flex items-center justify-center border border-white/5">
                  <Trophy className="w-8 h-8 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">لا توجد مباريات تطابق هذا التصنيف</h3>
                  <p className="text-xs text-gray-500 mt-1">تأكد من كتابة أحرف البحث بشكل صحيح أو انتقل لتبويب آخر</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-24 px-4 sm:px-6 lg:px-8 overflow-x-hidden text-right" style={{ direction: "rtl" }}>
      
      {/* Continue Watching Section - Improved Design */}
      {continueWatching.length > 0 && (
        <section className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-brand/10 rounded-xl">
                <Play className="w-5 h-5 text-brand" />
              </div>
              <h2 className="text-lg sm:text-xl font-black">تابع المشاهدة</h2>
            </div>
            <span className="text-xs text-gray-400">{continueWatching.length} عنصر</span>
          </div>
          
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
              {continueWatching.map((item: any, idx: number) => (
                <motion.div 
                  key={`${item.type}-${item.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="flex-shrink-0 w-[140px] sm:w-[160px] snap-start group"
                >
                  <Link to={item.type === 'match' ? `/match/${item.id}` : `/${item.type}/${item.id}`} className="block">
                    <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 shadow-md group-hover:shadow-xl transition-all duration-300">
                      <div className="aspect-video">
                        {item.type === 'match' ? (
                          <div className="w-full h-full flex items-center justify-center gap-2 p-3 bg-gray-100 dark:bg-gray-800">
                            <img src={item.logoA || "https://placehold.co/50x50/f1f5f9/000?text=A"} alt="Logo A" className="w-8 h-8 object-contain" />
                            <span className="text-gray-400 text-[10px] font-bold">VS</span>
                            <img src={item.logoB || "https://placehold.co/50x50/f1f5f9/000?text=B"} alt="Logo B" className="w-8 h-8 object-contain" />
                          </div>
                        ) : (
                          <img 
                            src={item.type === 'channel' ? (item.logo || "https://placehold.co/100/f1f5f9/000?text=?") : (item.poster || "https://placehold.co/100/f1f5f9/000?text=?")} 
                            alt={item.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
                        <div className="h-full bg-brand rounded-full" style={{ width: '65%' }} />
                      </div>
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        {item.type === 'channel' ? 'قناة' : item.type === 'match' ? 'مباراة' : 'سينما'}
                      </div>
                    </div>
                    <h4 className="mt-2 font-bold text-xs sm:text-sm text-center line-clamp-2 group-hover:text-brand transition-colors">
                      {item.name}
                    </h4>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Live Matches Section - Enhanced */}
      {matches.some((m: any) => {
        const matchDate = new Date(m.time);
        const diffMinutes = (now.getTime() - matchDate.getTime()) / (1000 * 60);
        return m.status === "live" || (m.status !== "finished" && diffMinutes >= 0 && diffMinutes <= 120);
      }) && (
        <section className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-red-500 rounded-full animate-pulse" />
              <h2 className="text-lg sm:text-xl font-black flex items-center gap-2">
                <span>المباريات المباشرة 🔴</span>
                {matches.filter((m: any) => m.status === "live").length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {matches.filter((m: any) => m.status === "live").length} مباشر
                  </span>
                )}
              </h2>
            </div>
            <Link 
              to="/matches" 
              className="text-xs font-bold text-gray-500 hover:text-brand transition-colors flex items-center gap-1"
            >
              <span>جميع المباريات</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(idx => <MatchSkeleton key={idx} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {matches.filter((m: any) => {
                const matchDate = new Date(m.time);
                const diffMinutes = (now.getTime() - matchDate.getTime()) / (1000 * 60);
                const isLive = m.status === "live" || (m.status !== "finished" && diffMinutes >= 0 && diffMinutes <= 120);
                return isLive;
              }).slice(0, 6).map((m: any, idx: number) => (
                <motion.div 
                  key={`${m.id}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="w-full"
                >
                  <MatchCard match={m} />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Categories Grid - Professional Layout */}
      <div className="space-y-6">
        {/* Sports Channels */}
        <CategorySection 
          title="القنوات الرياضية" 
          icon={Tv} 
          items={channels.filter(c => {
            const g = (c.group || "").toLowerCase();
            return g === "sports" || g.includes("sport") || g.includes("bein") || g.includes("رياض") || g.includes("دوري") || g.includes("كأس") || g.includes("ssc") || g.includes("alkass");
          }).slice(0, 12)} 
          type="channel"
          filter={{ key: 'group', value: 'sports' }}
        />

        {/* Arabic Movies */}
        <CategorySection 
          title="أفلام عربية" 
          icon={Film} 
          items={arabicMovies.slice(0, 12)} 
          type="media"
          filter={{ key: 'category', value: 'arabic_movies' }}
        />

        {/* Turkish Series */}
        <CategorySection 
          title="مسلسلات تركية" 
          icon={MonitorPlay} 
          items={turkishSeries.slice(0, 12)} 
          type="media"
          filter={{ key: 'category', value: 'turkish_series' }}
        />

        {/* Documentaries */}
        {documentaries.length > 0 && (
          <CategorySection 
            title="وثائقيات" 
            icon={MonitorPlay} 
            items={documentaries.slice(0, 12)} 
            type="media"
            filter={{ key: 'category', value: 'documentary' }}
          />
        )}

        {/* Action Movies */}
        {actionMovies.length > 0 && (
          <CategorySection 
            title="أفلام أكشن" 
            icon={Film} 
            items={actionMovies.slice(0, 12)} 
            type="media"
            filter={{ key: 'category', value: 'action' }}
          />
        )}

        {/* News Channels */}
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

        {/* Custom Categories */}
        {customCategories.map(cat => {
          const catItems = cat.type === 'channel'
            ? channels.filter((c: any) => (c.group || "").toLowerCase() === cat.id.toLowerCase())
            : allMediaItems.filter((m: any) => (m.category || "").toLowerCase() === cat.id.toLowerCase());
          if (catItems.length === 0) return null;
          return (
            <CategorySection 
              key={cat.id}
              title={cat.name} 
              icon={cat.type === 'channel' ? Tv : cat.type === 'movie' ? Film : MonitorPlay} 
              items={catItems.slice(0, 12)} 
              type={cat.type === 'channel' ? "channel" : "media"}
              filter={cat.type === 'channel' ? { key: 'group', value: cat.id } : { key: 'category', value: cat.id }}
            />
          );
        })}
      </div>
    </div>
  );
}