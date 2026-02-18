"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useMutation, useQuery, skip } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getUserId } from "@/lib/user";

type Profile = {
  name: string;
  email: string;
  avatarUrl: string;
};

const profileKey = "commandhub.profile";
const sessionKey = "commandhub.session";

export default function AccountPage() {
  const { isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();

  const [profile, setProfile] = useState<Profile>({
    name: "",
    email: "",
    avatarUrl: "",
  });
  const [signedIn, setSignedIn] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [userId, setUserId] = useState("");
  const [emailForMagic, setEmailForMagic] = useState("");

  const remoteProfile = useQuery(
    api.profiles.get,
    userId ? { userId } : skip,
  );
  const upsertProfile = useMutation(api.profiles.upsert);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    setUserId(getUserId());
  }, [isClient]);

  useEffect(() => {
    if (remoteProfile) {
      setProfile({
        name: remoteProfile.name,
        email: remoteProfile.email,
        avatarUrl: remoteProfile.avatarUrl ?? "",
      });
    }
  }, [remoteProfile]);

  useEffect(() => {
    if (!isClient) return;
    const storedProfile = window.localStorage.getItem(profileKey);
    const storedSession = window.localStorage.getItem(sessionKey);
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile) as Profile;
        if (parsed) setProfile(parsed);
      } catch {
        // ignore
      }
    }
    if (storedSession) {
      setSignedIn(storedSession === "true");
    }
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    window.localStorage.setItem(profileKey, JSON.stringify(profile));
  }, [isClient, profile]);

  useEffect(() => {
    if (!isClient) return;
    window.localStorage.setItem(sessionKey, String(signedIn));
  }, [isClient, signedIn]);

  const handleSignIn = () => {
    if (!profile.email.trim()) return;
    setSignedIn(true);
  };

  const handleSignOut = () => {
    setSignedIn(false);
    void signOut();
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((current) => ({
        ...current,
        avatarUrl: String(reader.result || ""),
      }));
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleSave = () => {
    if (!userId) return;
    void upsertProfile({
      userId,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatarUrl || undefined,
    });
  };

  const handleGoogle = () => {
    void signIn("google");
  };

  const handleMagicLink = () => {
    if (!emailForMagic.trim()) return;
    void signIn("resend", { email: emailForMagic.trim() });
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--app-bg)", color: "var(--app-text)" }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-black/40">
              Account
            </div>
            <h1 className="mt-2 text-3xl font-semibold">Profile & Sign In</h1>
            <p className="mt-2 text-sm text-black/50">
              Personalize Command Hub with your profile.
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

        <div className="mt-8 rounded-3xl border p-6 shadow-[0_20px_40px_rgba(0,0,0,0.06)]" style={{ borderColor: "var(--app-border)" }}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-full border border-black/10 bg-black/5">
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.name || "Profile"}
                  width={80}
                  height={80}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div>
              <div className="text-sm font-semibold">
                {profile.name || "Unnamed"}
              </div>
              <div className="text-xs text-black/40">
                {profile.email || "No email"}
              </div>
              <div className="mt-1 text-xs text-black/40">
                {isAuthenticated ? "Signed in via Convex" : "Not signed in"}
              </div>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {signedIn ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em]"
                  style={{ borderColor: "var(--app-border)" }}
                >
                  Sign Out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em]"
                  style={{
                    backgroundColor: "var(--app-button-bg)",
                    color: "var(--app-button-text)",
                  }}
                >
                  Sign In
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                className="rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em]"
                style={{
                  backgroundColor: "var(--app-button-bg)",
                  color: "var(--app-button-text)",
                }}
              >
                Save Profile
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <input
              value={profile.name}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Full name"
              className="rounded-2xl border px-3 py-2 text-sm"
              style={{ borderColor: "var(--app-border)" }}
            />
            <input
              value={profile.email}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="Email"
              type="email"
              className="rounded-2xl border px-3 py-2 text-sm"
              style={{ borderColor: "var(--app-border)" }}
            />
            <input
              value={profile.avatarUrl}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  avatarUrl: event.target.value,
                }))
              }
              placeholder="Avatar URL"
              className="md:col-span-2 rounded-2xl border px-3 py-2 text-sm"
              style={{ borderColor: "var(--app-border)" }}
            />
            <label
              className="md:col-span-2 rounded-2xl border px-4 py-3 text-xs uppercase tracking-[0.3em] text-black/60"
              style={{ borderColor: "var(--app-border)" }}
            >
              Upload Profile Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border p-6" style={{ borderColor: "var(--app-border)" }}>
          <div className="text-[11px] uppercase tracking-[0.3em] text-black/40">
            Sign In
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGoogle}
              className="rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em]"
              style={{ borderColor: "var(--app-border)" }}
            >
              Continue with Google
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={emailForMagic}
                onChange={(event) => setEmailForMagic(event.target.value)}
                placeholder="Email for magic link"
                className="rounded-2xl border px-3 py-2 text-sm"
                style={{ borderColor: "var(--app-border)" }}
              />
              <button
                type="button"
                onClick={handleMagicLink}
                className="rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em]"
                style={{
                  backgroundColor: "var(--app-button-bg)",
                  color: "var(--app-button-text)",
                }}
              >
                Send Magic Link
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-black/40">
          Profile is stored locally and synced to Convex when saved.
        </div>
      </div>
    </div>
  );
}
