import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Max 5 new sessions per IP per hour.
const sessionCreationLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "ratelimit:session-create",
});

// Max 25 messages per session, for the lifetime of the session. This is a
// backstop alongside the turn cap in completion-check.ts, keyed by session
// id rather than a rolling time window.
const messageLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(25, "30 d"),
  prefix: "ratelimit:chat-message",
});

export function checkSessionCreationLimit(ip: string) {
  return sessionCreationLimiter.limit(ip);
}

export function checkMessageLimit(sessionId: string) {
  return messageLimiter.limit(sessionId);
}
