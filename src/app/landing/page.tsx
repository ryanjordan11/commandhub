import Link from "next/link";

export default function LandingPage() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--app-bg)", color: "var(--app-text)" }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-16">
        <div className="rounded-[40px] border border-black/10 bg-white p-10 shadow-[0_40px_80px_rgba(0,0,0,0.08)]">
          <p className="text-[11px] uppercase tracking-[0.3em] text-black/40">
            Command Hub
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-black sm:text-5xl">
            Welcome to your command center.
            <br />
            One hub for AI, research, and execution.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-black/60">
            Start by organizing your sidebar, opening split view, and saving
            notes. Everything lives in one clean workspace so you can move fast
            without losing context.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full bg-black px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-white"
            >
              Enter Command Hub
            </Link>
            <Link
              href="/settings"
              className="rounded-full border border-black/15 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-black/70"
            >
              Customize Workspace
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Split view",
              copy: "Keep your AI assistant on the right and your workspace on the left.",
            },
            {
              title: "Library",
              copy: "Save notes, images, and videos in organized folders.",
            },
            {
              title: "Calendar",
              copy: "Plan the week and set reminders without leaving the app.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_40px_rgba(0,0,0,0.06)]"
            >
              <div className="text-[11px] uppercase tracking-[0.3em] text-black/40">
                {item.title}
              </div>
              <p className="mt-3 text-sm text-black/60">{item.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
