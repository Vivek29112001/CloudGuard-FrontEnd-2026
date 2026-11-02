import "server-only";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { EncryptJWT, jwtDecrypt } from "jose";

export type AuditSession = {
  accessToken: string;
  username: string;
  email: string;
  workspaceId?: number;
  connectionWorkspaceId?: number;
  connection?: {
    id?: number;
    aws_connection_id?: number;
    account_id?: string;
    arn?: string;
    auth_type?: string;
    provider?: string;
  };
};
const cookieName =
  process.env.NODE_ENV === "production" ? "__Host-aws_auditor" : "aws_auditor";
const ageSeconds = 60 * 60 * 8;
function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32 || secret.includes("REPLACE_WITH"))
    throw new Error(
      "SESSION_SECRET must be configured securely (32+ characters).",
    );
  return createHash("sha256").update(secret).digest();
}
export async function encodeSession(session: AuditSession) {
  return new EncryptJWT({ ...session })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${ageSeconds}s`)
    .encrypt(key());
}
export async function getSession(): Promise<AuditSession | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtDecrypt(token, key());
    if (
      typeof payload.accessToken !== "string" ||
      typeof payload.username !== "string"
    )
      return null;
    return {
      accessToken: payload.accessToken,
      username: payload.username,
      email: typeof payload.email === "string" ? payload.email : "",
      workspaceId:
        typeof payload.workspaceId === "number"
          ? payload.workspaceId
          : undefined,
      connectionWorkspaceId:
        typeof payload.connectionWorkspaceId === "number"
          ? payload.connectionWorkspaceId
          : undefined,
      connection:
        payload.connection &&
        typeof payload.connection === "object" &&
        !Array.isArray(payload.connection)
          ? (payload.connection as AuditSession["connection"])
          : undefined,
    };
  } catch {
    return null;
  }
}
export async function storeSession(session: AuditSession) {
  const token = await encodeSession(session);
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ageSeconds,
    priority: "high",
  });
}
export async function clearSession() {
  (await cookies()).delete(cookieName);
}
export const isDemo = () =>
  process.env.NODE_ENV === "development" && process.env.ENABLE_DEMO === "true";
