import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-hero-gradient p-6 text-center">
      <h1 className="font-display text-6xl font-extrabold gradient-text">404</h1>
      <p className="max-w-md text-balance text-muted-foreground">
        העמוד שחיפשת לא קיים – אבל המסע שלך עדיין לא נגמר.
      </p>
      <Button asChild variant="gradient" size="lg">
        <Link href="/dashboard">חזרה לדף הראשי</Link>
      </Button>
    </div>
  );
}
