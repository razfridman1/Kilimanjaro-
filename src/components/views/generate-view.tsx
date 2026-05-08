"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wand2, Loader2, RefreshCw } from "lucide-react";
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
  MotivationCard,
  MotivationCardData,
  MotivationCardSkeleton,
} from "@/components/motivation-card";
import { useToast } from "@/hooks/use-toast";
import { MOOD_OPTIONS } from "@/lib/constants";

interface GenerateResponse {
  ok: boolean;
  data?: {
    generationId: string;
    items: MotivationCardData[];
    remaining?: number;
  };
  error?: string;
}

export function GenerateView() {
  const [items, setItems] = React.useState<MotivationCardData[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [topic, setTopic] = React.useState("");
  const [mood, setMood] = React.useState<string>("");
  const { toast } = useToast();

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
      // Smooth scroll to results.
      requestAnimationFrame(() => {
        document
          .getElementById("results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
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
  };

  const handleUnsave = async (item: MotivationCardData) => {
    const res = await fetch(`/api/saved/${item.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error ?? "שגיאה בהסרה");
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, saved: false } : it)),
    );
  };

  const handleToggleFavorite = async (item: MotivationCardData) => {
    const next = !item.isFavorite;
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id ? { ...it, isFavorite: next } : it,
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
            לחץ על הכפתור ותקבל מיד עשרה רעיונות, ציטוטים וטיפים מעשיים בעברית –
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
    </div>
  );
}
