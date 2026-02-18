"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { skipQuery } from "@/lib/convex";
import { getUserId } from "@/lib/user";

type EventItem = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  reminderAt?: string; // ISO
  notes?: string;
};

const storageKey = "commandhub.calendar";

const toDateKey = (value: Date) => value.toISOString().slice(0, 10);

const startOfWeek = (date: Date) => {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = (day + 6) % 7; // Monday start
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const addDays = (date: Date, amount: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
};

export default function CalendarPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [view, setView] = useState<"weekly" | "daily">("weekly");
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [reminder, setReminder] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [userId, setUserId] = useState("");

  const remoteEvents = useQuery(
    api.events.list,
    userId ? { userId } : skipQuery,
  );
  const addEventMutation = useMutation(api.events.add);
  const removeEventMutation = useMutation(api.events.remove);

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
        const parsed = JSON.parse(stored) as EventItem[];
        if (Array.isArray(parsed)) setEvents(parsed);
      } catch {
        // ignore
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (remoteEvents) {
      const mapped = remoteEvents.map((event) => ({
        id: event._id,
        title: event.title,
        date: event.date,
        time: event.time,
        reminderAt: event.reminderAt,
        notes: event.notes,
      }));
      setEvents(mapped);
    }
  }, [remoteEvents]);

  useEffect(() => {
    if (!isClient) return;
    window.localStorage.setItem(storageKey, JSON.stringify(events));
  }, [isClient, events]);

  useEffect(() => {
    if (!isClient) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => undefined);
    }
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    const timers: number[] = [];
    const now = Date.now();
    events.forEach((event) => {
      if (!event.reminderAt) return;
      const target = Date.parse(event.reminderAt);
      if (Number.isNaN(target) || target <= now) return;
      const id = window.setTimeout(() => {
        if (Notification.permission === "granted") {
          new Notification("Command Hub Reminder", {
            body: `${event.title} • ${event.date} ${event.time}`,
          });
        }
      }, target - now);
      timers.push(id);
    });
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [isClient, events]);

  const weeklyDates = useMemo(() => {
    const base = startOfWeek(new Date(selectedDate));
    return Array.from({ length: 7 }, (_, index) => addDays(base, index));
  }, [selectedDate]);

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, EventItem[]>>((acc, event) => {
      acc[event.date] = acc[event.date] ? [...acc[event.date], event] : [event];
      return acc;
    }, {});
  }, [events]);

  const addEvent = () => {
    if (!title.trim()) return;
    const reminderAt = reminder
      ? new Date(`${selectedDate}T${time}:00`).toISOString()
      : undefined;
    const event: EventItem = {
      id: `event-${Date.now()}`,
      title: title.trim(),
      date: selectedDate,
      time,
      notes: notes.trim() || undefined,
      reminderAt,
    };
    setEvents((current) => [event, ...current]);
    if (userId) {
      void addEventMutation({
        userId,
        title: event.title,
        date: event.date,
        time: event.time,
        reminderAt: event.reminderAt,
        notes: event.notes,
      });
    }
    setTitle("");
    setNotes("");
    setReminder(false);
  };

  const removeEvent = (id: string) => {
    setEvents((current) => current.filter((event) => event.id !== id));
    if (userId && !id.startsWith("event-")) {
      void removeEventMutation({ id: id as never });
    }
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
              Calendar
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-black">
              Weekly + Daily Planner
            </h1>
            <p className="mt-2 text-sm text-black/50">
              Add events and reminders with lightweight notifications.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-black/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-black/70 transition hover:border-black/40 hover:text-black"
          >
            Back
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setView("weekly")}
            className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] transition ${
              view === "weekly"
                ? "border-black bg-black text-white"
                : "border-black/15 text-black/70 hover:border-black/40 hover:text-black"
            }`}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setView("daily")}
            className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] transition ${
              view === "daily"
                ? "border-black bg-black text-white"
                : "border-black/15 text-black/70 hover:border-black/40 hover:text-black"
            }`}
          >
            Daily
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="rounded-full border border-black/15 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-black/70"
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_40px_rgba(0,0,0,0.06)]">
            <div className="text-[11px] uppercase tracking-[0.3em] text-black/40">
              Add Event
            </div>
            <div className="mt-4 space-y-3">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Event title"
                className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-black placeholder:text-black/30 focus:border-black/40 focus:outline-none"
              />
              <input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-black focus:border-black/40 focus:outline-none"
              />
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Notes"
                rows={3}
                className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-black placeholder:text-black/30 focus:border-black/40 focus:outline-none"
              />
              <label className="flex items-center gap-2 text-sm text-black/60">
                <input
                  type="checkbox"
                  checked={reminder}
                  onChange={(event) => setReminder(event.target.checked)}
                />
                Add reminder notification
              </label>
              <button
                type="button"
                onClick={addEvent}
                className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90"
              >
                Save Event
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_40px_rgba(0,0,0,0.06)]">
            <div className="text-[11px] uppercase tracking-[0.3em] text-black/40">
              {view === "weekly" ? "Week" : "Day"}
            </div>
            {view === "weekly" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {weeklyDates.map((date) => {
                  const key = toDateKey(date);
                  const items = eventsByDate[key] || [];
                  return (
                    <div
                      key={key}
                      className="rounded-2xl border border-black/10 p-4"
                    >
                      <div className="text-xs uppercase tracking-[0.2em] text-black/50">
                        {date.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="mt-2 space-y-2">
                        {items.length === 0 ? (
                          <div className="text-xs text-black/40">No events</div>
                        ) : (
                          items.map((event) => (
                            <div
                              key={event.id}
                              className="rounded-xl border border-black/10 px-3 py-2 text-xs"
                            >
                              <div className="font-semibold text-black">
                                {event.title}
                              </div>
                              <div className="text-black/40">
                                {event.time}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeEvent(event.id)}
                                className="mt-2 rounded-full border border-red-500/40 px-3 py-1 text-[9px] uppercase tracking-[0.3em] text-red-600"
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {(eventsByDate[selectedDate] || []).map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-black/10 px-4 py-3"
                  >
                    <div className="text-sm font-semibold text-black">
                      {event.title}
                    </div>
                    <div className="text-xs text-black/40">{event.time}</div>
                    {event.notes ? (
                      <div className="mt-2 text-xs text-black/60">
                        {event.notes}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removeEvent(event.id)}
                      className="mt-2 rounded-full border border-red-500/40 px-3 py-1 text-[9px] uppercase tracking-[0.3em] text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {(eventsByDate[selectedDate] || []).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-black/10 p-6 text-sm text-black/40">
                    No events for this day.
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
