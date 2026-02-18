"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { skipQuery } from "@/lib/convex";
import { getUserId } from "@/lib/user";

type Note = {
  id: string;
  title: string;
  body: string;
  folder: string;
  updatedAt: number;
};

type MediaItem = {
  id: string;
  name: string;
  type: "image" | "video";
  folder: string;
  dataUrl: string;
  createdAt: number;
};

const noteKey = "commandhub.notes";
const mediaKey = "commandhub.media";

const folders = ["General", "Ideas", "Clients", "Personal"];

export default function LibraryPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [activeFolder, setActiveFolder] = useState("General");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [userId, setUserId] = useState("");

  const remoteNotes = useQuery(
    api.notes.list,
    userId ? { userId } : skipQuery,
  );
  const addNoteMutation = useMutation(api.notes.add);
  const updateNoteMutation = useMutation(api.notes.update);
  const removeNoteMutation = useMutation(api.notes.remove);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    setUserId(getUserId());
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    const storedNotes = window.localStorage.getItem(noteKey);
    const storedMedia = window.localStorage.getItem(mediaKey);
    if (storedNotes) {
      try {
        const parsed = JSON.parse(storedNotes) as Note[];
        if (Array.isArray(parsed)) setNotes(parsed);
      } catch {
        // ignore
      }
    }
    if (storedMedia) {
      try {
        const parsed = JSON.parse(storedMedia) as MediaItem[];
        if (Array.isArray(parsed)) setMedia(parsed);
      } catch {
        // ignore
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (remoteNotes) {
      const mapped = remoteNotes.map((note) => ({
        id: note._id,
        title: note.title,
        body: note.body,
        folder: note.folder,
        updatedAt: note.updatedAt,
      }));
      setNotes(mapped);
    }
  }, [remoteNotes]);

  useEffect(() => {
    if (!isClient) return;
    window.localStorage.setItem(noteKey, JSON.stringify(notes));
  }, [isClient, notes]);

  useEffect(() => {
    if (!isClient) return;
    window.localStorage.setItem(mediaKey, JSON.stringify(media));
  }, [isClient, media]);

  const filteredNotes = useMemo(
    () => notes.filter((note) => note.folder === activeFolder),
    [notes, activeFolder],
  );

  const filteredImages = useMemo(
    () => media.filter((item) => item.folder === activeFolder && item.type === "image"),
    [media, activeFolder],
  );

  const filteredVideos = useMemo(
    () => media.filter((item) => item.folder === activeFolder && item.type === "video"),
    [media, activeFolder],
  );

  const addNote = () => {
    if (!newTitle.trim() && !newBody.trim()) return;
    const note: Note = {
      id: `note-${Date.now()}`,
      title: newTitle.trim() || "Untitled",
      body: newBody.trim(),
      folder: activeFolder,
      updatedAt: Date.now(),
    };
    setNotes((current) => [note, ...current]);
    if (userId) {
      void addNoteMutation({
        userId,
        title: note.title,
        body: note.body,
        folder: note.folder,
      });
    }
    setNewTitle("");
    setNewBody("");
  };

  const updateNote = (id: string, updater: (note: Note) => Note) => {
    setNotes((current) =>
      current.map((note) => {
        if (note.id !== id) return note;
        const updated = updater(note);
        if (userId && !id.startsWith("note-")) {
          void updateNoteMutation({
            id: id as never,
            title: updated.title,
            body: updated.body,
            folder: updated.folder,
          });
        }
        return updated;
      }),
    );
  };

  const removeNote = (id: string) => {
    setNotes((current) => current.filter((note) => note.id !== id));
    if (userId && !id.startsWith("note-")) {
      void removeNoteMutation({ id: id as never });
    }
  };

  const handleUpload = (type: "image" | "video") => async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const item: MediaItem = {
        id: `media-${Date.now()}`,
        name: file.name,
        type,
        folder: activeFolder,
        dataUrl,
        createdAt: Date.now(),
      };
      setMedia((current) => [item, ...current]);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removeMedia = (id: string) => {
    setMedia((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--app-bg)", color: "var(--app-text)" }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-black/40">
              Library
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-black">
              Notes + Media Vault
            </h1>
            <p className="mt-2 text-sm text-black/50">
              Save notes, images, and videos into clean folders.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-black/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-black/70 transition hover:border-black/40 hover:text-black"
          >
            Back
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {folders.map((folder) => (
            <button
              key={folder}
              type="button"
              onClick={() => setActiveFolder(folder)}
              className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] transition ${
                activeFolder === folder
                  ? "border-black bg-black text-white"
                  : "border-black/15 text-black/70 hover:border-black/40 hover:text-black"
              }`}
            >
              {folder}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_40px_rgba(0,0,0,0.06)]">
            <div className="text-[11px] uppercase tracking-[0.3em] text-black/40">
              Notes
            </div>
            <div className="mt-4 space-y-3">
              <input
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Title"
                className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-black placeholder:text-black/30 focus:border-black/40 focus:outline-none"
              />
              <textarea
                value={newBody}
                onChange={(event) => setNewBody(event.target.value)}
                placeholder="Write a note..."
                rows={4}
                className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-black placeholder:text-black/30 focus:border-black/40 focus:outline-none"
              />
              <button
                type="button"
                onClick={addNote}
                className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90"
              >
                Save Note
              </button>
            </div>
            <div className="mt-6 space-y-3">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_10px_20px_rgba(0,0,0,0.04)]"
                >
                  <input
                    value={note.title}
                    onChange={(event) =>
                      updateNote(note.id, (current) => ({
                        ...current,
                        title: event.target.value,
                        updatedAt: Date.now(),
                      }))
                    }
                    className="w-full border-b border-black/10 pb-2 text-sm font-semibold text-black focus:border-black/30 focus:outline-none"
                  />
                  <textarea
                    value={note.body}
                    onChange={(event) =>
                      updateNote(note.id, (current) => ({
                        ...current,
                        body: event.target.value,
                        updatedAt: Date.now(),
                      }))
                    }
                    rows={4}
                    className="mt-3 w-full text-sm text-black/70 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeNote(note.id)}
                    className="mt-2 rounded-full border border-red-500/40 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-red-600 transition hover:border-red-500/70"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {filteredNotes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/10 p-6 text-sm text-black/40">
                  No notes in this folder yet.
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_40px_rgba(0,0,0,0.06)]">
              <div className="text-[11px] uppercase tracking-[0.3em] text-black/40">
                Images
              </div>
              <div className="mt-4 flex items-center gap-3">
                <label className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90">
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload("image")}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {filteredImages.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-black/10 bg-white p-3 shadow-[0_10px_20px_rgba(0,0,0,0.04)]"
                  >
                    <Image
                      src={item.dataUrl}
                      alt={item.name}
                      width={400}
                      height={200}
                      unoptimized
                      className="h-32 w-full rounded-xl object-cover"
                    />
                    <div className="mt-2 text-xs text-black/60">
                      {item.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedia(item.id)}
                      className="mt-2 rounded-full border border-red-500/40 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-red-600 transition hover:border-red-500/70"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {filteredImages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-black/10 p-6 text-sm text-black/40">
                    No images in this folder yet.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_40px_rgba(0,0,0,0.06)]">
              <div className="text-[11px] uppercase tracking-[0.3em] text-black/40">
                Videos
              </div>
              <div className="mt-4 flex items-center gap-3">
                <label className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90">
                  Upload Video
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleUpload("video")}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="mt-4 space-y-4">
                {filteredVideos.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-black/10 bg-white p-3 shadow-[0_10px_20px_rgba(0,0,0,0.04)]"
                  >
                    <video
                      src={item.dataUrl}
                      controls
                      className="h-40 w-full rounded-xl object-cover"
                    />
                    <div className="mt-2 text-xs text-black/60">
                      {item.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedia(item.id)}
                      className="mt-2 rounded-full border border-red-500/40 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-red-600 transition hover:border-red-500/70"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {filteredVideos.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-black/10 p-6 text-sm text-black/40">
                    No videos in this folder yet.
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
