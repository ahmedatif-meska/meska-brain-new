import Image from "next/image";
import { SubmissionForm } from "@/components/submission-form";

export const metadata = {
  title: "Join the Meska Community",
  description: "Tell us a bit about how you use AI so we can send you content that matches.",
};

export default function Home() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-2xl justify-center px-4 pt-6 sm:px-6">
        <Image
          src="/brand/meska-logo-white.png"
          alt="Meska"
          width={120}
          height={34}
          priority
          className="h-auto w-[120px]"
        />
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 pb-10 pt-6 sm:gap-8 sm:px-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-3xl">
            Join the Meska community
          </h1>
          <p className="text-sm text-[var(--color-brand-muted)] sm:whitespace-nowrap sm:text-base">
            Share a few details so we can tailor the AI content, tools, and invites we send you.
          </p>
        </div>

        <SubmissionForm />
      </main>
    </>
  );
}
