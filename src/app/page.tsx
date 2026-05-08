import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sparkles, ArrowLeft, ShieldCheck, Zap, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const FEATURES = [
  {
    icon: Sparkles,
    title: "10 רעיונות בלחיצה",
    desc: "כל יצירה מחזירה עשרה ציטוטים, עצות וטיפים מעשיים בעברית.",
  },
  {
    icon: BookmarkCheck,
    title: "שמירה וסיווג",
    desc: "שמור את הפריטים האהובים, הוסף קטגוריות אישיות, וחפש בקלות.",
  },
  {
    icon: Zap,
    title: "התאמה אישית",
    desc: "בחר נושא ומצב רוח – ה-AI יתאים את התוצאה במיוחד אליך.",
  },
  {
    icon: ShieldCheck,
    title: "פרטיות מלאה",
    desc: "הנתונים שלך מבודדים בארגון משלך, מאובטחים ומוצפנים.",
  },
] as const;

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-hero-gradient">
      <header className="container flex h-16 items-center justify-between">
        <div
          className="flex items-center gap-2 font-display text-xl font-extrabold"
          dir="ltr"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="gradient-text">kilimanjaro</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link href="/sign-in">התחברות</Link>
          </Button>
          <Button asChild variant="gradient">
            <Link href="/sign-up">
              התחל עכשיו
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="container relative grid gap-10 pb-12 pt-10 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            מוטיבציה יומית. מותאמת אישית. בעברית.
          </div>
          <h1 className="text-balance font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            <span className="gradient-text">בנה משמעת.</span>
            <br />
            פתח מיינדסט.
            <br />
            תיהנה מהדרך.
          </h1>
          <p className="max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
            {APP_TAGLINE} ייצר ציטוטים, עצות וטיפים מעשיים בלחיצה אחת – ושמור את
            הפריטים שמדברים אליך.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="xl" variant="gradient">
              <Link href="/sign-up">
                התחל בחינם
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href="/sign-in">יש לי כבר חשבון</Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-bl from-primary/30 via-fuchsia-500/20 to-accent/30 blur-3xl" />
          <div className="rounded-3xl border border-border/40 bg-background/70 p-6 backdrop-blur-xl">
            <div className="grid gap-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-3 rounded-2xl border border-border/30 bg-card/60 p-4"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="container border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}. כל הזכויות שמורות.
      </footer>
    </div>
  );
}
