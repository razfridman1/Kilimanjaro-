"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  Heart,
  Share2,
  Copy,
  Check,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface MotivationCardData {
  id: string;
  title: string;
  content: string;
  category: string;
  saved?: boolean;
  isFavorite?: boolean;
}

interface MotivationCardProps {
  item: MotivationCardData;
  index?: number;
  onSave?: (item: MotivationCardData) => Promise<void> | void;
  onUnsave?: (item: MotivationCardData) => Promise<void> | void;
  onToggleFavorite?: (item: MotivationCardData) => Promise<void> | void;
  onEdit?: (item: MotivationCardData) => void;
  onDelete?: (item: MotivationCardData) => Promise<void> | void;
  className?: string;
}

export function MotivationCard({
  item,
  index = 0,
  onSave,
  onUnsave,
  onToggleFavorite,
  onEdit,
  onDelete,
  className,
}: MotivationCardProps) {
  const [isPending, startTransition] = React.useTransition();
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  const handleSaveClick = () => {
    startTransition(async () => {
      try {
        if (item.saved) {
          await onUnsave?.(item);
          toast({ title: "הוסר מהשמורים" });
        } else {
          await onSave?.(item);
          toast({
            title: "נשמר בהצלחה",
            description: "תוכל למצוא את הציטוט בלשונית 'שמורים'.",
          });
        }
      } catch (err) {
        toast({
          title: "שגיאה",
          description: err instanceof Error ? err.message : "נסה שוב",
          variant: "destructive",
        });
      }
    });
  };

  const handleFavorite = () => {
    startTransition(async () => {
      try {
        await onToggleFavorite?.(item);
      } catch (err) {
        toast({
          title: "שגיאה",
          variant: "destructive",
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  };

  const handleCopy = async () => {
    const text = `${item.title}\n\n${item.content}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ title: "לא ניתן להעתיק", variant: "destructive" });
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;
    if (typeof window !== "undefined" && !window.confirm("למחוק את הפריט הזה?")) {
      return;
    }
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

  const handleShare = async () => {
    const text = `${item.title}\n\n${item.content}`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: item.title, text });
        return;
      } catch {
        /* user cancelled or unsupported */
      }
    }
    handleCopy();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }}
      className={cn("h-full", className)}
    >
      <Card className="group relative h-full overflow-hidden bg-card-gradient transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5">
        {/* Decorative accent */}
        <div className="pointer-events-none absolute inset-x-0 -top-12 h-24 bg-gradient-to-b from-primary/15 to-transparent blur-2xl" />

        <CardHeader className="relative space-y-3 pb-3">
          <div className="flex items-start justify-between gap-3">
            <Badge variant="default" className="text-[11px]">
              {item.category}
            </Badge>
            {onToggleFavorite && (
              <button
                type="button"
                onClick={handleFavorite}
                disabled={isPending}
                aria-label="הוסף למועדפים"
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground disabled:opacity-50"
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-all",
                    item.isFavorite && "fill-rose-500 text-rose-500",
                  )}
                />
              </button>
            )}
          </div>
          <CardTitle className="text-balance text-lg leading-snug">
            {item.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="relative space-y-4">
          <p className="text-balance text-sm leading-relaxed text-muted-foreground">
            {item.content}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <Button
              size="sm"
              variant={item.saved ? "secondary" : "default"}
              onClick={handleSaveClick}
              disabled={isPending}
              className="rounded-lg"
            >
              {item.saved ? (
                <>
                  <BookmarkCheck className="h-4 w-4" />
                  שמור
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4" />
                  שמור
                </>
              )}
            </Button>

            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCopy}
                aria-label="העתק"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleShare}
                aria-label="שתף"
              >
                <Share2 className="h-4 w-4" />
              </Button>

              {(onEdit || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" aria-label="עוד">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(item)}>
                        <Pencil className="me-2 h-4 w-4" />
                        ערוך
                      </DropdownMenuItem>
                    )}
                    {onEdit && onDelete && <DropdownMenuSeparator />}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="me-2 h-4 w-4" />
                        מחק לצמיתות
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function MotivationCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="space-y-3 pb-3">
        <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-3/4 animate-pulse rounded-md bg-muted" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex justify-between">
          <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />
          <div className="h-9 w-16 animate-pulse rounded-lg bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
