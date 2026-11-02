import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/security/origin";
import { getSession, storeSession } from "@/lib/security/session";
import { serverApi, BackendError } from "@/lib/api/server";
import type { Workspace } from "@/types/aws";
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json({ detail: "Origin mismatch" }, { status: 403 });
  const session = await getSession();
  if (!session)
    return NextResponse.json({ detail: "Unauthenticated" }, { status: 401 });
  try {
    const input = z
      .object({ workspaceId: z.number().int().positive() })
      .parse(await req.json());
    const workspaces = await serverApi<Workspace[]>("/workspaces", { session });
    if (!workspaces.some((w) => w.id === input.workspaceId))
      return NextResponse.json(
        { detail: "Workspace access denied" },
        { status: 403 },
      );
    await storeSession({
      ...session,
      workspaceId: input.workspaceId,
      connection: undefined,
      connectionWorkspaceId: undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        detail:
          e instanceof BackendError ? e.message : "Invalid workspace request",
      },
      { status: e instanceof BackendError ? e.status : 400 },
    );
  }
}
