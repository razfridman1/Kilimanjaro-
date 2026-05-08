import type { Metadata, Viewport } from "next";
import { Heebo, Rubik } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { heIL } from "@clerk/localizations";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  display: "swap",
  variable: "--font-heebo",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  display: "swap",
  variable: "--font-rubik",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} – מוטיבציה יומית בעברית`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "מוטיבציה",
    "פיתוח אישי",
    "ציטוטים",
    "AI",
    "בינה מלאכותית",
    "משמעת",
    "מיינדסט",
  ],
  authors: [{ name: APP_NAME }],
  manifest: "/manifest.webmanifest",
  // Use the modern, non-deprecated PWA meta tag.
  other: {
    "mobile-web-app-capable": "yes",
  },
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "he_IL",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider localization={heIL}>
      <html
        lang="he"
        dir="rtl"
        suppressHydrationWarning
        className={`${heebo.variable} ${rubik.variable}`}
      >
        <body className="min-h-[100dvh] font-sans">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
