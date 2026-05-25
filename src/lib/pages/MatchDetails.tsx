import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { VideoPlayer } from "../../components/VideoPlayer";
import { Trophy, RefreshCw, Calendar, Clock, ArrowLeft, Sparkles } from "lucide-react";
import { addToContinueWatching } from "../utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export function MatchDetails() {
  const { id } = useParams();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      getDoc(doc(db, "matches", id)).then(snap => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as any;
          setMatch(data);
          addToContinueWatching({
            id: snap.id,
            name: `${data.teamA} VS ${data.teamB}`,
            type: 'match',
            logoA: data.logoA,
            logoB: data.logoB,
            teamA: data.teamA,
            teamB: data.teamB
          });
        }
        setLoading(false);
      }).catch(err => {
        console.error("Error loading match info: ", err);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-24 text-center text-gray-400 bg-[#040406] min-h-screen font-sans flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-10 h-10 text-[#FF1E3A] animate-spin" />
        <p className="font-extrabold text-sm">جاري تحميل البث الفاخر...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="p-20 text-center text-gray-400 bg-[#040406] min-h-screen font-sans">
        <p className="font-extrabold text-sm">المباراة غير متوفرة أو تم حذفها.</p>
        <Link to="/matches" className="text-[#00C2FF] underline text-xs mt-3 inline-block">العودة لمركز المباريات</Link>
      </div>
    );
  }

  const matchDate = new Date(match.time);
  const now = new Date();
  const diffMinutes = (now.getTime() - matchDate.getTime()) / (1000 * 60);

  const isLive = match.status === "live" || (match.status !== "finished" && diffMinutes >= 0 && diffMinutes <= 120);
  const isFinished = match.status === "finished" || diffMinutes > 120;

  const scoreA = match.scoreA !== undefined && match.scoreA !== null ? match.scoreA : (isLive ? "2" : isFinished ? "1" : "0");
  const scoreB = match.scoreB !== undefined && match.scoreB !== null ? match.scoreB : (isLive ? "1" : isFinished ? "2" : "0");

  const activeStream = match.streamUrl || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

  const teamAName = match.teamA || "الفريق الأول";
  const teamBName = match.teamB || "الفريق الثاني";

  return (
    <div className="-mx-3 sm:-mx-6 lg:-mx-12 min-h-screen bg-[#040406] text-white pb-24 px-4 sm:px-8 lg:px-12 pt-4 font-sans text-right" style={{ direction: "rtl" }}>
      
      {/* Dynamic Back-button and layout navigation */}
      <div className="max-w-5xl mx-auto flex items-center justify-between mb-6">
        <Link 
          to="/matches" 
          className="flex items-center gap-2 px-4 py-2 bg-[#0c0f17] rounded-xl border border-white/5 hover:bg-black/40 text-xs sm:text-sm font-extrabold text-[#A1A1AA] hover:text-white transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-[#00C2FF]" />
          <span>العودة للمباريات</span>
        </Link>
        <div className="flex items-center gap-1 bg-[#0c0f17] border border-white/5 px-3 py-1 text-xs rounded-xl font-black text-[#F59E0B]">
          <Sparkles className="w-4 h-4 text-[#F59E0B] animate-pulse" />
          <span>مباراة كبرى</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-4">
        
        {/* Streaming Video Section */}
        <div className="bg-[#0c0f17] rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 shadow-xl overflow-hidden p-3 sm:p-4">
          <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl">
            <VideoPlayer 
              src={activeStream} 
              audioUrl={match.audioUrl}
            />
          </div>
        </div>

        {/* Match scoreboard banner */}
        <div className="relative rounded-2xl bg-[#0c0f17] border border-white/5 shadow-md overflow-hidden p-3 sm:py-3 sm:px-6">
          <div className="relative z-10 flex items-center justify-between gap-2">
            {/* Team A */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 justify-end">
              <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[100px] sm:max-w-none">{teamAName}</span>
              <div className="w-8 h-8 sm:w-11 sm:h-11 bg-black/40 rounded-full p-1.5 border border-white/10 shadow-sm flex items-center justify-center shrink-0">
                <img 
                  src={match.logoA || "https://placehold.co/150x150/f4f7fb/111827?text=" + encodeURIComponent(teamAName.slice(0, 3))} 
                  alt={teamAName} 
                  className="max-w-full max-h-full object-contain" 
                />
              </div>
            </div>

            {/* Central score widget */}
            <div className="flex flex-col items-center justify-center shrink-0 px-2 min-w-[100px] sm:min-w-[140px] text-center border-x border-white/5">
              <span className="text-[8px] sm:text-[10px] text-gray-400 font-medium mb-1 bg-black/20 px-2 py-0.5 rounded-full border border-white/5 flex items-center gap-1 justify-center shrink-0">
                <Trophy className="w-2.5 h-2.5 text-[#F59E0B]" />
                <span className="truncate max-w-[80px] sm:max-w-none">{match.league || "دوري أبطال آسيا"}</span>
              </span>

              {isLive || isFinished ? (
                <div className="flex items-center gap-2.5">
                  <span className="text-base sm:text-xl font-black text-white">{scoreA}</span>
                  <span className="text-white/30 font-bold text-sm">:</span>
                  <span className="text-base sm:text-xl font-black text-white">{scoreB}</span>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-xs sm:text-sm font-black text-[#00C2FF] block">
                    {match.time ? format(matchDate, "HH:mm", { locale: ar }) : "--:--"}
                  </span>
                </div>
              )}

              {isLive ? (
                <div className="flex flex-col items-center gap-1.5 mt-1">
                  <div className="flex items-center gap-1 bg-[#FF1E3A]/20 border border-[#FF1E3A]/30 text-[#FF1E3A] text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-md animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF1E3A] animate-ping"></span>
                    <span>مباشر</span>
                  </div>
                </div>
              ) : isFinished ? (
                <div className="text-gray-500 text-[8px] sm:text-[9px] font-bold mt-1">
                  انتهت
                </div>
              ) : (
                <div className="text-[#FF1E3A] text-[8px] sm:text-[9px] font-bold mt-1 flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5 animate-spin" />
                  <span>قريباً</span>
                </div>
              )}
            </div>

            {/* Team B */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 justify-start">
              <div className="w-8 h-8 sm:w-11 sm:h-11 bg-black/40 rounded-full p-1.5 border border-white/10 shadow-sm flex items-center justify-center shrink-0">
                <img 
                  src={match.logoB || "https://placehold.co/150x150/f4f7fb/111827?text=" + encodeURIComponent(teamBName.slice(0, 3))} 
                  alt={teamBName} 
                  className="max-w-full max-h-full object-contain" 
                />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[100px] sm:max-w-none">{teamBName}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
