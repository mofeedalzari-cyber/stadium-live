import { MessageCircle, Mail, Facebook, X } from "lucide-react";
import { Tiktok } from "./icons/Tiktok";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

export function FloatingContact() {
  const [isOpen, setIsOpen] = useState(false);

  const socials = [
    { name: "واتساب", icon: MessageCircle, url: "https://wa.me/967778492884", color: "bg-[#25D366] hover:bg-[#20ba59] shadow-[#25D366]/20" },
    { name: "فيسبوك", icon: Facebook, url: "https://www.facebook.com/share/18rUqpMq7S/", color: "bg-[#1877F2] hover:bg-[#166fe5] shadow-[#1877F2]/20" },
    { name: "تيك توك", icon: Tiktok, url: "https://www.tiktok.com/@mufeed_saleh_ali_alzree?_r=1&_t=ZS-96TVs13lGLd", color: "bg-[#010101] hover:bg-neutral-900 border border-white/10 shadow-black/20" },
    { name: "بريد", icon: Mail, url: "mailto:mofeedzaru@gmail.com", color: "bg-[#FF0000] hover:bg-[#e60000] shadow-[#FF0000]/20" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 select-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 15 }}
            transition={{ type: "spring", damping: 18, stiffness: 220 }}
            className="flex flex-col gap-3.5 mb-2"
          >
            {socials.map((s, i) => (
              <motion.a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0, transition: { delay: i * 0.05, type: "spring", stiffness: 260 } }}
                className={`${s.color} flex items-center justify-between w-[150px] sm:w-[170px] h-[48px] sm:h-[56px] px-5 sm:px-6 rounded-full shadow-lg text-white hover:scale-105 active:scale-95 transition-transform duration-200 group relative overflow-hidden`}
                style={{ direction: "rtl" }}
              >
                {/* Visual Glow Layer */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Icon (Left) */}
                <div className="flex items-center justify-center">
                  <s.icon className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 text-white" />
                </div>

                {/* Text (Right) */}
                <span className="text-sm sm:text-base font-black tracking-tight text-white select-none">
                  {s.name}
                </span>
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Trigger Button */}
      <motion.button 
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 sm:w-16 sm:h-16 bg-[#0734FF] rounded-full shadow-[0_8px_30px_rgba(7,52,255,0.4)] dark:shadow-[0_8px_30px_rgba(7,52,255,0.3)] text-white hover:bg-[#0028e6] transition-colors flex items-center justify-center border border-white/10 relative z-10 cursor-pointer"
      >
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.div
              key="message"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <MessageCircle className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 stroke-[2]" />
            </motion.div>
          ) : (
            <motion.div
              key="close"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <X className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 stroke-[2]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
