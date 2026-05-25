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
                // Keep the flow non-breaking for other matches in loop
                console.error("Reported error:", reportErr);
              }
            }
          }
        });
      }

      setMatches(allMatches); // Keep all matches so Match Center has finished/scheduled ones too!
      setLoading(false);

      // Update Latest All (Matches)
      setLatestAll(prev => {
        const other = prev.filter((i: any) => i.collection !== 'match');
        const combined = [...other, ...activeMatches.slice(0, 4)];
        // Deduplicate
        const unique = Array.from(new Map(combined.map(item => [`${item.collection}-${item.id}`, item])).values());
        return unique.sort((a: any, b: any) => 
          (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0)
        ).slice(0, 15);
      });
    });

    // Categorized Media from Firestore - ordered by latest
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
      
      // Update Latest All (Media)
      setLatestAll(prev => {
        const other = prev.filter((i: any) => i.collection !== 'media');
        const combined = [...other, ...allMedia.slice(0, 8)];
        // Deduplicate
        const unique = Array.from(new Map(combined.map(item => [`${item.collection}-${item.id}`, item])).values());
        return unique.sort((a: any, b: any) => 
          (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0)
        ).slice(0, 15);
      });
    });

    // Channels
    const qChannels = query(collection(db, "channels"), orderBy("updatedAt", "desc"), limit(500));
    const unsubChannels = onSnapshot(qChannels, (snap) => {
      const allChannels = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), collection: 'channel' }));
      setChannels(allChannels);
      
      // Update Latest All (Channels)
      setLatestAll(prev => {
        const other = prev.filter((i: any) => i.collection !== 'channel');
        const combined = [...other, ...allChannels.slice(0, 8)];
        // Deduplicate
        const unique = Array.from(new Map(combined.map(item => [`${item.collection}-${item.id}`, item])).values());
        return unique.sort((a: any, b: any) => 
          (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0)
        ).slice(0, 15);
      });
    });

    // Custom Categories
    const unsubCats = onSnapshot(collection(db, "categories"), (snap) => {
      const cats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomCategories(cats);
    });

    // Trending from Proxy API
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

  // Filter Match list
  const filteredMatches = matches.filter((match: any) => {
    // 1. Search Query filter (Case insensitve matches)
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      (match.teamA || "").toLowerCase().includes(q) ||
      (match.teamB || "").toLowerCase().includes(q) ||
      (match.league || "").toLowerCase().includes(q) ||
      (match.commentator || "").toLowerCase().includes(q);

    if (!matchesSearch) return false;

    // 2. Status / Tabs filter
    const matchDate = new Date(match.time);
    const diffMins = (now.getTime() - matchDate.getTime()) / (1000 * 60);
    const isLive = match.status === "live" || (match.status !== "finished" && diffMins >= 0 && diffMins <= 120);
    const isFinished = match.status === "finished" || diffMins > 120;

    if (activeTab === "live") return isLive;
    if (activeTab === "upcoming") return !isLive && !isFinished;
    if (activeTab === "finished") return isFinished;
    return true; // "all"
  });

  // Dedicated dark luxury themed "Match Center" screen when loading /matches
  if (isMatchesPage) {
    return (
      <div className="-mx-3 sm:-mx-6 lg:-mx-12 min-h-screen bg-[#0a0f1d] text-white pb-24 px-4 sm:px-8 lg:px-12 pt-6 font-sans text-right" style={{ direction: "rtl" }}>
        
        {/* Global tab manager filters + real time match search */}
        <div className="bg-[#141f32] rounded-[2rem] p-5 sm:p-6 border border-white/5 shadow-md mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4.5">
          {/* Dynamic Tabs list */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: "all", label: "كل المباريات" },
              { id: "live", label: "مباشر الآن 🟢" },
              { id: "upcoming", label: "المباريات القادمة ⚽" },
              { id: "finished", label: "المنتهية 🏁" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-300 active:scale-95 focus:outline-none ${
                  activeTab === tab.id 
                    ? "bg-brand text-slate-950 shadow-md shadow-brand/20" 
                    : "bg-slate-900/50 text-gray-400 hover:text-white border border-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Matches live search */}
          <div className="relative group max-w-sm w-full">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-[#00C2FF] transition-colors" />
            <input 
              type="text" 
              placeholder="ابحث بالفريق، البطولة، أو المعلق..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0f1d]/75 border border-white/5 rounded-2xl py-2.5 pr-11 pl-4 text-xs sm:text-sm outline-none focus:border-[#00C2FF]/60 focus:bg-[#141f32] transition-all text-white placeholder-gray-500 focus:ring-4 focus:ring-[#00C2FF]/10"
            />
          </div>
        </div>

        {/* Matches listings dashboard scaled to full-width */}
        <div className="w-full space-y-6">
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 mb-4">
            <Radio className="w-5 h-5 text-brand animate-pulse" />
            <span>نتائج ولقاءات التصفية ({filteredMatches.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {loading ? (
              [1, 2, 3, 4].map(idx => <MatchSkeleton key={idx} />)
            ) : filteredMatches.length > 0 ? (
              filteredMatches.map((m: any, idx: number) => (
                <div key={`${m.id}-${idx}`} className="w-full">
                  <MatchCard match={m} />
                </div>
              ))
            ) : (
              <div className="col-span-full bg-[#141f32] rounded-3xl p-16 text-center border border-white/5 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-[#0a0f1d]/30 rounded-full flex items-center justify-center border border-white/5">
                  <Trophy className="w-8 h-8 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">لا يوجد مباريات تطابق هذا التصنيف</h3>
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
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-24 px-3 sm:px-6 lg:px-0 overflow-x-hidden text-right" style={{ direction: "rtl" }}>
      
      {/* 2. Dynamic Continue Watching (أكمل المشاهدة) Section */}
      {!isMatchesPage && continueWatching.length > 0 && (
        <section className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-100 shadow-sm relative">

          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-brand/10 rounded-2xl border border-brand/15 relative">
              <span className="w-2 h-2 rounded-full bg-brand animate-ping absolute top-0.5 right-0.5" />
              <Tv className="text-brand w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-950">تابع المشاهدة</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">استكمل تشغيل وسائطك وقنواتك الأخيرة من حيث توقفت</p>
            </div>
          </div>

          <div 
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory horizontal-slider no-scrollbar scroll-smooth"
            style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}
          >
            {continueWatching.map((item: any) => (
              <motion.div 
                key={`${item.type}-${item.id}`}
                whileHover={{ y: -5, scale: 1.02 }}
                className="flex-shrink-0 w-[120px] sm:w-[150px] snap-start relative group"
              >
                <Link to={item.type === 'match' ? `/match/${item.id}` : `/${item.type}/${item.id}`} className="block">
                  <div className="relative aspect-[16/10] sm:aspect-video rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group shadow-sm">
                    {item.type === 'match' ? (
                      <div className="w-full h-full flex items-center justify-center gap-1.5 p-2 bg-slate-100">
                        <img src={item.logoA || "https://placehold.co/50x50/f1f5f9/000?text=A"} alt="Logo A" className="w-6 h-6 object-contain" />
                        <span className="text-gray-400 text-[8px]">VS</span>
                        <img src={item.logoB || "https://placehold.co/50x50/f1f5f9/000?text=B"} alt="Logo B" className="w-6 h-6 object-contain" />
                      </div>
                    ) : (
                      <img 
                        src={item.type === 'channel' ? (item.logo || "https://placehold.co/100/f1f5f9/000?text=?") : (item.poster || "https://placehold.co/100/f1f5f9/000?text=?")} 
                        alt={item.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    
                    {/* Tiny Play Progress Indicator Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand/30">
                      <div className="h-full bg-brand" style={{ width: '65%' }} />
                    </div>

                    <div className="absolute top-1.5 right-1.5 bg-brand text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">
                      {item.type === 'channel' ? 'قناة' : item.type === 'match' ? 'مباراة' : 'سينما'}
                    </div>
                  </div>
                  <h4 className="mt-1.5 font-bold text-[9px] min-[370px]:text-[10px] sm:text-xs leading-tight text-gray-900 group-hover:text-brand transition-colors text-center line-clamp-2 min-h-[25px] sm:min-h-[32px] overflow-hidden px-0.5 break-words" title={item.name}>
                    {item.name}
                  </h4>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Latest Additions Row Slider with Glass Dark Style */}
      {!isMatchesPage && latestAll.length > 0 && (
        <section className="bg-white px-4 py-5 rounded-3xl border border-slate-100 shadow-sm overflow-hidden relative">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-1.5 h-4 bg-brand rounded-full shadow-[0_2px_10px_rgba(37,99,235,0.3)] shrink-0"></span>
              <h2 className="text-xs sm:text-sm font-black text-gray-950 truncate" title={t('latest_additions')}>{t('latest_additions')}</h2>
            </div>
            <Link 
              to="/latest" 
              className="px-2.5 py-1 rounded-full bg-slate-50 text-[10px] sm:text-xs font-bold text-gray-500 hover:text-brand hover:bg-brand/10 border border-slate-100 transition-all flex items-center gap-0.5 shrink-0"
            >
              <span>{t('view_all')}</span>
              <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div 
            className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory horizontal-slider no-scrollbar scroll-smooth" 
            style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}
          >
             {latestAll.slice(0, 15).map((item) => (
               <motion.div 
                 key={`${item.collection}-${item.id}`}
                 whileHover={{ y: -5, scale: 1.02 }}
                 className="flex-shrink-0 w-[105px] xs:w-[125px] sm:w-[140px] md:w-[155px] xl:w-[175px] snap-start"
               >
                 <Link to={`/${item.collection}/${item.id}`} className="block group">
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-slate-50 border border-slate-100 shadow-sm group-hover:border-brand/35 transition-all duration-300">
                       <img 
                        src={
                          item.collection === 'match' ? (item.logoA || "https://placehold.co/400x600/f8fafc/white?text=Match") : 
                          item.collection === 'channel' ? (item.logo || "https://placehold.co/400x600/f8fafc/red?text=Channel") : 
                          (item.poster || "https://placehold.co/400x600/f8fafc/white?text=No+Poster")
                        } 
                        alt={item.name || item.title || item.teamA}
                        className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${
                          (item.collection === 'channel' || item.collection === 'match') 
                            ? 'object-contain p-2 bg-slate-100' 
                            : 'object-cover'
                        }`}
                        loading="lazy"
                       />
                       
                       <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1">
                          {item.collection === 'match' && (
                            <div className="bg-brand text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow-lg uppercase">مباراة</div>
                          )}
                          {item.collection === 'channel' && (
                            <div className="bg-brand text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow-lg uppercase">قناة</div>
                          )}
                       </div>
                       <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-80" />
                    </div>
                    <p className="mt-1.5 font-bold text-[9px] min-[370px]:text-[10px] sm:text-xs leading-tight text-center text-gray-900 group-hover:text-brand transition-colors line-clamp-2 min-h-[25px] sm:min-h-[32px] overflow-hidden px-0.5 break-words" title={item.collection === 'match' ? `${item.teamA} ضد ${item.teamB}` : (item.name || item.title)}>
                      {item.collection === 'match' ? `${item.teamA} ضد ${item.teamB}` : (item.name || item.title)}
                    </p>
                  </Link>
                </motion.div>
              ))}
          </div>
        </section>
      )}

      {/* 4. Filtered Video Categories and Movie lists */}
      {!isMatchesPage && (
        <div className="space-y-8 pb-10">
          
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <CategorySection 
              title="القنوات الرياضية الناقلة" 
              icon={Tv} 
              items={channels.filter(c => {
                const g = (c.group || "").toLowerCase();
                return g === "sports" || g.includes("sport") || g.includes("bein") || g.includes("رياض") || g.includes("دوري") || g.includes("كأس") || g.includes("ssc") || g.includes("alkass");
              }).slice(0, 15)} 
              type="channel"
              filter={{ key: 'group', value: 'sports' }}
            />
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <CategorySection 
              title="أفلام عربية حصرية" 
              icon={Film} 
              items={arabicMovies.slice(0, 15)} 
              type="media"
              filter={{ key: 'category', value: 'arabic_movies' }}
            />
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <CategorySection 
              title="مسلسلات تركية حصرية" 
              icon={MonitorPlay} 
              items={turkishSeries.slice(0, 15)} 
              type="media"
              filter={{ key: 'category', value: 'turkish_series' }}
            />
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <CategorySection 
              title="أفلام وثائقية عالمية" 
              icon={MonitorPlay} 
              items={documentaries.slice(0, 15)} 
              type="media"
              filter={{ key: 'category', value: 'documentary' }}
            />
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <CategorySection 
              title="أفلام أكشن وحركة" 
              icon={Film} 
              items={actionMovies.slice(0, 15)} 
              type="media"
              filter={{ key: 'category', value: 'action' }}
            />
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <CategorySection 
              title="القنوات الإخبارية" 
              icon={Newspaper} 
              items={channels.filter(c => {
                const g = (c.group || "").toLowerCase();
                return g === "news" || g.includes("news") || g.includes("إخبار") || g.includes("أخبار") || g.includes("حدث") || g.includes("جزيرة") || g.includes("عربية");
              }).slice(0, 15)} 
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
              <div key={cat.id} className="bg-[#141f32]/80 backdrop-blur-md rounded-3xl p-5 border border-white/5 shadow-lg">
                <CategorySection 
                  title={cat.name} 
                  icon={cat.type === 'channel' ? Tv : cat.type === 'movie' ? Film : MonitorPlay} 
                  items={catItems.slice(0, 15)} 
                  type={cat.type === 'channel' ? "channel" : "media"}
                  filter={cat.type === 'channel' ? { key: 'group', value: cat.id } : { key: 'category', value: cat.id }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
