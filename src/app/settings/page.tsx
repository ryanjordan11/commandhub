"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, skip } from "convex/react";
import {
  defaultSites,
  mergeDefaults,
  normalizeUrl,
  storageKey,
  type Site,
} from "@/lib/sites";
import { getUserId } from "@/lib/user";
import { convexEnabled } from "@/lib/convex";
import { api } from "../../convex/_generated/api";

const themeKey = "commandhub.theme";

type Theme = {
  background: string;
  text: string;
  buttonBg: string;
  buttonText: string;
  border: string;
  accent: string;
};

const defaultTheme: Theme = {
  background: "#ffffff",
  text: "#0b0b0b",
  buttonBg: "#0b0b0b",
  buttonText: "#ffffff",
  border: "#1f2937",
  accent: "#00f5ff",
};

function SettingsContent() {
  const [sites, setSites] = useState<Site[]>(defaultSites);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [userId, setUserId] = useState("");

  const convexLinks = useQuery(
    api.links.list,
    convexEnabled && userId ? { userId } : skip,
  );
  const upsertLink = useMutation(api.links.upsert);
  const removeLink = useMutation(api.links.removeByUrl);

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
          setSites(mergeDefaults(parsed));
        }
      } catch {
        // Ignore invalid storage
      }
    } else {
      window.localStorage.setItem(storageKey, JSON.stringify(defaultSites));
    }

    const storedTheme = window.localStorage.getItem(themeKey);
    if (storedTheme) {
      try {
        const parsed = JSON.parse(storedTheme) as Partial<Theme>;
        setTheme({ ...defaultTheme, ...parsed });
      } catch {
        // ignore
      }
    }
  }, [isClient]);

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
    if (!isClient) return;
    window.localStorage.setItem(themeKey, JSON.stringify(theme));
    window.dispatchEvent(new CustomEvent("commandhub-theme"));
  }, [isClient, theme]);

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

  const syncLink = (site: Site, order: number) => {
    if (!convexEnabled || !userId) return;
    void upsertLink({
      userId,
      name: site.name,
      url: site.url,
      pinned: !!site.pinned,
      order,
    });
  };

  const handleAddSite = () => {
    const label = newLabel.trim();
    const url = normalizeUrl(newUrl);
    if (!label || !url) return;
    const idBase = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const id = `${idBase}-${Date.now()}`;
    const newSite = { id, name: label, url };
    setSites((current) => [...current, newSite]);
    syncLink(newSite, sites.length);
    setNewLabel("");
    setNewUrl("");
  };

  const updateSite = (id: string, updater: (site: Site) => Site) => {
    setSites((current) => {
      const next = current.map((site, index) => {
        if (site.id !== id) return site;
        const updated = updater(site);
        syncLink(updated, index);
        return updated;
      });
      return next;
    });
  };

  const removeSite = (id: string) => {
    setSites((current) => {
      const target = current.find((site) => site.id === id);
      if (target && convexEnabled && userId) {
        void removeLink({ userId, url: target.url });
      }
      return current.filter((site) => site.id !== id);
    });
  };

  const moveSite = (id: string, direction: "up" | "down") => {
    setSites((current) => {
      const index = current.findIndex((site) => site.id === id);
      if (index < 0) return current;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      next.forEach((site, order) => syncLink(site, order));
      return next;
    });
  };

  const onDragStart = (id: string) => {
    setDragId(id);
  };

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setSites((current) => {
      const fromIndex = current.findIndex((site) => site.id === dragId);
      const toIndex = current.findIndex((site) => site.id === targetId);
      if (fromIndex < 0 || toIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      next.forEach((site, order) => syncLink(site, order));
      return next;
    });
    setDragId(null);
  };

  const resetToDefaults = () => {
    setSites(defaultSites);
    defaultSites.forEach((site, order) => syncLink(site, order));
  };

  const addNewDefaults = () => {
    setSites((current) => {
      const merged = mergeDefaults(current);
      merged.forEach((site, order) => syncLink(site, order));
      return merged;
    });
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--app-bg)", color: "var(--app-text)" }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-black/40">
              Settings
            </div>
            <h1 className="mt-2 text-3xl font-semibold">
              Command Hub Links
            </h1>
            <p className="mt-2 text-sm text-black/50">
              Add, pin, and reorder the sites shown in your sidebar.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em]"
            style={{ borderColor: "var(--app-border)" }}
          >
            Back
          </Link>
        </div>

        {!convexEnabled ? (
          <div className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Convex is not configured. Using local storage only.
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addNewDefaults}
            className="rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em]"
            style={{ borderColor: "var(--app-border)" }}
          >
            Add New Defaults
          </button>
          <button
            type="button"
            onClick={resetToDefaults}
            className="rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-red-600"
            style={{ borderColor: "#ef4444" }}
          >
            Reset to Defaults
          </button>
        </div>

        <div className="mt-8 rounded-3xl border p-6 shadow-[0_20px_40px_rgba(0,0,0,0.06)]" style={{ borderColor: "var(--app-border)" }}>
          <div className="grid gap-3 md:grid-cols-[1fr_1.5fr_auto]">
            <input
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
              placeholder="Label"
              className="rounded-2xl border px-3 py-2 text-sm"
              style={{ borderColor: "var(--app-border)" }}
            />
            <input
              value={newUrl}
              onChange={(event) => setNewUrl(event.target.value)}
              placeholder="URL (https://...)"
              className="rounded-2xl border px-3 py-2 text-sm"
              style={{ borderColor: "var(--app-border)" }}
            />
            <button
              type="button"
              onClick={handleAddSite}
              className="rounded-2xl px-4 py-2 text-sm font-semibold"
              style={{
                backgroundColor: "var(--app-button-bg)",
                color: "var(--app-button-text)",
              }}
            >
              Add
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border p-6" style={{ borderColor: "var(--app-border)" }}>
          <div className="text-[11px] uppercase tracking-[0.3em] text-black/40">
            Theme
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="text-xs uppercase tracking-[0.2em] text-black/50">
              Background
              <input
                type="color"
                value={theme.background}
                onChange={(event) =>
                  setTheme((current) => ({
                    ...current,
                    background: event.target.value,
                  }))
                }
                className="mt-2 h-10 w-full rounded-xl border"
                style={{ borderColor: "var(--app-border)" }}
              />
            </label>
            <label className="text-xs uppercase tracking-[0.2em] text-black/50">
              Text
              <input
                type="color"
                value={theme.text}
                onChange={(event) =>
                  setTheme((current) => ({
                    ...current,
                    text: event.target.value,
                  }))
                }
                className="mt-2 h-10 w-full rounded-xl border"
                style={{ borderColor: "var(--app-border)" }}
              />
            </label>
            <label className="text-xs uppercase tracking-[0.2em] text-black/50">
              Button
              <input
                type="color"
                value={theme.buttonBg}
                onChange={(event) =>
                  setTheme((current) => ({
                    ...current,
                    buttonBg: event.target.value,
                  }))
                }
                className="mt-2 h-10 w-full rounded-xl border"
                style={{ borderColor: "var(--app-border)" }}
              />
            </label>
            <label className="text-xs uppercase tracking-[0.2em] text-black/50">
              Button Text
              <input
                type="color"
                value={theme.buttonText}
                onChange={(event) =>
                  setTheme((current) => ({
                    ...current,
                    buttonText: event.target.value,
                  }))
                }
                className="mt-2 h-10 w-full rounded-xl border"
                style={{ borderColor: "var(--app-border)" }}
              />
            </label>
            <label className="text-xs uppercase tracking-[0.2em] text-black/50">
              Border
              <input
                type="color"
                value={theme.border}
                onChange={(event) =>
                  setTheme((current) => ({
                    ...current,
                    border: event.target.value,
                  }))
                }
                className="mt-2 h-10 w-full rounded-xl border"
                style={{ borderColor: "var(--app-border)" }}
              />
            </label>
            <label className="text-xs uppercase tracking-[0.2em] text-black/50">
              Accent
              <input
                type="color"
                value={theme.accent}
                onChange={(event) =>
                  setTheme((current) => ({
                    ...current,
                    accent: event.target.value,
                  }))
                }
                className="mt-2 h-10 w-full rounded-xl border"
                style={{ borderColor: "var(--app-border)" }}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={resetTheme}
            className="mt-4 rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em]"
            style={{ borderColor: "var(--app-border)" }}
          >
            Reset Theme
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {displaySites.map((site) => (
            <div
              key={site.id}
              draggable
              onDragStart={() => onDragStart(site.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onDrop(site.id)}
              className="flex flex-wrap items-center gap-3 rounded-3xl border px-4 py-3 text-sm shadow-[0_12px_20px_rgba(0,0,0,0.04)]"
              style={{ borderColor: "var(--app-border)" }}
            >
              <div className="flex-1 min-w-[220px]">
                <input
                  value={site.name}
                  onChange={(event) =>
                    updateSite(site.id, (current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="w-full border-b border-transparent text-sm font-semibold focus:border-black/20 focus:outline-none"
                />
                <input
                  value={site.url}
                  onChange={(event) =>
                    updateSite(site.id, (current) => ({
                      ...current,
                      url: event.target.value,
                    }))
                  }
                  className="mt-2 w-full text-xs text-black/60 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSite(site.id, (current) => ({
                    ...current,
                    pinned: !current.pinned,
                  }))
                }
                className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
                style={{ borderColor: "var(--app-border)" }}
              >
                {site.pinned ? "Unpin" : "Pin"}
              </button>
              <button
                type="button"
                onClick={() => moveSite(site.id, "up")}
                className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
                style={{ borderColor: "var(--app-border)" }}
              >
                Up
              </button>
              <button
                type="button"
                onClick={() => moveSite(site.id, "down")}
                className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
                style={{ borderColor: "var(--app-border)" }}
              >
                Down
              </button>
              <button
                type="button"
                onClick={() => removeSite(site.id)}
                className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-red-600"
                style={{ borderColor: "#ef4444" }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return <SettingsContent />;
}
