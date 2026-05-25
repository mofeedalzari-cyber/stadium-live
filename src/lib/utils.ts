import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function addToContinueWatching(item: { 
  id: string; 
  name?: string; 
  title?: string; 
  type: 'channel' | 'media' | 'match'; 
  poster?: string; 
  logo?: string; 
  logoA?: string; 
  logoB?: string; 
  teamA?: string; 
  teamB?: string; 
}) {
  try {
    const list = JSON.parse(localStorage.getItem("stad_continue_watching") || "[]");
    const newItem = {
      id: item.id,
      name: item.name || item.title || (item.teamA ? `${item.teamA} VS ${item.teamB}` : ""),
      type: item.type,
      poster: item.poster,
      logo: item.logo,
      logoA: item.logoA,
      logoB: item.logoB,
      teamA: item.teamA,
      teamB: item.teamB,
      watchedAt: Date.now()
    };
    // remove duplicates
    const filtered = list.filter((x: any) => !(x.id === item.id && x.type === item.type));
    filtered.unshift(newItem);
    // keep only latest 10
    localStorage.setItem("stad_continue_watching", JSON.stringify(filtered.slice(0, 10)));
    // Dispatch a storage event so components can update live
    window.dispatchEvent(new Event("continueWatchingChanged"));
  } catch (e) {
    console.error("Failed to add to continue watching:", e);
  }
}
