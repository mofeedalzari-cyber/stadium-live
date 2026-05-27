import React, { useState } from 'react';
import { Match, Channel, VideoContent, Language, AdConfig, Season, Episode } from '../types';
import { translations } from '../mockData';
import { 
  Settings2, Flame, Tv, Clapperboard, Monitor, Plus, Trash2, Edit2, 
  Activity, Radio, LogIn, ChevronRight, Send, HelpCircle, CheckCircle, Info, Globe, DollarSign,
  Play, Sparkles, RotateCcw, X, CheckSquare, Square, Copy, Download
} from 'lucide-react';

interface AdminPanelProps {
  matches: Match[];
  channels: Channel[];
  moviesAndSeries: VideoContent[];
  lang: Language;
  categories: { id: string; nameAr: string; nameEn: string; icon?: string; parentId?: string | null }[];
  vodCategories: { id: string; nameAr: string; nameEn: string; icon?: string; parentId?: string | null }[];
  onUpdateMatches: (newMatches: Match[]) => void;
  onUpdateChannels: (newChannels: Channel[]) => void;
  onUpdateVods: (newVods: VideoContent[]) => void;
  onNotify: (message: string) => void;
  onAddNotification?: (notif: { title: string; type: 'match' | 'media' | 'channel'; image: string; subtitleAr: string; targetId?: string }) => void;
  onUpdateCategories: (newCats: { id: string; nameAr: string; nameEn: string; icon?: string; parentId?: string | null }[]) => void;
  onUpdateVodCategories: (newCats: { id: string; nameAr: string; nameEn: string; icon?: string; parentId?: string | null }[]) => void;
  adConfig: AdConfig;
  onUpdateAdConfig: (newAds: AdConfig) => void;
  onPlayStream?: (item: { titleAr: string; titleEn: string; streamUrl?: string; categoryAr?: string; categoryEn?: string; seasons?: any[] }, isLive: boolean, customServers?: { name: string; url: string }[]) => void;
}

export default function AdminPanel({
  matches,
  channels,
  moviesAndSeries,
  lang,
  categories,
  vodCategories,
  onUpdateMatches,
  onUpdateChannels,
  onUpdateVods,
  onNotify,
  onAddNotification,
  onUpdateCategories,
  onUpdateVodCategories,
  adConfig,
  onUpdateAdConfig,
  onPlayStream
}: AdminPanelProps) {
  const t = translations[lang];
  const [activeSubTab, setActiveSubTab] = useState<'matches' | 'channels' | 'movies' | 'series' | 'm3u_import' | 'ads' | 'categories' | 'vod_categories'>('matches');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Link Type and Channel binding for Match Form
  const [linkType, setLinkType] = useState<'manual' | 'channel'>('manual');
  const [selectedChanId, setSelectedChanId] = useState('');

  // M3U Batch Import States
  const [m3uText, setM3uText] = useState('');
  const [m3uType, setM3uType] = useState<'channel' | 'series'>('channel');
  const [m3uDefaultCategory, setM3uDefaultCategory] = useState<string>('sports');
  const [m3uSeriesCategoryAr, setM3uSeriesCategoryAr] = useState('مسلسلات رياضية');
  const [importReport, setImportReport] = useState<{ success: boolean; count: number; message: string } | null>(null);

  // Ad Settings Local state
  const [adsActive, setAdsActive] = useState(() => adConfig.active);
  const [adsProvider, setAdsProvider] = useState(() => adConfig.provider);
  const [adsBannerImage, setAdsBannerImage] = useState(() => adConfig.bannerImage);
  const [adsBannerLink, setAdsBannerLink] = useState(() => adConfig.bannerLink);
  const [adsInterstitialActive, setAdsInterstitialActive] = useState(() => adConfig.interstitialActive);
  const [adsInterstitialSeconds, setAdsInterstitialSeconds] = useState(() => adConfig.interstitialSeconds);
  const [adsInterstitialImage, setAdsInterstitialImage] = useState(() => adConfig.interstitialImage);
  const [adsInterstitialLink, setAdsInterstitialLink] = useState(() => adConfig.interstitialLink);
  const [adsHtmlScript, setAdsHtmlScript] = useState(() => adConfig.htmlScript);

  // Series Episode Manager state
  const [selectedSeriesForEpisodes, setSelectedSeriesForEpisodes] = useState<VideoContent | null>(null);

  // Bulk Generator Fields
  const [bulkSeason, setBulkSeason] = useState(1);
  const [bulkEpisodesCount, setBulkEpisodesCount] = useState(100);
  const [bulkTitlePrefixAr, setBulkTitlePrefixAr] = useState('الحلقة ');
  const [bulkTitlePrefixEn, setBulkTitlePrefixEn] = useState('Episode ');
  const [bulkStreamUrlTemplate, setBulkStreamUrlTemplate] = useState('https://test-streams.mux.dev/x36xhg/main.m3u8');
  const [bulkDuration, setBulkDuration] = useState('45m');

  // Channel Delete States
  const [channelDeleteCat, setChannelDeleteCat] = useState<string>('all');

  // Selection and M3U Export States
  const [editingCategory, setEditingCategory] = useState<{ id: string; nameAr: string; nameEn: string; icon?: string; parentId?: string | null } | null>(null);
  const [catNameArVal, setCatNameArVal] = useState('');
  const [catIconVal, setCatIconVal] = useState('');
  const [catIdVal, setCatIdVal] = useState('');
  const [catParentIdVal, setCatParentIdVal] = useState<'channels' | null>('channels');

  const [editingVodCategory, setEditingVodCategory] = useState<{ id: string; nameAr: string; nameEn: string; icon?: string; parentId?: string | null } | null>(null);
  const [vodCatNameArVal, setVodCatNameArVal] = useState('');
  const [vodCatIconVal, setVodCatIconVal] = useState('');
  const [vodCatIdVal, setVodCatIdVal] = useState('');
  const [vodParentIdVal, setVodParentIdVal] = useState<'movie' | 'series'>('movie');

  // Deletion redistribution & bulk transfer states
  const [deleteConfirmInfo, setDeleteConfirmInfo] = useState<{ type: 'channel' | 'vod'; categoryId: string; categoryName: string; count: number } | null>(null);
  const [redistributeDestId, setRedistributeDestId] = useState<string>('');

  // Bulk Move inputs
  const [bulkMoveSource, setBulkMoveSource] = useState<string>('');
  const [bulkMoveDest, setBulkMoveDest] = useState<string>('');

  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedVods, setSelectedVods] = useState<string[]>([]);
  const [showM3uExportModal, setShowM3uExportModal] = useState(false);
  const [m3uExportText, setM3uExportText] = useState('');
  const [m3uExportCount, setM3uExportCount] = useState(0);

  const generateM3uContentAndOpenModal = () => {
    let m3u = "#EXTM3U\n\n";
    let streamCount = 0;

    // Add selected channels
    selectedChannels.forEach(id => {
      const chan = channels.find(c => c.id === id);
      if (chan) {
        streamCount++;
        const catObj = categories.find(cat => cat.id === chan.category);
        const catName = catObj ? catObj.nameAr : chan.category;
        m3u += `#EXTINF:-1 tvg-logo="${chan.logo || ''}" group-title="${catName}",${chan.nameAr}\n`;
        m3u += `${chan.streamUrl}\n\n`;
      }
    });

    // Add selected movies & series
    selectedVods.forEach(id => {
      const vod = moviesAndSeries.find(v => v.id === id);
      if (vod) {
        if (vod.type === 'movie') {
          streamCount++;
          m3u += `#EXTINF:-1 tvg-logo="${vod.poster || ''}" group-title="أفلام - ${vod.categoryAr}",${vod.titleAr}\n`;
          m3u += `${vod.streamUrl}\n\n`;
        } else {
          // Series - export all episodes!
          const episodes = vod.seasons?.[0]?.episodes || [];
          episodes.forEach(ep => {
            streamCount++;
            m3u += `#EXTINF:-1 tvg-logo="${vod.poster || ''}" group-title="مسلسلات - ${vod.titleAr}",${vod.titleAr} - ${ep.titleAr}\n`;
            m3u += `${ep.streamUrl}\n\n`;
          });
        }
      }
    });

    if (streamCount === 0) {
      onNotify(lang === 'ar' ? '⚠️ يرجى تحديد قنوات أو أفلام أو مسلسلات لتصديرها أولاً!' : '⚠️ Please select channels or VOD items to export first!');
      return;
    }

    setM3uExportCount(streamCount);
    setM3uExportText(m3u.trim() + "\n");
    setShowM3uExportModal(true);
  };

  const loadM3uExample = () => {
    setM3uText(`#EXTM3U

#EXTINF:-1 tvg-logo="https://up6.cc/2026/05/177962176220441.jpg" group-title="رياضة",ألوان الرياضية
https://stream.camcloud.stream/stream/456de69d002b/playlist.m3u8

#EXTINF:-1 tvg-logo="https://up6.cc/2026/05/177962176220441.jpg" group-title="رياضة",ألوان الرياضية HD
https://stream.camcloud.stream/stream/fd1979023964/playlist.m3u8

#EXTINF:-1 tvg-logo="https://up6.cc/2026/05/177962176220441.jpg" group-title="رياضة",ألوان سبورت
https://stream.camcloud.stream/stream/6478d42a682b/playlist.m3u8

#EXTINF:-1 tvg-logo="https://up6.cc/2026/05/177962176220441.jpg" group-title="رياضة",ألوان الرياضية مباشر
https://stream.camcloud.stream/stream/4daee3f6e9e7/playlist.m3u8`);
  };

  const handleM3uImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!m3uText.trim()) return;

    const lines = m3uText.split('\n');
    const items: {
      name: string;
      logo: string;
      group: string;
      url: string;
    }[] = [];

    let currentInfo: {
      name: string;
      logo: string;
      group: string;
    } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('#EXTINF:')) {
        let logo = '';
        let group = '';
        let name = '';

        const logoMatch = line.match(/tvg-logo="([^"]*)"/i) || line.match(/tvg-logo=([^,\s]*)/i);
        if (logoMatch) {
          logo = logoMatch[1];
        }

        const groupMatch = line.match(/group-title="([^"]*)"/i) || line.match(/group-title=([^,\s]*)/i);
        if (groupMatch) {
          group = groupMatch[1];
        }

        const commaIdx = line.lastIndexOf(',');
        if (commaIdx !== -1) {
          name = line.substring(commaIdx + 1).trim();
        } else {
          name = (lang === 'ar' ? "قناة " : "Channel ") + (items.length + 1);
        }

        currentInfo = { name, logo, group };
      } else if (line.startsWith('#')) {
        continue;
      } else {
        if (currentInfo) {
          items.push({
            name: currentInfo.name,
            logo: currentInfo.logo,
            group: currentInfo.group,
            url: line
          });
          currentInfo = null;
        } else if (line.startsWith('http')) {
          items.push({
            name: (lang === 'ar' ? "قناة " : "Channel ") + (items.length + 1),
            logo: '',
            group: '',
            url: line
          });
        }
      }
    }

    if (items.length === 0) {
      setImportReport({
        success: false,
        count: 0,
        message: lang === 'ar' ? 'لم يتم العثور على أي روابط أو قنوات صالحة في النص المدخل!' : 'No valid channels or URLs found in the entered M3U text!'
      });
      return;
    }

    if (m3uType === 'channel') {
      const newChannels: Channel[] = items.map((item, idx) => {
        let category = m3uDefaultCategory;
        const gr = (item.group || '').toLowerCase();
        if (gr.includes('رياض') || gr.includes('sport')) {
          category = 'sports';
        } else if (gr.includes('أخبار') || gr.includes('news') || gr.includes('إخبار')) {
          category = 'news';
        } else if (gr.includes('أطفال') || gr.includes('kid') || gr.includes('كرتون')) {
          category = 'kids';
        } else if (gr.includes('وثائق') || gr.includes('doc')) {
          category = 'documentary';
        } else if (gr.includes('دراما') || gr.includes('أفلام') || gr.includes('drama') || gr.includes('movie') || gr.includes('ترفيه') || gr.includes('enter')) {
          category = 'entertainment';
        }

        return {
          id: 'chan_m3u_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 4),
          nameAr: item.name,
          nameEn: item.name,
          logo: item.logo || '📡',
          category: category,
          streamUrl: item.url,
          status: 'online'
        };
      });

      onUpdateChannels([...newChannels, ...channels]);
      setImportReport({
        success: true,
        count: newChannels.length,
        message: lang === 'ar' 
          ? `تم استيراد عدد ${newChannels.length} قناة بنجاح وإضافتها إلى قائمة القنوات المباشرة!` 
          : `Successfully imported ${newChannels.length} channels to the live TV guide!`
      });
    } else {
      const newSeries: VideoContent[] = items.map((item, idx) => {
        return {
          id: 'vod_m3u_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 4),
          titleAr: item.name,
          titleEn: item.name,
          type: 'series',
          poster: item.logo || 'https://images.unsplash.com/photo-1540747737956-378724044432?w=500&auto=format&fit=crop&q=80',
          backdrop: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=1200&auto=format&fit=crop&q=80',
          categoryAr: m3uSeriesCategoryAr,
          categoryEn: 'Imported Series',
          rating: 4.8,
          year: 2026,
          descriptionAr: `تغطية ومتابعة مستمرة وبث مباشر لحلقات ${item.name} بجودة عالية وبدون تقطيع. تمت إضافته تلقائيا عبر مدير الاستوراد.`,
          descriptionEn: `Live stream high-definition batch updated coverage of ${item.name}. Automatically imported.`,
          seasons: [
            {
              id: 'season_m3u_' + Date.now() + '_' + idx,
              seasonNumber: 1,
              episodes: [
                {
                  id: 'ep_m3u_' + Date.now() + '_' + idx,
                  titleAr: 'الحلقة الأولى / البث الرئيسي',
                  titleEn: 'Episode 1 / Main Stream',
                  episodeNumber: 1,
                  duration: 'بث مباشر',
                  streamUrl: item.url
                }
              ]
            }
          ]
        };
      });

      onUpdateVods([...newSeries, ...moviesAndSeries]);
      setImportReport({
        success: true,
        count: newSeries.length,
        message: lang === 'ar'
          ? `تم استيراد عدد ${newSeries.length} مسلسل بنجاح وإضافتها لمكتبة الوسائط!`
          : `Successfully imported ${newSeries.length} series to the media library!`
      });
    }

    setM3uText('');
  };

  const handleSaveAds = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAdConfig({
      active: adsActive,
      provider: adsProvider,
      bannerImage: adsBannerImage,
      bannerLink: adsBannerLink,
      interstitialActive: adsInterstitialActive,
      interstitialSeconds: adsInterstitialSeconds,
      interstitialImage: adsInterstitialImage,
      interstitialLink: adsInterstitialLink,
      htmlScript: adsHtmlScript
    });
    onNotify(lang === 'ar' ? '✅ تم حفظ إعدادات إعلانات التطبيق وتفاصيل الأرباح بنجاح!' : '✅ App ad monetization credentials successfully saved!');
  };

  // Form States
  const [matchForm, setMatchForm] = useState({
    team1Ar: '', team1En: '', team1Logo: '',
    team2Ar: '', team2En: '', team2Logo: '',
    team1Score: 0, team2Score: 0,
    tournamentAr: '', tournamentEn: '', tournamentLogo: '🏆',
    time: '21:00', date: '2026-05-23', status: 'upcoming' as 'live' | 'upcoming' | 'finished',
    minute: 0, streamUrl: 'https://test-streams.mux.dev/x36xhg/main.m3u8'
  });

  const [channelForm, setChannelForm] = useState({
    nameAr: '', nameEn: '', logo: '📺',
    category: 'sports' as string,
    streamUrl: 'https://test-streams.mux.dev/x36xhg/main.m3u8',
    backupUrl: '', status: 'online' as 'online' | 'offline'
  });

  const [vodForm, setVodForm] = useState({
    titleAr: '', titleEn: '', type: 'movie' as 'movie' | 'series',
    poster: 'https://images.unsplash.com/photo-1540747737956-378724044432?w=500&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=1200&auto=format&fit=crop&q=80',
    categoryAr: '', categoryEn: '', rating: 4.5, year: 2025,
    duration: '2h 00m', descriptionAr: '', descriptionEn: '',
    streamUrl: 'https://test-streams.mux.dev/x36xhg/main.m3u8'
  });

  const [formEpisodes, setFormEpisodes] = useState<Episode[]>([]);
  const [epNum, setEpNum] = useState<number>(1);
  const [epStreamUrl, setEpStreamUrl] = useState<string>('');
  const [epBackupUrl, setEpBackupUrl] = useState<string>('');

  const [pushMsg, setPushMsg] = useState('');
  const [msgSuccess, setMsgSuccess] = useState(false);

  // Form Autofills for lazy, perfect evaluation
  const autofillMatch = () => {
    setMatchForm({
      team1Ar: 'بايرن ميونخ', team1En: 'Bayern Munich', team1Logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80',
      team2Ar: 'بورسيا دورتموند', team2En: 'Borussia Dortmund', team2Logo: 'https://images.unsplash.com/photo-1540747737956-378724044432?w=150&auto=format&fit=crop&q=80',
      team1Score: 0, team2Score: 0,
      tournamentAr: 'الدوري الألماني - دير كلاسيكر', tournamentEn: 'Bundesliga - Der Klassiker', tournamentLogo: '🇩🇪',
      time: '18:30', date: '2026-05-24', status: 'upcoming',
      minute: 0, streamUrl: 'https://test-streams.mux.dev/ptg/playlist.m3u8'
    });
  };

  const autofillChannel = () => {
    setChannelForm({
      nameAr: 'سكاي نيوز العربية', nameEn: 'Sky News Arabia HD', logo: '📰',
      category: 'news', streamUrl: 'https://test-streams.mux.dev/ptg/playlist.m3u8',
      backupUrl: 'https://test-streams.mux.dev/x36xhg/main.m3u8', status: 'online'
    });
  };

  const autofillVod = () => {
    setVodForm({
      titleAr: 'الأسطورة دييغو مارادونا: بطل الكأس',
      titleEn: 'Diego Maradona: The Ultimate Legend',
      type: 'movie',
      poster: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=500&auto=format&fit=crop&q=80',
      backdrop: 'https://images.unsplash.com/photo-1431324155629-1a6edd1e1ece?w=1200&auto=format&fit=crop&q=80',
      categoryAr: 'سيرة ذاتية / شاشات', categoryEn: 'Biopic / Historical',
      rating: 4.8, year: 2024, duration: '1h 50m',
      descriptionAr: 'كواليس نادرة تستعرض رحلة العبقري مارادونا في نهائيات كأس العالم ومسيرته الملهمة مع نابولي الإيطالي.',
      descriptionEn: 'An intricate collection of archival footage sharing Maradona\'s World Cup achievements and visual legacy.',
      streamUrl: 'https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8'
    });
  };

  // Submit operations
  const handleMatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchForm.team1Ar || !matchForm.team2Ar) return;

    const t1En = matchForm.team1En || matchForm.team1Ar;
    const t2En = matchForm.team2En || matchForm.team2Ar;
    const tournEn = matchForm.tournamentEn || matchForm.tournamentAr;

    if (editingId) {
      const updated = matches.map(m => m.id === editingId ? {
        ...m,
        team1: { nameAr: matchForm.team1Ar, nameEn: t1En, logo: matchForm.team1Logo || 'https://images.unsplash.com/photo-1518063319789-7217e6706b04' },
        team2: { nameAr: matchForm.team2Ar, nameEn: t2En, logo: matchForm.team2Logo || 'https://images.unsplash.com/photo-1579952365111-3958b8db916e' },
        team1Score: Number(matchForm.team1Score),
        team2Score: Number(matchForm.team2Score),
        tournamentAr: matchForm.tournamentAr,
        tournamentEn: tournEn,
        tournamentLogo: matchForm.tournamentLogo,
        time: matchForm.time,
        date: matchForm.date,
        status: matchForm.status,
        minute: Number(matchForm.minute),
        servers: [{ name: 'Server 1 Override', url: matchForm.streamUrl }],
        createdAt: m.createdAt || Date.now(),
        liveCreatedAt: matchForm.status === 'live' ? (m.status === 'live' ? (m.liveCreatedAt || Date.now()) : Date.now()) : undefined
      } : m);
      onUpdateMatches(updated);
      setEditingId(null);
      onNotify(`تم تحديث بيانات مباراة البث المباشر المجدولة: ${matchForm.team1Ar} ضد ${matchForm.team2Ar} ⚽`);
    } else {
      const nowTs = Date.now();
      const newMatch: Match = {
        id: 'match_' + nowTs,
        team1: { nameAr: matchForm.team1Ar, nameEn: t1En, logo: matchForm.team1Logo || 'https://images.unsplash.com/photo-1518063319789-7217e6706b04' },
        team2: { nameAr: matchForm.team2Ar, nameEn: t2En, logo: matchForm.team2Logo || 'https://images.unsplash.com/photo-1579952365111-3958b8db916e' },
        team1Score: Number(matchForm.team1Score),
        team2Score: Number(matchForm.team2Score),
        tournamentAr: matchForm.tournamentAr,
        tournamentEn: tournEn,
        tournamentLogo: matchForm.tournamentLogo,
        time: matchForm.time,
        date: matchForm.date,
        status: matchForm.status,
        minute: Number(matchForm.minute) || undefined,
        servers: [{ name: 'Main VIP Stream', url: matchForm.streamUrl }],
        createdAt: nowTs,
        liveCreatedAt: matchForm.status === 'live' ? nowTs : undefined
      };
      onUpdateMatches([newMatch, ...matches]);
      onAddNotification?.({
        title: `${matchForm.team1Ar} ضد ${matchForm.team2Ar}`,
        type: 'match',
        image: matchForm.team1Logo || 'https://images.unsplash.com/photo-1518063319789-7217e6706b04',
        subtitleAr: `مباراة جارية ومباشرة الآن في بطولة ${matchForm.tournamentAr}!`,
        targetId: newMatch.id
      });
      onNotify(`🚨 بث مباشر جديد الآن: مباراة ${matchForm.team1Ar} ضد ${matchForm.team2Ar} في بطولة ${matchForm.tournamentAr}! شاهدوا البث المباشر الحصري مجاناً ⚽`);
    }

    // Reset Form
    setMatchForm({
      team1Ar: '', team1En: '', team1Logo: '',
      team2Ar: '', team2En: '', team2Logo: '',
      team1Score: 0, team2Score: 0,
      tournamentAr: '', tournamentEn: '', tournamentLogo: '🏆',
      time: '21:00', date: '2026-05-23', status: 'upcoming',
      minute: 0, streamUrl: 'https://test-streams.mux.dev/x36xhg/main.m3u8'
    });
  };

  const deleteMatch = (id: string, matchTitle: string) => {
    setConfirmAction({
      message: `هل أنت متأكد من حذف مباراة "${matchTitle}" نهائياً من قاعدة البيانات؟`,
      onConfirm: () => {
        onUpdateMatches(matches.filter(m => m.id !== id));
        onNotify('🗑️ تم التخلص من وحذف المباراة المحددة.');
      }
    });
  };

  const handleChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelForm.nameAr) return;

    const nameEnVal = channelForm.nameEn || channelForm.nameAr;

    if (editingId) {
      const updated = channels.map(c => c.id === editingId ? {
        ...c,
        nameAr: channelForm.nameAr,
        nameEn: nameEnVal,
        logo: channelForm.logo,
        category: channelForm.category,
        streamUrl: channelForm.streamUrl,
        backupUrl: channelForm.backupUrl || undefined,
        status: channelForm.status
      } : c);
      onUpdateChannels(updated);
      setEditingId(null);
      onNotify(`تم تحديث بيانات القناة التلفزيونية: ${channelForm.nameAr} 📡`);
    } else {
      const newChan: Channel = {
        id: 'chan_' + Date.now(),
        nameAr: channelForm.nameAr,
        nameEn: nameEnVal,
        logo: channelForm.logo || '📺',
        category: channelForm.category,
        streamUrl: channelForm.streamUrl,
        backupUrl: channelForm.backupUrl || undefined,
        status: channelForm.status
      };
      onUpdateChannels([newChan, ...channels]);
      onAddNotification?.({
        title: channelForm.nameAr,
        type: 'channel',
        image: channelForm.logo && (channelForm.logo.startsWith('http') || channelForm.logo.startsWith('/')) ? channelForm.logo : 'https://images.unsplash.com/photo-1579952365111-3958b8db916e?w=150&auto=format&fit=crop&q=80',
        subtitleAr: `إضافة قناة تلفزيونية جديدة ومتاحة الآن للبث الفوري: ${channelForm.nameAr}`,
        targetId: newChan.id
      });
      onNotify(`📺 تم إضافة قناة تلفزيونية جديدة ومتاحة الآن للبث الفوري: ${channelForm.nameAr}! تصفحوها الآن في دليل القنوات 🛰️`);
    }

    setChannelForm({
      nameAr: '', nameEn: '', logo: '📺', category: 'sports',
      streamUrl: 'https://test-streams.mux.dev/x36xhg/main.m3u8',
      backupUrl: '', status: 'online'
    });
  };

  const deleteChannel = (id: string, nameAr: string) => {
    setConfirmAction({
      message: `هل أنت متأكد من حذف القناة الفضائية "${nameAr}" نهائياً من قائمة القنوات الحية؟`,
      onConfirm: () => {
        onUpdateChannels(channels.filter(c => c.id !== id));
        onNotify('🗑️ تم التخلص من وحذف القناة المحددة.');
      }
    });
  };

  const handleVodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vodForm.titleAr) return;

    const titleEnVal = vodForm.titleEn || vodForm.titleAr;
    const catEnVal = vodForm.categoryEn || vodForm.categoryAr;
    const descEnVal = vodForm.descriptionEn || vodForm.descriptionAr;

    if (editingId) {
      const updated = moviesAndSeries.map(v => v.id === editingId ? {
        ...v,
        titleAr: vodForm.titleAr,
        titleEn: titleEnVal,
        type: vodForm.type,
        poster: vodForm.poster,
        backdrop: vodForm.backdrop,
        categoryAr: vodForm.categoryAr,
        categoryEn: catEnVal,
        rating: Number(vodForm.rating),
        year: Number(vodForm.year),
        duration: vodForm.type === 'movie' ? vodForm.duration : undefined,
        descriptionAr: vodForm.descriptionAr,
        descriptionEn: descEnVal,
        streamUrl: vodForm.type === 'movie' ? vodForm.streamUrl : undefined,
        seasons: vodForm.type === 'series' ? [
          {
            id: v.seasons?.[0]?.id || ('season_' + Date.now()),
            seasonNumber: 1,
            episodes: formEpisodes
          }
        ] : undefined
      } : v);
      onUpdateVods(updated);
      setEditingId(null);
      onNotify(`تم تحديث مكتبة الوسائط: ${vodForm.titleAr} 🎬`);
    } else {
      const newVod: VideoContent = {
        id: 'vod_' + Date.now(),
        titleAr: vodForm.titleAr,
        titleEn: titleEnVal,
        type: vodForm.type,
        poster: vodForm.poster,
        backdrop: vodForm.backdrop,
        categoryAr: vodForm.categoryAr,
        categoryEn: catEnVal,
        rating: Number(vodForm.rating),
        year: Number(vodForm.year),
        duration: vodForm.type === 'movie' ? vodForm.duration : undefined,
        descriptionAr: vodForm.descriptionAr,
        descriptionEn: descEnVal,
        streamUrl: vodForm.type === 'movie' ? vodForm.streamUrl : undefined,
        seasons: vodForm.type === 'series' ? [
          {
            id: 'ws_1',
            seasonNumber: 1,
            episodes: formEpisodes
          }
        ] : undefined
      };
      onUpdateVods([newVod, ...moviesAndSeries]);
      onAddNotification?.({
        title: vodForm.titleAr,
        type: 'media',
        image: vodForm.poster || 'https://images.unsplash.com/photo-1540747737956-378724044432?w=150&auto=format&fit=crop&q=80',
        subtitleAr: `تم إضافة ${vodForm.type === 'movie' ? 'فيلم سينمائي جديد ' : 'مسلسل حصري جديد '}: "${vodForm.titleAr}" (${vodForm.year})`,
        targetId: newVod.id
      });
      onNotify(`🎬 تم إضافة ${vodForm.type === 'movie' ? 'فيلم سينمائي جديد ' : 'مسلسل حصري جديد '} لمكتبة الوسائط: "${vodForm.titleAr}" (${vodForm.year})! شاهدوه الآن فوراً بجودة فائقة 🍿`);
    }

    setVodForm({
      titleAr: '', titleEn: '', type: 'movie',
      poster: 'https://images.unsplash.com/photo-1540747737956-378724044432?w=500&auto=format&fit=crop&q=80',
      backdrop: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=1200&auto=format&fit=crop&q=80',
      categoryAr: '', categoryEn: '', rating: 4.5, year: 2025,
      duration: '2h 00m', descriptionAr: '', descriptionEn: '',
      streamUrl: 'https://test-streams.mux.dev/x36xhg/main.m3u8'
    });
    setFormEpisodes([]);
    setEpNum(1);
    setEpStreamUrl('');
    setEpBackupUrl('');
  };

  const deleteVod = (id: string, titleAr: string) => {
    setConfirmAction({
      message: `هل أنت متأكد من حذف (${titleAr}) نهائياً من مكتبة الأفلام والمسلسلات؟`,
      onConfirm: () => {
        onUpdateVods(moviesAndSeries.filter(v => v.id !== id));
        onNotify('🗑️ تم حذف المحتوى بنجاح من مكتبة السينما والدراما.');
      }
    });
  };

  // Broadcast function
  const sendMarqueeMessage = () => {
    if (!pushMsg.trim()) return;
    onNotify(pushMsg);
    setMsgSuccess(true);
    setTimeout(() => setMsgSuccess(false), 4000);
    setPushMsg('');
  };

  return (
    <div className="w-full flex flex-col gap-6 font-sans" id="admin-panel-container">
      {/* Top title and diagnostic details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/[0.04] gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Settings2 className="text-brand-accent animate-spin-slow" size={24} />
            <span>{t.adminDashboard}</span>
          </h2>
          <p className="text-xs text-brand-accent font-sans mt-1">
            🛰️ بوابة تحكم ستاد المركزية // الجلسة نشطة ومؤمنة
          </p>
        </div>

        {/* Dashboard Tabs */}
        <div id="admin-tabs-wrapper" className="flex flex-wrap items-center gap-1.5 bg-brand-secondary/80 border border-white/[0.05] p-1.5 rounded-2xl shadow-lg shadow-black/40">
          {(['matches', 'channels', 'movies', 'm3u_import', 'ads', 'categories', 'vod_categories'] as const).map((tab) => (
            <button
               key={tab}
               id={`admin-tab-btn-${tab}`}
               onClick={() => { setActiveSubTab(tab); setEditingId(null); }}
               className={`px-4 py-2.5 text-xs font-heading font-extrabold rounded-xl transition-all duration-300 relative select-none active:scale-95 ${
                 activeSubTab === tab 
                   ? 'bg-gradient-to-r from-brand-accent to-[#0099CC] text-brand-bg shadow-[0_0_20px_rgba(0,194,255,0.3)] font-black' 
                   : 'text-brand-muted hover:text-white hover:bg-white/[0.02]'
               }`}
            >
              {tab === 'matches' ? '⚽ المباريات' :
               tab === 'channels' ? '📡 القنوات' :
               tab === 'movies' ? '🎬 الأفلام والمسلسلات' :
               tab === 'm3u_import' ? '📥 استيراد M3U' :
               tab === 'ads' ? '💰 إعلانات وأرباح' :
               tab === 'categories' ? '🗂️ أقسام القنوات' :
               '🍿 أقسام السينما'}
            </button>
          ))}
        </div>
      </div>

      {/* Broadcast controller notifier */}
      <div className="bg-brand-secondary border border-white/[0.04] p-5 rounded-[28px] space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5" dir="rtl">
            <Send size={14} className="text-brand-accent animate-pulse" />
            <span>📢 تحديث شريط الإعلانات العاجلة (Marquee) لكافة المستخدمين</span>
          </h3>
          <span className="text-[10px] text-zinc-400 font-mono shrink-0">📡 بث حي نشط</span>
        </div>

        {msgSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/15 rounded-xl flex items-start gap-2 text-emerald-400 text-xs text-right" dir="rtl">
            <CheckCircle size={14} className="mt-0.5 shrink-0" />
            <span>تم بث التنبيه لجميع المشاهدين بنجاح!</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <input 
            type="text" 
            value={pushMsg}
            onChange={(e) => setPushMsg(e.target.value)}
            placeholder="اكتب رسالة البث لتظهر متحركة في أعلى شاشة التطبيق لدى جميع المستخدمين فوراً..."
            className="flex-1 text-xs font-semibold bg-brand-card border border-white/[0.03] text-white rounded-xl px-4 py-3 outline-none focus:border-brand-accent transition text-right"
            dir="rtl"
          />
          <button 
            type="button"
            onClick={sendMarqueeMessage}
            className="px-5 py-3 bg-brand-accent hover:opacity-90 text-brand-bg font-black text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,194,255,0.25)] shrink-0 w-full sm:w-auto"
          >
            <Send size={12} fill="currentColor" />
            <span>تحديث شريط الإعلانات</span>
          </button>
        </div>
      </div>

      {/* SUB PAGE 2: CRUD MATCHES */}
      {activeSubTab === 'matches' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Match Create/Edit Form */}
          <div className="bg-brand-secondary border border-white/[0.04] p-5 rounded-[32px] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.04]">
              <h3 className="text-xs font-black text-brand-accent uppercase tracking-wider">
                {editingId ? 'تعديل بيانات المباراة الحية ⚽' : 'تسجيل مباراة بث حي جديدة ⚽'}
              </h3>
              <button 
                type="button" 
                onClick={autofillMatch}
                className="px-2.5 py-1 bg-brand-card hover:bg-white/5 border border-white/5 text-[10px] rounded font-bold text-brand-accent transition shrink-0 self-start sm:self-auto"
              >
                ⚡ تعبئة تلقائية للمباراة
              </button>
            </div>

            <form onSubmit={handleMatchSubmit} className="space-y-4 text-xs font-semibold">
              {/* Teams Input */}
              <div className="space-y-3.5">
                <div id="wrapper-team1-ar" className="space-y-1.5">
                  <label id="lbl-team1-ar" className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block mb-1">اسم الفريق الأول (عربي)</label>
                  <input 
                    type="text" required value={matchForm.team1Ar}
                    onChange={(e) => setMatchForm({...matchForm, team1Ar: e.target.value})}
                    placeholder="مثال: الهلال"
                    className="w-full bg-brand-card/90 focus:bg-brand-card border border-white/[0.04] focus:border-brand-accent/55 text-white p-3 rounded-2xl outline-none focus:shadow-[0_0_20px_rgba(0,194,255,0.15)] transition-all duration-300 font-heading font-semibold text-xs placeholder-zinc-650"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block mb-1">رابط شعار الفريق الأول (اختياري)</label>
                  <input 
                    type="text" value={matchForm.team1Logo}
                    onChange={(e) => setMatchForm({...matchForm, team1Logo: e.target.value})}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-brand-card/90 focus:bg-brand-card border border-white/[0.04] focus:border-brand-accent/55 text-white p-3 rounded-2xl outline-none focus:shadow-[0_0_20px_rgba(0,194,255,0.15)] transition-all duration-300 font-heading font-semibold text-xs placeholder-zinc-650"
                  />
                </div>
              </div>

              {/* Second Team */}
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block mb-1">اسم الفريق الثاني (عربي)</label>
                  <input 
                    type="text" required value={matchForm.team2Ar}
                    onChange={(e) => setMatchForm({...matchForm, team2Ar: e.target.value})}
                    placeholder="مثال: النصر"
                    className="w-full bg-brand-card/90 focus:bg-brand-card border border-white/[0.04] focus:border-brand-accent/55 text-white p-3 rounded-2xl outline-none focus:shadow-[0_0_20px_rgba(0,194,255,0.15)] transition-all duration-300 font-heading font-semibold text-xs placeholder-zinc-650"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block mb-1">رابط شعار الفريق الثاني (اختياري)</label>
                  <input 
                    type="text" value={matchForm.team2Logo}
                    onChange={(e) => setMatchForm({...matchForm, team2Logo: e.target.value})}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-brand-card/90 focus:bg-brand-card border border-white/[0.04] focus:border-brand-accent/55 text-white p-3 rounded-2xl outline-none focus:shadow-[0_0_20px_rgba(0,194,255,0.15)] transition-all duration-300 font-heading font-semibold text-xs placeholder-zinc-650"
                  />
                </div>
              </div>

              {/* Scores & Minute */}
              <div className="grid grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block mb-1">أهداف ف1</label>
                  <input 
                    type="number" min="0" value={matchForm.team1Score}
                    onChange={(e) => setMatchForm({...matchForm, team1Score: Number(e.target.value)})}
                    className="w-full bg-brand-card/90 focus:bg-brand-card border border-white/[0.04] focus:border-brand-accent/55 text-white p-3 rounded-2xl outline-none focus:shadow-[0_0_20px_rgba(0,194,255,0.15)] transition-all duration-300 font-heading font-semibold text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block mb-1">أهداف ف2</label>
                  <input 
                    type="number" min="0" value={matchForm.team2Score}
                    onChange={(e) => setMatchForm({...matchForm, team2Score: Number(e.target.value)})}
                    className="w-full bg-brand-card/90 focus:bg-brand-card border border-white/[0.04] focus:border-brand-accent/55 text-white p-3 rounded-2xl outline-none focus:shadow-[0_0_20px_rgba(0,194,255,0.15)] transition-all duration-300 font-heading font-semibold text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block mb-1">الدقيقة</label>
                  <input 
                    type="number" min="0" max="120" value={matchForm.minute}
                    onChange={(e) => setMatchForm({...matchForm, minute: Number(e.target.value)})}
                    className="w-full bg-brand-card/90 focus:bg-brand-card border border-white/[0.04] focus:border-brand-accent/55 text-white p-3 rounded-2xl outline-none focus:shadow-[0_0_20px_rgba(0,194,255,0.15)] transition-all duration-300 font-heading font-semibold text-xs"
                  />
                </div>
              </div>

              {/* Tournament */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block mb-1">اسم البطولة (عربي)</label>
                <input 
                  type="text" required value={matchForm.tournamentAr}
                  onChange={(e) => setMatchForm({...matchForm, tournamentAr: e.target.value})}
                  placeholder="مثال: دوري أبطال آسيا"
                  className="w-full bg-brand-card/90 focus:bg-brand-card border border-white/[0.04] focus:border-brand-accent/55 text-white p-3 rounded-2xl outline-none focus:shadow-[0_0_20px_rgba(0,194,255,0.15)] transition-all duration-300 font-heading font-semibold text-xs placeholder-zinc-650"
                />
              </div>

              {/* Details & Status selection */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label id="lbl-match-status" className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block mb-1">حالة البث</label>
                  <select 
                    id="select-match-status"
                    value={matchForm.status}
                    onChange={(e) => setMatchForm({...matchForm, status: e.target.value as any})}
                    className="w-full bg-brand-card/90 focus:bg-brand-card border border-white/[0.04] focus:border-brand-accent/55 text-white p-2.5 rounded-2xl outline-none focus:shadow-[0_0_20px_rgba(0,194,255,0.15)] transition-all duration-300 font-heading font-extrabold text-[11px] cursor-pointer"
                  >
                    <option value="live">🔴 مباشر الآن</option>
                    <option value="upcoming">⏳ قادمة قريباً</option>
                    <option value="finished">🏁 انتهت</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block mb-1">الوقت</label>
                  <input 
                    type="time" value={matchForm.time}
                    onChange={(e) => setMatchForm({...matchForm, time: e.target.value})}
                    className="w-full bg-brand-card/90 focus:bg-brand-card border border-white/[0.04] focus:border-brand-accent/55 text-white p-2.5 rounded-2xl outline-none focus:shadow-[0_0_20px_rgba(0,194,255,0.15)] transition-all duration-300 font-mono text-center cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block mb-1">التاريخ</label>
                  <input 
                    type="date" value={matchForm.date}
                    onChange={(e) => setMatchForm({...matchForm, date: e.target.value})}
                    className="w-full bg-brand-card/90 focus:bg-brand-card border border-white/[0.04] focus:border-brand-accent/55 text-white p-2.5 rounded-2xl outline-none focus:shadow-[0_0_20px_rgba(0,194,255,0.15)] transition-all duration-300 font-mono text-center cursor-pointer"
                  />
                </div>
              </div>

              {/* Stream URL selection / input options */}
              <div className="space-y-2 bg-brand-card/30 p-3 rounded-2xl border border-white/[0.02]">
                <label className="text-zinc-450 font-heading font-black text-[10.5px] uppercase tracking-wide block">مصدر البث للمباراة</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setLinkType('manual')}
                    className={`py-2 text-[10px] font-bold rounded-xl border transition ${linkType === 'manual' ? 'bg-brand-accent/15 border-brand-accent text-brand-accent' : 'bg-brand-card/40 border-white/[0.03] text-zinc-400 hover:text-white'}`}
                  >
                    رابط يدوي (HLS/m3u8)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLinkType('channel')}
                    className={`py-2 text-[10px] font-bold rounded-xl border transition ${linkType === 'channel' ? 'bg-brand-accent/15 border-brand-accent text-brand-accent' : 'bg-brand-card/40 border-white/[0.03] text-zinc-400 hover:text-white'}`}
                  >
                    ربطها بقناة تلفزيونية
                  </button>
                </div>

                {linkType === 'channel' ? (
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-heading font-bold text-[9.5px] block">اختر القناة المضافة مسبقاً</label>
                    <select
                      value={selectedChanId}
                      onChange={(e) => {
                        const cid = e.target.value;
                        setSelectedChanId(cid);
                        const foundChan = channels.find(c => c.id === cid);
                        if (foundChan) {
                          setMatchForm({...matchForm, streamUrl: foundChan.streamUrl});
                        }
                      }}
                      className="w-full bg-brand-card/95 border border-white/[0.04] focus:border-brand-accent/55 text-white p-2.5 rounded-xl outline-none text-xs cursor-pointer"
                    >
                      <option value="">-- اختر القناة لنسخ البث منها --</option>
                      {channels.map(c => (
                        <option key={c.id} value={c.id}>
                          📺 {c.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-heading font-bold text-[9.5px] block">اكتب رابط البث المباشر المباشر</label>
                    <input 
                      type="text" required value={matchForm.streamUrl}
                      onChange={(e) => setMatchForm({...matchForm, streamUrl: e.target.value})}
                      placeholder="https://..."
                      className="w-full bg-brand-card/90 focus:bg-brand-card border border-white/[0.04] focus:border-brand-accent/55 text-white p-3 rounded-2xl outline-none focus:shadow-[0_0_20px_rgba(0,194,255,0.15)] font-mono text-[10px]"
                    />
                  </div>
                )}
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-brand-accent hover:opacity-90 text-brand-bg font-black rounded-2xl block text-center shadow-[0_4px_12px_rgba(0,194,255,0.2)] transition"
              >
                {editingId ? '✓ حفظ عينة التحديث' : '+ إضافة المباراة لجدول البث المباشر'}
              </button>
            </form>
          </div>

          {/* List of matches for CRUD ops */}
          <div className="col-span-1 lg:col-span-2 space-y-3.5">
            <h4 id="matches-repo-header" className="text-xs font-heading font-extrabold text-brand-muted tracking-wider uppercase flex items-center gap-1.5 opacity-90">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
              <span>📁 أرشيف منصة المباريات المجدولة والموثقة:</span>
            </h4>
            
            <div className="space-y-2.5">
              {matches.map((item) => {
                const isLive = item.status === 'live';
                return (
                  <div 
                    key={item.id} 
                    className="bg-brand-card/30 border border-white/[0.03] rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-white/10 transition"
                  >
                    <div className="flex-1 truncate">
                      <div className="flex items-center gap-2">
                        {isLive ? (
                          <span className="bg-brand-live font-black text-white text-[9px] px-2 py-0.5 rounded-md animate-pulse">LIVE</span>
                        ) : (
                          <span className="bg-brand-bg border border-white/5 text-zinc-500 font-black text-[9px] px-2 py-0.5 rounded-md">SCHEDULE</span>
                        )}
                        <span className="text-xs text-brand-muted font-bold font-mono truncate">{item.tournamentEn}</span>
                      </div>
                      <h5 className="text-xs font-black text-white mt-1">
                        {item.team1.nameAr} ({item.team1Score}) vs {item.team2.nameAr} ({item.team2Score})
                      </h5>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onPlayStream && (
                        <button 
                          onClick={() => {
                            onPlayStream({ titleAr: item.team1.nameAr + ' ضد ' + item.team2.nameAr, titleEn: item.team1.nameEn + ' vs ' + item.team2.nameEn, streamUrl: item.servers[0]?.url }, item.status === 'live', item.servers);
                            onNotify(lang === 'ar' ? `⚽ جاري بث مباراة "${item.team1.nameAr} ضد ${item.team2.nameAr}" في المشغل الرئيسي للمشاهدة والتأكد!` : `⚽ Playing match stream preview!`);
                          }}
                          className="p-2 bg-brand-card hover:bg-brand-accent hover:text-brand-bg text-brand-accent rounded-xl border border-white/5 transition"
                          title={lang === 'ar' ? 'تشغيل البث الحي' : 'Play Live Stream'}
                        >
                          <Play size={13} fill="currentColor" />
                        </button>
                      )}

                      <button 
                        onClick={() => {
                          setEditingId(item.id);
                          setMatchForm({
                            team1Ar: item.team1.nameAr, team1En: item.team1.nameEn, team1Logo: item.team1.logo || '',
                            team2Ar: item.team2.nameAr, team2En: item.team2.nameEn, team2Logo: item.team2.logo || '',
                            team1Score: item.team1Score || 0, team2Score: item.team2Score || 0,
                            tournamentAr: item.tournamentAr, tournamentEn: item.tournamentEn, tournamentLogo: item.tournamentLogo,
                            time: item.time, date: item.date, status: item.status,
                            minute: item.minute || 0, streamUrl: item.servers[0]?.url || 'https://test-streams.mux.dev/x36xhg/main.m3u8'
                          });
                        }}
                        className="p-2 bg-brand-card hover:bg-brand-bg text-brand-accent rounded-xl border border-white/5 transition"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button 
                        onClick={() => deleteMatch(item.id, `${item.team1.nameAr} ضد ${item.team2.nameAr}`)}
                        className="p-2 bg-brand-card hover:bg-brand-live/15 hover:text-brand-live text-zinc-500 rounded-xl border border-white/5 transition cursor-pointer"
                        title="حذف المباراة نهائياً"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB PAGE 3: CRUD CHANNELS */}
      {activeSubTab === 'channels' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Channel Form */}
          <div className="bg-brand-secondary border border-white/[0.04] p-5 rounded-[32px] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.04]">
              <h3 className="text-xs font-heading font-extrabold text-brand-accent uppercase tracking-wider">
                {editingId ? 'تعديل بيانات القناة 📡' : 'بث قناة IPTV جديدة ✨'}
              </h3>
              <button 
                type="button" 
                onClick={autofillChannel}
                className="px-2.5 py-1 bg-brand-card hover:bg-white/5 border border-white/5 text-[10px] rounded font-heading font-bold text-brand-accent transition shrink-0 self-start sm:self-auto"
              >
                ⚡ تعبئة نموذج تلقائي
              </button>
            </div>

            <form onSubmit={handleChannelSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3.5">
                <div id="wrapper-channel-ar" className="space-y-1.5">
                  <label id="lbl-channel-ar" className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block mb-1">اسم القناة (عربي)</label>
                  <input 
                    type="text" required value={channelForm.nameAr}
                    onChange={(e) => setChannelForm({...channelForm, nameAr: e.target.value})}
                    placeholder="مثال: بي إن سبورتس 1"
                    className="w-full bg-brand-card/90 focus:bg-brand-card border border-white/[0.04] focus:border-brand-accent/55 text-white p-3 rounded-2xl outline-none focus:shadow-[0_0_20px_rgba(0,194,255,0.15)] transition-all duration-300 font-heading font-semibold text-xs placeholder-zinc-650"
                  />
                </div>
                <div id="wrapper-channel-en" className="space-y-1.5">
                  <label id="lbl-channel-en" className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block mb-1">اسم القناة بالإنجليزية (مترجم)</label>
                  <input 
                    type="text" required value={channelForm.nameEn}
                    onChange={(e) => setChannelForm({...channelForm, nameEn: e.target.value})}
                    placeholder="BeIN Sports 1"
                    className="w-full bg-brand-card/90 focus:bg-brand-card border border-white/[0.04] focus:border-brand-accent/55 text-white p-3 rounded-2xl outline-none focus:shadow-[0_0_20px_rgba(0,194,255,0.15)] transition-all duration-300 font-heading font-semibold text-xs placeholder-zinc-650"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block mb-1">رابط شعار القناة (رابط صورة أو إيموجي)</label>
                  <input 
                    type="text" required value={channelForm.logo}
                    onChange={(e) => setChannelForm({...channelForm, logo: e.target.value})}
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-brand-card/90 focus:bg-brand-card border border-white/[0.04] focus:border-brand-accent/55 text-white p-3 rounded-2xl outline-none focus:shadow-[0_0_20px_rgba(0,194,255,0.15)] transition-all duration-300 font-mono text-[10px]"
                  />
                </div>
                <div className="space-y-1">
                  <label id="lbl-channel-category" className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block mb-1">تصنيف المجموعة</label>
                  <select 
                    id="select-channel-category"
                    value={channelForm.category}
                    onChange={(e) => setChannelForm({...channelForm, category: e.target.value})}
                    className="w-full bg-brand-card/90 focus:bg-brand-card border border-white/[0.04] focus:border-brand-accent/55 text-white p-3 rounded-2xl outline-none focus:shadow-[0_0_20px_rgba(0,194,255,0.15)] transition-all duration-300 font-heading font-extrabold text-[11px] cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon || '📁'} {cat.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block mb-1">رابط البث الرئيسي (HLS / m3u8)</label>
                  <input 
                    type="text" required value={channelForm.streamUrl}
                    onChange={(e) => setChannelForm({...channelForm, streamUrl: e.target.value})}
                    className="w-full bg-brand-card/90 focus:bg-brand-card border border-white/[0.04] focus:border-brand-accent/55 text-white p-3 rounded-2xl outline-none focus:shadow-[0_0_20px_rgba(0,194,255,0.15)] font-mono text-[10px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block mb-1">رابط بث احتياطي</label>
                  <input 
                    type="text" value={channelForm.backupUrl}
                    onChange={(e) => setChannelForm({...channelForm, backupUrl: e.target.value})}
                    placeholder="(HLS Server backup)"
                    className="w-full bg-brand-card/90 focus:bg-brand-card border border-white/[0.04] focus:border-brand-accent/55 text-white p-3 rounded-2xl outline-none focus:shadow-[0_0_20px_rgba(0,194,255,0.15)] font-mono text-[10px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block mb-1">حالة السيرفر</label>
                <select 
                  value={channelForm.status}
                  onChange={(e) => setChannelForm({...channelForm, status: e.target.value as any})}
                  className="w-full bg-brand-card/90 focus:bg-brand-card border border-white/[0.04] focus:border-brand-accent/55 text-white p-3 rounded-2xl outline-none focus:shadow-[0_0_20px_rgba(0,194,255,0.15)] transition-all duration-300 font-heading font-extrabold text-[11px] cursor-pointer"
                >
                  <option value="online">🟢 متصلة وبث سليم</option>
                  <option value="offline">🔴 متوقفة للصيانة</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-brand-accent hover:opacity-90 text-brand-bg font-black rounded-2xl block text-center shadow-[0_4px_12px_rgba(0,194,255,0.2)] transition"
              >
                {editingId ? '✓ حفظ عينة القناة' : '+ تسجيل وإطلاق القناة الجديدة'}
              </button>
            </form>
          </div>

          {/* List of channels */}
          <div className="col-span-1 lg:col-span-2 space-y-3.5">
            <h4 id="channels-repo-header" className="text-xs font-heading font-extrabold text-brand-muted tracking-wider uppercase flex items-center gap-1.5 opacity-90">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
              <span>📡 شبكة قنوات البث الحي النشطة:</span>
            </h4>
            
            {/* Category Bulk Deletion Tool */}
            <div className="p-4 bg-brand-card/45 rounded-2xl border border-white/[0.03] space-y-3 text-right" dir="rtl">
              <h5 className="text-[11px] font-black text-white flex items-center gap-1.5 justify-end">
                <span>⚙️ خيارات الحذف الجماعي والتصفية للقنوات</span>
              </h5>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1">
                  <select 
                    value={channelDeleteCat}
                    onChange={(e) => setChannelDeleteCat(e.target.value)}
                    className="w-full bg-brand-bg border border-white/5 text-white p-2 rounded-xl outline-none cursor-pointer text-xs font-sans"
                  >
                    <option value="all">📁 جميع المجموعات والقنوات</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon || '📁'} {cat.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmAction({
                        message: lang === 'ar' ? `هل أنت متأكد من مسح وحذف كافة القنوات التابعة للقسم المختار (${channelDeleteCat})؟` : `Are you sure you want to delete all channels under category: ${channelDeleteCat}?`,
                        onConfirm: () => {
                          if (channelDeleteCat === 'all') {
                            onUpdateChannels([]);
                            onNotify(lang === 'ar' ? '🗑️ تم حذف وتفريغ كافة قنوات التطبيق بنجاح!' : 'Cleared all channels!');
                          } else {
                            const remaining = channels.filter(c => c.category !== channelDeleteCat);
                            onUpdateChannels(remaining);
                            onNotify(lang === 'ar' ? `🗑️ تم مسح وحذف قنوات قسم (${channelDeleteCat}) بالكامل من البوابة!` : `Category ${channelDeleteCat} channels cleared!`);
                          }
                        }
                      });
                    }}
                    className="px-3 py-2 bg-brand-live hover:opacity-90 text-white font-extrabold text-[11px] rounded-xl transition cursor-pointer"
                  >
                    حذف قنوات القسم المختار
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmAction({
                        message: lang === 'ar' ? '🚨 تحذير: هل أنت متأكد تماماً من إفراغ التطبيق وحذف كافة القنوات بالكامل؟' : 'Danger: completely clear all channels?',
                        onConfirm: () => {
                          onUpdateChannels([]);
                          onNotify(lang === 'ar' ? '🚨 تم تفريغ وحذف القنوات تماماً بشكل كامل!' : 'Erased all IPTV channels!');
                        }
                      });
                    }}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-950 text-zinc-400 hover:text-brand-live border border-white/5 font-extrabold text-[11px] rounded-xl transition cursor-pointer"
                  >
                    حذف كل القنوات
                  </button>
                </div>
              </div>
            </div>

            {/* M3U Selection and Export Toolbar for Channels */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-brand-card/45 border border-white/[0.04] rounded-2xl text-right animate-fadeIn" dir="rtl">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-xs text-brand-muted">
                  {lang === 'ar' ? `المحددة للتصدير: ${selectedChannels.length} قناة` : `Selected for Export: ${selectedChannels.length} channels`}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChannels(channels.map(c => c.id));
                    onNotify(lang === 'ar' ? '✅ تم تحديد جميع القنوات!' : 'Selected all channels!');
                  }}
                  className="px-2.5 py-1.5 bg-brand-card hover:bg-zinc-800 text-[10px] text-zinc-350 font-bold rounded-lg border border-white/[0.04] transition cursor-pointer"
                >
                  {lang === 'ar' ? 'تحديد الكل 🗹' : 'Select All'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChannels([]);
                    onNotify(lang === 'ar' ? '🧹 تم إلغاء تحديد القنوات!' : 'Deselected all channels!');
                  }}
                  className="px-2.5 py-1.5 bg-brand-card hover:bg-zinc-800 text-[10px] text-zinc-350 font-bold rounded-lg border border-white/[0.04] transition cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء التحديد ☐' : 'Deselect All'}
                </button>
                <button
                  type="button"
                  onClick={generateM3uContentAndOpenModal}
                  disabled={selectedChannels.length === 0}
                  className={`px-3.5 py-1.5 font-bold text-[10px] rounded-lg transition flex items-center gap-1 cursor-pointer ${
                    selectedChannels.length > 0
                      ? 'bg-gradient-to-r from-brand-accent to-[#0099CC] text-brand-bg shadow-[0_0_15px_rgba(0,194,255,0.2)] font-black'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  <span>📥 {lang === 'ar' ? 'تصدير M3U للمحددة' : 'Export Selected'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {channels.map((chan) => (
                <div 
                  key={chan.id} 
                  className="bg-brand-card/30 border border-white/[0.03] rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-white/10 transition"
                >
                  <div className="flex items-center gap-3 truncate">
                    {/* Checkbox for Export Selection */}
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedChannels.includes(chan.id)) {
                          setSelectedChannels(selectedChannels.filter(id => id !== chan.id));
                        } else {
                          setSelectedChannels([...selectedChannels, chan.id]);
                        }
                      }}
                      className="text-brand-muted hover:text-brand-accent transition shrink-0 mr-1 cursor-pointer"
                    >
                      {selectedChannels.includes(chan.id) ? (
                        <CheckSquare size={16} className="text-brand-accent font-black animate-scaleIn" />
                      ) : (
                        <Square size={16} className="opacity-40" />
                      )}
                    </button>

                    {chan.logo?.startsWith('http') || chan.logo?.startsWith('/') ? (
                      <img src={chan.logo} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-lg object-contain bg-white/10 shrink-0 shadow border border-white/5" />
                    ) : (
                      <span className="text-2xl shrink-0">{chan.logo}</span>
                    )}
                    <div className="truncate text-left font-sans">
                      <h4 className="text-xs font-black text-white leading-tight truncate">{chan.nameAr}</h4>
                      <span className="text-[10px] text-brand-muted font-mono tracking-wider block mt-1 uppercase">{chan.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onPlayStream && (
                      <button 
                        onClick={() => {
                          onPlayStream({ titleAr: chan.nameAr, titleEn: chan.nameEn, streamUrl: chan.streamUrl }, true, [{ name: 'البث الرئيسي FHD', url: chan.streamUrl }, { name: 'المصدر الاحتياطي HD', url: chan.backupUrl || chan.streamUrl }]);
                          onNotify(lang === 'ar' ? `📺 جاري تشغيل ومعاينة قناة "${chan.nameAr}" في المشغل الرئيسي!` : `📺 Playing channel "${chan.nameEn}" preview!`);
                        }}
                        className="p-2 bg-brand-card hover:bg-brand-accent hover:text-brand-bg text-brand-accent rounded-xl border border-white/5 transition"
                        title={lang === 'ar' ? 'معاينة وتشغيل' : 'Play & Preview'}
                      >
                        <Play size={13} fill="currentColor" />
                      </button>
                    )}

                    <button 
                      onClick={() => {
                        setEditingId(chan.id);
                        setChannelForm({
                          nameAr: chan.nameAr, nameEn: chan.nameEn, logo: chan.logo,
                          category: chan.category, streamUrl: chan.streamUrl,
                          backupUrl: chan.backupUrl || '', status: chan.status
                        });
                      }}
                      className="p-2 bg-brand-card hover:bg-brand-bg text-brand-accent rounded-xl border border-white/5 transition"
                    >
                      <Edit2 size={13} />
                    </button>

                    <button 
                      onClick={() => deleteChannel(chan.id, chan.nameAr)}
                      className="p-2 bg-brand-card hover:bg-brand-live/15 hover:text-brand-live text-zinc-500 rounded-xl border border-white/5 transition cursor-pointer"
                      title="حذف القناة نهائياً"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB PAGE 4: CRUD VOD MOVIES/SERIES */}
      {activeSubTab === 'movies' && (
        selectedSeriesForEpisodes ? (
          <div className="bg-brand-secondary border border-white/[0.04] p-6 rounded-[32px] space-y-6" id="episode-manager-panel">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.04] gap-4 text-right" dir="rtl">
              <div>
                <button 
                  onClick={() => setSelectedSeriesForEpisodes(null)}
                  className="px-3.5 py-1.5 bg-brand-card hover:bg-white/5 border border-white/5 text-xs rounded-xl font-bold text-brand-accent transition flex items-center gap-1.5 mb-2"
                >
                  ← {lang === 'ar' ? 'الرجوع ومسح التحديد' : 'Back to Cinema List'}
                </button>
                <h3 className="text-lg font-black text-white flex items-center gap-2 justify-end">
                  <span>📺 {lang === 'ar' ? 'إدارة حلقات وجلسات المسلسل' : 'Series Episode Manager'}</span>
                </h3>
                <p className="text-xs text-brand-muted mt-1">
                  {lang === 'ar' ? 'المسلسل المحدد حالياً:' : 'Active Series:'} <span className="text-white font-black">{selectedSeriesForEpisodes.titleAr}</span>
                </p>
              </div>

              <div className="bg-brand-card/55 border border-white/5 px-4 py-2.5 rounded-2xl shrink-0 text-center sm:text-right">
                <span className="text-[10px] text-zinc-500 font-mono block uppercase">TOTAL EPISODES</span>
                <span className="text-lg font-black text-brand-accent font-mono">
                  {selectedSeriesForEpisodes.seasons?.[0]?.episodes?.length || 0}
                </span>
              </div>
            </div>

            {/* Bulk Generator Card */}
            <div className="bg-brand-card/40 border border-white/[0.03] p-5 rounded-[24px] space-y-4 text-right" dir="rtl">
              <div className="flex items-center gap-1.5 justify-end">
                <Sparkles size={16} className="text-brand-accent animate-pulse" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider">{lang === 'ar' ? '⚡ منشئ الحلقات والأجزاء السريع والذكي (Bulk Generator)' : '⚡ Smart Bulk Episode Generator'}</h4>
              </div>
              <p className="text-[11px] text-brand-muted leading-relaxed">
                {lang === 'ar' 
                  ? 'هل تريد إضافة 100 حلقة أو أكثر لـ "وادي الذئاب" دفعة واحدة؟ املأ الحقول أدناه لتوليد الحلقات وتسميتها وحقن روابط البث لها بثوانٍ معدودة!'
                  : 'Do you want to inject 100+ episodes at once? Specify count, prefixes and URL parameters below to generate automatically.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-black text-[10px] block">الاسم المسبق بالعربي</label>
                  <input 
                    type="text" 
                    value={bulkTitlePrefixAr} 
                    onChange={(e) => setBulkTitlePrefixAr(e.target.value)}
                    placeholder="مثال: الحلقة " 
                    className="w-full bg-brand-bg/80 border border-white/5 text-white p-2.5 rounded-xl outline-none"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1 text-left" dir="ltr">
                  <label className="text-zinc-400 font-black text-[10px] block text-right">الاسم المسبق بالإنجليزي</label>
                  <input 
                    type="text" 
                    value={bulkTitlePrefixEn} 
                    onChange={(e) => setBulkTitlePrefixEn(e.target.value)}
                    placeholder="e.g. Episode " 
                    className="w-full bg-brand-bg/80 border border-white/5 text-white p-2.5 rounded-xl outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-black text-[10px] block">عدد الحلقات لتوليدها</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="300"
                    value={bulkEpisodesCount} 
                    onChange={(e) => setBulkEpisodesCount(Number(e.target.value))}
                    className="w-full bg-brand-bg/80 border border-white/5 text-white p-2.5 rounded-xl outline-none font-mono text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-black text-[10px] block">مدة الحلقة التقريبية</label>
                  <input 
                    type="text" 
                    value={bulkDuration} 
                    onChange={(e) => setBulkDuration(e.target.value)}
                    placeholder="45m" 
                    className="w-full bg-brand-bg/80 border border-white/5 text-white p-2.5 rounded-xl outline-none font-mono text-center"
                  />
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="space-y-1 text-left" dir="ltr">
                  <label className="text-zinc-400 font-black text-[10px] block text-right flex justify-between" dir="rtl">
                    <span>رابط البث أو تمبلت الصيغة</span>
                    <span className="text-[9px] text-zinc-500 font-normal">استخدم رمز [NUM] ليحل محله رقم الحلقة ديناميكياً</span>
                  </label>
                  <input 
                    type="text" 
                    value={bulkStreamUrlTemplate}
                    onChange={(e) => setBulkStreamUrlTemplate(e.target.value)}
                    placeholder="https://test-streams.mux.dev/x36xhg/main.m3u8"
                    className="w-full bg-brand-bg/85 border border-white/5 text-white p-3 rounded-xl outline-none font-mono text-[11px]"
                  />
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!bulkTitlePrefixAr.trim() || bulkEpisodesCount <= 0) return;
                      const episodesArr: Episode[] = [];
                      for (let i = 1; i <= bulkEpisodesCount; i++) {
                        const url = bulkStreamUrlTemplate.includes('[NUM]')
                          ? bulkStreamUrlTemplate.replace('[NUM]', i.toString())
                          : bulkStreamUrlTemplate;
                        episodesArr.push({
                          id: 'ep_bulk_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substring(2, 6),
                          titleAr: `${bulkTitlePrefixAr}${i}`,
                          titleEn: `${bulkTitlePrefixEn}${i}`,
                          episodeNumber: i,
                          duration: bulkDuration || '45m',
                          streamUrl: url
                        });
                      }

                      const updatedVods = moviesAndSeries.map(v => {
                        if (v.id === selectedSeriesForEpisodes.id) {
                          return {
                            ...v,
                            seasons: [
                              {
                                id: v.seasons?.[0]?.id || ('season_' + Date.now()),
                                seasonNumber: bulkSeason || 1,
                                episodes: episodesArr
                              }
                            ]
                          };
                        }
                        return v;
                      });

                      onUpdateVods(updatedVods);
                      
                      // Keep active select fresh
                      const refreshed = updatedVods.find(v => v.id === selectedSeriesForEpisodes.id);
                      if (refreshed) {
                        setSelectedSeriesForEpisodes(refreshed);
                      }

                      onNotify?.(lang === 'ar' 
                        ? `🎉 بنجاح مذهل! تم إنشاء وتوليد عدد ${bulkEpisodesCount} حلقة لـ "${selectedSeriesForEpisodes.titleAr}"!` 
                        : `🎉 Successfully generated ${bulkEpisodesCount} episodes for "${selectedSeriesForEpisodes.titleAr}"!`
                      );
                    }}
                    className="flex-1 py-3 bg-brand-accent hover:opacity-90 text-brand-bg font-black rounded-xl text-center shadow-[0_4px_12px_rgba(0,194,255,0.2)] transition active:scale-[0.98] cursor-pointer"
                  >
                    🚀 توليد وحقن الـ {bulkEpisodesCount} حلقة فوراً بنقرة واحدة!
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmAction({
                        message: lang === 'ar' ? 'هل تريد حذف كافة الحلقات الحالية وتفريغ هذا المسلسل؟' : 'Clear all episodes for this series?',
                        onConfirm: () => {
                          const updatedVods = moviesAndSeries.map(v => {
                            if (v.id === selectedSeriesForEpisodes.id) {
                              return {
                                ...v,
                                seasons: [{ id: 'season_clean_' + Date.now(), seasonNumber: 1, episodes: [] }]
                              };
                            }
                            return v;
                          });
                          onUpdateVods(updatedVods);
                          const refreshed = updatedVods.find(v => v.id === selectedSeriesForEpisodes.id);
                          if (refreshed) setSelectedSeriesForEpisodes(refreshed);
                          onNotify?.(lang === 'ar' ? '🗑️ تم إفراغ وحذف جميع حلقات المسلسل.' : '🗑️ Episodes cleared.');
                        }
                      });
                    }}
                    className="px-4 py-3 bg-brand-live hover:opacity-80 text-white font-black rounded-xl text-xs transition shrink-0 cursor-pointer"
                  >
                    مسح كافة الحلقات
                  </button>
                </div>
              </div>
            </div>

            {/* Current Episodes Table / Editor List */}
            <div className="space-y-3.5 text-right" dir="rtl">
              <h4 className="text-xs font-black text-brand-muted tracking-wider uppercase flex items-center gap-1.5 justify-end">
                <span>🍿 الحلقات النشطة حالياً في المسار:</span>
              </h4>

              <div className="bg-brand-card/35 rounded-2xl border border-white/[0.03] overflow-hidden max-h-[500px] overflow-y-auto divide-y divide-white/[0.04] scrollbar-thin">
                {(selectedSeriesForEpisodes.seasons?.[0]?.episodes || []).length === 0 ? (
                  <div className="p-10 text-center text-zinc-500 italic">
                    {lang === 'ar' ? 'لا توجد حلقات مضافة حالياً. استخدم المولّد التلقائي بالأعلى لتوليد الحلقات!' : 'No episodes present. Use the generator above!'}
                  </div>
                ) : (
                  (selectedSeriesForEpisodes.seasons?.[0]?.episodes || []).map((ep, index) => (
                    <div key={ep.id} className="p-3.5 flex flex-col md:flex-row items-stretch md:items-center gap-3 hover:bg-white/[0.01] transition">
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="w-8 h-8 rounded-lg bg-brand-bg border border-white/5 flex items-center justify-center text-xs font-black text-brand-accent font-mono">
                          {ep.episodeNumber}
                        </span>
                        <div className="truncate w-36 text-right">
                          <span className="text-white font-black text-xs block truncate">{ep.titleAr}</span>
                          <span className="text-[10px] text-zinc-500 block font-mono truncate">{ep.titleEn}</span>
                        </div>
                      </div>

                      {/* Inputs */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 text-right">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-zinc-500 shrink-0 font-bold uppercase">عربي</span>
                          <input 
                            type="text" 
                            value={ep.titleAr}
                            onChange={(e) => {
                              const title = e.target.value;
                              const updatedVods = moviesAndSeries.map(v => {
                                if (v.id === selectedSeriesForEpisodes.id) {
                                  const updatedEpisodes = [...(v.seasons?.[0]?.episodes || [])];
                                  updatedEpisodes[index] = { ...updatedEpisodes[index], titleAr: title };
                                  return { ...v, seasons: [{ ...v.seasons![0], episodes: updatedEpisodes }] };
                                }
                                return v;
                              });
                              onUpdateVods(updatedVods);
                              const refreshed = updatedVods.find(v => v.id === selectedSeriesForEpisodes.id);
                              if (refreshed) setSelectedSeriesForEpisodes(refreshed);
                            }}
                            className="flex-1 bg-brand-bg/60 border border-white/5 text-white px-2 py-1.5 rounded-lg text-xs outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-zinc-500 shrink-0 font-bold uppercase">En</span>
                          <input 
                            type="text" 
                            value={ep.titleEn}
                            onChange={(e) => {
                              const title = e.target.value;
                              const updatedVods = moviesAndSeries.map(v => {
                                if (v.id === selectedSeriesForEpisodes.id) {
                                  const updatedEpisodes = [...(v.seasons?.[0]?.episodes || [])];
                                  updatedEpisodes[index] = { ...updatedEpisodes[index], titleEn: title };
                                  return { ...v, seasons: [{ ...v.seasons![0], episodes: updatedEpisodes }] };
                                }
                                return v;
                              });
                              onUpdateVods(updatedVods);
                              const refreshed = updatedVods.find(v => v.id === selectedSeriesForEpisodes.id);
                              if (refreshed) setSelectedSeriesForEpisodes(refreshed);
                            }}
                            className="flex-1 bg-brand-bg/60 border border-white/5 text-white px-2 py-1.5 rounded-lg text-xs outline-none font-mono text-left"
                            dir="ltr"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-zinc-500 shrink-0 font-bold uppercase">HLS</span>
                          <input 
                            type="text" 
                            value={ep.streamUrl}
                            onChange={(e) => {
                              const url = e.target.value;
                              const updatedVods = moviesAndSeries.map(v => {
                                if (v.id === selectedSeriesForEpisodes.id) {
                                  const updatedEpisodes = [...(v.seasons?.[0]?.episodes || [])];
                                  updatedEpisodes[index] = { ...updatedEpisodes[index], streamUrl: url };
                                  return { ...v, seasons: [{ ...v.seasons![0], episodes: updatedEpisodes }] };
                                }
                                return v;
                              });
                              onUpdateVods(updatedVods);
                              const refreshed = updatedVods.find(v => v.id === selectedSeriesForEpisodes.id);
                              if (refreshed) setSelectedSeriesForEpisodes(refreshed);
                            }}
                            className="flex-1 bg-brand-bg/60 border border-white/5 text-white px-2 py-1.5 rounded-lg text-xs outline-none font-mono text-left"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      {/* Episode play/preview and single delete buttons */}
                      <div className="flex items-center gap-1.5 justify-end shrink-0">
                        {onPlayStream && (
                          <button
                            onClick={() => {
                              onPlayStream({
                                titleAr: `${selectedSeriesForEpisodes.titleAr} - ${ep.titleAr}`,
                                titleEn: `${selectedSeriesForEpisodes.titleEn} - ${ep.titleEn}`,
                                streamUrl: ep.streamUrl,
                                categoryAr: selectedSeriesForEpisodes.categoryAr,
                                categoryEn: selectedSeriesForEpisodes.categoryEn
                              }, false);
                              onNotify?.(lang === 'ar' ? `📺 معاينة الحلقة: "${ep.titleAr}" مفعّلة في المشغل!` : `Previewing episode: ${ep.titleEn}`);
                            }}
                            className="p-2 bg-brand-card hover:bg-brand-accent hover:text-brand-bg text-brand-accent rounded-xl border border-white/5 transition"
                            title={lang === 'ar' ? 'معاينة الحلقة' : 'Play Episode'}
                          >
                            <Play size={11} fill="currentColor" />
                          </button>
                        )}

                        <button 
                          onClick={() => {
                            const updatedEpisodes = (selectedSeriesForEpisodes.seasons?.[0]?.episodes || []).filter(e => e.id !== ep.id);
                            // Renumber episode sequence for perfection
                            const renumbered = updatedEpisodes.map((e, idx) => ({ ...e, episodeNumber: idx + 1 }));
                            
                            const updatedVods = moviesAndSeries.map(v => {
                              if (v.id === selectedSeriesForEpisodes.id) {
                                return { ...v, seasons: [{ ...v.seasons![0], episodes: renumbered }] };
                              }
                              return v;
                            });
                            
                            onUpdateVods(updatedVods);
                            const refreshed = updatedVods.find(v => v.id === selectedSeriesForEpisodes.id);
                            if (refreshed) setSelectedSeriesForEpisodes(refreshed);
                            onNotify?.(lang === 'ar' ? '🗑️ تم حذف الحلقة.' : '🗑️ Episode deleted.');
                          }}
                          className="p-2 bg-brand-card hover:bg-brand-live/15 hover:text-brand-live text-zinc-500 rounded-xl border border-white/5 transition"
                          title="حذف الحلقة"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cinema form input */}
            <div className="bg-brand-secondary border border-white/[0.04] p-5 rounded-[32px] space-y-4">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.04]">
                <h3 className="text-xs font-black text-brand-accent uppercase tracking-wider">
                  {editingId ? 'تعديل البيانات' : 'إضافة مواد سينما وفيديو (VOD) 🎬'}
                </h3>
                {editingId ? (
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditingId(null);
                      setVodForm({
                        titleAr: '', titleEn: '', type: 'movie',
                        poster: 'https://images.unsplash.com/photo-1540747737956-378724044432?w=500&auto=format&fit=crop&q=80',
                        backdrop: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=1200&auto=format&fit=crop&q=80',
                        categoryAr: '', categoryEn: '', rating: 4.5, year: 2025,
                        duration: '2h 00m', descriptionAr: '', descriptionEn: '',
                        streamUrl: 'https://test-streams.mux.dev/x36xhg/main.m3u8'
                      });
                      setFormEpisodes([]);
                      setEpNum(1);
                      setEpStreamUrl('');
                      setEpBackupUrl('');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-card hover:bg-white/5 border border-white/5 text-[10px] rounded-lg font-bold text-white transition shrink-0"
                  >
                    <span>إلغاء التعديل</span>
                    <RotateCcw size={11} className="text-brand-muted" />
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={autofillVod}
                    className="px-2.5 py-1 bg-brand-card hover:bg-white/5 border border-white/5 text-[10px] rounded font-bold text-brand-accent transition shrink-0 self-start sm:self-auto"
                  >
                    ⚡ تعبئة نموذج تلقائي
                  </button>
                )}
              </div>

              <form onSubmit={handleVodSubmit} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-brand-muted text-[10px] font-bold block">العنوان (عربي)</label>
                    <input 
                      type="text" required value={vodForm.titleAr}
                      onChange={(e) => setVodForm({...vodForm, titleAr: e.target.value})}
                      placeholder="رحلة مارادونا الأسطورية"
                      className="w-full bg-brand-card border border-white/[0.03] text-white p-2.5 rounded-xl outline-none focus:border-brand-accent"
                    />
                  </div>
                  <div className="space-y-1 text-left" dir="ltr">
                    <label className="text-brand-muted text-[10px] font-bold block text-right">Title (English)</label>
                    <input 
                      type="text" required value={vodForm.titleEn}
                      onChange={(e) => setVodForm({...vodForm, titleEn: e.target.value})}
                      className="w-full bg-brand-card border border-white/[0.03] text-white p-2.5 rounded-xl outline-none focus:border-brand-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-brand-muted text-[10px] font-bold block">نوع الملف</label>
                    <select 
                      value={vodForm.type}
                      onChange={(e) => {
                        const newType = e.target.value as any;
                        setVodForm(prev => ({...prev, type: newType}));
                        if (newType === 'series' && formEpisodes.length === 0) {
                          // Automatically generate 10 episodes as a starting template!
                          const defaultEps: Episode[] = [];
                          for (let i = 1; i <= 10; i++) {
                            defaultEps.push({
                              id: 'ep_form_' + Date.now() + '_' + i,
                              titleAr: `الحلقة ${i}`,
                              titleEn: `Episode ${i}`,
                              episodeNumber: i,
                              duration: '45m',
                              streamUrl: vodForm.streamUrl || 'https://test-streams.mux.dev/x36xhg/main.m3u8',
                              backupUrl: undefined
                            });
                          }
                          setFormEpisodes(defaultEps);
                          setEpNum(11);
                        }
                      }}
                      className="w-full bg-brand-card border border-white/[0.03] text-white p-2 rounded-xl outline-none focus:border-brand-accent cursor-pointer"
                    >
                      <option value="movie">فيلم سينما</option>
                      <option value="series">مسلسل تلفزيوني</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-brand-muted text-[10px] font-bold block">التصنيف الفني</label>
                    <select
                      value={vodCategories.some(c => c.nameAr === vodForm.categoryAr) ? vodForm.categoryAr : "manual"}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== "manual") {
                          setVodForm({...vodForm, categoryAr: val, categoryEn: val});
                        } else {
                          setVodForm({...vodForm, categoryAr: '', categoryEn: ''});
                        }
                      }}
                      className="w-full bg-brand-card border border-white/[0.03] text-white p-2.5 rounded-xl outline-none focus:border-brand-accent cursor-pointer mb-2 text-xs font-semibold"
                    >
                      <option value="">-- اختر من الأقسام المتاحة --</option>
                      {vodCategories.map((cat) => (
                        <option key={cat.id} value={cat.nameAr}>
                          {cat.icon} {cat.nameAr}
                        </option>
                      ))}
                      <option value="manual">✍️ كتابة تصنيف مخصص...</option>
                    </select>
                    {(!vodCategories.some(c => c.nameAr === vodForm.categoryAr) || vodForm.categoryAr === '') && (
                      <input 
                        type="text" required value={vodForm.categoryAr}
                        onChange={(e) => setVodForm({...vodForm, categoryAr: e.target.value, categoryEn: e.target.value})}
                        placeholder="مثل: حركة / دراما عائلية"
                        className="w-full bg-brand-card border border-white/[0.03] text-white p-2.5 rounded-xl outline-none focus:border-brand-accent font-semibold text-xs animate-fadeIn"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-left" dir="ltr">
                  <label className="text-brand-muted text-[10px] font-bold block text-right">رابط بوستر الغلاف</label>
                  <input 
                    type="text" value={vodForm.poster}
                    onChange={(e) => setVodForm({...vodForm, poster: e.target.value})}
                    className="w-full bg-brand-card border border-white/[0.03] text-white p-2.5 rounded-xl outline-none focus:border-brand-accent font-mono text-[10px]"
                  />
                </div>

                <div className="space-y-1 text-left" dir="ltr">
                  <label className="text-brand-muted text-[10px] font-bold block text-right">رابط البث الرئيسي لـ الحلقة / الفيلم</label>
                  <input 
                    type="text" value={vodForm.streamUrl}
                    onChange={(e) => setVodForm({...vodForm, streamUrl: e.target.value})}
                    className="w-full bg-brand-card border border-white/[0.03] text-white p-2.5 rounded-xl outline-none focus:border-brand-accent font-mono text-[10px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-brand-muted text-[10px] font-bold block">الوصف أو الملخص التاريخي (عربي)</label>
                  <textarea 
                    rows={2} value={vodForm.descriptionAr}
                    onChange={(e) => setVodForm({...vodForm, descriptionAr: e.target.value})}
                    className="w-full bg-brand-card border border-white/[0.03] text-white p-2.5 rounded-xl outline-none focus:border-brand-accent resize-none placeholder-zinc-650"
                    placeholder="اكتب نبذة مختصرة تظهر للزوار"
                  />
                </div>

                {/* Episodes Manager inline inside the Add/Edit form */}
                {vodForm.type === 'series' && (
                  <div className="p-4 bg-brand-card/40 border border-white/[0.04] rounded-2.5xl space-y-3.5 mt-2 shadow-inner">
                    <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                      <span className="text-zinc-300 font-black text-xs flex items-center gap-1">
                        <span>📺 إدارة الحلقات</span>
                      </span>
                      <span className="text-[10px] text-brand-accent font-mono bg-brand-accent/10 px-2 py-0.5 rounded-full font-bold">
                        {formEpisodes.length} {lang === 'ar' ? 'حلقات مضافة' : 'episodes'}
                      </span>
                    </div>

                    {/* Sequential Bulk generator inside form episodes */}
                    <div className="p-2.5 bg-brand-bg/50 border border-white/[0.02] rounded-xl space-y-2">
                      <span className="text-[10px] text-zinc-400 font-extrabold block text-right">⚡ توليد سريع ومتتالي للحلقات:</span>
                      <div className="flex flex-wrap gap-1">
                        <button 
                          type="button"
                          onClick={() => {
                            const newEps: Episode[] = [];
                            for (let i = 1; i <= 10; i++) {
                              newEps.push({
                                id: 'ep_form_' + Date.now() + '_' + i,
                                titleAr: `الحلقة ${i}`,
                                titleEn: `Episode ${i}`,
                                episodeNumber: i,
                                duration: '45m',
                                streamUrl: vodForm.streamUrl || 'https://test-streams.mux.dev/x36xhg/main.m3u8',
                                backupUrl: undefined
                              });
                            }
                            setFormEpisodes(newEps);
                            setEpNum(11);
                            onNotify('✅ تم توليد 10 حلقات بنجاح! اضغط على أي حلقة تحت لتعديل رابط البث الخاص بها مباشرة.');
                          }}
                          className="flex-1 py-1 px-1.5 bg-brand-card hover:bg-white/5 border border-white/5 text-[9px] rounded font-bold text-brand-accent transition text-center"
                        >
                          10 حلقات
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            const newEps: Episode[] = [];
                            for (let i = 1; i <= 30; i++) {
                              newEps.push({
                                id: 'ep_form_' + Date.now() + '_' + i,
                                titleAr: `الحلقة ${i}`,
                                titleEn: `Episode ${i}`,
                                episodeNumber: i,
                                duration: '45m',
                                streamUrl: vodForm.streamUrl || 'https://test-streams.mux.dev/x36xhg/main.m3u8',
                                backupUrl: undefined
                              });
                            }
                            setFormEpisodes(newEps);
                            setEpNum(31);
                            onNotify('✅ تم توليد 30 حلقة بنجاح! يمكن الضغط على الحلقة في القائمة وتحديث رابطها.');
                          }}
                          className="flex-1 py-1 px-1.5 bg-brand-card hover:bg-white/5 border border-white/5 text-[9px] rounded font-bold text-brand-accent transition text-center"
                        >
                          30 حلقة
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            const numStr = prompt(lang === 'ar' ? 'أدخل عدد الحلقات المطلوب توليدها تلقائياً:' : 'Enter number of episodes to generate:');
                            const count = parseInt(numStr || '0');
                            if (isNaN(count) || count <= 0) return;
                            const newEps: Episode[] = [];
                            for (let i = 1; i <= count; i++) {
                              newEps.push({
                                id: 'ep_form_' + Date.now() + '_' + i,
                                titleAr: `الحلقة ${i}`,
                                titleEn: `Episode ${i}`,
                                episodeNumber: i,
                                duration: '45m',
                                streamUrl: vodForm.streamUrl || 'https://test-streams.mux.dev/x36xhg/main.m3u8',
                                backupUrl: undefined
                              });
                            }
                            setFormEpisodes(newEps);
                            setEpNum(count + 1);
                            onNotify(`✅ تم توليد ${count} حلقة بنجاح بنقرة واحدة!`);
                          }}
                          className="px-2 py-1 bg-brand-card hover:bg-white/5 border border-white/5 text-[9px] rounded font-bold text-zinc-400 transition"
                        >
                          {lang === 'ar' ? 'مخصص ⚙️' : 'Custom'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 items-end">
                      <div className="col-span-1 space-y-1">
                        <label className="text-brand-muted text-[9px] font-bold block text-right">رقم الحلقة</label>
                        <input 
                          type="number" 
                          min="1"
                          value={epNum}
                          onChange={(e) => setEpNum(Number(e.target.value))}
                          className="w-full bg-brand-bg border border-white/[0.03] text-white p-2 rounded-xl outline-none text-center font-mono font-bold text-xs"
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <label className="text-brand-muted text-[9px] font-bold block text-right">رابط بث الحلقة (فيديو)</label>
                        <input 
                          type="text" 
                          value={epStreamUrl}
                          onChange={(e) => setEpStreamUrl(e.target.value)}
                          placeholder="https://server.com/ep1.m3u8"
                          className="w-full bg-brand-bg border border-white/[0.03] text-white p-2 rounded-xl outline-none font-mono text-[10px]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-brand-muted text-[9px] font-bold block text-right">رابط الصوت الإضافي / احتياطي (اختياري)</label>
                      <input 
                        type="text" 
                        value={epBackupUrl}
                        onChange={(e) => setEpBackupUrl(e.target.value)}
                        placeholder="رابط بث احتياطي أو صوتي"
                        className="w-full bg-brand-bg border border-white/[0.03] text-white p-2 rounded-xl outline-none font-mono text-[10px]"
                      />
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        if (!epStreamUrl.trim()) {
                          onNotify(lang === 'ar' ? '⚠️ يرجى إضافة رابط بث أولاً!' : '⚠️ Stream URL is required!');
                          return;
                        }
                        const newEp: Episode = {
                          id: 'ep_form_' + Date.now() + '_' + epNum,
                          titleAr: `الحلقة ${epNum}`,
                          titleEn: `Episode ${epNum}`,
                          episodeNumber: epNum,
                          duration: '45m',
                          streamUrl: epStreamUrl.trim(),
                          backupUrl: epBackupUrl.trim() || undefined
                        };

                        const exists = formEpisodes.some(e => e.episodeNumber === epNum);
                        let updatedList: Episode[] = [];
                        if (exists) {
                          updatedList = formEpisodes.map(e => e.episodeNumber === epNum ? { ...e, streamUrl: epStreamUrl.trim(), backupUrl: epBackupUrl.trim() || undefined } : e);
                          setFormEpisodes(updatedList);
                          onNotify(`✅ تم تحديث الحلقة ${epNum}`);
                        } else {
                          updatedList = [...formEpisodes, newEp].sort((a,b) => a.episodeNumber - b.episodeNumber);
                          setFormEpisodes(updatedList);
                          onNotify(`✅ تم إضافة الحلقة ${epNum}`);
                        }

                        setEpStreamUrl('');
                        setEpBackupUrl('');
                        setEpNum(updatedList.length + 1);
                      }}
                      className="w-full py-2 bg-[#00a65a] hover:opacity-90 text-white font-extrabold rounded-xl text-center text-[11px] shadow-sm transition active:scale-[0.98] cursor-pointer"
                    >
                      {formEpisodes.some(e => e.episodeNumber === epNum) ? `✓ حفظ تعديل الحلقة ${epNum}` : 'إضافة حلقة جديدة'}
                    </button>

                    {formEpisodes.length > 0 && (
                      <div className="space-y-1.5 pt-1.5 border-t border-white/[0.03]">
                        <label className="text-zinc-500 text-[9px] font-bold block text-right">قائمة الحلقات الحالية (اضغط للتعديل):</label>
                        <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto scrollbar-thin">
                          {formEpisodes.map((ep) => {
                            const isSelected = epNum === ep.episodeNumber;
                            return (
                              <div 
                                key={ep.id} 
                                onClick={() => {
                                  setEpNum(ep.episodeNumber);
                                  setEpStreamUrl(ep.streamUrl || '');
                                  setEpBackupUrl(ep.backupUrl || '');
                                }}
                                className={`group flex items-center gap-1.5 border pl-1.5 pr-2.5 py-1 rounded-lg text-[9px] font-black transition cursor-pointer select-none ${
                                  isSelected 
                                    ? 'bg-brand-accent/20 border-brand-accent text-brand-accent font-black' 
                                    : 'bg-white/[0.03] border-white/[0.04] text-zinc-350 hover:bg-white/[0.06]'
                                }`}
                                title={lang === 'ar' ? 'انقر لتعديل هذه الحلقة' : 'Click to edit this episode'}
                              >
                                <span>الحلقة {ep.episodeNumber}</span>
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormEpisodes(formEpisodes.filter(itm => itm.id !== ep.id));
                                    if (epNum === ep.episodeNumber) {
                                      setEpStreamUrl('');
                                      setEpBackupUrl('');
                                    }
                                  }}
                                  className="text-zinc-550 hover:text-brand-live transition font-bold"
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full py-3 bg-brand-accent hover:opacity-90 text-brand-bg font-black rounded-2xl block text-center shadow-[0_4px_12px_rgba(0,194,255,0.2)] transition cursor-pointer"
                >
                  {editingId ? 'تحديث المحتوى' : '+ دمج وتثبيت المادة بالسينما'}
                </button>
              </form>
            </div>

            {/* List of VODs */}
            <div className="col-span-1 lg:col-span-2 space-y-3">
              <h4 className="text-xs font-black text-brand-muted font-mono tracking-wider uppercase">On-Demand VOD Cinema Library Archive:</h4>

              {/* M3U Selection and Export Toolbar for VOD */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-brand-card/45 border border-white/[0.04] rounded-2xl text-right animate-fadeIn" dir="rtl">
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-xs text-brand-muted">
                    {lang === 'ar' ? `المحددة للتصدير: ${selectedVods.length} مادة` : `Selected for Export: ${selectedVods.length} items`}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVods(moviesAndSeries.map(m => m.id));
                      onNotify(lang === 'ar' ? '✅ تم تحديد جميع الأفلام والمسلسلات لتصديرها!' : 'Selected all items!');
                    }}
                    className="px-2.5 py-1.5 bg-brand-card hover:bg-zinc-800 text-[10px] text-zinc-350 font-bold rounded-lg border border-white/[0.04] transition cursor-pointer"
                  >
                    {lang === 'ar' ? 'تحديد الكل 🗹' : 'Select All'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVods([]);
                      onNotify(lang === 'ar' ? '🧹 تم إلغاء تحديد الأفلام والمسلسلات!' : 'Deselected all VOD items!');
                    }}
                    className="px-2.5 py-1.5 bg-brand-card hover:bg-zinc-800 text-[10px] text-zinc-350 font-bold rounded-lg border border-white/[0.04] transition cursor-pointer"
                  >
                    {lang === 'ar' ? 'إلغاء التحديد ☐' : 'Deselect All'}
                  </button>
                  <button
                    type="button"
                    onClick={generateM3uContentAndOpenModal}
                    disabled={selectedVods.length === 0}
                    className={`px-3.5 py-1.5 font-bold text-[10px] rounded-lg transition flex items-center gap-1 cursor-pointer ${
                      selectedVods.length > 0
                        ? 'bg-gradient-to-r from-brand-accent to-[#0099CC] text-brand-bg shadow-[0_0_15px_rgba(0,194,255,0.2)] font-black'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span>📥 {lang === 'ar' ? 'تصدير M3U للمحددة' : 'Export Selected'}</span>
                  </button>
                </div>
              </div>
              
              <div className="space-y-2.5">
                {moviesAndSeries.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-brand-card/30 border border-white/[0.03] rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-white/10 transition"
                  >
                    <div className="flex items-center gap-3.5 truncate">
                      {/* Checkbox for Export Selection */}
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedVods.includes(item.id)) {
                            setSelectedVods(selectedVods.filter(id => id !== item.id));
                          } else {
                            setSelectedVods([...selectedVods, item.id]);
                          }
                        }}
                        className="text-brand-muted hover:text-brand-accent transition shrink-0 mr-1 cursor-pointer"
                      >
                        {selectedVods.includes(item.id) ? (
                          <CheckSquare size={16} className="text-brand-accent font-black animate-scaleIn" />
                        ) : (
                          <Square size={16} className="opacity-40" />
                        )}
                      </button>

                      <img src={item.poster} alt="" className="w-9 h-12 object-cover rounded-xl bg-black shrink-0" onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=100&auto=format&fit=crop&q=60';
                      }} />
                      <div className="truncate text-left font-sans">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-[9px] px-2 py-0.5 rounded font-mono uppercase">{item.type}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">{item.year}</span>
                        </div>
                        <h4 className="text-xs font-black text-white mt-1.5 truncate max-w-[200px] md:max-w-none">{item.titleAr}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onPlayStream && (
                        <button 
                          onClick={() => {
                            if (item.type === 'movie') {
                              onPlayStream({ titleAr: item.titleAr, titleEn: item.titleEn, streamUrl: item.streamUrl, categoryAr: item.categoryAr, categoryEn: item.categoryEn }, false);
                            } else {
                              const firstEp = item.seasons?.[0]?.episodes?.[0];
                              const playUrl = firstEp?.streamUrl || item.streamUrl;
                              onPlayStream({ 
                                titleAr: item.titleAr + ' - ' + (firstEp?.titleAr || 'الحلقة الأولى'), 
                                titleEn: item.titleEn + ' - ' + (firstEp?.titleEn || 'Episode 1'), 
                                streamUrl: playUrl,
                                categoryAr: item.categoryAr,
                                categoryEn: item.categoryEn
                              }, false);
                            }
                            onNotify(lang === 'ar' ? `🎬 جاري تشغيل ومعاينة "${item.titleAr}" في المشغل الرئيسي للمشاهدة والتأكد!` : `🎬 Playing "${item.titleEn}" preview!`);
                          }}
                          className="p-2 bg-brand-card hover:bg-brand-accent hover:text-brand-bg text-brand-accent rounded-xl border border-white/5 transition"
                          title={lang === 'ar' ? 'تشغيل ومعاينة' : 'Play & Preview'}
                        >
                          <Play size={13} fill="currentColor" />
                        </button>
                      )}

                      {item.type === 'series' && (
                        <button 
                          type="button"
                          onClick={() => {
                            setSelectedSeriesForEpisodes(item);
                            // Set defaults based on item if it already has sequences
                            if ((item.seasons?.[0]?.episodes || []).length > 0) {
                              setBulkEpisodesCount(item.seasons?.[0]?.episodes?.length || 100);
                            } else {
                              setBulkEpisodesCount(100);
                            }
                          }}
                          className="px-3 py-2 bg-brand-accent/10 hover:bg-brand-accent/25 border border-brand-accent/20 text-brand-accent text-xs rounded-xl font-bold transition flex items-center gap-1 cursor-pointer"
                          title={lang === 'ar' ? 'إضافة وإدارة حلقات هذا المسلسل جماعياً' : 'Manage Episodes'}
                        >
                          <span>📺 الحلقات</span>
                          <span className="bg-brand-accent/20 text-brand-accent px-1.5 py-0.5 rounded text-[10px] font-mono leading-none">
                            {item.seasons?.[0]?.episodes?.length || 0}
                          </span>
                        </button>
                      )}

                      <button 
                        onClick={() => {
                          setEditingId(item.id);
                          setVodForm({
                            titleAr: item.titleAr, titleEn: item.titleEn, type: item.type,
                            poster: item.poster, backdrop: item.backdrop || '',
                            categoryAr: item.categoryAr || '', categoryEn: item.categoryEn || '',
                            rating: item.rating || 4.5, year: item.year || 2024,
                            duration: item.duration || '2h 00m', descriptionAr: item.descriptionAr || '',
                            descriptionEn: item.descriptionEn || '', streamUrl: item.streamUrl || 'https://test-streams.mux.dev/x36xhg/main.m3u8'
                          });
                          const episodesList = item.seasons?.[0]?.episodes || [];
                          setFormEpisodes(episodesList);
                          setEpNum(episodesList.length + 1);
                        }}
                        className="p-2 bg-brand-card hover:bg-brand-bg text-brand-accent rounded-xl border border-white/5 transition"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button 
                        onClick={() => deleteVod(item.id, item.titleAr)}
                        className="p-2 bg-brand-card hover:bg-brand-live/15 hover:text-brand-live text-zinc-500 rounded-xl border border-white/5 transition cursor-pointer"
                        title="حذف هذا العمل نهائياً"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {/* SUB PAGE 4: M3U IMPORT */}
      {activeSubTab === 'm3u_import' && (
        <div className="bg-brand-secondary border border-white/[0.04] p-6 rounded-[32px] space-y-6 max-w-4xl mx-auto" id="m3u-import-panel">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-white/[0.04] gap-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span className="text-xl">📥</span>
                <span>{lang === 'ar' ? 'استيراد دفعة قنوات IPTV أو مسلسلات (M3U)' : 'Bulk Import IPTV Channels or Series (M3U)'}</span>
              </h3>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                {lang === 'ar' 
                  ? 'ألصق كود ملف الـ M3U هنا وسنقوم بتحليل الشعارات والمجموعات والقنوات وإضافتها فوراً.' 
                  : 'Paste your M3U playlist content here to automatically extract and register multiple assets.'}
              </p>
            </div>
            
            <button 
              type="button" 
              onClick={loadM3uExample}
              className="px-3 py-1.5 bg-brand-card hover:bg-white/5 border border-white/5 text-xs rounded-xl font-bold text-brand-accent transition self-start flex items-center gap-1.5"
            >
              ⚡ {lang === 'ar' ? 'تحميل كود تجريبي (ألوان الرياضية)' : 'Load Example M3U'}
            </button>
          </div>

          {importReport && (
            <div className={`p-4 rounded-2xl border text-xs flex items-start gap-2.5 ${
              importReport.success 
                ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/15 text-rose-400'
            }`}>
              <span className="text-base mt-0.5 shrink-0">{importReport.success ? '🏆' : '⚠️'}</span>
              <div>
                <p className="font-bold">{importReport.success ? (lang === 'ar' ? 'تم الاستيراد بنجاح!' : 'Import Succeeded!') : (lang === 'ar' ? 'خطأ في التحليل!' : 'Parsing Failed!')}</p>
                <p className="mt-1 font-semibold opacity-90">{importReport.message}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleM3uImport} className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-brand-card/50 p-4 rounded-2xl border border-white/[0.03]">
              
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block">
                  {lang === 'ar' ? 'نوع الاستيراد المستهدف' : 'Target Asset Type'}
                </label>
                <div className="flex bg-brand-bg rounded-xl p-1 border border-white/5">
                  <button
                    type="button"
                    onClick={() => setM3uType('channel')}
                    className={`flex-1 py-1.5 text-center text-[11px] font-bold rounded-lg transition ${
                      m3uType === 'channel' ? 'bg-brand-accent text-brand-bg font-black font-heading' : 'text-brand-muted hover:text-white'
                    }`}
                  >
                    📡 {lang === 'ar' ? 'قنوات IPTV' : 'IPTV Channels'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setM3uType('series')}
                    className={`flex-1 py-1.5 text-center text-[11px] font-bold rounded-lg transition ${
                      m3uType === 'series' ? 'bg-brand-accent text-brand-bg font-black font-heading' : 'text-brand-muted hover:text-white'
                    }`}
                  >
                    📺 {lang === 'ar' ? 'مسلسلات' : 'Series / VOD'}
                  </button>
                </div>
              </div>

              {m3uType === 'channel' ? (
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block">
                    {lang === 'ar' ? 'التصنيف الافتراضي للمجموعات المجهولة' : 'Default Channel Category'}
                  </label>
                  <select
                    value={m3uDefaultCategory}
                    onChange={(e) => setM3uDefaultCategory(e.target.value)}
                    className="w-full bg-brand-bg border border-white/5 text-white p-2 text-xs rounded-xl outline-none focus:border-brand-accent h-[36px] cursor-pointer font-sans"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon || '📁'} {lang === 'ar' ? cat.nameAr : cat.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block">
                    {lang === 'ar' ? 'اسم تصنيف المسلسلات المستوردة' : 'Series Category Label'}
                  </label>
                  <input
                    type="text"
                    value={m3uSeriesCategoryAr}
                    onChange={(e) => setM3uSeriesCategoryAr(e.target.value)}
                    placeholder="مثل: مسلسلات رياضية"
                    className="w-full bg-brand-bg border border-white/5 text-white p-2 text-xs rounded-xl outline-none focus:border-brand-accent h-[36px] font-sans"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block">
                  {lang === 'ar' ? 'بث مستقر بجودة عالية' : 'Stream Pipeline'}
                </label>
                <div className="py-2.5 px-3 bg-brand-bg/50 border border-white/5 text-[11px] text-zinc-400 rounded-xl font-mono">
                  🟢 M3U SECURED TUNNEL
                </div>
              </div>

            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block">
                {lang === 'ar' ? 'محتوى ملف M3U / M3U8' : 'M3U / M3U8 Playlist Content'}
              </label>
              <textarea
                required
                rows={12}
                value={m3uText}
                onChange={(e) => setM3uText(e.target.value)}
                placeholder={lang === 'ar' ? `#EXTM3U\n#EXTINF:-1 tvg-logo="https://..." group-title="رياضة",اسم القناة\nhttp://server.com/live.m3u8` : `#EXTM3U\n#EXTINF:-1 tvg-logo="https://..." group-title="Sports",Channel Name\nhttp://server.com/live.m3u8`}
                className="w-full bg-brand-card focus:bg-brand-card/85 border border-white/[0.04] focus:border-brand-accent/55 text-white p-4 rounded-2xl font-mono text-xs leading-relaxed outline-none focus:shadow-[0_0_20px_rgba(0,194,255,0.15)] transition-all duration-300 placeholder-zinc-700"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-brand-accent hover:opacity-90 text-brand-bg font-black text-sm rounded-2xl block text-center shadow-[0_4px_15px_rgba(0,194,255,0.3)] select-none transition"
            >
              📥 {lang === 'ar' ? 'تحليل واستيراد البيانات دفعة واحدة' : 'Analyze & Import M3U Data Now'}
            </button>
          </form>
        </div>
      )}

      {/* SUB PAGE 5: ADS & REVENUES CONFIGURATION */}
      {activeSubTab === 'ads' && (
        <div className="bg-brand-secondary border border-white/[0.04] p-6 rounded-[32px] space-y-6 max-w-4xl mx-auto" id="ads-pricing-panel">
          <div className="pb-3 border-b border-white/[0.04]">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span className="text-xl">💰</span>
              <span>{lang === 'ar' ? 'إعدادات شبكات الإعلانات والربح الفوري' : 'Ad Networks Monetization Setup'}</span>
            </h3>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">
              {lang === 'ar' 
                ? 'قم بتهيئة مساحات الإعلانات وكود الربح لتطبيقك. يمكنك استخدام الإعلانات المدمجة، أو إعلانات Start.io، أو Google Admob، أو PropellerAds/Adsterra بكل سهولة.' 
                : 'Configure banner locations and interstitial properties. Add direct scripts to connect AdMob / Start.io web elements.'}
            </p>
          </div>

          <form onSubmit={handleSaveAds} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* ADS TOGGLE & PROVIDER */}
              <div className="bg-brand-card/45 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-black text-brand-accent uppercase tracking-wider">⚡ {lang === 'ar' ? 'الحالة العامة والشبكة' : 'General & Network Provider'}</h4>
                
                <div className="flex items-center justify-between p-3 bg-brand-bg/50 border border-white/5 rounded-xl">
                  <span className="text-xs text-white font-black">{lang === 'ar' ? 'تفعيل الإعلانات للتطبيق' : 'Enable Advertisements'}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={adsActive}
                      onChange={(e) => setAdsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent peer-checked:after:bg-brand-bg"></div>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-heading font-black text-[10.5px] uppercase tracking-wide block">
                    {lang === 'ar' ? 'مزود خدمة الإعلانات' : 'Ad Platform Provider'}
                  </label>
                  <select
                    value={adsProvider}
                    onChange={(e) => setAdsProvider(e.target.value as any)}
                    className="w-full bg-brand-bg border border-white/5 text-white p-2 text-xs rounded-xl outline-none focus:border-brand-accent h-[38px] font-sans"
                  >
                    <option value="custom">{lang === 'ar' ? 'إعلانات مخصصة (شعارات + روابط تليجرام/موقعك)' : 'Custom Ad (Image + Link)'}</option>
                    <option value="admob">{lang === 'ar' ? 'Google AdMob (عبر WebView/Capacitor)' : 'Google AdMob (WebView wrapped)'}</option>
                    <option value="startio">{lang === 'ar' ? 'Start.io (كود الأرباح الذكي للويب)' : 'Start.io web integration'}</option>
                    <option value="adsense">{lang === 'ar' ? 'Google AdSense (مربع بنر مخصص)' : 'Google AdSense slot'}</option>
                  </select>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* SUB PAGE 6: CATEGORIES & SECTIONS MANAGEMENT */}
      {activeSubTab === 'categories' && (
        <div className="bg-brand-secondary border border-white/[0.04] p-6 rounded-[32px] space-y-6 max-w-4xl mx-auto text-right" dir="rtl" id="categories-management-panel">
          <div className="pb-3 border-b border-white/[0.04] text-right">
            <h3 className="text-base font-black text-white flex items-center gap-2 justify-end">
              <span className="text-xl">🗂️</span>
              <span>إدارة الأقسام وتصنيفات القنوات</span>
            </h3>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">
              تحكم كامل في الأقسام المعروضة لقنوات البث المباشر. يمكنك إضافة أقسام جديدة، وتنظيمها، وتوزيع القنوات بأمان.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ADD COMPONENT */}
            <div className="md:col-span-1 space-y-4">
              <div className="bg-brand-card/45 border border-white/[0.03] p-5 rounded-3xl space-y-4">
                <h4 className="text-xs font-black text-brand-accent uppercase tracking-widest block text-right border-b border-white/[0.04] pb-2">
                  {editingCategory ? '✏️ تعديل القسم الحالي' : '✨ إضافة قسم جديد'}
                </h4>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  
                  if (editingCategory) {
                    // Edit Existing Channel Category
                    const updated = categories.map(c => c.id === editingCategory.id ? {
                      ...c,
                      nameAr: catNameArVal.trim(),
                      nameEn: catNameArVal.trim(),
                      icon: catIconVal.trim() || '📁',
                      parentId: catParentIdVal
                    } : c);
                    onUpdateCategories(updated);
                    onNotify(`✅ تم تحديث قسم "${catNameArVal}" بنجاح!`);
                    setEditingCategory(null);
                    setCatNameArVal('');
                    setCatIconVal('');
                    setCatIdVal('');
                    setCatParentIdVal('channels');
                  } else {
                    // Add New Channel Category
                    const id = catIdVal.trim().toLowerCase().replace(/\s+/g, '_');
                    if (!catNameArVal.trim() || !id) {
                      onNotify('⚠️ يرجى ملء حقول الاسم والمعرف الفريد!');
                      return;
                    }
                    if (categories.some(c => c.id === id)) {
                      onNotify('⚠️ هذا المعرف الفريد مستخدم بالفعل لقسم آخر!');
                      return;
                    }
                    
                    const newCategory = { id, nameAr: catNameArVal.trim(), nameEn: catNameArVal.trim(), icon: catIconVal.trim() || '📁', parentId: catParentIdVal };
                    onUpdateCategories([...categories, newCategory]);
                    onNotify(`✅ تم إضافة قسم "${catNameArVal}" بنجاح!`);
                    setCatNameArVal('');
                    setCatIconVal('');
                    setCatIdVal('');
                    setCatParentIdVal('channels');
                  }
                }} className="space-y-3.5 text-xs text-right font-semibold">
                  <div className="space-y-1">
                    <label className="text-zinc-400 block mb-1">القسم الرئيسي (Parent Section)</label>
                    <select
                      value={catParentIdVal || 'channels'}
                      onChange={(e) => setCatParentIdVal(e.target.value as 'channels')}
                      className="w-full bg-brand-bg border border-white/[0.04] text-white p-2.5 rounded-xl outline-none focus:border-brand-accent cursor-pointer text-xs font-semibold"
                    >
                      <option value="channels">📺 قسم قنوات البث المباشر (TV Channels Group)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 block mb-1">معرّف القسم الفريد (بالانجليزي بدون مسافات)</label>
                    <input 
                      type="text" required placeholder="e.g. movies_exclusive"
                      value={catIdVal}
                      onChange={(e) => setCatIdVal(e.target.value)}
                      disabled={!!editingCategory}
                      className={`w-full bg-brand-bg border border-white/[0.04] text-white p-2.5 rounded-xl outline-none focus:border-brand-accent text-left font-mono ${editingCategory ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 block mb-1">اسم القسم</label>
                    <input 
                      type="text" required placeholder="مثال: باقة روتانا سينما"
                      value={catNameArVal}
                      onChange={(e) => setCatNameArVal(e.target.value)}
                      className="w-full bg-brand-bg border border-white/[0.04] text-white p-2.5 rounded-xl outline-none focus:border-brand-accent text-right"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 block mb-1">أيقونة أو إيموجي القسم</label>
                    <input 
                      type="text" placeholder="مثال: 📺 أو 🍿"
                      value={catIconVal}
                      onChange={(e) => setCatIconVal(e.target.value)}
                      className="w-full bg-brand-bg border border-white/[0.04] text-white p-2.5 rounded-xl outline-none focus:border-brand-accent text-center"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-brand-accent hover:opacity-90 text-brand-bg font-black rounded-xl text-center shadow-lg transition active:scale-[0.98] mt-3 cursor-pointer select-none font-heading"
                    >
                      {editingCategory ? '💾 حفظ التعديلات' : '➕ إضافة القسم للواجهة'}
                    </button>
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(null);
                          setCatNameArVal('');
                          setCatIconVal('');
                          setCatIdVal('');
                          setCatParentIdVal('channels');
                        }}
                        className="w-full py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-750 font-bold rounded-xl text-center border border-white/[0.05] transition cursor-pointer select-none"
                      >
                        إلغاء التعديل ❌
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* BULK MOVE FORM */}
              <div className="bg-brand-card/45 border border-white/[0.03] p-5 rounded-3xl space-y-4">
                <h4 className="text-xs font-black text-[#FF9900] uppercase tracking-widest block text-right border-b border-white/[0.04] pb-2">
                  🔄 نقل محتوى الأقسام دفعة واحدة
                </h4>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!bulkMoveSource || !bulkMoveDest) {
                    onNotify('⚠️ يرجى تحديد القسم المصدر والقسم الهدف!');
                    return;
                  }
                  if (bulkMoveSource === bulkMoveDest) {
                    onNotify('⚠️ لا يمكن اختيار نفس القسم كمصدر ووجهة في نفس الوقت!');
                    return;
                  }
                  const count = channels.filter(c => c.category === bulkMoveSource).length;
                  if (count === 0) {
                    onNotify('⚠️ هذا القسم المصدر فارغ، لا توجد قنوات لنقلها!');
                    return;
                  }

                  const updatedChannels = channels.map(c => {
                    if (c.category === bulkMoveSource) {
                      return { ...c, category: bulkMoveDest };
                    }
                    return c;
                  });
                  onUpdateChannels(updatedChannels);
                  onNotify(`🔄 تم بنجاح نقل ${count} قنوات حية من القسم "${categories.find(c => c.id === bulkMoveSource)?.nameAr}" لقسم "${categories.find(c => c.id === bulkMoveDest)?.nameAr}"!`);
                  setBulkMoveSource('');
                  setBulkMoveDest('');
                }} className="space-y-3 text-xs text-right font-semibold font-sans">
                  <div>
                    <label className="text-zinc-400 block mb-1">القسم المصدر (Source)</label>
                    <select
                      value={bulkMoveSource}
                      onChange={(e) => setBulkMoveSource(e.target.value)}
                      className="w-full bg-brand-bg border border-white/[0.04] text-white p-2.5 rounded-xl outline-none focus:border-brand-accent cursor-pointer"
                    >
                      <option value="">-- اختر القسم المصدر --</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.icon} {c.nameAr}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">القسم الوجهة (Destination)</label>
                    <select
                      value={bulkMoveDest}
                      onChange={(e) => setBulkMoveDest(e.target.value)}
                      className="w-full bg-brand-bg border border-white/[0.04] text-white p-2.5 rounded-xl outline-none focus:border-brand-accent cursor-pointer"
                    >
                      <option value="">-- اختر القسم الوجهة --</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.icon} {c.nameAr}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-750 text-brand-accent border border-brand-accent/20 font-bold rounded-xl text-center transition duration-200 mt-2 cursor-pointer select-none"
                  >
                    🚀 نقل كافة قنوات القسم المصدر الآن
                  </button>
                </form>
              </div>
            </div>

            {/* LIST COMPONENT */}
            <div className="md:col-span-2 bg-brand-card/45 border border-white/[0.03] p-5 rounded-3xl space-y-4">
              <h4 className="text-xs font-black text-brand-accent uppercase tracking-widest block text-right border-b border-white/[0.04] pb-2">
                🗂️ شجرة هيكلة أقسام القنوات الحالية ({categories.length})
              </h4>

              <div className="space-y-3 max-h-[580px] overflow-y-auto scrollbar-thin">
                {/* Visual Tree grouping under main live channels parent */}
                <div className="border border-white/[0.04] bg-white/[0.01] p-4 rounded-2xl space-y-2.5">
                  <div className="flex items-center gap-2 justify-end pb-1.5 border-b border-white/[0.03]">
                    <span className="text-xs text-brand-accent font-black">📺 قسم قنوات البث المباشر (TV Channels parent group)</span>
                  </div>

                  <div className="space-y-2">
                    {categories.map((cat) => {
                      const itemsCount = channels.filter(c => c.category === cat.id).length;
                      return (
                        <div 
                          key={cat.id} 
                          className="flex items-center justify-between bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.02] p-3 rounded-xl transition mr-4"
                        >
                          <div className="flex items-center gap-1">
                            <button 
                              type="button"
                              onClick={() => {
                                setEditingCategory(cat);
                                setCatIdVal(cat.id);
                                setCatNameArVal(cat.nameAr);
                                setCatIconVal(cat.icon || '📁');
                                setCatParentIdVal((cat as any).parentId || 'channels');
                              }}
                              className="p-1.5 text-zinc-400 hover:text-brand-accent hover:bg-brand-accent/10 rounded-lg transition cursor-pointer"
                              title="تعديل هذا القسم"
                            >
                              <Edit2 size={13} />
                            </button>
                            
                            <button 
                              type="button"
                              onClick={() => {
                                const protects = ['sports', 'news', 'entertainment'];
                                if (protects.includes(cat.id)) {
                                  onNotify('🚨 هذا القسم من الأقسام الهيكلية للتطبيق، حذفه قد يحد من مرونة العرض الافتراضي!');
                                }
                                
                                const count = channels.filter(c => c.category === cat.id).length;
                                if (count > 0) {
                                  // Open safety redistribution dialog
                                  const remaining = categories.filter(c => c.id !== cat.id);
                                  setDeleteConfirmInfo({
                                    type: 'channel',
                                    categoryId: cat.id,
                                    categoryName: cat.nameAr,
                                    count: count
                                  });
                                  setRedistributeDestId(remaining[0]?.id || '');
                                } else {
                                  setConfirmAction({
                                    message: `هل أنت متأكد من حذف قسم (${cat.nameAr}) نهائياً؟ القسم لا يحتوي على قنوات في الوقت الحالي.`,
                                    onConfirm: () => {
                                      onUpdateCategories(categories.filter(c => c.id !== cat.id));
                                      onNotify(`🗑️ تم حذف القسم "${cat.nameAr}" بنجاح!`);
                                      if (editingCategory?.id === cat.id) {
                                        setEditingCategory(null);
                                        setCatNameArVal('');
                                        setCatIconVal('');
                                        setCatIdVal('');
                                      }
                                    }
                                  });
                                }
                              }}
                              className="p-1.5 text-zinc-500 hover:text-brand-live hover:bg-brand-live/10 rounded-lg transition cursor-pointer"
                              title="حذف هذا القسم"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="flex items-center gap-1.5 justify-end">
                                <span className="text-[9px] text-brand-accent font-black bg-brand-accent/10 px-2 py-0.5 rounded-full">
                                  {itemsCount} {itemsCount === 1 ? 'قناة' : 'قنوات'}
                                </span>
                                <span className="font-heading font-black text-xs text-white pb-0.5">
                                  {cat.icon} {cat.nameAr}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 justify-end text-[8px] text-zinc-500 font-mono mt-0.5">
                                <span>ID: {cat.id}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-brand-bg/50 border border-white/[0.02] rounded-xl text-[10px] text-zinc-400 text-right leading-relaxed font-semibold">
                ℹ️ قمنا بتنظيم الهيكلة لشاشة التلفاز والمباريات لربط مباشر ومنع فك الارتباط للمحتويات. عند حذف قسم يحتوي قنوات، سنقترح عليك إعادة توجيه قنواته فوراً ودون أية تعقيدات!
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'vod_categories' && (
        <div className="bg-brand-secondary border border-white/[0.04] p-6 rounded-[32px] space-y-6 max-w-4xl mx-auto text-right" dir="rtl" id="vod-categories-management-panel">
          <div className="pb-3 border-b border-white/[0.04] text-right">
            <h3 className="text-base font-black text-white flex items-center gap-2 justify-end">
              <span className="text-xl">🎬</span>
              <span>إدارة أقسام الأفلام والمسلسلات</span>
            </h3>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">
              تحكم كامل في تصنيفات وأقسام مكتبة الفيلم والمسلسل التلفزيوني. يمكنك تعيينها وتنظيم شجرة التصنيف بدقة بالغة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ADD COMPONENT */}
            <div className="md:col-span-1 space-y-4">
              <div className="bg-brand-card/45 border border-white/[0.03] p-5 rounded-3xl space-y-4">
                <h4 className="text-xs font-black text-brand-accent uppercase tracking-widest block text-right border-b border-white/[0.04] pb-2">
                  {editingVodCategory ? '✏️ تعديل التصنيف الحالي' : '✨ إضافة تصنيف فني جديد'}
                </h4>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  
                  if (editingVodCategory) {
                    // Edit Existing Cinema Category
                    const oldNameAr = editingVodCategory.nameAr;
                    const newNameAr = vodCatNameArVal.trim();
                    if (oldNameAr !== newNameAr) {
                      const updatedVods = moviesAndSeries.map(v => {
                        if (v.categoryAr === oldNameAr) {
                          return { ...v, categoryAr: newNameAr, categoryEn: newNameAr };
                        }
                        return v;
                      });
                      onUpdateVods(updatedVods);
                    }

                    const updated = vodCategories.map(c => c.id === editingVodCategory.id ? {
                      ...c,
                      nameAr: newNameAr,
                      nameEn: newNameAr,
                      icon: vodCatIconVal.trim() || '🎬',
                      parentId: vodParentIdVal
                    } : c);
                    onUpdateVodCategories(updated);
                    onNotify(`✅ تم تحديث تصنيف السينما "${vodCatNameArVal}" بنجاح وتحديث المواد المرتبطة!`);
                    setEditingVodCategory(null);
                    setVodCatNameArVal('');
                    setVodCatIconVal('');
                    setVodCatIdVal('');
                    setVodParentIdVal('movie');
                  } else {
                    // Add New Cinema Category
                    const id = vodCatIdVal.trim().toLowerCase().replace(/\s+/g, '_');
                    if (!vodCatNameArVal.trim() || !id) {
                      onNotify('⚠️ يرجى ملء حقول اسم التصنيف والمعرف الفريد!');
                      return;
                    }
                    if (vodCategories.some(c => c.id === id)) {
                      onNotify('⚠️ هذا المعرف الفريد مستخدم بالفعل لتصنيف آخر!');
                      return;
                    }

                    const newCategory = { id, nameAr: vodCatNameArVal.trim(), nameEn: vodCatNameArVal.trim(), icon: vodCatIconVal.trim() || '🎬', parentId: vodParentIdVal };
                    onUpdateVodCategories([...vodCategories, newCategory]);
                    onNotify(`✅ تم إضافة تصنيف سينمائي جديد "${vodCatNameArVal}" بنجاح!`);
                    setVodCatNameArVal('');
                    setVodCatIconVal('');
                    setVodCatIdVal('');
                    setVodParentIdVal('movie');
                  }
                }} className="space-y-3.5 text-xs text-right font-semibold">
                  <div className="space-y-1">
                    <label className="text-zinc-400 block mb-1">القسم الرئيسي (Parent Classification)</label>
                    <select
                      value={vodParentIdVal}
                      onChange={(e) => setVodParentIdVal(e.target.value as 'movie' | 'series')}
                      className="w-full bg-brand-bg border border-white/[0.04] text-white p-2.5 rounded-xl outline-none focus:border-brand-accent cursor-pointer text-xs font-semibold"
                    >
                      <option value="movie">🎬 قسم الأفلام والسينما (Movies classification)</option>
                      <option value="series">🎭 قسم المسلسلات والدراما (Series classification)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 block mb-1">المعرف الفريد بالتصنيف (بالانجليزي بدون مسافات)</label>
                    <input 
                      type="text" required placeholder="e.g. action_movies"
                      value={vodCatIdVal}
                      onChange={(e) => setVodCatIdVal(e.target.value)}
                      disabled={!!editingVodCategory}
                      className={`w-full bg-brand-bg border border-white/[0.04] text-white p-2.5 rounded-xl outline-none focus:border-brand-accent text-left font-mono ${editingVodCategory ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 block mb-1">اسم التصنيف الفني</label>
                    <input 
                      type="text" required placeholder="مثال: حكايا واقعية / دراما"
                      value={vodCatNameArVal}
                      onChange={(e) => setVodCatNameArVal(e.target.value)}
                      className="w-full bg-brand-bg border border-white/[0.04] text-white p-2.5 rounded-xl outline-none focus:border-brand-accent text-right"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 block mb-1">أيقونة أو إيموجي التصنيف</label>
                    <input 
                      type="text" placeholder="مثال: 🍿 أو 🎭"
                      value={vodCatIconVal}
                      onChange={(e) => setVodCatIconVal(e.target.value)}
                      className="w-full bg-brand-bg border border-white/[0.04] text-white p-2.5 rounded-xl outline-none focus:border-brand-accent text-center"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-brand-accent hover:opacity-90 text-brand-bg font-black rounded-xl text-center shadow-lg transition active:scale-[0.98] mt-3 cursor-pointer select-none font-heading"
                    >
                      {editingVodCategory ? '💾 حفظ التعديلات' : '➕ إضافة تصنيف للسينما'}
                    </button>
                    {editingVodCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingVodCategory(null);
                          setVodCatNameArVal('');
                          setVodCatIconVal('');
                          setVodCatIdVal('');
                          setVodParentIdVal('movie');
                        }}
                        className="w-full py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-750 font-bold rounded-xl text-center border border-white/[0.05] transition cursor-pointer select-none"
                      >
                        إلغاء التعديل ❌
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* BULK TRANSFER FOR VODS */}
              <div className="bg-brand-card/45 border border-white/[0.03] p-5 rounded-3xl space-y-4">
                <h4 className="text-xs font-black text-[#FF9900] uppercase tracking-widest block text-right border-b border-white/[0.04] pb-2">
                  🔄 نقل محتوى السينما دفعة واحدة
                </h4>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!bulkMoveSource || !bulkMoveDest) {
                    onNotify('⚠️ يرجى تحديد التصنيف المصدر والتصنيف الهدف!');
                    return;
                  }
                  if (bulkMoveSource === bulkMoveDest) {
                    onNotify('⚠️ لا يمكن اختيار نفس التصنيف كمصدر ووجهة!');
                    return;
                  }
                  
                  const sourceCat = vodCategories.find(c => c.id === bulkMoveSource);
                  const destCat = vodCategories.find(c => c.id === bulkMoveDest);
                  if (!sourceCat || !destCat) {
                    onNotify('⚠️ التصنيف المحدد غير موجود!');
                    return;
                  }

                  const count = moviesAndSeries.filter(v => v.categoryAr === sourceCat.nameAr).length;
                  if (count === 0) {
                    onNotify('⚠️ هذا التصنيف فارغ من الأعمال الفنية!');
                    return;
                  }

                  const updatedVods = moviesAndSeries.map(v => {
                    if (v.categoryAr === sourceCat.nameAr) {
                      return { ...v, categoryAr: destCat.nameAr, categoryEn: destCat.nameEn || destCat.nameAr };
                    }
                    return v;
                  });
                  onUpdateVods(updatedVods);
                  onNotify(`🔄 تم بنجاح نقل ${count} فيديوهات وتعديل تصنيفهم فنائياً من "${sourceCat.nameAr}" لتصنيف "${destCat.nameAr}"!`);
                  setBulkMoveSource('');
                  setBulkMoveDest('');
                }} className="space-y-3 text-xs text-right font-semibold font-sans">
                  <div>
                    <label className="text-zinc-400 block mb-1">التصنيف المصدر (Source)</label>
                    <select
                      value={bulkMoveSource}
                      onChange={(e) => setBulkMoveSource(e.target.value)}
                      className="w-full bg-brand-bg border border-white/[0.04] text-white p-2.5 rounded-xl outline-none focus:border-brand-accent cursor-pointer"
                    >
                      <option value="">-- اختر التصنيف المصدر --</option>
                      {vodCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.icon} {c.nameAr} ({c.parentId === 'series' ? 'مسلسلات' : 'أفلام'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">التصنيف الوجهة (Destination)</label>
                    <select
                      value={bulkMoveDest}
                      onChange={(e) => setBulkMoveDest(e.target.value)}
                      className="w-full bg-brand-bg border border-white/[0.04] text-white p-2.5 rounded-xl outline-none focus:border-brand-accent cursor-pointer"
                    >
                      <option value="">-- اختر التصنيف الوجهة --</option>
                      {vodCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.icon} {c.nameAr} ({c.parentId === 'series' ? 'مسلسلات' : 'أفلام'})</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-750 text-brand-accent border border-brand-accent/20 font-bold rounded-xl text-center transition duration-200 mt-2 cursor-pointer select-none"
                  >
                    🚀 نقل كافة محتويات التصنيف المصدر الآن
                  </button>
                </form>
              </div>
            </div>

            {/* LIST COMPONENT */}
            <div className="md:col-span-2 bg-brand-card/45 border border-white/[0.03] p-5 rounded-3xl space-y-4">
              <h4 className="text-xs font-black text-brand-accent uppercase tracking-widest block text-right border-b border-white/[0.04] pb-2">
                🗂️ التصنيفات الحالية للسينما والدراما المفعّلة ({vodCategories.length})
              </h4>

              <div className="space-y-4 max-h-[700px] overflow-y-auto scrollbar-thin">
                {/* Visual Section 1: Movies */}
                <div className="border border-white/[0.04] bg-white/[0.01] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 justify-end pb-1 border-b border-white/[0.03]">
                    <span className="text-xs text-brand-accent font-black">🎬 تصنيفات السينما والأفلام (Movies Sections)</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    {vodCategories.filter(c => c.parentId !== 'series').map((cat) => {
                      const itemsCount = moviesAndSeries.filter(v => v.categoryAr === cat.nameAr).length;
                      return (
                        <div 
                          key={cat.id} 
                          className="flex items-center justify-between bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.02] p-2.5 rounded-xl transition mr-3"
                        >
                          <div className="flex items-center gap-1">
                            <button 
                              type="button"
                              onClick={() => {
                                setEditingVodCategory(cat);
                                setVodCatIdVal(cat.id);
                                setVodCatNameArVal(cat.nameAr);
                                setVodCatIconVal(cat.icon || '🎬');
                                setVodParentIdVal(cat.parentId || 'movie');
                              }}
                              className="p-1.5 text-zinc-400 hover:text-brand-accent hover:bg-brand-accent/10 rounded-lg transition cursor-pointer"
                              title="تعديل"
                            >
                              <Edit2 size={13} />
                            </button>

                            <button 
                              type="button"
                              onClick={() => {
                                const count = moviesAndSeries.filter(v => v.categoryAr === cat.nameAr).length;
                                if (count > 0) {
                                  const remaining = vodCategories.filter(c => c.id !== cat.id);
                                  setDeleteConfirmInfo({
                                    type: 'vod',
                                    categoryId: cat.id,
                                    categoryName: cat.nameAr,
                                    count: count
                                  });
                                  setRedistributeDestId(remaining[0]?.id || '');
                                } else {
                                  setConfirmAction({
                                    message: `هل أنت متأكد من حذف هذا التصنيف الفني (${cat.nameAr}) نهائياً؟ التصنيف فارغ حالياً من المواد والوسائط.`,
                                    onConfirm: () => {
                                      onUpdateVodCategories(vodCategories.filter(c => c.id !== cat.id));
                                      onNotify(`🗑️ تم حذف التصنيف "${cat.nameAr}" بنجاح!`);
                                      if (editingVodCategory?.id === cat.id) {
                                        setEditingVodCategory(null);
                                        setVodCatNameArVal('');
                                        setVodCatIconVal('');
                                        setVodCatIdVal('');
                                      }
                                    }
                                  });
                                }
                              }}
                              className="p-1.5 text-zinc-500 hover:text-brand-live hover:bg-brand-live/10 rounded-lg transition cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <div className="text-right">
                              <div className="flex items-center gap-1.5 justify-end">
                                <span className="text-[9px] text-[#00a3fe] font-black bg-[#00a3fe]/10 px-2.5 py-0.5 rounded-full">
                                  {itemsCount} {itemsCount === 1 ? 'مادة' : 'مواد'}
                                </span>
                                <span className="font-heading font-black text-xs text-white pb-0.5">
                                  {cat.icon} {cat.nameAr}
                                </span>
                              </div>
                              <div className="flex items-center justify-end text-[8px] text-zinc-500 font-mono mt-0.5">
                                <span>ID: {cat.id}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Visual Section 2: TV Shows */}
                <div className="border border-white/[0.04] bg-white/[0.01] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 justify-end pb-1 border-b border-white/[0.03]">
                    <span className="text-xs text-brand-accent font-black">🎭 تصنيفات المسلسلات والدراما (Series Sections)</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    {vodCategories.filter(c => c.parentId === 'series').map((cat) => {
                      const itemsCount = moviesAndSeries.filter(v => v.categoryAr === cat.nameAr).length;
                      return (
                        <div 
                          key={cat.id} 
                          className="flex items-center justify-between bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.02] p-2.5 rounded-xl transition mr-3"
                        >
                          <div className="flex items-center gap-1">
                            <button 
                              type="button"
                              onClick={() => {
                                setEditingVodCategory(cat);
                                setVodCatIdVal(cat.id);
                                setVodCatNameArVal(cat.nameAr);
                                setVodCatIconVal(cat.icon || '🎬');
                                setVodParentIdVal(cat.parentId || 'series');
                              }}
                              className="p-1.5 text-zinc-400 hover:text-brand-accent hover:bg-brand-accent/10 rounded-lg transition cursor-pointer"
                              title="تعديل"
                            >
                              <Edit2 size={13} />
                            </button>

                            <button 
                              type="button"
                              onClick={() => {
                                const count = moviesAndSeries.filter(v => v.categoryAr === cat.nameAr).length;
                                if (count > 0) {
                                  const remaining = vodCategories.filter(c => c.id !== cat.id);
                                  setDeleteConfirmInfo({
                                    type: 'vod',
                                    categoryId: cat.id,
                                    categoryName: cat.nameAr,
                                    count: count
                                  });
                                  setRedistributeDestId(remaining[0]?.id || '');
                                } else {
                                  setConfirmAction({
                                    message: `هل أنت متأكد من حذف هذا التصنيف الفني (${cat.nameAr}) نهائياً؟ التصنيف فارغ حالياً من المواد والوسائط.`,
                                    onConfirm: () => {
                                      onUpdateVodCategories(vodCategories.filter(c => c.id !== cat.id));
                                      onNotify(`🗑️ تم حذف التصنيف "${cat.nameAr}" بنجاح!`);
                                      if (editingVodCategory?.id === cat.id) {
                                        setEditingVodCategory(null);
                                        setVodCatNameArVal('');
                                        setVodCatIconVal('');
                                        setVodCatIdVal('');
                                      }
                                    }
                                  });
                                }
                              }}
                              className="p-1.5 text-zinc-500 hover:text-brand-live hover:bg-brand-live/10 rounded-lg transition cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <div className="text-right">
                              <div className="flex items-center gap-1.5 justify-end">
                                <span className="text-[9px] text-[#00a3fe] font-black bg-[#00a3fe]/10 px-2.5 py-0.5 rounded-full">
                                  {itemsCount} {itemsCount === 1 ? 'مادة' : 'مواد'}
                                </span>
                                <span className="font-heading font-black text-xs text-white pb-0.5">
                                  {cat.icon} {cat.nameAr}
                                </span>
                              </div>
                              <div className="flex items-center justify-end text-[8px] text-zinc-500 font-mono mt-0.5">
                                <span>ID: {cat.id}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-brand-bg/50 border border-white/[0.02] rounded-xl text-[10px] text-zinc-400 text-right leading-relaxed font-semibold">
                ℹ️ هيكلة ذكية تمكنك من نقل أو تغيير مسمى أي تصنيف درامي لتتحول وتتحدث تلقائياً كافة الأفلام أو الحلقات المرتبطة به دون خطر فقدان البيانات أو تعطل المشغلات والمصادر!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT M3U MODAL DIALOG */}
      {showM3uExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" id="export-m3u-popup-modal">
          <div className="bg-white border border-zinc-200 w-full max-w-lg rounded-[36px] overflow-hidden p-6 md:p-8 space-y-6 shadow-[0_25px_60px_rgba(0,0,0,0.18)] text-right animate-scaleIn" dir="rtl">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 gap-2">
              <button
                type="button"
                onClick={() => setShowM3uExportModal(false)}
                className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full transition text-zinc-500 hover:text-zinc-800 cursor-pointer"
                title={lang === 'ar' ? 'إغلاق' : 'Close'}
              >
                <X size={18} />
              </button>

              <h3 className="text-base md:text-lg font-black text-zinc-900 flex items-center gap-2">
                <span>تصدير ملف M3U</span>
                <span className="text-[#00a35c]">✨</span>
              </h3>
            </div>

            {/* Description Text */}
            <div className="text-zinc-600 text-xs md:text-sm leading-relaxed space-y-2.5 font-sans font-medium">
              <p>
                تم إنشاء قائمة التشغيل لعدد{' '}
                <span className="text-[#00a35c] font-black border-b border-dashed border-[#00a35c] pb-0.5 mx-1">
                  {m3uExportCount} {m3uExportCount === 1 ? 'مادة' : 'قناة/مسلسل/فيلم'}
                </span>{' '}
                بنجاح. ضمن{' '}
                <span className="underline decoration-zinc-300 decoration-2 underline-offset-4 text-zinc-800 font-bold">
                  بيئة المعاينة أو المتصفحات المحمية
                </span>
                ، قد يؤدي النقر المباشر على تحميل إلى خروج التطبيق. يرجى اختيار إحدى الطرق السهلة والآمنة التالية للحصول على الملف:
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Green Action Copy Button */}
              <button
                type="button"
                onClick={() => {
                  try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(m3uExportText);
                      onNotify(lang === 'ar' ? '📋 تم نسخ محتوى قائمة M3U بالكامل بنجاح!' : 'Copied content successfully!');
                    } else {
                      const txtarea = document.getElementById('m3u-modal-textarea') as HTMLTextAreaElement;
                      if (txtarea) {
                        txtarea.select();
                        document.execCommand('copy');
                        onNotify(lang === 'ar' ? '📋 تم نسخ محتوى قائمة M3U بالكامل!' : 'Copied successfully!');
                      }
                    }
                  } catch (e) {
                    onNotify('⚠️ حدث خطأ أثناء النسخ التلقائي!');
                  }
                }}
                className="w-full py-4 bg-[#00a35c] hover:bg-[#008f50] text-white font-black rounded-2xl flex items-center justify-center gap-2 text-xs md:text-sm shadow-[0_6px_20px_rgba(0,163,92,0.25)] transition active:scale-[0.99] cursor-pointer"
              >
                <span>📋 نسخ المحتوى بالكامل</span>
              </button>

              {/* Light secondary download button */}
              <button
                type="button"
                onClick={() => {
                  try {
                    const blob = new Blob([m3uExportText], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'playlist.m3u';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    onNotify('📥 تم بدء تحميل ملف M3U بنجاح!');
                  } catch (e) {
                    onNotify('⚠️ تم منع التنزيل التلقائي، يرجى نسخ المحتوى.');
                  }
                }}
                className="w-full py-4 bg-[#f0f2f5] hover:bg-[#e4e7eb] border border-zinc-200 text-zinc-900 font-extrabold rounded-2xl flex items-center justify-center gap-2 text-xs md:text-sm shadow-sm transition active:scale-[0.99] cursor-pointer"
              >
                <span>📥 تحميل كملف M3U</span>
              </button>
            </div>

            {/* Sub Preview Header */}
            <div className="space-y-2">
              <span className="text-zinc-500 font-bold text-xs">معاينة نص ملف M3U / نسخ يدوي مكرر:</span>
              <textarea
                id="m3u-modal-textarea"
                readOnly
                value={m3uExportText}
                onClick={(e) => {
                  (e.target as HTMLTextAreaElement).select();
                }}
                className="w-full h-32 bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 text-[10px] md:text-xs font-mono text-zinc-800 outline-none focus:border-brand-accent resize-none scrollbar-thin select-all leading-relaxed"
                style={{ direction: 'ltr' }}
              />
              <span className="text-[#00a3fe] text-[10px] md:text-[11.5px] font-bold block leading-relaxed text-center">
                * يمكنك الضغط داخل المربع أعلاه لتحديد النص ونسخه يدوياً في أي وقت.
              </span>
            </div>

            {/* Bottom Actions footer */}
            <div className="flex items-center justify-start pt-2">
              <button
                type="button"
                onClick={() => setShowM3uExportModal(false)}
                className="px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-xs text-zinc-700 font-bold transition duration-200 cursor-pointer"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-brand-secondary border border-white/[0.08] w-full max-w-sm rounded-[24px] p-6 space-y-4 shadow-2xl text-right" dir="rtl">
            <h3 className="text-sm font-black text-white">تأكيد الإجراء</h3>
            <p className="text-xs text-brand-muted leading-relaxed font-semibold">
              {confirmAction.message}
            </p>
            <div className="flex items-center justify-start gap-2.5 pt-2">
              <button
                onClick={() => {
                  confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
                className="px-4 py-2 bg-red-500 hover:opacity-90 text-white text-xs font-black rounded-xl transition shadow-[0_4px_12px_rgba(239,68,68,0.25)] cursor-pointer"
              >
                نعم، متأكد
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 bg-brand-card text-brand-muted hover:text-white text-xs font-bold rounded-xl transition border border-white/5 cursor-pointer"
              >
                إلغاء الإجراء
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-brand-secondary border border-white/[0.08] w-full max-w-sm rounded-[24px] p-6 space-y-4 shadow-2xl text-right" dir="rtl">
            <h3 className="text-sm font-black text-brand-accent">⚠️ منع بقاء مواد بدون تصنيف</h3>
            <p className="text-xs text-brand-muted leading-relaxed font-semibold">
              القسم الذي ترغب في حذفه <strong>({deleteConfirmInfo.categoryName})</strong> غير فارغ ويحتوي حالياً على <strong>{deleteConfirmInfo.count}</strong> من {deleteConfirmInfo.type === 'channel' ? 'القنوات النشطة' : 'المواد والأفلام والمسلسلات'}.
              <br className="mb-2"/>
              تجنباً لفقدان المحتوى أو جعله يتيماً، يرجى تحديد وجهة بديلة لإعادة تخصيصهم فوراً:
            </p>
            
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] text-zinc-400 block font-heading">اختر القسم البديل الآمن:</label>
              <select
                value={redistributeDestId}
                onChange={(e) => setRedistributeDestId(e.target.value)}
                className="w-full bg-brand-bg border border-white/[0.06] text-white p-2.5 rounded-xl outline-none focus:border-brand-accent cursor-pointer text-xs"
              >
                {deleteConfirmInfo.type === 'channel' 
                  ? categories.filter(c => c.id !== deleteConfirmInfo.categoryId).map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.nameAr}</option>
                    ))
                  : vodCategories.filter(c => c.id !== deleteConfirmInfo.categoryId).map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.nameAr}</option>
                    ))
                }
              </select>
            </div>

            <div className="flex items-center justify-start gap-2.5 pt-3">
              <button
                onClick={() => {
                  if (!redistributeDestId) {
                    onNotify('⚠️ يرجى تحديد قسم بديل أولاً!');
                    return;
                  }
                  if (deleteConfirmInfo.type === 'channel') {
                    // Update channels to fallback
                    const updatedC = channels.map(c => c.category === deleteConfirmInfo.categoryId ? { ...c, category: redistributeDestId } : c);
                    onUpdateChannels(updatedC);
                    // Filter categories
                    onUpdateCategories(categories.filter(c => c.id !== deleteConfirmInfo.categoryId));
                    onNotify(`🗑️ تم حذف القسم وتوجيه ${deleteConfirmInfo.count} قنوات بنجاح!`);
                  } else {
                    // Update VODs to fallback
                    const targetDest = vodCategories.find(c => c.id === redistributeDestId);
                    if (targetDest) {
                      const updatedV = moviesAndSeries.map(v => v.categoryAr === deleteConfirmInfo.categoryName ? { ...v, categoryAr: targetDest.nameAr, categoryEn: targetDest.nameEn || targetDest.nameAr } : v);
                      onUpdateVods(updatedV);
                    }
                    // Filter VOD categories
                    onUpdateVodCategories(vodCategories.filter(c => c.id !== deleteConfirmInfo.categoryId));
                    onNotify(`🗑️ تم حذف القسم وتوجيه ${deleteConfirmInfo.count} مادة فنية بنجاح!`);
                  }
                  setDeleteConfirmInfo(null);
                }}
                className="px-4 py-2 bg-brand-accent text-brand-bg text-xs font-black rounded-xl hover:opacity-90 transition cursor-pointer"
              >
                تحديث وحذف القسم الآن 🚀
              </button>
              <button
                onClick={() => setDeleteConfirmInfo(null)}
                className="px-4 py-2 bg-brand-card text-brand-muted hover:text-white text-xs font-bold rounded-xl transition border border-white/5 cursor-pointer"
              >
                إلغاء التراجع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
