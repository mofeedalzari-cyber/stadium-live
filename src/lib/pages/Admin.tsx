import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, query, onSnapshot, doc, deleteDoc, updateDoc, orderBy, setDoc, getDoc, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, handleFirestoreError, OperationType, auth, signInWithGoogle } from "../firebase";
import { Plus, Trash, Edit, Save, Lock, Edit3, Trash2, RotateCcw, XCircle, Info, KeyRound, Eye, EyeOff, Search, LogOut, LogIn, CheckCircle2, Megaphone, Download, Play, X } from "lucide-react";
import { VideoPlayer } from "../../components/VideoPlayer";

// Arabic Text Normalization helper for accurate search match
function normalizeArabic(text: string): string {
  if (!text) return "";
  return text
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, "") // remove diacritics
    .toLowerCase()
    .trim();
}

function matchesQuery(text: string, queryStr: string): boolean {
  if (!text || !queryStr) return false;
  return normalizeArabic(text).includes(normalizeArabic(queryStr));
}

export function Admin() {
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem("admin_authenticated") === "true";
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const [pinInput, setPinInput] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"match" | "channel" | "media" | "import" | "ads" | "category" | "league">("match");
  const [m3uContent, setM3UContent] = useState("");
  const [parsedChannels, setParsedChannels] = useState<any[]>([]);
  const [customCategories, setCustomCategories] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [leagueForm, setLeagueForm] = useState({
    name: "", logo: ""
  });
  const [categoryForm, setCategoryForm] = useState({
    id: "", name: "", type: "channel"
  });

  // Advertiser System States
  const [adsForm, setAdsForm] = useState({
    appcreator24HardNav: false,
    startioWebBanner: "",
    popunderCode: "",
    interstitialCode: "",
    startioAppId: "204179223"
  });
  const [importType, setImportType] = useState<string>("sports");
  const [editId, setEditId] = useState<string | null>(null);
  const [adminSearch, setAdminSearch] = useState("");
  const [matchStatusFilter, setMatchStatusFilter] = useState("all");
  const [matchLeagueFilter, setMatchLeagueFilter] = useState("all");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [bulkDeleteConfirmType, setBulkDeleteConfirmType] = useState<'channel' | 'media' | null>(null);
  const [previewChannel, setPreviewChannel] = useState<any>(null);
  const [channelGroupFilter, setChannelGroupFilter] = useState<string>("all");
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<string>("all");
  const [loadingEpisodesId, setLoadingEpisodesId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedChannels([]);
    setSelectedMedia([]);
    setPreviewChannel(null);
    setChannelGroupFilter("all");
    setMediaCategoryFilter("all");
  }, [tab]);

  const [matchForm, setMatchForm] = useState({
    teamA: "", teamB: "", logoA: "", logoB: "",
    time: "", status: "upcoming", channel: "",
    commentator: "", league: "", streamUrl: "", audioUrl: ""
  });

  const [channelForm, setChannelForm] = useState({
    name: "", logo: "", url: "", type: "hls", group: "sports", audioUrl: ""
  });

  const [mediaForm, setMediaForm] = useState({
    title: "", type: "movie", category: "arabic_movies", poster: "",
    description: "", rating: 0, year: new Date().getFullYear(),
    streamUrl: "", trailerUrl: "", audioUrl: ""
  });

  const [episodeForm, setEpisodeForm] = useState({
    number: 1, url: "", audioUrl: ""
  });

  const [episodes, setEpisodes] = useState<any[]>([]);

  const [matches, setMatches] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);

  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, collection: string } | null>(null);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handlePlayMedia = async (item: any) => {
    if (item.type === 'movie') {
      if (!item.streamUrl) {
        showMessage("رابط مشاهدة الفيلم غير متوفر ⚠️", "error");
        return;
      }
      setPreviewChannel({
        id: item.id,
        name: item.title,
        url: item.streamUrl,
        logo: item.poster,
        type: 'hls',
        audioUrl: item.audioUrl || undefined,
        subtext: "عرض تجريبي للفيلم 🎬"
      });
    } else if (item.type === 'series') {
      setLoadingEpisodesId(item.id);
      try {
        const epsRef = collection(db, "media", item.id, "episodes");
        const snap = await getDocs(epsRef);
        const eps = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        
        eps.sort((a, b) => {
          const numA = Number(a.number) || 0;
          const numB = Number(b.number) || 0;
          return numA - numB;
        });

        if (eps.length === 0) {
          showMessage("لا توجد حلقات مضافة لهذا المسلسل بعد ⚠️", "error");
          setLoadingEpisodesId(null);
          return;
        }

        const firstEp = eps[0];
        setPreviewChannel({
          id: item.id,
          name: item.title,
          url: firstEp.url,
          logo: item.poster,
          type: 'hls',
          audioUrl: firstEp.audioUrl || undefined,
          subtext: `مسلسل • حلقة ${firstEp.number} 📺`,
          episodes: eps,
          currentEpisodeNumber: firstEp.number
        });
      } catch (err: any) {
        showMessage("فشل تحميل الحلقات: " + err.message, "error");
      } finally {
        setLoadingEpisodesId(null);
      }
    }
  };

  // Move snapshot listeners here so they trigger unconditionally
  useEffect(() => {
    if (!isAdmin) return;

    const unsubMatches = onSnapshot(collection(db, "matches"), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMatches(docs.sort((a: any, b: any) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0)));
    }, (error) => {
      console.error("Admin matches snapshot error:", error);
      showMessage("فشل في تحميل المباريات: " + error.message, "error");
    });
    const unsubChannels = onSnapshot(collection(db, "channels"), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setChannels(docs.sort((a: any, b: any) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0)));
    }, (error) => {
      console.error("Admin channels snapshot error:", error);
      showMessage("فشل في تحميل القنوات: " + error.message, "error");
    });
    const unsubMedia = onSnapshot(collection(db, "media"), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMediaList(docs.sort((a: any, b: any) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0)));
    }, (error) => {
      console.error("Admin media snapshot error:", error);
      showMessage("فشل في تحميل الميديا: " + error.message, "error");
    });

    const unsubAds = onSnapshot(doc(db, "configs", "ads"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setAdsForm({
          appcreator24HardNav: d.appcreator24HardNav ?? false,
          startioWebBanner: d.startioWebBanner ?? "",
          popunderCode: d.popunderCode ?? "",
          interstitialCode: d.interstitialCode ?? "",
          startioAppId: d.startioAppId ?? "204179223"
        });
      }
    }, (error) => {
      console.warn("Could not load ads configs from Firestore:", error);
      // Fallback to local storage for testing safety
      const stored = localStorage.getItem("local_ads_config");
      if (stored) {
        try {
          setAdsForm(JSON.parse(stored));
        } catch (e) {}
      }
    });

    const unsubCategories = onSnapshot(collection(db, "categories"), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCustomCategories(docs.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
    }, (error) => {
      console.error("Admin categories snapshot error:", error);
    });

    const unsubLeagues = onSnapshot(collection(db, "leagues"), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLeagues(docs.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
    }, (error) => {
      console.error("Admin leagues snapshot error:", error);
    });

    return () => {
      unsubMatches();
      unsubChannels();
      unsubMedia();
      unsubAds();
      unsubCategories();
      unsubLeagues();
    };
  }, [isAdmin]);

  // Series Episodes effect moved here to respect hook ordering rules
  useEffect(() => {
    if (tab === 'media' && editId && mediaForm.type === 'series') {
      const q = query(collection(db, "media", editId, "episodes"));
      const unsub = onSnapshot(q, (snap) => {
        setEpisodes(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)).sort((a, b) => (a.number || 0) - (b.number || 0)));
      }, (error) => {
        console.error("Episodes snapshot error:", error);
      });
      return () => unsub();
    } else {
      setEpisodes([]);
    }
  }, [editId, tab, mediaForm.type]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === "Mofe@2025#") {
      localStorage.setItem("admin_authenticated", "true");
      setIsAdmin(true);
      setPinError("");
      window.dispatchEvent(new Event("adminAuthChange"));
      showMessage("تم التحقق بنجاح! أهلاً بك يا مدير ✅", "success");
    } else {
      setPinError("رمز المرور (PIN) غير صحيح! الرجاء التحقق والمحاولة مجدداً.");
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("admin_authenticated");
    setIsAdmin(false);
    setPinInput("");
    window.dispatchEvent(new Event("adminAuthChange"));
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="w-full max-w-md bg-white dark:bg-[#121212] p-6 sm:p-8 rounded-[2rem] border border-black/5 dark:border-white/5 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <div className="w-16 h-16 bg-brand/10 dark:bg-brand/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <KeyRound className="w-8 h-8 text-brand animate-pulse" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black mb-4 text-gray-800 dark:text-white">تحقق الإدارة والتحكم</h1>
          
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 text-justify" style={{ direction: "rtl" }}>
            يتطلب الوصول إلى هذا القسم رمز مرور (PIN) أدخل رمز المرور المسجل مسبقاً للتحقق من صلاحية الإدارة وتعديل بث المباريات المباشر. في الإعدادات
          </p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="relative">
              <input 
                type={showPin ? "text" : "password"}
                placeholder="أدخل رمز المرور الإداري (PIN)"
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                required
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3.5 pl-12 text-center text-[#0f172a] dark:text-white outline-none focus:border-brand transition-all font-mono tracking-widest text-lg"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand transition-colors p-1"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {pinError && (
              <p className="text-xs text-red-500 font-bold bg-red-500/10 p-2.5 rounded-lg border border-red-500/15" style={{ direction: "rtl" }}>
                {pinError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-brand text-white py-3.5 rounded-xl font-black shadow-lg shadow-brand/25 hover:bg-brand-hover active:scale-[0.98] transition-all"
            >
              التحقق والدخول
            </button>
          </form>

          <button
            onClick={() => window.location.href = '/'}
            className="mt-4 text-xs text-gray-400 hover:text-brand transition-all flex items-center gap-1.5 justify-center mx-auto"
          >
            ← العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  const handleSaveAdsConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      localStorage.setItem("local_ads_config", JSON.stringify(adsForm));
      await setDoc(doc(db, "configs", "ads"), {
        ...adsForm,
        updatedAt: serverTimestamp()
      }, { merge: true });
      showMessage("تم حفظ إعدادات الإعلانات بنجاح وتعميمها على جميع المستخدمين! 🎉", "success");
    } catch (err: any) {
      console.error(err);
      showMessage("فشل المزامنة السحابية، ولكن تم الحفظ محلياً: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (e: React.FormEvent, type: 'match' | 'channel' | 'media') => {
    e.preventDefault();
    setLoading(true);
    const collectionName = type === 'match' ? 'matches' : type === 'channel' ? 'channels' : 'media';
    try {
      const data = type === 'match' ? matchForm : type === 'channel' ? channelForm : mediaForm;

      if (editId) {
        try {
          await updateDoc(doc(db, collectionName, editId), { ...data, updatedAt: serverTimestamp() });
        } catch (updateErr) {
          handleFirestoreError(updateErr, OperationType.UPDATE, `${collectionName}/${editId}`);
        }
        showMessage("تم التحديث بنجاح ✅", "success");
        // We keep the editId so they can continue managing episodes if it's a series
      } else {
        let docRef;
        try {
          docRef = await addDoc(collection(db, collectionName), { 
            ...data, 
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp() 
          });
        } catch (createErr) {
          handleFirestoreError(createErr, OperationType.CREATE, collectionName);
        }
        showMessage("تمت الإضافة بنجاح ✅", "success");
        if (type === 'media' && docRef) {
          setEditId(docRef.id); // Switch to edit mode automatically for episodes
        }
      }

      // Reset forms
      if (type === 'match') setMatchForm({ teamA: "", teamB: "", logoA: "", logoB: "", time: "", status: "upcoming", channel: "", commentator: "", league: "", streamUrl: "", audioUrl: "" });
      if (type === 'channel') setChannelForm({ name: "", logo: "", url: "", type: "hls", group: "sports", audioUrl: "" });
      if (type === 'media' && !editId && mediaForm.type !== 'series') {
        setMediaForm({ title: "", type: "movie", category: "arabic_movies", poster: "", description: "", rating: 0, year: new Date().getFullYear(), streamUrl: "", trailerUrl: "", audioUrl: "" });
        setEpisodes([]);
      }

    } catch (err: any) {
      console.error(err);
      showMessage("خطأ: " + err.message, "error");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, collectionName: string) => {
    if (!id || !collectionName) {
      showMessage("بيانات غير مكتملة للحذف", "error");
      return;
    }
    
    setLoading(true);
    try {
      console.log(`🚀 STARTING DELETE: ${collectionName}/${id}`);
      setConfirmDelete(null); // Clear immediate to avoid double clicks
      
      const docRef = doc(db, collectionName, id);
      try {
        await deleteDoc(docRef);
      } catch (deleteErr) {
        handleFirestoreError(deleteErr, OperationType.DELETE, `${collectionName}/${id}`);
      }
      
      console.log(`✅ DELETE SUCCESS: ${id}`);
      showMessage("تم الحذف بنجاح ✅", "success");
      
      if (editId === id) {
        setEditId(null);
      }
    } catch (err: any) {
      console.error("❌ CRITICAL DELETE ERROR:", err);
      showMessage(`فشل في الحذف: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.id || !categoryForm.name) {
      showMessage("الرجاء تعبئة جميع الحقول المطلوبة", "error");
      return;
    }
    const cleanId = categoryForm.id.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!cleanId) {
      showMessage("المعرّف بالإنجليزية غير صالح! يرجى استخدام حروف وأرقام وعلامة _ فقط", "error");
      return;
    }

    setLoading(true);
    try {
      if (editId) {
        await setDoc(doc(db, "categories", editId), {
          name: categoryForm.name,
          type: categoryForm.type,
          updatedAt: serverTimestamp()
        }, { merge: true });
        showMessage("تم تحديث القسم بنجاح ✅", "success");
        setEditId(null);
      } else {
        const docSnap = await getDoc(doc(db, "categories", cleanId));
        if (docSnap.exists()) {
          showMessage("هذا المعرّف مستخدم بالفعل في قسم آخر! يرجى اختيار معرّف فريد", "error");
          setLoading(false);
          return;
        }

        await setDoc(doc(db, "categories", cleanId), {
          name: categoryForm.name,
          type: categoryForm.type,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        showMessage("تمت إضافة القسم بنجاح ✅", "success");
      }
      setCategoryForm({ id: "", name: "", type: "channel" });
    } catch (err: any) {
      console.error(err);
      showMessage("خطأ أثناء حفظ القسم: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا القسم؟ قد يؤثر الحذف على القنوات أو الأفلام المرتبطة به.")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "categories", catId));
      showMessage("تم حذف القسم بنجاح ✅", "success");
    } catch (err: any) {
      showMessage("خطأ في حذف القسم: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLeagueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueForm.name) {
      showMessage("الرجاء تعبئة اسم الدوري", "error");
      return;
    }
    setLoading(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "leagues", editId), {
          name: leagueForm.name,
          logo: leagueForm.logo || "",
          updatedAt: serverTimestamp()
        });
        showMessage("تم تحديث الدوري بنجاح ✅", "success");
        setEditId(null);
      } else {
        await addDoc(collection(db, "leagues"), {
          name: leagueForm.name,
          logo: leagueForm.logo || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        showMessage("تمت إضافة الدوري بنجاح ✅", "success");
      }
      setLeagueForm({ name: "", logo: "" });
    } catch (err: any) {
      console.error(err);
      showMessage("خطأ أثناء حفظ الدوري: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLeague = async (leagueId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الدوري؟ قد يؤثر هذا على المباريات المرتبطة به.")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "leagues", leagueId));
      showMessage("تم حذف الدوري بنجاح ✅", "success");
    } catch (err: any) {
      showMessage("خطأ في حذف الدوري: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async (type: 'channel' | 'media') => {
    const ids = type === 'channel' ? selectedChannels : selectedMedia;
    const collectionName = type === 'channel' ? 'channels' : 'media';
    const arabicName = type === 'channel' ? 'القنوات' : 'الترفيه';

    if (ids.length === 0) {
      showMessage("الرجاء تحديد عناصر للحذف أولاً", "error");
      return;
    }

    setLoading(true);
    let successCount = 0;
    try {
      await Promise.all(
        ids.map(async (id) => {
          try {
            await deleteDoc(doc(db, collectionName, id));
            successCount++;
          } catch (deleteErr) {
            handleFirestoreError(deleteErr, OperationType.DELETE, `${collectionName}/${id}`);
          }
        })
      );

      showMessage(`تم حذف ${successCount} من ${arabicName} بنجاح ✅`, "success");
      
      if (type === 'channel') {
        setSelectedChannels([]);
      } else {
        setSelectedMedia([]);
      }
    } catch (err: any) {
      console.error(err);
      showMessage("حدث خطأ أثناء الحذف الجماعي: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExportM3U = () => {
    if (selectedChannels.length === 0) {
      showMessage("الرجاء تحديد قنوات لتصديرها أولاً", "error");
      return;
    }

    const selectedList = channels.filter(c => selectedChannels.includes(c.id));
    if (selectedList.length === 0) {
      showMessage("القنوات المحددة غير موجودة أو فارغة", "error");
      return;
    }

    let m3uString = "#EXTM3U\n";
    selectedList.forEach(ch => {
      const groupStr = ch.group ? ` group-title="${ch.group}"` : "";
      const logoStr = ch.logo ? ` tvg-logo="${ch.logo}"` : "";
      m3uString += `#EXTINF:-1${logoStr}${groupStr},${ch.name}\n${ch.url}\n`;
    });

    try {
      const blob = new Blob([m3uString], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `channels-export-${new Date().toISOString().slice(0, 10)}.m3u`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showMessage("تم تصدير ملف M3U بنجاح! 📥", "success");
    } catch (err: any) {
      showMessage("فشل تصدير الملف: " + err.message, "error");
    }
  };

  const startEdit = (item: any, type: 'match' | 'channel' | 'media' | 'category' | 'league') => {
    setEditId(item.id);
    setTab(type);
    if (type === 'match') setMatchForm({ ...item });
    if (type === 'channel') setChannelForm({ ...item });
    if (type === 'media') {
      setMediaForm({ ...item });
    }
    if (type === 'category') {
      setCategoryForm({ id: item.id, name: item.name, type: item.type });
    }
    if (type === 'league') {
      setLeagueForm({ name: item.name, logo: item.logo || "" });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddEpisode = async () => {
    if (!editId || !episodeForm.url) {
      showMessage("يرجى إكمال بيانات الحلقة", "error");
      return;
    }
    
    setLoading(true);
    try {
      console.log(`Adding episode to media/${editId}/episodes`, episodeForm);
      try {
        await addDoc(collection(db, "media", editId, "episodes"), { 
          ...episodeForm,
          updatedAt: serverTimestamp()
        });
      } catch (addErr) {
        handleFirestoreError(addErr, OperationType.CREATE, `media/${editId}/episodes`);
      }
      setEpisodeForm({ number: episodeForm.number + 1, url: "", audioUrl: "" });
      showMessage("تم إضافة الحلقة بنجاح ✅", "success");
    } catch (err: any) {
      console.error("Add Episode Error:", err);
      showMessage("خطأ في إضافة الحلقة: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEpisode = async (epId: string) => {
    if (!editId) return;
    try {
      try {
        await deleteDoc(doc(db, "media", editId, "episodes", epId));
      } catch (delErr) {
        handleFirestoreError(delErr, OperationType.DELETE, `media/${editId}/episodes/${epId}`);
      }
      showMessage("تم حذف الحلقة", "success");
    } catch (err: any) {
      showMessage("خطأ في حذف الحلقة: " + err.message, "error");
    }
  };

  const handleImport = async () => {
    if (parsedChannels.length === 0) return;
    setLoading(true);
    let successCount = 0;
    try {
      const customCat = customCategories.find(cat => cat.id === importType);
      const activeType = customCat ? customCat.type : (["sports", "news", "telephony"].includes(importType) ? "channel" : importType === "turkish_series" ? "series" : "movie");
      const categoryValue = importType;

      if (activeType === "channel") {
        for (const channel of parsedChannels) {
          try {
            await addDoc(collection(db, "channels"), {
              name: channel.name,
              logo: channel.logo,
              url: channel.url,
              type: channel.type || "hls",
              group: categoryValue,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            successCount++;
          } catch (addErr) {
            handleFirestoreError(addErr, OperationType.CREATE, "channels");
          }
        }
        showMessage(`تم استيراد ${successCount} قناة بنجاح ✅`, "success");
      } else if (activeType === "series") {
        for (const ch of parsedChannels) {
          try {
            const seriesRef = await addDoc(collection(db, "media"), {
              title: ch.name,
              type: "series",
              category: categoryValue,
              poster: ch.logo || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500",
              description: "مستورد عبر M3U",
              rating: 8.5,
              year: new Date().getFullYear(),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });

            // For series, add Episode 1
            await addDoc(collection(db, "media", seriesRef.id, "episodes"), {
              number: 1,
              url: ch.url,
              updatedAt: serverTimestamp()
            });

            successCount++;
          } catch (addErr) {
            handleFirestoreError(addErr, OperationType.CREATE, "media");
          }
        }
        showMessage(`تم استيراد ${successCount} مسلسل بنجاح ✅`, "success");
      } else {
        // movie
        for (const ch of parsedChannels) {
          try {
            await addDoc(collection(db, "media"), {
              title: ch.name,
              type: "movie",
              category: categoryValue,
              poster: ch.logo || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500",
              description: "مستورد عبر M3U",
              rating: 8.5,
              year: new Date().getFullYear(),
              streamUrl: ch.url,
              trailerUrl: "",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            successCount++;
          } catch (addErr) {
            handleFirestoreError(addErr, OperationType.CREATE, "media");
          }
        }
        showMessage(`تم استيراد ${successCount} فيلم بنجاح ✅`, "success");
      }
      setParsedChannels([]);
      setM3UContent("");
    } catch (err: any) {
      showMessage("خطأ أثناء الاستيراد: " + err.message, "error");
    }
    setLoading(false);
  };

  const parseM3U = (content: string) => {
    const lines = content.split('\n');
    const results: any[] = [];
    let currentInfo: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF:')) {
        const nameMatch = line.match(/,(.*)$/);
        const name = nameMatch ? nameMatch[1] : 'Unknown';
        
        const logoMatch = line.match(/tvg-logo="([^"]*)"/);
        const logo = logoMatch ? logoMatch[1] : '';
        
        const groupMatch = line.match(/group-title="([^"]*)"/);
        const group = groupMatch ? groupMatch[1] : 'other';

        currentInfo = { name, logo, group: group.toLowerCase() || 'other' };
      } else if (line.startsWith('http') && currentInfo) {
        results.push({ ...currentInfo, url: line, type: 'hls' });
        currentInfo = null;
      }
    }
    setParsedChannels(results);
  };

  const filteredMatches = matches.filter(m => {
    const matchesSearch = !adminSearch.trim() || 
      matchesQuery(m.teamA, adminSearch) || 
      matchesQuery(m.teamB, adminSearch) || 
      matchesQuery(m.league, adminSearch) ||
      matchesQuery(m.channel, adminSearch);
      
    const matchesStatus = matchStatusFilter === "all" || m.status === matchStatusFilter;
    const matchesLeague = matchLeagueFilter === "all" || m.league === matchLeagueFilter;
    
    return matchesSearch && matchesStatus && matchesLeague;
  });

  const filteredChannels = channels.filter(c => {
    const matchesSearch = !adminSearch.trim() || 
      matchesQuery(c.name, adminSearch) || 
      matchesQuery(c.group, adminSearch);
    const matchesGroup = channelGroupFilter === "all" || c.group === channelGroupFilter;
    return matchesSearch && matchesGroup;
  });

  const filteredMedia = mediaList.filter(m => {
    const matchesSearch = !adminSearch.trim() || 
      matchesQuery(m.title, adminSearch) || 
      matchesQuery(m.category, adminSearch) ||
      matchesQuery(m.description, adminSearch);
    const matchesCategory = mediaCategoryFilter === "all" || m.category === mediaCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-32 px-3.5 sm:px-0">
      {message && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-2xl font-bold shadow-2xl z-[100] animate-in slide-in-from-top duration-300 ${message.type === 'success' ? 'bg-green-600/90 backdrop-blur-md' : 'bg-red-600/90 backdrop-blur-md'} text-white text-xs sm:text-sm`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 select-none">
        <h1 className="text-lg sm:text-xl font-black text-right">لوحة التحكم</h1>
        <div className="w-full md:w-auto overflow-hidden">
          <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-2xl glass font-sans overflow-x-auto scrollbar-hide horizontal-slider gap-1.5 w-full justify-start md:justify-center flex-nowrap select-none" style={{ direction: "rtl", WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}>
             <button onClick={() => { setTab("match"); setEditId(null); setConfirmDelete(null); }} className={`flex-1 md:flex-initial px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-center font-black transition-all whitespace-nowrap shrink-0 pointer-events-auto active:scale-95 ${tab === 'match' ? 'bg-brand text-white shadow-lg' : 'text-gray-500 hover:text-brand hover:bg-black/5 dark:hover:bg-white/5'}`}>
               <span style={{ fontSize: "11px", lineHeight: "11px", letterSpacing: "-0.015em" }}>المباريات</span>
             </button>
             <button onClick={() => { setTab("league"); setEditId(null); setConfirmDelete(null); }} className={`flex-1 md:flex-initial px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-center font-black transition-all whitespace-nowrap shrink-0 pointer-events-auto active:scale-95 ${tab === 'league' ? 'bg-brand text-white shadow-lg' : 'text-gray-500 hover:text-brand hover:bg-black/5 dark:hover:bg-white/5'}`}>
               <span style={{ fontSize: "11px", lineHeight: "11px", letterSpacing: "-0.015em" }}>الدوريات</span>
             </button>
             <button onClick={() => { setTab("channel"); setEditId(null); setConfirmDelete(null); }} className={`flex-1 md:flex-initial px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-center font-black transition-all whitespace-nowrap shrink-0 pointer-events-auto active:scale-95 ${tab === 'channel' ? 'bg-brand text-white shadow-lg' : 'text-gray-500 hover:text-brand hover:bg-black/5 dark:hover:bg-white/5'}`}>
               <span style={{ fontSize: "11px", lineHeight: "11px", letterSpacing: "-0.015em" }}>القنوات</span>
             </button>
             <button onClick={() => { setTab("media"); setEditId(null); setConfirmDelete(null); }} className={`flex-1 md:flex-initial px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-center font-black transition-all whitespace-nowrap shrink-0 pointer-events-auto active:scale-95 ${tab === 'media' ? 'bg-brand text-white shadow-lg' : 'text-gray-500 hover:text-brand hover:bg-black/5 dark:hover:bg-white/5'}`}>
               <span style={{ fontSize: "11px", lineHeight: "11px", letterSpacing: "-0.015em" }}>الترفيه</span>
             </button>
             <button onClick={() => { setTab("import"); setEditId(null); setConfirmDelete(null); }} className={`flex-1 md:flex-initial px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-center font-black transition-all whitespace-nowrap shrink-0 pointer-events-auto active:scale-95 ${tab === 'import' ? 'bg-brand text-white shadow-lg' : 'text-gray-500 hover:text-brand hover:bg-black/5 dark:hover:bg-white/5'}`}>
               <span style={{ fontSize: "11px", lineHeight: "11px", letterSpacing: "-0.015em" }}>M3U</span>
             </button>
             <button onClick={() => { setTab("ads"); setEditId(null); setConfirmDelete(null); }} className={`flex-1 md:flex-initial px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-center font-black transition-all whitespace-nowrap shrink-0 pointer-events-auto active:scale-95 ${tab === 'ads' ? 'bg-brand text-white shadow-lg' : 'text-gray-500 hover:text-brand hover:bg-black/5 dark:hover:bg-white/5'}`}>
               <span style={{ fontSize: "11px", lineHeight: "11px", letterSpacing: "-0.015em" }}>الإعلانات</span>
             </button>
             <button onClick={() => { setTab("category"); setEditId(null); setConfirmDelete(null); }} className={`flex-1 md:flex-initial px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-center font-black transition-all whitespace-nowrap shrink-0 pointer-events-auto active:scale-95 ${tab === 'category' ? 'bg-brand text-white shadow-lg' : 'text-gray-500 hover:text-brand hover:bg-black/5 dark:hover:bg-white/5'}`}>
               <span style={{ fontSize: "11px", lineHeight: "11px", letterSpacing: "-0.015em" }}>الأقسام</span>
             </button>
          </div>
        </div>
      </div>

      {/* Firebase Database Google Auth Link Banner */}
      <div className="bg-white dark:bg-[#121212] p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-black/5 dark:border-white/5 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 w-full" style={{ direction: "rtl", textAlign: "right" }}>
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${currentUser ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
            {currentUser ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" /> : <Lock className="w-5 h-5 sm:w-6 sm:h-6" />}
          </div>
          <div className="flex-1 min-w-0 text-right">
            <h3 className="font-bold text-xs sm:text-sm text-gray-800 dark:text-white">
              {currentUser ? `ربط قاعدة البيانات: متصل بنجاح ✅` : `ربط حساب Google الإداري مطلوب ⚠️`}
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 leading-[1.7] text-pretty">
              {currentUser ? (
                <>
                  أنت متصل بالبريد الإلكتروني:{" "}
                  <span dir="ltr" className="inline-block font-sans text-green-500 font-semibold mx-1">
                    {currentUser.email}
                  </span>
                  . تتوفر لك الصلاحيات الكاملة لتعديل قاعدة البيانات.
                </>
              ) : (
                <>
                  يتم إثبات صلاحية الإدارة وتعديل قاعدة البيانات عبر بريد Google{" "}
                  <span dir="ltr" className="inline-block font-sans text-brand/90 font-semibold mx-1">
                    mofeedzaru@gmail.com
                  </span>
                  . يرجى تسجيل الدخول لتجنب أخطاء الصلاحيات عند الحفظ.
                </>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:self-center w-full sm:w-auto mt-1 sm:mt-0">
          {currentUser ? (
            <button 
              onClick={async () => {
                try {
                  await auth.signOut();
                  showMessage("تم تسجيل الخروج بنجاح 👋", "success");
                } catch (err: any) {
                  showMessage("خطأ أثناء تسجيل الخروج", "error");
                }
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-black/5 dark:bg-white/5 hover:bg-red-500/10 hover:text-red-500 text-gray-500 dark:text-gray-400 px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          ) : (
            <button 
              onClick={async () => {
                try {
                  setLoading(true);
                  await signInWithGoogle();
                  showMessage("تم تسجيل الدخول بنجاح مع Google 🎉", "success");
                } catch (err: any) {
                  showMessage("فشل تسجيل الدخول: " + err.message, "error");
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-brand text-white hover:bg-brand-hover px-3.5 py-2 rounded-xl font-black text-xs transition-all shadow-md shadow-brand/20 whitespace-nowrap"
            >
              <LogIn className="w-4 h-4" />
              <span>ربط حساب Google</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#121212] p-4 sm:p-8 rounded-2xl sm:rounded-4xl border border-black/5 dark:border-white/5 shadow-2xl relative overflow-hidden w-full max-w-[490.264px] mx-auto">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="flex items-center justify-between mb-6 sm:mb-8 relative z-10">
           <h2 className="text-lg sm:text-xl font-black text-brand flex items-center gap-2">
             <Plus className="w-5 h-5" />
             {editId ? "تعديل البيانات" : "إضافة عنصر جديد"}
           </h2>
           {editId && (
             <button onClick={() => setEditId(null)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded-xl transition-all">
               <RotateCcw className="w-4 h-4" /> إلغاء التعديل
             </button>
           )}
        </div>

        {tab === "match" && (
          <form onSubmit={(e) => handleAction(e, 'match')} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3.5 sm:space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs text-gray-500 mr-2">الفريق الأول</label>
                <input placeholder="مثال: ريال مدريد" required value={matchForm.teamA} onChange={e => setMatchForm({...matchForm, teamA: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2 sm:px-4 sm:py-3 focus:border-brand outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs text-gray-500 mr-2">شعار الفريق الأول (رابط صورة)</label>
                <input placeholder="https://..." required value={matchForm.logoA} onChange={e => setMatchForm({...matchForm, logoA: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2 sm:px-4 sm:py-3 focus:border-brand outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs text-gray-500 mr-2">وقت المباراة</label>
                <input type="datetime-local" required value={matchForm.time} onChange={e => setMatchForm({...matchForm, time: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2 sm:px-4 sm:py-3 focus:border-brand outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white" style={{ direction: "rtl", textAlign: "right" }} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs text-gray-500 mr-2">اسم المعلق</label>
                <input placeholder="مثال: عصام الشوالي" value={matchForm.commentator} onChange={e => setMatchForm({...matchForm, commentator: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2 sm:px-4 sm:py-3 focus:border-brand outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs text-gray-500 mr-2">حالة المباراة</label>
                <select 
                  value={matchForm.status} 
                  onChange={e => setMatchForm({...matchForm, status: e.target.value})} 
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2 sm:px-4 sm:py-3 focus:border-brand outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white"
                >
                  <option value="upcoming">قادمة</option>
                  <option value="live">جارية الآن</option>
                  <option value="finished">انتهت</option>
                </select>
              </div>
            </div>
            <div className="space-y-3.5 sm:space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs text-gray-500 mr-2">الفريق الثاني</label>
                <input placeholder="مثال: برشلونة" required value={matchForm.teamB} onChange={e => setMatchForm({...matchForm, teamB: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2 sm:px-4 sm:py-3 focus:border-brand outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs text-gray-500 mr-2">شعار الفريق الثاني (رابط صورة)</label>
                <input placeholder="https://..." required value={matchForm.logoB} onChange={e => setMatchForm({...matchForm, logoB: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2 sm:px-4 sm:py-3 focus:border-brand outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs text-gray-500 mr-2">اسم القناة</label>
                <div className="flex gap-2 w-full">
                  <input placeholder="beIN SPORTS 1" value={matchForm.channel} onChange={e => setMatchForm({...matchForm, channel: e.target.value})} className="flex-1 min-w-0 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2 sm:px-4 sm:py-3 focus:border-brand outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white" />
                  <select 
                    value={channels.some(c => c.name === matchForm.channel) ? matchForm.channel : ""}
                    onChange={e => {
                      if (!e.target.value) return;
                      const selectedChannel = channels.find(c => c.name === e.target.value);
                      setMatchForm({
                        ...matchForm, 
                        channel: e.target.value,
                        streamUrl: selectedChannel ? selectedChannel.url : matchForm.streamUrl
                      });
                    }} 
                    className="w-24 shrink-0 bg-brand/15 dark:bg-brand/25 border border-brand/20 dark:border-brand/30 rounded-xl px-1 sm:px-2 py-2 sm:py-3 focus:border-brand outline-none text-xs sm:text-sm text-brand-hover dark:text-brand font-black cursor-pointer"
                  >
                    <option value="" className="text-gray-500 font-bold">➕ القنوات</option>
                    {channels.map((c, index) => (
                      <option key={`${c.id}-${index}`} value={c.name} className="text-[#0f172a] dark:text-white">{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs text-gray-500 mr-2">الدوري / البطولة</label>
                {leagues.length > 0 ? (
                  <div className="space-y-2">
                    <select 
                      value={leagues.some(l => l.name === matchForm.league) ? matchForm.league : matchForm.league ? "custom" : ""}
                      onChange={e => {
                        if (e.target.value === "custom") {
                          setMatchForm({ ...matchForm, league: "" });
                        } else {
                          setMatchForm({ ...matchForm, league: e.target.value });
                        }
                      }}
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2.5 sm:px-4 sm:py-3 focus:border-brand outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white font-bold cursor-pointer"
                    >
                      <option value="" className="text-gray-500 font-bold">🏆 اختر الدوري المضاف من هنا</option>
                      {leagues.map((l, index) => (
                        <option key={`${l.id}-${index}`} value={l.name} className="text-[#0f172a] dark:text-white">{l.name}</option>
                      ))}
                      <option value="custom" className="text-brand font-black">➕ كتابة دوري مخصص...</option>
                    </select>
                    
                    {(!leagues.some(l => l.name === matchForm.league) || matchForm.league === "") && (
                      <input 
                        placeholder="اكتب اسم دوري أو بطولة أخرى مخصصة هنا..." 
                        value={matchForm.league} 
                        onChange={e => setMatchForm({...matchForm, league: e.target.value})} 
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2 sm:px-4 sm:py-3 focus:border-brand outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white animate-in slide-in-from-top-1 duration-200"
                      />
                    )}
                  </div>
                ) : (
                  <input 
                    placeholder="مثال: الدوري الإنجليزي الممتاز (يرجى إضافة الدوريات أولاً من تبويب الدوريات لتظهر كقائمة منسدلة)" 
                    value={matchForm.league} 
                    onChange={e => setMatchForm({...matchForm, league: e.target.value})} 
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2 sm:px-4 sm:py-3 focus:border-brand outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white" 
                  />
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs text-gray-500 mr-2">رابط البث المباشر (يدوي)</label>
                <input placeholder="m3u8 or iframe url" value={matchForm.streamUrl} onChange={e => setMatchForm({...matchForm, streamUrl: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2 sm:px-4 sm:py-3 focus:border-brand outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs text-gray-500 mr-2">رابط صوت البث الإضافي (اختياري)</label>
                <input placeholder="m3u8 audio track url" value={matchForm.audioUrl || ""} onChange={e => setMatchForm({...matchForm, audioUrl: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2 sm:px-4 sm:py-3 focus:border-brand outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white" />
              </div>
            </div>
            <button disabled={loading} className="md:col-span-2 bg-brand py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black hover:bg-brand-hover transition-all shadow-lg shadow-brand/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-white">
              <Save className="w-5 h-5" />
              {loading ? "جاري الحفظ..." : editId ? "تحديث المباراة" : "إضافة مباراة"}
            </button>
          </form>
        )}

        {tab === "channel" && (
          <form onSubmit={(e) => handleAction(e, 'channel')} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <input placeholder="اسم القناة" required value={channelForm.name} onChange={e => setChannelForm({...channelForm, name: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2.5 sm:px-4 sm:py-3 outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white" />
              <input placeholder="رابط الشعار" value={channelForm.logo} onChange={e => setChannelForm({...channelForm, logo: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2.5 sm:px-4 sm:py-3 outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white" />
              <select value={channelForm.type} onChange={e => setChannelForm({...channelForm, type: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2.5 sm:px-4 sm:py-3 outline-none text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <option value="hls">HLS (.m3u8)</option>
                <option value="mp4">MP4</option>
                <option value="iframe">iFrame</option>
              </select>
              <select value={channelForm.group} onChange={e => setChannelForm({...channelForm, group: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2.5 sm:px-4 sm:py-3 outline-none text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <option value="sports">رياضة</option>
                <option value="news">أخبار</option>
                <option value="movies">أفلام</option>
                <option value="telephony">قنوات تلفونية</option>
                <option value="documentary">وثائقيات</option>
                {customCategories.filter(cat => cat.type === 'channel').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <input placeholder="رابط البث الرئيسي (فيديو)" required value={channelForm.url} onChange={e => setChannelForm({...channelForm, url: e.target.value})} className="md:col-span-2 w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2.5 sm:px-4 sm:py-3 outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white" />
              <input placeholder="رابط الصوت الإضافي (اختياري - لدمج الصوت المنفصل)" value={channelForm.audioUrl || ""} onChange={e => setChannelForm({...channelForm, audioUrl: e.target.value})} className="md:col-span-2 w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2.5 sm:px-4 sm:py-3 outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white" />
            </div>
            <button disabled={loading} className="w-full bg-brand py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black hover:bg-brand-hover transition-all shadow-lg shadow-brand/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-white">
              <Save className="w-5 h-5" />
              {loading ? "جاري الحفظ..." : editId ? "تحديث القناة" : "إضافة القناة"}
            </button>
          </form>
        )}

        {tab === "media" && (
          <form onSubmit={(e) => handleAction(e, 'media')} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <input placeholder="العنوان" required value={mediaForm.title} onChange={e => setMediaForm({...mediaForm, title: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2.5 sm:px-4 sm:py-3 outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white" />
              <select value={mediaForm.type} onChange={e => setMediaForm({...mediaForm, type: e.target.value as any})} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2.5 sm:px-4 sm:py-3 outline-none text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <option value="movie">فيلم</option>
                <option value="series">مسلسل</option>
              </select>
              <input placeholder="رابط البوستر" required value={mediaForm.poster} onChange={e => setMediaForm({...mediaForm, poster: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2.5 sm:px-4 sm:py-3 outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white" />
              <select value={mediaForm.category} onChange={e => setMediaForm({...mediaForm, category: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2.5 sm:px-4 sm:py-3 outline-none text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <option value="arabic_movies">أفلام عربية</option>
                <option value="indian_movies">أفلام هندية</option>
                <option value="turkish_series">مسلسلات تركية</option>
                <option value="documentary">وثائقيات</option>
                <option value="action">أكشن</option>
                {customCategories.filter(cat => cat.type === 'movie' || cat.type === 'series').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name} ({cat.type === 'movie' ? 'فيلم' : 'مسلسل'})</option>
                ))}
              </select>
              <textarea placeholder="الوصف" value={mediaForm.description} onChange={e => setMediaForm({...mediaForm, description: e.target.value})} className="md:col-span-2 w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2.5 sm:px-4 sm:py-3 outline-none h-24 text-xs sm:text-sm text-[#0f172a] dark:text-white" />
              {mediaForm.type === 'movie' && (
                <>
                  <input placeholder="رابط المشاهدة للفيلم (فيديو)" required value={mediaForm.streamUrl} onChange={e => setMediaForm({...mediaForm, streamUrl: e.target.value})} className="md:col-span-2 w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2.5 sm:px-4 sm:py-3 outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white" />
                  <input placeholder="رابط الصوت الإضافي للفيلم (اختياري - لدمج الصوت المنفصل)" value={mediaForm.audioUrl || ""} onChange={e => setMediaForm({...mediaForm, audioUrl: e.target.value})} className="md:col-span-2 w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2.5 sm:px-4 sm:py-3 outline-none text-xs sm:text-sm text-[#0f172a] dark:text-white" />
                </>
              )}
            </div>

            {mediaForm.type === 'series' && editId && (
              <div className="bg-black/5 dark:bg-white/5 p-6 rounded-2xl space-y-4 border border-black/5 dark:border-white/5">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-brand" /> إدارة الحلقات
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input 
                    type="number" 
                    placeholder="رقم" 
                    className="w-full sm:w-20 bg-black/5 dark:bg-white/10 p-2 rounded-lg outline-none text-[#0f172a] dark:text-white font-bold"
                    value={episodeForm.number}
                    onChange={e => setEpisodeForm({...episodeForm, number: parseInt(e.target.value)})}
                  />
                  <input 
                    placeholder="رابط بث الحلقة (فيديو)" 
                    className="flex-grow bg-black/5 dark:bg-white/10 p-2 rounded-lg outline-none text-[#0f172a] dark:text-white font-bold"
                    value={episodeForm.url}
                    onChange={e => setEpisodeForm({...episodeForm, url: e.target.value})}
                  />
                  <input 
                    placeholder="رابط الصوت الإضافي (اختياري)" 
                    className="flex-grow bg-black/5 dark:bg-white/10 p-2 rounded-lg outline-none text-[#0f172a] dark:text-white font-bold"
                    value={episodeForm.audioUrl || ""}
                    onChange={e => setEpisodeForm({...episodeForm, audioUrl: e.target.value})}
                  />
                  <button type="button" onClick={handleAddEpisode} className="bg-green-600 px-4 py-2 rounded-xl font-black text-white shadow-lg shadow-green-600/20 hover:scale-105 active:scale-95 transition-all">إضافة</button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {episodes.map(ep => (
                    <div key={ep.id} className="flex items-center justify-between bg-black/20 p-2 rounded-lg text-sm border border-white/5">
                      <span>الحلقة {ep.number}</span>
                      <button type="button" onClick={() => handleDeleteEpisode(ep.id)} className="text-red-500 hover:bg-red-500/10 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button disabled={loading} className="w-full bg-brand py-4 rounded-2xl font-black hover:bg-brand-hover transition-all shadow-lg shadow-brand/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-white">
              <Save className="w-5 h-5" />
              {loading ? "جاري الحفظ..." : editId ? "تحديث المحتوى" : "إضافة المحتوى"}
            </button>
          </form>
        )}
        {tab === "import" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-gray-500 mr-2 font-bold">نوع ومكان استيراد المحتوى المستورد</label>
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-[#0f172a] dark:text-white font-bold"
                >
                  <option value="sports">رياضة (قنوات رياضية)</option>
                  <option value="news">أخبار (قنوات إخبارية)</option>
                  <option value="telephony">قنوات تلفونية 📱</option>
                  <option value="arabic_movies">أفلام عربية</option>
                  <option value="indian_movies">أفلام هندية</option>
                  <option value="turkish_series">مسلسلات تركية</option>
                  <option value="documentary">وثائقيات</option>
                  <option value="action">أكشن</option>
                  {customCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name} ({cat.type === 'channel' ? 'قنوات' : cat.type === 'movie' ? 'أفلام' : 'مسلسلات'})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">الصق محتوى ملف M3U هنا:</label>
              <textarea 
                className="w-full h-48 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 outline-none font-mono text-xs text-[#0f172a] dark:text-white"
                value={m3uContent}
                onChange={(e) => {
                  setM3UContent(e.target.value);
                  parseM3U(e.target.value);
                }}
                placeholder="#EXTM3U..."
              />
            </div>
            
            {parsedChannels.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-brand">
                    تم العثور على {parsedChannels.length} {
                      importType === "sports" || importType === "news" || importType === "telephony" 
                        ? "قناة" 
                        : importType === "turkish_series" 
                          ? "مسلسل" 
                          : "فيلم"
                    }
                  </h3>
                  <button 
                    disabled={loading}
                    onClick={handleImport}
                    className="bg-brand text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? "جاري الاستيراد..." : "بدء الاستيراد الآن"}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                  {parsedChannels.map((ch, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white dark:bg-[#1a1a1a] p-2 rounded-xl border border-black/5 dark:border-white/5">
                      <img src={ch.logo || "https://placehold.co/100x100?text=No+Logo"} className="w-8 h-8 rounded-lg object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs truncate">{ch.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{ch.group}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "ads" && (
          <form onSubmit={handleSaveAdsConfigs} className="space-y-6 text-right" style={{ direction: "rtl" }}>
            <div className="bg-brand/10 p-5 rounded-2xl border border-brand/20 flex gap-3.5 items-start">
              <Megaphone className="w-5 h-5 text-brand shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-extrabold text-[#0f172a] dark:text-white text-sm">نظام تحقيق الأرباح الاحترافي 💰</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  يمكنك هنا دمج شفرات إعلانية حقيقية تجلب لك أرباحاً مادية حقيقية من زوار موقعك. يدعم هذا النظام إعلانات Start.io للمواقع، إعلانات Popunder عالية العائد (مثل Monetag أو PropellerAds)، بالإضافة إلى ميزة "التحويل الصلب" لدفع تطبيق AppCreator24 لعرض إعلاناته الأصلية المدمجة في هاتفك عند التنقل بين الصفحات!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 mr-2">معرف تطبيق Start.io (App ID)</label>
                <input 
                  type="text" 
                  placeholder="مثال: 204179223" 
                  value={adsForm.startioAppId} 
                  onChange={e => setAdsForm({...adsForm, startioAppId: e.target.value})} 
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand text-left font-mono text-[#0f172a] dark:text-white" 
                />
              </div>

              <div className="md:col-span-2 bg-gradient-to-r from-brand/5 to-emerald-500/5 p-5 rounded-3xl border border-black/5 dark:border-white/5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">موصى به لتطبيق الهاتف</span>
                  <h4 className="font-extrabold text-xs sm:text-sm text-gray-800 dark:text-white">تفعيل التحميل الكامل لحث إعلانات AppCreator24 البينية 📱</h4>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    تطبيق AppCreator24 يستشهد فقط بإعلانات Start.io/AdMob الأصلية عند تحميل صفحة جديدة بالكامل (Hard Navigation). في حال تفعيل هذا الخيار، سيقوم الموقع بالتنقل الصلب، مما يجبر تطبيق AppCreator24 على إظهار إعلانات الشاشة الكاملة والفيديو المكافأة الخاصة به 100%!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAdsForm({...adsForm, appcreator24HardNav: !adsForm.appcreator24HardNav})}
                  className={`w-14 h-8 rounded-full transition-all duration-300 relative flex items-center p-1 cursor-pointer shrink-0 ${adsForm.appcreator24HardNav ? 'bg-brand' : 'bg-gray-300 dark:bg-neutral-800'}`}
                >
                  <span className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-all duration-300 ${adsForm.appcreator24HardNav ? '-translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-gray-500">شفرة إعلان البانر (Banner Code)</label>
                  <span className="text-[10px] text-brand font-bold bg-brand/5 px-2 py-0.5 rounded-md">تحت مشغل الفيديو والقوائم</span>
                </div>
                <textarea 
                  placeholder="الصق شفرة HTML/JS <script> للبانر هنا..." 
                  value={adsForm.startioWebBanner} 
                  onChange={e => setAdsForm({...adsForm, startioWebBanner: e.target.value})} 
                  className="w-full h-32 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 outline-none focus:border-brand font-mono text-xs text-left direction-ltr text-[#0f172a] dark:text-white" 
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-gray-500">شفرة إعلان النوافذ المنبثقة (Popunder Code)</label>
                  <span className="text-[10px] text-amber-500 font-bold bg-amber-500/5 px-2 py-0.5 rounded-md">ربح عالي جداً 🔴</span>
                </div>
                <textarea 
                  placeholder="الصق شفرة الـ Popunder (مثل Monetag Smartlink/Onclick) هنا..." 
                  value={adsForm.popunderCode} 
                  onChange={e => setAdsForm({...adsForm, popunderCode: e.target.value})} 
                  className="w-full h-32 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 outline-none focus:border-brand font-mono text-xs text-left direction-ltr text-[#0f172a] dark:text-white" 
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-gray-500">شفرة إعلان شاشة كاملة (Web Interstitial Code)</label>
                  <span className="text-[10px] text-gray-500 font-bold bg-white/5 px-2 py-0.5 rounded-md">إعلانات تغطية الصفحة الكاملة</span>
                </div>
                <textarea 
                  placeholder="الصق شفرة غلاف الإعلانات البينية للويب هنا..." 
                  value={adsForm.interstitialCode} 
                  onChange={e => setAdsForm({...adsForm, interstitialCode: e.target.value})} 
                  className="w-full h-24 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 outline-none focus:border-brand font-mono text-xs text-left direction-ltr text-[#0f172a] dark:text-white" 
                />
              </div>
            </div>

            <button disabled={loading} className="w-full bg-brand py-4 rounded-2xl font-black hover:bg-brand-hover transition-all shadow-lg shadow-brand/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-white cursor-pointer mt-4">
              <Save className="w-5 h-5" />
              {loading ? "جاري حفظ إعدادات الأرباح الحالية..." : "حفظ وتنشيط الإعلانات فوراً 🚀"}
            </button>
          </form>
        )}

        {tab === "category" && (
          <form onSubmit={handleCategorySubmit} className="space-y-6 text-right" style={{ direction: "rtl" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs text-gray-500 mr-2 font-bold">اسم القسم بالعربية</label>
                <input 
                  placeholder="مثال: مسلسلات تركية، قنوات أفلام" 
                  required 
                  value={categoryForm.name} 
                  onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} 
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand text-right text-xs sm:text-sm text-[#0f172a] dark:text-white" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs text-gray-500 mr-2 font-bold">المعرّف بالإنجليزية (Slug - فريد وبدون مسافات)</label>
                <input 
                  placeholder="مثال: turkish_series, movie_channels" 
                  required 
                  disabled={!!editId}
                  value={categoryForm.id} 
                  onChange={e => setCategoryForm({...categoryForm, id: e.target.value})} 
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand text-left font-mono text-xs text-[#0f172a] dark:text-white disabled:opacity-50" 
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] sm:text-xs text-gray-500 mr-2 font-bold">نوع القسم</label>
                <select 
                  value={categoryForm.type} 
                  onChange={e => setCategoryForm({...categoryForm, type: e.target.value})} 
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand text-right text-xs sm:text-sm text-gray-500 dark:text-gray-400"
                >
                  <option value="channel">قناة بث مباشر</option>
                  <option value="movie">فيلم</option>
                  <option value="series">مسلسل</option>
                </select>
              </div>
            </div>
            <button disabled={loading} className="w-full bg-brand py-4 rounded-2xl font-black hover:bg-brand-hover transition-all shadow-lg shadow-brand/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-white cursor-pointer mt-4">
              <Save className="w-5 h-5" />
              {loading ? "جاري الحفظ..." : editId ? "تحديث القسم" : "إضافة القسم الإداري الجديد ✅"}
            </button>
          </form>
        )}

        {tab === "league" && (
          <form onSubmit={handleLeagueSubmit} className="space-y-6 text-right" style={{ direction: "rtl" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs text-gray-500 mr-2 font-bold">اسم الدوري بالعربية</label>
                <input 
                  placeholder="مثال: الدوري الإنجليزي الممتاز" 
                  required 
                  value={leagueForm.name} 
                  onChange={e => setLeagueForm({...leagueForm, name: e.target.value})} 
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand text-right text-xs sm:text-sm text-[#0f172a] dark:text-white" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs text-gray-500 mr-2 font-bold">شعار الدوري (رابط صورة - اختياري)</label>
                <input 
                  placeholder="https://..." 
                  value={leagueForm.logo} 
                  onChange={e => setLeagueForm({...leagueForm, logo: e.target.value})} 
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand text-left text-xs sm:text-sm text-[#0f172a] dark:text-white" 
                />
              </div>
            </div>
            <button disabled={loading} className="w-full bg-brand py-4 rounded-2xl font-black hover:bg-brand-hover transition-all shadow-lg shadow-brand/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-white cursor-pointer mt-4">
              <Save className="w-5 h-5" />
              {loading ? "جاري الحفظ..." : editId ? "تحديث الدوري" : "إضافة الدوري الإداري الجديد ✅"}
            </button>
          </form>
        )}
      </div>

      <div className="space-y-4">
        {tab !== 'ads' && <h2 className="text-xl font-black">إدارة العناصر الحالية</h2>}
        
        {tab !== 'import' && tab !== 'ads' && (
          <div className="relative">
            <input
              type="text"
              placeholder={
                tab === 'match' 
                  ? "ابحث عن مباراة (اسم الفريق، الدوري، القناة)..." 
                  : tab === 'channel' 
                  ? "ابحث عن قناة (الاسم، المجموعة)..." 
                  : tab === 'category'
                  ? "ابحث عن قسم (الاسم بالعربي، المعرف بالانجليزي)..."
                  : "ابحث عن فيلم أو مسلسل (العنوان، التصنيف)..."
              }
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#121212] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3.5 pr-11 pl-16 text-[#0f172a] dark:text-white outline-none focus:border-brand transition-all text-sm shadow-sm"
              style={{ direction: "rtl" }}
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            {adminSearch && (
              <button
                onClick={() => setAdminSearch("")}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-brand bg-black/5 dark:bg-white/10 px-2.5 py-1.5 rounded-lg transition-all"
              >
                إلغاء
              </button>
            )}
          </div>
        )}

        {/* Bulk tools for Channels or Media */}
        {(tab === 'channel' || tab === 'media') && (
          <div id={`bulk-tools-${tab}`} className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-[#121212] p-4 rounded-3xl border border-black/5 dark:border-white/5 shadow-md items-center justify-between" style={{ direction: "rtl" }}>
            <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
              <button
                type="button"
                id={`toggle-select-all-${tab}`}
                onClick={() => {
                  if (tab === 'channel') {
                    const allFilteredIds = filteredChannels.map(c => c.id);
                    const allSelected = allFilteredIds.every(id => selectedChannels.includes(id));
                    if (allSelected) {
                      setSelectedChannels(selectedChannels.filter(id => !allFilteredIds.includes(id)));
                    } else {
                      setSelectedChannels(Array.from(new Set([...selectedChannels, ...allFilteredIds])));
                    }
                  } else {
                    const allFilteredIds = filteredMedia.map(m => m.id);
                    const allSelected = allFilteredIds.every(id => selectedMedia.includes(id));
                    if (allSelected) {
                      setSelectedMedia(selectedMedia.filter(id => !allFilteredIds.includes(id)));
                    } else {
                      setSelectedMedia(Array.from(new Set([...selectedMedia, ...allFilteredIds])));
                    }
                  }
                }}
                className="bg-black/5 dark:bg-white/15 hover:bg-black/10 dark:hover:bg-white/20 text-[#0f172a] dark:text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 border border-black/5 dark:border-white/10"
              >
                {tab === 'channel' ? (
                  filteredChannels.length > 0 && filteredChannels.every(c => selectedChannels.includes(c.id))
                    ? "إلغاء تحديد الكل 🟩"
                    : "تحديد كل القنوات ⬜"
                ) : (
                  filteredMedia.length > 0 && filteredMedia.every(m => selectedMedia.includes(m.id))
                    ? "إلغاء تحديد الكل 🟩"
                    : "تحديد كل الترفيه ⬜"
                )}
              </button>
              
              <span className="text-xs text-gray-500 font-bold">
                {tab === 'channel' 
                  ? `تم تحديد ${selectedChannels.length} من أصل ${filteredChannels.length}`
                  : `تم تحديد ${selectedMedia.length} من أصل ${filteredMedia.length}`}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto items-center">
              {tab === 'channel' && selectedChannels.length > 0 && (
                <button
                  type="button"
                  id="export-m3u-btn"
                  onClick={handleExportM3U}
                  disabled={loading}
                  className="w-full sm:w-auto bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/25 px-5 py-2.5 rounded-2xl text-[12px] font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير المحددة إلى ملف M3U</span>
                </button>
              )}

              {((tab === 'channel' && selectedChannels.length > 0) || (tab === 'media' && selectedMedia.length > 0)) && (
                <button
                  type="button"
                  id={`bulk-delete-btn-${tab}`}
                  onClick={() => setBulkDeleteConfirmType(tab)}
                  disabled={loading}
                  className="w-full sm:w-auto bg-red-600/15 hover:bg-red-600/20 text-red-500 border border-red-500/25 px-5 py-2.5 rounded-2xl text-[12px] font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف العناصر المحددة دفعة واحدة</span>
                </button>
              )}
            </div>
          </div>
        )}

        {tab === 'match' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-[#121212] p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-black/5 dark:border-white/5 shadow-md" style={{ direction: "rtl" }}>
            <div className="flex flex-col gap-1 text-right">
              <label className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 mr-1">تصفية حسب حالة المباراة:</label>
              <select
                value={matchStatusFilter}
                onChange={(e) => setMatchStatusFilter(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none focus:border-brand text-[#0f172a] dark:text-white font-bold transition-all"
              >
                <option value="all" className="bg-white dark:bg-[#121212] text-[#0f172a] dark:text-white">الكل (جميع الحالات)</option>
                <option value="upcoming" className="bg-white dark:bg-[#1a1a1a] text-[#0f172a] dark:text-white">قادمة 📅</option>
                <option value="live" className="bg-white dark:bg-[#1a1a1a] text-green-500 font-bold">جارية الآن 🔴</option>
                <option value="finished" className="bg-white dark:bg-[#1a1a1a] text-[#0f172a] dark:text-white">انتهت ✅</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1 text-right">
              <label className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 mr-1">تصفية حسب الدوري / البطولة:</label>
              <select
                value={matchLeagueFilter}
                onChange={(e) => setMatchLeagueFilter(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none focus:border-brand text-[#0f172a] dark:text-white font-bold transition-all"
              >
                <option value="all" className="bg-white dark:bg-[#121212] text-[#0f172a] dark:text-white">الكل (جميع البطولات)</option>
                {Array.from(new Set(matches.map(m => m.league).filter(Boolean))).map((league: any, idx) => (
                  <option key={idx} value={league} className="bg-white dark:bg-[#1a1a1a] text-[#0f172a] dark:text-white">{league}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {tab === 'channel' && (
          <div className="grid grid-cols-1 gap-3 bg-white dark:bg-[#121212] p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-black/5 dark:border-white/5 shadow-md text-right animate-in fade-in duration-300" style={{ direction: "rtl" }}>
            <div className="flex flex-col gap-1.5 text-right w-full">
              <label className="text-[10px] sm:text-xs font-black text-gray-400 dark:text-gray-500 mr-1">تحديد القنوات وحذفها حسب القسم:</label>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <select
                  value={channelGroupFilter}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setChannelGroupFilter(nextVal);
                  }}
                  className="flex-1 w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none focus:border-brand text-[#0f172a] dark:text-white font-bold transition-all"
                >
                  <option value="all" className="bg-white dark:bg-[#121212] text-[#0f172a] dark:text-white">الكل (جميع الأقسام)</option>
                  {Array.from(new Set(channels.map(c => c.group).filter(Boolean))).map((grp: any, idx) => (
                    <option key={idx} value={grp} className="bg-white dark:bg-[#1a1a1a] text-[#0f172a] dark:text-white">{grp}</option>
                  ))}
                </select>

                {channelGroupFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => {
                      const grpChannels = channels.filter(c => c.group === channelGroupFilter).map(c => c.id);
                      setSelectedChannels(Array.from(new Set([...selectedChannels, ...grpChannels])));
                      showMessage(`تم تحديد قنوات قسم [ ${channelGroupFilter} ] ✅`, "success");
                    }}
                    className="shrink-0 bg-brand hover:bg-[#00C2FF] hover:text-slate-900 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg hover:shadow-[#00C2FF]/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 font-sans"
                  >
                    تحديد كل قنوات ({channelGroupFilter}) ⬜
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'media' && (
          <div className="grid grid-cols-1 gap-3 bg-white dark:bg-[#121212] p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-black/5 dark:border-white/5 shadow-md text-right animate-in fade-in duration-300" style={{ direction: "rtl" }}>
            <div className="flex flex-col gap-1.5 text-right w-full">
              <label className="text-[10px] sm:text-xs font-black text-gray-400 dark:text-gray-500 mr-1">تحديد وحذف الترفيه (أفلام ومسلسلات) حسب القسم:</label>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <select
                  value={mediaCategoryFilter}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setMediaCategoryFilter(nextVal);
                  }}
                  className="flex-1 w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none focus:border-brand text-[#0f172a] dark:text-white font-bold transition-all"
                >
                  <option value="all" className="bg-white dark:bg-[#121212] text-[#0f172a] dark:text-white">الكل (جميع الأقسام)</option>
                  {Array.from(new Set(mediaList.map(m => m.category).filter(Boolean))).map((cat: any, idx) => (
                    <option key={idx} value={cat} className="bg-white dark:bg-[#1a1a1a] text-[#0f172a] dark:text-white">{cat}</option>
                  ))}
                </select>

                {mediaCategoryFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => {
                      const catMedia = mediaList.filter(m => m.category === mediaCategoryFilter).map(m => m.id);
                      setSelectedMedia(Array.from(new Set([...selectedMedia, ...catMedia])));
                      showMessage(`تم تحديد أفلام ومسلسلات قسم [ ${mediaCategoryFilter} ] ✅`, "success");
                    }}
                    className="shrink-0 bg-brand hover:bg-[#00C2FF] hover:text-slate-900 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg hover:shadow-[#00C2FF]/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 font-sans"
                  >
                    تحديد كل عناصر ({mediaCategoryFilter}) ⬜
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 w-full max-w-[490.264px] mx-auto">
          {tab === 'match' && filteredMatches.map((m, index) => (
            <div key={`${m.id}-${index}`} className="bg-white dark:bg-[#1a1a1a] p-4 rounded-3xl border border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm w-full max-w-[490.264px] mx-auto">
              <div className="flex items-center gap-3">
                 <div className="flex items-center -space-x-2">
                   <img src={m.logoA || undefined} className="w-8 h-8 object-contain bg-white/10 p-1 rounded-lg" alt="" />
                   <img src={m.logoB || undefined} className="w-8 h-8 object-contain bg-white/10 p-1 rounded-lg" alt="" />
                 </div>
                 <div>
                   <div className="font-bold text-sm sm:text-base text-[#0f172a] dark:text-white">{m.teamA} VS {m.teamB}</div>
                  {/* Hidden ID */}
                 </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-black/5 dark:border-white/5 justify-end">
                 <button type="button" onClick={() => startEdit(m, 'match')} disabled={loading} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors disabled:opacity-50"><Edit className="w-5 h-5" /></button>
                 {confirmDelete?.id === m.id ? (
                   <div className="flex gap-1 animate-pulse">
                     <button type="button" onClick={() => handleDelete(m.id, 'matches')} className="bg-red-600 text-white text-xs px-2 py-1 rounded">تأكيد</button>
                     <button type="button" onClick={() => setConfirmDelete(null)} className="bg-gray-600 text-white text-xs px-2 py-1 rounded">إلغاء</button>
                   </div>
                 ) : (
                   <button type="button" onClick={() => setConfirmDelete({ id: m.id, collection: 'matches' })} disabled={loading} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors disabled:opacity-50"><Trash className="w-5 h-5" /></button>
                 )}
              </div>
            </div>
          ))}

          {tab === 'channel' && filteredChannels.map((c, index) => (
            <div key={`${c.id}-${index}`} className="bg-white dark:bg-[#1a1a1a] p-4 rounded-3xl border border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm w-full max-w-[490.264px] mx-auto">
              <div className="flex items-center gap-3">
                 <input 
                   type="checkbox" 
                   id={`checkbox-channel-${c.id}`}
                   checked={selectedChannels.includes(c.id)}
                   onChange={(e) => {
                     if (e.target.checked) {
                       setSelectedChannels([...selectedChannels, c.id]);
                     } else {
                       setSelectedChannels(selectedChannels.filter(id => id !== c.id));
                     }
                   }}
                   className="w-4.5 h-4.5 rounded-[6px] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-brand focus:ring-brand accent-brand cursor-pointer shrink-0" 
                 />
                 <img src={c.logo || undefined} className="w-10 h-10 rounded-xl object-cover bg-white/10" alt="" />
                 <div>
                   <div className="font-bold text-sm sm:text-base text-[#0f172a] dark:text-white">{c.name}</div>
                   <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{c.group}</div>
                 </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-black/5 dark:border-white/5 justify-end">
                 <button 
                    type="button" 
                    onClick={() => {
                      if (previewChannel?.id === c.id) {
                        setPreviewChannel(null);
                      } else {
                        setPreviewChannel({
                          id: c.id,
                          name: c.name,
                          url: c.url,
                          logo: c.logo,
                          type: c.type || 'hls',
                          audioUrl: c.audioUrl || undefined
                        });
                      }
                    }}
                    className={`p-2 rounded-lg transition-all active:scale-95 flex items-center justify-center ${
                      previewChannel?.id === c.id 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse' 
                        : 'hover:bg-emerald-500/10 text-emerald-400'
                    }`}
                    title="تشغيل القناة في صفحة التحكم"
                  >
                    <Play className="w-4.5 h-4.5 fill-current" />
                  </button>
                  <button type="button" onClick={() => startEdit(c, 'channel')} disabled={loading} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors disabled:opacity-50"><Edit className="w-5 h-5" /></button>
                 {confirmDelete?.id === c.id ? (
                   <div className="flex gap-1 animate-pulse">
                     <button type="button" onClick={() => handleDelete(c.id, 'channels')} className="bg-red-600 text-white text-xs px-2 py-1 rounded">تأكيد</button>
                     <button type="button" onClick={() => setConfirmDelete(null)} className="bg-gray-600 text-white text-xs px-2 py-1 rounded">إلغاء</button>
                   </div>
                 ) : (
                   <button type="button" onClick={() => setConfirmDelete({ id: c.id, collection: 'channels' })} disabled={loading} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors disabled:opacity-50"><Trash className="w-5 h-5" /></button>
                 )}
              </div>
            </div>
          ))}

          {tab === 'media' && filteredMedia.map((m, index) => (
            <div key={`${m.id}-${index}`} className="bg-white dark:bg-[#1a1a1a] p-4 rounded-3xl border border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm w-full max-w-[490.264px] mx-auto">
              <div className="flex items-center gap-3">
                 <input 
                   type="checkbox" 
                   id={`checkbox-media-${m.id}`}
                   checked={selectedMedia.includes(m.id)}
                   onChange={(e) => {
                     if (e.target.checked) {
                       setSelectedMedia([...selectedMedia, m.id]);
                     } else {
                       setSelectedMedia(selectedMedia.filter(id => id !== m.id));
                     }
                   }}
                   className="w-4.5 h-4.5 rounded-[6px] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-brand focus:ring-brand accent-brand cursor-pointer shrink-0" 
                 />
                 <img src={m.poster || undefined} className="w-10 h-14 rounded-xl object-cover bg-white/10" alt="" />
                 <div>
                   <div className="font-bold text-sm sm:text-base text-[#0f172a] dark:text-white line-clamp-1">{m.title}</div>
                  {/* Hidden ID */}
                   <div className="inline-block px-2 py-0.5 rounded-lg bg-brand/10 text-brand text-[9px] font-bold uppercase tracking-tighter">{m.category}</div>
                 </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-black/5 dark:border-white/5 justify-end">
                 <a href={`/media/${m.id}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 rounded-lg transition-colors"><Info className="w-5 h-5" /></a>
                 <button type="button" onClick={() => startEdit(m, 'media')} disabled={loading} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors disabled:opacity-50"><Edit className="w-5 h-5" /></button>
                 <button 
                    type="button" 
                    disabled={loadingEpisodesId === m.id || loading}
                    onClick={() => {
                      if (previewChannel?.id === m.id) {
                        setPreviewChannel(null);
                      } else {
                        handlePlayMedia(m);
                      }
                    }}
                    className={`p-2 rounded-lg transition-all active:scale-95 flex items-center justify-center ${
                      previewChannel?.id === m.id 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse' 
                        : 'hover:bg-emerald-500/10 text-emerald-400'
                    } disabled:opacity-50`}
                    title="تشغيل في صفحة التحكم"
                 >
                    {loadingEpisodesId === m.id ? (
                      <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <Play className="w-4.5 h-4.5 fill-current" />
                    )}
                 </button>
                 {confirmDelete?.id === m.id ? (
                   <div className="flex gap-1 animate-pulse">
                     <button type="button" onClick={() => handleDelete(m.id, 'media')} className="bg-red-600 text-white text-xs px-2 py-1 rounded">تأكيد</button>
                     <button type="button" onClick={() => setConfirmDelete(null)} className="bg-gray-600 text-white text-xs px-2 py-1 rounded">إلغاء</button>
                   </div>
                 ) : (
                   <button type="button" onClick={() => setConfirmDelete({ id: m.id, collection: 'media' })} disabled={loading} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors disabled:opacity-50"><Trash className="w-5 h-5" /></button>
                 )}
              </div>
            </div>
          ))}
          {tab === 'category' && customCategories.filter(cat => !adminSearch.trim() || matchesQuery(cat.name, adminSearch) || matchesQuery(cat.id, adminSearch)).map((cat, index) => (
            <div key={`${cat.id}-${index}`} className="bg-white dark:bg-[#1a1a1a] p-4 rounded-3xl border border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm w-full max-w-[490.264px] mx-auto" style={{ direction: 'rtl' }}>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">
                   {cat.type === 'channel' ? 'قناة' : cat.type === 'movie' ? 'فيلم' : 'مسلسل'}
                 </div>
                 <div className="text-right">
                   <div className="font-bold text-sm sm:text-base text-[#0f172a] dark:text-white">{cat.name}</div>
                   <div className="text-[10px] text-gray-400 font-mono">ID: {cat.id}</div>
                 </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-black/5 dark:border-white/5 justify-end">
                 <button type="button" onClick={() => startEdit(cat, 'category')} disabled={loading} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors disabled:opacity-50"><Edit className="w-5 h-5" /></button>
                 <button type="button" onClick={() => handleDeleteCategory(cat.id)} disabled={loading} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors disabled:opacity-50"><Trash className="w-5 h-5" /></button>
              </div>
            </div>
          ))}
          {tab === 'league' && leagues.filter(l => !adminSearch.trim() || matchesQuery(l.name, adminSearch)).map((l, index) => (
            <div key={`${l.id}-${index}`} className="bg-white dark:bg-[#1a1a1a] p-4 rounded-3xl border border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm w-full max-w-[490.264px] mx-auto" style={{ direction: 'rtl' }}>
              <div className="flex items-center gap-3 text-right">
                 {l.logo ? (
                   <img src={l.logo} className="w-10 h-10 rounded-xl object-contain bg-white/10 p-1" alt="" />
                 ) : (
                   <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-xs shrink-0">
                     🏆
                   </div>
                 )}
                 <div>
                   <div className="font-bold text-sm sm:text-base text-[#0f172a] dark:text-white">{l.name}</div>
                 </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-black/5 dark:border-white/5 justify-end">
                 <button type="button" onClick={() => startEdit(l, 'league')} disabled={loading} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors disabled:opacity-50"><Edit className="w-5 h-5" /></button>
                 <button type="button" onClick={() => handleDeleteLeague(l.id)} disabled={loading} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors disabled:opacity-50"><Trash className="w-5 h-5" /></button>
              </div>
            </div>
          ))}
          {['match', 'channel', 'media', 'category', 'league'].includes(tab) && (tab === 'match' ? filteredMatches : tab === 'channel' ? filteredChannels : tab === 'category' ? customCategories.filter(cat => !adminSearch.trim() || matchesQuery(cat.name, adminSearch) || matchesQuery(cat.id, adminSearch)) : tab === 'league' ? leagues.filter(l => !adminSearch.trim() || matchesQuery(l.name, adminSearch)) : filteredMedia).length === 0 && (
            <div className="p-8 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl italic">
              {adminSearch ? "لا توجد نتائج مطابقة للبحث 🔍" : "لا توجد عناصر مضافة بعد"}
            </div>
          )}
        </div>
      </div>

      {bulkDeleteConfirmType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" style={{ direction: "rtl" }}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] border border-black/10 dark:border-white/10 p-6 max-w-md w-full shadow-2xl space-y-6 text-center animate-pulse-once">
            <div className="mx-auto w-14 h-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
              <Trash2 className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-black text-[#0f172a] dark:text-white">
                {bulkDeleteConfirmType === 'channel' ? "هل تود حذف جميع القنوات؟" : "هل تود حذف جميع الترفيه؟"}
              </h3>
              <p className="text-xs text-gray-400 font-bold">
                سيتم حذف {bulkDeleteConfirmType === 'channel' ? selectedChannels.length : selectedMedia.length} عنصر من المحدد بشكل نهائي وبأثر فوري.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={async () => {
                  const activeType = bulkDeleteConfirmType;
                  setBulkDeleteConfirmType(null);
                  await handleBulkDelete(activeType);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-2xl text-xs transition-all active:scale-95 flex-1 shadow-lg shadow-red-600/20"
              >
                نعم
              </button>
              <button
                type="button"
                onClick={() => setBulkDeleteConfirmType(null)}
                className="bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#0f172a] dark:text-white px-6 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 flex-1 border border-black/5 dark:border-white/10"
              >
                لا
              </button>
            </div>
          </div>
        </div>
      )}

      {previewChannel && (
        <div className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-[9999] w-full max-w-[340px] sm:max-w-[420px] bg-[#0E1B2E]/95 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 shadow-[0_25px_60px_-15px_rgba(7,17,31,0.95)] animate-in fade-in slide-in-from-bottom duration-300 pointer-events-auto" style={{ direction: "rtl" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              {previewChannel.logo && (
                <img src={previewChannel.logo} className="w-8 h-8 rounded-xl object-cover bg-white/5 border border-white/10" alt="" />
              )}
              <div className="text-right">
                <div className="text-white text-xs font-black line-clamp-1">{previewChannel.name}</div>
                <div className="text-[9px] text-[#00C2FF] font-bold">{previewChannel.subtext || "بث مباشر تجريبي 🔴"}</div>
              </div>
            </div>
            <button 
              onClick={() => setPreviewChannel(null)} 
              className="p-1 px-2.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg text-[10px] transition-all border border-white/5 font-bold"
            >
              إغلاق ✕
            </button>
          </div>
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-[#07111F] ring-1 ring-white/10">
            {previewChannel.type === 'iframe' ? (
              <iframe 
                src={previewChannel.url} 
                className="w-full h-full border-none" 
                allowFullScreen
                allow="autoplay; encrypted-media"
              />
            ) : (
              <VideoPlayer 
                src={previewChannel.url} 
                poster={previewChannel.logo}
                audioUrl={previewChannel.audioUrl || undefined}
                key={previewChannel.url} // Force remount if url changes
              />
            )}
          </div>
          {previewChannel.episodes && previewChannel.episodes.length > 0 && (
            <div className="mt-3 text-right">
              <label className="text-[10px] text-gray-400 font-bold block mb-1">اختر الحلقة للمشاهدة:</label>
              <select
                value={previewChannel.currentEpisodeNumber}
                onChange={(e) => {
                  const epNum = Number(e.target.value);
                  const selectedEp = previewChannel.episodes.find((ep: any) => ep.number === epNum);
                  if (selectedEp) {
                    setPreviewChannel({
                      ...previewChannel,
                      url: selectedEp.url,
                      audioUrl: selectedEp.audioUrl || undefined,
                      currentEpisodeNumber: epNum,
                      subtext: `مسلسل • حلقة ${epNum} 📺`
                    });
                  }
                }}
                className="w-full bg-[#07111F] text-white border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none focus:border-brand"
              >
                {previewChannel.episodes.map((ep: any, idx: number) => (
                  <option key={idx} value={ep.number} className="bg-[#0e1b2e] text-white">
                    الحلقة {ep.number}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
