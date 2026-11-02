import { NextRequest, NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/security/session";
import { sameOrigin } from "@/lib/security/origin";
import { serverApi } from "@/lib/api/server";
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json({ detail: "Origin mismatch" }, { status: 403 });
  const session = await getSession();
  if (session) {
    try {
      await serverApi("/aws/session", { session, method: "DELETE" });
    } catch {
      /* logout locally even if backend is offline */
    }
  }
  await clearSession();
  return NextResponse.json({ ok: true });
}
