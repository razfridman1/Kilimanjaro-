/**
 * App-wide constants & Hebrew copy.
 */

export const APP_NAME = "מוטיבציה";
export const APP_TAGLINE = "מוטיבציה יומית בעברית, מותאמת אישית.";
export const APP_DESCRIPTION =
  "אפליקציית מוטיבציה ופיתוח אישי המופעלת על ידי בינה מלאכותית – ציטוטים, עצות וטיפים יומיים בעברית.";

export const NAV_LINKS = [
  { href: "/dashboard", label: "קילימנג'רו" },
  { href: "/saved", label: "שמורים" },
] as const;

export const DEFAULT_CATEGORIES = [
  { name: "משמעת", slug: "discipline", color: "#8b5cf6" },
  { name: "ביטחון עצמי", slug: "confidence", color: "#06b6d4" },
  { name: "מוטיבציה לאימון", slug: "gym", color: "#ef4444" },
  { name: "פרודוקטיביות", slug: "productivity", color: "#10b981" },
  { name: "מיקוד", slug: "focus", color: "#f59e0b" },
  { name: "הערכה עצמית", slug: "self-esteem", color: "#ec4899" },
  { name: "מיינדסט של הצלחה", slug: "success", color: "#3b82f6" },
] as const;

export const MOOD_OPTIONS = [
  { value: "energetic", label: "אנרגטי" },
  { value: "tired", label: "עייף" },
  { value: "anxious", label: "לחוץ" },
  { value: "focused", label: "ממוקד" },
  { value: "demotivated", label: "חסר מוטיבציה" },
  { value: "ambitious", label: "שאפתני" },
] as const;
