import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { VideoPlayer } from "../../components/VideoPlayer";
import { Info, Radio, Zap } from "lucide-react";
import { FavoriteButton } from "../../components/FavoriteButton";
import { addToContinueWatching } from "../utils";

export function ChannelPlayer() {
  const { id } = useParams();
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (id) {
      getDoc(doc(db, "channels", id)).then(snap => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as any;
          setChannel(data);
          addToContinueWatching({
            id: snap.id,
            name: data.name,
            type: 'channel',
            logo: data.logo
          });
        }
      });
    }
  }, [id]);

  if (!channel) return <div className="p-20 text-center">جاري تشغيل القناة...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="relative group">
        <div className="aspect-video w-full bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20">
          {channel.type === 'iframe' ? (
            <iframe 
              src={channel.url || undefined} 
              className="w-full h-full border-none" 
              allowFullScreen
              allow="autoplay; encrypted-media"
            />
          ) : (
            <VideoPlayer 
              src={channel.url} 
              poster={channel.logo}
              audioUrl={channel.audioUrl || undefined}
            />
          )}
        </div>
      </div>

      <div className="bg-[#111116] p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-right">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">{channel.name}</h1>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-brand mt-2.5 text-xs sm:text-sm font-bold">
                <span className="w-2 h-2 rounded-full bg-brand animate-ping" />
                <span>بث مباشر مستقر الآن</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="bg-brand/10 text-brand px-4 py-2 rounded-xl border border-brand/20 text-xs font-bold uppercase tracking-wider">
                {channel.group === 'sports' ? 'قناة رياضية' : channel.group || 'ترفيهية'}
             </div>
             <FavoriteButton 
               itemId={channel.id} 
               type="channel" 
               itemData={channel} 
               showText 
               className="bg-[#040406] text-white hover:text-brand px-4 py-2 rounded-xl border border-white/5 text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1"
             />
          </div>
        </div>
      </div>
    </div>
  );
}
