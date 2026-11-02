// "use client";
// import Link from "next/link";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { useQueryClient } from "@tanstack/react-query";
// import {
//   Play,
//   ScanSearch,
//   Info,
//   Clock,
//   CheckCircle2,
//   Cloud,
// } from "lucide-react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { PageHeader } from "@/components/shared/page-header";
// import {
//   useActiveScan,
//   keys,
//   connectionId,
//   useAuthStatus,
// } from "@/lib/api/queries";
// import { backend } from "@/lib/api/client";
// import { useConnection, useWorkspace } from "@/components/layout/app-shell";
// import type { Scan } from "@/types/aws";
// import { when } from "@/lib/utils/format";
// import { ErrorPanel } from "@/components/shared/state-panels";
// export function ScanPage() {
//   const { data: scan, error } = useActiveScan();
//   const { connection } = useConnection();
//   const { demo } = useWorkspace();
//   const id =
//     connection?.aws_connection_id || connection?.id || connectionId(scan);
//   const {
//     data: auth,
//     error: authError,
//     isPending: authPending,
//   } = useAuthStatus(id);
//   const query = useQueryClient();
//   const router = useRouter();
//   const [busy, setBusy] = useState(false);
//   const [message, setMessage] = useState("");
//   const [failure, setFailure] = useState("");
//   async function run() {
//     if (!id) return;
//     setBusy(true);
//     setFailure("");
//     setMessage(
//       "Waiting for FastAPI discovery response. Stage percentages are not available from the current backend.",
//     );
//     try {
//       const result = await backend<Scan>(
//         `/aws/connections/${id}/scan/refresh`,
//         { method: "POST" },
//       );
//       if (result.scan_id) {
//         query.setQueryData(keys.scan, result);
//         await query.invalidateQueries({ queryKey: keys.history });
//         await query.invalidateQueries({ queryKey: keys.scan });
//         router.push("/overview");
//       } else
//         setMessage(
//           "Backend returned without a scan identifier. Review the response before using this scan.",
//         );
//     } catch (e) {
//       setFailure(e instanceof Error ? e.message : "Scan failed");
//     } finally {
//       setBusy(false);
//     }
//   }
//   return (
//     <>
//       <PageHeader
//         title="Run New Scan"
//         description="Discover Regions, services and resources through your existing read-only FastAPI / AWS MCP pipeline."
//       />
//       <div className="split-layout">
//         <Card>
//           <CardContent>
//             <div className="card-heading text-base mb-1">
//               Scan Configuration
//             </div>
//             <p className="page-description mb-6">
//               Available options reflect what the existing backend actually
//               supports.
//             </p>
//             <div className="alert mb-5"><Info size={16}/>Discovery Only enumerates all enabled AWS Regions, services, and resource types. For specific-Region security checks, select Security Only or Full Audit above.</div>
//             {failure && <ErrorPanel message={failure} />}{" "}
//             {authError && id && (
//               <ErrorPanel
//                 message={`Unable to check AWS authorization: ${authError.message}`}
//               />
//             )}{" "}
//             {error && (
//               <ErrorPanel
//                 message={`Unable to load the active scan: ${error.message}`}
//               />
//             )}{" "}
//             {message && (
//               <div className="alert mt-3 mb-3">
//                 <Info size={17} />
//                 {message}
//               </div>
//             )}
//             {id ? (
//               <Button
//                 variant="primary"
//                 className="w-full mt-4"
//                 onClick={() => void run()}
//                 disabled={
//                   demo || busy || authPending || !!authError || !auth?.connected
//                 }
//               >
//                 <Play size={15} />
//                 {busy
//                   ? "Discovery in progress…"
//                   : authPending
//                     ? "Checking AWS authorization…"
//                     : "Start Discovery Scan"}
//               </Button>
//             ) : (
//               <Link href="/connections">
//                 <Button variant="primary" className="w-full mt-4">
//                   <Cloud size={15} />
//                   Connect AWS account
//                 </Button>
//               </Link>
//             )}
//             {id && demo && (
//               <div className="help-text text-center mt-3">
//                 Demo mode does not run live AWS scans. Switch to a non-demo
//                 workspace to discover AWS resources.
//               </div>
//             )}
//             {id && authError && (
//               <div className="help-text text-center mt-3">
//                 The authorization check failed, so scan start is blocked. Retry
//                 or reconnect your AWS account.
//               </div>
//             )}
//             {id && !demo && !authPending && !authError && !auth?.connected && (
//               <div className="help-text text-center mt-3">
//                 {auth?.last_auth_error ||
//                   "Live AWS authorization is unavailable. Reconnect before starting a scan."}
//               </div>
//             )}
//           </CardContent>
//         </Card>
//         <div className="flex flex-col gap-4">
//           <Card>
//             <CardContent>
//               <div className="card-heading mb-4">Discovery Status</div>
//               <div className="flex gap-3 items-center mb-5">
//                 <span className="metric-icon blue">
//                   <ScanSearch size={22} />
//                 </span>
//                 <div>
//                   <div className="text-sm font-bold">
//                     {busy ? "Running discovery" : scan?.status || "No scan yet"}
//                   </div>
//                   <div className="small-note">
//                     {busy
//                       ? "Awaiting server response"
//                       : scan?.completed_at
//                         ? `Last completed ${when(scan.completed_at)}`
//                         : "Scan required"}
//                   </div>
//                 </div>
//               </div>
//               {[
//                 [
//                   "Verify AWS account",
//                   id ? "Connection identified" : "Waiting for connection",
//                 ],
//                 ["Infrastructure discovery", scan?.status || "Pending"],
//                 [
//                   "Region & resource inventory",
//                   scan ? "Snapshot recorded" : "Pending",
//                 ],
//                 ["Snapshot persistence", scan?.scan_id ? "Saved" : "Pending"],
//               ].map(([label, value]) => (
//                 <div className="scan-row" key={label}>
//                   <CheckCircle2
//                     size={16}
//                     color={scan ? "#12a876" : "#94a3b8"}
//                   />
//                   <span className="flex-1 text-xs font-semibold">{label}</span>
//                   <span className="small-note">{value}</span>
//                 </div>
//               ))}
//             </CardContent>
//           </Card>
//           <div className="alert">
//             <Clock size={17} />
//             This backend currently uses a synchronous scan request. For scalable
//             production scans, move orchestration to a job queue and expose a
//             progress/status API; do not display made-up progress percentages.
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Play,
  ScanSearch,
  Info,
  Clock,
  CheckCircle2,
  Cloud,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import {
  useActiveScan,
  keys,
  connectionId,
  useAuthStatus,
} from "@/lib/api/queries";
import { backend } from "@/lib/api/client";
import { useConnection, useWorkspace } from "@/components/layout/app-shell";
import type { Scan } from "@/types/aws";
import { when } from "@/lib/utils/format";
import { ErrorPanel } from "@/components/shared/state-panels";
export function ScanPage() {
  const { data: scan, error } = useActiveScan();
  const { connection } = useConnection();
  const { demo } = useWorkspace();
  const id =
    connection?.aws_connection_id || connection?.id || connectionId(scan);
  const {
    data: auth,
    error: authError,
    isPending: authPending,
  } = useAuthStatus(id);
  const query = useQueryClient();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState("");
  async function run() {
    if (!id) return;
    setBusy(true);
    setFailure("");
    setMessage(
      "Waiting for FastAPI discovery response. Stage percentages are not available from the current backend.",
    );
    try {
      const result = await backend<Scan>(
        `/aws/connections/${id}/scan/refresh`,
        { method: "POST" },
      );
      if (result.scan_id) {
        query.setQueryData(keys.scan, result);
        await query.invalidateQueries({ queryKey: keys.history });
        await query.invalidateQueries({ queryKey: keys.scan });
        router.push("/overview");
      } else
        setMessage(
          "Backend returned without a scan identifier. Review the response before using this scan.",
        );
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Run New Scan"
        description="Discover Regions, services and resources through your existing read-only FastAPI / AWS MCP pipeline."
      />
      <div className="split-layout">
        <Card>
          <CardContent>
            <div className="card-heading text-base mb-1">
              Scan Configuration
            </div>
            <p className="page-description mb-6">
              Available options reflect what the existing backend actually
              supports.
            </p>
            <div className="alert mb-5">
              <Info size={16} />
              Discovery identifies AWS services, resources, and resource types
              across enabled Regions. This is a read-only inventory operation.
            </div>
            {failure && <ErrorPanel message={failure} />}{" "}
            {authError && id && (
              <ErrorPanel
                message={`Unable to check AWS authorization: ${authError.message}`}
              />
            )}{" "}
            {error && (
              <ErrorPanel
                message={`Unable to load the active scan: ${error.message}`}
              />
            )}{" "}
            {message && (
              <div className="alert mt-3 mb-3">
                <Info size={17} />
                {message}
              </div>
            )}
            {id ? (
              <Button
                variant="primary"
                className="w-full mt-4"
                onClick={() => void run()}
                disabled={
                  demo || busy || authPending || !!authError || !auth?.connected
                }
              >
                <Play size={15} />
                {busy
                  ? "Discovery in progress…"
                  : authPending
                    ? "Checking AWS authorization…"
                    : "Start Discovery Scan"}
              </Button>
            ) : (
              <Link href="/connections">
                <Button variant="primary" className="w-full mt-4">
                  <Cloud size={15} />
                  Connect AWS account
                </Button>
              </Link>
            )}
            {id && demo && (
              <div className="help-text text-center mt-3">
                Demo mode does not run live AWS scans. Switch to a non-demo
                workspace to discover AWS resources.
              </div>
            )}
            {id && authError && (
              <div className="help-text text-center mt-3">
                The authorization check failed, so scan start is blocked. Retry
                or reconnect your AWS account.
              </div>
            )}
            {id && !demo && !authPending && !authError && !auth?.connected && (
              <div className="help-text text-center mt-3">
                {auth?.last_auth_error ||
                  "Live AWS authorization is unavailable. Reconnect before starting a scan."}
              </div>
            )}
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent>
              <div className="card-heading mb-4">Discovery Status</div>
              <div className="flex gap-3 items-center mb-5">
                <span className="metric-icon blue">
                  <ScanSearch size={22} />
                </span>
                <div>
                  <div className="text-sm font-bold">
                    {busy ? "Running discovery" : scan?.status || "No scan yet"}
                  </div>
                  <div className="small-note">
                    {busy
                      ? "Awaiting server response"
                      : scan?.completed_at
                        ? `Last completed ${when(scan.completed_at)}`
                        : "Scan required"}
                  </div>
                </div>
              </div>
              {[
                [
                  "Verify AWS account",
                  id ? "Connection identified" : "Waiting for connection",
                ],
                ["Infrastructure discovery", scan?.status || "Pending"],
                [
                  "Region & resource inventory",
                  scan ? "Snapshot recorded" : "Pending",
                ],
                ["Snapshot persistence", scan?.scan_id ? "Saved" : "Pending"],
              ].map(([label, value]) => (
                <div className="scan-row" key={label}>
                  <CheckCircle2
                    size={16}
                    color={scan ? "#12a876" : "#94a3b8"}
                  />
                  <span className="flex-1 text-xs font-semibold">{label}</span>
                  <span className="small-note">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="alert">
            <Clock size={17} />
            This backend currently uses a synchronous scan request. For scalable
            production scans, move orchestration to a job queue and expose a
            progress/status API; do not display made-up progress percentages.
          </div>
        </div>
      </div>
    </>
  );
}
