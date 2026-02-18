import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  profiles: defineTable({
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_email", ["email"]).index("by_user", ["userId"]),
  notes: defineTable({
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    folder: v.string(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
  links: defineTable({
    userId: v.string(),
    name: v.string(),
    url: v.string(),
    pinned: v.boolean(),
    order: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
  events: defineTable({
    userId: v.string(),
    title: v.string(),
    date: v.string(),
    time: v.string(),
    reminderAt: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
