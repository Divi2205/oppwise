// Simple fixed-window rate limiter (per IP + action).
// In-memory: fine for a single server; on serverless each instance keeps its own window.
const buckets = globalThis.__oppwiseRate || (globalThis.__oppwiseRate = new Map());

export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true };
  }
  b.count += 1;
  return b.count <= limit ? { ok: true } : { ok: false, retryAfter: Math.ceil((b.reset - now) / 1000) };
}

export function clientIp(req) {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
}
