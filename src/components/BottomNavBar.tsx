import React from 'react';
import { Home, Tv, Flame, Clapperboard, Settings } from 'lucide-react';
import { Language, User } from '../types';
import { translations } from '../mockData';

interface BottomNavBarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  lang: Language;
  user: User;
}

export default function BottomNavBar({
  currentTab,
  setCurrentTab,
  lang,
  user
}: BottomNavBarProps) {
  const t = translations[lang];

  const bottomItems = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'matches', label: t.matches, icon: Flame },
    { id: 'channels', label: t.channels, icon: Tv },
    { id: 'movies', label: t.movies, icon: Clapperboard },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-16 bg-brand-bg/85 border-t border-white/[0.05] backdrop-blur-lg flex items-center justify-around z-40 md:hidden px-3 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
      id="stad-bottom-nav"
    >
      {bottomItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            id={`btn-bottom-tab-${item.id}`}
            onClick={() => setCurrentTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all duration-300 ${
              isActive ? 'text-brand-accent scale-105' : 'text-brand-muted hover:text-white'
            }`}
          >
            <Icon 
              size={18} 
              className={isActive ? 'text-brand-accent drop-shadow-[0_0_8px_rgba(0,194,255,0.6)]' : ''} 
            />
            <span className="text-[9px] mt-1 font-bold select-none truncate max-w-[70px]">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
