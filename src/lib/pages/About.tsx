import { motion } from "motion/react";
import { Mail, Facebook, MessageCircle, Info, Code } from "lucide-react";
import { Tiktok } from "../../components/icons/Tiktok";

export function About() {
  const socialLinks = [
    {
      name: "تيك توك",
      url: "https://www.tiktok.com/@mufeed_saleh_ali_alzree?_r=1&_t=ZS-96TVs13lGLd",
      icon: Tiktok,
      color: "bg-[#010101]",
    },
    {
      name: "فيسبوك",
      url: "https://www.facebook.com/share/18rUqpMq7S/",
      icon: Facebook,
      color: "bg-[#1877F2]",
    },
    {
      name: "واتساب",
      url: "https://wa.me/967778492884",
      icon: MessageCircle,
      color: "bg-[#25D366]",
    },
    {
      name: "البريد الإلكتروني",
      url: "mailto:mofeedzaru@gmail.com",
      icon: Mail,
      color: "bg-red-600",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4">
        <div className="inline-block p-4 bg-red-700/20 rounded-3xl mb-4">
          <Info className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">من نحن</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Stadium Live هو منصتك المفضلة لمتابعة أحدث المباريات والبطولات العالمية، بالإضافة إلى مكتبة ضخمة من الأفلام والمسلسلات والقنوات التلفزيونية بجودة عالية.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 space-y-6 shadow-2xl"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-700 rounded-2xl">
              <Code className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-black">المطور والبرمجة</h2>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-white">مفيد الزري</p>
            <p className="text-gray-500 font-medium">مطور تطبيقات ويب متكاملة</p>
          </div>
          <p className="text-gray-400 leading-relaxed">
            تم تطوير هذا التطبيق باستخدام أحدث التقنيات لضمان أفضل تجربة مستخدم وسرعة في الوصول للمحتوى المفضل لديك.
          </p>
        </motion.div>

        <div className="space-y-6">
          <h2 className="text-2xl font-black px-2">تواصل معنا</h2>
          <div className="grid grid-cols-2 gap-4">
            {socialLinks.map((link) => (
              <motion.a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`${link.color} p-6 rounded-3xl flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all group`}
              >
                <link.icon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-white">{link.name}</span>
              </motion.a>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-red-900/40 to-transparent p-8 rounded-3xl border border-red-500/10 text-center">
        <p className="text-gray-300 font-medium italic">
          "نهدف دائماً لتقديم محتوى عالي الجودة وبسهولة تامة لجميع عشاق الرياضة والسينما."
        </p>
      </div>

      <div className="text-center pt-8 border-t border-white/5 text-gray-600 text-sm font-bold">
        © {new Date().getFullYear()} Stadium Live - جميع الحقوق محفوظة لمفيد الزري
      </div>
    </div>
  );
}
