import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-[4px] bg-primary" />
          <span className="text-base font-semibold tracking-tight">Intervuo</span>
        </Link>

        <div className="max-w-sm">
          <p className="eyebrow text-primary">Practice that fits you</p>
          <h2 className="mt-4 text-3xl font-semibold leading-snug tracking-tight">
            Interview questions built from your own resume.
          </h2>
          <ul className="mt-8 space-y-3 text-sm text-white/70">
            <li>Answer out loud, the way a real interview works.</li>
            <li>Get scored on substance and delivery.</li>
            <li>Watch your scores move across sessions.</li>
          </ul>
        </div>

        <p className="text-xs text-white/40">Focused, honest interview prep.</p>
      </aside>

      <main className="flex items-center justify-center bg-paper bg-dots px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
