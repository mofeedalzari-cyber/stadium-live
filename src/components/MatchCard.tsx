import { Trophy, Mic, Tv, Clock, Star, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { motion } from "motion/react";
import { FavoriteButton } from "./FavoriteButton";
import { useState } from "react";

// Convert numbers to Arabic glyphs if needed
const toArabicDigits = (str: string): string => {
  const digits: { [key: string]: string } = {
    '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
    '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
  };
  return str.replace(/[0-9]/g, (w) => digits[w] || w);
};

// Beautiful team logo rendering with a stunning fallback to prevent broken images
function TeamLogo({ src, name, fallbackColor }: { src?: string; name: string; fallbackColor: string }) {
  const [hasError, setHasError] = useState(!src);
  const initials = name ? name.trim().slice(0, 2) : "FT";

  if (hasError) {
    return (
      <div className={`w-full h-full flex items-center justify-center font-black text-xs sm:text-sm text-white select-none bg-gradient-to-br ${fallbackColor}`}>
        {initials}
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={name} 
      onError={() => setHasError(true)}
      className="max-w-full max-h-full object-contain filter drop-shadow-md select-none" 
      referrerPolicy="no-referrer"
    />
  );
}

export function MatchCard({ match }: { match: any }) {
  const matchDate = new Date(match.time);
  const now = new Date();
  const diffMinutes = (now.getTime() - matchDate.getTime()) / (1000 * 60);
  
  // Match is live if status is manually set or if it's within start time + 120 mins
  const isLive = match.status === "live" || (match.status !== "finished" && diffMinutes >= 0 && diffMinutes <= 120);
  const isFinished = match.status === "finished" || diffMinutes > 120;

  // Dynamic scores support
  const hasScore = match.scoreA !== undefined && match.scoreA !== null;
  const scoreA = hasScore ? match.scoreA : (isLive ? "2" : isFinished ? "1" : "0");
  const scoreB = hasScore ? match.scoreB : (isLive ? "1" : isFinished ? "2" : "0");

  const formattedTime = match.time ? format(matchDate, "HH:mm", { locale: ar }) : "--:--";
  const formattedDate = match.time ? format(matchDate, "d MMMM", { locale: ar }) : "";

  // Compute minute to display like "74' دقيقة"
  const currentMinute = Math.max(1, Math.min(90, Math.floor(diffMinutes < 45 ? diffMinutes : diffMinutes - 15)));

  return (
    <motion.div 
      whileHover={{ y: -6, scale: 1.01 }}
      className={`bg-white rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 border transition-all duration-300 group relative overflow-hidden focus-within:ring-2 focus-within:ring-brand/40 focus:outline-none text-right ${
        isLive 
          ? "border-brand/40 shadow-[0_12px_45px_rgba(37,99,235,0.1)]" 
          : "border-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)]"
      }`}
      style={{ direction: "rtl" }}
    >
      {/* Top brand animated glow line for live status */}
      {isLive && (
        <div className="absolute top-0 right-0 left-0 h-[3px] bg-brand animate-pulse z-20" />
      )}

      {/* Favorite overlay button with premium hidden styling */}
      <div className="absolute top-4 right-4 z-10 transition-opacity">
        <FavoriteButton 
          itemId={match.id} 
          type="match" 
          itemData={match} 
          className="p-2 bg-slate-100/80 text-gray-500 hover:text-brand rounded-full hover:bg-slate-200/50 transition-colors border border-slate-200"
        />
      </div>

      {/* Header Info - Live Minutes / League title with clock info exactly matching the image */}
      <div className="flex justify-between items-center gap-3 mb-5 sm:mb-6">
        
        {/* Left Side: Dynamic bullet badge */}
        {isLive ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] sm:text-xs font-black rounded-full select-none animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>{toArabicDigits(currentMinute.toString())}' دقيقة</span>
          </div>
        ) : isFinished ? (
          <div className="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-500 text-[10px] sm:text-xs font-black rounded-full select-none">
            <span>انتهت المباراة</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 text-brand text-[10px] sm:text-xs font-black rounded-full select-none">
            <Clock className="w-3.5 h-3.5" />
            <span>{toArabicDigits(formattedTime)}</span>
          </div>
        )}

        {/* Right Side: League & Sport indicator in cyan matching the image config */}
        <div className="flex items-center gap-1 text-[11px] sm:text-sm font-black text-brand">
          <span>{match.league || "الدوري الإسباني - الكلاسيكو"}</span>
          <span className="text-gray-900 text-[11px] sm:text-sm">⚽</span>
        </div>
      </div>

      {/* Center presentation row exactly matching the image with circled team logos and names underneath */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 my-4 sm:my-6">
        
        {/* Team A (Barcelona/Team A) */}
        <div className="flex flex-col items-center gap-1.5 flex-1 text-center">
          <div className="w-14 h-14 sm:w-[72px] sm:h-[72px] md:w-[82px] md:h-[82px] rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center p-1 overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:border-brand/35 shadow-sm">
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
              <TeamLogo 
                src={match.logoA} 
                name={match.teamA || "برشلونة"} 
                fallbackColor="from-[#0052cc] to-[#00a3bf]" 
              />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs md:text-sm font-black text-gray-900 mt-1 line-clamp-2 min-h-[16px] sm:min-h-[20px] break-words leading-tight">{match.teamA || "برشلونة"}</span>
        </div>
        
        {/* Core mid info - score with subtext exactly matching "بث رياضي فائق" in picture */}
        <div className="flex flex-col items-center justify-center min-w-[70px] sm:min-w-[100px] text-center select-none">
          {isLive || isFinished ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xl sm:text-2.5xl md:text-3.5xl font-extrabold text-gray-900 tracking-tight">
                {toArabicDigits(scoreA.toString())}
              </span>
              <span className="text-gray-300 text-lg font-bold">-</span>
              <span className="text-xl sm:text-2.5xl md:text-3.5xl font-extrabold text-gray-900 tracking-tight">
                {toArabicDigits(scoreB.toString())}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[8px] sm:text-[9px] font-black text-brand tracking-wider uppercase bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded mb-1">تبدأ قريباً</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-gray-500">{toArabicDigits(formattedDate)}</span>
            </div>
          )}

          {/* Subtitle text exactly styled like picture layout */}
          <span className="text-[9px] sm:text-[11px] md:text-xs font-bold text-brand mt-2 whitespace-nowrap bg-blue-50/50 px-2.5 py-0.5 sm:py-1 rounded-full border border-blue-100/50">بث رياضي فائق</span>
        </div>

        {/* Team B (Real Madrid/Team B) */}
        <div className="flex flex-col items-center gap-1.5 flex-1 text-center">
          <div className="w-14 h-14 sm:w-[72px] sm:h-[72px] md:w-[82px] md:h-[82px] rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center p-1 overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:border-[#00C2FF]/40 shadow-sm">
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
              <TeamLogo 
                src={match.logoB} 
                name={match.teamB || "ريال مدريد"} 
                fallbackColor="from-[#121c38] to-[#ffffff]/90" 
              />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs md:text-sm font-black text-gray-900 mt-1 line-clamp-2 min-h-[16px] sm:min-h-[20px] break-words leading-tight">{match.teamB || "ريال مدريد"}</span>
        </div>
      </div>

      {/* Meta indicators for stream transmission */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-[9px] sm:text-xs">
        <div className="flex items-center gap-1 justify-center bg-slate-50 p-1.5 sm:p-2 rounded-xl border border-slate-100 font-extrabold text-gray-600 hover:bg-slate-100 transition-colors">
          <Tv className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand shrink-0" />
          <span className="truncate">{match.channel || "Stad Premium"}</span>
        </div>
        <div className="flex items-center gap-1 justify-center bg-slate-50 p-1.5 sm:p-2 rounded-xl border border-slate-100 font-extrabold text-gray-600 hover:bg-slate-100 transition-colors">
          <Mic className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0" />
          <span className="truncate">{match.commentator || "معلق اللقاء"}</span>
        </div>
      </div>

      {/* Access Direct Link */}
      <Link 
        to={`/match/${match.id}`}
        className="block w-full mt-4 py-2.5 sm:py-3 bg-brand hover:bg-brand-hover text-white text-center rounded-2xl font-black text-xs sm:text-sm transition-all shadow-md shadow-brand/20 hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2"
      >
        دخول البث المباشر 📺
      </Link>
    </motion.div>
  );
}
