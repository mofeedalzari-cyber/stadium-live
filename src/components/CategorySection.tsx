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
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="p-1 bg-brand/10 rounded-lg group-hover/section:scale-105 transition-transform border border-brand/15 shrink-0">
            <Icon className="text-brand w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <h2 className="text-[11px] sm:text-xs font-black tracking-tight text-gray-950 truncate" title={title}>{title}</h2>
        </div>
        <Link 
          to={viewAllLink} 
          className="px-2 py-0.5 rounded-full bg-slate-50 text-[9px] sm:text-[10px] font-bold text-gray-500 hover:text-brand hover:bg-brand/10 border border-slate-100 transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-0.5"
        >
          <span>عرض الكل</span>
          <ChevronLeft className="w-3 h-3" />
        </Link>
      </div>

      <div 
        className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory horizontal-slider no-scrollbar px-0.5 scroll-smooth"
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
              whileHover={{ y: -3, scale: 1.02 }}
              className="flex-shrink-0 w-[80px] xs:w-[90px] sm:w-[100px] md:w-[110px] snap-start relative group transition-all duration-300 focus-within:ring-2 focus-within:ring-brand focus-within:scale-105 rounded-xl p-1 bg-white border border-slate-100 shadow-sm"
            >
              <div className="absolute top-1.5 right-1.5 z-20">
                <FavoriteButton 
                  itemId={item.id || item.title} 
                  type={type} 
                  itemData={item}
                  className="bg-white/95 backdrop-blur-md p-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all hover:bg-brand hover:text-white rounded-md border border-slate-200 text-gray-400"
                />
              </div>
              <Link to={`/${type}/${item.id}`} className="block focus:outline-none">
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-slate-50 border border-slate-100 group shadow-sm transition-all duration-300 group-focus:border-brand group-hover:border-brand/35">
                  <img 
                    src={type === "media" 
                      ? (item.poster || (item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : "https://placehold.co/200x300/f8fafc/ffffff?text=No+Poster"))
                      : (item.logo || "https://placehold.co/200x300/f8fafc/ffffff?text=Channel")} 
                    alt={item.name || item.title} 
                    className={`w-full h-full transition-transform duration-700 group-hover:scale-105 ${
                      type === "channel" 
                        ? "object-contain p-1 bg-slate-900/5" 
                        : "object-cover"
                    }`}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {item.vote_average && (
                    <div className="absolute top-1 left-1 bg-brand text-white text-[7px] font-black px-1 py-0.5 rounded shadow-lg">
                      ★ {item.vote_average.toFixed(1)}
                    </div>
                  )}
                </div>
                <h3 className="mt-1 font-bold text-[8px] xs:text-[9px] sm:text-[10px] leading-tight text-gray-900 hover:text-brand group-hover:text-brand transition-colors text-center line-clamp-2 min-h-[24px] overflow-hidden px-0.5 break-words" title={item.name || item.title}>
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