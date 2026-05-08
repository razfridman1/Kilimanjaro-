import { AppNav } from "@/components/app-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[100dvh] bg-background">
      <AppNav />
      <main className="container pb-24 pt-6 md:pb-12 md:pt-8">{children}</main>
    </div>
  );
}
