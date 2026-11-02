// "use client";
// import {
//   FileText,
//   Download,
//   History,
//   Database,
//   ShieldCheck,
//   CheckCircle2,
// } from "lucide-react";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { useQueryClient } from "@tanstack/react-query";
// import { backend } from "@/lib/api/client";
// import { keys } from "@/lib/api/queries";
// import type { Scan } from "@/types/aws";
// import { PageHeader } from "@/components/shared/page-header";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { EmptyState } from "@/components/shared/empty-state";
// import { useActiveScan, useScanHistory } from "@/lib/api/queries";
// import { when } from "@/lib/utils/format";
// import { downloadCsv } from "@/lib/utils/csv";
// export default function ReportsPage() {
//   const { data: scan } = useActiveScan();
//   const { data: history = [] } = useScanHistory();
//   const resources = scan?.resources?.resources || [];
//   const [busy, setBusy] = useState<string | null>(null);
//   const [error, setError] = useState("");
//   const client = useQueryClient();
//   const router = useRouter();
//   async function activate(id: string) {
//     setBusy(id);
//     setError("");
//     try {
//       const restored = await backend<Scan>(
//         `/aws/scans/${encodeURIComponent(id)}/activate`,
//         { method: "PUT" },
//       );
//       client.setQueryData(keys.scan, restored);
//       await client.invalidateQueries({ queryKey: keys.history });
//       router.push("/inventory");
//     } catch (e) {
//       setError(e instanceof Error ? e.message : "Unable to activate scan");
//     } finally {
//       setBusy(null);
//     }
//   }
//   return (
//     <>
//       <PageHeader
//         title="Reports"
//         description="Export evidence-backed inventory records and review immutable AWS discovery snapshots."
//       />
//       <div className="simple-split">
//         <Card>
//           <CardContent>
//             <div className="flex items-center gap-3 mb-4">
//               <div className="metric-icon blue">
//                 <Database size={22} />
//               </div>
//               <div>
//                 <h2 className="card-heading">AWS Resource Inventory</h2>
//                 <div className="card-description">
//                   CSV · Current active snapshot
//                 </div>
//               </div>
//             </div>
//             <p className="page-description mb-5">
//               Exports service, resource identifier, ARN, resource type, Region
//               and source metadata. No assumptions are added to AWS data.
//             </p>
//             <Button
//               variant="primary"
//               disabled={!resources.length}
//               onClick={() =>
//                 downloadCsv(
//                   "aws-resource-inventory.csv",
//                   [
//                     "Service",
//                     "Resource ID",
//                     "ARN",
//                     "Resource type",
//                     "Region",
//                     "Source",
//                     "Verification",
//                   ],
//                   resources.map((r) => [
//                     r.service,
//                     r.resource_id,
//                     r.arn,
//                     r.resource_type,
//                     r.region,
//                     r.data_source,
//                     r.verification_status,
//                   ]),
//                 )
//               }
//             >
//               <Download size={15} />
//               Export Resource CSV
//             </Button>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent>
//             <div className="flex items-center gap-3 mb-4">
//               <div className="metric-icon blue">
//                 <History size={22} />
//               </div>
//               <div>
//                 <h2 className="card-heading">Scan History Export</h2>
//                 <div className="card-description">
//                   CSV · Workspace scan history
//                 </div>
//               </div>
//             </div>
//             <p className="page-description mb-5">
//               Download snapshot identifiers, status, account and scan completion
//               time for review.
//             </p>
//             <Button
//               disabled={!history.length}
//               onClick={() =>
//                 downloadCsv(
//                   "aws-scan-history.csv",
//                   [
//                     "Scan ID",
//                     "Status",
//                     "Account ID",
//                     "Started at",
//                     "Completed at",
//                   ],
//                   history.map((s) => [
//                     s.scan_id,
//                     s.status,
//                     s.account?.account_id,
//                     s.started_at,
//                     s.completed_at,
//                   ]),
//                 )
//               }
//             >
//               <Download size={15} />
//               Export Scan CSV
//             </Button>
//           </CardContent>
//         </Card>
//       </div>
//       <Card className="mt-5">
//         <CardContent>
//           <h3 className="card-heading mb-3">Compliance & Security Report</h3>
//           <div className="alert">
//             <ShieldCheck size={17} />A compliance score, pass/fail report, or
//             security findings PDF cannot be generated responsibly until a
//             rules-and-findings backend returns verified audit results.
//           </div>
//         </CardContent>
//       </Card>
//       <Card className="mt-5">
//         <CardContent>
//           <div className="panel-title-row">
//             <h3 className="card-heading">Saved Discovery Snapshots</h3>
//             <span className="small-note">
//               Select a saved scan to restore the active context
//             </span>
//           </div>
//           {error && <div className="alert danger mb-3">{error}</div>}
//           {history.length ? (
//             <div className="table-scroll">
//               <table className="data-table">
//                 <thead>
//                   <tr>
//                     <th>Scan</th>
//                     <th>Account</th>
//                     <th>Completed</th>
//                     <th>Status</th>
//                     <th>Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {history.slice(0, 25).map((s) => (
//                     <tr key={s.scan_id}>
//                       <td className="table-primary">{s.scan_id || "—"}</td>
//                       <td>{s.account?.account_id || "—"}</td>
//                       <td>{when(s.completed_at)}</td>
//                       <td>{s.status || "—"}</td>
//                       <td>
//                         <Button
//                           size="sm"
//                           disabled={
//                             !s.scan_id ||
//                             busy !== null ||
//                             s.scan_id === scan?.scan_id
//                           }
//                           onClick={() => s.scan_id && void activate(s.scan_id)}
//                         >
//                           <CheckCircle2 size={13} />
//                           {s.scan_id === scan?.scan_id ? "Active" : "Activate"}
//                         </Button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           ) : (
//             <div className="small-note">No saved discovery scans returned.</div>
//           )}
//         </CardContent>
//       </Card>
//       <Card className="mt-5">
//         <CardContent>
//           <h3 className="card-heading mb-3">Active Snapshot</h3>
//           {scan ? (
//             <p className="page-description">
//               Scan {scan.scan_id} · {scan.status} · {when(scan.completed_at)}
//             </p>
//           ) : (
//             <EmptyState
//               title="No snapshot"
//               description="Run discovery before generating reports."
//               icon={FileText}
//             />
//           )}
//         </CardContent>
//       </Card>
//     </>
//   );
// }

"use client";
import {
  FileText,
  Download,
  History,
  Database,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { backend } from "@/lib/api/client";
import { keys } from "@/lib/api/queries";
import type { Scan } from "@/types/aws";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { useActiveScan, useScanHistory } from "@/lib/api/queries";
import { when } from "@/lib/utils/format";
import { downloadCsv } from "@/lib/utils/csv";
export default function ReportsPage() {
  const { data: scan } = useActiveScan();
  const { data: history = [] } = useScanHistory();
  const resources = scan?.resources?.resources || [];
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const client = useQueryClient();
  const router = useRouter();
  async function activate(id: string) {
    setBusy(id);
    setError("");
    try {
      const restored = await backend<Scan>(
        `/aws/scans/${encodeURIComponent(id)}/activate`,
        { method: "PUT" },
      );
      client.setQueryData(keys.scan, restored);
      await client.invalidateQueries({ queryKey: keys.history });
      router.push("/inventory");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to activate scan");
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <PageHeader
        title="Reports"
        description="Export evidence-backed inventory records and review immutable AWS discovery snapshots."
      />
      <div className="simple-split">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <div className="metric-icon blue">
                <Database size={22} />
              </div>
              <div>
                <h2 className="card-heading">AWS Resource Inventory</h2>
                <div className="card-description">
                  CSV · Current active snapshot
                </div>
              </div>
            </div>
            <p className="page-description mb-5">
              Exports service, resource identifier, ARN, resource type, Region
              and source metadata. No assumptions are added to AWS data.
            </p>
            <Button
              variant="primary"
              disabled={!resources.length}
              onClick={() =>
                downloadCsv(
                  "aws-resource-inventory.csv",
                  [
                    "Service",
                    "Resource ID",
                    "ARN",
                    "Resource type",
                    "Region",
                    "Source",
                    "Verification",
                  ],
                  resources.map((r) => [
                    r.service,
                    r.resource_id,
                    r.arn,
                    r.resource_type,
                    r.region,
                    r.data_source,
                    r.verification_status,
                  ]),
                )
              }
            >
              <Download size={15} />
              Export Resource CSV
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <div className="metric-icon blue">
                <History size={22} />
              </div>
              <div>
                <h2 className="card-heading">Scan History Export</h2>
                <div className="card-description">
                  CSV · Workspace scan history
                </div>
              </div>
            </div>
            <p className="page-description mb-5">
              Download snapshot identifiers, status, account and scan completion
              time for review.
            </p>
            <Button
              disabled={!history.length}
              onClick={() =>
                downloadCsv(
                  "aws-scan-history.csv",
                  [
                    "Scan ID",
                    "Status",
                    "Account ID",
                    "Started at",
                    "Completed at",
                  ],
                  history.map((s) => [
                    s.scan_id,
                    s.status,
                    s.account?.account_id,
                    s.started_at,
                    s.completed_at,
                  ]),
                )
              }
            >
              <Download size={15} />
              Export Scan CSV
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-5">
        <CardContent>
          <div className="panel-title-row">
            <h3 className="card-heading">Saved Discovery Snapshots</h3>
            <span className="small-note">
              Select a saved scan to restore the active context
            </span>
          </div>
          {error && <div className="alert danger mb-3">{error}</div>}
          {history.length ? (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Scan</th>
                    <th>Account</th>
                    <th>Completed</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 25).map((s) => (
                    <tr key={s.scan_id}>
                      <td className="table-primary">{s.scan_id || "—"}</td>
                      <td>{s.account?.account_id || "—"}</td>
                      <td>{when(s.completed_at)}</td>
                      <td>{s.status || "—"}</td>
                      <td>
                        <Button
                          size="sm"
                          disabled={
                            !s.scan_id ||
                            busy !== null ||
                            s.scan_id === scan?.scan_id
                          }
                          onClick={() => s.scan_id && void activate(s.scan_id)}
                        >
                          <CheckCircle2 size={13} />
                          {s.scan_id === scan?.scan_id ? "Active" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="small-note">No saved discovery scans returned.</div>
          )}
        </CardContent>
      </Card>
      <Card className="mt-5">
        <CardContent>
          <h3 className="card-heading mb-3">Active Snapshot</h3>
          {scan ? (
            <p className="page-description">
              Scan {scan.scan_id} · {scan.status} · {when(scan.completed_at)}
            </p>
          ) : (
            <EmptyState
              title="No snapshot"
              description="Run discovery before generating reports."
              icon={FileText}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
