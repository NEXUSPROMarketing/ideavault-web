import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { Skeleton } from "@/components/skeleton";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to IdeaVault for your For You feed and idea library.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="shell py-16">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <p className="eyebrow">Your account</p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
            Sign in to IdeaVault
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            No password — we email you a sign-in link. Your account unlocks the{" "}
            <span className="font-semibold text-ink">For You</span> feed and your idea library.
          </p>
        </div>
        <div className="card mt-7 p-6">
          <Suspense fallback={<Skeleton className="h-40 w-full" />}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-4 text-center text-xs text-ink-faint">
          Free while IdeaVault is in early access. No spam — just your feed.
        </p>
      </div>
    </div>
  );
}
