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
      <div className={`w-full h-full flex items-center justify-center font-black text-[10px] sm:text-xs text-white select-none bg-gradient-to-br ${fallbackColor}`}>
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
  
  const isLive = match.status === "live" || (match.status !== "finished" && diffMinutes >= 0 && diffMinutes <= 120);
  const isFinished = match.status === "finished" || diffMinutes > 120;

  const hasScore = match.scoreA !== undefined && match.scoreA !== null;
  const scoreA = hasScore ? match.scoreA : (isLive ? "2" : isFinished ? "1" : "0");
  const scoreB = hasScore ? match.scoreB : (isLive ? "1" : isFinished ? "2" : "0");

  const formattedTime = match.time ? format(matchDate, "HH:mm", { locale: ar }) : "--:--";
  const formattedDate = match.time ? format(matchDate, "d MMMM", { locale: ar }) : "";
  const currentMinute = Math.max(1, Math.min(90, Math.floor(diffMinutes < 45 ? diffMinutes : diffMinutes - 15)));

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.01 }}
      className={`bg-white rounded-2xl p-3 sm:p-4 border transition-all duration-300 group relative overflow-hidden focus-within:ring-2 focus-within:ring-brand/40 focus:outline-none text-right ${
        isLive 
          ? "border-brand/40 shadow-[0_8px_30px_rgba(37,99,235,0.08)]" 
          : "border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
      }`}
      style={{ direction: "rtl" }}
    >
      {isLive && <div className="absolute top-0 right-0 left-0 h-[2px] bg-brand animate-pulse z-20" />}

      <div className="absolute top-2 right-2 z-10 transition-opacity">
        <FavoriteButton 
          itemId={match.id} 
          type="match" 
          itemData={match} 
          className="p-1.5 bg-slate-100/80 text-gray-500 hover:text-brand rounded-full hover:bg-slate-200/50 transition-colors border border-slate-200"
        />
      </div>

      {/* Header Info */}
      <div className="flex justify-between items-center gap-2 mb-3">
        {isLive ? (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black rounded-full select-none animate-pulse">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
            <span>{toArabicDigits(currentMinute.toString())}'</span>
          </div>
        ) : isFinished ? (
          <div className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-500 text-[9px] font-black rounded-full select-none">
            انتهت
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-100 text-brand text-[9px] font-black rounded-full select-none">
            <Clock className="w-3 h-3" />
            <span>{toArabicDigits(formattedTime)}</span>
          </div>
        )}

        <div className="flex items-center gap-1 text-[10px] font-black text-brand">
          <span className="whitespace-normal break-words max-w-[120px] text-right">{match.league || "دوري"}</span>
          <span className="text-gray-900">⚽</span>
        </div>
      </div>

      {/* Center row */}
      <div className="flex items-center justify-between gap-2 my-3">
        {/* Team A */}
        <div className="flex flex-col items-center gap-1 flex-1 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center p-0.5 overflow-hidden transition-all group-hover:scale-105 shadow-sm">
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
              <TeamLogo 
                src={match.logoA} 
                name={match.teamA || "فريق أ"} 
                fallbackColor="from-[#0052cc] to-[#00a3bf]" 
              />
            </div>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-gray-900 mt-0.5 line-clamp-2 break-words text-center max-w-[80px]">{match.teamA || "فريق أ"}</span>
        </div>
        
        {/* Score */}
        <div className="flex flex-col items-center justify-center min-w-[60px] text-center">
          {isLive || isFinished ? (
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-extrabold text-gray-900">{toArabicDigits(scoreA.toString())}</span>
              <span className="text-gray-300 text-sm font-bold">-</span>
              <span className="text-base sm:text-lg font-extrabold text-gray-900">{toArabicDigits(scoreB.toString())}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[7px] font-black text-brand uppercase bg-blue-50 border border-blue-100 px-1 py-0.5 rounded mb-0.5">قريباً</span>
              <span className="text-[8px] font-bold text-gray-500">{toArabicDigits(formattedDate)}</span>
            </div>
          )}
          <span className="text-[8px] sm:text-[9px] font-bold text-brand mt-1 whitespace-nowrap bg-blue-50/50 px-2 py-0.5 rounded-full border border-blue-100/50">بث رياضي</span>
        </div>

        {/* Team B */}
        <div className="flex flex-col items-center gap-1 flex-1 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center p-0.5 overflow-hidden transition-all group-hover:scale-105 shadow-sm">
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
              <TeamLogo 
                src={match.logoB} 
                name={match.teamB || "فريق ب"} 
                fallbackColor="from-[#121c38] to-[#ffffff]/90" 
              />
            </div>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-gray-900 mt-0.5 line-clamp-2 break-words text-center max-w-[80px]">{match.teamB || "فريق ب"}</span>
        </div>
      </div>

      {/* Meta indicators */}
      <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-100 text-[8px] sm:text-[9px]">
        <div className="flex items-center gap-1 justify-center bg-slate-50 p-1 rounded-lg border border-slate-100 font-bold text-gray-600">
          <Tv className="w-2.5 h-2.5 text-brand" />
          <span className="truncate">{match.channel || "قناة"}</span>
        </div>
        <div className="flex items-center gap-1 justify-center bg-slate-50 p-1 rounded-lg border border-slate-100 font-bold text-gray-600">
          <Mic className="w-2.5 h-2.5 text-amber-500" />
          <span className="truncate">{match.commentator || "معلق"}</span>
        </div>
      </div>

      {/* Direct Link */}
      <Link 
        to={`/match/${match.id}`}
        className="block w-full mt-3 py-1.5 sm:py-2 bg-brand hover:bg-brand-hover text-white text-center rounded-xl font-black text-[10px] sm:text-xs transition-all shadow-md shadow-brand/20 active:scale-95"
      >
        دخول البث 📺
      </Link>
    </motion.div>
  );
}