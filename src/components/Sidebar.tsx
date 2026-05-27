import React from 'react';
import { Home, Tv, Search, Heart, Settings, User, Globe, Flame, Clapperboard, Monitor, CheckCircle, X, LogOut } from 'lucide-react';
import { Language, User as UserType } from '../types';
import { translations } from '../mockData';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  user: UserType;
  setUser: (user: UserType) => void;
  setShowAuthModal: (show: boolean) => void;
  className?: string;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  lang,
  setLang,
  user,
  setUser,
  setShowAuthModal,
  className = '',
  mobileOpen = false,
  onCloseMobile
}: SidebarProps) {
  const t = translations[lang];

  const menuItems = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'matches', label: t.matches, icon: Flame },
    { id: 'channels', label: t.channels, icon: Tv },
    { id: 'movies', label: t.movies, icon: Clapperboard },
    { id: 'series', label: t.series, icon: Monitor },
    { id: 'search', label: t.searchTitle, icon: Search },
    { id: 'favorites', label: t.favorites, icon: Heart },
    { id: 'admin', label: lang === 'ar' ? 'لوحة التحكم' : 'Control Panel', icon: Settings },
  ];

  const isRtl = lang === 'ar';

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} h-full w-66 bg-brand-secondary border-white/[0.04] flex flex-col justify-between p-5 z-50 transition-transform duration-300 shadow-2xl overflow-y-auto ${
          mobileOpen 
            ? 'translate-x-0 !flex' 
            : 'hidden md:flex ' + (isRtl ? 'translate-x-[102%] md:translate-x-0' : '-translate-x-[102%] md:translate-x-0')
        } ${className}`}
        id="stad-sidebar"
      >
        <div className="space-y-4">
          {/* Header Block of Sidebar */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.04]">
            {/* Brand Logo with Premium Cyan glow */}
            <div className="flex items-center gap-2.5 select-none">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-brand-accent to-blue-600 shadow-[0_0_12px_rgba(0,194,255,0.4)]">
                <span className="text-white font-black text-sm font-mono">ST</span>
              </div>
              <span className="text-xl font-black tracking-wider italic font-sans sidebar-brand-logo">
                STAD TV
              </span>
            </div>

            {/* Mobile Close Button (visible only in drawer state) */}
            {mobileOpen && (
              <button 
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white md:hidden transition"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <p className="text-[9px] text-brand-accent/80 font-bold tracking-wider uppercase text-center !mt-1">
            {lang === 'ar' ? 'المنصة الرياضية الممتازة' : 'Premium OTT Sports Gateway'}
          </p>

          {/* Navigation Items */}
          <nav className="space-y-1 !mt-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              
              const activeBorderClass = isActive 
                ? (isRtl ? 'border-r-2 border-brand-accent' : 'border-l-2 border-brand-accent')
                : '';

              return (
                <button
                  key={item.id}
                  id={`btn-tab-${item.id}`}
                  onClick={() => {
                    setCurrentTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? `bg-brand-accent/10 text-brand-accent ${activeBorderClass} shadow-[0_0_15px_rgba(0,194,255,0.08)]`
                      : 'text-brand-muted hover:text-white hover:bg-brand-card/35'
                  }`}
                >
                  <Icon size={15} className={isActive ? 'text-brand-accent animate-pulse' : 'text-brand-muted'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer / User Hub */}
        <div className="space-y-3 pt-3 border-t border-white/[0.04] mt-6">
          {/* Account & Status Display */}
          {user.username ? (
            <div className="flex flex-col gap-1.5 w-full">
              <div className="bg-brand-card/30 border border-white/[0.04] rounded-2xl p-2.5 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-brand-muted font-bold tracking-wider uppercase">
                    {lang === 'ar' ? 'المستخدم الحالي' : 'Current User'}
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-1.5 py-0.2 rounded-full font-bold flex items-center gap-1 border border-emerald-500/15">
                    <CheckCircle size={8} /> {lang === 'ar' ? 'ممتاز' : 'VIP'}
                  </span>
                </div>
                <p className="text-xs text-brand-accent font-bold truncate mt-0.5" dir="rtl">
                  👤 {user.username}
                </p>
              </div>
              <button
                onClick={() => {
                  setUser({ username: '', email: '', isVip: true });
                  setCurrentTab('home');
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 text-[11px] font-bold transition duration-200"
              >
                <LogOut size={12} />
                <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Log Out'}</span>
              </button>
            </div>
          ) : (
            <div 
              onClick={() => {
                setShowAuthModal(true);
                if (onCloseMobile) onCloseMobile();
              }}
              className="cursor-pointer bg-brand-card/30 hover:bg-brand-card/60 border border-white/[0.04] rounded-2xl p-2.5 flex flex-col gap-1 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-brand-muted font-bold tracking-wider uppercase">
                  {lang === 'ar' ? 'حالة الحساب' : 'Account Status'}
                </span>
                <span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-1.5 py-0.2 rounded-full font-bold flex items-center gap-1 border border-emerald-500/15">
                  <CheckCircle size={8} /> {lang === 'ar' ? 'مفتوح مجاناً' : 'FREE ACCESS'}
                </span>
              </div>
              <p className="text-xs text-white font-bold truncate mt-0.5">
                {lang === 'ar' ? 'زائر / تسجيل الدخول 🔑' : 'Guest / Sign In 🔑'}
              </p>
            </div>
          )}

          {/* Social Contact Section (🤝 تواصل بنا) */}
          <div className="bg-brand-card/40 border border-white/[0.04] rounded-2xl p-2.5 space-y-2">
            <p className="text-[10px] text-brand-accent font-black tracking-wider uppercase text-center">
              {lang === 'ar' ? '🤝 تواصل بنا' : '🤝 Contact Us'}
            </p>
            <div className="flex items-center justify-center gap-4 py-0.5">
              {/* WhatsApp Link */}
              <a 
                href="https://wa.me/967778492884" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 flex items-center justify-center transition hover:scale-105"
                title="WhatsApp"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.022-.015-.072-.04-.142-.075-.123-.058-.724-.357-.836-.398-.11-.04-.192-.058-.273.06-.08.12-.314.397-.385.478-.071.08-.142.09-.283.015-.141-.074-.597-.22-1.137-.702-.422-.376-.707-.84-.79-.982-.08-.143-.008-.22.063-.292.065-.065.143-.166.214-.249.072-.08.096-.137.142-.23.047-.09.023-.171-.011-.24-.034-.07-.273-.66-.375-.905-.115-.278-.23-.24-.317-.245-.075-.004-.162-.005-.249-.005-.086 0-.227.03-.346.157-.12.126-.457.447-.457 1.09 0 .644.469 1.265.534 1.35.064.086.924 1.411 2.239 1.98.312.135.556.216.748.277.315.1.602.086.83.05.253-.038.776-.317.887-.623.11-.305.11-.568.078-.623-.033-.055-.12-.088-.261-.162zm-5.464 4.904h-.011c-1.248 0-2.47-.336-3.541-.97l-.254-.15-2.63.69 1.254-2.56-.165-.263C6.442 14.992 5.96 13.518 5.96 11.986c0-3.328 2.712-6.04 6.04-6.04 1.612 0 3.127.628 4.266 1.768a6.002 6.002 0 0 1 1.77 4.276c0 3.328-2.713 6.04-6.028 6.04zm9.336-15.01A10.963 10.963 0 0 0 12 1.6c-5.875 0-10.662 4.79-10.662 10.665 0 1.88.488 3.714 1.416 5.34L1 23l5.592-1.503a10.9 10.9 0 0 0 5.402 1.432h.005c5.82 0 10.662-4.79 10.662-10.665 0-2.85-1.11-5.53-3.125-7.545z" />
                </svg>
              </a>
              {/* TikTok Link */}
              <a 
                href="https://www.tiktok.com/@mufeed_saleh_ali_alzree?_r=1&_t=ZS-96gsifZU8Fo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition hover:scale-105"
                title="TikTok"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.81-.74-3.94-1.69-.22-.19-.42-.38-.62-.59v6.51c-.02 2.04-.6 4.14-1.91 5.72-1.39 1.7-3.66 2.65-5.84 2.5a6.45 6.45 0 0 1-5.32-4.57c-.77-2.61.16-5.59 2.24-7.23 1.35-1.07 3.11-1.61 4.81-1.48v4.03c-1.22-.12-2.51.27-3.32 1.2-.87.97-.93 2.51-.15 3.55.74 1.01 2.12 1.47 3.31 1.1 1.14-.36 1.86-1.49 1.88-2.68.01-3.69 0-7.37.01-11.06C12.44 4.01 12.49 2.01 12.53.02z" />
                </svg>
              </a>
              {/* Facebook Link */}
              <a 
                href="https://www.facebook.com/share/1SRURo3dgU/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 flex items-center justify-center transition hover:scale-105"
                title="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Server Health Status Widget */}
          <div className="flex justify-between items-center gap-2">
            <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-bold bg-brand-accent/10 border border-brand-accent/15 text-brand-accent rounded-xl select-none shadow-[0_0_12px_rgba(0,194,255,0.05)]">
              <Globe size={11} className="text-brand-accent shrink-0 animate-spin-slow" />
              <span>{lang === 'ar' ? 'البث: مستقر وممتاز (100%)' : 'Server Status: Excellent'}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
