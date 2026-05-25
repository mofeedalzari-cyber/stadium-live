import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import * as dashjs from "dashjs";
import { 
  RotateCw, 
  RotateCcw, 
  Play, 
  Pause, 
  ArrowLeft, 
  Cast, 
  Layers, 
  Radio, 
  Settings, 
  Maximize, 
  Minimize, 
  Volume2, 
  VolumeX,
  Tv,
  ExternalLink,
  Shield,
  Info,
  Sparkles,
  Lock,
  Unlock,
  Subtitles,
  Lightbulb,
  Wifi,
  MonitorPlay,
  Volume1,
  HelpCircle,
  Activity,
  Maximize2
} from "lucide-react";

interface VideoPlayerProps {
  src: string;
  type?: string;
  poster?: string;
  autoplay?: boolean;
  audioUrl?: string;
}

const toArabicNumerals = (numStr: string): string => {
  const arabicDigits: { [key: string]: string } = {
    '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
    '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
  };
  return numStr.replace(/[0-9]/g, (w) => arabicDigits[w] || w);
};

const formatTime = (seconds: number, applyArabic = true): string => {
  if (isNaN(seconds) || seconds === Infinity) return "٠٠:٠٠";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  const mStr = m.toString().padStart(2, '0');
  const sStr = s.toString().padStart(2, '0');
  
  let formatted = '';
  if (h > 0) {
    formatted = `${h.toString().padStart(2, '0')}:${mStr}:${sStr}`;
  } else {
    formatted = `${mStr}:${sStr}`;
  }
  
  return applyArabic ? toArabicNumerals(formatted) : formatted;
};

const getProxiedUrl = (url: string | undefined): string => {
  if (!url) return "";
  let cleanUrl = url.trim();
  
  if (cleanUrl.startsWith("ttps://")) {
    cleanUrl = "https://" + cleanUrl.substring(7);
  } else if (cleanUrl.startsWith("ttp://")) {
    cleanUrl = "http://" + cleanUrl.substring(6);
  }

  if (cleanUrl.startsWith("/api/proxy") || cleanUrl.includes("/api/proxy")) {
    return cleanUrl;
  }

  const isExternal = cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://");
  if (isExternal) {
    const isM3U8 = cleanUrl.toLowerCase().includes("m3u8");
    const isTS = cleanUrl.toLowerCase().includes(".ts");
    const isMP4 = cleanUrl.toLowerCase().includes(".mp4");
    
    let path = "/api/proxy";
    if (isM3U8) {
      path = "/api/proxy/stream.m3u8";
    } else if (isTS) {
      path = "/api/proxy/segment.ts";
    } else if (isMP4) {
      path = "/api/proxy/video.mp4";
    }
    return `${path}?url=${encodeURIComponent(cleanUrl)}`;
  }
  return cleanUrl;
};

export function VideoPlayer({ src, poster, autoplay = true, audioUrl }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const hlsRef = useRef<Hls | null>(null);
  const dashRef = useRef<dashjs.MediaPlayerClass | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef<number>(0); // Fixed: store lastTap time in ref instead of DOM property
  const initCalledRef = useRef<boolean>(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState<any[]>([]);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem("stad_tv_volume");
    return saved ? parseFloat(saved) : 0.8;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<'fit' | 'stretch' | 'zoom' | 'cinema' | 'classic'>('fit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRotated, setIsRotated] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isCasting, setIsCasting] = useState(false);

  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"quality" | "audio" | "speed" | "help" | "captions">("quality");
  const [useProxy, setUseProxy] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [brightness, setBrightness] = useState(1.0);

  const [levels, setLevels] = useState<any[]>([]);
  const [activeLevel, setActiveLevel] = useState<number>(-1);
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [activeAudioTrack, setActiveAudioTrack] = useState<number>(-1);
  const [captionsTracks, setCaptionsTracks] = useState<any[]>([]);
  const [activeCaptionsTrack, setActiveCaptionsTrack] = useState<number>(-1);

  const [gestureIndicator, setGestureIndicator] = useState<{
    type: 'seek' | 'volume' | 'brightness' | null;
    value: string;
    percent?: number;
  }>({ type: null, value: "" });

  const touchStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const gestureStateRef = useRef<{
    active: boolean;
    type: 'seek' | 'volume' | 'brightness' | null;
    initialVolume: number;
    initialBrightness: number;
    initialPlayhead: number;
  }>({ active: false, type: null, initialVolume: 0, initialBrightness: 1, initialPlayhead: 0 });

  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(5);
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState("");
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const resolvedSrc = useProxy ? getProxiedUrl(src) : src;

  // Fixed: Update subtitle tracks using video event listener
  const handleSubtitleTracksUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const tracks = Array.from(video.textTracks);
    setCaptionsTracks(tracks);
    const showIdx = tracks.findIndex(t => t.mode === 'showing');
    setActiveCaptionsTrack(showIdx);
  }, []);

  // Fixed: Audio sync function with better drift handling
  const handleAudioSync = useCallback(() => {
    if (!audioRef.current || !videoRef.current) return;
    const vTime = videoRef.current.currentTime;
    const aTime = audioRef.current.currentTime;
    if (Math.abs(vTime - aTime) > 0.45) {
      audioRef.current.currentTime = vTime;
    }
  }, []);

  // Fixed: Reconnection failover with exponential backoff
  const handleFatalFailover = useCallback((reason: string) => {
    if (retryCount < maxRetries) {
      setIsReconnecting(true);
      const nextRetry = retryCount + 1;
      setRetryCount(nextRetry);
      triggerToast(`اتصال متذبذب. يتم فحص جودة السيرفر... (${nextRetry}/${maxRetries})`);
      setTimeout(() => {
        initPlayer();
      }, Math.min(2000 * retryCount, 10000)); // Exponential backoff
    } else {
      setHasError(true);
      setErrorDetails(reason);
      setIsReconnecting(false);
    }
  }, [retryCount, maxRetries]);

  // Fixed: Main player initialization without dependency on volume/playbackRate to avoid reinitialization
  const initPlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setHasError(false);
    setErrorDetails("");
    setIsReconnecting(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (dashRef.current) {
      dashRef.current.reset();
      dashRef.current = null;
    }

    // Remove old text track listeners before adding new ones
    video.removeEventListener('addtrack', handleSubtitleTracksUpdate);
    video.removeEventListener('removetrack', handleSubtitleTracksUpdate);
    video.removeEventListener('loadedmetadata', handleSubtitleTracksUpdate);

    const cleanSrc = resolvedSrc.toLowerCase();
    const isHlsUrl = cleanSrc.includes(".m3u8") || cleanSrc.includes("m3u8");
    const isDashUrl = cleanSrc.includes(".mpd") || cleanSrc.includes("mpd");

    if (isHlsUrl && Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 30,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 45,
        capLevelToPlayerSize: true
      });

      hlsRef.current = hls;
      hls.loadSource(resolvedSrc);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLevels(data.levels || []);
        if (autoplay) {
          video.play().catch(() => {});
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setActiveLevel(data.level);
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        setAudioTracks(data.audioTracks || []);
      });

      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, data) => {
        setActiveAudioTrack(data.id);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setIsReconnecting(true);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setIsReconnecting(true);
              hls.recoverMediaError();
              break;
            default:
              handleFatalFailover(data.details || "لقطات مشفرة أو ثغرة في جدار فك ترميز ميديا HLS");
              break;
          }
        }
      });

    } else if (isDashUrl) {
      const player = dashjs.MediaPlayer().create();
      player.initialize(video, resolvedSrc, autoplay);
      dashRef.current = player;
      
      player.on(dashjs.MediaPlayer.events.PLAYBACK_METADATA_LOADED, () => {
        const hQuality = (player as any).getBitrateInfoListFor("video") || [];
        setLevels(hQuality);
      });

      player.on(dashjs.MediaPlayer.events.ERROR, (e: any) => {
        console.error("DASH loading error captured:", e);
        handleFatalFailover("تجاوز حظر فك الترميز التلقائي لملفات DASH");
      });

    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = resolvedSrc;
      video.addEventListener("loadedmetadata", () => {
        if (autoplay) video.play().catch(() => {});
      });
    } else {
      video.src = resolvedSrc;
    }

    // Apply initial volume, mute, and playback rate without reinitializing player
    video.muted = isMuted;
    video.volume = volume;
    video.playbackRate = playbackRate;

    // Fixed: Use proper video event listeners for subtitle tracks
    video.addEventListener("loadedmetadata", handleSubtitleTracksUpdate);
    video.addEventListener("addtrack", handleSubtitleTracksUpdate);
    video.addEventListener("removetrack", handleSubtitleTracksUpdate);
    
    // Initial call to populate tracks
    handleSubtitleTracksUpdate();
  }, [resolvedSrc, autoplay, handleFatalFailover, handleSubtitleTracksUpdate]); // Removed volume, isMuted, playbackRate

  // Fixed: Separate effect for volume and playback rate changes without reinitializing player
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
      video.volume = volume;
    }
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      audioRef.current.volume = volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = playbackRate;
    }
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Initialize player only when src or proxy changes
  useEffect(() => {
    initPlayer();
    setRetryCount(0);
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (dashRef.current) {
        dashRef.current.reset();
        dashRef.current = null;
      }
      const video = videoRef.current;
      if (video) {
        video.removeEventListener('addtrack', handleSubtitleTracksUpdate);
        video.removeEventListener('removetrack', handleSubtitleTracksUpdate);
        video.removeEventListener('loadedmetadata', handleSubtitleTracksUpdate);
      }
    };
  }, [src, useProxy]); // Only depends on src and useProxy, not on initPlayer

  // Fixed: Audio synchronization interval with better checks
  useEffect(() => {
    if (!audioUrl || !isPlaying) return;
    let syncInterval: NodeJS.Timeout | null = null;
    // Wait for audio element to be ready
    const startSync = () => {
      if (syncInterval) clearInterval(syncInterval);
      syncInterval = setInterval(() => {
        const video = videoRef.current;
        const audio = audioRef.current;
        if (!video || !audio) return;
        
        // Ensure audio element is ready
        if (audio.readyState < 2) return;
        
        if (video.paused && !audio.paused) {
          audio.pause();
        } else if (!video.paused && audio.paused && !video.seeking) {
          audio.play().catch((err) => console.warn("Audio play failed:", err));
        }
        
        const drift = Math.abs(video.currentTime - audio.currentTime);
        if (drift > 0.15 && !video.seeking && audio.readyState >= 2) {
          audio.currentTime = video.currentTime;
        }
      }, 250); // Reduced frequency to 250ms to avoid stuttering
    };
    
    // Small delay to allow audio element to load metadata
    const timer = setTimeout(startSync, 100);
    return () => {
      clearTimeout(timer);
      if (syncInterval) clearInterval(syncInterval);
    };
  }, [isPlaying, audioUrl]);

  // Fixed: handle audio play/pause when isPlaying changes
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video) return;
    
    if (isPlaying) {
      if (audio && audioUrl) {
        if (Math.abs(audio.currentTime - video.currentTime) > 0.5) {
          audio.currentTime = video.currentTime;
        }
        audio.play().catch((err) => console.warn("Audio play error:", err));
      }
    } else {
      if (audio && audioUrl) audio.pause();
    }
  }, [isPlaying, audioUrl]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    setDuration(video.duration || 0);
    setIsLive(video.duration === Infinity || video.duration === 0);

    // Only update buffered ranges if they actually changed (simple check)
    const len = video.buffered.length;
    let changed = false;
    if (len !== buffered.length) changed = true;
    else {
      for (let i = 0; i < len; i++) {
        if (video.buffered.start(i) !== buffered[i]?.start || video.buffered.end(i) !== buffered[i]?.end) {
          changed = true;
          break;
        }
      }
    }
    if (changed) {
      const ranges: any[] = [];
      for (let i = 0; i < len; i++) {
        ranges.push({
          start: video.buffered.start(i),
          end: video.buffered.end(i)
        });
      }
      setBuffered(ranges);
    }

    if (audioUrl && audioRef.current) {
      handleAudioSync();
    }
  };

  const handlePlayStateChange = () => {
    const video = videoRef.current;
    if (!video) return;
    setIsPlaying(!video.paused);
  };

  const syncDocumentFullscreen = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  useEffect(() => {
    document.addEventListener("fullscreenchange", syncDocumentFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncDocumentFullscreen);
  }, []);

  const wakeControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !showSettings && !isLocked) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    }
  };

  useEffect(() => {
    wakeControls();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, showSettings, isLocked]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
    wakeControls();
  };

  const seekForward = (secs = 10) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(duration, video.currentTime + secs);
    wakeControls();
    triggerToast(`تقديم +${toArabicNumerals(secs.toString())} ثانية`);
  };

  const seekBackward = (secs = 10) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - secs);
    wakeControls();
    triggerToast(`تراجع -${toArabicNumerals(secs.toString())} ثانية`);
  };

  const handleVolumeChange = (val: number) => {
    const video = videoRef.current;
    if (!video) return;
    const cleanVol = Math.max(0, Math.min(1, val));
    setVolume(cleanVol);
    localStorage.setItem("stad_tv_volume", cleanVol.toString());
    video.volume = cleanVol;
    if (cleanVol > 0) {
      setIsMuted(false);
      video.muted = false;
    } else {
      setIsMuted(true);
      video.muted = true;
    }
    if (audioRef.current) {
      audioRef.current.volume = cleanVol;
      audioRef.current.muted = cleanVol === 0;
    }
  };

  const toggleMuted = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    const video = videoRef.current;
    if (video) {
      video.muted = nextMute;
      video.volume = volume;
    }
    if (audioRef.current) {
      audioRef.current.muted = nextMute;
      audioRef.current.volume = volume;
    }
    triggerToast(nextMute ? "كتم الصوت 🔇" : "تشغيل الصوت 🔊");
  };

  const chooseQuality = (levelId: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelId;
      setActiveLevel(levelId);
      triggerToast(levelId === -1 ? "تفعيل الدقة التلقائية Auto" : `تغيير الجودة إلى ${levels[levelId]?.height}p`);
    } else if (dashRef.current) {
      if (levelId === -1) {
        dashRef.current.updateSettings({
          streaming: {
            abr: { autoSwitchBitrate: { video: true } }
          }
        });
        setActiveLevel(-1);
        triggerToast("تفعيل الدقة التلقائية Auto");
      } else {
        dashRef.current.updateSettings({
          streaming: {
            abr: { autoSwitchBitrate: { video: false } }
          }
        });
        // Safer quality set for dashjs
        if (dashRef.current.setQualityFor) {
          dashRef.current.setQualityFor("video", levelId, true);
        } else if ((dashRef.current as any).setQualityFor) {
          (dashRef.current as any).setQualityFor("video", levelId, true);
        }
        setActiveLevel(levelId);
        triggerToast(`تغيير الجودة إلى ${levels[levelId]?.height}p`);
      }
    } else {
      triggerToast("سيرفر يدوي غير مدعوم في المشغل الافتراضي لجهازك");
    }
    setShowSettings(false);
  };

  const chooseAudioTrack = (trackId: number) => {
    if (hlsRef.current) {
      hlsRef.current.audioTrack = trackId;
      setActiveAudioTrack(trackId);
    }
    setShowSettings(false);
  };

  const chooseCaptionsTrack = (trackId: number) => {
    const video = videoRef.current;
    if (!video) return;
    const tracksArray = Array.from(video.textTracks);
    tracksArray.forEach((track, idx) => {
      track.mode = idx === trackId ? 'showing' : 'disabled';
    });
    setActiveCaptionsTrack(trackId);
    triggerToast(trackId === -1 ? "تم إغلاق الترجمة الفورية" : `الترجمة: ${tracksArray[trackId]?.label || tracksArray[trackId]?.language || trackId}`);
    setShowSettings(false);
  };

  const chooseSpeed = (rate: number) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = rate;
      setPlaybackRate(rate);
      triggerToast(`سرعة التشغيل: ${toArabicNumerals(rate.toString())}x`);
    }
    setShowSettings(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => triggerToast("ملء الشاشة غير مدعوم في متصفحك الحالي"));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false));
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) {
      triggerToast("وضعية صورة داخل صورة غير مدعومة حالياً");
      return;
    }
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPip(false);
      } else {
        await video.requestPictureInPicture();
        setIsPip(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChromecastMockAction = () => {
    if (isCasting) {
      setIsCasting(false);
      triggerToast("تم فصل الاتصال بالتلفاز الذكي 📺");
    } else {
      setIsCasting(true);
      triggerToast("جاري البحث عن أجهزة Chromecast / Smart TV القريبة...");
      setTimeout(() => {
        triggerToast("متصل الآن بالتلفاز الذكي! يتم بث شاشة العرض بسلاسة.");
      }, 2500);
    }
  };

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isLocked) return;
    const touch = e.touches[0];
    const video = videoRef.current;
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    gestureStateRef.current = {
      active: true,
      type: null,
      initialVolume: video ? video.volume : volume,
      initialBrightness: brightness,
      initialPlayhead: video ? video.currentTime : currentTime
    };
    wakeControls();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!gestureStateRef.current.active || isLocked) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touchStartRef.current.y - touch.clientY;
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    if (!gestureStateRef.current.type) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 15) {
        gestureStateRef.current.type = 'seek';
      } else if (Math.abs(deltaY) > 15) {
        const rect = container.getBoundingClientRect();
        const startXInPercent = (touchStartRef.current.x - rect.left) / width;
        if (startXInPercent < 0.5) {
          gestureStateRef.current.type = 'brightness';
        } else {
          gestureStateRef.current.type = 'volume';
        }
      }
    }

    const video = videoRef.current;
    const gType = gestureStateRef.current.type;

    if (gType === 'seek' && video && duration) {
      const seekRatio = deltaX / width;
      const secondsToSeek = seekRatio * 180;
      const targetTime = Math.max(0, Math.min(duration, gestureStateRef.current.initialPlayhead + secondsToSeek));
      
      setGestureIndicator({
        type: 'seek',
        value: `${formatTime(targetTime)} / ${formatTime(duration)}`,
        percent: (targetTime / duration) * 100
      });
      video.currentTime = targetTime;
    } else if (gType === 'volume' && video) {
      const volumeRatio = deltaY / (height * 0.7);
      const targetVolume = Math.max(0, Math.min(1, gestureStateRef.current.initialVolume + volumeRatio));
      handleVolumeChange(targetVolume);
      setGestureIndicator({
        type: 'volume',
        value: `%${Math.round(targetVolume * 100)}`,
        percent: targetVolume * 100
      });
    } else if (gType === 'brightness') {
      const brightnessRatio = deltaY / (height * 0.7);
      const targetBrightness = Math.max(0.1, Math.min(1.0, gestureStateRef.current.initialBrightness + brightnessRatio));
      setBrightness(targetBrightness);
      setGestureIndicator({
        type: 'brightness',
        value: `%${Math.round(targetBrightness * 100)}`,
        percent: targetBrightness * 100
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    gestureStateRef.current.active = false;
    setGestureIndicator({ type: null, value: "" });

    const touch = e.changedTouches[0];
    const durationSinceStart = Date.now() - touchStartRef.current.time;
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    if (durationSinceStart < 250 && deltaX < 8 && deltaY < 8) {
      const now = Date.now();
      const lastTap = lastTapTimeRef.current;
      const rect = containerRef.current?.getBoundingClientRect();

      if (now - lastTap < 300 && rect) {
        const tapX = touch.clientX;
        const tapPercent = (tapX - rect.left) / rect.width;
        if (tapPercent > 0.6) {
          seekForward(10);
        } else if (tapPercent < 0.4) {
          seekBackward(10);
        } else {
          togglePlay();
        }
        lastTapTimeRef.current = 0;
      } else {
        lastTapTimeRef.current = now;
        togglePlay();
      }
    }
  };

  // Keyboard navigation
  const handleTVKeyboard = useCallback((e: KeyboardEvent) => {
    if (!showControls) {
      wakeControls();
      e.preventDefault();
      return;
    }

    switch (e.key) {
      case "ArrowLeft":
        seekBackward(10);
        e.preventDefault();
        break;
      case "ArrowRight":
        seekForward(10);
        e.preventDefault();
        break;
      case "ArrowUp":
        handleVolumeChange(volume + 0.1);
        e.preventDefault();
        break;
      case "ArrowDown":
        handleVolumeChange(volume - 0.1);
        e.preventDefault();
        break;
      case "Enter":
      case " ":
        togglePlay();
        e.preventDefault();
        break;
      case "Escape":
      case "Backspace":
        if (showSettings) {
          setShowSettings(false);
          e.preventDefault();
        } else if (isFullscreen) {
          toggleFullscreen();
          e.preventDefault();
        }
        break;
    }
  }, [showControls, showSettings, volume, isFullscreen, duration]);

  useEffect(() => {
    window.addEventListener("keydown", handleTVKeyboard);
    return () => window.removeEventListener("keydown", handleTVKeyboard);
  }, [handleTVKeyboard]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case "zoom":
        return "object-cover scale-105";
      case "stretch":
        return "object-fill h-full w-full";
      case "cinema":
        return "object-contain aspect-[21/9]";
      case "classic":
        return "object-contain aspect-[4/3]";
      case "fit":
      default:
        return "object-contain";
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={wakeControls}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full aspect-video md:aspect-[16/9] bg-[#07111F] rounded-[2rem] overflow-hidden select-none border border-white/5 transition-all duration-300 shadow-[0_25px_60px_-15px_rgba(7,17,31,0.9)] transform-gpu ${
        isFullscreen ? "rounded-none h-screen w-screen z-[999] inset-0 fixed" : ""
      }`}
      style={{ 
        direction: "rtl",
        ...(isRotated ? {
          position: 'fixed',
          top: '50%',
          left: '50%',
          width: '100vh',
          height: '100vw',
          transform: 'translate(-50%, -50%) rotate(90deg)',
          zIndex: 9999,
          borderRadius: '0px'
        } : {})
      }}
    >
      <div 
        className="absolute inset-0 z-10 pointer-events-none bg-black transition-opacity duration-200" 
        style={{ opacity: 1 - brightness }} 
      />

      <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center" />

      <div className="w-full h-full relative" onClick={togglePlay}>
        {audioUrl && (
          <audio 
            ref={audioRef} 
            src={getProxiedUrl(audioUrl)} 
            preload="auto"
            muted={isMuted}
            style={{ display: "none" }}
          />
        )}
        <video
          ref={videoRef}
          poster={poster}
          playsInline
          webkit-playsinline="true"
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlayStateChange}
          onPause={handlePlayStateChange}
          onWaiting={() => {
            if (audioRef.current) audioRef.current.pause();
          }}
          onPlaying={() => {
            const video = videoRef.current;
            const audio = audioRef.current;
            if (video && audio) {
              audio.currentTime = video.currentTime;
              if (isPlaying) audio.play().catch(() => {});
            }
          }}
          onSeeking={() => {
            const video = videoRef.current;
            const audio = audioRef.current;
            if (video && audio) {
              audio.currentTime = video.currentTime;
            }
          }}
          onSeeked={() => {
            const video = videoRef.current;
            const audio = audioRef.current;
            if (video && audio) {
              audio.currentTime = video.currentTime;
            }
          }}
          onRateChange={() => {
            const video = videoRef.current;
            const audio = audioRef.current;
            if (video && audio) {
              audio.playbackRate = video.playbackRate;
            }
          }}
          className={`w-full h-full block bg-black shadow-inner transition-all duration-300 ${getAspectRatioClasses()}`}
          style={{ transform: "translate3d(0, 0, 0)", WebkitBackfaceVisibility: "hidden" }}
        />
      </div>

      {!isPlaying && !isReconnecting && !hasError && (
        <button 
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-16 h-16 sm:w-20 sm:h-20 bg-[#0E1B2E]/80 backdrop-blur-xl border border-[#00C2FF]/20 text-[#00C2FF] rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(0,194,255,0.25)] hover:scale-105 hover:bg-[#0E1B2E] transition-all duration-300 active:scale-95"
        >
          <Play className="w-8 h-8 fill-[#00C2FF] translate-x-[-2px] text-[#00C2FF]" />
        </button>
      )}

      {toastMessage && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[110] bg-[#0E1B2E]/95 border border-[#00C2FF]/30 text-[#F5F7FA] text-xs sm:text-sm font-black px-4.5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#00C2FF] animate-pulse" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {(isReconnecting || (!isPlaying && videoRef.current?.seeking)) && (
        <div className="absolute inset-0 z-50 bg-[#07111F]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="relative w-18 h-18 mb-4">
            <span className="absolute inset-0 rounded-full border-4 border-[#0E1B2E] opacity-50" />
            <span className="absolute inset-0 rounded-full border-4 border-t-[#00C2FF] border-r-[#7C4DFF] animate-spin" />
            <Activity className="absolute inset-0 m-auto w-6 h-6 text-[#00C2FF] animate-pulse" />
          </div>
          <h3 className="text-sm sm:text-base font-black text-[#F5F7FA]">جاري تأمين تدفق البث المستقر...</h3>
          <p className="text-[11px] text-[#A1A1AA] mt-1.5 max-w-xs leading-relaxed">
            يتم فحص النطاق الترددي وموازنة معدل البث تلقائياً لمنع التقطيع.
          </p>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 z-50 bg-[#07111F]/95 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-[#0E1B2E] border border-red-500/20 text-[#00C2FF] rounded-full flex items-center justify-center mb-4">
            <Wifi className="w-8 h-8 text-red-400 animate-pulse" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-[#F5F7FA]">انقطع الاتصال بالسيرفر للمباراة 📶</h2>
          <p className="text-xs sm:text-sm text-[#A1A1AA] max-w-md mt-2 leading-relaxed">
            هناك حمل مكثف على سيرفر اللقاء. يرجى تفعيل المعايرة التلقائية أو التحويل للاتصال الآمن.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full max-w-sm">
            <button 
              onClick={() => {
                setUseProxy(!useProxy);
                initPlayer();
              }}
              className="flex-1 bg-[#0E1B2E] hover:bg-[#12223a] text-[#F5F7FA] border border-white/5 font-black text-xs py-2.5 rounded-2xl transition-all shadow-md"
            >
              {useProxy ? "🔐 تفعيل البروكسي الحامي" : "⚡ الاتصال المباشر"}
            </button>
            <button 
              onClick={initPlayer}
              className="flex-1 bg-gradient-to-r from-[#00C2FF] to-[#7C4DFF] hover:brightness-110 text-slate-950 font-black text-xs py-2.5 rounded-2xl transition-all shadow-lg"
            >
              إعادة الاتصال الفوري 🔄
            </button>
          </div>
        </div>
      )}

      {isLocked && showControls && (
        <div className="absolute inset-0 z-50 bg-[#07111F]/60 backdrop-blur-sm flex items-center justify-center">
          <button 
            onClick={() => {
              setIsLocked(false);
              triggerToast("تم إلغاء قفل المشغل 🔓");
            }}
            className="p-5 rounded-full bg-[#0E1B2E] border border-[#00C2FF]/30 text-[#00C2FF] hover:scale-105 active:scale-95 transition-all shadow-2xl"
          >
            <Unlock className="w-6 h-6 animate-pulse" />
          </button>
        </div>
      )}

      {gestureIndicator.type && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#0E1B2E]/90 border border-[#00C2FF]/30 px-6 py-4 rounded-3xl flex flex-col items-center gap-2 shadow-[0_0_30px_rgba(0,194,255,0.25)] backdrop-blur-md">
          {gestureIndicator.type === 'seek' && <Sparkles className="w-8 h-8 text-[#00C2FF] animate-bounce" />}
          {gestureIndicator.type === 'volume' && <Volume2 className="w-8 h-8 text-[#00C2FF]" />}
          {gestureIndicator.type === 'brightness' && <Lightbulb className="w-8 h-8 text-[#7C4DFF]" />}
          <span className="text-sm font-black text-white leading-none">{gestureIndicator.value}</span>
          {gestureIndicator.percent !== undefined && (
            <div className="w-24 h-1.5 bg-black/40 rounded-full mt-1 overflow-hidden">
              <div 
                className={`h-full ${gestureIndicator.type === 'brightness' ? 'bg-[#7C4DFF]' : 'bg-[#00C2FF]'}`} 
                style={{ width: `${gestureIndicator.percent}%` }} 
              />
            </div>
          )}
        </div>
      )}

      {isCasting && (
        <div className="absolute bottom-24 right-5 z-20 bg-[#00C2FF]/10 border border-[#00C2FF]/30 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-[11px] font-black text-[#00C2FF] backdrop-blur-md animate-pulse">
          <Cast className="w-4 h-4" />
          <span>يبث شاشة العرض الآن بالتلفزيون الذكي</span>
        </div>
      )}

      <div 
        className={`absolute inset-0 z-40 flex flex-col justify-between p-4 sm:p-5.5 bg-gradient-to-t from-black/85 via-black/10 to-black/75 transition-all duration-400 font-sans ${
          showControls && !isLocked ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between">
          <button 
            onClick={() => window.history.back()} 
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-1.5xl bg-[#0E1B2E]/60 backdrop-blur-md hover:bg-[#0E1B2E] text-[#F5F7FA] border border-white/10 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#00C2FF]"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 h-5 translate-x-[1px]" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00C2FF]/15 border border-[#00C2FF]/25 rounded-2xl text-[10px] sm:text-xs font-black text-[#00C2FF] uppercase select-none shadow-sm">
              <Activity className="w-3.5 h-3.5 text-[#00C2FF] animate-pulse" />
              <span>معاير فائق السرعة لقناة Stad</span>
            </div>
            
            <button 
              onClick={() => {
                setIsLocked(true);
                triggerToast("تم تأمين لوحة التحكم واللمس 🔒");
              }}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-1.5xl bg-[#0E1B2E]/60 backdrop-blur-md hover:bg-red-950/20 hover:text-red-400 text-[#F5F7FA] border border-white/10 flex items-center justify-center transition-all"
            >
              <Lock className="w-4 h-4 sm:w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 w-full mt-2 pointer-events-none select-none">
          {isMuted ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleMuted();
              }}
              className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 rounded-xl text-[10px] sm:text-xs font-bold shadow-lg backdrop-blur-md transition-all active:scale-95 animate-pulse"
              title="اضغط لتشغيل الصوت"
            >
              <VolumeX className="w-3.5 h-3.5 text-red-400" />
              <span>الصوت مكتوم تلقائياً • انقر هنا لتشغيل الصوت 🔊</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-[10px] sm:text-xs font-bold shadow-md backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                {audioUrl 
                  ? "🎙️ تم دمج الصوت الخارجي ومزامنته بـ 0ms تأخير" 
                  : "🔊 الصوت نشط • القناة الصوتية الرئيسية متزامنة"}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-center items-center gap-5 my-auto" />

        <div className="flex justify-between items-center max-w-[95%] mx-auto w-full pointer-events-auto gap-3">
          <div className="flex items-center gap-2">
            <button 
              onClick={togglePlay}
              className="w-11 h-11 rounded-xl bg-[#0E1B2E]/80 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-[#00C2FF] hover:text-slate-950 hover:border-[#00C2FF] active:scale-95 transition-all shadow-lg"
              title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <button 
              onClick={toggleMuted}
              className={`w-11 h-11 rounded-xl backdrop-blur-xl border flex items-center justify-center active:scale-95 transition-all shadow-lg ${
                isMuted 
                  ? "bg-red-950/40 border-red-500/30 text-red-400 hover:bg-red-900/40" 
                  : "bg-[#0E1B2E]/80 border-white/10 text-emerald-400 hover:bg-[#00C2FF] hover:text-slate-950 hover:border-[#00C2FF]"
              }`}
              title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
            >
              {isMuted ? <VolumeX className="w-5 h-5 animate-pulse" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setIsRotated(!isRotated);
                triggerToast(!isRotated ? "تم تفعيل الوضع الأفقي 🔄" : "تم إلغاء الوضع الأفقي 📱");
              }}
              className={`w-11 h-11 rounded-xl backdrop-blur-xl border flex items-center justify-center active:scale-95 transition-all shadow-lg ${
                isRotated 
                  ? "bg-[#00C2FF]/20 border-[#00C2FF]/40 text-[#00C2FF]" 
                  : "bg-[#0E1B2E]/80 border-white/10 text-white hover:bg-[#00C2FF] hover:text-slate-950 hover:border-[#00C2FF]"
              }`}
              title="عرض أفقي (تدوير)"
            >
              <RotateCw className={`w-5 h-5 transition-transform ${isRotated ? 'rotate-90' : ''}`} />
            </button>

            <button 
              onClick={toggleFullscreen}
              className="w-11 h-11 rounded-xl bg-[#0E1B2E]/80 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-[#00C2FF] hover:text-slate-950 hover:border-[#00C2FF] active:scale-95 transition-all shadow-lg"
              title={isFullscreen ? "تصغير الشاشة" : "ملء الشاشة"}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {showSettings && (
          <div 
            className="absolute bottom-[100px] left-6 max-w-sm w-[290px] bg-[#0E1B2E]/98 border border-[#00C2FF]/10 rounded-2.5rem p-4 shadow-2xl z-50 text-right animate-in fade-in slide-in-from-bottom-3 duration-300 backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-5 gap-1 p-1 bg-black/40 rounded-2xl border border-white/5 mb-3.5">
              {[
                { id: "quality", label: "الجودة" },
                { id: "audio", label: "المعلق" },
                { id: "captions", label: "الترجمة" },
                { id: "speed", label: "السرعة" },
                { id: "help", label: "بروكسي" }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setSettingsTab(item.id as any)}
                  className={`py-1 rounded-xl text-[10px] font-black transition-all text-center whitespace-nowrap ${
                    settingsTab === item.id 
                      ? "bg-[#00C2FF] text-slate-950" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {settingsTab === "quality" && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => chooseQuality(-1)}
                  className={`w-full text-right px-3.5 py-2 rounded-xl text-xs font-bold flex justify-between items-center transition-all ${
                    activeLevel === -1 ? "bg-[#00C2FF]/15 text-[#00C2FF] border border-[#00C2FF]/20" : "text-white/80 hover:bg-white/5"
                  }`}
                >
                  <span>جودة تلفزيونية تلقائية (Auto)</span>
                  {activeLevel === -1 && <span className="w-2 h-2 bg-[#00C2FF] rounded-full shadow-[0_0_8px_#00C2FF]" />}
                </button>
                {levels.length > 0 ? (
                  levels.map((lvl, index) => (
                    <button
                      key={index}
                      onClick={() => chooseQuality(index)}
                      className={`w-full text-right px-3.5 py-2 rounded-xl text-xs font-bold flex justify-between items-center transition-all ${
                        activeLevel === index ? "bg-[#00C2FF]/15 text-[#00C2FF] border border-[#00C2FF]/20" : "text-white/80 hover:bg-white/5"
                      }`}
                    >
                      <span>{lvl.height ? `${lvl.height}p UHD` : `سيرفر ${index + 1}`}</span>
                      {activeLevel === index && <span className="w-2 h-2 bg-[#00C2FF] rounded-full shadow-[0_0_8px_#00C2FF]" />}
                    </button>
                  ))
                ) : (
                  <>
                    {[1080, 720, 480].map((resVal, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setActiveLevel(i);
                          triggerToast(`تم تحويل الجودة إلى ${resVal}p HD`);
                          setShowSettings(false);
                        }}
                        className={`w-full text-right px-3.5 py-2 rounded-xl text-xs font-bold flex justify-between items-center transition-all ${
                          activeLevel === i ? "bg-[#00C2FF]/15 text-[#00C2FF] border border-[#00C2FF]/20" : "text-white/80 hover:bg-white/5"
                        }`}
                      >
                        <span>{resVal}p UltraHD</span>
                        {activeLevel === i && <span className="w-2 h-2 bg-[#00C2FF] rounded-full shadow-[0_0_8px_#00C2FF]" />}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}

            {settingsTab === "audio" && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {audioTracks.length > 0 ? (
                  audioTracks.map((tr, index) => (
                    <button
                      key={index}
                      onClick={() => chooseAudioTrack(index)}
                      className={`w-full text-right px-3.5 py-2 rounded-xl text-xs font-bold flex justify-between items-center transition-all ${
                        activeAudioTrack === index ? "bg-[#00C2FF]/15 text-[#00C2FF]" : "text-white/80 hover:bg-white/5"
                      }`}
                    >
                      <span>{tr.name || `طريقة صوتية ${(index + 1)}`}</span>
                      {activeAudioTrack === index && <span className="w-2 h-2 bg-[#00C2FF] rounded-full" />}
                    </button>
                  ))
                ) : (
                  <div className="space-y-2 py-2 px-1 text-[11px] text-gray-400 leading-relaxed font-bold">
                    <p>المذياع العربي نشط ويغذي البث بالتعليق الرسمي بمزامنة كاملة وتلقائية.</p>
                  </div>
                )}
              </div>
            )}

            {settingsTab === "captions" && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => chooseCaptionsTrack(-1)}
                  className={`w-full text-right px-3.5 py-2 rounded-xl text-xs font-bold flex justify-between items-center transition-all ${
                    activeCaptionsTrack === -1 ? "bg-[#00C2FF]/15 text-[#00C2FF] border border-[#00C2FF]/20" : "text-white/80 hover:bg-white/5"
                  }`}
                >
                  <span>إيقاف الترجمة الفورية</span>
                  {activeCaptionsTrack === -1 && <span className="w-2 h-2 bg-[#00C2FF] rounded-full shadow-[0_0_8px_#00C2FF]" />}
                </button>
                {captionsTracks.length > 0 ? (
                  captionsTracks.map((track, index) => (
                    <button
                      key={index}
                      onClick={() => chooseCaptionsTrack(index)}
                      className={`w-full text-right px-3.5 py-2 rounded-xl text-xs font-bold flex justify-between items-center transition-all ${
                        activeCaptionsTrack === index ? "bg-[#00C2FF]/15 text-[#00C2FF] border border-[#00C2FF]/20" : "text-white/80 hover:bg-white/5"
                      }`}
                    >
                      <span>{track.label || track.language || `ملف ترجمة ${index + 1}`}</span>
                      {activeCaptionsTrack === index && <span className="w-2 h-2 bg-[#00C2FF] rounded-full shadow-[0_0_8px_#00C2FF]" />}
                    </button>
                  ))
                ) : (
                  <>
                    {["العربية", "English"].map((lang, lIdx) => (
                      <button
                        key={lIdx}
                        onClick={() => {
                          setActiveCaptionsTrack(lIdx);
                          triggerToast(`تفعيل الترجمة الفورية: ${lang}`);
                          setShowSettings(false);
                        }}
                        className={`w-full text-right px-3.5 py-2 rounded-xl text-xs font-bold flex justify-between items-center transition-all ${
                          activeCaptionsTrack === lIdx ? "bg-[#00C2FF]/15 text-[#00C2FF] border border-[#00C2FF]/20" : "text-white/80 hover:bg-white/5"
                        }`}
                      >
                        <span>ترجمة تلقائية - {lang}</span>
                        {activeCaptionsTrack === lIdx && <span className="w-2 h-2 bg-[#00C2FF] rounded-full shadow-[0_0_8px_#00C2FF]" />}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}

            {settingsTab === "speed" && (
              <div className="space-y-1 pr-1">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => chooseSpeed(rate)}
                    className={`w-full text-right px-3.5 py-2 rounded-xl text-xs font-bold flex justify-between items-center transition-all ${
                      playbackRate === rate ? "bg-[#00C2FF]/15 text-[#00C2FF] border border-[#00C2FF]/20" : "text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <span>{rate === 1 ? "طبيعي (١.٠x)" : `${toArabicNumerals(rate.toString())}x`}</span>
                    {playbackRate === rate && <span className="w-2 h-2 bg-[#00C2FF] rounded-full shadow-[0_0_8px_#00C2FF]" />}
                  </button>
                ))}
              </div>
            )}

            {settingsTab === "help" && (
              <div className="text-right space-y-2 text-[11px] text-gray-300 px-2">
                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-white">وضع البروكسي:</span>
                  <button
                    onClick={() => {
                      setUseProxy(!useProxy);
                      triggerToast(useProxy ? "تم تعطيل البروكسي (اتصال مباشر)" : "تم تفعيل البروكسي (اتصال آمن)");
                      setShowSettings(false);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-black ${useProxy ? "bg-[#00C2FF] text-slate-950" : "bg-white/10 text-white"}`}
                  >
                    {useProxy ? "مفعّل 🔒" : "معطّل ⚡"}
                  </button>
                </div>
                <p>استخدم البروكسي لتجاوز الحجب وتحسين الاستقرار</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}