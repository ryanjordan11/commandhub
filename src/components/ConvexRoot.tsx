"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { convex } from "@/lib/convex";

export default function ConvexRoot({ children }: { children: React.ReactNode }) {
  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}
