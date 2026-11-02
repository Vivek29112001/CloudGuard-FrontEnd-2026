import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/security/origin";
import { storeSession } from "@/lib/security/session";
import { BackendError, serverApi } from "@/lib/api/server";
export const runtime = "nodejs";
const schema = z.object({
  username: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(1024),
});
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json({ detail: "Origin mismatch" }, { status: 403 });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json(
        { detail: "Invalid login fields" },
        { status: 400 },
      );
    const body = await serverApi<{
      access_token: string;
      user: { username: string; email?: string };
    }>("/auth/login", { method: "POST", body: parsed.data });
    if (!body.access_token || !body.user?.username)
      return NextResponse.json(
        { detail: "Unexpected authentication response" },
        { status: 502 },
      );
    await storeSession({
      accessToken: body.access_token,
      username: body.user.username,
      email: body.user.email || "",
    });
    return NextResponse.json(
      { user: body.user },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const status = e instanceof BackendError ? e.status : 500;
    return NextResponse.json(
      { detail: e instanceof BackendError ? e.message : "Unable to sign in" },
      { status },
    );
  }
}
