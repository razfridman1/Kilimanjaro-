"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Wand2,
  Loader2,
  RefreshCw,
  History,
  ChevronDown,
  Bookmark,
  BookmarkCheck,
  Heart,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Share2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MotivationCard,
  MotivationCardData,
  MotivationCardSkeleton,
} from "@/components/motivation-card";
import { useToast } from "@/hooks/use-toast";
import { MOOD_OPTIONS } from "@/lib/constants";
import { formatHebrewDate } from "@/lib/utils";

interface GenerateResponse {
  ok: boolean;
  data?: {
    generationId: string;
    items: MotivationCardData[];
    remaining?: number;
  };
  error?: string;
}

interface HistoryItem extends MotivationCardData {
  createdAt: string;
  savedId: string | null;
}

const STORAGE_KEY = "kilimanjaro:lastGeneration";
const HISTORY_PAGE_SIZE = 30;

export function GenerateView() {
  const [items, setItems] = React.useState<MotivationCardData[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  const [topic, setTopic] = React.useState("");
  const [mood, setMood] = React.useState<string>("");
  const { toast } = useToast();

  // History state
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(true);
  const [historyCursor, setHistoryCursor] = React.useState<string | null>(null);
  const [historyHasMore, setHistoryHasMore] = React.useState(false);
  const [historyLoadingMore, setHistoryLoadingMore] = React.useState(false);

  // Edit-quote dialog state
  const [editing, setEditing] = React.useState<MotivationCardData | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editContent, setEditContent] = React.useState("");
  const [editCategory, setEditCategory] = React.useState("");
  const [editSubmitting, setEditSubmitting] = React.useState(false);

  // ----- Hydrate current items from localStorage on mount -----
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setItems(parsed as MotivationCardData[]);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Persist current items whenever they change (after hydration).
  React.useEffect(() => {
    if (!hydrated) return;
    try {
      if (items.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  // ----- History fetcher -----
  const fetchHistory = React.useCallback(
    async (cursor?: string | null) => {
      const params = new URLSearchParams();
      params.set("take", String(HISTORY_PAGE_SIZE));
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/quotes?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(json.error ?? "שגיאה בטעינת ההיסטוריה");
      return {
        items: json.data.items as HistoryItem[],
        nextCursor: json.data.nextCursor as string | null,
      };
    },
    [],
  );

  const loadInitialHistory = React.useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetchHistory();
      setHistory(res.items);
      setHistoryCursor(res.nextCursor);
      setHistoryHasMore(!!res.nextCursor);
    } catch (err) {
      toast({
        title: "שגיאה בטעינת ההיסטוריה",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setHistoryLoading(false);
    }
  }, [fetchHistory, toast]);

  React.useEffect(() => {
    void loadInitialHistory();
  }, [loadInitialHistory]);

  const loadMoreHistory = async () => {
    if (!historyCursor || historyLoadingMore) return;
    setHistoryLoadingMore(true);
    try {
      const res = await fetchHistory(historyCursor);
      setHistory((prev) => [...prev, ...res.items]);
      setHistoryCursor(res.nextCursor);
      setHistoryHasMore(!!res.nextCursor);
    } catch (err) {
      toast({
        title: "שגיאה",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setHistoryLoadingMore(false);
    }
  };

  // ----- Generate -----
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic || undefined,
          mood: mood || undefined,
        }),
      });
      const json: GenerateResponse = await res.json();
      if (!res.ok || !json.ok || !json.data) {
        throw new Error(json.error ?? "שגיאה ביצירת המוטיבציה");
      }
      setItems(json.data.items.map((i) => ({ ...i, saved: false })));
      requestAnimationFrame(() => {
        document
          .getElementById("results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      // Refresh history so the new generation pushes older items down.
      void loadInitialHistory();
    } catch (err) {
      toast({
        title: "לא הצלחנו לייצר מוטיבציה",
        description: err instanceof Error ? err.message : "נסה שוב",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ----- Save / Unsave / Favorite (works for both current items and history) -----
  const handleSave = async (item: MotivationCardData) => {
    const res = await fetch("/api/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId: item.id }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      throw new Error(json.error ?? "שגיאה בשמירה");
    }
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, saved: true } : it)),
    );
    setHistory((prev) =>
      prev.map((h) =>
        h.id === item.id
          ? { ...h, saved: true, savedId: json.data?.savedId ?? null }
          : h,
      ),
    );
  };

  const handleUnsave = async (item: MotivationCardData) => {
    const res = await fetch(`/api/saved/${item.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error ?? "שגיאה בהסרה");
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, saved: false } : it)),
    );
    setHistory((prev) =>
      prev.map((h) =>
        h.id === item.id ? { ...h, saved: false, savedId: null } : h,
      ),
    );
  };

  const handleToggleFavorite = async (item: MotivationCardData) => {
    const next = !item.isFavorite;
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id ? { ...it, isFavorite: next } : it,
      ),
    );
    setHistory((prev) =>
      prev.map((h) =>
        h.id === item.id ? { ...h, isFavorite: next } : h,
      ),
    );
    if (item.saved) {
      await fetch(`/api/saved/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: next }),
      });
    }
  };

  // ----- Edit a quote (history only — opens dialog) -----
  const openEdit = (item: MotivationCardData) => {
    setEditing(item);
    setEditTitle(item.title);
    setEditContent(item.content);
    setEditCategory(item.category);
  };

  const submitEdit = async () => {
    if (!editing) return;
    if (!editTitle.trim() || !editContent.trim()) {
      toast({ title: "כותרת ותוכן חובה", variant: "destructive" });
      return;
    }
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/quotes/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim(),
          category: editCategory.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(json.error ?? "שגיאה בעדכון");
      const updated = json.data as Pick<
        HistoryItem,
        "id" | "title" | "content" | "category"
      >;
      const apply = <T extends MotivationCardData>(t: T): T =>
        t.id === updated.id
          ? { ...t, title: updated.title, content: updated.content, category: updated.category }
          : t;
      setItems((prev) => prev.map(apply));
      setHistory((prev) => prev.map(apply));
      toast({ title: "עודכן בהצלחה" });
      setEditing(null);
    } catch (err) {
      toast({
        title: "שגיאה בעדכון",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  // ----- Delete a quote permanently (history) -----
  const handleDeleteQuote = async (item: MotivationCardData) => {
    const res = await fetch(`/api/quotes/${item.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error ?? "שגיאה במחיקה");
    setHistory((prev) => prev.filter((h) => h.id !== item.id));
    setItems((prev) => prev.filter((it) => it.id !== item.id));
  };

  // History excludes items currently visible in the "results" section above
  // to avoid showing duplicates.
  const currentIds = React.useMemo(
    () => new Set(items.map((i) => i.id)),
    [items],
  );
  const visibleHistory = React.useMemo(
    () => history.filter((h) => !currentIds.has(h.id)),
    [history, currentIds],
  );

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/40 bg-hero-gradient p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            מוטיבציה אישית מבוססת בינה מלאכותית
          </div>
          <h1 className="text-balance font-display text-5xl font-extrabold leading-tight sm:text-7xl">
            <span className="gradient-text">קילימנג'רו</span>
          </h1>
          <p className="max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            לחץ על הכפתור ותקבל מיד שישה רעיונות, ציטוטים וטיפים מעשיים בעברית –
            מותאמים למצב הרוח והנושא שתבחר.
          </p>

          <div className="grid gap-4 rounded-2xl border border-border/40 bg-background/60 p-4 backdrop-blur-md sm:grid-cols-[1fr_220px_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="topic">נושא (לא חובה)</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="לדוגמה: התמדה בכושר, הקמת עסק, לימודים…"
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mood">מצב רוח</Label>
              <Select
                value={mood}
                onValueChange={(v) => setMood(v === "any" ? "" : v)}
                disabled={loading}
              >
                <SelectTrigger id="mood">
                  <SelectValue placeholder="בחר…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">ללא העדפה</SelectItem>
                  {MOOD_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                size="lg"
                variant="gradient"
                onClick={handleGenerate}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    רגע…
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5" />
                    תן לי 6
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Results */}
      <section id="results" className="space-y-4">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <MotivationCardSkeleton key={i} />
              ))}
            </motion.div>
          )}

          {!loading && items.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-2xl font-bold">
                  שישה רעיונות בשבילך
                </h2>
                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4" />
                  חדש
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, idx) => (
                  <MotivationCard
                    key={item.id}
                    item={item}
                    index={idx}
                    onSave={handleSave}
                    onUnsave={handleUnsave}
                    onToggleFavorite={handleToggleFavorite}
                    onEdit={openEdit}
                    onDelete={handleDeleteQuote}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {!loading && items.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-10 text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">מוכן להתחיל?</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                לחץ על "תן לי 6" ותקבל שישה רעיונות חדשים בעברית. כל פריט
                כולל כותרת, תוכן וקטגוריה – ניתן לשמור, לסווג ולחזור אליו.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* History */}
      <section className="space-y-4 border-t border-border/40 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <History className="h-5 w-5" />
            </span>
            <h2 className="font-display text-2xl font-bold">היסטוריה</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            כל המוטיבציות שייצרת – ניתן לערוך, למחוק ולשמור מחדש.
          </p>
        </div>

        {historyLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <MotivationCardSkeleton key={i} />
            ))}
          </div>
        ) : visibleHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              עדיין אין פריטים בהיסטוריה. צור מוטיבציה חדשה והם יופיעו כאן.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {visibleHistory.map((item) => (
                <HistoryRow
                  key={item.id}
                  item={item}
                  onSave={handleSave}
                  onUnsave={handleUnsave}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={openEdit}
                  onDelete={handleDeleteQuote}
                />
              ))}
            </div>
            {historyHasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={loadMoreHistory}
                  disabled={historyLoadingMore}
                >
                  {historyLoadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      טוען…
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      טען עוד
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Edit dialog */}
      <Dialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>עריכת פריט</DialogTitle>
            <DialogDescription>
              עדכן את הכותרת, התוכן או הקטגוריה. השינוי יישמר באופן קבוע.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title-q">כותרת</Label>
              <Input
                id="edit-title-q"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={editSubmitting}
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-content-q">תוכן</Label>
              <textarea
                id="edit-content-q"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                disabled={editSubmitting}
                maxLength={2000}
                rows={4}
                className="flex w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-cat-q">קטגוריה</Label>
              <Input
                id="edit-cat-q"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                disabled={editSubmitting}
                maxLength={60}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditing(null)}
              disabled={editSubmitting}
            >
              ביטול
            </Button>
            <Button
              variant="gradient"
              onClick={submitEdit}
              disabled={editSubmitting}
            >
              {editSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  שומר…
                </>
              ) : (
                "שמור שינויים"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ----------------------------------------------------------------------
// HistoryRow — compact, vertical, single-row representation of a past
// motivation item. Used inside the History section.
// ----------------------------------------------------------------------

interface HistoryRowProps {
  item: HistoryItem;
  onSave: (item: MotivationCardData) => Promise<void> | void;
  onUnsave: (item: MotivationCardData) => Promise<void> | void;
  onToggleFavorite: (item: MotivationCardData) => Promise<void> | void;
  onEdit: (item: MotivationCardData) => void;
  onDelete: (item: MotivationCardData) => Promise<void> | void;
}

function HistoryRow({
  item,
  onSave,
  onUnsave,
  onToggleFavorite,
  onEdit,
  onDelete,
}: HistoryRowProps) {
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();

  const toggleSave = () =>
    startTransition(async () => {
      try {
        await (item.saved ? onUnsave(item) : onSave(item));
      } catch (err) {
        toast({
          title: "שגיאה",
          description: err instanceof Error ? err.message : undefined,
          variant: "destructive",
        });
      }
    });

  const toggleFav = () =>
    startTransition(async () => {
      try {
        await onToggleFavorite(item);
      } catch (err) {
        toast({
          title: "שגיאה",
          variant: "destructive",
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });

  const handleDelete = () => {
    if (typeof window !== "undefined" && !window.confirm("למחוק את הפריט הזה?"))
      return;
    startTransition(async () => {
      try {
        await onDelete(item);
        toast({ title: "נמחק" });
      } catch (err) {
        toast({
          title: "שגיאה במחיקה",
          description: err instanceof Error ? err.message : undefined,
          variant: "destructive",
        });
      }
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${item.title}\n\n${item.content}`);
      toast({ title: "הועתק ללוח" });
    } catch {
      toast({ title: "לא ניתן להעתיק", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    const text = `${item.title}\n\n${item.content}`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: item.title, text });
        return;
      } catch {
        /* canceled */
      }
    }
    handleCopy();
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card/40 p-3 transition-colors hover:bg-card/70 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {item.category}
            </Badge>
            <span className="text-[11px] text-muted-foreground">
              {formatHebrewDate(item.createdAt)}
            </span>
          </div>
          <h3 className="mb-0.5 line-clamp-1 text-base font-semibold leading-tight">
            {item.title}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {item.content}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleSave}
            disabled={pending}
            aria-label={item.saved ? "הסר מהשמורים" : "שמור"}
            className="h-8 w-8"
          >
            {item.saved ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleFav}
            disabled={pending}
            aria-label="מועדף"
            className="h-8 w-8"
          >
            <Heart
              className={
                item.isFavorite
                  ? "h-4 w-4 fill-rose-500 text-rose-500"
                  : "h-4 w-4"
              }
            />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="עוד"
                className="h-8 w-8"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="me-2 h-4 w-4" />
                העתק
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="me-2 h-4 w-4" />
                שתף
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Pencil className="me-2 h-4 w-4" />
                ערוך
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="me-2 h-4 w-4" />
                מחק לצמיתות
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
