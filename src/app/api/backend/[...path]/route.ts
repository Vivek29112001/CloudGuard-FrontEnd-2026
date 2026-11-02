import { NextRequest, NextResponse } from "next/server";
import {
  clearSession,
  getSession,
  isDemo,
  storeSession,
} from "@/lib/security/session";
import { sameOrigin } from "@/lib/security/origin";
import { BackendError, serverApi } from "@/lib/api/server";
import { demoResponse } from "@/lib/fixtures/demo";
import type { Workspace } from "@/types/aws";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Strict allowlist: never proxy arbitrary URLs, paths, methods, or client-supplied credentials.
const routes: Array<[RegExp, string[]]> = [
  [/^\/workspaces$/, ["GET", "POST"]],
  [/^\/workspaces\/\d+$/, ["PATCH", "DELETE"]],
  [/^\/aws\/session\/status$/, ["GET"]],
  [/^\/aws\/connections\/assume-role\/source-identity$/, ["GET"]],
  [/^\/aws\/connections\/assume-role\/verify$/, ["POST"]],
  [/^\/aws\/verify$/, ["POST"]],
  [/^\/aws\/connections\/\d+\/scan\/refresh$/, ["POST"]],
  [/^\/aws\/scans$/, ["GET"]],
  [/^\/aws\/scans\/active$/, ["GET"]],
  [/^\/aws\/scans\/[a-zA-Z0-9_-]+\/activate$/, ["PUT"]],
  [/^\/aws\/scans\/[a-zA-Z0-9_-]+$/, ["GET"]],
  [/^\/aws\/connections\/\d+\/inventory$/, ["GET"]],
  [/^\/aws\/connections\/\d+\/inventory\/revisions$/, ["GET"]],
  [/^\/aws\/connections\/\d+\/inventory\/edits$/, ["POST"]],
  [/^\/chats$/, ["GET", "POST"]],
  [/^\/chats\/\d+$/, ["GET"]],
  [/^\/chats\/\d+\/query$/, ["POST"]],
];
async function handler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;
  if (segments.length > 8 || segments.some((v) => !/^[a-zA-Z0-9_-]+$/.test(v)))
    return NextResponse.json({ detail: "Invalid path" }, { status: 400 });
  const path = "/" + segments.join("/");
  if (
    !routes.some(
      ([pattern, methods]) =>
        pattern.test(path) && methods.includes(req.method),
    )
  )
    return NextResponse.json(
      { detail: "Unsupported operation" },
      { status: 404 },
    );
  if (req.method !== "GET" && !sameOrigin(req))
    return NextResponse.json({ detail: "Origin mismatch" }, { status: 403 });
  const session = await getSession();
  if (!session && isDemo()) {
    const data = demoResponse(path, req.method);
    return NextResponse.json(data, {
      status:
        req.method === "GET" && !(data as { detail?: string }).detail
          ? 200
          : 403,
      headers: { "Cache-Control": "no-store" },
    });
  }
  if (!session)
    return NextResponse.json(
      { detail: "Please sign in again" },
      { status: 401 },
    );
  try {
    const isWorkspaceRoute = path.startsWith("/workspaces");
    const workspaces = isWorkspaceRoute
      ? []
      : await serverApi<Workspace[]>("/workspaces", { session });
    const selected =
      workspaces.find((w) => w.id === session.workspaceId) || workspaces[0];
    if (!isWorkspaceRoute && !selected)
      return NextResponse.json(
        { detail: "Create a workspace first" },
        { status: 409 },
      );
    let body: unknown;
    if (["POST", "PATCH", "PUT"].includes(req.method)) {
      const payload = await req.text();
      if (payload.length > 30_000)
        return NextResponse.json(
          { detail: "Request body too large" },
          { status: 413 },
        );
      try {
        body = payload ? JSON.parse(payload) : undefined;
      } catch {
        return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
      }
    }
    // Prevent accidental credentials in client-defined headers. This boundary controls tenant IDs.
    const requestedUrl = new URL(req.url);
    const query = new URLSearchParams();
    if (path === "/aws/scans/active") {
      const accountId = requestedUrl.searchParams.get("account_id");
      if (accountId && /^\d{12}$/.test(accountId))
        query.set("account_id", accountId);
    }
    if (path === "/aws/session/status") {
      const cid = requestedUrl.searchParams.get("connection_id");
      if (cid && /^\d+$/.test(cid)) query.set("connection_id", cid);
    }
    const result = await serverApi<unknown>(
      path + (query.size ? "?" + query.toString() : ""),
      {
        session,
        workspaceId: selected?.id,
        method: req.method,
        body,
        timeoutMs:
          path.includes("/scan/refresh") ||
          path.includes("/query") ||
          path.endsWith("/verify")
            ? 1_800_000
            : 45_000,
      },
    );
    if (
      (path === "/aws/verify" ||
        path === "/aws/connections/assume-role/verify") &&
      selected
    ) {
      const metadata = result as {
        id?: number;
        aws_connection_id?: number;
        account_id?: string;
        arn?: string;
        auth_type?: string;
        provider?: string;
      };
      if (metadata?.aws_connection_id || metadata?.id) {
        // Persist only non-secret connection metadata, scoped to selected workspace.
        await storeSession({
          ...session,
          workspaceId: selected.id,
          connectionWorkspaceId: selected.id,
          connection: {
            id: metadata.id,
            aws_connection_id: metadata.aws_connection_id,
            account_id: metadata.account_id,
            arn: metadata.arn,
            auth_type: metadata.auth_type,
            provider: metadata.provider,
          },
        });
      }
    }
    return NextResponse.json(result ?? { ok: true }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    if (e instanceof BackendError && e.status === 401) await clearSession();
    return NextResponse.json(
      { detail: e instanceof BackendError ? e.message : "Request failed" },
      { status: e instanceof BackendError ? e.status : 500 },
    );
  }
}
export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as PUT,
  handler as DELETE,
};
