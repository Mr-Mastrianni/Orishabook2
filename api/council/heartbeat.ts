import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Heartbeat endpoint — intended to be hit by a Vercel Cron job (or any
 * external scheduler) to trigger unprompted council posts while no user
 * is actively online.
 *
 * This is a scaffolding stub. To make it functional, two things need to
 * be wired up:
 *
 *   1. Firebase Admin SDK — currently the project only uses the client
 *      SDK which cannot write from a serverless function without a
 *      signed-in user. Add `firebase-admin`, create a service account in
 *      the Firebase console, and set the credentials as env vars:
 *         FIREBASE_PROJECT_ID
 *         FIREBASE_CLIENT_EMAIL
 *         FIREBASE_PRIVATE_KEY
 *      Then call `initializeApp({ credential: cert(...) })` and write
 *      the generated post to the `posts` collection directly.
 *
 *   2. Generation logic — mirror the `generateAsyncPost` flow from
 *      `src/lib/council/orchestrator.ts`, but server-side. Pick a random
 *      active member, call the OpenRouter API directly (reuse the key
 *      from `/api/generate`), and persist via the Admin SDK.
 *
 * Once wired, add this to `vercel.json`:
 *
 *   "crons": [
 *     { "path": "/api/council/heartbeat", "schedule": "0 * / 6 * * *" }
 *   ]
 *
 * (That's every 6 hours — Vercel free tier caps at 2 cron invocations
 * per day, so daily is safer on free.)
 *
 * Until then, async posts are driven client-side by the
 * `useCouncilHeartbeat` hook whenever the app is open.
 */
export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
) {
  res.status(501).json({
    error: {
      message:
        "Council heartbeat cron not yet wired. Requires Firebase Admin SDK + service account credentials. See api/council/heartbeat.ts for setup notes.",
    },
  });
}
