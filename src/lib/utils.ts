import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely. Use everywhere instead of string concat.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a Date as a localized Hebrew string (e.g. "8 במאי 2026").
 */
export function formatHebrewDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/**
 * Slugify a (Hebrew or Latin) string into a URL-safe key.
 * Falls back to a hash if the string contains only non-alphanumeric chars.
 */
export function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `cat-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Stable id generator for client-only optimistic UI.
 */
export function tempId(prefix = "tmp"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Safe JSON parse that never throws.
 */
export function safeJsonParse<T = unknown>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
