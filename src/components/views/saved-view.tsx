"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bookmark,
  X,
  ArrowDownAZ,
  ArrowUpAZ,
  Heart,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import {
  MotivationCard,
  MotivationCardData,
  MotivationCardSkeleton,
} from "@/components/motivation-card";
import { useToast } from "@/hooks/use-toast";

interface SavedItem extends MotivationCardData {
  savedId: string;
  customCategory: string | null;
  originalCategory: string;
  isFavorite: boolean;
  createdAt: string;
}

type SortKey = "newest" | "oldest" | "favorite";

export function SavedView() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<SavedItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [category, setCategory] = React.useState<string>("");
  const [sort, setSort] = React.useState<SortKey>("newest");

  // Edit-category dialog state
  const [editing, setEditing] = React.useState<SavedItem | null>(null);
  const [editValue, setEditValue] = React.useState("");

  // Manual-add dialog state
  const [addOpen, setAddOpen] = React.useState(false);
  const [addTitle, setAddTitle] = React.useState("");
  const [addContent, setAddContent] = React.useState("");
  const [addCategory, setAddCategory] = React.useState("");
  const [addSubmitting, setAddSubmitting] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (category) params.set("category", category);
      if (sort) params.set("sort", sort);
      const res = await fetch(`/api/saved?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "שגיאה בטעינה");
      setItems(json.data.items);
    } catch (err) {
      toast({
        title: "שגיאה בטעינת השמורים",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, sort, toast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.customCategory) set.add(i.customCategory);
      if (i.originalCategory) set.add(i.originalCategory);
    });
    return Array.from(set).sort();
  }, [items]);

  const handleDelete = async (item: SavedItem) => {
    setItems((prev) => prev.filter((i) => i.savedId !== item.savedId));
    try {
      const res = await fetch(`/api/saved/${item.savedId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "שגיאה");
      toast({ title: "נמחק" });
    } catch (err) {
      toast({
        title: "לא הצלחנו למחוק",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
      void load();
    }
  };

  const handleToggleFavorite = async (item: SavedItem) => {
    const next = !item.isFavorite;
    setItems((prev) =>
      prev.map((i) =>
        i.savedId === item.savedId ? { ...i, isFavorite: next } : i,
      ),
    );
    try {
      await fetch(`/api/saved/${item.savedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: next }),
      });
    } catch {
      void load();
    }
  };

  const openEdit = (item: SavedItem) => {
    setEditing(item);
    setEditValue(item.customCategory ?? "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    const newValue = editValue.trim() || null;
    setItems((prev) =>
      prev.map((i) =>
        i.savedId === editing.savedId
          ? {
              ...i,
              customCategory: newValue,
              category: newValue ?? i.originalCategory,
            }
          : i,
      ),
    );
    setEditing(null);
    try {
      await fetch(`/api/saved/${editing.savedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customCategory: newValue }),
      });
      toast({ title: "הקטגוריה עודכנה" });
    } catch {
      void load();
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setSort("newest");
  };

  const filterCount = (search ? 1 : 0) + (category ? 1 : 0);

  const resetAddForm = () => {
    setAddTitle("");
    setAddContent("");
    setAddCategory("");
  };

  const submitManual = async () => {
    if (!addTitle.trim() || !addContent.trim()) {
      toast({
        title: "חסר מידע",
        description: "כותרת ותוכן הם שדות חובה.",
        variant: "destructive",
      });
      return;
    }
    setAddSubmitting(true);
    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manual: true,
          title: addTitle.trim(),
          content: addContent.trim(),
          category: addCategory.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "שגיאה בשמירה");
      }
      toast({ title: "המשפט נוסף לשמורים" });
      resetAddForm();
      setAddOpen(false);
      void load();
    } catch (err) {
      toast({
        title: "שגיאה בהוספה",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setAddSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-extrabold">השמורים שלי</h1>
          <p className="text-sm text-muted-foreground">
            הציטוטים, העצות והתובנות שבחרת לשמור – זמינים לך בכל רגע.
          </p>
        </div>
        <Button
          variant="gradient"
          size="lg"
          onClick={() => setAddOpen(true)}
          className="rounded-2xl"
        >
          <Plus className="h-5 w-5" />
          הוסף משפט
        </Button>
      </header>

      {/* Filters */}
      <div className="grid gap-3 rounded-2xl border border-border/40 bg-card/40 p-4 backdrop-blur md:grid-cols-[1fr_220px_180px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש בשמורים…"
            className="pe-10"
          />
        </div>

        <Select
          value={category || "all"}
          onValueChange={(v) => setCategory(v === "all" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="כל הקטגוריות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הקטגוריות</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">
              <div className="flex items-center gap-2">
                <ArrowDownAZ className="h-4 w-4" />
                החדשים ביותר
              </div>
            </SelectItem>
            <SelectItem value="oldest">
              <div className="flex items-center gap-2">
                <ArrowUpAZ className="h-4 w-4" />
                הישנים ביותר
              </div>
            </SelectItem>
            <SelectItem value="favorite">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                מועדפים תחילה
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {filterCount > 0 && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4" />
            נקה
          </Button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MotivationCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-12 text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Bookmark className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold">אין עדיין פריטים שמורים</h3>
          <p
            className="mx-auto mt-1 max-w-md text-sm text-muted-foreground"
            dir="ltr"
          >
            Be the best!
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {items.map((item, idx) => (
              <motion.div
                layout
                key={item.savedId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="group relative">
                  <MotivationCard
                    item={{ ...item, saved: true }}
                    index={idx}
                    onUnsave={() => handleDelete(item)}
                    onToggleFavorite={() => handleToggleFavorite(item)}
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-background/95 shadow-lg"
                      onClick={() => openEdit(item)}
                    >
                      ערוך קטגוריה
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      <Dialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>עריכת קטגוריה</DialogTitle>
            <DialogDescription>
              הוסף או שנה את הקטגוריה האישית של הפריט הזה. השאר ריק כדי לחזור
              לקטגוריה המקורית של ה-AI.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit-cat">קטגוריה</Label>
            <Input
              id="edit-cat"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={editing?.originalCategory ?? "כתוב קטגוריה…"}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              ביטול
            </Button>
            <Button onClick={saveEdit}>שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual-add dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) resetAddForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוספת משפט ידנית</DialogTitle>
            <DialogDescription>
              כתוב משפט מוטיבציה משלך, ציטוט שמצא חן בעיניך, או רעיון אישי –
              הוא יישמר אצלך לצד שאר הפריטים.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="add-title">כותרת</Label>
              <Input
                id="add-title"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                placeholder="לדוגמה: לקום מוקדם"
                disabled={addSubmitting}
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-content">תוכן</Label>
              <textarea
                id="add-content"
                value={addContent}
                onChange={(e) => setAddContent(e.target.value)}
                placeholder="כתוב כאן את המשפט המלא…"
                disabled={addSubmitting}
                maxLength={2000}
                rows={4}
                className="flex w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-category">קטגוריה (לא חובה)</Label>
              <Input
                id="add-category"
                value={addCategory}
                onChange={(e) => setAddCategory(e.target.value)}
                placeholder="ברירת מחדל: אישי"
                disabled={addSubmitting}
                maxLength={60}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setAddOpen(false)}
              disabled={addSubmitting}
            >
              ביטול
            </Button>
            <Button
              variant="gradient"
              onClick={submitManual}
              disabled={addSubmitting}
            >
              {addSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  שומר…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  הוסף לשמורים
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
