import { MessageCircle, Facebook, Mail } from "lucide-react";
import { Tiktok } from "./icons/Tiktok";

export function Footer() {
  const socials = [
    { 
      name: "واتساب", 
      icon: MessageCircle, 
      url: "https://wa.me/967778492884", 
      color: "text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366] hover:text-white border-[#25D366]/10 hover:border-transparent hover:shadow-sm hover:shadow-[#25D366]/30 hover:-translate-y-1" 
    },
    { 
      name: "فيسبوك", 
      icon: Facebook, 
      url: "https://www.facebook.com/share/18rUqpMq7S/", 
      color: "text-[#1877F2] bg-[#1877F2]/10 hover:bg-[#1877F2] hover:text-white border-[#1877F2]/10 hover:border-transparent hover:shadow-sm hover:shadow-[#1877F2]/30 hover:-translate-y-1" 
    },
    { 
      name: "تيك توك", 
      icon: Tiktok, 
      url: "https://www.tiktok.com/@mufeed_saleh_ali_alzree?_r=1&_t=ZS-96TVs13lGLd", 
      color: "text-[#EE1D52] bg-[#EE1D52]/10 dark:text-[#69C9D0] dark:bg-[#69C9D0]/10 hover:bg-[#EE1D52] dark:hover:bg-[#69C9D0] hover:text-white dark:hover:text-black border-[#EE1D52]/10 dark:border-[#69C9D0]/10 hover:border-transparent hover:shadow-sm hover:shadow-[#EE1D52]/30 hover:-translate-y-1" 
    },
    { 
      name: "بريد", 
      icon: Mail, 
      url: "mailto:mofeedzaru@gmail.com", 
      color: "text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white border-red-500/10 hover:border-transparent hover:shadow-sm hover:shadow-red-500/30 hover:-translate-y-1" 
    },
  ];

  return (
    <footer className="mt-12 pt-6 border-t border-black/5 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-right">
        <span className="text-brand font-black text-xs sm:text-sm">مفيد الزري © {new Date().getFullYear()}</span>
        <span className="hidden sm:inline text-gray-300 dark:text-gray-700">|</span>
        <span className="text-[10px] tracking-wide text-gray-400 dark:text-gray-500">جميع الحقوق محفوظة. تم التطوير بواسطة مفيد الزري</span>
      </div>
      
      <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 hover:bg-black/[0.08] dark:hover:bg-white/[0.08] px-3.5 py-1.5 sm:px-4 sm:py-2.5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5">
        <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400">تواصل معنا:</span>
        <div className="flex items-center gap-1.5">
          {socials.map((s, idx) => (
            <a
              key={idx}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              title={s.name}
              className={`p-1.5 sm:p-2 rounded-xl border transition-all duration-300 ${s.color} flex items-center justify-center`}
            >
              <s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
