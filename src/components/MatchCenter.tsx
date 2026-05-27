import React, { useState, useEffect } from 'react';
import { Match, Language } from '../types';
import { translations } from '../mockData';
import { Flame, Clock, Award, Shield, Wifi, Play, ChevronRight, Bell } from 'lucide-react';

interface MatchCenterProps {
  matches: Match[];
  lang: Language;
  onSelectMatch: (match: Match) => void;
  isVipUser: boolean;
}

export default function MatchCenter({
  matches,
  lang,
  onSelectMatch,
  isVipUser
}: MatchCenterProps) {
  const t = translations[lang];
  const [activeFilter, setActiveFilter] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');
  const [reminders, setReminders] = useState<string[]>([]); // list of match IDs with alerts toggled

  // Auto-advance simulated minutes for live matches
  const [liveMatches, setLiveMatches] = useState<Match[]>(matches);
  const [tick, setTick] = useState(0);

  // Tick every second to update live countdown precisely
  useEffect(() => {
    const hasLive = liveMatches.some(m => m.status === 'live');
    if (!hasLive) return;

    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [liveMatches]);

  useEffect(() => {
    setLiveMatches(matches);
  }, [matches]);

  useEffect(() => {
    const minTimer = setInterval(() => {
      setLiveMatches(prev => 
         prev.map(m => {
          if (m.status === 'live' && m.minute && m.minute < 90) {
            return { ...m, minute: m.minute + 1 };
          }
           return m;
         })
      );
    }, 15000); // speed up slightly

    return () => clearInterval(minTimer);
  }, []);

  const filteredMatches = liveMatches.filter(m => {
    if (activeFilter === 'all') return true;
    return m.status === activeFilter;
  });

  const toggleReminder = (matchId: string) => {
    setReminders(prev => 
      prev.includes(matchId) ? prev.filter(id => id !== matchId) : [...prev, matchId]
    );
  };

  const isRtl = lang === 'ar';

  return (
    <div className="w-full flex flex-col gap-6" id="match-center">
      {/* Title with Flame and quick info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5 tracking-tight">
            <Flame className="text-brand-live animate-pulse" size={24} />
            <span>{t.matches}</span>
          </h2>
          <p className="text-xs text-brand-muted mt-1 font-semibold">
            🚩 {lang === 'ar' ? 'البث المباشر لأكبر ديربيات وبطولات كرة القدم العالمية' : 'Live streams for global derbies and premier league fixtures'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-brand-secondary border border-white/[0.04] rounded-2xl overflow-x-auto self-start md:self-auto max-w-full">
          {(['all', 'live', 'upcoming', 'finished'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-300 ${
                activeFilter === filter
                  ? 'bg-brand-accent text-brand-bg font-black shadow-[0_4px_12px_rgba(0,194,255,0.25)]'
                  : 'text-brand-muted hover:text-white hover:bg-brand-card/40'
              }`}
            >
              {filter === 'all' ? (lang === 'ar' ? 'الكل' : 'All Matches') :
               filter === 'live' ? t.liveNow :
               filter === 'upcoming' ? t.upcoming :
               t.finished}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Matches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match) => {
            const isLive = match.status === 'live';
            const isUpcoming = match.status === 'upcoming';
            const isFinished = match.status === 'finished';
            const tournamentName = lang === 'ar' ? match.tournamentAr : match.tournamentEn;
            const team1Name = lang === 'ar' ? match.team1.nameAr : match.team1.nameEn;
            const team2Name = lang === 'ar' ? match.team2.nameAr : match.team2.nameEn;
            const hasReminder = reminders.includes(match.id);

            return (
              <div
                key={match.id}
                onClick={() => onSelectMatch(match)}
                className={`relative bg-brand-card/50 hover:bg-brand-card border ${
                  isLive 
                    ? 'border-brand-live/40 bg-gradient-to-tr from-brand-live/[0.03] to-transparent shadow-[0_0_20px_rgba(255,59,48,0.04)]' 
                    : 'border-white/[0.04]'
                } rounded-3xl p-5 hover:border-brand-accent/20 transition-all duration-300 cursor-pointer group flex flex-col justify-between h-[200px]`}
              >
                {/* Header: Tournament & Alert */}
                <div className="flex items-center justify-between text-xs pb-3 border-b border-white/[0.03]">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{match.tournamentLogo}</span>
                    <span className="text-brand-muted font-bold">{tournamentName}</span>
                  </div>

                  {isLive && (() => {
                    let liveStart = match.liveCreatedAt || match.createdAt;
                    if (!liveStart) {
                      const parsedId = match.id.replace('match_', '');
                      const parsedNum = parseInt(parsedId);
                      if (!isNaN(parsedNum) && parsedNum > 1000000000) {
                        liveStart = parsedNum;
                      }
                    }
                    if (liveStart) {
                      const elapsedMs = Date.now() - liveStart;
                      const remainingMs = Math.max(0, (10 * 60 * 1000) - elapsedMs);
                      const remainingMin = Math.floor(remainingMs / 60000);
                      const remainingSec = Math.floor((remainingMs % 60000) / 1000);
                      return (
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="bg-brand-live text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 glow-live whitespace-nowrap">
                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                            </span>
                            <span>{t.live} {match.minute}'</span>
                          </span>
                          <span className="text-[9px] text-[#ff3b30] font-black bg-brand-live/10 px-2 py-0.5 rounded border border-brand-live/20 font-mono tracking-wider whitespace-nowrap">
                            ⏱️ {lang === 'ar' ? 'ينتهي خلال' : 'Ends in'} {remainingMin}:{remainingSec < 10 ? '0' : ''}{remainingSec}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <span className="bg-brand-live text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 glow-live whitespace-nowrap">
                        <span className="relative flex h-1.5 w-1.5 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                        </span>
                        <span>{t.live} {match.minute}'</span>
                      </span>
                    );
                  })()}
                  {isUpcoming && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/15 font-bold px-2.5 py-1 rounded-full">
                      {match.time}
                    </span>
                  )}
                  {isFinished && (
                    <span className="text-[10px] bg-white/5 border border-white/5 text-zinc-400 font-bold px-2.5 py-1 rounded-full">
                      {t.finished}
                    </span>
                  )}
                </div>

                {/* Score / Teams Row */}
                <div className="flex items-center justify-between py-2.5">
                  {/* Team 1 */}
                  <div className="flex flex-col items-center gap-2 w-[35%] text-center">
                    <img 
                      src={match.team1.logo} 
                      alt={team1Name} 
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80'; }}
                      className="w-12 h-12 rounded-full object-cover bg-brand-bg/80 border border-white/5 shadow-inner"
                    />
                    <span className="text-xs font-bold text-white truncate w-full">{team1Name}</span>
                  </div>

                  {/* Score OR Time Center */}
                  <div className="flex flex-col items-center justify-center w-[30%]">
                    {isUpcoming ? (
                      <div className="text-center">
                        <span className="text-zinc-500 text-[9px] uppercase tracking-wider block mb-0.5">
                          {lang === 'ar' ? 'انطلاق اللقاء' : 'Countdown'}
                        </span>
                        <span className="text-sm font-black text-brand-accent font-mono tracking-wider">{match.time}</span>
                        <span className="text-[9px] text-brand-muted mt-1 block font-semibold">{match.date}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl font-black text-white font-mono">{match.team1Score ?? 0}</span>
                        <span className="text-zinc-600 text-[10px] font-bold uppercase">{t.vs}</span>
                        <span className="text-2xl font-black text-white font-mono">{match.team2Score ?? 0}</span>
                      </div>
                    )}
                  </div>

                  {/* Team 2 */}
                  <div className="flex flex-col items-center gap-2 w-[35%] text-center">
                    <img 
                      src={match.team2.logo} 
                      alt={team2Name}
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579952365111-3958b8db916e?w=100&auto=format&fit=crop&q=80'; }}
                      className="w-12 h-12 rounded-full object-cover bg-brand-bg/80 border border-white/5 shadow-inner"
                    />
                    <span className="text-xs font-bold text-white truncate w-full">{team2Name}</span>
                  </div>
                </div>

                {/* Footer: Stream servers configuration check / action */}
                <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.03]">
                  <div className="text-[10px] text-brand-muted font-mono font-bold flex items-center gap-1.5">
                    <Wifi size={12} className={isLive ? 'text-brand-live animate-pulse' : 'text-brand-muted'} />
                    <span>
                      {lang === 'ar' ? `خوادم البث المتاحة: ${match.servers.length}` : `Online Servers: ${match.servers.length}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 animate-none" onClick={(e) => e.stopPropagation()}>
                    {isUpcoming && (
                      <button 
                        onClick={() => toggleReminder(match.id)}
                        className={`p-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                          hasReminder 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : 'bg-brand-bg hover:bg-brand-card text-brand-muted border-white/[0.03]'
                        }`}
                      >
                        <Bell size={12} className={hasReminder ? 'animate-bounce text-amber-400' : ''} />
                        <span>
                          {hasReminder ? (lang === 'ar' ? 'مفعّل 🔔' : 'ON') : (lang === 'ar' ? 'تذكير' : 'Notify')}
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectMatch(match)}
                      className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition duration-300 ${
                        isLive 
                          ? 'bg-brand-live hover:bg-brand-live/90 text-white shadow-[0_4px_12px_rgba(255,59,48,0.25)] glow-live' 
                          : 'bg-brand-bg hover:bg-brand-card text-white border border-white/[0.04]'
                      }`}
                    >
                      <Play size={10} fill="currentColor" />
                      <span>{isLive ? t.playNow : t.details}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-1 md:col-span-2 bg-brand-card/30 rounded-3xl p-12 text-center border border-white/[0.03] glass-panel">
            <p className="text-brand-muted font-semibold italic">{t.noResults}</p>
          </div>
        )}
      </div>
    </div>
  );
}
