import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("links")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const upsert = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    url: v.string(),
    pinned: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("links")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("url"), args.url))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        pinned: args.pinned,
        order: args.order,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return ctx.db.insert("links", {
      ...args,
      updatedAt: Date.now(),
    });
  },
});

export const removeByUrl = mutation({
  args: { userId: v.string(), url: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("links")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("url"), args.url))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
