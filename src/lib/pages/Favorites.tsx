import { useState, useEffect } from "react";
import { Heart, Trophy, Tv, Film } from "lucide-react";
import { MatchCard } from "../../components/MatchCard";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { FavoriteButton } from "../../components/FavoriteButton";

export function Favorites() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = () => {
    try {
      const stored = localStorage.getItem("app_favorites");
      const list = stored ? JSON.parse(stored) : [];
      // Deduplicate to ensure no clashing keys under any circumstances
      const uniqueList = Array.from(
        new Map(list.map((item: any) => [`${item.type}-${item.itemId || item.id}`, item])).values()
      );
      // Sort newly favorited items first
      uniqueList.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
      setFavorites(uniqueList);
    } catch (e) {
      console.error("Error reading local favorites:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();

    window.addEventListener("storage", loadFavorites);
    window.addEventListener("localFavoritesUpdated", loadFavorites);

    return () => {
      window.removeEventListener("storage", loadFavorites);
      window.removeEventListener("localFavoritesUpdated", loadFavorites);
    };
  }, []);

  const matches = favorites.filter(f => {
    if (f.type !== "match") return false;
    if (!f.data || !f.data.time) return false;
    const matchDate = new Date(f.data.time);
    const now = new Date();
    const diffMinutes = (now.getTime() - matchDate.getTime()) / (1000 * 60);
    const isFinished = f.data.status === "finished" || diffMinutes > 120;
    return !isFinished;
  });
  const channels = favorites.filter(f => f.type === "channel");
  const media = favorites.filter(f => f.type === "media");

  return (
    <div className="space-y-12 pb-24 px-4 max-w-7xl mx-auto text-right" style={{ direction: "rtl" }}>
      <header className="flex items-center gap-4 mb-8">
        <Heart className="w-8 h-8 text-brand fill-brand/15 animate-pulse" />
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">قائمتي المفضلة</h1>
      </header>

      {loading ? (
        <div className="text-center py-24 animate-pulse text-[#A1A1AA]">جاري تحميل مفضلاتك...</div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20 bg-[#111116]/80 rounded-3xl border border-white/5 shadow-2xl max-w-xl mx-auto">
          <Heart className="w-12 h-12 text-brand/25 mx-auto mb-4 animate-bounce" />
          <h2 className="text-lg font-bold text-white">لم تحفظ أي مفضلة بعد</h2>
          <p className="text-[#A1A1AA] text-xs mt-1.5 px-6">انقر على رمز القلب في أي قناة، فيلم، أو مباراة للوصول السريع إليها في أي وقت</p>
          <Link 
            to="/" 
            className="inline-block mt-6 bg-brand text-white px-6 py-2.5 rounded-xl font-extrabold hover:bg-brand-hover transition-all shadow-lg shadow-brand/20"
          >
            استكشف المحتوى الآن
          </Link>
        </div>
      ) : (
        <div className="space-y-16">
          {matches.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="text-brand w-6 h-6" />
                <h2 className="text-lg sm:text-xl font-black text-white">المباريات المستمرة</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {matches.map((fav, index) => (
                    <motion.div 
                      key={`fav-match-${fav.itemId || fav.id}-${index}`}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <MatchCard match={{ ...fav.data, id: fav.itemId }} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {channels.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6 px-1">
                <Tv className="text-brand w-6 h-6" />
                <h2 className="text-lg sm:text-xl font-black text-white">قنواتي المفضلة</h2>
              </div>
              <div className="grid grid-cols-2 min-[450px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                {channels.map((fav, index) => (
                  <motion.div
                    key={`fav-channel-${fav.itemId || fav.id}-${index}`}
                    whileHover={{ scale: 1.03, y: -4 }}
                    className="group relative focus-within:ring-2 focus-within:ring-brand rounded-2xl"
                  >
                    <div className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                       <FavoriteButton 
                         itemId={fav.itemId} 
                         type="channel" 
                         itemData={fav.data} 
                         className="bg-[#040406]/90 p-1.5 rounded-lg border border-white/5 text-white hover:text-brand" 
                       />
                    </div>
                    <Link to={`/channel/${fav.itemId}`} className="block focus:outline-none">
                      <div className="aspect-square rounded-2xl overflow-hidden bg-[#111116] border border-white/5 shadow-md p-3 flex items-center justify-center">
                        <img 
                          src={fav.data.logo || "https://placehold.co/100x100/111116/fff?text=?"} 
                          className="max-w-full max-h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-500" 
                          alt={fav.data.name} 
                        />
                      </div>
                      <h3 className="mt-1.5 font-bold text-[9.5px] sm:text-xs leading-tight text-center text-white/90 group-hover:text-brand transition-colors line-clamp-2 h-7.5 sm:h-9 overflow-hidden px-0.5" title={fav.data.name}>
                        {fav.data.name}
                      </h3>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {media.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6 px-1">
                <Film className="text-brand w-6 h-6" />
                <h2 className="text-lg sm:text-xl font-black text-white">المحتوى والأفلام المفضلة</h2>
              </div>
              <div className="grid grid-cols-2 min-[450px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                {media.map((fav, index) => (
                  <motion.div
                    key={`fav-media-${fav.itemId || fav.id}-${index}`}
                    whileHover={{ scale: 1.03, y: -4 }}
                    className="group relative focus-within:ring-2 focus-within:ring-brand rounded-2xl"
                  >
                    <div className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                       <FavoriteButton 
                         itemId={fav.itemId} 
                         type="media" 
                         itemData={fav.data} 
                         className="bg-[#040406]/90 p-1.5 rounded-lg border border-white/5 text-white hover:text-brand" 
                       />
                    </div>
                    <Link to={`/media/${fav.itemId}`} className="block focus:outline-none">
                      <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-[#111116] border border-white/5 shadow-md">
                        <img 
                          src={fav.data.poster || (fav.data.poster_path ? `https://image.tmdb.org/t/p/w500${fav.data.poster_path}` : "https://placehold.co/400x600?text=No+Poster")} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          alt={fav.data.title} 
                        />
                      </div>
                      <h3 className="mt-1.5 font-bold text-[9.5px] sm:text-xs leading-tight text-center text-white/90 group-hover:text-brand transition-colors line-clamp-2 h-7.5 sm:h-9 overflow-hidden px-0.5" title={fav.data.title || fav.data.name}>
                        {fav.data.title || fav.data.name}
                      </h3>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

