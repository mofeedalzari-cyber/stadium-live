import { Match, Channel, VideoContent, HomepageSlider, ContinueWatching, AdConfig } from './types';

// Default mock data that will seed localStorage if not already present
export const INITIAL_MATCHES: Match[] = [
  {
    id: 'm1',
    team1: {
      nameAr: 'ريال مدريد',
      nameEn: 'Real Madrid',
      logo: 'https://images.unsplash.com/photo-1431324155629-1a6edd1e1ece?w=150&auto=format&fit=crop&q=80' // Sports stadium representation
    },
    team2: {
      nameAr: 'برشلونة',
      nameEn: 'Barcelona',
      logo: 'https://images.unsplash.com/photo-1579952365111-3958b8db916e?w=150&auto=format&fit=crop&q=80'
    },
    team1Score: 2,
    team2Score: 1,
    tournamentAr: 'الدوري الإسباني - الكلاسيكو',
    tournamentEn: 'La Liga - El Clásico',
    tournamentLogo: '🇪🇸',
    time: '20:00',
    date: '2026-05-23', // Matches current date (Today Live)
    status: 'live',
    minute: 74,
    servers: [
      { name: 'Server 1 (FHD)', url: 'https://test-streams.mux.dev/x36xhg/main.m3u8' },
      { name: 'Server 2 (HD)', url: 'https://test-streams.mux.dev/ptg/playlist.m3u8' },
      { name: 'Backup Server', url: 'https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8' }
    ],
    poster: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80',
    statistics: {
      possession: [54, 46],
      shotsOnTarget: [6, 4],
      fouls: [12, 14],
      yellowCards: [2, 3],
      redCards: [0, 1]
    }
  },
  {
    id: 'm2',
    team1: {
      nameAr: 'الهلال',
      nameEn: 'Al Hilal',
      logo: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=150&auto=format&fit=crop&q=80'
    },
    team2: {
      nameAr: 'النصر',
      nameEn: 'Al Nassr',
      logo: 'https://images.unsplash.com/photo-1579952365111-3958b8db916e?w=150&auto=format&fit=crop&q=80'
    },
    team1Score: 0,
    team2Score: 0,
    tournamentAr: 'دوري روشن السعودي',
    tournamentEn: 'Roshn Saudi League',
    tournamentLogo: '🇸🇦',
    time: '21:30',
    date: '2026-05-23', // Live soon
    status: 'upcoming',
    servers: [
      { name: 'Main VIP Server', url: 'https://test-streams.mux.dev/x36xhg/main.m3u8' },
      { name: 'Low Quality Server', url: 'https://test-streams.mux.dev/ptg/playlist.m3u8' }
    ],
    poster: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'm3',
    team1: {
      nameAr: 'مانشستر سيتي',
      nameEn: 'Manchester City',
      logo: 'https://images.unsplash.com/photo-1622279457486-62dcc4a4b1ca?w=150&auto=format&fit=crop&q=80'
    },
    team2: {
      nameAr: 'ليفربول',
      nameEn: 'Liverpool',
      logo: 'https://images.unsplash.com/photo-1431324155629-1a6edd1e1ece?w=150&auto=format&fit=crop&q=80'
    },
    team1Score: 3,
    team2Score: 2,
    tournamentAr: 'الدوري الإنجليزي الممتاز',
    tournamentEn: 'English Premier League',
    tournamentLogo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    time: '14:30',
    date: '2026-05-23',
    status: 'finished',
    servers: [],
    statistics: {
      possession: [58, 42],
      shotsOnTarget: [8, 6],
      fouls: [9, 11],
      yellowCards: [1, 2],
      redCards: [0, 0]
    }
  },
  {
    id: 'm4',
    team1: {
      nameAr: 'الأهلي',
      nameEn: 'Al Ahly',
      logo: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=150&auto=format&fit=crop&q=80'
    },
    team2: {
      nameAr: 'الزمالك',
      nameEn: 'Zamalek',
      logo: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=150&auto=format&fit=crop&q=80'
    },
    tournamentAr: 'نهائي دوري أبطال أفريقيا',
    tournamentEn: 'CAF Champions League Final',
    tournamentLogo: '🏆',
    time: '19:45',
    date: '2026-05-24', // Tomorrow
    status: 'upcoming',
    servers: [
      { name: 'CAF Core Stream', url: 'https://test-streams.mux.dev/x36xhg/main.m3u8' }
    ],
    poster: 'https://images.unsplash.com/photo-1579952365111-3958b8db916e?w=800&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_CHANNELS: Channel[] = [
  {
    id: 'c1',
    nameAr: 'كاس العالم 2026',
    nameEn: 'FIFA World Cup 2026',
    logo: 'https://images.unsplash.com/photo-1579952365111-3958b8db916e?w=500&auto=format&fit=crop&q=80',
    category: 'sports',
    streamUrl: 'https://test-streams.mux.dev/x36xhg/main.m3u8',
    backupUrl: 'https://test-streams.mux.dev/ptg/playlist.m3u8',
    status: 'online',
    epg: [
      { time: '20:00', titleAr: 'تحليل استوديو كاس العالم', titleEn: 'FIFA Cup Studio' },
      { time: '21:00', titleAr: 'مباراة افتتاح كاس العالم (مباشر)', titleEn: 'World Cup Match Live' }
    ]
  },
  {
    id: 'c2',
    nameAr: 'BEIN SPORT',
    nameEn: 'bein sports',
    logo: 'https://images.unsplash.com/photo-1579952365111-3958b8db916e?w=500&auto=format&fit=crop&q=80',
    category: 'sports',
    streamUrl: 'https://test-streams.mux.dev/ptg/playlist.m3u8',
    status: 'online',
    epg: [
      { time: '19:30', titleAr: 'ملعب النجوم العالمي', titleEn: 'World Stadium Match Day' }
    ]
  },
  {
    id: 'c3',
    nameAr: 'ثمانية',
    nameEn: 'Thamanya TV',
    logo: 'https://images.unsplash.com/photo-1585699324551-f6c309eed262?w=500&auto=format&fit=crop&q=80',
    category: 'entertainment',
    streamUrl: 'https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8',
    status: 'online',
    epg: [
      { time: '21:00', titleAr: 'بودكاست فنجان الحصري', titleEn: 'Fengan Podcast Documentary' }
    ]
  },
  {
    id: 'c4',
    nameAr: 'Starz Sport',
    nameEn: 'STARZPLAY Sports',
    logo: 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=500&auto=format&fit=crop&q=80',
    category: 'sports',
    streamUrl: 'https://test-streams.mux.dev/x36xhg/main.m3u8',
    status: 'online',
    epg: [
      { time: '22:00', titleAr: 'بث قنوات ستارزبلاي سبورتس', titleEn: 'StarzPlay Live Coverage' }
    ]
  },
  {
    id: 'c5',
    nameAr: 'Alwan Sports',
    nameEn: 'alwan sports network',
    logo: 'https://images.unsplash.com/photo-1431324155629-1a6edd1dec1d?w=500&auto=format&fit=crop&q=80',
    category: 'sports',
    streamUrl: 'https://test-streams.mux.dev/ptg/playlist.m3u8',
    status: 'online',
    epg: [
      { time: '21:30', titleAr: 'دريبل الملاعب الفضائية', titleEn: 'Emerald Space Play' }
    ]
  },
  {
    id: 'c6',
    nameAr: 'SHAHID SPORT',
    nameEn: 'shahid sports live',
    logo: 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=500&auto=format&fit=crop&q=80',
    category: 'sports',
    streamUrl: 'https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8',
    status: 'online',
    epg: [
      { time: '20:30', titleAr: 'كرة الملاعب المدمجة مباشر', titleEn: 'Metallic Sphere Highlights' }
    ]
  },
  {
    id: 'c7',
    nameAr: 'ALKASS',
    nameEn: 'al kass sports',
    logo: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=500&auto=format&fit=crop&q=80',
    category: 'sports',
    streamUrl: 'https://test-streams.mux.dev/x36xhg/main.m3u8',
    status: 'online',
    epg: [
      { time: '20:00', titleAr: 'كأس قطر الذهبي', titleEn: 'Qatar Golden Cup Live' }
    ]
  },
  {
    id: 'c8',
    nameAr: 'Fajer TV',
    nameEn: 'al fajer tv group',
    logo: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500&auto=format&fit=crop&q=80',
    category: 'entertainment',
    streamUrl: 'https://test-streams.mux.dev/ptg/playlist.m3u8',
    status: 'online',
    epg: [
      { time: '21:00', titleAr: 'مسلسل الفجر اليومي', titleEn: 'Weekly Fajer Drama Series' }
    ]
  },
  {
    id: 'c9',
    nameAr: 'ARABIC',
    nameEn: 'arabic general net',
    logo: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500&auto=format&fit=crop&q=80',
    category: 'entertainment',
    streamUrl: 'https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8',
    status: 'online',
    epg: [
      { time: '18:00', titleAr: 'منوعات الدراما العربية', titleEn: 'Combined Arabic Showcases' }
    ]
  },
  {
    id: 'c10',
    nameAr: 'MBC GROUP',
    nameEn: 'mbc general group',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    category: 'entertainment',
    streamUrl: 'https://test-streams.mux.dev/x36xhg/main.m3u8',
    status: 'online',
    epg: [
      { time: '22:30', titleAr: 'مسابقات الحلم مباشر', titleEn: 'Dream MBC Broadcast' }
    ]
  },
  {
    id: 'c11',
    nameAr: 'روتانا | Rotana',
    nameEn: 'rotana premium net',
    logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=80',
    category: 'entertainment',
    streamUrl: 'https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8',
    status: 'online',
    epg: [
      { time: '20:00', titleAr: 'سينما روتانا فاميلي', titleEn: 'Rotana Cinema Evenings' }
    ]
  },
  {
    id: 'c12',
    nameAr: 'NEWS',
    nameEn: 'global news networks',
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&auto=format&fit=crop&q=80',
    category: 'news',
    streamUrl: 'https://test-streams.mux.dev/ptg/playlist.m3u8',
    status: 'online',
    epg: [
      { time: '21:00', titleAr: 'العالم اليوم الآن', titleEn: 'World News Bulletin Realtime' }
    ]
  }
];

export const INITIAL_VIDEOCONTENT: VideoContent[] = [
  {
    id: 'v1',
    titleAr: 'كأس العالم الأسطوري: قصة نهائي لوسيل',
    titleEn: 'Lusail Legendary Final: The Epic Battle',
    type: 'movie',
    poster: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=1200&auto=format&fit=crop&q=80',
    categoryAr: 'أفلام وثائقية',
    categoryEn: 'Documentary Movies',
    rating: 4.9,
    year: 2024,
    duration: '1h 58m',
    descriptionAr: 'قصة ملحمية عن كواليس المباراة النهائية في بطولة كأس العالم 2022 في قطر على ملعب لوسيل الأسطوري. لقطات حصرية ومقابلات نادرة تلخص رحلة التتويج التاريخي.',
    descriptionEn: 'The epic behind-the-scenes story of the FIFA World Cup 2022 final in Qatar at Lusail Stadium. Includes exclusive footage and intimate interviews summarizing a historical title run.',
    streamUrl: 'https://test-streams.mux.dev/x36xhg/main.m3u8',
    isFeatured: true
  },
  {
    id: 'v2',
    titleAr: 'سلسلة المجد: الملوك الـ15 لريال مدريد',
    titleEn: 'Real Madrid: Road to the 15th UCL Glory',
    type: 'series',
    poster: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=1200&auto=format&fit=crop&q=80',
    categoryAr: 'مسلسلات عربية',
    categoryEn: 'Arabic Series',
    rating: 4.8,
    year: 2024,
    descriptionAr: 'مسلسل وثائقي يستعرض رحلة الميرنغي لحسم الكأس الخامسة عشرة في دوري أبطال أوروبا، الكواليس الساخنة والتحضيرات التكتيكية والمواجهات التاريخية مع كبار القارة.',
    descriptionEn: 'An immersive documentary series chronicling Real Madrid\'s ultimate run to their 15th UEFA Champions League title. Highlights fierce dressing room reactions and tactical prep.',
    seasons: [
      {
        id: 's1',
        seasonNumber: 1,
        episodes: [
          {
            id: 'e1_1',
            titleAr: 'المواجهات النارية وعناد المان سيتي',
            titleEn: 'Episode 1: Heart-stopping Etihad Clash',
            episodeNumber: 1,
            duration: '45m',
            streamUrl: 'https://test-streams.mux.dev/x36xhg/main.m3u8'
          },
          {
            id: 'e1_2',
            titleAr: 'انتفاضة الملكي في البيرنابيو الأسطوري',
            titleEn: 'Episode 2: Remontada Magic at Bernabéu',
            episodeNumber: 2,
            duration: '50m',
            streamUrl: 'https://test-streams.mux.dev/ptg/playlist.m3u8'
          },
          {
            id: 'e1_3',
            titleAr: 'التاج الخامس عشر في ويمبلي الأسطوري',
            titleEn: 'Episode 3: The Ultimate Wembley Coronation',
            episodeNumber: 3,
            duration: '62m',
            streamUrl: 'https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8'
          }
        ]
      }
    ],
    isFeatured: true
  },
  {
    id: 'v3',
    titleAr: 'المدرجات المجنونة: عراقة ديربيات كرة القدم',
    titleEn: 'Fierce Stadium Fanatics: Derby Rivalries',
    type: 'movie',
    poster: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=500&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1431324155629-1a6edd1e1ece?w=1200&auto=format&fit=crop&q=80',
    categoryAr: 'أفلام وثائقية',
    categoryEn: 'Documentary Movies',
    rating: 4.7,
    year: 2025,
    duration: '1h 40m',
    descriptionAr: 'يستكشف هذا الفيلم أعمق المشاعر وثقافة الألتراس خلف أقوى ديربيات العالم، من السوبر كلاسيكو الأرجنتيني وحتى الديربي اللندني الناري، وجمال المدرجات والهاشتاغات الحماسية.',
    descriptionEn: 'Explore the burning spirit and cultural gravity representing global derbies. From the intense Superclásico in BA to the highly energized London and Cairo rivalries.',
    streamUrl: 'https://test-streams.mux.dev/ptg/playlist.m3u8'
  },
  {
    id: 'v4',
    titleAr: 'الملك محمد صلاح: فخر الملاعب العربية',
    titleEn: 'Mo Salah: The Modern Egyptian King',
    type: 'movie',
    poster: 'https://images.unsplash.com/photo-1579952365111-3958b8db916e?w=500&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&auto=format&fit=crop&q=80',
    categoryAr: 'أفلام وثائقية',
    categoryEn: 'Documentary Movies',
    rating: 4.9,
    year: 2025,
    duration: '2h 10m',
    descriptionAr: 'سرد سينمائي مذهل لمشوار الأيقونة المصرية محمد صلاح، منذ بداية بسيطة في قرية نجريج حتى الوصول لعرش الدوري الإنجليزي وتسطير صفحات من ذهب في تاريخ ليفربول.',
    descriptionEn: 'A cinematic bio story about Egyptian icon Mo Salah. Tracks his humble beginnings in Basyoun to ascending the throne of the Premier League and breaking history at Anfield.',
    streamUrl: 'https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8'
  }
];

export const INITIAL_SLIDERS: HomepageSlider[] = [
  {
    id: 's_1',
    titleAr: 'كأس العالم 2026 مباشر الآن',
    titleEn: 'World Cup 2026 LIVE NOW!',
    subtitleAr: 'شاهد أقوى مباريات بطولة كأس العالم 2026 لحظة بلحظة وبأعلى جودة بث ممكنة، مع توفر أربعة خوادم قوية لضمان مشاهدة سلسة بدون تقطيع أو تأخير، واستمتع بأجواء عالمية مليئة بالإثارة والحماس.',
    subtitleEn: 'Watch the best matches of the FIFA World Cup 2026 live moment by moment in the highest quality. 4 high-speed robust servers guarantee lag-free streaming.',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&auto=format&fit=crop&q=80',
    type: 'match',
    targetId: 'm1'
  },
  {
    id: 's_2',
    titleAr: 'بي إن سبورتس Premium 1',
    titleEn: 'bein SPORTS Premium 1 HD',
    subtitleAr: 'المنزل الحصري لأقوى البطولات الأوروبية، دوري أبطال أوروبا، الدوري الإنجليزي، والليغا الإسبانية مجانا طوال اليوم.',
    subtitleEn: 'The exclusive home for elite European action, live 24/7 EPG scheduling and top-tier match commentary crews.',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&auto=format&fit=crop&q=80',
    type: 'channel',
    targetId: 'c1'
  },
  {
    id: 's_3',
    titleAr: 'وثائقي قصة نهائي لوسيل الأسطوري',
    titleEn: 'Lusail Legendary Final Documentary',
    subtitleAr: 'عش مرة أخرى اللحظات العاطفية والتتويج الأيقوني لمنتخب الأرجنتين وميسي في مواجهة مبابي العنيفة مجاناً.',
    subtitleEn: 'Relive the most emotionally charged moments of the Qatar World Cup final. Exclusive behind-the-scenes access.',
    image: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=1200&auto=format&fit=crop&q=80',
    type: 'movie',
    targetId: 'v1'
  }
];

export const INITIAL_CONTINUE_WATCHING: ContinueWatching[] = [
  {
    id: 'cw1',
    contentId: 'v1',
    titleAr: 'قصة نهائي لوسيل',
    titleEn: 'Lusail Legendary Final',
    poster: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=500&auto=format&fit=crop&q=80',
    type: 'movie',
    progress: 68,
    timeString: '1h 20m / 1h 58m'
  },
  {
    id: 'cw2',
    contentId: 'v2',
    titleAr: 'الملوك الـ15 لريال مدريد',
    titleEn: 'Real Madrid Road to 15th',
    poster: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=80',
    type: 'series',
    progress: 35,
    timeString: 'EP 1 - 15:45 / 45:00',
    episodeNumber: 1,
    seasonNumber: 1
  }
];

// Helper to load typed structures block from localStorage
export function getLocalStorageData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed reading localStorage key: ' + key, error);
    return defaultValue;
  }
}

// Global update helper for easily managing state from dashboard
export function saveLocalStorageData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed writing localStorage key: ' + key, error);
  }
}

// Translations Dictionary
export const translations = {
  ar: {
    appName: 'ستاد تي في',
    subtitle: 'شاشة القوة الرياضية والإمبراطورية الترفيهية',
    home: 'الرئيسية',
    matches: 'مباريات اليوم',
    channels: 'القنوات التلفزيونية',
    movies: 'الأفلام',
    series: 'المسلسلات',
    favorites: 'المفضلة',
    adminPanel: 'لوحة التحكم',
    guestView: 'واجهة المشاهدين',
    searchPlaceholder: 'ابحث عن قنوات، مباريات، أفلام ومسلسلات...',
    liveNow: 'مباشر الآن',
    live: 'مباشر',
    upcoming: 'قريباً جداً',
    finished: 'انتهت بالفعل',
    vs: 'ضد',
    todayMatches: 'مباريات اليوم',
    tomorrowMatches: 'مباريات الغد المرتقبة',
    finishedMatches: 'المباريات المنتهية وتفاصيلها',
    minuteShort: 'د',
    playNow: 'شاهد الآن',
    addFavorite: 'إضافة للمفضلة',
    removeFavorite: 'إزالة من المفضلة',
    continueWatching: 'أكمل المشاهدة',
    featured: 'مميز ومقترح',
    sports: 'القنوات الرياضية',
    entertainment: 'القنوات الترفيهية',
    moviesTitle: 'الأفلام',
    seriesTitle: 'المسلسلات',
    searchTitle: 'البحث المستهدف',
    noResults: 'عذراً، لم نجد أي تطابقات لـ',
    servers: 'خوادم البث المتاحة',
    details: 'تفاصيل العرض',
    rating: 'التقييم الإلكتروني',
    year: 'سنة الإنتاج',
    duration: 'المدة الزمنية',
    description: 'ملخص القصة ومحاور البث',
    epg: 'جدول البرامج المباشر (EPG)',
    quality: 'دقة البث المباشر',
    swipeBrightnessVolume: 'اسحب للأعلى/للأسفل لتعديل الإضاءة والمسار الصوتي للفيديو',
    reconnect: 'إعادة الاتصال السريع بالبث لإنعاش الإشارة',
    tvRemoteMode: 'تسريع توافق شاشات التلفزيون الذكية والتحكم عن بعد (Android TV Mode)',
    login: 'تسجيل دخول رياضي',
    signup: 'إنشاء حساب جديد',
    vipStatus: 'عضوية VIP بريميوم',
    activateCode: 'تفعيل كود العرض الرياضي',
    enterCode: 'أدخل كود التفعيل المكون من 12 رمزاً',
    activateBtn: 'تأكيد التفعيل الفوري',
    invalidCode: 'الرمز غير صالح أو قد شُغّل سابقاً',
    vipActiveSuccess: 'تم تفعيل حسابك كـ VIP بريميوم بنجاح! استمتع بالبث الفائق.',
    activeExpiry: 'صلاحية الحساب حتى تاريخ',
    activeVipTitle: 'تفعيل اشتراك Stad TV VIP',
    liveMatchStats: 'إحصائيات المواجهة الحية',
    possession: 'نسبة الاستحواذ',
    shotsOnTarget: 'التسديدات على المرمى',
    fouls: 'الأخطاء المرتكبة',
    yellowCards: 'البطاقات الصفراء',
    redCards: 'البطاقات الحمراء',
    // Admin translations
    adminDashboard: 'لوحة التحكم الإدارية لـ STAD TV',
    dashboardOverview: 'نظرة عامة على أداء ومراقبة البث',
    addMatch: 'إضافة مواجهة جديدة',
    addChannel: 'إضافة قناة بث مباشر',
    addMovie: 'إضافة فيلم جديد',
    addSeries: 'إضافة مسلسل جديد',
    titleArLabel: 'العنوان بالعربية',
    titleEnLabel: 'العنوان بالإنجليزية',
    categoryArLabel: 'التصنيف بالعربية',
    categoryEnLabel: 'التصنيف بالإنجليزية',
    streamUrlLabel: 'رابط البث (HLS/M3U8/MP4)',
    team1Ar: 'اسم الفريق الأول بالعربية',
    team1En: 'اسم الفريق الأول بالإنجليزية',
    team1Logo: 'رابط شعار الفريق الأول',
    team2Ar: 'اسم الفريق الثاني بالعربية',
    team2En: 'اسم الفريق الثاني بالإنجليزية',
    team2Logo: 'رابط شعار الفريق الثاني',
    tournamentArLabel: 'اسم البطولة بالعربية',
    tournamentEnLabel: 'اسم البطولة بالإنجليزية',
    matchTimeLabel: 'توقيت المباراة (مثال: 21:00)',
    matchDateLabel: 'تاريخ المباراة (مثال: 2026-05-23)',
    posterArLabel: 'رابط البوستر/صورة الخلفية',
    actionBtn: 'حفظ التغييرات الإدارية',
    editItem: 'تعديل البيانات',
    deleteItem: 'حذف العنصر نهائياً',
    analyticsTotalMatches: 'إجمالي المباريات المجدولة',
    analyticsLiveNow: 'المباريات الحية الآن',
    analyticsTotalChannels: 'عدد القنوات الشغالة',
    analyticsTotalVods: 'إجمالي الأفلام والمسلسلات',
    activeUsersSim: 'المشاهدين المتصلين حالياً (تجريبي)',
    platformStatus: 'حالة الخوادم وصحة البث',
    allOnline: 'جميع البوابات ممتازة ومثبتة',
    pushNotificationLabel: 'إرسال إشعار فوري لجميع المستخدمين وشاشات التلفزيون',
    pushNotificationPlaceholder: 'اكتب نص الإشعار هنا... مثال: "انطلاق ديربي الرياض المثير الآن!"',
    sendNotificationBtn: 'بث ومشاركة الإشعار فوراً',
    notificationSentSuccess: 'تم تسليم الإشعار بنجاح لجميع شاشات التلفزيون وتطبيق الهواتف!',
    categories: {
      all: 'الكل',
      sports: 'رياضة وكورة',
      news: 'أخبار عالمية',
      entertainment: 'ترفيه وعائلة',
      kids: 'أطفال ورسوم',
      documentary: 'وثائقيات وعلم'
    },
    userPanel: 'بوابة العضو الحالية',
    seasonsLabel: 'المواسم والحلقات',
    episodeLabel: 'الحلقة',
    noEPG: 'لا يوجد برنامج حالياً للبث',
    vpnDetected: 'تم فحص الاتصال: لا يوجد تعارض VPN - البث مستقر بأقصى سرعة',
    deviceProtection: 'تفعيل حماية المحتوى وحظر لقطات الشاشة لحفظ الحقوق الفكرية'
  },
  en: {
    appName: 'Stad TV',
    subtitle: 'The Screen of Absolute Sports Power & Entertainment',
    home: 'Home',
    matches: 'Match Center',
    channels: 'Live TV Channels',
    movies: 'Movies & Cinema',
    series: 'TV Series',
    favorites: 'Favorites',
    adminPanel: 'Admin Dashboard',
    guestView: 'Guest Interface',
    searchPlaceholder: 'Search for channels, matches, movies, series...',
    liveNow: 'LIVE NOW',
    live: 'Live',
    upcoming: 'Live Soon',
    finished: 'Finished',
    vs: 'VS',
    todayMatches: "Today's Ultimate Clashes",
    tomorrowMatches: "Upcoming Big Matches",
    finishedMatches: 'Completed Matches & History',
    minuteShort: 'm',
    playNow: 'Watch Now',
    addFavorite: 'Add to Favorites',
    removeFavorite: 'Remove from Favorites',
    continueWatching: 'Continue Watching',
    featured: 'Featured & Recommended',
    sports: 'Sports & Live Action',
    entertainment: 'Entertainment & Global Shows',
    moviesTitle: 'Global Cinema & Movies',
    seriesTitle: 'TV Drama & Seasons',
    searchTitle: 'Targeted Search Search',
    noResults: 'Sorry, we found no matches for ',
    servers: 'Available Streaming Servers',
    details: 'Content Details',
    rating: 'Rating',
    year: 'Release Year',
    duration: 'Duration',
    description: 'Synopsis & Plot Outline',
    epg: 'Live Electronic Program Guide (EPG)',
    quality: 'Stream Quality Settings',
    swipeBrightnessVolume: 'Swipe up/down inside video to adjust volume / brightness controls',
    reconnect: 'Quick Reconnect to Refresh Signal',
    tvRemoteMode: 'Android TV Mode / Quick Key Navigation Enabled',
    login: 'Sports Account Login',
    signup: 'Register Account',
    vipStatus: 'Premium VIP Access',
    activateCode: 'Activate Promo Subscription Code',
    enterCode: 'Enter your 12-character activation hash',
    activateBtn: 'Instant Activation Confirmation',
    invalidCode: 'Activation code is expired or invalid',
    vipActiveSuccess: 'Your subscription successfully upgraded to Stad TV Premium VIP!',
    activeExpiry: 'Subscription Active Until Date',
    activeVipTitle: 'Activate Stad TV Premium Account',
    liveMatchStats: 'Live Confrontation Statistics',
    possession: 'Ball Possession',
    shotsOnTarget: 'Shots on Target',
    fouls: 'Fouls Committed',
    yellowCards: 'Yellow Cards',
    redCards: 'Red Cards',
    // Admin translations
    adminDashboard: 'Stad TV Server Controller Dashboard',
    dashboardOverview: 'Stream Performance and Node Monitoring',
    addMatch: 'Register New Match Schedule',
    addChannel: 'Deploy Live Stream Channel',
    addMovie: 'Add New Cinema Movie',
    addSeries: 'Add Dynamic TV Series Record',
    titleArLabel: 'Title in Arabic',
    titleEnLabel: 'Title in English',
    categoryArLabel: 'Category in Arabic',
    categoryEnLabel: 'Category in English',
    streamUrlLabel: 'Stream URL (HLS/M3U8/MP4)',
    team1Ar: 'Team 1 Arabic Name',
    team1En: 'Team 1 English Name',
    team1Logo: 'Team 1 Logo Path',
    team2Ar: 'Team 2 Arabic Name',
    team2En: 'Team 2 English Name',
    team2Logo: 'Team 2 Logo Path',
    tournamentArLabel: 'Tournament Arabic Name',
    tournamentEnLabel: 'Tournament English Name',
    matchTimeLabel: 'Match Clock time (e.g. 21:00)',
    matchDateLabel: 'Match Date (e.g. 2026-05-23)',
    posterArLabel: 'Poster Background Link URL',
    actionBtn: 'Persist Server Parameters',
    editItem: 'Edit Parameters',
    deleteItem: 'Purge Record',
    analyticsTotalMatches: 'Active Matches Configured',
    analyticsLiveNow: 'Concurrent Streams Live',
    analyticsTotalChannels: 'Total Channels Indexed',
    analyticsTotalVods: 'Media Assets (VODs) Indexed',
    activeUsersSim: 'Estimated Live Viewers (Simulated)',
    platformStatus: 'Node System Health Logs',
    allOnline: 'All egress pipelines nominal and optimized',
    pushNotificationLabel: 'Broadcast OTT Toast Notification Alert',
    pushNotificationPlaceholder: 'Enter push content... e.g., "The Madrid Derby kicks off in 5 minutes on server FHD!"',
    sendNotificationBtn: 'Publish Global Broadcast Alert',
    notificationSentSuccess: 'OTT Notification dispatched to active TV devices and clients!',
    categories: {
      all: 'All',
      sports: 'Sports Action',
      news: 'Global News',
      entertainment: 'Shows & Series',
      kids: 'Kids & Cartoons',
      documentary: 'Explorations'
    },
    userPanel: 'User Control Lounge',
    seasonsLabel: 'Seasons & Episodes',
    episodeLabel: 'Episode',
    noEPG: 'No current EPG stream listings found',
    vpnDetected: 'Connection Scanned: No VPN conflicts found - Pipeline Stable at 10Gbps',
    deviceProtection: 'DRM Screen Capture Protection and Watermarking Activated'
  }
};

export const INITIAL_AD_CONFIG: AdConfig = {
  active: true,
  provider: 'startio',
  bannerImage: 'https://images.unsplash.com/photo-1508847154043-be12a62861c1?w=800&auto=format&fit=crop&q=80',
  bannerLink: 'https://t.me/your_channel',
  interstitialActive: true,
  interstitialSeconds: 5,
  interstitialImage: 'https://images.unsplash.com/photo-1540747737956-378724044432?w=600&auto=format&fit=crop&q=80',
  interstitialLink: 'https://t.me/your_channel',
  htmlScript: `<!-- مثال كود إعلاني مخصص مثل Adsterra أو Start.io أو AdSense -->
<div style="padding: 15px; text-align: center; background: #0b1120; border: 1px solid #00c2ff; border-radius: 12px;">
  <p style="color: #00c2ff; font-weight: bold; margin: 0 0 5px 0; font-size: 11px;">إعلان مخصص مدمج (برمجياً)</p>
  <a href="https://t.me/your_channel" target="_blank" style="color: #ffffff; text-decoration: none; font-size: 13px; font-weight: bold;">
    🔥 انضم لقناتنا على التلجرام لمتابعة أحدث البث المباشر وتحديثات التطبيق المستمرة مجاناً!
  </a>
</div>`
};

