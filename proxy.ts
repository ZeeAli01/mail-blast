import { NextRequest, NextResponse } from "next/server";

type Bucket = { count: number; resetsAt: number };
const buckets = new Map<string, Bucket>();

export function proxy(request: NextRequest) {
  const now = Date.now();
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const identity = forwarded || "local";
  const sensitive = request.nextUrl.pathname.startsWith("/api/auth/");
  const limit = sensitive ? 20 : 60;
  const key = `${identity}:${sensitive ? "auth" : "public"}`;
  const current = buckets.get(key);
  const bucket =
    !current || current.resetsAt <= now
      ? { count: 0, resetsAt: now + 60_000 }
      : current;
  bucket.count += 1;
  buckets.set(key, bucket);
  if (bucket.count > limit) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Try again shortly.",
        },
      },
      {
        status: 429,
        headers: {
          "retry-after": String(Math.ceil((bucket.resetsAt - now) / 1000)),
        },
      },
    );
  }
  const response = NextResponse.next();
  response.headers.set("x-rate-limit-limit", String(limit));
  response.headers.set(
    "x-rate-limit-remaining",
    String(Math.max(0, limit - bucket.count)),
  );
  return response;
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/v1/public/:path*"],
};
