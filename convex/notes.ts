import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const add = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    folder: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("notes", {
      ...args,
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("notes"),
    title: v.string(),
    body: v.string(),
    folder: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      title: args.title,
      body: args.body,
      folder: args.folder,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
