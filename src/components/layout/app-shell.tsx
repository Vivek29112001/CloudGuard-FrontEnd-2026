// "use client";
// import { createContext, useContext, useState, useCallback } from "react";
// import { usePathname } from "next/navigation";
// import Link from "next/link";
// import {
//   Bell,
//   Cloud,
//   LayoutDashboard,
//   ScanSearch,
//   MessageCircle,
//   ShieldAlert,
//   FileText,
//   Settings,
//   LogOut,
//   Menu,
//   Database,
//   Link2,
//   CheckCircle2,
//   AlertCircle,
// } from "lucide-react";
// import { QueryProvider } from "./query-provider";
// import { api } from "@/lib/api/client";
// import { useAuthStatus, useActiveScan } from "@/lib/api/queries";
// import type { AwsConnection, Workspace } from "@/types/aws";
// import { Button } from "@/components/ui/button";
// const nav = [
//   { href: "/connections", label: "Connections", icon: Link2 },
//   { href: "/scan", label: "Scan", icon: ScanSearch },
//   { href: "/overview", label: "Overview", icon: LayoutDashboard },
//   { href: "/inventory", label: "AWS Inventory", icon: Database },
//   { href: "/assistant", label: "Chat Assistant", icon: MessageCircle },
//   { href: "/findings", label: "Findings", icon: ShieldAlert },
//   { href: "/security/runs", label: "Security Runs", icon: ShieldAlert },
//   { href: "/reports", label: "Reports", icon: FileText },
//   { href: "/settings", label: "Settings", icon: Settings },
// ];
// const WorkspaceContext = createContext<{
//   workspace: Workspace | null;
//   demo: boolean;
// }>({ workspace: null, demo: false });
// export const useWorkspace = () => useContext(WorkspaceContext);
// const ConnectionContext = createContext<{
//   connection: AwsConnection | null;
//   setConnection: (connection: AwsConnection | null) => void;
// }>({ connection: null, setConnection: () => {} });
// export const useConnection = () => useContext(ConnectionContext);
// function Sidebar({
//   workspaces,
//   activeId,
//   user,
//   mobile,
//   onClose,
//   demo,
// }: {
//   workspaces: Workspace[];
//   activeId: number;
//   user: { username: string; email: string };
//   mobile: boolean;
//   onClose: () => void;
//   demo: boolean;
// }) {
//   const pathname = usePathname();
//   const [busy, setBusy] = useState(false);
//   async function switchWorkspace(id: number) {
//     if (id === activeId) return;
//     setBusy(true);
//     try {
//       await api("/api/workspace/select", {
//         method: "POST",
//         body: { workspaceId: id },
//       });
//       window.location.assign("/overview");
//     } catch (e) {
//       alert(e instanceof Error ? e.message : "Workspace switch failed");
//       setBusy(false);
//     }
//   }
//   async function logout() {
//     setBusy(true);
//     try {
//       await api("/api/auth/logout", { method: "POST" });
//     } catch {}
//     window.location.assign("/login");
//   }
//   return (
//     <>
//       <aside
//         className={`sidebar ${mobile ? "open" : ""}`}
//         aria-label="Main navigation"
//       >
//         <Link href="/overview" className="brand" onClick={onClose}>
//           <span className="brand-icon">
//             <Cloud size={20} color="white" fill="#70a7ff" />
//           </span>
//           new-DhanushGuard
//         </Link>
//         <div className="nav-section">Workspace</div>
//         <select
//           className="workspace-select"
//           aria-label="Select client workspace"
//           value={activeId}
//           disabled={busy || demo}
//           onChange={(e) => void switchWorkspace(Number(e.target.value))}
//         >
//           {workspaces.map((w) => (
//             <option key={w.id} value={w.id}>
//               {w.name}
//             </option>
//           ))}
//         </select>
//         <div className="nav-section">Navigation</div>
//         <nav>
//           {nav.map(({ href, label, icon: Icon }) => (
//             <Link
//               key={href}
//               href={href}
//               onClick={onClose}
//               className={`nav-link ${pathname === href || pathname.startsWith(href + "/") ? "active" : ""}`}
//             >
//               <Icon size={17} strokeWidth={2.4} />
//               {label}
//             </Link>
//           ))}
//         </nav>
//         <div className="sidebar-bottom">
//           <div className="sidebar-user">
//             <span className="avatar">
//               {user.username.slice(0, 2).toUpperCase()}
//             </span>
//             <div className="min-w-0">
//               <div className="text-white text-xs font-bold truncate">
//                 {user.username}
//               </div>
//               <div className="sidebar-small">
//                 {user.email ||
//                   workspaces.find((w) => w.id === activeId)?.role ||
//                   ""}
//               </div>
//             </div>
//           </div>
//           {!demo && (
//             <button
//               className="sidebar-signout"
//               onClick={() => void logout()}
//               disabled={busy}
//             >
//               <LogOut size={15} />
//               Sign out
//             </button>
//           )}
//         </div>
//       </aside>
//       {mobile && (
//         <div
//           className="fixed inset-0 bg-black/35 z-20 lg:hidden"
//           onClick={onClose}
//           aria-hidden="true"
//         />
//       )}
//     </>
//   );
// }
// // Sidebar state is centralized in AppShell; TopBar mobile button delegates to the same shell.
// function MobileSidebar({ onClose }: { onClose: () => void }) {
//   return (
//     <div
//       className="sidebar open"
//       style={{ position: "relative", transform: "none" }}
//     >
//       <Link className="brand" href="/overview" onClick={onClose}>
//         <span className="brand-icon">
//           <Cloud size={18} />
//         </span>
//         new-DhanushGuard
//       </Link>
//       {nav.map(({ href, label, icon: Icon }) => (
//         <Link className="nav-link" key={href} href={href} onClick={onClose}>
//           <Icon size={17} />
//           {label}
//         </Link>
//       ))}
//     </div>
//   );
// }
// function ShellInner({
//   children,
//   workspaces,
//   activeId,
//   user,
//   demo,
//   initialConnection,
// }: {
//   children: React.ReactNode;
//   workspaces: Workspace[];
//   activeId: number;
//   user: { username: string; email: string };
//   demo: boolean;
//   initialConnection?: AwsConnection | null;
// }) {
//   const [mobile, setMobile] = useState(false);
//   const [connection, setConnection] = useState<AwsConnection | null>(
//     initialConnection || null,
//   );
//   const close = useCallback(() => setMobile(false), []);
//   return (
//     <WorkspaceContext.Provider
//       value={{
//         workspace: workspaces.find((w) => w.id === activeId) || null,
//         demo,
//       }}
//     >
//       <ConnectionContext.Provider value={{ connection, setConnection }}>
//         <div className="app-layout">
//           <Sidebar
//             workspaces={workspaces}
//             activeId={activeId}
//             user={user}
//             mobile={mobile}
//             onClose={close}
//             demo={demo}
//           />
//           <main className="main-area">
//             <header className="topbar">
//               <div className="flex items-center gap-3">
//                 <button
//                   className="icon-button mobile-menu"
//                   aria-label="Open navigation"
//                   onClick={() => setMobile(true)}
//                 >
//                   <Menu size={19} />
//                 </button>
//                 <span className="topbar-label">
//                   Cloud security & infrastructure intelligence
//                 </span>
//               </div>
//               <div className="topbar-right">
//                 <ConnectionStatus demo={demo} />
//                 <Link
//                   href="/settings"
//                   className="icon-button"
//                   aria-label="Settings"
//                 >
//                   <Bell size={18} />
//                 </Link>
//               </div>
//             </header>
//             <div className="page-content">
//               {demo && (
//                 <div className="alert warning mb-5">
//                   <AlertCircle size={18} />
//                   Design preview using explicitly labelled demonstration data.
//                   No live AWS evidence or API changes are available.
//                 </div>
//               )}
//               {children}
//             </div>
//           </main>
//         </div>
//       </ConnectionContext.Provider>
//     </WorkspaceContext.Provider>
//   );
// }
// function ConnectionStatus({ demo }: { demo: boolean }) {
//   const { data: scan } = useActiveScan();
//   const { connection } = useConnection();
//   const { data: auth } = useAuthStatus(
//     connection?.aws_connection_id || connection?.id || scan?.aws_connection_id,
//   );
//   if (demo)
//     return (
//       <span className="status-chip warn">
//         <AlertCircle size={17} />
//         Demo data
//       </span>
//     );
//   return auth?.connected ? (
//     <span className="status-chip">
//       <CheckCircle2 size={17} />
//       AWS Connected
//     </span>
//   ) : (
//     <span className="status-chip info">
//       <AlertCircle size={17} />
//       {scan ? "Snapshot only" : "Not connected"}
//     </span>
//   );
// }
// export function AppShell(props: {
//   children: React.ReactNode;
//   workspaces: Workspace[];
//   activeId: number;
//   user: { username: string; email: string };
//   demo: boolean;
//   initialConnection?: AwsConnection | null;
// }) {
//   return (
//     <QueryProvider>
//       <ShellInner {...props} />
//     </QueryProvider>
//   );
// }

"use client";
import { createContext, useContext, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Cloud,
  LayoutDashboard,
  ScanSearch,
  MessageCircle,
  FileText,
  Settings,
  LogOut,
  Menu,
  Database,
  Link2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { QueryProvider } from "./query-provider";
import { api } from "@/lib/api/client";
import { useAuthStatus, useActiveScan } from "@/lib/api/queries";
import type { AwsConnection, Workspace } from "@/types/aws";
import { Button } from "@/components/ui/button";
const nav = [
  { href: "/connections", label: "Connections", icon: Link2 },
  { href: "/scan", label: "Scan", icon: ScanSearch },
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/inventory", label: "AWS Inventory", icon: Database },
  { href: "/assistant", label: "Chat Assistant", icon: MessageCircle },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];
const WorkspaceContext = createContext<{
  workspace: Workspace | null;
  demo: boolean;
}>({ workspace: null, demo: false });
export const useWorkspace = () => useContext(WorkspaceContext);
const ConnectionContext = createContext<{
  connection: AwsConnection | null;
  setConnection: (connection: AwsConnection | null) => void;
}>({ connection: null, setConnection: () => {} });
export const useConnection = () => useContext(ConnectionContext);
function Sidebar({
  workspaces,
  activeId,
  user,
  mobile,
  onClose,
  demo,
}: {
  workspaces: Workspace[];
  activeId: number;
  user: { username: string; email: string };
  mobile: boolean;
  onClose: () => void;
  demo: boolean;
}) {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  async function switchWorkspace(id: number) {
    if (id === activeId) return;
    setBusy(true);
    try {
      await api("/api/workspace/select", {
        method: "POST",
        body: { workspaceId: id },
      });
      window.location.assign("/overview");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Workspace switch failed");
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.assign("/login");
  }
  return (
    <>
      <aside
        className={`sidebar ${mobile ? "open" : ""}`}
        aria-label="Main navigation"
      >
        <Link href="/overview" className="brand" onClick={onClose}>
          <span className="brand-icon">
            <Cloud size={20} color="white" fill="#70a7ff" />
          </span>
          new-DhanushGuard
        </Link>
        <div className="nav-section">Workspace</div>
        <select
          className="workspace-select"
          aria-label="Select client workspace"
          value={activeId}
          disabled={busy || demo}
          onChange={(e) => void switchWorkspace(Number(e.target.value))}
        >
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <div className="nav-section">Navigation</div>
        <nav>
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`nav-link ${pathname === href || pathname.startsWith(href + "/") ? "active" : ""}`}
            >
              <Icon size={17} strokeWidth={2.4} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <span className="avatar">
              {user.username.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="text-white text-xs font-bold truncate">
                {user.username}
              </div>
              <div className="sidebar-small">
                {user.email ||
                  workspaces.find((w) => w.id === activeId)?.role ||
                  ""}
              </div>
            </div>
          </div>
          {!demo && (
            <button
              className="sidebar-signout"
              onClick={() => void logout()}
              disabled={busy}
            >
              <LogOut size={15} />
              Sign out
            </button>
          )}
        </div>
      </aside>
      {mobile && (
        <div
          className="fixed inset-0 bg-black/35 z-20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    </>
  );
}
// Sidebar state is centralized in AppShell; TopBar mobile button delegates to the same shell.
function MobileSidebar({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="sidebar open"
      style={{ position: "relative", transform: "none" }}
    >
      <Link className="brand" href="/overview" onClick={onClose}>
        <span className="brand-icon">
          <Cloud size={18} />
        </span>
        new-DhanushGuard
      </Link>
      {nav.map(({ href, label, icon: Icon }) => (
        <Link className="nav-link" key={href} href={href} onClick={onClose}>
          <Icon size={17} />
          {label}
        </Link>
      ))}
    </div>
  );
}
function ShellInner({
  children,
  workspaces,
  activeId,
  user,
  demo,
  initialConnection,
}: {
  children: React.ReactNode;
  workspaces: Workspace[];
  activeId: number;
  user: { username: string; email: string };
  demo: boolean;
  initialConnection?: AwsConnection | null;
}) {
  const [mobile, setMobile] = useState(false);
  const [connection, setConnection] = useState<AwsConnection | null>(
    initialConnection || null,
  );
  const close = useCallback(() => setMobile(false), []);
  return (
    <WorkspaceContext.Provider
      value={{
        workspace: workspaces.find((w) => w.id === activeId) || null,
        demo,
      }}
    >
      <ConnectionContext.Provider value={{ connection, setConnection }}>
        <div className="app-layout">
          <Sidebar
            workspaces={workspaces}
            activeId={activeId}
            user={user}
            mobile={mobile}
            onClose={close}
            demo={demo}
          />
          <main className="main-area">
            <header className="topbar">
              <div className="flex items-center gap-3">
                <button
                  className="icon-button mobile-menu"
                  aria-label="Open navigation"
                  onClick={() => setMobile(true)}
                >
                  <Menu size={19} />
                </button>
                <span className="topbar-label">
                  Cloud infrastructure discovery & intelligence
                </span>
              </div>
              <div className="topbar-right">
                <ConnectionStatus demo={demo} />
                <Link
                  href="/settings"
                  className="icon-button"
                  aria-label="Settings"
                >
                  <Bell size={18} />
                </Link>
              </div>
            </header>
            <div className="page-content">
              {demo && (
                <div className="alert warning mb-5">
                  <AlertCircle size={18} />
                  Design preview using explicitly labelled demonstration data.
                  No live AWS evidence or API changes are available.
                </div>
              )}
              {children}
            </div>
          </main>
        </div>
      </ConnectionContext.Provider>
    </WorkspaceContext.Provider>
  );
}
function ConnectionStatus({ demo }: { demo: boolean }) {
  const { data: scan } = useActiveScan();
  const { connection } = useConnection();
  const { data: auth } = useAuthStatus(
    connection?.aws_connection_id || connection?.id || scan?.aws_connection_id,
  );
  if (demo)
    return (
      <span className="status-chip warn">
        <AlertCircle size={17} />
        Demo data
      </span>
    );
  return auth?.connected ? (
    <span className="status-chip">
      <CheckCircle2 size={17} />
      AWS Connected
    </span>
  ) : (
    <span className="status-chip info">
      <AlertCircle size={17} />
      {scan ? "Snapshot only" : "Not connected"}
    </span>
  );
}
export function AppShell(props: {
  children: React.ReactNode;
  workspaces: Workspace[];
  activeId: number;
  user: { username: string; email: string };
  demo: boolean;
  initialConnection?: AwsConnection | null;
}) {
  return (
    <QueryProvider>
      <ShellInner {...props} />
    </QueryProvider>
  );
}
