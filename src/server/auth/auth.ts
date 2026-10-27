import "server-only";

import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "../db/client";
import * as schema from "../db/schema/auth";
import { getServerEnvironment } from "../env";
import { objectStorage } from "../storage/local";

const env = getServerEnvironment();

async function captureAuthMessage(
  kind: string,
  email: string,
  url: string,
): Promise<void> {
  const safeEmail = email.toLowerCase().replace(/[^a-z0-9@._-]/g, "_");
  const key = `auth/${Date.now()}-${kind}-${safeEmail}.json`;
  await objectStorage.put(
    key,
    JSON.stringify(
      { kind, email, url, capturedAt: new Date().toISOString() },
      null,
      2,
    ),
  );
}

export const auth = betterAuth({
  appName: "MailBlast",
  baseURL: env.APP_URL,
  secret: env.AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) =>
      captureAuthMessage("password-reset", user.email, url),
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) =>
      captureAuthMessage("email-verification", user.email, url),
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    useSecureCookies: env.NODE_ENV === "production",
  },
  plugins: [nextCookies()],
});
