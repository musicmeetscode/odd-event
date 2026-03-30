import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMediaUrl(path: string | null | undefined) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    
    // VITE_API_URL is e.g. http://127.0.0.1:8000/api
    const baseUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:8000";
    return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
