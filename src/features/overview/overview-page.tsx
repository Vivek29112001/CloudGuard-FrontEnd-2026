// "use client";
// import Link from "next/link";
// import { useMemo } from "react";
// import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
// import {
//   ShieldCheck,
//   ShieldAlert,
//   Info,
//   Database,
//   FileCheck2,
//   ScanSearch,
//   ArrowUpRight,
//   Check,
// } from "lucide-react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { PageHeader } from "@/components/shared/page-header";
// import { MetricCard } from "@/components/shared/metric-card";
// import { LoadingPanel, ErrorPanel } from "@/components/shared/state-panels";
// import { useActiveScan, useScanHistory } from "@/lib/api/queries";
// import { SecurityRunSummary } from "@/features/security/security-summary-strip";
// import { when, count } from "@/lib/utils/format";
// import {
//   summarizeSecurityEvidence,
//   type SnapshotForSecurity,
// } from "@/lib/domain/security-summary";
// const palette = [
//   "#2867f6",
//   "#39be9e",
//   "#725ee6",
//   "#ffad43",
//   "#ffd45e",
//   "#a4cbdb",
//   "#7e94b3",
// ];
// export function OverviewPage() {
//   const { data: scan, isPending, error } = useActiveScan();
//   const { data: history = [] } = useScanHistory();
//   const resources = scan?.resources?.resources || [];
//   const evidence = useMemo(
//     () =>
//       summarizeSecurityEvidence(scan as SnapshotForSecurity | null | undefined),
//     [scan],
//   );
//   const breakdown = useMemo(
//     () =>
//       Object.entries(
//         resources.reduce<Record<string, number>>((acc, r) => {
//           const name = (r.service || "unknown").toUpperCase();
//           acc[name] = (acc[name] || 0) + 1;
//           return acc;
//         }, {}),
//       )
//         .sort((a, b) => b[1] - a[1])
//         .map(([name, value]) => ({ name, value })),
//     [resources],
//   );
//   const total =
//     scan?.summary?.discovered_resources ??
//     scan?.resources?.total_resources ??
//     (scan ? resources.length : null);
//   if (isPending) return <LoadingPanel />;
//   if (error) return <ErrorPanel message={error.message} />;
//   return (
//     <>
//       <PageHeader
//         title="Welcome to new-DhanushGuard"
//         description="Analyze your AWS environment with evidence-backed infrastructure discovery and read-only investigation."
//         actions={
//           <Link href="/scan">
//             <Button variant="primary">
//               <ScanSearch size={15} />
//               Run scan
//             </Button>
//           </Link>
//         }
//       />
//       <div className="alert warning mb-5">
//         <Info size={17} className="shrink-0" />
//         <span>
//           <strong>Security assessment coverage:</strong> Inventory verification
//           is not a security audit. AWS Config and Security Hub CSPM statuses
//           below describe data-source availability, not compliance or risk
//           scores.
//         </span>
//       </div>
//       <SecurityRunSummary />
//       <div className="metric-grid">
//         <MetricCard
//           label="Total Resources"
//           value={total}
//           icon={ShieldCheck}
//           description={
//             scan ? "Records in active discovery snapshot" : "No scan available"
//           }
//         />
//         <MetricCard
//           label="Inventory Records Verified"
//           value={evidence.verifiedInventory}
//           icon={Database}
//           tone="green"
//           description={
//             evidence.unverifiedInventory === null
//               ? "Verification details unavailable"
//               : `${count(evidence.unverifiedInventory)} unverified records · Not a security pass`
//           }
//         />
//         <MetricCard
//           label="AWS Config Recording"
//           value={
//             evidence.config.activeRegions === null
//               ? "—"
//               : `${evidence.config.activeRegions}/${evidence.config.totalRegions}`
//           }
//           icon={FileCheck2}
//           tone="yellow"
//           description={
//             evidence.config.sourcePresent
//               ? "Regions with confirmed running recorder"
//               : "AWS Config audit not returned"
//           }
//         />
//         <MetricCard
//           label="Security Hub CSPM"
//           value={
//             evidence.securityHub.activeRegions === null
//               ? "—"
//               : `${evidence.securityHub.activeRegions}/${evidence.securityHub.totalRegions}`
//           }
//           icon={ShieldAlert}
//           tone="red"
//           description={
//             evidence.securityHub.sourcePresent
//               ? "Regions reporting enabled CSPM"
//               : "Security Hub audit not returned"
//           }
//         />
//       </div>
//       <div className="dashboard-grid">
//         <Card className="h-visual">
//           <CardContent>
//             <div className="panel-title-row">
//               <div className="card-heading">Resource Distribution</div>
//               <Badge tone="info">Discovered</Badge>
//             </div>
//             {breakdown.length > 0 ? (
//               <div className="ring-layout">
//                 <div className="relative w-[56%] h-[215px]">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <PieChart>
//                       <Pie
//                         data={breakdown}
//                         dataKey="value"
//                         innerRadius="57%"
//                         outerRadius="86%"
//                         stroke="#fff"
//                         strokeWidth={2}
//                       >
//                         {breakdown.map((_, i) => (
//                           <Cell key={i} fill={palette[i % palette.length]} />
//                         ))}
//                       </Pie>
//                       <Tooltip formatter={(value) => [value, "Resources"]} />
//                     </PieChart>
//                   </ResponsiveContainer>
//                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
//                     <span className="text-2xl font-extrabold">
//                       {count(total)}
//                     </span>
//                     <span className="text-xs text-slate-500">Resources</span>
//                   </div>
//                 </div>
//                 <div className="legend flex-1">
//                   {breakdown.slice(0, 6).map((item, i) => (
//                     <div className="legend-row" key={item.name}>
//                       <span className="whitespace-nowrap">
//                         <span
//                           className="legend-dot"
//                           style={{ background: palette[i % palette.length] }}
//                         />
//                         {item.name}
//                       </span>
//                       <strong>{item.value}</strong>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ) : (
//               <div className="chart-empty">
//                 <ScanSearch size={28} />
//                 Run discovery to see the service distribution.
//               </div>
//             )}
//           </CardContent>
//         </Card>
//         <Card className="h-visual">
//           <CardContent>
//             <div className="panel-title-row">
//               <div className="card-heading">AWS Security Evidence Status</div>
//             </div>
//             <div className="space-y-4">
//               <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
//                 <div>
//                   <div className="text-xs font-bold text-slate-800">
//                     AWS Config
//                   </div>
//                   <div className="small-note mt-1">
//                     Configuration recording and control evaluation
//                   </div>
//                 </div>
//                 <Badge
//                   tone={
//                     evidence.config.totalRegions !== null &&
//                     evidence.config.totalRegions > 0 &&
//                     evidence.config.activeRegions ===
//                       evidence.config.totalRegions
//                       ? "success"
//                       : "warning"
//                   }
//                 >
//                   {evidence.config.sourcePresent
//                     ? `${evidence.config.activeRegions}/${evidence.config.totalRegions} Regions`
//                     : "No audit data"}
//                 </Badge>
//               </div>
//               <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
//                 <div>
//                   <div className="text-xs font-bold text-slate-800">
//                     AWS Security Hub CSPM
//                   </div>
//                   <div className="small-note mt-1">
//                     Security standards, checks and findings
//                   </div>
//                 </div>
//                 <Badge
//                   tone={
//                     evidence.securityHub.totalRegions !== null &&
//                     evidence.securityHub.totalRegions > 0 &&
//                     evidence.securityHub.activeRegions ===
//                       evidence.securityHub.totalRegions
//                       ? "success"
//                       : "warning"
//                   }
//                 >
//                   {evidence.securityHub.sourcePresent
//                     ? `${evidence.securityHub.activeRegions}/${evidence.securityHub.totalRegions} Regions`
//                     : "No audit data"}
//                 </Badge>
//               </div>
//               <div className="grid grid-cols-3 gap-2 text-center">
//                 <div className="rounded-lg bg-slate-50 px-2 py-3">
//                   <div className="text-sm font-extrabold">—</div>
//                   <div className="small-note mt-1">Security findings</div>
//                 </div>
//                 <div className="rounded-lg bg-slate-50 px-2 py-3">
//                   <div className="text-sm font-extrabold">—</div>
//                   <div className="small-note mt-1">High risk</div>
//                 </div>
//                 <div className="rounded-lg bg-slate-50 px-2 py-3">
//                   <div className="text-sm font-extrabold">—</div>
//                   <div className="small-note mt-1">Compliance score</div>
//                 </div>
//               </div>
//               <p className="small-note">
//                 These measures require validated control findings and a defined
//                 compliance scoring method; inventory records alone cannot supply
//                 them.
//               </p>
//             </div>
//           </CardContent>
//         </Card>
//         <Card className="h-visual">
//           <CardContent>
//             <div className="panel-title-row">
//               <div className="card-heading">Recent Scans</div>
//               <Link
//                 href="/reports"
//                 className="text-xs font-bold text-blue-600 flex items-center gap-1"
//               >
//                 View All <ArrowUpRight size={13} />
//               </Link>
//             </div>
//             {history.length ? (
//               history.slice(0, 5).map((s) => (
//                 <div className="scan-row" key={s.scan_id}>
//                   <span className="scan-icon">
//                     <Check size={16} />
//                   </span>
//                   <div className="flex-1 min-w-0">
//                     <div className="scan-name">Infrastructure Discovery</div>
//                     <div className="scan-sub">
//                       {when(s.completed_at || s.started_at)}
//                     </div>
//                   </div>
//                   <Badge tone={s.status === "COMPLETED" ? "info" : "warning"}>
//                     {s.status || "Unknown"}
//                   </Badge>
//                 </div>
//               ))
//             ) : (
//               <div className="chart-empty">
//                 <ScanSearch size={27} />
//                 No scans saved yet.
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//       <div className="grid lg:grid-cols-2 gap-4 mt-5">
//         <Card>
//           <CardContent>
//             <div className="card-heading mb-3">Active AWS Snapshot</div>
//             {scan ? (
//               <div className="grid grid-cols-2 gap-4 text-xs">
//                 <div>
//                   <div className="text-slate-500 mb-1">AWS account</div>
//                   <strong>{scan.account?.account_id || "Unknown"}</strong>
//                 </div>
//                 <div>
//                   <div className="text-slate-500 mb-1">Scan status</div>
//                   <strong>{scan.status || "Unknown"}</strong>
//                 </div>
//                 <div>
//                   <div className="text-slate-500 mb-1">Enabled Regions</div>
//                   <strong>{count(scan.summary?.enabled_regions)}</strong>
//                 </div>
//                 <div>
//                   <div className="text-slate-500 mb-1">Availability Zones</div>
//                   <strong>{count(scan.summary?.availability_zones)}</strong>
//                 </div>
//               </div>
//             ) : (
//               <div className="text-xs text-slate-500">
//                 No saved scan. Connect AWS and run a discovery scan.
//               </div>
//             )}
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent>
//             <div className="card-heading mb-2">Explore audit evidence</div>
//             <p className="page-description mb-4">
//               Inspect detected services, resources, source status, and
//               verification evidence without confusing infrastructure inventory
//               with security findings.
//             </p>
//             <Link href="/inventory">
//               <Button>
//                 View AWS Inventory <ArrowUpRight size={15} />
//               </Button>
//             </Link>
//           </CardContent>
//         </Card>
//       </div>
//     </>
//   );
// }

"use client";
import Link from "next/link";
import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  ShieldCheck,
  Database,
  ScanSearch,
  ArrowUpRight,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { LoadingPanel, ErrorPanel } from "@/components/shared/state-panels";
import { useActiveScan, useScanHistory } from "@/lib/api/queries";
import { when, count } from "@/lib/utils/format";
const palette = [
  "#2867f6",
  "#39be9e",
  "#725ee6",
  "#ffad43",
  "#ffd45e",
  "#a4cbdb",
  "#7e94b3",
];
export function OverviewPage() {
  const { data: scan, isPending, error } = useActiveScan();
  const { data: history = [] } = useScanHistory();
  const resources = scan?.resources?.resources || [];
  const breakdown = useMemo(
    () =>
      Object.entries(
        resources.reduce<Record<string, number>>((acc, r) => {
          const name = (r.service || "unknown").toUpperCase();
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {}),
      )
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value })),
    [resources],
  );
  const total =
    scan?.summary?.discovered_resources ??
    scan?.resources?.total_resources ??
    (scan ? resources.length : null);
  if (isPending) return <LoadingPanel />;
  if (error) return <ErrorPanel message={error.message} />;
  return (
    <>
      <PageHeader
        title="Welcome to new-DhanushGuard"
        description="Analyze your AWS environment with evidence-backed infrastructure discovery and read-only investigation."
        actions={
          <Link href="/scan">
            <Button variant="primary">
              <ScanSearch size={15} />
              Run scan
            </Button>
          </Link>
        }
      />
      <div className="metric-grid">
        <MetricCard
          label="Total Resources"
          value={total}
          icon={Database}
          description={
            scan ? "Discovered AWS resource records" : "No active snapshot"
          }
        />
        <MetricCard
          label="Verified Inventory Records"
          value={
            scan
              ? resources.filter((r) => r.verification_status === "VERIFIED")
                  .length
              : null
          }
          icon={ShieldCheck}
          tone="green"
          description="AWS API resource identity verification"
        />
        <MetricCard
          label="Discovered Services"
          value={
            scan?.summary?.detected_services ??
            scan?.resources?.detected_services?.length ??
            null
          }
          icon={Database}
          description="Service namespaces from discovery"
        />
        <MetricCard
          label="Enabled Regions"
          value={
            scan?.summary?.enabled_regions ??
            scan?.regions?.enabled_regions ??
            null
          }
          icon={ScanSearch}
          description="Regions enabled for this AWS account"
        />
      </div>
      <div className="dashboard-grid">
        <Card className="h-visual">
          <CardContent>
            <div className="panel-title-row">
              <div className="card-heading">Resource Distribution</div>
              <Badge tone="info">Discovered</Badge>
            </div>
            {breakdown.length > 0 ? (
              <div className="ring-layout">
                <div className="relative w-[56%] h-[215px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={breakdown}
                        dataKey="value"
                        innerRadius="57%"
                        outerRadius="86%"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {breakdown.map((_, i) => (
                          <Cell key={i} fill={palette[i % palette.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Resources"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-extrabold">
                      {count(total)}
                    </span>
                    <span className="text-xs text-slate-500">Resources</span>
                  </div>
                </div>
                <div className="legend flex-1">
                  {breakdown.slice(0, 6).map((item, i) => (
                    <div className="legend-row" key={item.name}>
                      <span className="whitespace-nowrap">
                        <span
                          className="legend-dot"
                          style={{ background: palette[i % palette.length] }}
                        />
                        {item.name}
                      </span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="chart-empty">
                <ScanSearch size={28} />
                Run discovery to see the service distribution.
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="h-visual">
          <CardContent>
            <div className="panel-title-row">
              <div className="card-heading">Discovery Coverage</div>
              <Badge tone="info">Inventory</Badge>
            </div>
            <div className="space-y-5 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-600">Availability Zones</span>
                <strong>{count(scan?.summary?.availability_zones)}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-600">
                  Detected service namespaces
                </span>
                <strong>
                  {count(
                    scan?.summary?.detected_services ??
                      scan?.resources?.detected_services?.length,
                  )}
                </strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-600">
                  Unverified inventory records
                </span>
                <strong>
                  {scan
                    ? count(
                        resources.filter(
                          (r) => r.verification_status !== "VERIFIED",
                        ).length,
                      )
                    : "—"}
                </strong>
              </div>
              <p className="small-note">
                Inventory verification checks resource identity, not workload
                criticality or cost.
              </p>
              <Link href="/inventory" className="btn sm">
                Inspect resources <ArrowUpRight size={14} />
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card className="h-visual">
          <CardContent>
            <div className="panel-title-row">
              <div className="card-heading">Recent Scans</div>
              <Link
                href="/reports"
                className="text-xs font-bold text-blue-600 flex items-center gap-1"
              >
                View All <ArrowUpRight size={13} />
              </Link>
            </div>
            {history.length ? (
              history.slice(0, 5).map((s) => (
                <div className="scan-row" key={s.scan_id}>
                  <span className="scan-icon">
                    <Check size={16} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="scan-name">Infrastructure Discovery</div>
                    <div className="scan-sub">
                      {when(s.completed_at || s.started_at)}
                    </div>
                  </div>
                  <Badge tone={s.status === "COMPLETED" ? "info" : "warning"}>
                    {s.status || "Unknown"}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="chart-empty">
                <ScanSearch size={27} />
                No scans saved yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mt-5">
        <Card>
          <CardContent>
            <div className="card-heading mb-3">Active AWS Snapshot</div>
            {scan ? (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-slate-500 mb-1">AWS account</div>
                  <strong>{scan.account?.account_id || "Unknown"}</strong>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Scan status</div>
                  <strong>{scan.status || "Unknown"}</strong>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Enabled Regions</div>
                  <strong>{count(scan.summary?.enabled_regions)}</strong>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Availability Zones</div>
                  <strong>{count(scan.summary?.availability_zones)}</strong>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                No saved scan. Connect AWS and run a discovery scan.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="card-heading mb-2">Explore audit evidence</div>
            <p className="page-description mb-4">
              Inspect detected services, resources, source status, and
              verification evidence collected by AWS read-only APIs.
            </p>
            <Link href="/inventory">
              <Button>
                View AWS Inventory <ArrowUpRight size={15} />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
