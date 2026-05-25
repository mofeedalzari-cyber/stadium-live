import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { motion } from "motion/react";

interface FavoriteButtonProps {
  itemId: string;
  type: "match" | "channel" | "media";
  itemData: any;
  className?: string;
  showText?: boolean;
}

export function FavoriteButton({ itemId, type, itemData, className = "", showText = false }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper to read local favorites
  const getLocalFavorites = (): any[] => {
    try {
      const stored = localStorage.getItem("app_favorites");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (!itemId) {
      setIsFavorite(false);
      return;
    }

    const checkFavorite = () => {
      const list = getLocalFavorites();
      const exists = list.some(item => item.itemId === itemId && item.type === type);
      setIsFavorite(exists);
    };

    checkFavorite();

    // Listen to local changes
    window.addEventListener("storage", checkFavorite);
    window.addEventListener("localFavoritesUpdated", checkFavorite);

    return () => {
      window.removeEventListener("storage", checkFavorite);
      window.removeEventListener("localFavoritesUpdated", checkFavorite);
    };
  }, [itemId, type]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    try {
      const list = getLocalFavorites();
      const exists = list.some(item => item.itemId === itemId && item.type === type);

      let newList;
      if (exists) {
        newList = list.filter(item => !(item.itemId === itemId && item.type === type));
      } else {
        const cleanData = { ...itemData };
        delete cleanData.id;

        newList = [
          ...list,
          {
            itemId,
            type,
            data: cleanData,
            createdAt: Date.now()
          }
        ];
      }

      localStorage.setItem("app_favorites", JSON.stringify(newList));
      setIsFavorite(!exists);

      // Notify other components on the same scope
      window.dispatchEvent(new Event("localFavoritesUpdated"));
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`flex items-center justify-center gap-1.5 transition-all ${className}`}
      title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
    >
      <motion.div
        animate={isFavorite ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart 
          className={`w-4 h-4 ${isFavorite ? "fill-brand text-brand" : "text-gray-400"} ${loading ? "opacity-50" : ""}`} 
        />
      </motion.div>
      {showText && (
        <span className={`text-xs font-bold ${isFavorite ? "text-brand" : "text-gray-400"}`}>
          {isFavorite ? "في المفضلة" : "إضافة للمفضلة"}
        </span>
      )}
    </button>
  );
}
