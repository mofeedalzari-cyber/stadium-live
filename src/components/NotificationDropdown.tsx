import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Link } from "react-router-dom";
import { Trophy, Tv, Film, Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface NotificationItem {
  id: string;
  type: 'match' | 'channel' | 'media';
  title: string;
  time: any;
  image?: string;
  link: string;
}

export function NotificationDropdown({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch matches
    const qMatches = query(collection(db, "matches"), orderBy("updatedAt", "desc"), limit(3));
    const qChannels = query(collection(db, "channels"), orderBy("updatedAt", "desc"), limit(3));
    const qMedia = query(collection(db, "media"), orderBy("updatedAt", "desc"), limit(3));

    const unsubMatches = onSnapshot(qMatches, (snap) => {
      const items = snap.docs.map(doc => ({
        id: doc.id,
        type: 'match' as const,
        title: `${doc.data().teamA} vs ${doc.data().teamB}`,
        time: doc.data().updatedAt,
        image: doc.data().logoA,
        link: `/match/${doc.id}`
      }));
      updateNotifications(items, 'match');
    }, (error) => {
      console.error("Matches notification error:", error);
    });

    const unsubChannels = onSnapshot(qChannels, (snap) => {
      const items = snap.docs.map(doc => ({
        id: doc.id,
        type: 'channel' as const,
        title: doc.data().name,
        time: doc.data().updatedAt,
        image: doc.data().logo,
        link: `/channel/${doc.id}`
      }));
      updateNotifications(items, 'channel');
    }, (error) => {
      console.error("Channels notification error:", error);
    });

    const unsubMedia = onSnapshot(qMedia, (snap) => {
      const items = snap.docs.map(doc => ({
        id: doc.id,
        type: 'media' as const,
        title: doc.data().title || doc.data().name,
        time: doc.data().updatedAt,
        image: doc.data().poster || (doc.data().poster_path ? `https://image.tmdb.org/t/p/w200${doc.data().poster_path}` : undefined),
        link: `/media/${doc.id}`
      }));
      updateNotifications(items, 'media');
    }, (error) => {
      console.error("Media notification error:", error);
    });

    return () => {
      unsubMatches();
      unsubChannels();
      unsubMedia();
    };
  }, [isOpen]);

  const updateNotifications = (newItems: NotificationItem[], type: string) => {
    setNotifications(prev => {
      const otherTypes = prev.filter(item => item.type !== type);
      const combined = [...otherTypes, ...newItems];
      // Deduplicate by type and id
      const unique = Array.from(new Map(combined.map(item => [`${item.type}-${item.id}`, item])).values());
      const sorted = unique.sort((a, b) => {
        const timeA = a.time?.toMillis?.() || 0;
        const timeB = b.time?.toMillis?.() || 0;
        return timeB - timeA;
      });
      return sorted.slice(0, 10);
    });
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed sm:absolute top-[72px] sm:top-full left-2.5 sm:left-0 right-2.5 sm:right-auto mt-2 sm:mt-4 w-auto sm:w-96 bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden z-[70] origin-top-left"
          >
            <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-600" />
                <span className="font-bold text-sm text-[#0f172a] dark:text-white">آخر التحديثات</span>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center animate-pulse text-gray-400 text-sm">جاري التحميل...</div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  لا يوجد تحديثات جديدة
                </div>
              ) : (
                <div className="divide-y divide-black/5 dark:divide-white/5">
                  {notifications.map((notif) => (
                    <Link 
                      key={`${notif.type}-${notif.id}`} 
                      to={notif.link} 
                      onClick={onClose}
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                    >
                      <div className="relative flex-shrink-0">
                         {notif.image ? (
                           <img src={notif.image} className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 rounded-lg object-contain bg-slate-50 dark:bg-neutral-900 p-0.5 ring-1 ring-black/5 dark:ring-white/5" alt="" />
                         ) : (
                           <div className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 rounded-lg bg-red-600/10 flex items-center justify-center">
                             {notif.type === 'match' && <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-600" />}
                             {notif.type === 'channel' && <Tv className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-600" />}
                             {notif.type === 'media' && <Film className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-600" />}
                           </div>
                         )}
                         <div className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-red-600 rounded-full border border-white dark:border-[#1a1a1a]">
                            {notif.type === 'match' && <Trophy className="w-1.5 h-1.5 text-white" />}
                            {notif.type === 'channel' && <Tv className="w-1.5 h-1.5 text-white" />}
                            {notif.type === 'media' && <Film className="w-1.5 h-1.5 text-white" />}
                         </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-[#0f172a] dark:text-white line-clamp-1 group-hover:text-red-600 transition-colors">
                          {notif.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-red-600/10 text-red-600 px-2 py-0.5 rounded-full font-black uppercase">
                             {notif.type === 'match' ? 'مباراة' : notif.type === 'channel' ? 'قناة' : 'ميديا'}
                          </span>
                          <span className="text-[10px] text-gray-500">
                             {notif.time ? formatDistanceToNow(notif.time.toDate(), { addSuffix: true, locale: ar }) : 'الآن'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            <Link 
              to="/" 
              onClick={onClose}
              className="block p-3 text-center text-xs font-bold text-red-600 bg-red-600/5 hover:bg-red-600/10 transition-colors"
            >
              مشاهدة الجميع
            </Link>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
