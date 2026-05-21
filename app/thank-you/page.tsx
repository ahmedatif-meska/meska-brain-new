import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Thanks — Meska Community",
  description: "Your information has been saved.",
};

export default function ThankYou() {
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
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 py-12 text-center sm:px-6 sm:py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-3xl">
        You&apos;re in. Thank you!
      </h1>
      <p className="max-w-md text-sm text-[var(--color-brand-muted)] sm:text-base">
        Your information was saved. The Meska team will reach out with
        community updates, AI content, and invitations that match what you
        shared with us.
      </p>
      <Link
        href="/"
        className="rounded-[var(--radius-brand)] bg-[var(--color-brand-field-bg)] px-5 py-2 text-sm font-medium text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-field-bg-hover)]"
      >
        Back to the form
      </Link>
      </main>
    </>
  );
}
