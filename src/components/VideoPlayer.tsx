import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, ArrowLeft, 
  RotateCcw, Sliders, ShieldCheck, Wifi, Award, Settings2, Subtitles, HelpCircle,
  Tv as TvIcon, Check, ChevronDown
} from 'lucide-react';
import { Language, AdConfig } from '../types';
import { translations } from '../mockData';
import AdScriptRenderer from './AdScriptRenderer';

interface VideoPlayerProps {
  streamUrl: string;
  title: string;
  categoryName?: string;
  onBack: () => void;
  isLive?: boolean;
  servers?: { name: string; url: string }[];
  epg?: { time: string; titleAr: string; titleEn: string }[];
  lang: Language;
  adConfig?: AdConfig;
}

export default function VideoPlayer({
  streamUrl,
  title,
  categoryName = 'STAD Live',
  onBack,
  isLive = true,
  servers = [],
  epg = [],
  lang,
  adConfig
}: VideoPlayerProps) {
  const t = translations[lang];
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const networkRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // States
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [brightness, setBrightness] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeUrl, setActiveUrl] = useState(streamUrl);
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);
  const [quality, setQuality] = useState<'Auto' | '1080p' | '720p' | '480p'>('Auto');
  const [selectedSubtitle, setSelectedSubtitle] = useState<'Off' | 'Arabic' | 'English'>('Off');
  const [showConfig, setShowConfig] = useState(false);
  const [tvRemoteMode, setTvRemoteMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isRotated, setIsRotated] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Stats
  const [latency, setLatency] = useState(1.8);
  const [bitrate, setBitrate] = useState('4.8 Mbps');
  const [isPip, setIsPip] = useState(false);

  // Sync activeUrl state when streamUrl prop changes
  useEffect(() => {
    setActiveUrl(streamUrl);
  }, [streamUrl]);

  // Load and play live stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setErrorMessage(null);

    // Reset current element first
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (networkRetryTimeoutRef.current) {
      clearTimeout(networkRetryTimeoutRef.current);
      networkRetryTimeoutRef.current = null;
    }

    // Try playing HLS stream using hls.js
    if (Hls.isSupported() && activeUrl.includes('.m3u8')) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30
      });
      hlsRef.current = hls;

      hls.loadSource(activeUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (isPlaying) {
          video.play().catch((err) => {
            console.log('Autoplay blocked:', err);
            setIsPlaying(false);
          });
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS.js Error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try to recover with limit/delay to prevent infinite rapid loops
              console.log('Fatal network error, attempting recovery...');
              const retryCount = (hls as any)._networkRetryCount || 0;
              if (retryCount < 5) {
                (hls as any)._networkRetryCount = retryCount + 1;
                if (networkRetryTimeoutRef.current) clearTimeout(networkRetryTimeoutRef.current);
                networkRetryTimeoutRef.current = setTimeout(() => {
                  if (hlsRef.current && hlsRef.current === hls) {
                    try {
                      hlsRef.current.startLoad();
                    } catch (e) {
                      console.error('Error in startLoad recovery:', e);
                    }
                  }
                }, 2000); // Wait 2 seconds before retrying
              } else {
                setErrorMessage('STREAM_NETWORK_DISCONNECTED');
                setIsLoading(false);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              const mediaRetry = (hls as any)._mediaRetryCount || 0;
              if (mediaRetry < 5) {
                (hls as any)._mediaRetryCount = mediaRetry + 1;
                try {
                  hls.recoverMediaError();
                } catch (e) {
                  setErrorMessage('STREAM_MEDIA_RECOVERY_FAILED');
                  setIsLoading(false);
                }
              } else {
                setErrorMessage('STREAM_MEDIA_DECODING_ERROR');
                setIsLoading(false);
              }
              break;
            default:
              setErrorMessage('STREAM_DECODING_ERROR - ' + data.details);
              setIsLoading(false);
              break;
          }
        }
      });
    } else {
      // Direct media playback or fallback
      video.src = activeUrl;
      video.load();
      
      const handleCanPlay = () => {
        setIsLoading(false);
        if (isPlaying) {
          video.play().catch(() => setIsPlaying(false));
        }
      };

      const handleError = () => {
        setErrorMessage('SOURCE_PIPELINE_UNAVAILABLE');
        setIsLoading(false);
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
      };
    }

    return () => {
      if (networkRetryTimeoutRef.current) {
        clearTimeout(networkRetryTimeoutRef.current);
        networkRetryTimeoutRef.current = null;
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeUrl]);

  // Handle controls visibility timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!showConfig && !tvRemoteMode) {
          setShowControls(false);
        }
      }, isPlaying ? 2500 : 5000); // Hide controls faster (2.5 seconds) if playing
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      clearTimeout(timer);
    };
  }, [showConfig, tvRemoteMode, isPlaying]);

  // Promptly hide controls after starting play
  useEffect(() => {
    if (isPlaying && !showConfig && !tvRemoteMode) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 1500); // Hide everything quickly after starting playback (1.5 seconds)
      return () => clearTimeout(timer);
    }
  }, [isPlaying, showConfig, tvRemoteMode]);

  // Setup simulated parameters
  useEffect(() => {
    const handleInterval = setInterval(() => {
      if (isPlaying) {
        // Mock slight variations to look live
        setLatency(prev => Math.max(1.2, Math.min(2.4, Number((prev + (Math.random() - 0.5) * 0.2).toFixed(2)))));
        setBitrate(quality === 'Auto' ? '4.8 Mbps' : quality === '1080p' ? '6.2 Mbps' : quality === '720p' ? '3.5 Mbps' : '1.8 Mbps');
      }
    }, 4000);
    return () => clearInterval(handleInterval);
  }, [isPlaying, quality]);

  // Video progress triggers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  // Keyboard support for Android TV simulate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!tvRemoteMode) return;
      
      e.preventDefault();
      switch (e.key) {
        case 'ArrowUp':
          handleVolumeAdjustment(0.1);
          break;
        case 'ArrowDown':
          handleVolumeAdjustment(-0.1);
          break;
        case 'ArrowLeft':
          if (videoRef.current) videoRef.current.currentTime -= 10;
          break;
        case 'ArrowRight':
          if (videoRef.current) videoRef.current.currentTime += 10;
          break;
        case ' ': // spacebar as center button
        case 'Enter':
          togglePlay();
          break;
        case 'Escape':
          onBack();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tvRemoteMode]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleVolumeAdjustment = (delta: number) => {
    setVolume(prev => {
      const next = Math.max(0, Math.min(1, prev + delta));
      if (videoRef.current) {
        videoRef.current.volume = next;
        videoRef.current.muted = next === 0;
      }
      setIsMuted(next === 0);
      return next;
    });
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMute = !isMuted;
      videoRef.current.muted = nextMute;
      setIsMuted(nextMute);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Fullscreen request rejected', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Sync state with filesystem fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleReconnect = () => {
    setIsLoading(true);
    const temp = activeUrl;
    setActiveUrl('');
    setTimeout(() => {
      setActiveUrl(temp);
      setErrorMessage(null);
    }, 1200);
  };

  const changeServer = (index: number, url: string) => {
    setSelectedServerIndex(index);
    setActiveUrl(url);
    setIsLoading(true);
  };

  // Picture in Picture simulation/native
  const togglePip = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPip(false);
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
        setIsPip(true);
      }
    } catch (e) {
      console.warn('PIP not supported natively in this browser environment', e);
      // Fallback toggler
      setIsPip(!isPip);
    }
  };

  // Time format
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isRtl = lang === 'ar';

  return (
    <div className="w-full flex flex-col gap-6" id="player-view-container">
      {/* Back button and quick headers */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-brand-card border border-white/5 flex items-center justify-center text-brand-muted hover:text-white hover:bg-white/5 transition duration-300"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xs sm:text-sm md:text-base font-black text-white flex flex-wrap items-center gap-1.5 leading-tight">
              <span className="text-brand-accent font-mono tracking-wider uppercase text-[9.5px] md:text-[11px] bg-brand-accent/10 px-2 py-0.5 md:px-2.5 md:py-1 rounded border border-brand-accent/20 shrink-0">البث المباشر لستاد TV</span>
              <span className="text-zinc-600 hidden sm:inline">-</span>
              <span className="text-white text-xs sm:text-sm md:text-base">{title}</span>
            </h1>
            <p className="text-[10px] md:text-[11px] text-brand-muted font-bold mt-1">🛰️ {categoryName}</p>
          </div>
        </div>

        {/* Protection / Connectivity Banner */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-bold">
          <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/15">
            <Wifi size={12} /> {t.vpnDetected}
          </span>
          <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-accent/10 text-brand-accent border border-brand-accent/15">
            <ShieldCheck size={12} /> خط آمن ومثبت HDCP (معدل 10Gbps)
          </span>
        </div>
      </div>

      {/* Main Player Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Playback Window */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div 
            ref={containerRef}
            className={`relative rounded-3xl overflow-hidden bg-black shadow-[0_10px_40px_-15px_rgba(0,194,255,0.2)] border border-white/[0.04] w-full group transition-all duration-300 ${
              isFullscreen && !isRotated ? 'h-screen w-screen rounded-none border-none' : 'aspect-video'
            } ${isPip ? 'fixed bottom-4 right-4 w-80 h-48 z-50 rounded-2xl border-2 border-brand-accent shadow-2xl' : ''}`}
            style={isRotated ? {
              position: 'fixed',
              top: '50%',
              left: '50%',
              width: '100vh',
              height: '100vw',
              transform: 'translate(-50%, -50%) rotate(90deg)',
              zIndex: 99999,
              filter: `brightness(${brightness})`,
              maxWidth: 'none',
              maxHeight: 'none',
              borderRadius: '0px'
            } : { filter: `brightness(${brightness})` }}
          >
            {/* Native Video object */}
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onClick={togglePlay}
              playsInline
            />

            {/* Direct Swipe Control simulation pads on left/right for Mobile user request */}
            {!isFullscreen && (
              <div className="absolute inset-x-0 inset-y-12 flex justify-between pointer-events-none">
                <div className="w-1/5 h-full relative pointer-events-auto flex items-center pl-4 opacity-0 hover:opacity-100 group-hover:opacity-40 transition cursor-ns-resize">
                  <div className="bg-brand-secondary/90 backdrop-blur py-3 px-2 rounded-2xl text-center text-white text-[10px] space-y-1 border border-white/[0.05]">
                    <Sliders size={12} className="mx-auto text-brand-accent" />
                    <span>الإضاءة</span>
                    <input 
                      type="range" 
                      min="0.3" 
                      max="1.5" 
                      step="0.05" 
                      value={brightness} 
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-16 h-1 bg-brand-card rounded outline-none accent-brand-accent"
                    />
                  </div>
                </div>

                <div className="w-1/5 h-full relative pointer-events-auto flex items-center justify-end pr-4 opacity-0 hover:opacity-100 group-hover:opacity-40 transition cursor-ns-resize">
                  <div className="bg-brand-secondary/90 backdrop-blur py-3 px-2 rounded-2xl text-center text-white text-[10px] space-y-1 border border-white/[0.05]">
                    <Volume2 size={12} className="mx-auto text-brand-accent" />
                    <span>الصوت</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05" 
                      value={volume} 
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setVolume(val);
                        if(videoRef.current) videoRef.current.volume = val;
                      }}
                      className="w-16 h-1 bg-brand-card rounded outline-none accent-brand-accent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ERROR DISPLAY */}
            {errorMessage && (
              <div className="absolute inset-0 bg-brand-bg/95 flex flex-col items-center justify-center text-center p-6 gap-4 border border-brand-live/35">
                <div className="w-16 h-16 rounded-full bg-brand-live/10 border border-brand-live flex items-center justify-center text-brand-live">
                  <RotateCcw size={28} className="animate-spin" />
                </div>
                <div>
                  <h3 className="text-white font-black text-base">⚠️ فترة انتظار اتصال السيرفر تجاوزت الحد المسموح</h3>
                  <p className="text-xs text-brand-muted mt-1 max-w-md font-mono">{errorMessage}</p>
                </div>
                <button 
                  onClick={handleReconnect}
                  className="px-6 py-2.5 bg-brand-accent hover:opacity-90 text-brand-bg text-xs font-black rounded-xl transition flex items-center gap-2 shadow-[0_0_15px_rgba(0,194,255,0.3)] glow-accent"
                >
                  {t.reconnect}
                </button>
              </div>
            )}

            {/* LOADING BUFFER WHEEL */}
            {isLoading && !errorMessage && (
              <div className="absolute inset-0 bg-brand-bg/95 flex flex-col items-center justify-center text-center p-6 gap-3">
                <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,194,255,0.1)]" />
                <p className="text-[10px] text-brand-accent font-semibold tracking-wider uppercase animate-pulse">
                  جاري الاتصال الآمن بسيرفرات STAD TV للبث الفوري المباشر...
                </p>
              </div>
            )}

            {/* SYSTEM CONTROLS LAYER OVERLAY */}
            <div 
              className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-transparent flex flex-col justify-between p-4 transition-all duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* TOP NAV BAR INSIDE PLAYER */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-live animate-pulse" />
                  <span className="bg-brand-live text-white font-sans font-black text-[10px] px-2.5 py-0.5 rounded tracking-wide glow-live">
                    {t.liveNow}
                  </span>
                  <span className="text-xs text-zinc-200 font-bold truncate max-w-[200px] drop-shadow">
                    {title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Android TV Remote toggle */}
                  <button
                    onClick={() => setTvRemoteMode(!tvRemoteMode)}
                    className={`p-2 rounded-xl transition-all ${
                      tvRemoteMode 
                        ? 'bg-brand-accent text-brand-bg shadow-[0_0_12px_rgba(0,194,255,0.4)] font-black' 
                        : 'bg-brand-secondary/80 hover:bg-brand-secondary text-brand-muted hover:text-white border border-white/5'
                    }`}
                    title={t.tvRemoteMode}
                  >
                    <TvIcon size={14} />
                  </button>

                  <button
                    onClick={() => setShowConfig(!showConfig)}
                    className="p-2 bg-brand-secondary/80 hover:bg-brand-secondary text-white rounded-xl transition border border-white/5"
                  >
                    <Settings2 size={14} />
                  </button>
                </div>
              </div>

              {/* TV Remote D-Pad HUD */}
              {tvRemoteMode && (
                <div className="self-center bg-brand-secondary/95 border border-white/[0.04] rounded-2xl p-3 flex flex-col items-center gap-1.5 shadow-2xl pointer-events-auto">
                  <span className="text-[9px] text-brand-muted font-bold tracking-wider uppercase">{t.tvRemoteMode}</span>
                  <div className="grid grid-cols-3 gap-1 w-24">
                    <div />
                    <button onClick={() => handleVolumeAdjustment(0.1)} className="p-1 bg-brand-card active:bg-brand-accent active:text-brand-bg text-white text-xs rounded text-center transition">▲</button>
                    <div />
                    <button onClick={() => { if(videoRef.current) videoRef.current.currentTime -= 10; }} className="p-1 bg-brand-card active:bg-brand-accent active:text-brand-bg text-white text-xs rounded text-center transition">◀</button>
                    <button onClick={togglePlay} className="p-1 bg-brand-card active:bg-brand-accent active:text-brand-bg text-brand-accent text-[10px] rounded font-black transition">{isPlaying ? '▐▐' : '▶'}</button>
                    <button onClick={() => { if(videoRef.current) videoRef.current.currentTime += 10; }} className="p-1 bg-brand-card active:bg-brand-accent active:text-brand-bg text-white text-xs rounded text-center transition">▶</button>
                    <div />
                    <button onClick={() => handleVolumeAdjustment(-0.1)} className="p-1 bg-brand-card active:bg-brand-accent active:text-brand-bg text-white text-xs rounded text-center transition">▼</button>
                    <div />
                  </div>
                </div>
              )}

              {/* BOTTOM CONTROL DECK */}
              <div className="space-y-3">
                {/* SEEK BAR / MATCH TIMELINE SIMULATION */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-zinc-400 font-bold">
                    {isLive ? '00:00' : formatTime(currentTime)}
                  </span>
                  
                  <div className="flex-1 relative h-1 bg-white/20 rounded overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-brand-accent glow-accent"
                      style={{ width: isLive ? '100%' : `${(currentTime / (duration || 1)) * 100}%` }}
                    />
                    {isLive && (
                      <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-brand-accent rounded-full border border-white right-0 shadow-[0_0_8px_rgba(0,194,255,0.8)]" />
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-brand-accent font-bold">
                    {isLive ? 'LIVE' : formatTime(duration)}
                  </span>
                </div>

                {/* CONTROL BUTTONS */}
                <div className="flex items-center justify-between gap-1">
                  {/* Left Side Controls (Play, Mute) */}
                  <div className="flex items-center gap-1.5 sm:gap-3">
                    <button 
                      onClick={togglePlay} 
                      className="p-2 sm:p-2.5 rounded-full bg-brand-accent text-brand-bg transition-all duration-250 hover:scale-110 shadow-lg shadow-brand-accent/25"
                    >
                      {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
                    </button>

                    <button 
                      onClick={handleReconnect}
                      className="p-1.5 sm:p-2 bg-brand-card hover:bg-white/5 text-brand-muted hover:text-white rounded-xl transition border border-white/5"
                      title={t.reconnect}
                    >
                      <RotateCcw size={12} />
                    </button>

                    {/* Volume Slider with Mute button */}
                    <div className="flex items-center gap-1 sm:gap-2 group/volume pl-0.5 sm:pl-1">
                      <button onClick={toggleMute} className="text-zinc-300 hover:text-white transition">
                        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </button>
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setVolume(val);
                          setIsMuted(val === 0);
                          if(videoRef.current) {
                            videoRef.current.volume = val;
                            videoRef.current.muted = val === 0;
                          }
                        }}
                        className="w-8 sm:w-16 md:w-20 accent-brand-accent h-1 bg-[#1a243a] rounded outline-none cursor-pointer hidden xs:block"
                      />
                    </div>
                  </div>

                  {/* Right Side Settings Controls */}
                  <div className="flex items-center gap-1 md:gap-2">
                    {/* Resolution badge */}
                    <span className="text-[9px] md:text-[10px] text-brand-accent font-bold font-mono tracking-wider bg-brand-accent/10 border border-brand-accent/20 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded">
                      {quality === 'Auto' ? 'AUTO' : quality}
                    </span>

                    <button 
                      onClick={togglePip} 
                      className="p-1.5 sm:p-2 bg-brand-card hover:bg-brand-secondary text-brand-muted hover:text-white rounded-xl transition border border-white/5"
                    >
                      <TvIcon size={12} />
                    </button>

                    <button 
                      onClick={() => setIsRotated(!isRotated)} 
                      className={`p-1.5 sm:p-2 rounded-xl transition border border-white/5 flex items-center gap-1 text-xs font-bold ${
                        isRotated 
                          ? 'bg-brand-accent text-brand-bg font-black shadow-[0_0_12px_rgba(0,194,255,0.4)]' 
                          : 'bg-brand-card hover:bg-brand-secondary text-brand-muted hover:text-white'
                      }`}
                      title="تدوير الشاشة"
                    >
                      <RotateCcw size={12} className={isRotated ? "rotate-90" : ""} />
                      <span className="text-[9.5px] hidden md:inline">تدوير بالعرض</span>
                    </button>

                    <button 
                      onClick={toggleFullscreen} 
                      className="p-1.5 sm:p-2 bg-brand-card hover:bg-brand-secondary text-brand-muted hover:text-white rounded-xl transition border border-white/5"
                    >
                      {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* PIPELINE / CONFIG PANEL */}
            {showConfig && (
              <div className="absolute inset-y-0 right-0 w-72 bg-brand-bg/95 border-l border-white/5 p-4.5 z-10 flex flex-col gap-5 text-start text-sm text-white pointer-events-auto shadow-2xl overflow-y-auto">
                <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                  <h4 className="font-bold flex items-center gap-1.5 text-zinc-200">
                    <Sliders size={13} className="text-brand-accent" />
                    <span>لوحة تحكم مشغل STAD</span>
                  </h4>
                  <button 
                    onClick={() => setShowConfig(false)}
                    className="text-[11px] font-bold text-zinc-500 hover:text-white bg-white/5 px-2 py-0.5 rounded transition"
                  >
                    ✕
                  </button>
                </div>

                {/* Subtitle list */}
                <div className="space-y-2">
                  <label className="text-xs text-brand-muted font-bold block uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Subtitles size={12} /> {t.epg}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Off', 'Arabic', 'English'] as const).map(sub => (
                      <button
                        key={sub}
                        onClick={() => setSelectedSubtitle(sub)}
                        className={`py-1.5 rounded-xl text-[10px] font-bold transition ${
                          selectedSubtitle === sub 
                            ? 'bg-brand-accent font-black text-brand-bg' 
                            : 'bg-brand-card text-brand-muted hover:bg-brand-card/80'
                        }`}
                      >
                        {sub === 'Off' ? 'إيقاف' : sub === 'Arabic' ? 'عربي' : 'EN'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stream quality selection */}
                <div className="space-y-2">
                  <label className="text-xs text-brand-muted font-bold block uppercase tracking-wider">
                    ⚡ {t.quality}
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['Auto', '1080p', '720p', '480p'] as const).map(res => (
                      <button
                        key={res}
                        onClick={() => setQuality(res)}
                        className={`py-1.5 rounded-xl text-[10px] font-bold transition ${
                          quality === res 
                            ? 'bg-brand-accent font-black text-brand-bg animate-pulse' 
                            : 'bg-brand-card text-brand-muted hover:bg-brand-card/85'
                        }`}
                      >
                        {res === 'Auto' ? 'تلقائي' : res}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Video diagnostics stats */}
                <div className="space-y-2.5 bg-brand-card/40 p-3.5 rounded-2xl border border-white/[0.03]">
                  <h5 className="text-[10px] font-bold text-brand-accent font-mono tracking-wider uppercase mb-1">
                    سجل تشخيصات مشغل STAD
                  </h5>
                  <div className="space-y-2 text-xs text-brand-muted font-mono">
                    <div className="flex justify-between">
                      <span>عقدة السيرفر:</span>
                      <span className="text-zinc-200">خادم STAD الأوروبي الذكي</span>
                    </div>
                    <div className="flex justify-between">
                      <span>زمن الاستجابة:</span>
                      <span className="text-emerald-400 animate-pulse">{latency} ثانية</span>
                    </div>
                    <div className="flex justify-between">
                      <span>معدل البيانات:</span>
                      <span className="text-zinc-200">{bitrate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>معدل الإطارات:</span>
                      <span className="text-zinc-200">60 إطار/ث</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-2 border-t border-white/[0.04] text-[10px] text-brand-muted text-center font-bold">
                  {t.swipeBrightnessVolume}
                </div>
              </div>
            )}
          </div>

          {/* BANNER REVENUES BLOCK */}
        </div>

        {/* Channels EPG & Server Selection Panel */}
        <div className="bg-brand-card/30 rounded-3xl border border-white/[0.04] p-5 flex flex-col gap-5">
          <div>
            <h3 className="text-xs font-black text-white mb-2.5 pb-2 border-b border-white/[0.04] flex items-center gap-1.5 uppercase tracking-wider select-none">
              <Settings2 size={13} className="text-brand-accent" />
              <span>{t.servers}</span>
            </h3>
            
            {servers && servers.length > 0 ? (
              <div className="space-y-1.5">
                {servers.map((server, idx) => (
                  <button
                    key={idx}
                    onClick={() => changeServer(idx, server.url)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-2xl text-start border transition duration-300 ${
                      selectedServerIndex === idx 
                        ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/30 shadow-[0_0_12px_rgba(0,194,255,0.08)]' 
                        : 'bg-brand-bg/60 hover:bg-brand-card text-brand-muted border-white/[0.02]'
                    }`}
                  >
                    <span>{server.name}</span>
                    {selectedServerIndex === idx && (
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-accent"></span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-brand-muted font-semibold">{t.noResults}</p>
            )}
          </div>

          {/* Match / Channel Program Guide */}
          <div className="flex-1 flex flex-col min-h-[220px]">
            <h3 className="text-xs font-black text-white mb-2.5 pb-2 border-b border-white/[0.04] flex items-center gap-1.5 uppercase tracking-wider select-none">
              <TvIcon size={13} className="text-brand-accent" />
              <span>{t.epg}</span>
            </h3>

            {epg && epg.length > 0 ? (
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {epg.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="bg-brand-bg/40 hover:bg-brand-bg border border-white/[0.02] p-3 rounded-2xl transition flex flex-col gap-1"
                  >
                    <span className="text-[10px] font-black text-brand-accent font-mono tracking-wider">
                      {item.time}
                    </span>
                    <span className="text-xs text-white font-bold truncate leading-tight">
                      {lang === 'ar' ? item.titleAr : item.titleEn}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-4">
                <p className="text-xs text-brand-muted/65 font-bold italic">{t.noEPG}</p>
              </div>
            )}
          </div>

          {/* Quick Refresh Reconnect */}
          <button
            onClick={handleReconnect}
            className="w-full py-3 bg-brand-card/50 hover:bg-brand-card text-brand-accent hover:text-white text-xs font-black rounded-2xl transition flex items-center justify-center gap-2 border border-white/5 shadow-[0_0_15px_rgba(0,194,255,0.02)]"
          >
            <RotateCcw size={13} />
            <span>{t.reconnect}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
