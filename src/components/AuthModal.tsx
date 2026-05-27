import React, { useState } from 'react';
import { User, Language } from '../types';
import { translations } from '../mockData';
import { ShieldAlert, Award, LogIn, Key, Mail, UserIcon, CheckCircle, Zap } from 'lucide-react';

interface AuthModalProps {
  user: User;
  setUser: (user: User) => void;
  lang: Language;
  onClose: () => void;
}

export default function AuthModal({
  user,
  setUser,
  lang,
  onClose
}: AuthModalProps) {
  const t = translations[lang];
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [codeHash, setCodeHash] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput) return;
    setUser({
      ...user,
      username: usernameInput,
      email: emailInput || `${usernameInput}@stad.tv`,
    });
    setSuccessMsg(isLoginTab ? 'تم تسجيل الدخول بنجاح!' : 'تم تسجيل الحساب الجديد بنجاح!');
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1500);
  };

  const handleApplyActivation = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMsg(null);

    // Accept STAD-VIP-2026 or any code including "VIP"
    const cleaned = codeHash.trim().toUpperCase();
    if (cleaned.includes('VIP') || cleaned === 'STAD-VIP-2026' || cleaned.length >= 10) {
      const today = new Date();
      const expiry = new Date(today.setFullYear(today.getFullYear() + 1)).toISOString().slice(0, 10);
      
      setUser({
        ...user,
        isVip: true,
        activationCode: cleaned,
        expiryDate: expiry
      });
      
      setSuccessMsg(t.vipActiveSuccess);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 2000);
    } else {
      setErrorMessage(t.invalidCode);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-md transition-all"
      onClick={onClose}
    >
      <div 
        className="bg-brand-secondary border border-white/[0.04] rounded-[32px] p-6 w-full max-w-md space-y-5 text-start text-white shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
        id="auth-modal"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-brand-card border border-white/[0.03] flex items-center justify-center text-brand-muted hover:text-white transition"
        >
          ✕
        </button>

        {/* Modal branding */}
        <div className="text-center pb-2 border-b border-white/[0.04]">
          <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-brand-accent to-blue-600 flex items-center justify-center mx-auto mb-2.5 text-white font-mono font-black shadow-lg shadow-brand-accent/25">
            S
            <div className="absolute inset-0 rounded-full border border-brand-accent animate-ping opacity-15" />
          </div>
          <h3 className="text-lg font-black tracking-tight bg-gradient-to-r from-white to-brand-accent bg-clip-text text-transparent italic">
            {t.userPanel}
          </h3>
          <p className="text-[10px] text-brand-muted font-mono mt-0.5">{t.subtitle}</p>
        </div>

        {/* Dynamic Alerts */}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl flex items-start gap-2.5 text-emerald-400 text-xs">
            <CheckCircle size={15} className="mt-0.5 shrink-0" />
            <p className="font-semibold leading-relaxed">{successMsg}</p>
          </div>
        )}

        {errorMessage && (
          <div className="bg-brand-live/10 border border-brand-live/20 p-3.5 rounded-2xl flex items-start gap-2.5 text-brand-live text-xs">
            <ShieldAlert size={15} className="mt-0.5 shrink-0" />
            <p className="font-semibold leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Profile Card if already set */}
        {user.username ? (
          <div className="space-y-4">
            <div className="bg-brand-card p-4 rounded-2xl border border-white/[0.03] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-bg border border-white/5 flex items-center justify-center text-brand-accent font-black">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate flex-1">
                <h4 className="text-sm font-bold text-white leading-tight">{user.username}</h4>
                <p className="text-[10px] text-brand-muted mt-1 font-mono truncate">{user.email}</p>
              </div>
              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/10 text-[10px] px-2.5 py-0.5 rounded-full font-sans font-bold">
                ✓ حساب مفعل
              </span>
            </div>

            {/* Expire / Details */}
            <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/15 text-[11px] text-emerald-400/90 leading-relaxed font-semibold space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-white">
                <Zap size={13} className="text-emerald-400" />
                <span>بث Stad TV آمن ومجاني بالكامل</span>
              </div>
              <p className="text-[10.5px] text-brand-muted font-normal leading-relaxed">
                تم تمكين البث المباشر عالي الجودة والسرعة الفائقة لجميع زوار ومستخدمي المنصة مجاناً ومدى الحياة بدون أي قيود أو اشتراكات أو سيرفرات مدفوعة.
              </p>
            </div>

            <button
              onClick={() => {
                setUser({ username: '', email: '', isVip: true });
                onClose();
              }}
              className="w-full py-2.5 bg-brand-card hover:bg-brand-bg border border-white/[0.03] text-brand-muted hover:text-white text-xs font-bold rounded-xl transition"
            >
              إعادة تهيئة الجلسة
            </button>
          </div>
        ) : (
          /* Authentication Form */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-1 bg-brand-card rounded-xl border border-white/[0.03]">
              <button 
                onClick={() => setIsLoginTab(true)}
                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                  isLoginTab ? 'bg-brand-bg text-white shadow font-black' : 'text-brand-muted hover:text-zinc-200'
                }`}
              >
                {t.login}
              </button>
              <button 
                onClick={() => setIsLoginTab(false)}
                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                  !isLoginTab ? 'bg-brand-bg text-white shadow font-black' : 'text-brand-muted hover:text-zinc-200'
                }`}
              >
                {t.signup}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-brand-muted font-bold block">اسم المستخدم</label>
                <div className="relative">
                  <UserIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="مثال: mofeed2026"
                    className="w-full text-xs font-semibold bg-brand-card border border-white/[0.03] text-white rounded-xl pl-8 pr-3 py-2.5 outline-none focus:border-brand-accent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-brand-muted font-bold block">البريد الإلكتروني (اختياري)</label>
                <div className="relative">
                  <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full text-xs font-semibold bg-brand-card border border-white/[0.03] text-white rounded-xl pl-8 pr-3 py-2.5 outline-none focus:border-brand-accent"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-tr from-brand-accent to-blue-600 text-brand-bg text-xs font-black rounded-xl transition shadow-[0_4px_12px_rgba(0,194,255,0.25)] flex items-center justify-center gap-1.5"
              >
                <LogIn size={13} />
                <span>{isLoginTab ? t.login : t.signup}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
