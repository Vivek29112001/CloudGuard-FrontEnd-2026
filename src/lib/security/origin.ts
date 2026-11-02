import { NextRequest } from 'next/server';

// Browser same-origin POSTs supply Origin. Reject cross-origin requests; no wildcard CORS.
export function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) {
    // For state changing requests, reject missing Origin (browser sends it for fetch POST).
    return false;
  }
  const expected = process.env.APP_ORIGIN || req.nextUrl.origin;
  try {return new URL(origin).origin === new URL(expected).origin;} catch {return false;}
}
