"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery, skip } from "convex/react";
import { api } from "../../convex/_generated/api";
import { convexEnabled } from "@/lib/convex";

export default function AdminPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const profiles = useQuery(
    api.profiles.list,
    convexEnabled && ready ? {} : skip,
  );

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-black/40">
              Admin
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-black">Users</h1>
            <p className="mt-2 text-sm text-black/50">
              Profiles stored in Convex.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-black/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-black/70 transition hover:border-black/40 hover:text-black"
          >
            Back
          </Link>
        </div>

        {!convexEnabled ? (
          <div className="mt-6 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Convex is not configured.
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          {(profiles || []).map((profile) => (
            <div
              key={profile._id}
              className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_10px_20px_rgba(0,0,0,0.04)]"
            >
              <div className="text-sm font-semibold text-black">
                {profile.name}
              </div>
              <div className="text-xs text-black/50">{profile.email}</div>
            </div>
          ))}
          {profiles && profiles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 p-6 text-sm text-black/40">
              No profiles yet.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
