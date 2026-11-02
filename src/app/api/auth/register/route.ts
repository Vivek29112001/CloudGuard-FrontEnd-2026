import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/security/origin";
import { BackendError, serverApi } from "@/lib/api/server";
const schema = z.object({
  username: z.string().trim().min(2).max(80),
  email: z.email(),
  password: z.string().min(8).max(1024),
});
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json({ detail: "Origin mismatch" }, { status: 403 });
  try {
    const data = schema.safeParse(await req.json());
    if (!data.success)
      return NextResponse.json(
        { detail: "Invalid registration fields" },
        { status: 400 },
      );
    await serverApi("/auth/register", { method: "POST", body: data.data });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { detail: e instanceof BackendError ? e.message : "Unable to register" },
      { status: e instanceof BackendError ? e.status : 500 },
    );
  }
}
