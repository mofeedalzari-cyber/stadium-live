import { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, Film, Tv, PlayCircle, Loader2, Trophy, ArrowLeft, Star, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

interface UnifiedItem {
  id: string;
  title: string;
  image: string;
  type: "channel" | "movie" | "series" | "match";
  isLocal: boolean;
  category?: string;
  group?: string;
  vote_average?: number;
  release_date?: string;
  // Match fields
  imageA?: string;
  imageB?: string;
  time?: string;
}

// Arabic Text Normalization for flawless searching across letter variations
function normalizeArabic(text: string): string {
  if (!text) return "";
  return text
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, "") // remove diacritics/Harakat
    .toLowerCase()
    .trim();
}

function matchesQuery(text: string, queryStr: string): boolean {
  if (!text || !queryStr) return false;
  return normalizeArabic(text).includes(normalizeArabic(queryStr));
}

export function Search() {
  const [query, setQuery] = useState("");
  const [localChannels, setLocalChannels] = useState<any[]>([]);
  const [localMedia, setLocalMedia] = useState<any[]>([]);
  const [localMatches, setLocalMatches] = useState<any[]>([]);
  const [tmdbResults, setTmdbResults] = useState<UnifiedItem[]>([]);
  const [loadingTmdb, setLoadingTmdb] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "channels" | "media" | "matches" | "online">("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load Firestore local data once on mount for real-time instant local search
  useEffect(() => {
    const unsubChannels = onSnapshot(collection(db, "channels"), (snap) => {
      setLocalChannels(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubMedia = onSnapshot(collection(db, "media"), (snap) => {
      setLocalMedia(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubMatches = onSnapshot(collection(db, "matches"), (snap) => {
      setLocalMatches(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubChannels();
      unsubMedia();
      unsubMatches();
    };
  }, []);

  // Handle outside click to hide suggestions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter local search instantly (0ms delay) upon query state changes
  const filteredLocalChannels: UnifiedItem[] = query.trim()
    ? localChannels
        .filter(ch => matchesQuery(ch.name, query))
        .map(ch => ({
          id: ch.id,
          title: ch.name || "قناة مسجلة",
          image: ch.logo || "https://placehold.co/400x600/1a1a1a/white?text=Channel",
          type: "channel",
          isLocal: true,
          group: ch.group
        }))
    : [];

  const filteredLocalMedia: UnifiedItem[] = query.trim()
    ? localMedia
        .filter(m => matchesQuery(m.title, query) || matchesQuery(m.name, query))
        .map(m => ({
          id: m.id,
          title: m.title || m.name || "مقطع محلي",
          image: m.poster || "https://placehold.co/400x600/1a1a1a/white?text=Media",
          type: m.type === "series" ? "series" : "movie",
          isLocal: true,
          category: m.category
        }))
    : [];

  const filteredLocalMatches: UnifiedItem[] = query.trim()
    ? localMatches
        .filter(match => matchesQuery(match.teamA, query) || matchesQuery(match.teamB, query) || matchesQuery(match.league, query))
        .map(match => ({
          id: match.id,
          title: `${match.teamA} × ${match.teamB}`,
          image: match.logoA || "https://placehold.co/400x600/1a1a1a/white?text=Match",
          type: "match",
          isLocal: true,
          imageA: match.logoA,
          imageB: match.logoB,
          time: match.time
        }))
    : [];

  const instantSuggestions: UnifiedItem[] = [
    ...filteredLocalChannels,
    ...filteredLocalMatches,
    ...filteredLocalMedia,
    ...tmdbResults
  ].slice(0, 6);

  // TMDB (Global media search) with a lightweight 200ms debounce
  useEffect(() => {
    if (!query.trim()) {
      setTmdbResults([]);
      setLoadingTmdb(false);
      return;
    }

    // Set loading state to true instantly to prevent flashing "No results" screen while typing
    setLoadingTmdb(true);

    const handler = setTimeout(async () => {
      try {
        const response = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        const mapped = (data.results || []).map((item: any) => ({
          id: item.id,
          title: item.title || item.name || "",
          image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
          type: item.media_type === "tv" ? ("series" as const) : ("movie" as const),
          isLocal: false,
          vote_average: item.vote_average,
          release_date: item.release_date || item.first_air_date
        }));
        setTmdbResults(mapped);
      } catch (error) {
        console.error("TMDb search error:", error);
      } finally {
        setLoadingTmdb(false);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [query]);

  // Combine results depending on the activeTab
  const allResults = [
    ...filteredLocalChannels,
    ...filteredLocalMatches,
    ...filteredLocalMedia,
    ...tmdbResults
  ];

  const displayResults = (() => {
    switch (activeTab) {
      case "channels":
        return filteredLocalChannels;
      case "matches":
        return filteredLocalMatches;
      case "media":
        return filteredLocalMedia;
      case "online":
        return tmdbResults;
      default:
        return allResults;
    }
  })();

  const handleSuggestionClick = (item: UnifiedItem) => {
    setShowSuggestions(false);
    if (item.type === "channel") {
      navigate(`/channel/${item.id}`);
    } else if (item.type === "match") {
      navigate(`/match/${item.id}`);
    } else if (item.isLocal) {
      navigate(`/media/${item.id}`);
    } else {
      navigate(`/media/${item.id}?tmdb=true&type=${item.type === "series" ? "tv" : "movie"}`);
    }
  };

  const getArabicTypeLabel = (type: string, isLocal: boolean) => {
    if (type === "channel") return "البث المباشر";
    if (type === "match") return "مباراة مباشرة";
    return isLocal ? "مكتبة المنصة" : "سينما عالمية";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-10 pb-20 px-2 sm:px-0">
      
      {/* Search Header Container */}
      <div ref={searchContainerRef} className="relative z-50">
        <div className="relative group">
          <SearchIcon className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-[#A1A1AA] group-focus-within:text-brand transition-colors" />
          <input 
            autoFocus
            type="text"
            placeholder="ابحث عن مباراة، بث مباشر، فيلم، أو مسلسل..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full bg-[#111116]/90 border border-white/5 rounded-2xl sm:rounded-[2rem] py-4 sm:py-6 pr-12 sm:pr-16 pl-12 sm:pl-16 text-md sm:text-xl outline-none focus:border-brand/50 transition-all shadow-2xl text-white placeholder:text-[#A1A1AA]/50 focus:ring-2 focus:ring-brand/15"
          />
          {loadingTmdb && (
            <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2">
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-brand animate-spin" />
            </div>
          )}
        </div>

        {/* Live Autocomplete Suggestions Overlay */}
        <AnimatePresence>
          {showSuggestions && query.trim() && instantSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 right-0 mt-2 bg-[#111116] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
            >
              <div className="p-3 bg-[#040406]/55 text-[11px] sm:text-xs text-[#A1A1AA] font-bold border-b border-white/5">
                اقتراحات فورية تطابق بحثك
              </div>
              <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                {instantSuggestions.map((item, index) => (
                  <button
                    key={`${item.type}-${item.id}-${index}`}
                    onClick={() => handleSuggestionClick(item)}
                    className="w-full text-right flex items-center gap-3 p-3 hover:bg-white/5 transition-colors focus:outline-none focus:bg-brand/15 text-white"
                  >
                    {item.type === "match" ? (
                      <div className="flex -space-x-1 flex-shrink-0">
                        <img src={item.imageA || "https://placehold.co/100x100/1a1a1a/white?text=A"} className="w-6 h-6 rounded-full border border-black/10 dark:border-white/10 bg-black/5" />
                        <img src={item.imageB || "https://placehold.co/100x100/1a1a1a/white?text=B"} className="w-6 h-6 rounded-full border border-black/10 dark:border-white/10 bg-black/5" />
                      </div>
                    ) : (
                      <img
                        src={item.image || "https://placehold.co/100x150/1a1a1a/white?text=Image"}
                        className="w-8 h-10 object-cover rounded-md flex-shrink-0 bg-black/15"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-[#0f172a] dark:text-white truncate">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-gray-400 font-medium">
                          {getArabicTypeLabel(item.type, item.isLocal)}
                        </span>
                        {item.group && (
                          <span className="text-[9px] bg-sky-500/10 text-sky-500 px-1 py-0.2 rounded">
                            {item.group}
                          </span>
                        )}
                        {item.category && (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1 py-0.2 rounded">
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-gray-400 shrink-0" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs list to filter search results */}
      {query.trim() && (
        <div 
          className="flex gap-2 pb-2.5 overflow-x-auto scrollbar-hide horizontal-slider select-none scroll-smooth flex-nowrap"
          style={{ 
            direction: "rtl",
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorX: "contain"
          }}
        >
          {(
            [
              { id: "all", label: "الكل", count: allResults.length },
              { id: "channels", label: "قنوات البث المباشر", count: filteredLocalChannels.length },
              { id: "matches", label: "مباريات اليوم", count: filteredLocalMatches.length },
              { id: "media", label: "المكتبة والمسلسلات", count: filteredLocalMedia.length },
              { id: "online", label: "السينما العالمية (TMDB)", count: tmdbResults.length }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-full text-xs font-black transition-all whitespace-nowrap shrink-0 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand ${
                activeTab === tab.id
                  ? "bg-brand text-white shadow-lg shadow-brand/25"
                  : "bg-[#111116] hover:bg-[#111116]/80 text-[#A1A1AA] hover:text-white border border-white/5"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="mr-1.5 px-1.5 py-0.2 select-none bg-black/10 dark:bg-white/10 rounded-full text-[10px]">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Results Workspace Grid */}
      <div className="space-y-8">
        {loadingTmdb && displayResults.length === 0 ? (
          <div className="grid grid-cols-2 min-[450px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-2 animate-pulse">
                <div className="relative aspect-[2/3] rounded-2xl bg-gray-200 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-md flex items-center justify-center">
                  <Film className="w-8 h-8 text-gray-300 dark:text-neutral-800" />
                </div>
                <div className="space-y-1 px-1">
                  <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-3/4 mx-auto" />
                  <div className="h-3 bg-gray-200 dark:bg-white/5 rounded w-1/2 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : query.trim() && displayResults.length > 0 ? (
          <div className="grid grid-cols-2 min-[450px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
            <AnimatePresence mode="popLayout">
              {displayResults.map((item, index) => (
                <motion.div
                  key={`${item.type}-${item.id}-${index}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                  className="group relative"
                >
                  <Link
                    to={
                      item.type === "channel"
                        ? `/channel/${item.id}`
                        : item.type === "match"
                        ? `/match/${item.id}`
                        : item.isLocal
                        ? `/media/${item.id}`
                        : `/media/${item.id}?tmdb=true&type=${item.type === "series" ? "tv" : "movie"}`
                    }
                  >
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-lg group-hover:shadow-brand/20 transition-all">
                      {item.type === "match" ? (
                        <div className="w-full h-full flex flex-col justify-center items-center p-4 bg-gradient-to-br from-[#121212] to-black">
                          <Trophy className="w-8 h-8 text-yellow-500 mb-3" />
                          <div className="flex justify-center items-center gap-2 mb-2">
                            <img src={item.imageA || "https://placehold.co/100x100/1a1a1a/white?text=A"} className="w-8 h-8 rounded-full border border-white/10" alt="" />
                            <span className="text-xs text-white">vs</span>
                            <img src={item.imageB || "https://placehold.co/100x100/1a1a1a/white?text=B"} className="w-8 h-8 rounded-full border border-white/10" alt="" />
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold block text-center truncate w-full">
                            {item.title}
                          </span>
                        </div>
                      ) : item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-[#1a1a1a]">
                          {item.type === "series" ? (
                            <Tv className="w-10 h-10 text-gray-400" />
                          ) : (
                            <Film className="w-10 h-10 text-gray-400" />
                          )}
                        </div>
                      )}

                      {/* Overlays / Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className="px-1.5 py-0.5 bg-black/75 backdrop-blur-md rounded-md text-[8px] sm:text-[9px] font-bold text-white uppercase border border-white/10">
                          {getArabicTypeLabel(item.type, item.isLocal)}
                        </span>
                        {item.vote_average && item.vote_average > 0 && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-brand rounded-md text-[8px] sm:text-[9px] font-black text-white shadow-lg width-fit self-start">
                            <Star className="w-2 h-2 fill-white" />
                            {item.vote_average.toFixed(1)}
                          </span>
                        )}
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                        <PlayCircle className="w-10 h-10 text-brand mx-auto mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform" />
                      </div>
                    </div>

                    <div className="mt-2 text-center px-1">
                      <h3 className="font-bold text-[11px] sm:text-xs leading-snug group-hover:text-brand transition-colors text-slate-800 dark:text-slate-100 break-words">
                        {item.title}
                      </h3>
                      <p className="text-[10px] text-gray-500 font-medium mt-0.5 flex items-center justify-center gap-1">
                        {item.type === "match" ? (
                          <span>بث مباشر</span>
                        ) : item.release_date ? (
                          <>
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>{new Date(item.release_date).getFullYear()}</span>
                          </>
                        ) : (
                          <span>قريباً</span>
                        )}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : query.trim() && !loadingTmdb ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center space-y-4"
          >
            <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <SearchIcon className="w-10 h-10 text-gray-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">لا توجد نتائج</h3>
              <p className="text-[#A1A1AA] text-sm">لم نجد أي قنوات، مباريات مباشر، أو أفلام تطابق المكتوب</p>
            </div>
          </motion.div>
        ) : null}

        {/* Initial Search suggestions/categories */}
        {!query && (
          <div className="py-12 text-center space-y-6">
            <h3 className="text-lg font-black text-white">ابحث عن المفضلات والمباريات المباشرة</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              {[
                { title: "أحدث المباريات", icon: Trophy, bg: "bg-emerald-500/10", text: "text-emerald-500", label: "جدول مباريات اليوم المباشرة", link: "/matches" },
                { title: "قنوات البث الحي", icon: Tv, bg: "bg-blue-500/10", text: "text-blue-500", label: "شاهد القنوات الرياضية والترفيهية", link: "/explore?type=channel" },
                { title: "الأفلام والمسلسلات", icon: Film, bg: "bg-purple-500/10", text: "text-purple-500", label: "المكتبة الترفيهية الكاملة", link: "/explore?type=movie" }
              ].map((item, i) => (
                <Link
                  key={i}
                  to={item.link}
                  className="p-8 rounded-3xl bg-[#111116] border border-white/5 shadow-2xl space-y-4 hover:border-brand/35 transition-all text-center block focus:outline-none focus:ring-2 focus:ring-brand focus:scale-105"
                >
                  <div className={`w-12 h-12 ${item.bg} ${item.text} rounded-2xl flex items-center justify-center mx-auto`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white">{item.title}</h4>
                    <p className="text-xs text-[#A1A1AA] mt-1">{item.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
