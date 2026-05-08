import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-hero-gradient px-4 py-12">
      <SignUp
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
