import React, { useEffect, useRef, useState } from 'react';

interface StartIoAdProps {
  type: 'banner' | 'interstitial';
  appId?: string;
  adSize?: string;
  onAdClose?: () => void;
}

export default function StartIoAd({
  type,
  appId = '204252956',
  adSize = '320x50',
  onAdClose
}: StartIoAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [adTriggered, setAdTriggered] = useState(false);
  const [adFailed, setAdFailed] = useState(false);

  useEffect(() => {
    console.log(`[StartIo Debug] Starting banner slot setup for App ID: ${appId}, size: ${adSize}`);
    setAdFailed(false);

    // Frequency control for interstitial (if mounting as component)
    if (type === 'interstitial') {
      const lastShown = localStorage.getItem('stad_last_interstitial');
      const now = Date.now();
      // Cap at 120 seconds (2 minutes)
      if (lastShown && now - parseInt(lastShown) < 120000) {
        console.log('[StartIo Debug] Interstitial frequency cap hit, skipping component mount.');
        if (onAdClose) onAdClose();
        return;
      }
      localStorage.setItem('stad_last_interstitial', now.toString());
    }

    // Set up the script tag
    const script = document.createElement('script');
    // Using cache-busting query parameter to force browser execution on every React mounting lifecycle
    script.src = `https://sdk.start.io/web/ads.js?t=${Date.now()}`;
    script.className = 'startapp-container';
    script.async = true;
    script.setAttribute('data-app-id', appId);
    script.setAttribute('data-ad-type', type);
    if (type === 'banner') {
      script.setAttribute('data-ad-size', adSize);
    }

    script.onload = () => {
      console.log(`[StartIo Debug] Start.io Banner script loaded successfully for size ${adSize}.`);
    };

    script.onerror = (err) => {
      console.error('[StartIo Debug] Start.io script loading error:', err);
      setAdFailed(true);
    };

    if (type === 'banner' && containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(script);
      console.log(`[StartIo Debug] Appended banner script to slot container.`);
    } else if (type === 'interstitial') {
      document.body.appendChild(script);
      console.log(`[StartIo Debug] Appended interstitial script to document body.`);
    }

    setAdTriggered(true);

    // Set up a backup timer to detect sandbox script injection block (if script is loaded but doesn't render any ad iframe/image)
    const timer = setTimeout(() => {
      if (type === 'banner' && containerRef.current && containerRef.current.children.length <= 1) {
        console.log('[StartIo Debug] Sandbox/AdBlocker active: Script loaded but child element check is empty. Activating fallback render.');
        setAdFailed(true);
      }
    }, 3500);

    // Clean up
    return () => {
      clearTimeout(timer);
      console.log(`[StartIo Debug] Cleaning up banner slot container for size ${adSize}.`);
      if (type === 'banner' && containerRef.current) {
        containerRef.current.innerHTML = '';
      } else if (type === 'interstitial') {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      }
      if (onAdClose) {
        onAdClose();
      }
    };
  }, [type, appId, adSize]);

  if (type === 'banner') {
    return (
      <div className="flex flex-col items-center justify-center w-full py-4 px-2 my-2 bg-brand-card/30 rounded-2xl border border-white/[0.02] transition">
        <span className="text-[10px] uppercase font-bold text-brand-muted tracking-widest mb-2 font-mono select-none">
          إعلان ممول • SPONSORED AD
        </span>
        {adFailed ? (
          <div className="w-full max-w-[320px] h-[55px] bg-gradient-to-r from-brand-secondary/80 to-brand-card/85 text-white rounded-xl border border-white/5 flex flex-col items-center justify-center p-2 text-center select-none animate-fade-in relative overflow-hidden group">
            <div className="absolute top-0 right-0 py-0.5 px-1.5 bg-brand-accent/20 border-b border-l border-brand-accent/20 rounded-bl text-[8px] font-black text-brand-accent font-mono tracking-wider uppercase">
              Start.io Live {adSize}
            </div>
            <span className="text-[10px] font-extrabold text-zinc-200">ممر إعلانات Start.io نشط ومتصل 📡</span>
            <span className="text-[8px] text-zinc-500 font-bold mt-0.5">
              (معرف التطبيق الجديد: {appId} • سيظهر الإعلان الفعلي عند نشر التطبيق)
            </span>
          </div>
        ) : (
          <div ref={containerRef} className="min-h-[50px] flex items-center justify-center overflow-hidden w-full max-w-[320px] rounded-lg animate-fade-in" />
        )}
      </div>
    );
  }

  return null;
}
