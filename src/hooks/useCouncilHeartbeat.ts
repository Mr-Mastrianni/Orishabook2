import { useCallback, useEffect, useRef } from "react";
import { OrishaName, Post } from "../lib/council/types";
import { generateAsyncPost, AsyncPostFlavor } from "../lib/council/orchestrator";

interface HeartbeatOptions {
  activeMembers: OrishaName[];
  getRecentPosts: () => Post[];
  onGenerated: (post: Partial<Post>) => Promise<void> | void;
  /** Automatic firing cadence in milliseconds. Default 20 min. */
  intervalMs?: number;
  /** Whether the heartbeat auto-fires on interval. Manual triggers always work. */
  enabled?: boolean;
  /** Optional getter for the current creativity value. Evaluated per trigger. */
  getTemperature?: () => number;
}

interface HeartbeatHandle {
  /** Fire an async post immediately for the given member + flavor (both optional). */
  trigger: (opts?: { memberId?: OrishaName; flavor?: AsyncPostFlavor }) => Promise<void>;
}

/**
 * Fires unprompted ("heartbeat") Orisha posts on an interval and exposes a
 * manual trigger. Uses refs so the interval callback always sees the latest
 * members + posts without restarting the timer on every render.
 */
export function useCouncilHeartbeat({
  activeMembers,
  getRecentPosts,
  onGenerated,
  intervalMs = 20 * 60 * 1000,
  enabled = true,
  getTemperature,
}: HeartbeatOptions): HeartbeatHandle {
  const busyRef = useRef(false);
  const membersRef = useRef(activeMembers);
  const postsRef = useRef(getRecentPosts);
  const cbRef = useRef(onGenerated);
  const tempRef = useRef(getTemperature);

  useEffect(() => {
    membersRef.current = activeMembers;
  }, [activeMembers]);
  useEffect(() => {
    postsRef.current = getRecentPosts;
  }, [getRecentPosts]);
  useEffect(() => {
    cbRef.current = onGenerated;
  }, [onGenerated]);
  useEffect(() => {
    tempRef.current = getTemperature;
  }, [getTemperature]);

  const trigger = useCallback(
    async (opts?: { memberId?: OrishaName; flavor?: AsyncPostFlavor }) => {
      if (busyRef.current) return;
      const members = membersRef.current;
      if (members.length === 0) return;

      const memberId =
        opts?.memberId ?? members[Math.floor(Math.random() * members.length)];

      busyRef.current = true;
      try {
        const recentPosts = postsRef.current();
        const post = await generateAsyncPost(memberId, {
          flavor: opts?.flavor,
          recentPosts,
          temperature: tempRef.current?.(),
        });
        await cbRef.current(post);
      } catch (err) {
        console.error("Heartbeat trigger failed:", err);
      } finally {
        busyRef.current = false;
      }
    },
    []
  );

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      void trigger();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs, trigger]);

  return { trigger };
}
