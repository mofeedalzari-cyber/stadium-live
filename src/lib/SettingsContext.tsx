import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';
type Theme = 'dark' | 'light';

interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: string) => string;
}

const translations = {
  ar: {
    'settings': 'الإعدادات',
    'language': 'اللغة',
    'theme': 'المظهر',
    'dark_mode': 'الوضع الليلي',
    'light_mode': 'الوضع النهاري',
    'arabic': 'العربية',
    'english': 'English',
    'home': 'الرئيسية',
    'explore': 'استكشاف',
    'favorites': 'المفضلة',
    'search': 'بحث',
    'about': 'عن التطبيق',
    'admin': 'لوحة التحكم',
    'logout': 'تسجيل الخروج',
    'login': 'تسجيل الدخول',
    'matches': 'المباريات',
    'channels': 'القنوات',
    'movies': 'الأفلام',
    'sports': 'رياضة',
    'news': 'أخبار',
    'cinema_channels': 'قنوات سينمائية',
    'telephony_channels': 'قنوات تلفونية',
    'documentary': 'وثائقيات',
    'arabic_movies': 'أفلام عربية',
    'indian_movies': 'أفلام هندية',
    'turkish_series': 'مسلسلات تركية',
    'action': 'أكشن',
    'categories': 'الأقسام',
    'latest_additions': 'أحدث الإضافات',
    'view_all': 'عرض الكل',
    'live': 'مباشر',
    'no_favorites': 'قائمتك فارغة حالياً',
    'back_home': 'العودة للرئيسية',
    'save': 'حفظ',
    'cancel': 'إلغاء'
  },
  en: {
    'settings': 'Settings',
    'language': 'Language',
    'theme': 'Theme',
    'dark_mode': 'Dark Mode',
    'light_mode': 'Light Mode',
    'arabic': 'العربية',
    'english': 'English',
    'home': 'Home',
    'explore': 'Explore',
    'favorites': 'Favorites',
    'search': 'Search',
    'about': 'About',
    'admin': 'Admin',
    'logout': 'Logout',
    'login': 'Login',
    'matches': 'Matches',
    'channels': 'Channels',
    'movies': 'Movies',
    'sports': 'Sports',
    'news': 'News',
    'cinema_channels': 'Cinema Channels',
    'telephony_channels': 'Phone Channels',
    'documentary': 'Documentaries',
    'arabic_movies': 'Arabic Movies',
    'indian_movies': 'Indian Movies',
    'turkish_series': 'Turkish Series',
    'action': 'Action',
    'categories': 'Categories',
    'latest_additions': 'Latest Additions',
    'view_all': 'View All',
    'live': 'Live',
    'no_favorites': 'Your list is currently empty',
    'back_home': 'Back Home',
    'save': 'Save',
    'cancel': 'Cancel'
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('app_lang') as Language) || 'ar';
  });
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('app_theme') as Theme) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('app_lang', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    const root = document.documentElement;
    const body = document.body;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
  }, [theme]);

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations['ar']] || key;
  };

  return (
    <SettingsContext.Provider value={{ language, setLanguage, theme, setTheme, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
