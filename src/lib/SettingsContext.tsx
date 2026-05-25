import { Link } from "react-router-dom";
import { ChevronLeft, MonitorPlay } from "lucide-react";
import { motion } from "motion/react";
import { FavoriteButton } from "./FavoriteButton";

export function CategorySection({ title, icon: Icon, items, type, filter }: { 
  title: string; 
  icon: any; 
  items: any[]; 
  type: "channel" | "media";
  filter?: { key: string; value: string };
}) {
  if (items.length === 0) return null;

  const viewAllLink = filter 
    ? `/${type === 'channel' ? 'channels' : 'media'}?${filter.key}=${filter.value}`
    : `/${type === 'channel' ? 'channels' : 'media'}`;

  return (
    <section className="relative group/section">
      {/* Header with title and view all button */}
      <div className="flex items-center justify-between mb-3 px-1 sm:px-2">
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <div className="p-1.5 bg-brand/10 rounded-lg group-hover/section:scale-105 transition-transform border border-brand/15 shrink-0">
            <Icon className="text-brand w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h2 className="text-xs sm:text-sm font-black tracking-tight text-gray-950 dark:text-white truncate" title={title}>{title}</h2>
        </div>
        <Link 
          to={viewAllLink} 
          className="px-2.5 py-1 rounded-full bg-slate-50 dark:bg-white/5 text-[10px] sm:text-xs font-bold text-gray-500 hover:text-brand hover:bg-brand/10 border border-slate-100 dark:border-white/10 transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-0.5"
        >
          <span>عرض الكل</span>
          <ChevronLeft className="w-3 h-3" />
        </Link>
      </div>

      {/* Horizontal scrollable cards - INCREASED CARD WIDTH */}
      <div 
        className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-none snap-x snap-mandatory horizontal-slider no-scrollbar px-1 py-1 scroll-smooth"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorX: "contain",
          direction: "rtl"
        }}
      >
        {(() => {
          const uniqueItems = Array.from(
            new Map(items.map((item: any) => [item.id || item.title, item])).values()
          );
          return uniqueItems.map((item: any, index: number) => (
            <motion.div 
              key={`${item.id || item.title}-${index}`}
              whileHover={{ y: -5, scale: 1.02 }}
              // INCREASED WIDTH: from 105px to 130px on mobile, and larger on larger screens
              className="flex-shrink-0 w-[130px] xs:w-[145px] sm:w-[160px] md:w-[175px] lg:w-[190px] snap-start relative group transition-all duration-300 focus-within:ring-2 focus-within:ring-brand focus-within:scale-105 rounded-xl p-1.5 bg-white dark:bg-[#1a1a1a] border border-slate-100 dark:border-white/10 shadow-sm"
            >
              <div className="absolute top-2.5 right-2.5 z-20">
                <FavoriteButton 
                  itemId={item.id || item.title} 
                  type={type} 
                  itemData={item}
                  className="bg-white/95 dark:bg-black/80 backdrop-blur-md p-1.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all hover:bg-brand hover:text-white rounded-lg border border-slate-200 dark:border-white/10 text-gray-400"
                />
              </div>
              <Link to={`/${type}/${item.id}`} className="block focus:outline-none">
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-white/10 group shadow-sm transition-all duration-300 group-focus:border-brand group-hover:border-brand/35">
                  <img 
                    src={type === "media" 
                      ? (item.poster || (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "https://placehold.co/400x600/f8fafc/ffffff?text=No+Poster"))
                      : (item.logo || "https://placehold.co/400x600/f8fafc/ffffff?text=Channel")} 
                    alt={item.name || item.title} 
                    className={`w-full h-full transition-transform duration-700 group-hover:scale-105 ${
                      type === "channel" 
                        ? "object-contain p-2 bg-slate-900/5 dark:bg-neutral-800" 
                        : "object-cover"
                    }`}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {item.vote_average && (
                    <div className="absolute top-1.5 left-1.5 bg-brand text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg">
                      ★ {item.vote_average.toFixed(1)}
                    </div>
                  )}
                </div>
                {/* INCREASED TEXT SIZE and better line clamping */}
                <h3 className="mt-1.5 font-bold text-[10px] min-[370px]:text-[11px] sm:text-xs leading-tight text-gray-900 dark:text-white hover:text-brand group-hover:text-brand transition-colors text-center line-clamp-2 min-h-[28px] sm:min-h-[36px] overflow-hidden px-0.5 break-words" title={item.name || item.title}>
                  {item.name || item.title}
                </h3>
              </Link>
            </motion.div>
          ));
        })()}
      </div>
    </section>
  );
}