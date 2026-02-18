"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { defaultSites, mergeDefaults, storageKey, type Site } from "@/lib/sites";
import { getUserId } from "@/lib/user";
import { convexEnabled, skipQuery } from "@/lib/convex";
import { api } from "convex/_generated/api";

const getFavicon = (url: string) => {
  try {
    const host = new URL(url).hostname;
    return `https://icons.duckduckgo.com/ip3/${host}.ico`;
  } catch {
    return "";
  }
};

function Favicon({ name, url }: { name: string; url: string }) {
  const [failed, setFailed] = useState(false);
  const icon = getFavicon(url);
  if (!icon || failed) {
    return (
      <span className="text-[10px] font-semibold">
        {name.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return (
    <Image
      src={icon}
      alt=""
      width={16}
      height={16}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}

export default function Home() {
  const [sites, setSites] = useState<Site[]>(defaultSites);
  const [activeId, setActiveId] = useState(defaultSites[0]?.id ?? "");
  const [secondaryId, setSecondaryId] = useState("browser");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [splitRatio, setSplitRatio] = useState(0.6);
  const [muted, setMuted] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [userId, setUserId] = useState("");
  const draggingRef = useRef(false);

  const convexLinks = useQuery(
    api.links.list,
    convexEnabled && userId ? { userId } : skipQuery,
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    setUserId(getUserId());
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Site[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = mergeDefaults(parsed);
          setSites(merged);
          if (!merged.some((site) => site.id === activeId)) {
            setActiveId(merged[0].id);
          }
          if (!merged.some((site) => site.id === secondaryId)) {
            setSecondaryId(merged[0].id);
          }
        }
      } catch {
        // Ignore invalid storage
      }
    } else {
      window.localStorage.setItem(storageKey, JSON.stringify(defaultSites));
    }
  }, [isClient, activeId, secondaryId]);

  useEffect(() => {
    if (convexLinks && convexLinks.length > 0) {
      const merged = mergeDefaults(
        convexLinks.map((link) => ({
          id: link._id,
          name: link.name,
          url: link.url,
          pinned: link.pinned,
          order: link.order,
        })),
      );
      merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setSites(merged);
    }
  }, [convexLinks]);

  useEffect(() => {
    if (!isClient) return;
    window.localStorage.setItem(storageKey, JSON.stringify(sites));
  }, [isClient, sites]);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (!draggingRef.current) return;
      const container = document.getElementById("split-container");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const ratio = (event.clientX - rect.left) / rect.width;
      const clamped = Math.min(0.7, Math.max(0.3, ratio));
      setSplitRatio(clamped);
    };
    const stopDrag = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", stopDrag);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", stopDrag);
    };
  }, []);

  const displaySites = useMemo(() => {
    const pinned: Site[] = [];
    const unpinned: Site[] = [];
    for (const site of sites) {
      if (site.pinned) {
        pinned.push(site);
      } else {
        unpinned.push(site);
      }
    }
    return [...pinned, ...unpinned];
  }, [sites]);

  const activeIndex = displaySites.findIndex((site) => site.id === activeId);
  const active = displaySites[activeIndex] ?? displaySites[0];
  const secondary = displaySites.find((site) => site.id === secondaryId);
  const isElectron = isClient && window.electronAPI?.isElectron;

  useEffect(() => {
    if (!active && displaySites[0]) {
      setActiveId(displaySites[0].id);
    }
  }, [active, displaySites]);

  useEffect(() => {
    if (!isClient || !isElectron) return;
    const webviews = Array.from(document.querySelectorAll("webview"));
    webviews.forEach((view) => {
      try {
        (view as unknown as { setAudioMuted?: (value: boolean) => void })
          .setAudioMuted?.(muted);
      } catch {
        // ignore
      }
    });
  }, [isClient, isElectron, muted, activeId, secondaryId, splitView]);

  const goNext = () => {
    if (displaySites.length === 0) return;
    const nextIndex = (activeIndex + 1) % displaySites.length;
    setActiveId(displaySites[nextIndex].id);
  };

  const goPrev = () => {
    if (displaySites.length === 0) return;
    const nextIndex =
      (activeIndex - 1 + displaySites.length) % displaySites.length;
    setActiveId(displaySites[nextIndex].id);
  };

  const renderStack = (currentId: string) => {
    if (!isClient) {
      return <div className="h-full w-full bg-black" />;
    }

    if (isElectron) {
      return sites.map((site) => (
        <webview
          key={site.id}
          src={site.url}
          allowpopups={true}
          partition="persist:commandhub"
          className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
            currentId === site.id
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        />
      ));
    }

    return sites.map((site) => (
      <iframe
        key={site.id}
        src={site.url}
        className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
          currentId === site.id
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        referrerPolicy="no-referrer"
        sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
      />
    ));
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="flex h-screen">
        <aside
          className={`flex flex-col border-r border-black/10 bg-white transition-all duration-300 ${
            sidebarCollapsed ? "w-20" : "w-64"
          }`}
        >
          <div className={`px-5 pt-5 ${sidebarCollapsed ? "px-3" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-black/40">
                  {sidebarCollapsed ? "WS" : "Workspaces"}
                </div>
                <h1 className="mt-2 text-xl font-semibold text-black">
                  {sidebarCollapsed ? "CH" : "Command Hub"}
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setSidebarCollapsed((value) => !value)}
                className="rounded-full border border-black/15 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-black/70 transition hover:border-black/40 hover:text-black"
                aria-label="Toggle sidebar"
              >
                {sidebarCollapsed ? ">>" : "<<"}
              </button>
            </div>
            {!sidebarCollapsed ? (
              <p className="mt-2 text-xs text-black/50">
                Enterprise clean workspace with neon highlights.
              </p>
            ) : null}
          </div>
          <div className="mt-4 flex-1 space-y-1 px-3 overflow-y-auto">
            {displaySites.map((site, index) => {
              const isActive = site.id === active?.id;
              return (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => setActiveId(site.id)}
                  className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-black text-white shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
                      : "text-black/70 hover:bg-black/5"
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-white shadow-[0_4px_10px_rgba(0,0,0,0.06)]">
                    <Favicon name={site.name} url={site.url} />
                  </span>
                  <span className="flex-1 font-medium">
                    {sidebarCollapsed
                      ? site.name.slice(0, 2).toUpperCase()
                      : site.name}
                  </span>
                  {!sidebarCollapsed ? (
                    <span className="text-[9px] uppercase tracking-[0.2em] text-black/40">
                      {site.pinned ? "PIN" : `#${index + 1}`}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div
            className={`border-t border-black/10 px-5 py-4 text-xs text-black/60 ${
              sidebarCollapsed ? "px-3" : ""
            }`}
          >
            <div className="flex flex-col gap-2">
              <Link
                href="/library"
                className="block w-full rounded-full border border-black/15 px-3 py-2 text-left text-[10px] uppercase tracking-[0.3em] text-black/70 transition hover:border-black/40 hover:text-black"
              >
                Library
              </Link>
              <Link
                href="/calendar"
                className="block w-full rounded-full border border-black/15 px-3 py-2 text-left text-[10px] uppercase tracking-[0.3em] text-black/70 transition hover:border-black/40 hover:text-black"
              >
                Calendar
              </Link>
              <Link
                href="/account"
                className="block w-full rounded-full border border-black/15 px-3 py-2 text-left text-[10px] uppercase tracking-[0.3em] text-black/70 transition hover:border-black/40 hover:text-black"
              >
                Account
              </Link>
              <Link
                href="/support"
                className="block w-full rounded-full border border-black/15 px-3 py-2 text-left text-[10px] uppercase tracking-[0.3em] text-black/70 transition hover:border-black/40 hover:text-black"
              >
                Support
              </Link>
              <Link
                href="/settings"
                className="block w-full rounded-full border border-black/15 px-3 py-2 text-left text-[10px] uppercase tracking-[0.3em] text-black/70 transition hover:border-black/40 hover:text-black"
              >
                Settings
              </Link>
              <Link
                href="/admin"
                className="block w-full rounded-full border border-black/15 px-3 py-2 text-left text-[10px] uppercase tracking-[0.3em] text-black/70 transition hover:border-black/40 hover:text-black"
              >
                Admin
              </Link>
            </div>
          </div>
        </aside>

        <main className="flex flex-1 flex-col bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 px-6 py-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-black/40">
                Active
              </div>
              <div className="text-lg font-semibold text-black">
                {active?.name ?? ""}
              </div>
              <div className="text-xs text-black/40">{active?.url ?? ""}</div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={goPrev}
                className="rounded-full border border-black/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-black/70 transition hover:border-black/40 hover:text-black"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={goNext}
                className="rounded-full bg-black px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-black/90"
              >
                Next
              </button>
              {isElectron ? (
                <button
                  type="button"
                  onClick={() => setMuted((value) => !value)}
                  className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] transition ${
                    muted
                      ? "border-black/15 text-black/70 hover:border-black/40 hover:text-black"
                      : "border-black bg-black text-white"
                  }`}
                >
                  {muted ? "Muted" : "Sound On"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setSplitView((value) => !value)}
                className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] transition ${
                  splitView
                    ? "border-black bg-black text-white"
                    : "border-black/15 text-black/70 hover:border-black/40 hover:text-black"
                }`}
              >
                {splitView ? "Split On" : "Split"}
              </button>
              {splitView ? (
                <div className="flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-3 py-2 text-[10px] uppercase tracking-[0.3em] text-black/60">
                  Right Pane
                  <select
                    value={secondaryId}
                    onChange={(event) => setSecondaryId(event.target.value)}
                    className="bg-transparent text-[10px] uppercase tracking-[0.3em] text-black/70 outline-none"
                  >
                    {displaySites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex-1 p-6">
            <div id="split-container" className="flex h-full items-stretch">
              <div
                className="relative h-full overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_30px_60px_rgba(0,0,0,0.08)] transition-all duration-300"
                style={{ flexBasis: splitView ? `${splitRatio * 100}%` : "100%" }}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#00f5ff22,transparent_55%)]" />
                {renderStack(active?.id ?? "")}
              </div>
              {splitView ? (
                <div
                  className="group relative flex h-full w-6 items-center justify-center cursor-col-resize"
                  onMouseDown={() => {
                    draggingRef.current = true;
                  }}
                >
                  <div className="h-full w-1 rounded-full bg-black/10 transition group-hover:bg-black/30" />
                  <div className="absolute h-10 w-10 rounded-full border border-black/15 bg-white shadow-[0_10px_20px_rgba(0,0,0,0.08)]" />
                </div>
              ) : null}
              {splitView ? (
                <div
                  className="relative h-full overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_30px_60px_rgba(0,0,0,0.08)] transition-all duration-300"
                  style={{ flexBasis: `${(1 - splitRatio) * 100}%` }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#7cff6b22,transparent_60%)]" />
                  <div className="absolute right-3 top-3 z-10">
                    <button
                      type="button"
                      onClick={() => setSplitView(false)}
                      className="rounded-full border border-black/15 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-black/70 transition hover:border-black/40 hover:text-black"
                    >
                      Collapse
                    </button>
                  </div>
                  {renderStack(secondary?.id ?? "")}
                </div>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
