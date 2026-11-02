import "server-only";
import type { AuditSession } from "@/lib/security/session";
const baseUrl = process.env.FASTAPI_BASE_URL || "http://127.0.0.1:8000/api";
if (!/^https?:\/\//.test(baseUrl)) throw new Error("Invalid FASTAPI_BASE_URL");

export class BackendError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "BackendError";
  }
}
export async function serverApi<T>(
  path: string,
  {
    session,
    method = "GET",
    body,
    workspaceId,
    timeoutMs = 30_000,
  }: {
    session?: AuditSession | null;
    method?: string;
    body?: unknown;
    workspaceId?: number;
    timeoutMs?: number;
  } = {},
): Promise<T> {
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("..") ||
    path.includes("#")
  )
    throw new Error("Invalid backend path");
  const headers: Record<string, string> = { Accept: "application/json" };
  if (session?.accessToken)
    headers.Authorization = `Bearer ${session.accessToken}`;
  if (typeof workspaceId === "number")
    headers["X-Workspace-ID"] = String(workspaceId);
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new BackendError(
      503,
      "FastAPI backend could not be reached or timed out.",
    );
  }
  if (!response.ok) {
    let message = `Backend request failed (${response.status})`;
    try {
      const payload = (await response.json()) as { detail?: unknown };
      if (typeof payload.detail === "string") message = payload.detail;
    } catch {}
    throw new BackendError(response.status, message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
