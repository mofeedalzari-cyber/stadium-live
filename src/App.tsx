import React, { useState, useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Match, Channel, VideoContent, HomepageSlider, ContinueWatching, User, Language, AdConfig } from './types';
import { 
  translations, 
  INITIAL_MATCHES, 
  INITIAL_CHANNELS, 
  INITIAL_VIDEOCONTENT, 
  INITIAL_SLIDERS, 
  INITIAL_CONTINUE_WATCHING,
  INITIAL_AD_CONFIG,
  getLocalStorageData,
  saveLocalStorageData
} from './mockData';

// Components
import Sidebar from './components/Sidebar';
import BottomNavBar from './components/BottomNavBar';
import VideoPlayer from './components/VideoPlayer';
import MatchCenter from './components/MatchCenter';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import StartIoAd from './components/StartIoAd';

// Icons
import { 
  Search, Heart, Tv, Flame, Clapperboard, Monitor, Star, User as UserIcon, Globe, 
  Play, Plus, Bell, ChevronLeft, ChevronRight, Share2, Info, Eye, CheckCircle, Wifi, Clock,
  Settings, LogOut, Menu, Sun, Moon
} from 'lucide-react';

export default function App() {
  // Theme state: defaults to light (day mode) as requested
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getLocalStorageData<'light' | 'dark'>('stad_theme', 'light'));

  // 1. Core States with automated LocalStorage integration
  const [lang, setLang] = useState<Language>('ar');
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [user, setUser] = useState<User>(() => getLocalStorageData<User>('stad_user', {
    username: 'zarymofeed',
    email: 'zarymofeed@gmail.com',
    isVip: true,
    activationCode: 'STAD-VIP-2026',
    expiryDate: '2027-05-23'
  }));

  const [matches, setMatches] = useState<Match[]>(() => {
    const data = getLocalStorageData<Match[]>('stad_matches', INITIAL_MATCHES);
    return data.map(m => {
      let team1 = m.team1;
      let team2 = m.team2;
      let poster = m.poster;
      const isBroken = (url: string) => url && (url.includes('photo-1540747737956-378724044432') || url.includes('photo-1508098682722-e99c43a406b2'));
      if (isBroken(team1.logo)) {
        team1 = { ...team1, logo: 'https://images.unsplash.com/photo-1431324155629-1a6edd1e1ece?w=150&auto=format&fit=crop&q=80' };
      }
      if (isBroken(team2.logo)) {
        team2 = { ...team2, logo: 'https://images.unsplash.com/photo-1579952365111-3958b8db916e?w=150&auto=format&fit=crop&q=80' };
      }
      if (isBroken(poster)) {
        poster = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80';
      }
      return { ...m, team1, team2, poster };
    });
  });
  const [channels, setChannels] = useState<Channel[]>(() => {
    const data = getLocalStorageData<Channel[]>('stad_channels', INITIAL_CHANNELS);
    return data.map(c => {
      if (c.logo && (c.logo.includes('photo-1540747737956-378724044432') || c.logo.includes('photo-1508098682722-e99c43a406b2'))) {
        return { ...c, logo: 'https://images.unsplash.com/photo-1579952365111-3958b8db916e?w=500&auto=format&fit=crop&q=80' };
      }
      return c;
    });
  });
  const [vods, setVods] = useState<VideoContent[]>(() => {
    const data = getLocalStorageData<VideoContent[]>('stad_vods', INITIAL_VIDEOCONTENT);
    return data.map(v => {
      let poster = v.poster;
      let backdrop = v.backdrop;
      const isBroken = (url: string) => url && (url.includes('photo-1540747737956-378724044432') || url.includes('photo-1508098682722-e99c43a406b2'));
      if (isBroken(poster)) {
        poster = 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=500&auto=format&fit=crop&q=80';
      }
      if (isBroken(backdrop)) {
        backdrop = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&auto=format&fit=crop&q=80';
      }
      return { ...v, poster, backdrop };
    });
  });
  const [sliders, setSliders] = useState<HomepageSlider[]>(() => {
    const data = getLocalStorageData<HomepageSlider[]>('stad_sliders', INITIAL_SLIDERS);
    return data.map(s => {
      // Auto-update slider info from INITIAL_SLIDERS if it exists, ensures fresh translations/content
      const original = INITIAL_SLIDERS.find(orig => orig.id === s.id);
      const activeSlider = original 
        ? { ...s, titleAr: original.titleAr, titleEn: original.titleEn, subtitleAr: original.subtitleAr, subtitleEn: original.subtitleEn } 
        : s;

      if (activeSlider.id === 's_1') {
        activeSlider.titleAr = 'كأس العالم 2026 مباشر الآن';
        activeSlider.subtitleAr = 'شاهد أقوى مباريات بطولة كأس العالم 2026 لحظة بلحظة وبأعلى جودة بث ممكنة، مع توفر أربعة خوادم قوية لضمان مشاهدة سلسة بدون تقطيع أو تأخير، واستمتع بأجواء عالمية مليئة بالإثارة والحماس.';
      }

      if (activeSlider.image && (activeSlider.image.includes('photo-1540747737956-378724044432') || activeSlider.image.includes('photo-1508098682722-e99c43a406b2'))) {
        return { ...activeSlider, image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&auto=format&fit=crop&q=80' };
      }
      return activeSlider;
    });
  });
  const [continueWatching, setContinueWatching] = useState<ContinueWatching[]>(() => {
    const data = getLocalStorageData<ContinueWatching[]>('stad_continue', INITIAL_CONTINUE_WATCHING);
    return data.map(cw => {
      if (cw.poster && (cw.poster.includes('photo-1540747737956-378724044432') || cw.poster.includes('photo-1508098682722-e99c43a406b2'))) {
        return { ...cw, poster: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=500&auto=format&fit=crop&q=80' };
      }
      return cw;
    });
  });
  const [favorites, setFavorites] = useState<string[]>(() => getLocalStorageData<string[]>('stad_favorites', ['m1', 'c1', 'v1']));
  const [channelCategories, setChannelCategories] = useState<{ id: string; nameAr: string; nameEn: string; icon?: string; parentId?: string | null }[]>(() => {
    const data = localStorage.getItem('stad_channel_categories');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: 'sports', nameAr: 'قنوات رياضية', nameEn: 'Sports Channels', icon: '⚽', parentId: 'channels' },
      { id: 'news', nameAr: 'قنوات إخبارية', nameEn: 'News Channels', icon: '📰', parentId: 'channels' },
      { id: 'entertainment', nameAr: 'قنوات تلفزيونية / ترفيهية', nameEn: 'TV & Entertainment', icon: '✨', parentId: 'channels' }
    ];
  });

  const [vodCategories, setVodCategories] = useState<{ id: string; nameAr: string; nameEn: string; icon?: string; parentId?: string | null }[]>(() => {
    const data = localStorage.getItem('stad_vod_categories');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: 'turkish_series', nameAr: 'مسلسلات تركية', nameEn: 'Turkish Series', icon: '🇹🇷', parentId: 'series' },
      { id: 'arabic_series', nameAr: 'مسلسلات عربية', nameEn: 'Arabic Series', icon: '🇸🇦', parentId: 'series' },
      { id: 'documentary_movies', nameAr: 'أفلام وثائقية', nameEn: 'Documentaries', icon: '🐪', parentId: 'movie' },
      { id: 'action_movies', nameAr: 'أفلام أكشن', nameEn: 'Action Movies', icon: '🍿', parentId: 'movie' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('stad_channel_categories', JSON.stringify(channelCategories));
  }, [channelCategories]);

  useEffect(() => {
    localStorage.setItem('stad_vod_categories', JSON.stringify(vodCategories));
  }, [vodCategories]);

  // Migrate old categories to new ones in localStorage if present on load
  useEffect(() => {
    const channelCatData = localStorage.getItem('stad_channel_categories');
    let hasUpdatedChannelCats = false;
    let currentChannelCats = [];
    if (channelCatData) {
      try {
        currentChannelCats = JSON.parse(channelCatData);
      } catch (e) { console.error(e); }
    }
    
    const hasOldChannelCats = !channelCatData || currentChannelCats.some((c: any) => c.id === 'kids' || c.id === 'documentary') || currentChannelCats.length > 3;
    if (hasOldChannelCats) {
      const migratedChannelCats = [
        { id: 'sports', nameAr: 'قنوات رياضية', nameEn: 'Sports Channels', icon: '⚽', parentId: 'channels' },
        { id: 'news', nameAr: 'قنوات إخبارية', nameEn: 'News Channels', icon: '📰', parentId: 'channels' },
        { id: 'entertainment', nameAr: 'قنوات تلفزيونية / ترفيهية', nameEn: 'TV & Entertainment', icon: '✨', parentId: 'channels' }
      ];
      setChannelCategories(migratedChannelCats);
      localStorage.setItem('stad_channel_categories', JSON.stringify(migratedChannelCats));
      hasUpdatedChannelCats = true;
    }

    const vodCatData = localStorage.getItem('stad_vod_categories');
    let currentVodCats = [];
    if (vodCatData) {
      try {
        currentVodCats = JSON.parse(vodCatData);
      } catch (e) { console.error(e); }
    }
    
    const hasOldVodCats = !vodCatData || currentVodCats.some((c: any) => c.id === 'sports_docs' || c.id === 'drama_series');
    if (hasOldVodCats) {
      const migratedVodCats = [
        { id: 'turkish_series', nameAr: 'مسلسلات تركية', nameEn: 'Turkish Series', icon: '🇹🇷', parentId: 'series' },
        { id: 'arabic_series', nameAr: 'مسلسلات عربية', nameEn: 'Arabic Series', icon: '🇸🇦', parentId: 'series' },
        { id: 'documentary_movies', nameAr: 'أفلام وثائقية', nameEn: 'Documentaries', icon: '🐪', parentId: 'movie' },
        { id: 'action_movies', nameAr: 'أفلام أكشن', nameEn: 'Action Movies', icon: '🍿', parentId: 'movie' }
      ];
      setVodCategories(migratedVodCats);
      localStorage.setItem('stad_vod_categories', JSON.stringify(migratedVodCats));
    }

    const channelsData = localStorage.getItem('stad_channels');
    if (channelsData) {
      try {
        const storedChannels = JSON.parse(channelsData);
        let channelUpdated = false;
        const migratedChannels = storedChannels.map((c: any) => {
          if (c.category === 'kids' || c.category === 'documentary') {
            c.category = 'entertainment';
            channelUpdated = true;
          }
          return c;
        });
        if (channelUpdated) {
          setChannels(migratedChannels);
          localStorage.setItem('stad_channels', JSON.stringify(migratedChannels));
        }
      } catch (e) { console.error(e); }
    }

    const vodsData = localStorage.getItem('stad_vods');
    if (vodsData) {
      try {
        const storedVods = JSON.parse(vodsData);
        let vodsUpdated = false;
        const migratedVods = storedVods.map((v: any) => {
          const ar = v.categoryAr || '';
          if (ar.includes('وثائقي') || ar.includes('سير') || ar === 'وثائقيات رياضية' || ar === 'أفلام وتراجم سير') {
            v.categoryAr = 'أفلام وثائقية';
            v.categoryEn = 'Documentaries';
            vodsUpdated = true;
          } else if (ar.includes('حركة') || ar.includes('أكشن') || ar === 'أفلام حركة وإثارة') {
            v.categoryAr = 'أفلام أكشن';
            v.categoryEn = 'Action Movies';
            vodsUpdated = true;
          } else if (ar.includes('درام') || ar.includes('مسلسلات') || ar === 'مسلسلات درامية') {
            v.categoryAr = 'مسلسلات عربية';
            v.categoryEn = 'Arabic Series';
            vodsUpdated = true;
          }
          return v;
        });
        if (vodsUpdated) {
          setVods(migratedVods);
          localStorage.setItem('stad_vods', JSON.stringify(migratedVods));
        }
      } catch (e) { console.error(e); }
    }
  }, []);

  const [adConfig, setAdConfig] = useState<AdConfig>(() => {
    return getLocalStorageData<AdConfig>('stad_ads', INITIAL_AD_CONFIG);
  });

  // Player State
  const [activePlayer, setActivePlayer] = useState<{
    streamUrl: string;
    title: string;
    isLive: boolean;
    category?: string;
    servers?: { name: string; url: string }[];
    epg?: { time: string; titleAr: string; titleEn: string }[];
  } | null>(null);

  // Search, UI Modals
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChannelCat, setActiveChannelCat] = useState<string>('all');
  const [activeCinemaCat, setActiveCinemaCat] = useState<'all' | 'movie' | 'series'>('all');
  const [selectedVod, setSelectedVod] = useState<VideoContent | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [activeSliderIdx, setActiveSliderIdx] = useState(0);

  // Notifications states
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<{
    id: string;
    title: string;
    subtitleAr: string;
    timestamp: number;
    type: 'match' | 'media' | 'channel';
    image: string;
    targetId?: string;
    isRead?: boolean;
  }[]>(() => {
    const data = localStorage.getItem('stad_notifications');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'notif_1',
        title: 'AR: Al Quds Today',
        subtitleAr: 'تم إضافة البث الكامل لقناة القدس اليوم الفضائية لمكتبة البث الحي ميديا',
        timestamp: Date.now() - 14 * 60 * 60 * 1000,
        type: 'media',
        image: 'https://images.unsplash.com/photo-1540747737956-378724044432?w=150',
        isRead: false
      },
      {
        id: 'notif_2',
        title: 'AR: PNN',
        subtitleAr: 'تحديث سيرفرات القناة الإخبارية وتوفير بث ثابت بجودة HD واعتيادية',
        timestamp: Date.now() - 14 * 60 * 60 * 1000,
        type: 'media',
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=150',
        isRead: false
      },
      {
        id: 'notif_3',
        title: 'AR: Hala HD',
        subtitleAr: 'بث قناة هلا الحرة بوضوح تام وجودات متعددة ملائمة للباقات الضعيفة',
        timestamp: Date.now() - 14 * 60 * 60 * 1000,
        type: 'media',
        image: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=150',
        isRead: false
      },
      {
        id: 'notif_4',
        title: 'المكسيك ضد جنوب افريقيا',
        subtitleAr: 'ملخص وأهداف المباراة الحماسية بجودات فائقة السرعة ومتعددة اللغات',
        timestamp: Date.now() - 24 * 60 * 60 * 1000,
        type: 'match',
        image: 'https://images.unsplash.com/photo-1431324155629-1a6edd1e1ece?w=150',
        isRead: true
      },
      {
        id: 'notif_5',
        title: 'ألوان الرياضية مباشر',
        subtitleAr: 'إضافة قناة ألوان الإمبراطورية في قسم الرياضة والكورة لجميع المشتركين',
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
        type: 'channel',
        image: 'https://images.unsplash.com/photo-1579952365111-3958b8db916e?w=150',
        isRead: true
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('stad_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Marquee Broadcast state
  const [adminBroadcast, setAdminBroadcast] = useState<string | null>(
    getLocalStorageData<string | null>('stad_broadcast', 'مرحباً بك في STAD TV! تطبيق مشاهدة مجاني بالكامل بدون أي اشتراكات أو قيود أو أكواد تفعيل ⚽')
  );

  // Admin Authorization check
  const isUserAdmin = user && (
    user.email?.toLowerCase() === 'zarymofeed@gmail.com' ||
    user.email?.toLowerCase().includes('admin') ||
    user.username?.toLowerCase() === 'admin' ||
    user.isAdmin === true
  );

  useEffect(() => {
    if (currentTab === 'admin' && !isUserAdmin) {
      setCurrentTab('home');
    }
  }, [currentTab, isUserAdmin]);

  // Force VIP status to always be true for free viewing
  useEffect(() => {
    if (!user.isVip) {
      setUser(prev => ({
        ...prev,
        isVip: true,
        expiryDate: '2035-12-31'
      }));
    }
  }, [user.isVip]);

  // Backups and persistence loops
  useEffect(() => {
    saveLocalStorageData('stad_lang', lang);
    const root = window.document.documentElement;
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', lang);
  }, [lang]);

  useEffect(() => {
    saveLocalStorageData('stad_user', user);
  }, [user]);

  useEffect(() => {
    saveLocalStorageData('stad_matches', matches);
  }, [matches]);

  useEffect(() => {
    saveLocalStorageData('stad_channels', channels);
  }, [channels]);

  useEffect(() => {
    saveLocalStorageData('stad_vods', vods);
  }, [vods]);

  useEffect(() => {
    saveLocalStorageData('stad_sliders', sliders);
  }, [sliders]);

  useEffect(() => {
    saveLocalStorageData('stad_continue', continueWatching);
  }, [continueWatching]);

  useEffect(() => {
    saveLocalStorageData('stad_favorites', favorites);
  }, [favorites]);

  useEffect(() => {
    saveLocalStorageData('stad_broadcast', adminBroadcast);
  }, [adminBroadcast]);

  useEffect(() => {
    saveLocalStorageData('stad_ads', adConfig);
  }, [adConfig]);

  // Trigger smooth interstitial on initial app launch after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      showInterstitialAd();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Handle theme modifications
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark-theme');
      root.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-theme');
      root.classList.remove('dark-mode');
    }
    saveLocalStorageData('stad_theme', theme);
  }, [theme]);

  // Native Android Back Button management via Capacitor
  useEffect(() => {
    let backButtonListener: any = null;

    const setupBackButton = async () => {
      try {
        backButtonListener = await CapApp.addListener('backButton', (event) => {
          // If a video player is active, close the player instead of exiting
          if (activePlayer) {
            setActivePlayer(null);
            return;
          }
          // If a VOD movie/series info modal or details is open, close it
          if (selectedVod) {
            setSelectedVod(null);
            return;
          }
          // If auth modal is showing, close it
          if (showAuthModal) {
            setShowAuthModal(false);
            return;
          }
          // If on a sub-tab other than home, return to home
          if (currentTab !== 'home') {
            setCurrentTab('home');
            return;
          }
          // Otherwise, if any history is present, or if web browser has go-back, trigger standard back or exit
          if (event.canGoBack) {
            window.history.back();
          } else {
            CapApp.exitApp();
          }
        });
      } catch (err) {
        console.warn('Capacitor App backButton listener not initialized (Not in native Capacitor environment):', err);
      }
    };

    setupBackButton();

    return () => {
      if (backButtonListener && typeof backButtonListener.remove === 'function') {
        backButtonListener.remove();
      }
    };
  }, [activePlayer, selectedVod, showAuthModal, currentTab]);

  // Rotates Homepage Slide Banner nicely
  useEffect(() => {
    if (sliders.length === 0) return;
    const slideInterval = setInterval(() => {
      setActiveSliderIdx(prev => (prev + 1) % sliders.length);
    }, 8000);
    return () => clearInterval(slideInterval);
  }, [sliders.length]);

  // Monitors and automatically finishes live matches exactly 10 minutes after being added or turned to live
  useEffect(() => {
    const handleAutofinishMatches = setInterval(() => {
      let changed = false;
      const now = Date.now();
      const updatedMatches = matches.map(match => {
        if (match.status === 'live') {
          let liveStart = match.liveCreatedAt || match.createdAt;
          if (!liveStart) {
            const parsedId = match.id.replace('match_', '');
            const parsedNum = parseInt(parsedId);
            if (!isNaN(parsedNum) && parsedNum > 1000000000) {
              liveStart = parsedNum;
            }
          }
          
          if (!liveStart) {
            liveStart = now;
            match.liveCreatedAt = now;
            changed = true;
          }

          const elapsedMs = now - liveStart;
          const limitMs = 10 * 60 * 1000; // 10 minutes

          if (elapsedMs >= limitMs) {
            console.log(`[Timer Auto-Finish] Match ${match.team1.nameAr} vs ${match.team2.nameAr} automatically marked finished after 10m.`);
            changed = true;
            return {
              ...match,
              status: 'finished' as const,
              minute: undefined
            };
          }
        }
        return match;
      });

      if (changed) {
        setMatches(updatedMatches);
      }
    }, 4000);

    return () => clearInterval(handleAutofinishMatches);
  }, [matches]);

  const t = translations[lang];

  const lastInterstitialTimeRef = useRef<number>(0);

  const showInterstitialAd = () => {
    if (!adConfig.active || !adConfig.interstitialActive) {
      console.log("[Start.io Debug] Interstitial ads are inactive or disabled in configuration.");
      return;
    }

    const now = Date.now();
    // Frequency control: limit to at most once per 120 seconds (2 minutes)
    if (now - lastInterstitialTimeRef.current < 120000) {
      console.log(`[Start.io Debug] Interstitial call ignored (Frequency Cap Active. Next available in ${~~((120000 - (now - lastInterstitialTimeRef.current)) / 1000)}s).`);
      return;
    }

    console.log("[Start.io Debug] Preparing to show Start.io Interstitial Ad. Initiated elegant 750ms delay for loading pre-auth...");

    setTimeout(() => {
      // Re-check config
      if (!adConfig.active || !adConfig.interstitialActive) {
        console.log("[Start.io Debug] Interstitial ads were disabled during delay interval.");
        return;
      }

      lastInterstitialTimeRef.current = Date.now();
      console.log("[Start.io Debug] Launching Start.io Interstitial Ad script injection with App ID: 204252956");

      try {
        // Clean up any stale startapp script tags to avoid conflicts
        const staleTags = document.querySelectorAll('script.startapp-container[data-ad-type="interstitial"]');
        staleTags.forEach(tag => {
          console.log("[Start.io Debug] Removing stale interstitial tag to prevent duplicate rendering.");
          tag.remove();
        });

        const script = document.createElement('script');
        // Cache-busting URL parameter guarantees dynamic re-evaluation on SPA route changes
        script.src = `https://sdk.start.io/web/ads.js?t=${Date.now()}`;
        script.className = 'startapp-container';
        script.async = true;
        script.setAttribute('data-app-id', '204252956');
        script.setAttribute('data-ad-type', 'interstitial');

        script.onload = () => {
          console.log("[Start.io Debug] Interstitial Script element loaded successfully in browser DOM.");
        };

        script.onerror = (e) => {
          console.error("[Start.io Debug] Failed to download or initialize the Start.io Web SDK script file:", e);
        };

        document.body.appendChild(script);

        // Cleanup element after 15 seconds
        setTimeout(() => {
          if (document.body.contains(script)) {
            console.log("[Start.io Debug] Auto recycling/removing interstitial mount tag from document body.");
            document.body.removeChild(script);
          }
        }, 15000);

      } catch (err) {
        console.error("[Start.io Debug] JavaScript execution exception during active dynamic SDK injection:", err);
      }
    }, 750); // 750ms delay
  };

  // Toggle favorite trigger
  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  // Helper to format notification time relative to now in Arabic
  const formatTimeAr = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) {
      const mins = Math.floor(diff / (1000 * 60));
      return mins <= 1 ? 'الآن' : `منذ ${mins} دقيقة تقريباً`;
    }
    if (hours < 24) {
      return `منذ ${hours} ساعة تقريباً`;
    }
    const days = Math.floor(hours / 24);
    if (days === 1) {
      return 'منذ يوم واحد';
    }
    if (days === 2) {
      return 'منذ يومين';
    }
    return `منذ ${days} أيام`;
  };

  // Click on a notification to view/play content
  const handleNotifClick = (notif: { id: string; title: string; type: 'match' | 'media' | 'channel'; targetId?: string }) => {
    // Mark as read
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    setShowNotifications(false);

    if (notif.type === 'match') {
      const m = matches.find(item => item.id === notif.targetId || (item.team1.nameAr + ' ضد ' + item.team2.nameAr).includes(notif.title));
      if (m) {
        if (m.status === 'live' || m.status === 'finished') {
          triggerPlay({ 
            titleAr: m.team1.nameAr + ' ضد ' + m.team2.nameAr, 
            titleEn: m.team1.nameEn + ' vs ' + m.team2.nameEn, 
            streamUrl: m.servers[0]?.url 
          }, m.status === 'live', m.servers, m.statistics ? [] : undefined);
        } else {
          setCurrentTab('matches');
        }
      } else {
        setCurrentTab('matches');
      }
    } else if (notif.type === 'channel') {
      const c = channels.find(item => item.id === notif.targetId || item.nameAr.includes(notif.title));
      if (c) {
        triggerPlay({ 
          titleAr: c.nameAr, 
          titleEn: c.nameEn, 
          streamUrl: c.streamUrl 
        }, true, [{ name: 'Server 1', url: c.streamUrl }], c.epg);
      } else {
        setCurrentTab('channels');
      }
    } else if (notif.type === 'media') {
      const v = vods.find(item => item.id === notif.targetId || item.titleAr.includes(notif.title));
      if (v) {
        setSelectedVod(v);
        setCurrentTab('movies');
      } else {
        setCurrentTab('movies');
      }
    }
  };

  // Trigger stream play
  const triggerPlay = (item: {
    titleAr: string;
    titleEn: string;
    streamUrl?: string;
    categoryAr?: string;
    categoryEn?: string;
    seasons?: any[];
  }, isLiveItem: boolean = false, customServers: { name: string; url: string }[] = [], epgData: any[] = []) => {
    // Trigger Start.io Interstitial Web Ad
    showInterstitialAd();

    const url = item.streamUrl || 'https://test-streams.mux.dev/x36xhg/main.m3u8';
    
    // Save to Continue Watching
    const isChannel = !item.streamUrl && isLiveItem;
    if (!isChannel) {
      const existing = continueWatching.find(cw => cw.titleAr === item.titleAr);
      if (!existing) {
        const newRecord: ContinueWatching = {
          id: 'cw_' + Date.now(),
          contentId: 'simulated_id',
          titleAr: item.titleAr,
          titleEn: item.titleEn,
          poster: 'https://images.unsplash.com/photo-1540747737956-378724044432?w=300&auto=format&fit=crop&q=80',
          type: item.seasons ? 'series' : 'movie',
          progress: 10,
          timeString: '05:00'
        };
        setContinueWatching([newRecord, ...continueWatching.slice(0, 4)]);
      }
    }

    setActivePlayer({
      streamUrl: url,
      title: lang === 'ar' ? item.titleAr : item.titleEn,
      isLive: isLiveItem,
      category: lang === 'ar' ? (item.categoryAr || 'رياضة') : (item.categoryEn || 'Sports'),
      servers: customServers.length > 0 ? customServers : [{ name: 'Default FHD Tunnel', url }],
      epg: epgData
    });

    // Scroll smoothly to top player viewport
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Global Broadcast event triggered by admin console
  const handleAdminNotificationMsg = (msg: string) => {
    setAdminBroadcast(msg);
  };

  const currentSlider = sliders[activeSliderIdx] || null;
  const isRtl = lang === 'ar';

  return (
    <div 
      className={`min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-accent selection:text-brand-bg pb-20 md:pb-6 ${
        isRtl ? 'rtl' : 'ltr'
      }`}
      style={{
        direction: isRtl ? 'rtl' : 'ltr'
      }}
      id="stad-main-wrapper"
    >
      {/* 1. STICKY TOP BROADCAST MARQUEE BAR: Sleek carbon style with brand-accent text alert */}
      {adminBroadcast && (
        <div className="bg-brand-secondary/95 border-b border-white/[0.04] px-4 py-2 text-xs flex items-center justify-between z-50 sticky top-0 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <Bell size={13} className="text-brand-accent animate-bounce shrink-0" />
            <marquee className="font-bold text-brand-accent/90 whitespace-nowrap scroll-smooth">
              {adminBroadcast}
            </marquee>
          </div>
          <button 
            onClick={() => setAdminBroadcast(null)}
            className="text-[10px] text-brand-muted hover:text-white px-2 py-0.5 rounded bg-brand-bg hover:bg-brand-card shrink-0 ml-3 transition border border-white/5"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. MAIN LAYOUT CONTAINER */}
      <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row">
        {/* Sidebar Component */}
        <Sidebar 
          currentTab={currentTab} 
          setCurrentTab={(tab) => {
            if (tab === 'admin' && !isUserAdmin) {
              setShowAuthModal(true);
              return;
            }
            // Trigger interstitial on page shift
            showInterstitialAd();
            setCurrentTab(tab);
            setActivePlayer(null);
            setSelectedVod(null);
            setShowMobileSidebar(false);
          }}
          lang={lang}
          setLang={setLang}
          user={user}
          setUser={setUser}
          setShowAuthModal={setShowAuthModal}
          mobileOpen={showMobileSidebar}
          onCloseMobile={() => setShowMobileSidebar(false)}
        />

        {/* Dynamic Screen View Canvas */}
        <main className={`flex-1 min-h-screen overflow-x-hidden w-full max-w-full p-4 md:p-6 lg:p-8 ${isRtl ? 'md:mr-64 font-sans' : 'md:ml-64'}`}>
          
          {/* TOP BANNER WITH USER PROFILE/LANG TRIGGERS */}
          <header className="flex items-center justify-between gap-4 pb-6 border-b border-white/[0.04] mb-6">
            <div className="flex items-center gap-3">
              {/* Responsive Logo & Menu for Mobile UI */}
              <div className="flex items-center gap-2.5 md:hidden select-none">
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="p-1.5 rounded-lg bg-brand-card hover:bg-white/5 border border-white/5 text-gray-300 transition"
                  title="القائمة"
                >
                  <Menu size={16} />
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-accent to-blue-600 flex items-center justify-center font-black shadow-md shadow-brand-accent/20 text-sm">
                  S
                </div>
                <span className="text-lg font-black tracking-wider text-white italic">STAD TV</span>
              </div>
              <span className="hidden md:block text-xs font-mono text-brand-muted tracking-widest uppercase">
                ⚙️ {lang === 'ar' ? 'إشارة البث: آمنة ومثبتة قريباً من السيرفر' : 'STREAM PIPELINE SECURED'}
              </span>
            </div>

            {/* Theme / Mode Switcher & Bell Alert on the Right */}
            <div className="flex items-center gap-2.5 relative">
              {/* Notification Popover Container */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 rounded-2xl bg-brand-card hover:bg-white/5 border border-white/5 text-gray-300 hover:text-brand-accent transition duration-200 shadow-sm flex items-center justify-center cursor-pointer"
                  id="header-notification-bell-btn"
                  title="الإشعارات والتحديثات"
                >
                  <Bell size={15} className={notifications.some(n => !n.isRead) ? 'animate-bounce' : ''} />
                  {notifications.some(n => !n.isRead) && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-live text-[9px] font-black text-white shadow-md shadow-brand-live/30">
                      {notifications.filter(n => !n.isRead).length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div 
                    className="absolute top-12 left-0 md:left-auto md:right-0 z-[120] w-[320px] md:w-[360px] bg-brand-secondary border border-white/[0.08] rounded-[24px] p-4.5 shadow-[0_15px_40px_rgba(0,0,0,0.4)] space-y-3"
                    style={{ direction: 'rtl' }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.04]">
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5 leading-none">
                        <span>🔔 آخر التحديثات</span>
                      </h4>
                      <button 
                        onClick={() => {
                          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                        }}
                        className="text-[9.5px] font-black text-brand-muted hover:text-white transition cursor-pointer"
                      >
                        تعليم الكل كمقروء
                      </button>
                    </div>

                    {/* Notification List Scrollbox */}
                    <div className="space-y-1 max-h-[300px] overflow-y-auto scrollbar-none divide-y divide-white/[0.03]">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-[11px] text-zinc-500 italic font-bold">
                          لا توجد إشعارات جديدة حالياً
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className={`flex items-start gap-3 py-2.5 px-1 bg-transparent hover:bg-white/[0.02] active:bg-white/[0.04] rounded-xl cursor-pointer transition text-right relative ${
                              !notif.isRead ? 'border-r-2 border-brand-accent pr-1.5 bg-brand-accent/[0.01]' : ''
                            }`}
                          >
                            {/* Far Right: Thumbnail Image */}
                            <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-brand-bg shrink-0 border border-white/5 shadow-inner">
                              <img 
                                src={notif.image} 
                                alt="" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540747737956-378724044432?w=100';
                                }}
                              />
                              {/* Overlapping small visual indicator */}
                              <div className="absolute -bottom-1 -left-1 w-4.5 h-4.5 rounded-full bg-brand-secondary border border-white/5 flex items-center justify-center text-[8.5px] shadow-sm">
                                {notif.type === 'match' ? '⚽' : notif.type === 'media' ? '🎬' : '📡'}
                              </div>
                            </div>

                            {/* Middle Details */}
                            <div className="flex-1 min-w-0 pr-0.5 flex flex-col pt-0.5">
                              <span className="text-[11px] font-black text-white leading-tight truncate">{notif.title}</span>
                              <span className="text-[9.5px] text-brand-muted mt-0.5 font-semibold line-clamp-1 leading-normal">{notif.subtitleAr}</span>
                              
                              {/* Meta Indicators */}
                              <div className="flex items-center justify-between mt-1 pt-0.5">
                                <span className="text-[8.5px] text-zinc-500 font-bold font-mono">
                                  {formatTimeAr(notif.timestamp)}
                                </span>
                                <span className={`text-[8px] px-2 py-0.5 rounded-full font-black ${
                                  notif.type === 'match' ? 'text-amber-500 bg-amber-500/10 border border-amber-500/15' :
                                  notif.type === 'media' ? 'text-red-500 bg-red-400/10 border border-red-500/15' :
                                  'text-brand-accent bg-brand-accent/10 border border-brand-accent/15'
                                }`}>
                                  {notif.type === 'match' ? 'مباراة' : notif.type === 'media' ? 'ميديا' : 'قناة'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Bottom Actions centered */}
                    <div className="pt-2 text-center border-t border-white/[0.04]">
                      <button 
                        onClick={() => {
                          setNotifications([]);
                          handleAdminNotificationMsg(lang === 'ar' ? '🧹 تم مسح سجل الإشعارات بنجاح!' : 'Notifications history cleared!');
                        }}
                        className="text-[10px] font-black text-brand-live hover:opacity-80 transition cursor-pointer"
                      >
                        مسح كافة التحديثات والاشعارات
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-card hover:bg-white/5 border border-white/5 text-xs font-bold transition sm:hover:scale-105 active:scale-95 duration-200 cursor-pointer text-brand-text shadow-sm"
                title={theme === 'light' ? (lang === 'ar' ? 'الوضع الليلي' : 'Dark Mode') : (lang === 'ar' ? 'الوضع النهاري' : 'Light Mode')}
              >
                {theme === 'light' ? (
                  <>
                    <Moon size={14} className="text-indigo-500 fill-indigo-500/10" />
                    <span className="text-[11px] font-bold">{lang === 'ar' ? 'الوضع الليلي 🌙' : 'Night Mode 🌙'}</span>
                  </>
                ) : (
                  <>
                    <Sun size={14} className="text-amber-500 animate-spin-slow fill-amber-500/10" />
                    <span className="text-[11px] font-bold">{lang === 'ar' ? 'الوضع النهاري ☀️' : 'Day Mode ☀️'}</span>
                  </>
                )}
              </button>
            </div>
          </header>

          {/* 3. ACTIVE STREAM PLAYER VIEW (Shows docked player on top of screen if selected) */}
          {activePlayer && (
            <div className="space-y-4 mb-8">
              <div className="p-1.5 bg-brand-secondary border border-white/[0.04] rounded-[32px] overflow-hidden shadow-2xl relative">
                <VideoPlayer 
                  streamUrl={activePlayer.streamUrl}
                  title={activePlayer.title}
                  categoryName={activePlayer.category}
                  servers={activePlayer.servers}
                  epg={activePlayer.epg}
                  lang={lang}
                  adConfig={adConfig}
                  onBack={() => setActivePlayer(null)}
                />
              </div>
              {/* Start.io Video Player Banner Ad Placement */}
              {adConfig.active && (
                <div className="w-full flex justify-center" id="player-startio-banner">
                  <StartIoAd type="banner" appId="204252956" adSize="320x50" />
                </div>
              )}
            </div>
          )}

          {/* TAB 1: HOME PAGE */}
          {currentTab === 'home' && !selectedVod && (
            <div className="space-y-8" id="home-view">
              
              {/* HERO FEATURED SLIDER */}
              {currentSlider && (
                <div className="relative aspect-auto min-h-[310px] sm:min-h-[365px] md:min-h-0 md:aspect-[21/9] rounded-[32px] overflow-hidden border border-white/[0.04] shadow-2xl group">
                  <img 
                    src={currentSlider.image} 
                    alt="" 
                    onError={(e) => { 
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540747737956-378724044432?w=1200&auto=format&fit=crop&q=80'; 
                    }}
                    className="absolute inset-0 w-full h-full object-cover transition duration-1000 scale-100 group-hover:scale-[1.02] filter brightness-50"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/30 to-transparent flex flex-col justify-end p-4 sm:p-6 md:p-10 text-start">
                    <div className="space-y-2 sm:space-y-3 max-w-2xl animate-fade-in">
                      <span className="bg-brand-live text-white font-sans font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider animate-pulse glow-live inline-block">
                        ⭐ {t.featured}
                      </span>
                      <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-snug">
                        {lang === 'ar' ? currentSlider.titleAr : currentSlider.titleEn}
                      </h2>
                      <p className="text-[11px] sm:text-xs md:text-sm text-brand-muted leading-relaxed font-semibold line-clamp-3">
                        {lang === 'ar' ? currentSlider.subtitleAr : currentSlider.subtitleEn}
                      </p>

                      <div className="flex items-center gap-3 pt-2">
                        <button 
                          onClick={() => {
                            if (currentSlider.type === 'match') {
                              const matchObj = matches.find(m => m.id === currentSlider.targetId);
                              if (matchObj) {
                                triggerPlay({ titleAr: matchObj.team1.nameAr + ' vs ' + matchObj.team2.nameAr, titleEn: matchObj.team1.nameEn + ' vs ' + matchObj.team2.nameEn, streamUrl: matchObj.servers[0]?.url }, true, matchObj.servers);
                              }
                            } else if (currentSlider.type === 'channel') {
                              const chanObj = channels.find(c => c.id === currentSlider.targetId);
                              if (chanObj) {
                                triggerPlay({ titleAr: chanObj.nameAr, titleEn: chanObj.nameEn, streamUrl: chanObj.streamUrl }, true, [{ name: 'Server 1', url: chanObj.streamUrl }], chanObj.epg);
                              }
                            } else {
                              const vodObj = vods.find(v => v.id === currentSlider.targetId);
                              if (vodObj) {
                                setSelectedVod(vodObj);
                              }
                            }
                          }}
                          className="px-5 py-3 bg-brand-accent hover:opacity-90 text-brand-bg text-xs font-black rounded-2xl flex items-center gap-2 transition max-w-xs shadow-[0_4px_15px_rgba(0,194,255,0.3)] glow-accent"
                        >
                          <Play size={13} fill="currentColor" />
                          <span>{t.playNow}</span>
                        </button>
                        
                        {/* Slide Indicator circles */}
                        <div className="flex gap-1.5 ltr:ml-4 rtl:mr-4">
                          {sliders.map((_, idx) => (
                            <button 
                              key={idx}
                              onClick={() => setActiveSliderIdx(idx)}
                              className={`w-2.5 h-2.5 rounded-full transition-all ${activeSliderIdx === idx ? 'bg-brand-accent w-6' : 'bg-brand-card'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Start.io Smart Banner Ad Placement */}
              {adConfig.active && (
                <div className="w-full flex justify-center" id="home-startio-banner">
                  <StartIoAd type="banner" appId="204252956" adSize="320x50" />
                </div>
              )}

              {/* 1. مباشر الآن */}
              <div className="space-y-4" id="section-live-now">
                <div className="flex items-center justify-between pb-1 border-b border-white/[0.03]">
                  <h3 className="text-[13px] font-heading text-white flex items-center gap-2">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-live opacity-75 glow-live"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-live"></span>
                    </span>
                    <span className="text-white">مباشر الآن</span>
                  </h3>
                  <div className="text-[9px] text-brand-muted font-bold font-mono">LIVE OPTICAL NETWORK</div>
                </div>

                {/* Show currently live matches */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {matches.filter(m => m.status === 'live').length > 0 ? (
                    matches.filter(m => m.status === 'live').map((match) => {
                      const title = match.team1.nameAr + ' ضد ' + match.team2.nameAr;
                      return (
                        <div 
                          key={match.id}
                          onClick={() => triggerPlay({ titleAr: title, titleEn: match.team1.nameEn + ' vs ' + match.team2.nameEn, streamUrl: match.servers[0]?.url }, true, match.servers, match.epg)}
                          className="bg-brand-card/70 hover:bg-brand-card border border-brand-live/40 rounded-3xl p-5 cursor-pointer hover:border-brand-accent/30 transition-all duration-300 relative glow-live animate-none"
                        >
                          <div className="flex items-center justify-between text-[10px] text-brand-muted pb-2 border-b border-white/[0.04] mb-3 font-semibold">
                            <span className="text-brand-accent font-bold">⚽ {match.tournamentAr}</span>
                            <span className="bg-brand-live/15 text-brand-live text-[9px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-live animate-pulse" />
                              <span>{match.minute}' دقيقة</span>
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2.5">
                            <div className="flex flex-col items-center gap-1.5 w-1/3">
                              <img src={match.team1.logo} alt="" className="w-10 h-10 rounded-full object-cover border border-white/5 bg-brand-bg/90 shadow-inner" />
                              <span className="text-xs font-bold text-white truncate max-w-[90px]">{match.team1.nameAr}</span>
                            </div>
                            <div className="text-center w-1/3">
                              <span className="text-2xl font-black text-white font-mono">{match.team1Score} - {match.team2Score}</span>
                              <span className="text-[9px] text-zinc-500 font-bold uppercase block mt-1">بث رياضي فائق</span>
                            </div>
                            <div className="flex flex-col items-center gap-1.5 w-1/3">
                              <img src={match.team2.logo} alt="" className="w-10 h-10 rounded-full object-cover border border-white/5 bg-brand-bg/90 shadow-inner" />
                              <span className="text-xs font-bold text-white truncate max-w-[90px]">{match.team2.nameAr}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    /* Fallback: Live Premium IPTV Channels */
                    <div className="col-span-1 md:col-span-3 bg-brand-card/40 border border-white/[0.02] rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-zinc-300">لا توجد مباريات جارية حالياً للبث في هذه اللحظة.</p>
                        <p className="text-[11px] text-brand-muted mt-1">تصفّح القنوات الرياضية المباشرة 24/7 لمتابعة التحليلات والبرامج الجارية.</p>
                      </div>
                      <button 
                        onClick={() => setCurrentTab('channels')}
                        className="px-4 py-2 bg-brand-accent/10 hover:bg-brand-accent/20 border border-brand-accent/25 text-brand-accent hover:text-white rounded-xl text-xs font-bold transition shrink-0"
                      >
                        فتح دليل القنوات المباشرة 📡
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. مباريات اليوم */}
              <div className="space-y-4" id="section-today-matches">
                <div className="flex items-center justify-between pb-1 border-b border-white/[0.03]">
                  <h3 className="text-[13px] font-heading text-white flex items-center gap-1.5">
                    <Clock size={13} className="text-brand-accent animate-pulse" />
                    <span>مباريات اليوم</span>
                  </h3>
                  <button 
                    onClick={() => setCurrentTab('matches')} 
                    className="text-[10px] text-brand-accent hover:underline font-bold"
                  >
                    عرض الجدول الكامل 🡡
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matches.slice(0, 4).map((match) => {
                    const isUpcoming = match.status === 'upcoming';
                    const isFinished = match.status === 'finished';
                    const isLive = match.status === 'live';
                    return (
                      <div 
                        key={match.id}
                        onClick={() => {
                          if (isLive || isFinished) {
                            triggerPlay({ titleAr: match.team1.nameAr + ' ضد ' + match.team2.nameAr, titleEn: match.team1.nameEn + ' vs ' + match.team2.nameEn, streamUrl: match.servers[0]?.url }, isLive, match.servers, match.epg)
                          } else {
                            setCurrentTab('matches');
                          }
                        }}
                        className="bg-brand-card/55 hover:bg-brand-card border border-white/[0.03] hover:border-brand-accent/15 rounded-3xl p-4.5 flex items-center justify-between transition-all duration-300 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 flex-1 overflow-hidden">
                          <div className="flex items-center -space-x-2 rtl:space-x-reverse shrink-0">
                            <img src={match.team1.logo} alt="" className="w-8.5 h-8.5 rounded-full border-2 border-brand-card object-cover bg-brand-bg shadow" />
                            <img src={match.team2.logo} alt="" className="w-8.5 h-8.5 rounded-full border-2 border-brand-card object-cover bg-brand-bg shadow" />
                          </div>
                          <div className="truncate flex-1">
                            <h4 className="text-[11px] font-bold text-white truncate leading-tight">
                              {match.team1.nameAr} <span className="text-brand-accent/80 font-normal">ضد</span> {match.team2.nameAr}
                            </h4>
                            <span className="text-[9.5px] text-brand-muted mt-1 block font-semibold truncate">🏆 {match.tournamentAr}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {isUpcoming && (
                            <span className="text-xs font-black text-brand-accent font-mono bg-brand-accent/10 px-2.5 py-1 rounded-xl border border-brand-accent/15">
                              {match.time}
                            </span>
                          )}
                          {isFinished && (
                            <span className="text-xs font-black text-white/50 font-mono bg-white/5 px-2.5 py-1 rounded-xl">
                              {match.team1Score} - {match.team2Score}
                            </span>
                          )}
                          {isLive && (
                            <span className="text-xs font-black text-brand-live font-mono bg-brand-live/15 px-2.5 py-1 rounded-xl border border-brand-live/20 animate-pulse">
                              {match.team1Score} - {match.team2Score}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. القنوات الرياضية */}
              <div className="space-y-4" id="section-sports-channels">
                <div className="flex items-center justify-between pb-1 border-b border-white/[0.03]">
                  <h3 className="text-[13px] font-heading text-white flex items-center gap-1.5">
                    <span className="text-brand-accent">⚽</span>
                    <span>القنوات الرياضية</span>
                  </h3>
                  <button onClick={() => { setCurrentTab('channels'); setActiveChannelCat('sports'); }} className="text-[10px] text-brand-accent hover:underline font-bold">
                    عرض الكل 🡡
                  </button>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
                  {channels.filter(c => c.category === 'sports').slice(0, 5).map((chan) => (
                    <div 
                      key={chan.id}
                      onClick={() => triggerPlay({ titleAr: chan.nameAr, titleEn: chan.nameEn, streamUrl: chan.streamUrl }, true, [{ name: 'خادم رئيسي سريع', url: chan.streamUrl }, { name: 'خادم احتياطي HD', url: chan.backupUrl || chan.streamUrl }], chan.epg)}
                      className="group bg-[#111625]/90 border border-white/[0.05] hover:border-brand-accent/40 rounded-[28px] p-3 pb-5 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_12px_30px_rgba(0,194,255,0.15)] relative h-full"
                    >
                      <div className="relative aspect-square w-full rounded-2xl md:rounded-[22px] overflow-hidden bg-gradient-to-br from-[#161f33] to-[#0d1424] shadow-inner border border-white/[0.04]">
                        {chan.logo?.startsWith('http') || chan.logo?.startsWith('/') ? (
                          <img 
                            src={chan.logo} 
                            alt="" 
                            referrerPolicy="no-referrer" 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none" 
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 relative bg-[#1c273e]/40">
                            <div className="absolute w-20 h-20 rounded-full bg-brand-accent/5 blur-xl pointer-events-none" />
                            <span className="text-4xl filter drop-shadow-[0_4px_10px_rgba(0,194,255,0.25)] transition-transform duration-300 group-hover:scale-110 z-10">{chan.logo}</span>
                            <span className="text-[9px] text-brand-muted font-bold tracking-widest mt-2 z-10 uppercase font-mono">STAD TV</span>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

                        {/* Favorite button */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(chan.id); }}
                          className="absolute top-2.5 right-2.5 text-white/70 hover:text-brand-live bg-[#090d16]/75 hover:bg-[#090d16]/95 hover:scale-115 p-2 rounded-xl border border-white/5 shadow-md active:scale-95 transition duration-300 z-10"
                        >
                          <Heart size={12} fill={favorites.includes(chan.id) ? '#ff3b30' : 'none'} className={favorites.includes(chan.id) ? 'text-brand-live' : ''} />
                        </button>
                      </div>

                      <div className="mt-3.5 space-y-1">
                        <h4 className="text-sm font-black text-white text-center tracking-wide leading-tight truncate w-full px-1">
                          {chan.nameAr}
                        </h4>
                        <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-brand-accent/90 text-center uppercase block truncate w-full px-1">
                          {chan.nameEn}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. القنوات الترفيهية */}
              <div className="space-y-4" id="section-entertainment-channels">
                <div className="flex items-center justify-between pb-1 border-b border-white/[0.03]">
                  <h3 className="text-[13px] font-heading text-white flex items-center gap-1.5">
                    <span className="text-brand-accent">✨</span>
                    <span>القنوات الترفيهية</span>
                  </h3>
                  <button onClick={() => { setCurrentTab('channels'); setActiveChannelCat('entertainment'); }} className="text-[10px] text-brand-accent hover:underline font-bold">
                    عرض الكل 🡡
                  </button>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
                  {channels.filter(c => c.category === 'entertainment').slice(0, 5).map((chan) => (
                    <div 
                      key={chan.id}
                      onClick={() => triggerPlay({ titleAr: chan.nameAr, titleEn: chan.nameEn, streamUrl: chan.streamUrl }, true, [{ name: 'البث الرئيسي FHD', url: chan.streamUrl }], chan.epg)}
                      className="group bg-[#111625]/90 border border-white/[0.05] hover:border-brand-accent/40 rounded-[28px] p-3 pb-5 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_12px_30px_rgba(0,194,255,0.15)] relative h-full"
                    >
                      <div className="relative aspect-square w-full rounded-2xl md:rounded-[22px] overflow-hidden bg-gradient-to-br from-[#161f33] to-[#0d1424] shadow-inner border border-white/[0.04]">
                        {chan.logo?.startsWith('http') || chan.logo?.startsWith('/') ? (
                          <img 
                            src={chan.logo} 
                            alt="" 
                            referrerPolicy="no-referrer" 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none" 
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 relative bg-[#1c273e]/40">
                            <div className="absolute w-20 h-20 rounded-full bg-brand-accent/5 blur-xl pointer-events-none" />
                            <span className="text-4xl filter drop-shadow-[0_4px_10px_rgba(0,194,255,0.25)] transition-transform duration-300 group-hover:scale-110 z-10">{chan.logo}</span>
                            <span className="text-[9px] text-brand-muted font-bold tracking-widest mt-2 z-10 uppercase font-mono">STAD TV</span>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

                        {/* Favorite button */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(chan.id); }}
                          className="absolute top-2.5 right-2.5 text-white/70 hover:text-brand-live bg-[#090d16]/75 hover:bg-[#090d16]/95 hover:scale-115 p-2 rounded-xl border border-white/5 shadow-md active:scale-95 transition duration-300 z-10"
                        >
                          <Heart size={12} fill={favorites.includes(chan.id) ? '#ff3b30' : 'none'} className={favorites.includes(chan.id) ? 'text-brand-live' : ''} />
                        </button>
                      </div>

                      <div className="mt-3.5 space-y-1">
                        <h4 className="text-sm font-black text-white text-center tracking-wide leading-tight truncate w-full px-1">
                          {chan.nameAr}
                        </h4>
                        <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-brand-accent/90 text-center uppercase block truncate w-full px-1">
                          {chan.nameEn}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. الأفلام */}
              <div className="space-y-4" id="section-movies">
                <div className="flex items-center justify-between pb-1 border-b border-white/[0.03]">
                  <h3 className="text-[13px] font-heading text-white flex items-center gap-1.5">
                    <span className="text-brand-accent">🎬</span>
                    <span>الأفلام السينمائية</span>
                  </h3>
                  <button onClick={() => { setCurrentTab('movies'); setActiveCinemaCat('movie'); }} className="text-[10px] text-brand-accent hover:underline font-bold">
                    عرض جميع الأفلام 🡡
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {vods.filter(v => v.type === 'movie').slice(0, 4).map((vod) => (
                    <div 
                      key={vod.id}
                      onClick={() => setSelectedVod(vod)}
                      className="bg-brand-card/45 hover:bg-brand-card border border-white/[0.03] rounded-3xl p-3.5 flex flex-col justify-between cursor-pointer hover:border-brand-accent/25 hover:shadow-2xl transition duration-300 group animate-none"
                    >
                      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3.5 bg-brand-bg">
                        <img 
                          src={vod.poster} 
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540747737956-378724044432?w=500&auto=format&fit=crop&q=80'; }}
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute top-2.5 right-2 bg-black/85 border border-white/10 px-2.5 py-0.5 rounded text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                          ★ {vod.rating}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-accent font-bold uppercase tracking-widest font-mono block">
                          فيلم • {vod.year} • {vod.duration}
                        </span>
                        <h4 className="text-xs font-heading text-white leading-snug truncate mt-1">
                          {vod.titleAr}
                        </h4>
                        <p className="text-[10px] text-brand-muted mt-1 truncate">
                          {vod.descriptionAr}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. المسلسلات */}
              <div className="space-y-4" id="section-series">
                <div className="flex items-center justify-between pb-1 border-b border-white/[0.03]">
                  <h3 className="text-[13px] font-heading text-white flex items-center gap-1.5">
                    <span className="text-brand-accent">📺</span>
                    <span>المسلسلات الحصرية</span>
                  </h3>
                  <button onClick={() => { setCurrentTab('movies'); setActiveCinemaCat('series'); }} className="text-[10px] text-brand-accent hover:underline font-bold">
                    عرض جميع المسلسلات 🡡
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {vods.filter(v => v.type === 'series').slice(0, 4).map((vod) => (
                    <div 
                      key={vod.id}
                      onClick={() => setSelectedVod(vod)}
                      className="bg-brand-card/45 hover:bg-brand-card border border-white/[0.03] rounded-3xl p-3.5 flex flex-col justify-between cursor-pointer hover:border-brand-accent/25 hover:shadow-2xl transition duration-300 group animate-none"
                    >
                      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3.5 bg-brand-bg">
                        <img 
                          src={vod.poster} 
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540747737956-378724044432?w=500&auto=format&fit=crop&q=80'; }}
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute top-2.5 right-2 bg-black/85 border border-white/10 px-2.5 py-0.5 rounded text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                          ★ {vod.rating}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-accent font-bold uppercase tracking-widest font-mono block">
                          مسلسل • {vod.year} • {vod.seasons?.length} مواسم
                        </span>
                        <h4 className="text-xs font-heading text-white leading-snug truncate mt-1">
                          {vod.titleAr}
                        </h4>
                        <p className="text-[10px] text-brand-muted mt-1 truncate">
                          {vod.descriptionAr}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MATCH CENTER */}
          {currentTab === 'matches' && (
            <MatchCenter 
              matches={matches} 
              lang={lang} 
              onSelectMatch={(match) => triggerPlay({ titleAr: match.team1.nameAr + ' vs ' + match.team2.nameAr, titleEn: match.team1.nameEn + ' vs ' + match.team2.nameEn, streamUrl: match.servers[0]?.url }, match.status === 'live', match.servers)}
              isVipUser={user.isVip}
            />
          )}

          {/* TAB 3: LIVE TV CHANNELS (GROUPED CATEGORIES) */}
          {currentTab === 'channels' && (
            <div className="space-y-6" id="channels-view">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/[0.04] gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white">📡 {t.channels}</h2>
                  <p className="text-xs text-brand-muted font-semibold mt-1">
                    {lang === 'ar' ? 'بث قنوات روتانا، الـ MBC، الجزيرة، والـ bein بجودات ممتازة' : 'Seamless OTT channels streaming globally with redundant sources'}
                  </p>
                </div>

                {/* Categories */}
                <div className="flex items-center gap-1 bg-brand-secondary border border-white/[0.04] p-1 rounded-2xl overflow-x-auto scrollbar-none self-start md:self-auto max-w-full flex-nowrap">
                  <button
                    onClick={() => setActiveChannelCat('all')}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 transition ${
                      activeChannelCat === 'all' ? 'bg-brand-accent text-brand-bg font-black shadow' : 'text-brand-muted hover:text-white'
                    }`}
                  >
                    📂 {lang === 'ar' ? 'الكل' : 'All'}
                  </button>

                  {channelCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveChannelCat(cat.id)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 transition ${
                        activeChannelCat === cat.id ? 'bg-brand-accent text-brand-bg font-black shadow' : 'text-brand-muted hover:text-white'
                      }`}
                    >
                      {cat.icon || '📁'} {lang === 'ar' ? cat.nameAr : cat.nameEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-5">
                {channels
                  .filter(c => activeChannelCat === 'all' || c.category === activeChannelCat)
                  .map((chan) => (
                    <div 
                      key={chan.id}
                      onClick={() => triggerPlay({ titleAr: chan.nameAr, titleEn: chan.nameEn, streamUrl: chan.streamUrl }, true, [{ name: 'البث الرئيسي FHD', url: chan.streamUrl }, { name: 'المصدر الاحتياطي HD', url: chan.backupUrl || chan.streamUrl }], chan.epg)}
                      className="group bg-[#111625]/90 border border-white/[0.05] hover:border-brand-accent/40 rounded-[28px] p-2.5 pb-4 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_12px_30px_rgba(0,194,255,0.15)] relative h-full"
                    >
                      <div className="relative aspect-square w-full rounded-2xl md:rounded-[22px] overflow-hidden bg-gradient-to-br from-[#161f33] to-[#0d1424] shadow-inner border border-white/[0.04]">
                        {chan.logo?.startsWith('http') || chan.logo?.startsWith('/') ? (
                          <img 
                            src={chan.logo} 
                            alt="" 
                            referrerPolicy="no-referrer" 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none" 
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 relative bg-[#1c273e]/40">
                            <div className="absolute w-20 h-20 rounded-full bg-brand-accent/5 blur-xl pointer-events-none" />
                            <span className="text-4xl filter drop-shadow-[0_4px_10px_rgba(0,194,255,0.25)] transition-transform duration-300 group-hover:scale-110 z-10">{chan.logo}</span>
                            <span className="text-[9px] text-brand-muted font-bold tracking-widest mt-2 z-10 uppercase">STAD NETWORK</span>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

                        {/* Favorite Heart Button Overlaid inside poster wrapper */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(chan.id); }}
                          className="absolute top-2 right-2 text-white/70 hover:text-brand-live bg-[#090d16]/75 hover:bg-[#090d16]/95 hover:scale-115 p-1.5 rounded-lg border border-white/5 shadow-md active:scale-95 transition duration-300 z-10"
                        >
                          <Heart size={11} fill={favorites.includes(chan.id) ? '#ff3b30' : 'none'} className={favorites.includes(chan.id) ? 'text-brand-live' : ''} />
                        </button>
                      </div>

                      <div className="mt-2.5">
                        <h4 className="text-[12px] sm:text-[14px] md:text-base font-black text-white text-center leading-snug w-full px-0.5 select-none">
                          {lang === 'ar' ? chan.nameAr : chan.nameEn}
                        </h4>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 4: MOVIES & SERIES */}
          {currentTab === 'movies' && !selectedVod && (
            <div className="space-y-6" id="vods-view">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/[0.04] gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white">🎬 {t.moviesTitle} ({vods.length})</h2>
                  <p className="text-xs mt-1 font-semibold text-brand-muted">
                    {lang === 'ar' ? 'تشكيلة وثائقية حصرية ومحتوى فيني مميز ملائم للاستخدام' : 'Extensive on-demand high-definition catalogs indexed natively'}
                  </p>
                </div>

                {/* VOD Categories switcher */}
                <div className="flex items-center gap-1.5 bg-brand-secondary border border-white/[0.04] p-1 rounded-2xl">
                  {([
                    { id: 'all', label: lang === 'ar' ? 'الكل' : 'All Cinema' },
                    { id: 'movie', label: lang === 'ar' ? 'أفلام سينما' : 'Films' },
                    { id: 'series', label: lang === 'ar' ? 'مسلسلات تلفزيونية' : 'TV Shows' }
                  ] as const).map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveCinemaCat(item.id)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl transition ${
                        activeCinemaCat === item.id ? 'bg-brand-accent text-brand-bg font-black shadow' : 'text-brand-muted hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Movie Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
                {vods
                  .filter(v => activeCinemaCat === 'all' || v.type === activeCinemaCat)
                  .map((vod) => (
                    <div 
                      key={vod.id}
                      onClick={() => setSelectedVod(vod)}
                      className="bg-brand-card/45 hover:bg-brand-card border border-white/[0.03] rounded-3xl p-3.5 flex flex-col justify-between cursor-pointer hover:border-brand-accent/20 transition duration-300 group"
                    >
                      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3 bg-brand-bg">
                        <img 
                          src={vod.poster} 
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540747737956-378724044432?w=500&auto=format&fit=crop&q=80'; }}
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                        />
                        <div className="absolute top-2.5 right-2 bg-black/85 border border-white/5 px-2 py-0.5 rounded text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                          ★ {vod.rating}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-accent font-bold uppercase tracking-widest font-mono block">
                          {vod.type} • {vod.year}
                        </span>
                        <h4 className="text-xs font-black text-white leading-tight truncate mt-1">
                          {lang === 'ar' ? vod.titleAr : vod.titleEn}
                        </h4>
                        <p className="text-[10px] text-brand-muted mt-1 truncate">
                          {lang === 'ar' ? vod.descriptionAr : vod.descriptionEn}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* SELECTED VOD DETAIL VIEW COMPONENT */}
          {selectedVod && (
            <div className="bg-brand-secondary rounded-[32px] overflow-hidden border border-white/[0.04] p-5 md:p-8 space-y-6" id="vod-detail-view">
              {/* Back Button */}
              <button 
                onClick={() => setSelectedVod(null)}
                className="px-4 py-2 rounded-xl bg-brand-card border border-white/[0.03] text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/5 transition flex items-center gap-1.5"
              >
                🡐 {lang === 'ar' ? 'الرجوع للسينما' : 'Back to Listings'}
              </button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pt-2">
                {/* Poster */}
                <div className="col-span-1 rounded-2xl overflow-hidden border border-white/[0.04] aspect-[3/4] bg-brand-bg">
                  <img 
                    src={selectedVod.poster} 
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540747737956-378724044432?w=500&auto=format&fit=crop&q=80'; }}
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                </div>

                {/* Info Deck */}
                <div className="col-span-1 md:col-span-2 space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs bg-brand-accent/10 text-brand-accent font-bold px-3 py-1 rounded-full border border-brand-accent/20 inline-block uppercase tracking-wider font-mono">
                      {selectedVod.type}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black text-white mt-2 leading-snug">
                      {lang === 'ar' ? selectedVod.titleAr : selectedVod.titleEn}
                    </h2>
                    <p className="text-xs text-brand-accent font-bold font-mono tracking-wider mt-1.5">
                      ⚽ {lang === 'ar' ? selectedVod.categoryAr : selectedVod.categoryEn}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono font-bold text-brand-muted">
                    <span className="flex items-center gap-1 text-amber-400">★ {selectedVod.rating} / 5</span>
                    <span>•</span>
                    <span>{selectedVod.year}</span>
                    {selectedVod.duration && (
                      <>
                        <span>•</span>
                        <span>{selectedVod.duration}</span>
                      </>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-brand-muted uppercase tracking-widest font-mono">{t.description}</h4>
                    <p className="text-xs font-semibold text-zinc-300 leading-relaxed max-w-xl">
                      {lang === 'ar' ? selectedVod.descriptionAr : selectedVod.descriptionEn}
                    </p>
                  </div>

                  {/* Actions */}
                  {selectedVod.type === 'movie' && (
                    <div className="pt-2">
                      <button 
                        onClick={() => {
                          triggerPlay(selectedVod);
                          setSelectedVod(null);
                        }}
                        className="px-8 py-3.5 bg-brand-accent text-brand-bg hover:opacity-90 transition duration-200 font-black text-xs rounded-2xl flex items-center gap-2 shadow-[0_4px_15px_rgba(0,194,255,0.3)] glow-accent"
                      >
                        <Play size={13} fill="currentColor" />
                        <span>{t.playNow} ({selectedVod.duration})</span>
                      </button>
                    </div>
                  )}

                  {/* TV Series Season details */}
                  {selectedVod.type === 'series' && selectedVod.seasons && (
                    <div className="space-y-4 pt-3 border-t border-white/[0.04]">
                      <h4 className="text-xs font-black text-brand-muted uppercase tracking-widest font-mono">
                        📺 {t.seasonsLabel} ({selectedVod.seasons.length})
                      </h4>

                      <div className="space-y-2">
                        {selectedVod.seasons[0]?.episodes.map(ep => (
                          <div 
                            key={ep.id}
                            onClick={() => {
                              triggerPlay({
                                titleAr: `${selectedVod.titleAr} - ${ep.titleAr}`,
                                titleEn: `${selectedVod.titleEn} - ${ep.titleEn}`,
                                streamUrl: ep.streamUrl,
                                categoryAr: selectedVod.categoryAr,
                                categoryEn: selectedVod.categoryEn
                              });
                              setSelectedVod(null);
                            }}
                            className="bg-brand-card hover:bg-brand-card/85 p-4 border border-white/[0.03] rounded-2xl flex items-center justify-between cursor-pointer transition select-none hover:border-brand-accent/20"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-brand-bg border border-white/5 flex items-center justify-center text-xs font-bold text-brand-accent font-mono">
                                {ep.episodeNumber}
                              </span>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-white leading-snug">
                                  {lang === 'ar' ? ep.titleAr : ep.titleEn}
                                </span>
                                <span className="text-[9px] text-brand-muted font-mono mt-0.5">{ep.duration}</span>
                              </div>
                            </div>
                            <div className="py-1.5 px-3 rounded-xl bg-brand-bg text-brand-accent font-bold text-[10px] uppercase font-mono border border-brand-accent/20">
                              {t.playNow}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DYNAMIC TARGET ARCHIVE SEARCH */}
          {currentTab === 'search' && (
            <div className="space-y-6" id="search-view">
              <div className="pb-4 border-b border-white/[0.04]">
                <h2 className="text-xl md:text-2xl font-black text-white">🔍 {t.searchTitle}</h2>
                <p className="text-xs text-brand-muted font-semibold mt-1">
                  {lang === 'ar' ? 'البحث عن البث المباشر، المباريات، وأفلام السينما' : 'Search live streams, matches, and movie catalogs'}
                </p>
              </div>

              {/* Input box */}
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full text-xs font-semibold bg-brand-card border border-white/[0.03] focus:border-brand-accent text-white pl-11 pr-4 py-3.5 rounded-2xl outline-none transition"
                />
              </div>

              {/* Dynamic Matches results */}
              {searchQuery && (
                <div className="space-y-6">
                  {/* Matching Channels */}
                  {channels.filter(c => 
                    c.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    c.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-brand-muted uppercase tracking-widest font-mono">📺 القنوات الفضائية المطابقة للبحث</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {channels
                          .filter(c => c.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) || c.nameEn.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(chan => (
                            <div 
                              key={chan.id}
                              onClick={() => triggerPlay({ titleAr: chan.nameAr, titleEn: chan.nameEn, streamUrl: chan.streamUrl }, true, [{ name: 'البث الرئيسي FHD', url: chan.streamUrl }], chan.epg)}
                              className="bg-brand-card/45 hover:bg-brand-card border border-white/[0.03] p-3.5 rounded-2xl text-center cursor-pointer hover:border-brand-accent/20 transition-all duration-300"
                            >
                              <div className="w-10 h-10 rounded-full bg-brand-bg/85 border border-white/5 flex items-center justify-center text-2xl mx-auto mb-1.5 overflow-hidden">
                                {chan.logo?.startsWith('http') || chan.logo?.startsWith('/') ? (
                                  <img src={chan.logo} alt="" referrerPolicy="no-referrer" className="w-full h-full object-contain p-1.5" />
                                ) : (
                                  chan.logo
                                )}
                              </div>
                              <span className="text-xs font-bold text-white block truncate leading-tight">{lang === 'ar' ? chan.nameAr : chan.nameEn}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Vods */}
                  {vods.filter(v => 
                    v.titleAr.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    v.titleEn.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-brand-muted uppercase tracking-widest font-mono">🎬 Matching Cinema VODs</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {vods
                          .filter(v => v.titleAr.toLowerCase().includes(searchQuery.toLowerCase()) || v.titleEn.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(vod => (
                            <div 
                              key={vod.id}
                              onClick={() => setSelectedVod(vod)}
                              className="bg-brand-card/45 hover:bg-brand-card border border-white/[0.03] p-3 rounded-2xl cursor-pointer hover:border-brand-accent/20 transition-all duration-300 flex items-center gap-3"
                            >
                              <img src={vod.poster} alt="" className="w-9 h-12 object-cover rounded bg-black" />
                              <div className="truncate">
                                <span className="text-[9px] text-brand-accent block uppercase font-mono font-bold">{vod.type}</span>
                                <h4 className="text-xs font-bold text-white leading-tight truncate">{lang === 'ar' ? vod.titleAr : vod.titleEn}</h4>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {channels.filter(c => c.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) || c.nameEn.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 &&
                   vods.filter(v => v.titleAr.toLowerCase().includes(searchQuery.toLowerCase()) || v.titleEn.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <div className="bg-brand-secondary p-8 rounded-3xl border border-white/[0.04] text-center text-brand-muted italic font-medium">
                      {t.noResults} "{searchQuery}"
                    </div>
                  )}
                </div>
              )}

              {/* Pre-fill query tags */}
              {!searchQuery && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-brand-muted uppercase tracking-widest font-mono">
                    {lang === 'ar' ? '🔥 عمليات البحث الشائعة' : '🔥 Trending Searches'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['Premium 1', 'real madrid', 'صلاح', 'نهائي لوسيل', 'الهلال', 'documentary'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className="px-3.5 py-1.5 text-xs font-bold bg-brand-card hover:bg-brand-bg hover:text-white rounded-xl text-brand-muted border border-white/[0.04] transition"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SAVED FAVORITES */}
          {currentTab === 'favorites' && (
            <div className="space-y-6" id="favorites-view">
              <div className="pb-4 border-b border-white/[0.04]">
                <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                  <Heart className="text-brand-live fill-brand-live" size={22} />
                  <span>{t.favorites}</span>
                </h2>
                <p className="text-xs text-brand-muted font-semibold mt-1">قنواتك التلفزيونية وموادك المفضلة المحفوظة محلياً في ذاكرة التصفح الفوري</p>
              </div>

              {favorites.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {/* Channels block */}
                  {channels
                    .filter(c => favorites.includes(c.id))
                    .map((chan) => (
                      <div 
                        key={chan.id}
                        onClick={() => triggerPlay({ titleAr: chan.nameAr, titleEn: chan.nameEn, streamUrl: chan.streamUrl }, true, [{ name: 'البث الرئيسي FHD', url: chan.streamUrl }], chan.epg)}
                        className="bg-brand-card/45 hover:bg-brand-card border border-white/[0.04] rounded-3xl p-4 text-center cursor-pointer hover:border-brand-accent/20 transition-all duration-300 relative flex flex-col justify-between h-[155px]"
                      >
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(chan.id); }}
                          className="absolute top-2.5 right-2 text-brand-live bg-brand-bg p-1.5 rounded-lg border border-white/5"
                        >
                          <Heart size={12} fill="#ff3b30" />
                        </button>
                        <div className="w-12 h-12 rounded-full bg-brand-bg flex items-center justify-center text-3xl mx-auto mb-2 border border-white/5 overflow-hidden">
                          {chan.logo?.startsWith('http') || chan.logo?.startsWith('/') ? (
                            <img src={chan.logo} alt="" referrerPolicy="no-referrer" className="w-full h-full object-contain p-2" />
                          ) : (
                            chan.logo
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-white truncate max-w-[130px] mx-auto leading-tight">{lang === 'ar' ? chan.nameAr : chan.nameEn}</h4>
                        <span className="text-[9px] text-brand-muted font-mono tracking-wider block mt-1 uppercase">بث مباشر حي</span>
                      </div>
                    ))}

                  {/* Movies block */}
                  {vods
                    .filter(v => favorites.includes(v.id))
                    .map((vod) => (
                      <div 
                        key={vod.id}
                        onClick={() => setSelectedVod(vod)}
                        className="bg-brand-card/45 hover:bg-brand-card border border-white/[0.04] rounded-3xl p-3 flex flex-col justify-between cursor-pointer hover:border-brand-accent/20 transition duration-300 h-[155px]"
                      >
                        <div className="flex gap-2 text-left">
                          <img src={vod.poster} alt="" className="w-10 h-14 object-cover rounded-xl bg-black shrink-0" />
                          <div className="truncate flex-1">
                            <span className="text-[9px] text-brand-accent font-mono font-bold uppercase">{vod.type}</span>
                            <h4 className="text-xs font-bold text-white leading-tight truncate mt-0.5">{lang === 'ar' ? vod.titleAr : vod.titleEn}</h4>
                            <p className="text-[10px] text-amber-500 font-mono mt-1">★ {vod.rating}</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(vod.id); }}
                          className="w-full py-1.5 bg-brand-bg hover:bg-brand-card border border-white/5 text-brand-live hover:text-white rounded-xl text-[10px] font-bold text-center transition"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="bg-brand-secondary rounded-3xl p-12 text-center border border-white/[0.04] text-brand-muted italic font-medium">
                  Bookmark live events and matches to display them dynamically in this locker.
                </div>
              )}
            </div>
          )}

          {/* TAB 7: ADMIN DASHBOARD PANEL */}
          {currentTab === 'admin' && isUserAdmin && (
            <AdminPanel 
              matches={matches} 
              channels={channels}
              moviesAndSeries={vods}
              lang={lang}
              categories={channelCategories}
              vodCategories={vodCategories}
              onUpdateMatches={setMatches}
              onUpdateChannels={setChannels}
              onUpdateVods={setVods}
              onNotify={handleAdminNotificationMsg}
              onAddNotification={(notif) => {
                const newNotifItem = {
                  id: 'notif_' + Date.now(),
                  title: notif.title,
                  subtitleAr: notif.subtitleAr,
                  timestamp: Date.now(),
                  type: notif.type,
                  image: notif.image,
                  targetId: notif.targetId,
                  isRead: false
                };
                setNotifications(prev => [newNotifItem, ...prev]);
              }}
              onUpdateCategories={setChannelCategories}
              onUpdateVodCategories={setVodCategories}
              adConfig={adConfig}
              onUpdateAdConfig={setAdConfig}
              onPlayStream={triggerPlay}
            />
          )}

          {/* Rights Footer / حقوق النشر */}
          <footer className="mt-14 pt-6 border-t border-white/[0.03] text-center space-y-1 pb-4">
            <p className="text-xs text-brand-muted font-bold font-sans">
              مفيد الزري &copy; 2026
            </p>
            <p className="text-[11px] text-zinc-500 font-bold tracking-wide">
              {lang === 'ar' ? 'جميع الحقوق محفوظة. تم التطوير بواسطة مفيد الزري' : 'All Rights Reserved. Developed by Mufeed Al-Zari'}
            </p>
          </footer>

        </main>
      </div>

      {/* 4. MODALS AND MOBILE BOTTOM BAR */}
      {showAuthModal && (
        <AuthModal 
          user={user} 
          setUser={setUser} 
          lang={lang} 
          onClose={() => setShowAuthModal(false)} 
        />
      )}

      {/* Persistent Bottom Bar for Mobile Viewports */}
      <BottomNavBar 
        currentTab={currentTab} 
        setCurrentTab={(tab) => {
          // Trigger interstitial on page shift
          showInterstitialAd();
          setCurrentTab(tab);
          setActivePlayer(null);
          setSelectedVod(null);
        }}
        lang={lang}
        user={user}
      />
    </div>
  );
}
