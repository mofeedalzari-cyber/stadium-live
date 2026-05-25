import { useEffect, useState } from "react";
import { useSearchParams, Link, useLocation } from "react-router-dom";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Tv, Film, Heart } from "lucide-react";
import { motion } from "motion/react";
import { FavoriteButton } from "../../components/FavoriteButton";

export function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname } = useLocation();
  const type = searchParams.get("type") || (pathname.includes('channels') ? "channel" : "movie");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customCategories, setCustomCategories] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categories"), (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomCategories(cats);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setLoading(true);
    const typeParam = searchParams.get("type");
    const groupParam = searchParams.get("group");
    const categoryParam = searchParams.get("category");
    
    // Determine target collection
    const collectionName = (type === "channel" || pathname.includes('channels') || groupParam) ? "channels" : "media";
    const q = query(collection(db, collectionName));
    
    const unsub = onSnapshot(q, (snap) => {
      let filtered = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter by media type ONLY if explicitly requested or if no category is specified
      if (collectionName === "media") {
        if (typeParam) {
          filtered = filtered.filter((item: any) => item.type === typeParam);
        } else if (!categoryParam) {
          filtered = filtered.filter((item: any) => item.type === "movie");
        }
      }
      
      // Filter by group or category using smart checks
      if (groupParam) {
        if (groupParam === "sports") {
          filtered = filtered.filter((item: any) => {
            const g = (item.group || "").toLowerCase();
            return g === "sports" || g.includes("sport") || g.includes("bein") || g.includes("رياض") || g.includes("دوري") || g.includes("كأس") || g.includes("ssc") || g.includes("alkass");
          });
        } else if (groupParam === "news") {
          filtered = filtered.filter((item: any) => {
            const g = (item.group || "").toLowerCase();
            return g === "news" || g.includes("news") || g.includes("إخبار") || g.includes("أخبار") || g.includes("حدث") || g.includes("جزيرة") || g.includes("عربية");
          });
        } else if (groupParam === "movies") {
          filtered = filtered.filter((item: any) => {
            const g = (item.group || "").toLowerCase();
            return g === "movies" || g === "cinema" || g.includes("movie") || g.includes("cinema") || g.includes("ثقافة") || g.includes("سينما") || g.includes("روتانا") || g.includes("mbc") || g.includes("ترفيه") || g.includes("أفلام") || g.includes("دراما") || g.includes("rotana");
          });
        } else if (groupParam === "telephony") {
          filtered = filtered.filter((item: any) => {
            const g = (item.group || "").toLowerCase();
            return g === "telephony" || g === "phone" || g === "mobile" || g === "تلفونية" || g === "قنوات تلفونية" || g.includes("phone") || g.includes("تلفون") || g.includes("جوال") || g.includes("موبايل");
          });
        } else {
          filtered = filtered.filter((item: any) => item.group === groupParam);
        }
      } else if (categoryParam) {
        filtered = filtered.filter((item: any) => item.category === categoryParam);
      } else if (collectionName === "channels") {
        // Handle nested groups in type param if needed
        if (typeParam === "sports" || typeParam === "news" || typeParam === "movies" || typeParam === "telephony") {
          const target = typeParam;
          filtered = filtered.filter((item: any) => {
            const g = (item.group || "").toLowerCase();
            if (target === "sports") {
              return g === "sports" || g.includes("sport") || g.includes("bein") || g.includes("رياض") || g.includes("دوري") || g.includes("كأس") || g.includes("ssc") || g.includes("alkass");
            } else if (target === "news") {
              return g === "news" || g.includes("news") || g.includes("إخبار") || g.includes("أخبار") || g.includes("حدث") || g.includes("جزيرة") || g.includes("عربية");
            } else if (target === "movies") {
              return g === "movies" || g === "cinema" || g.includes("movie") || g.includes("cinema") || g.includes("ثقافة") || g.includes("سينما") || g.includes("روتانا") || g.includes("mbc") || g.includes("ترفيه") || g.includes("أفلام") || g.includes("دراما") || g.includes("rotana");
            } else {
              return g === "telephony" || g === "phone" || g === "mobile" || g === "تلفونية" || g === "قنوات تلفونية" || g.includes("phone") || g.includes("تلفون") || g.includes("جوال") || g.includes("موبايل");
            }
          });
        }
      }

      setItems(filtered);
      setLoading(false);
    });

    return () => unsub();
  }, [type, searchParams, pathname]);

  const titles: Record<string, string> = {
    movie: "الأفلام",
    series: "المسلسلات",
    channel: "البث المباشر",
    sports: "القنوات الرياضية",
    news: "قنوات إخبارية",
    movies: "القنوات السينمائية",
    telephony: "قنوات تلفونية",
    documentary: "وثائقيات",
    arabic_movies: "أفلام عربية",
    indian_movies: "أفلام هندية",
    turkish_series: "مسلسلات تركية",
    action: "أكشن",
    ...customCategories.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.name }), {}),
  };

  const group = searchParams.get("group");
  const category = searchParams.get("category");
  const activeTitle = titles[group || category || type] || "استكشاف";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand/20 rounded-2xl">
            {(type === 'channel' || pathname.includes('channels') || group) ? <Tv className="text-brand" /> : <Film className="text-brand" />}
          </div>
          <h1 className="text-xl sm:text-2xl font-black">{activeTitle}</h1>
        </div>

        {/* Group Filter Badges for Channels */}
        {(type === "channel" || pathname.includes("channels")) && (
          <div 
            className="flex gap-2 overflow-x-auto pb-1.5 max-w-full scrollbar-hide horizontal-slider select-none scroll-smooth flex-nowrap" 
            style={{ 
              direction: "rtl",
              WebkitOverflowScrolling: "touch",
              overscrollBehaviorX: "contain"
            }}
          >
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.delete("group");
                setSearchParams(params);
              }}
              className={`px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                !group
                  ? "bg-brand text-white shadow-lg shadow-brand/20 active:scale-95"
                  : "bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-200 hover:bg-black/10 dark:hover:bg-white/10 active:scale-95"
              }`}
            >
              كل القنوات 📺
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("group", "sports");
                setSearchParams(params);
              }}
              className={`px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                group === "sports"
                  ? "bg-brand text-white shadow-lg shadow-brand/20 active:scale-95"
                  : "bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-200 hover:bg-black/10 dark:hover:bg-white/10 active:scale-95"
              }`}
            >
              قنوات الرياضة ⚽
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("group", "telephony");
                setSearchParams(params);
              }}
              className={`px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                group === "telephony"
                  ? "bg-brand text-white shadow-lg shadow-brand/20 active:scale-95"
                  : "bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-200 hover:bg-black/10 dark:hover:bg-white/10 active:scale-95"
              }`}
            >
              قنوات تلفونية 📱
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("group", "news");
                setSearchParams(params);
              }}
              className={`px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                group === "news"
                  ? "bg-brand text-white shadow-lg shadow-brand/20 active:scale-95"
                  : "bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-200 hover:bg-black/10 dark:hover:bg-white/10 active:scale-95"
              }`}
            >
              القنوات الإخبارية 📰
            </button>
            {customCategories.filter(cat => cat.type === 'channel').map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set("group", cat.id);
                  setSearchParams(params);
                }}
                className={`px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                  group === cat.id
                    ? "bg-brand text-white shadow-lg shadow-brand/20 active:scale-95"
                    : "bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-200 hover:bg-black/10 dark:hover:bg-white/10 active:scale-95"
                }`}
              >
                {cat.name} 📺
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 min-[450px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2.5 sm:gap-4">
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
            <div key={i} className="aspect-[2/3] bg-white/5 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        (() => {
          const isChannelListWithoutGroup = (type === "channel" || pathname.includes("channels")) && !group;

          if (isChannelListWithoutGroup) {
            // Split channels into categories
            const sportsChannels = items.filter((item: any) => {
              const g = (item.group || "").toLowerCase();
              return g === "sports" || g.includes("sport") || g.includes("bein") || g.includes("رياض") || g.includes("دوري") || g.includes("كأس") || g.includes("ssc") || g.includes("alkass");
            });

            const cinemaChannels = items.filter((item: any) => {
              const g = (item.group || "").toLowerCase();
              return g === "movies" || g === "cinema" || g.includes("movie") || g.includes("cinema") || g.includes("ثقافة") || g.includes("سينما") || g.includes("روتانا") || g.includes("mbc") || g.includes("ترفيه") || g.includes("أفلام") || g.includes("دراما") || g.includes("rotana");
            });

            const telephonyChannels = items.filter((item: any) => {
              const g = (item.group || "").toLowerCase();
              return g === "telephony" || g === "phone" || g === "mobile" || g === "تلفونية" || g === "قنوات تلفونية" || g.includes("phone") || g.includes("تلفون") || g.includes("جوال") || g.includes("موبايل");
            });

            const newsChannels = items.filter((item: any) => {
              const g = (item.group || "").toLowerCase();
              return g === "news" || g.includes("news") || g.includes("إخبار") || g.includes("أخبار") || g.includes("حدث") || g.includes("جزيرة") || g.includes("عربية");
            });

            const otherChannels = items.filter((item: any) => {
              const g = (item.group || "").toLowerCase();
              const isSport = g === "sports" || g.includes("sport") || g.includes("bein") || g.includes("رياض") || g.includes("دوري") || g.includes("كأس") || g.includes("ssc") || g.includes("alkass");
              const isCinema = g === "movies" || g === "cinema" || g.includes("movie") || g.includes("cinema") || g.includes("ثقافة") || g.includes("سينما") || g.includes("روتانا") || g.includes("mbc") || g.includes("ترفيه") || g.includes("أفلام") || g.includes("دراما") || g.includes("rotana");
              const isTelephony = g === "telephony" || g === "phone" || g === "mobile" || g === "تلفونية" || g === "قنوات تلفونية" || g.includes("phone") || g.includes("تلفون") || g.includes("جوال") || g.includes("موبايل");
              const isNews = g === "news" || g.includes("news") || g.includes("إخبار") || g.includes("أخبار") || g.includes("حدث") || g.includes("جزيرة") || g.includes("عربية");
              const isCustom = customCategories.some(cat => cat.type === 'channel' && cat.id.toLowerCase() === g);
              return !isSport && !isNews && !isCinema && !isTelephony && !isCustom;
            });

            return (
              <div className="space-y-12">
                {sportsChannels.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2">
                      <span className="w-1.5 h-5 bg-brand rounded-full shadow-[0_0_10px_rgba(5,150,105,0.4)]" />
                      <h2 className="text-lg font-black text-gray-800 dark:text-white">قنوات الرياضة ⚽ ({sportsChannels.length})</h2>
                    </div>
                    <div className="grid grid-cols-3 min-[450px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2.5 sm:gap-4">
                      {sportsChannels.map((item, idx) => (
                        <ChannelCard key={`sports-${item.id}-${idx}`} item={item} type={type} />
                      ))}
                    </div>
                  </div>
                )}

                {cinemaChannels.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2">
                      <span className="w-1.5 h-5 bg-brand rounded-full shadow-[0_0_10px_rgba(5,150,105,0.4)]" />
                      <h2 className="text-lg font-black text-gray-800 dark:text-white">القنوات السينمائية 🎬 ({cinemaChannels.length})</h2>
                    </div>
                    <div className="grid grid-cols-3 min-[450px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2.5 sm:gap-4">
                      {cinemaChannels.map((item, idx) => (
                        <ChannelCard key={`cinema-${item.id}-${idx}`} item={item} type={type} />
                      ))}
                    </div>
                  </div>
                )}

                {telephonyChannels.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2">
                      <span className="w-1.5 h-5 bg-brand rounded-full shadow-[0_0_10px_rgba(5,150,105,0.4)]" />
                      <h2 className="text-lg font-black text-gray-800 dark:text-white">قنوات تلفونية 📱 ({telephonyChannels.length})</h2>
                    </div>
                    <div className="grid grid-cols-3 min-[450px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2.5 sm:gap-4">
                      {telephonyChannels.map((item, idx) => (
                        <ChannelCard key={`telephony-${item.id}-${idx}`} item={item} type={type} />
                      ))}
                    </div>
                  </div>
                )}

                {newsChannels.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2">
                      <span className="w-1.5 h-5 bg-brand rounded-full shadow-[0_0_10px_rgba(5,150,105,0.4)]" />
                      <h2 className="text-lg font-black text-gray-800 dark:text-white">القنوات الإخبارية 📰 ({newsChannels.length})</h2>
                    </div>
                    <div className="grid grid-cols-3 min-[450px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2.5 sm:gap-4">
                      {newsChannels.map((item, idx) => (
                        <ChannelCard key={`news-${item.id}-${idx}`} item={item} type={type} />
                      ))}
                    </div>
                  </div>
                )}

                {otherChannels.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2">
                      <span className="w-1.5 h-5 bg-brand rounded-full shadow-[0_0_10px_rgba(5,150,105,0.4)]" />
                      <h2 className="text-lg font-black text-gray-800 dark:text-white">قنوات عامة وأخرى 📺 ({otherChannels.length})</h2>
                    </div>
                    <div className="grid grid-cols-3 min-[450px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2.5 sm:gap-4">
                      {otherChannels.map((item, idx) => (
                        <ChannelCard key={`other-${item.id}-${idx}`} item={item} type={type} />
                      ))}
                    </div>
                  </div>
                )}

                {customCategories.filter(cat => cat.type === 'channel').map(cat => {
                  const catChannels = items.filter((item: any) => (item.group || "").toLowerCase() === cat.id.toLowerCase());
                  if (catChannels.length === 0) return null;
                  return (
                    <div key={cat.id} className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2">
                        <span className="w-1.5 h-5 bg-brand rounded-full shadow-[0_0_10px_rgba(5,150,105,0.4)]" />
                        <h2 className="text-lg font-black text-gray-800 dark:text-white">{cat.name} 📺 ({catChannels.length})</h2>
                      </div>
                      <div className="grid grid-cols-3 min-[450px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2.5 sm:gap-4">
                        {catChannels.map((item, idx) => (
                          <ChannelCard key={`${cat.id}-${item.id}-${idx}`} item={item} type={type} />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {items.length === 0 && (
                  <div className="py-20 text-center text-gray-500 bg-[#1a1a1a] rounded-3xl border border-dashed border-white/10">
                    <p>لا توجد قنوات مضافة حالياً</p>
                  </div>
                )}
              </div>
            );
          }

          // Otherwise, render a single flat grid as normal
          const uniqueItems = Array.from(new Map(items.map((item: any) => [item.id, item])).values());
          return uniqueItems.length > 0 ? (
            <div className="grid grid-cols-3 min-[450px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2.5 sm:gap-4">
              {uniqueItems.map((item: any, index: number) => (
                <ChannelCard key={`${item.id}-${index}`} item={item} type={type} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-gray-500 bg-[#1a1a1a] rounded-3xl border border-dashed border-white/10">
              <p>لا يوجد محتوى مضاف في هذا القسم حالياً</p>
            </div>
          );
        })()
      )}
    </div>
  );
}

function ChannelCard({ item, type }: { item: any; type: string }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      className="group relative focus-within:ring-2 focus-within:ring-brand focus-within:scale-105 rounded-2xl transition-all p-2 bg-white border border-slate-100 shadow-sm hover:shadow-md"
    >
      <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        <FavoriteButton 
          itemId={item.id} 
          type={type === 'channel' ? 'channel' : 'media'} 
          itemData={item}
          className="bg-white/90 backdrop-blur-md p-2 rounded-xl border border-slate-200 text-gray-500 hover:text-brand"
        />
      </div>
      <Link to={`/${type === 'channel' ? 'channel' : 'media'}/${item.id}`} className="block focus:outline-none">
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-slate-50 border border-slate-100 transition-all">
          <img 
            src={type === 'channel' 
              ? (item.logo || "https://placehold.co/400x600/f8fafc/2563eb?text=%D9%82%D9%86%D8%A7%D8%A9")
              : (item.poster || (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "https://placehold.co/400x600/f8fafc/2563eb?text=%D9%81%D9%8A%D9%84%D9%85"))
            } 
            alt={item.name || item.title} 
            className={`w-full h-full transition-transform duration-500 group-hover:scale-110 ${
              type === 'channel' 
                ? 'object-contain p-2.5 bg-slate-900/5' 
                : 'object-cover'
            }`}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <h3 className="mt-2 font-black text-[11px] sm:text-xs leading-snug text-gray-900 group-hover:text-brand transition-colors text-center px-1 break-words line-clamp-1">
          {item.name || item.title}
        </h3>
      </Link>
    </motion.div>
  );
}
