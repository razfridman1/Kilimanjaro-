"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-hero-gradient p-6 text-center">
      <h1 className="font-display text-3xl font-extrabold">משהו השתבש</h1>
      <p className="max-w-md text-balance text-muted-foreground">
        מצטערים, הייתה שגיאה לא צפויה. אפשר לנסות שוב.
      </p>
      <Button onClick={reset} variant="gradient" size="lg">
        נסה שוב
      </Button>
    </div>
  );
}
