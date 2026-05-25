import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { VideoPlayer } from "../../components/VideoPlayer";
import { Star, Calendar, Info, List, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { addToContinueWatching } from "../utils";

export function MediaDetails() {
  const { id } = useParams();
  const [media, setMedia] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [selectedEp, setSelectedEp] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      console.log("🎞️ Loading media details for ID:", id);
      
      const unsubMedia = onSnapshot(doc(db, "media", id), (snap) => {
        if (snap.exists()) {
          const data = snap.data() as any;
          const item = { id: snap.id, ...data } as any;
          setMedia(item);
          if (data.type === 'movie' && !currentUrl) {
            setCurrentUrl(data.streamUrl);
            setCurrentAudioUrl(data.audioUrl || null);
          }
          addToContinueWatching({
            id: snap.id,
            name: item.title,
            type: 'media',
            poster: item.poster
          });
        }
        setLoading(false);
      });

      const episodesRef = collection(db, "media", id, "episodes");
      const unsubEps = onSnapshot(query(episodesRef), (snap) => {
        console.log(`📡 Fetched ${snap.docs.length} episodes for media ${id}`);
        const eps = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        
        eps.sort((a, b) => {
          const numA = Number(a.number) || 0;
          const numB = Number(b.number) || 0;
          return numA - numB;
        });

        setEpisodes(eps);
        
        if (eps.length > 0 && !currentUrl) {
          const firstEp = eps[0];
          console.log("👉 Auto-selecting first episode:", firstEp);
          setCurrentUrl(firstEp.url);
          setCurrentAudioUrl(firstEp.audioUrl || null);
          setSelectedEp(firstEp.number);
        }
      }, (err) => {
        console.error("❌ Episodes subscription error:", err);
      });

      return () => {
        unsubMedia();
        unsubEps();
      };
    }
  }, [id]);

  if (loading) return <div className="p-20 text-center text-[#A1A1AA] animate-pulse">جاري تحميل المشغل والوسائط...</div>;
  if (!media) return <div className="p-20 text-center text-[#A1A1AA]">المحتوى المطلوب غير موجود</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="aspect-video w-full bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
        <AnimatePresence mode="wait">
          {currentUrl ? (
            <motion.div 
              key={currentUrl}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <VideoPlayer 
                src={currentUrl} 
                poster={media.poster}
                audioUrl={currentAudioUrl || undefined}
              />
            </motion.div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#A1A1AA]">
               <Play className="w-16 h-16 opacity-20 mb-4 text-brand animate-pulse" />
               <p>جاري تحميل المشغل...</p>
            </div>
          )}
        </AnimatePresence>
      </div>

       <div className="space-y-6">
        <div className="space-y-6">
          <div className="bg-[#111116] p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4 shadow-xl">
            <h1 className="text-xl sm:text-2xl font-black text-white">{media.title}</h1>
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm font-bold">
               <span className="bg-brand/10 text-brand px-3 py-1.5 rounded-xl border border-brand/15">
                 {media.category === 'arabic_movies' ? 'فيلم عربي' : media.category === 'turkish_series' ? 'مسلسل تركي' : media.category || 'سينما'}
               </span>
               <span className="flex items-center gap-1.5 text-brand bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                 <Star className="w-4 h-4 fill-brand text-brand" /> 
                 <span>{media.rating || "8.5"}</span>
               </span>
               <span className="flex items-center gap-1.5 text-white/80 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                 <Calendar className="w-4 h-4" /> 
                 <span>{media.year || "2026"}</span>
               </span>
            </div>
            <p className="text-[#A1A1AA] leading-relaxed text-sm pt-4 border-t border-white/[0.04]">
               {media.description || "لا يوجد وصف متاح لهذا المحتوى حالياً."}
            </p>
          </div>

           {media.type === 'series' && (
            <div className="bg-[#111116] p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <List className="text-brand w-5 h-5" /> قائم الحلقات المتاحة ({episodes.length})
                </h3>
                {selectedEp && (
                  <span className="bg-brand text-white px-3.5 py-1 rounded-full text-xs font-black animate-pulse shadow-md shadow-brand/20">جاري تشغيل الحلقة {selectedEp}</span>
                )}
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5 sm:gap-3.5">
                {episodes.map((ep: any, index: number) => (
                  <button
                    key={`${ep.id}-${index}`}
                    onClick={() => {
                      setCurrentUrl(ep.url);
                      setCurrentAudioUrl(ep.audioUrl || null);
                      setSelectedEp(ep.number);
                    }}
                    className={`aspect-square flex flex-col items-center justify-center rounded-2xl font-black transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand focus:scale-105 ${
                      selectedEp === ep.number 
                      ? 'bg-brand text-white shadow-lg shadow-brand/25 scale-105 border border-brand' 
                      : 'bg-[#040406]/80 text-[#A1A1AA] hover:text-brand hover:bg-[#040406] border border-white/5'
                    }`}
                  >
                    <span className="text-[9px] opacity-60 mb-0.5 sm:mb-1">EP</span>
                    <span className="text-base leading-none">{ep.number}</span>
                  </button>
                ))}
              </div>
              {episodes.length === 0 && (
                <div className="text-center py-10 space-y-3">
                  <Play className="w-10 h-10 text-white/10 mx-auto" />
                  <p className="text-[#A1A1AA] italic text-xs">سيتم إضافة الحلقات تباعاً.. ابقَ قريباً</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
