"use client";

import Link from "next/link";
import { useState } from "react";

export default function SupportPage() {
  const [topic, setTopic] = useState("General");
  const [message, setMessage] = useState("");

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--app-bg)", color: "var(--app-text)" }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-black/40">
              Support
            </div>
            <h1 className="mt-2 text-3xl font-semibold">Help Center</h1>
            <p className="mt-2 text-sm text-black/50">
              Tell us what you need and we will follow up.
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

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section
            className="rounded-3xl border p-6 shadow-[0_20px_40px_rgba(0,0,0,0.06)]"
            style={{ borderColor: "var(--app-border)" }}
          >
            <div className="text-[11px] uppercase tracking-[0.3em] text-black/40">
              Contact Support
            </div>
            <div className="mt-4 space-y-3">
              <label className="text-xs uppercase tracking-[0.2em] text-black/50">
                Topic
                <select
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  className="mt-2 w-full rounded-2xl border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--app-border)" }}
                >
                  <option>General</option>
                  <option>Billing</option>
                  <option>Bug</option>
                  <option>Feature Request</option>
                </select>
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-black/50">
                Message
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  className="mt-2 w-full rounded-2xl border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--app-border)" }}
                />
              </label>
              <button
                type="button"
                className="rounded-2xl px-4 py-2 text-sm font-semibold"
                style={{
                  backgroundColor: "var(--app-button-bg)",
                  color: "var(--app-button-text)",
                }}
                onClick={() => {
                  setMessage("");
                }}
              >
                Send
              </button>
            </div>
          </section>

          <section
            className="rounded-3xl border p-6 shadow-[0_20px_40px_rgba(0,0,0,0.06)]"
            style={{ borderColor: "var(--app-border)" }}
          >
            <div className="text-[11px] uppercase tracking-[0.3em] text-black/40">
              FAQ
            </div>
            <div className="mt-4 space-y-4 text-sm text-black/60">
              <div>
                <div className="font-semibold text-black">How do I add links?</div>
                <p className="mt-1">
                  Go to Settings and add a label + URL. You can drag to reorder.
                </p>
              </div>
              <div>
                <div className="font-semibold text-black">
                  How do I change the theme?
                </div>
                <p className="mt-1">
                  Settings includes a Theme section with background and button
                  colors.
                </p>
              </div>
              <div>
                <div className="font-semibold text-black">
                  Where is my data stored?
                </div>
                <p className="mt-1">
                  Notes, media, and settings are stored locally on this device.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
