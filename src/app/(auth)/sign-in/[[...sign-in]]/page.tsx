import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-hero-gradient px-4 py-12">
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "rounded-2xl shadow-2xl border border-border/40",
          },
        }}
      />
    </div>
  );
}
