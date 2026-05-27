export type Language = 'ar' | 'en';

export interface Team {
  nameAr: string;
  nameEn: string;
  logo: string;
}

export interface Match {
  id: string;
  team1: Team;
  team2: Team;
  team1Score?: number;
  team2Score?: number;
  tournamentAr: string;
  tournamentEn: string;
  tournamentLogo: string;
  time: string; // e.g. "18:30"
  date: string; // YYYY-MM-DD
  status: 'live' | 'upcoming' | 'finished';
  minute?: number; // for live matches
  servers: { name: string; url: string }[];
  poster?: string;
  createdAt?: number; // Timestamp when match was registered or updated
  liveCreatedAt?: number; // Timestamp when match status was set to live
  statistics?: {
    possession: [number, number]; // [team1, team2]
    shotsOnTarget: [number, number];
    fouls: [number, number];
    yellowCards: [number, number];
    redCards: [number, number];
  };
}

export interface Channel {
  id: string;
  nameAr: string;
  nameEn: string;
  logo: string;
  category: string;
  streamUrl: string;
  backupUrl?: string;
  status: 'online' | 'offline';
  epg?: { time: string; titleAr: string; titleEn: string }[];
}

export interface Episode {
  id: string;
  titleAr: string;
  titleEn: string;
  episodeNumber: number;
  duration: string;
  streamUrl: string;
  backupUrl?: string;
}

export interface Season {
  id: string;
  seasonNumber: number;
  episodes: Episode[];
}

export interface VideoContent {
  id: string;
  titleAr: string;
  titleEn: string;
  type: 'movie' | 'series';
  poster: string;
  backdrop: string;
  categoryAr: string;
  categoryEn: string;
  rating: number;
  year: number;
  duration?: string; // e.g. "2h 15m" (for movies)
  descriptionAr: string;
  descriptionEn: string;
  streamUrl?: string; // for movies
  seasons?: Season[]; // for series
  isFeatured?: boolean;
}

export interface HomepageSlider {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  image: string;
  type: 'match' | 'channel' | 'movie' | 'series';
  targetId: string;
}

export interface ContinueWatching {
  id: string;
  contentId: string;
  titleAr: string;
  titleEn: string;
  poster: string;
  type: 'movie' | 'series' | 'channel' | 'match';
  progress: number; // percentage 0 - 100
  timeString: string; // e.g. "45:12" or Episode designation
  episodeNumber?: number;
  seasonNumber?: number;
}

export interface User {
  username: string;
  email: string;
  isVip: boolean;
  activationCode?: string;
  expiryDate?: string;
  isAdmin?: boolean;
}

export interface AdConfig {
  active: boolean;
  provider: 'admob' | 'startio' | 'custom' | 'adsense';
  bannerImage: string;
  bannerLink: string;
  interstitialActive: boolean;
  interstitialSeconds: number; // seconds to show interstitial before close
  interstitialImage: string;
  interstitialLink: string;
  htmlScript: string; // custom integration scripts/adsense tags
}
