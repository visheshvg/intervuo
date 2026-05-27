import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function scoreColor(score: number): string {
  if (score >= 8) return "text-green-600";
  if (score >= 6) return "text-amber-600";
  return "text-red-500";
}

export function scoreBg(score: number): string {
  if (score >= 8) return "bg-green-50 text-green-700";
  if (score >= 6) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-600";
}
