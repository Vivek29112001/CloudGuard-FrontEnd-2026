import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, isDemo } from "@/lib/security/session";
import { BackendError, serverApi } from "@/lib/api/server";
import { demoWorkspace } from "@/lib/fixtures/demo";
import { AppShell } from "@/components/layout/app-shell";
import type { Workspace } from "@/types/aws";
export const dynamic = "force-dynamic";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const demo = !session && isDemo();
  if (!session && !demo) redirect("/login");
  let workspaces: Workspace[] = [];
  if (demo) workspaces = [demoWorkspace];
  else
    try {
      workspaces = await serverApi<Workspace[]>("/workspaces", { session });
    } catch (error) {
      if (error instanceof BackendError && error.status === 401)
        redirect("/login");
      return (
        <div className="auth-page">
          <div className="auth-card">
            <h1 className="auth-heading">Backend unavailable</h1>
            <p className="auth-description">
              Unable to load authorized client workspaces. Confirm FastAPI is
              running and refresh this page.
            </p>
            <Link className="btn primary" href="/overview">
              Try again
            </Link>
          </div>
        </div>
      );
    }
  if (workspaces.length === 0) redirect("/onboarding");
  const active =
    workspaces.find((w) => w.id === session?.workspaceId) || workspaces[0];
  return (
    <AppShell
      key={active.id}
      workspaces={workspaces}
      activeId={active.id}
      initialConnection={
        session?.connectionWorkspaceId === active.id ? session.connection : null
      }
      user={
        session
          ? { username: session.username, email: session.email }
          : { username: "Demo Viewer", email: "sample@local.invalid" }
      }
      demo={demo}
    >
      {children}
    </AppShell>
  );
}
