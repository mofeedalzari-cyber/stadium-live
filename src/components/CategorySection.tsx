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
      <div className="flex items-center justify-between mb-4 sm:mb-6 px-1 sm:px-2">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="p-2 bg-brand/10 rounded-xl group-hover/section:scale-110 transition-transform border border-brand/15">
            <Icon className="text-brand w-4.5 h-4.5 sm:w-6 sm:h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-black tracking-tight text-gray-900">{title}</h2>
        </div>
        <Link 
          to={viewAllLink} 
          className="px-3.5 py-1.5 rounded-full bg-slate-50 text-xs font-bold text-gray-500 hover:text-brand hover:bg-brand/10 border border-slate-100 transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1"
        >
          <span>عرض الكل</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div 
        className="flex gap-3 sm:gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory horizontal-slider no-scrollbar px-1 py-1 scroll-smooth"
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
              whileHover={{ y: -6, scale: 1.03 }}
              className="flex-shrink-0 w-[105px] sm:w-[140px] md:w-[160px] xl:w-[200px] snap-start relative group transition-all duration-300 focus-within:ring-2 focus-within:ring-brand focus-within:scale-105 rounded-2xl p-2 bg-white border border-slate-100 shadow-sm"
            >
               <div className="absolute top-3 right-3 z-20">
                 <FavoriteButton 
                   itemId={item.id || item.title} 
                   type={type} 
                   itemData={item}
                   className="bg-white/95 backdrop-blur-md p-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all hover:bg-brand hover:text-white rounded-lg border border-slate-200 text-gray-400"
                 />
               </div>
              <Link to={`/${type}/${item.id}`} className="block focus:outline-none">
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-slate-50 border border-slate-100 group shadow-sm transition-all duration-300 group-focus:border-brand group-hover:border-brand/35">
                   <img 
                     src={type === "media" 
                       ? (item.poster || (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "https://placehold.co/400x600/f8fafc/ffffff?text=No+Poster"))
                       : (item.logo || "https://placehold.co/400x600/f8fafc/ffffff?text=Channel")} 
                     alt={item.name || item.title} 
                     className={`w-full h-full transition-transform duration-700 group-hover:scale-105 ${
                       type === "channel" 
                         ? "object-contain p-2.5 bg-slate-900/5" 
                         : "object-cover"
                     }`}
                     loading="lazy"
                   />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {item.vote_average && (
                    <div className="absolute top-2 left-2 bg-brand text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-lg">
                      ★ {item.vote_average.toFixed(1)}
                    </div>
                  )}
                </div>
                <h3 className="mt-2.5 font-black text-xs sm:text-sm leading-snug text-gray-900 hover:text-brand group-hover:text-brand transition-colors text-center line-clamp-1 truncate block px-0.5">
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
