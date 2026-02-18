import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";
import Resend from "@auth/core/providers/resend";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY ?? "",
      from: process.env.AUTH_EMAIL_FROM ?? "support@commandhub.ai",
    }),
  ],
});
