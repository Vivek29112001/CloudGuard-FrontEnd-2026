"use client";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Database,
  MapPin,
  Cloud,
  History,
  Wallet,
  Plus,
  MessageCircle,
  Download,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingPanel, ErrorPanel } from "@/components/shared/state-panels";
import {
  useActiveScan,
  useInventory,
  useRevisions,
  connectionId,
} from "@/lib/api/queries";
import { backend } from "@/lib/api/client";
import { when, money } from "@/lib/utils/format";
import { servicesFrom, type ServiceRow } from "@/lib/domain/inventory";
import { downloadCsv } from "@/lib/utils/csv";
import { useWorkspace } from "@/components/layout/app-shell";
import type { AwsResource, AwsRegion, Revision, Scan, Chat } from "@/types/aws";

export function InventoryPage() {
  const [tab, setTab] = useState<
    "services" | "resources" | "regions" | "history" | "billing"
  >("services");
  const { data: scan, isPending, error } = useActiveScan();
  const id = connectionId(scan);
  const { data: inventory, isLoading: loadingInventory } = useInventory(id);
  const { data: revisions = [] } = useRevisions(id);
  const context = inventory || scan;
  const resources = context?.resources?.resources || [];
  const rows = useMemo(
    () => (context ? servicesFrom(context, revisions) : []),
    [context, revisions],
  );
  const regions = context?.regions?.regions || [];
  const active = rows.filter((r) => r.status !== "Removed by user");
  if (isPending || loadingInventory) return <LoadingPanel />;
  if (error) return <ErrorPanel message={error.message} />;
  return (
    <>
      <PageHeader
        title="AWS Inventory"
        description={`Account ${context?.account?.account_id || "not connected"} · Services, Regions and Resources`}
        actions={
          <Link href="/scan">
            <Button variant="primary">
              <RefreshCw size={15} />
              Run New Auto Scan
            </Button>
          </Link>
        }
      />
      {!context ? (
        <Card>
          <EmptyState
            title="No inventory snapshot"
            description="Connect an AWS account and run your first scan to populate inventory data."
            action={
              <Link href="/connections">
                <Button variant="primary">Connect AWS</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <div className="metric-grid">
            <div className="card card-body">
              <div className="metric-label">Total Services</div>
              <div className="metric-value">{active.length}</div>
              <div className="metric-meta">Effective inventory</div>
            </div>
            <div className="card card-body">
              <div className="metric-label">Resources</div>
              <div className="metric-value">{resources.length}</div>
              <div className="metric-meta">Recorded resources</div>
            </div>
            <div className="card card-body">
              <div className="metric-label">Regions with resources</div>
              <div className="metric-value">
                {
                  new Set(
                    resources
                      .filter((r) => r.region && r.region !== "global")
                      .map((r) => r.region),
                  ).size
                }
              </div>
              <div className="metric-meta">Derived from snapshot</div>
            </div>
            <div className="card card-body">
              <div className="metric-label">Total listed Regions</div>
              <div className="metric-value">{regions.length}</div>
              <div className="metric-meta">Reported Region records</div>
            </div>
          </div>
          <div className="small-note mb-4">
            Snapshot: {when(context.completed_at || context.started_at)} ·
            Inventory revision: {context.inventory_revision ?? "—"} · Scan ID:{" "}
            {context.scan_id || "—"}
          </div>
          <Card>
            <CardContent>
              <div
                className="tabs"
                role="tablist"
                aria-label="Inventory categories"
              >
                {[
                  { id: "services", label: "AWS Services", icon: Cloud },
                  { id: "resources", label: "AWS Resources", icon: Database },
                  { id: "regions", label: "AWS Regions", icon: MapPin },
                  { id: "history", label: "Scan History", icon: History },
                  { id: "billing", label: "Billing & Cost", icon: Wallet },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    role="tab"
                    aria-selected={tab === id}
                    className={`tab ${tab === id ? "active" : ""}`}
                    key={id}
                    onClick={() => setTab(id as typeof tab)}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </div>
              {tab === "services" && (
                <ServicesTab
                  rows={rows}
                  context={context}
                  revisions={revisions}
                  id={id}
                />
              )}{" "}
              {tab === "resources" && (
                <ResourcesTab resources={resources} scan={context} />
              )}{" "}
              {tab === "regions" && (
                <RegionsTab
                  regions={regions}
                  resources={scan?.resources?.resources || resources}
                />
              )}{" "}
              {tab === "history" && (
                <HistoryTab revisions={revisions} scan={context} />
              )}{" "}
              {tab === "billing" && <BillingTab scan={context} />}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
function ServicesTab({
  rows,
  context,
  id,
}: {
  rows: ServiceRow[];
  context: Scan;
  revisions: Revision[];
  id?: number;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [filter, setFilter] = useState("All");
  const [remove, setRemove] = useState<ServiceRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { workspace, demo } = useWorkspace();
  const canEdit =
    !demo && ["OWNER", "ADMIN", "EDITOR"].includes(workspace?.role || "");
  const client = useQueryClient();
  const router = useRouter();
  const filtered = rows.filter((r) => filter === "All" || r.status === filter);
  const searchText = useCallback(
    (r: ServiceRow) => `${r.service} ${r.status} ${r.regions.join(" ")}`,
    [],
  );
  async function change(action: string, service: string) {
    if (!id) return;
    setBusy(true);
    setError("");
    try {
      await backend(`/aws/connections/${id}/inventory/edits`, {
        method: "POST",
        body: { action, service },
      });
      await Promise.all([
        client.invalidateQueries({ queryKey: ["inventory", id] }),
        client.invalidateQueries({ queryKey: ["revisions", id] }),
      ]);
      setAdding(false);
      setNewName("");
      setRemove(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }
  async function createContextChat(service: string) {
    if (!context.scan_id) return;
    try {
      const chat = await backend<Chat>("/chats", {
        method: "POST",
        body: {
          scan_id: context.scan_id,
          title: `${service.toUpperCase()} · AWS Service Chat`,
          context: {
            context_type: "SERVICE",
            service,
            label: service.toUpperCase(),
            scan_id: context.scan_id,
          },
        },
      });
      router.push(`/assistant?chat=${chat.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create chat");
    }
  }
  const columns: Column<ServiceRow>[] = [
    {
      key: "name",
      header: "Service",
      render: (r) => (
        <>
          <div className="table-primary">{r.service.toUpperCase()}</div>
          <div className="table-secondary">{r.source.replaceAll("_", " ")}</div>
        </>
      ),
    },
    {
      key: "status",
      header: "Inventory state",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "count",
      header: "Resources",
      render: (r) => <strong>{r.count}</strong>,
    },
    {
      key: "regions",
      header: "Regions",
      render: (r) => (
        <span>{r.regions.length ? r.regions.join(", ") : "Not detected"}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/inventory/services/${encodeURIComponent(r.service)}`}
            className="btn sm"
          >
            Details
          </Link>
          <Button
            size="sm"
            disabled={demo || r.status === "Removed by user"}
            onClick={() => void createContextChat(r.service)}
            title="Investigate in AI Assistant"
          >
            <MessageCircle size={13} />
          </Button>
          {r.status === "Removed by user" ? (
            <Button
              size="sm"
              disabled={!canEdit || busy}
              onClick={() => void change(r.restoreAction, r.service)}
            >
              Restore
            </Button>
          ) : (
            <Button
              size="sm"
              variant="danger"
              disabled={!canEdit || busy}
              onClick={() => setRemove(r)}
            >
              Remove
            </Button>
          )}
        </div>
      ),
    },
  ];
  return (
    <>
      <div className="panel-title-row">
        <div>
          <h2 className="card-heading">AWS Services</h2>
          <p className="card-description">
            AWS-discovered, manually added, and previously excluded services. No
            predefined service catalog or Primary/Secondary categories.
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          disabled={!canEdit}
          onClick={() => setAdding((v) => !v)}
        >
          <Plus size={14} />
          Add Service
        </Button>
      </div>
      {error && <div className="alert danger mb-3">{error}</div>}
      {adding && (
        <form
          className="flex items-end gap-3 mb-4 flex-wrap"
          onSubmit={(e) => {
            e.preventDefault();
            const name = newName.trim().toLowerCase();
            if (!/^[a-z0-9-]{2,100}$/.test(name)) {
              setError("Use a valid AWS service namespace (example: ecs).");
              return;
            }
            void change("ADD_SERVICE", name);
          }}
        >
          <div className="flex-1 max-w-sm">
            <label className="form-label" htmlFor="serviceName">
              AWS service namespace
            </label>
            <Input
              id="serviceName"
              placeholder="e.g. ecs"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <Button type="submit" variant="primary" disabled={busy}>
            Add to inventory
          </Button>
          <span className="small-note">Does not create anything in AWS.</span>
        </form>
      )}
      <DataTable
        rows={filtered}
        columns={columns}
        searchText={searchText}
        filter={
          <Select
            className="max-w-[195px]"
            aria-label="Filter services"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {[
              "All",
              "Resources detected",
              "No resources detected",
              "Added by user",
              "Removed by user",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Select>
        }
      />
      <ConfirmDialog
        open={!!remove}
        title={`Remove ${remove?.service || ""} from effective inventory?`}
        description="This is an inventory-only change. It will not delete the AWS service, account configuration, or any AWS resources. The action is recorded in revision history."
        confirmLabel="Remove from inventory"
        busy={busy}
        onConfirm={() => {
          if (remove) void change("EXCLUDE_SERVICE", remove.service);
        }}
        onClose={() => setRemove(null)}
      />
    </>
  );
}
function ResourcesTab({
  resources,
  scan,
}: {
  resources: AwsResource[];
  scan: Scan;
}) {
  const [service, setService] = useState("All");
  const [selected, setSelected] = useState<AwsResource | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const { demo } = useWorkspace();
  const services = [
    ...new Set(resources.map((r) => r.service || "").filter(Boolean)),
  ].sort();
  const filtered =
    service === "All"
      ? resources
      : resources.filter((r) => r.service === service);
  const columns: Column<AwsResource>[] = [
    {
      key: "id",
      header: "Resource",
      render: (r) => (
        <>
          <div
            className="table-primary max-w-[260px] truncate"
            title={r.resource_id || r.arn}
          >
            {r.resource_id || r.arn || "—"}
          </div>
          <div className="table-secondary">
            {r.resource_type || "Unknown type"}
          </div>
        </>
      ),
    },
    {
      key: "service",
      header: "Service",
      render: (r) => <b>{r.service?.toUpperCase() || "—"}</b>,
    },
    {
      key: "region",
      header: "Region",
      render: (r) => r.region || "Global / Unknown",
    },
    {
      key: "verified",
      header: "Verification",
      render: (r) => <StatusBadge status={r.verification_status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setSelected(r)}>
            Details
          </Button>
          <Button
            size="sm"
            disabled={demo}
            onClick={() =>
              void (async () => {
                try {
                  const chat = await backend<Chat>("/chats", {
                    method: "POST",
                    body: {
                      scan_id: scan.scan_id,
                      title: `${r.resource_id || "Resource"} · Resource Chat`,
                      context: {
                        context_type: "RESOURCE",
                        label: r.resource_id || r.arn,
                        resource_id: r.resource_id,
                        arn: r.arn,
                        service: r.service,
                        region: r.region,
                        resource_type: r.resource_type,
                      },
                    },
                  });
                  router.push(`/assistant?chat=${chat.id}`);
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Unable to create chat",
                  );
                }
              })()
            }
          >
            <MessageCircle size={14} />
          </Button>
        </div>
      ),
    },
  ];
  return (
    <>
      <div className="panel-title-row">
        <div>
          <h2 className="card-heading">AWS Resources</h2>
          <p className="card-description">
            Read-only AWS-discovered records. Resource editing is not supported.
          </p>
        </div>
        <Button
          onClick={() =>
            downloadCsv(
              "aws-resources.csv",
              [
                "service",
                "resource_id",
                "arn",
                "resource_type",
                "region",
                "source",
                "verification",
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
          size="sm"
          disabled={!resources.length}
        >
          <Download size={14} />
          Export CSV
        </Button>
      </div>
      {error && <div className="alert danger mb-3">{error}</div>}
      <DataTable
        rows={filtered}
        columns={columns}
        searchText={(r) =>
          [r.resource_id, r.arn, r.service, r.region, r.resource_type].join(" ")
        }
        filter={
          <Select
            className="max-w-[170px]"
            aria-label="Filter by service"
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option value="All">All services</option>
            {services.map((v) => (
              <option key={v} value={v}>
                {v.toUpperCase()}
              </option>
            ))}
          </Select>
        }
      />
      {selected && (
        <div className="card card-body mt-4">
          <div className="panel-title-row">
            <h3 className="card-heading">Resource detail</h3>
            <Button size="sm" onClick={() => setSelected(null)}>
              Close
            </Button>
          </div>
          <pre className="code-box">{JSON.stringify(selected, null, 2)}</pre>
        </div>
      )}
    </>
  );
}
function RegionsTab({
  regions,
  resources,
}: {
  regions: AwsRegion[];
  resources: AwsResource[];
}) {
  const counts = useMemo(
    () =>
      resources.reduce<Record<string, number>>((o, r) => {
        if (r.region) o[r.region] = (o[r.region] || 0) + 1;
        return o;
      }, {}),
    [resources],
  );
  const cols: Column<AwsRegion>[] = [
    {
      key: "region",
      header: "AWS Region",
      render: (r) => <b>{r.region_name || r.region}</b>,
    },
    {
      key: "enabled",
      header: "Region state",
      render: (r) => (
        <StatusBadge
          status={
            r.enabled === true
              ? "Enabled"
              : r.enabled === false
                ? "Not enabled"
                : "Unknown"
          }
        />
      ),
    },
    {
      key: "count",
      header: "Discovered resources",
      render: (r) => counts[r.region_name || r.region || ""] || 0,
    },
    {
      key: "optin",
      header: "Opt-in status",
      render: (r) => r.opt_in_status || "—",
    },
  ];
  return (
    <>
      <div className="panel-title-row">
        <div>
          <div className="card-heading">AWS Regions</div>
          <p className="card-description">
            Read-only Region discovery and raw resource counts.
          </p>
        </div>
      </div>
      <div className="alert mb-4">
        A Region with zero detected resources is not guaranteed to be empty. AWS
        default infrastructure may appear in resource inventory.
      </div>
      <DataTable
        rows={regions}
        columns={cols}
        searchText={(r) => `${r.region_name || r.region} ${r.opt_in_status}`}
      />
    </>
  );
}
function HistoryTab({
  revisions,
  scan,
}: {
  revisions: Revision[];
  scan: Scan;
}) {
  return (
    <>
      <div className="card-heading mb-1">Scan & Update History</div>
      <p className="card-description mb-5">
        Auto scans, user service edits and MCP enrichment can be tracked by
        inventory revision.
      </p>
      <DataTable
        rows={revisions}
        columns={[
          {
            key: "version",
            header: "Version",
            render: (r) => <b>#{r.revision ?? "—"}</b>,
          },
          {
            key: "time",
            header: "Timestamp",
            render: (r) => when(r.changed_at),
          },
          {
            key: "type",
            header: "Update type",
            render: (r) => r.change_type || "—",
          },
          {
            key: "action",
            header: "Action",
            render: (r) =>
              r.change?.action ||
              r.change?.source ||
              r.change?.operation ||
              "—",
          },
          {
            key: "target",
            header: "Affected",
            render: (r) =>
              r.change?.target || r.change?.scan_id || r.change?.service || "—",
          },
        ]}
      />
      {scan.warnings?.length ? (
        <div className="alert warning mt-4">
          {scan.warnings.length} scan warnings were reported. Review backend
          evidence before considering the scan complete.
        </div>
      ) : null}
    </>
  );
}

function BillingTab({ scan }: { scan: Scan }) {
  const billing = scan.billing;

  // The AWS Cost Explorer "Billing Service" field contains the actual
  // billing display name (e.g. "Amazon Relational Database Service").
  // Prefer it over an inventory namespace such as "rds".
  // Normalize field names because the backend may use spaces, snake_case,
  // or camelCase. No predefined AWS service-name mappings are required.
  const getAwsServiceName = (row: Record<string, unknown>): string => {
    const entries = Object.entries(row);
    const normalized = (key: string) =>
      key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

    for (const fieldName of [
      "billingservice",
      "billingservicename",
      "service",
      "servicename",
    ]) {
      const entry = entries.find(
        ([key, value]) =>
          normalized(key) === fieldName &&
          typeof value === "string" &&
          value.trim().length > 0,
      );
      if (entry) return (entry[1] as string).trim();
    }

    return "AWS service name unavailable";
  };

  // Convert backend field names into readable labels.
  // Example: usage_type -> Usage Type
  // Example: billingPeriod -> Billing Period
  const formatLabel = (key: string): string =>
    key
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());

  // Convert any backend value into readable text.
  // Never display raw JSON to the end user.
  const formatValue = (value: unknown, depth = 0): string => {
    if (value === null || value === undefined || value === "") {
      return "Not provided";
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (typeof value === "number") {
      return value.toLocaleString("en-US");
    }

    if (typeof value === "string") {
      return value;
    }

    if (depth >= 3) {
      return "Additional structured information";
    }

    if (Array.isArray(value)) {
      return value.length
        ? value.map((item) => formatValue(item, depth + 1)).join(", ")
        : "No entries";
    }

    if (typeof value === "object") {
      const fields = Object.entries(value);

      return fields.length
        ? fields
            .map(
              ([key, item]) =>
                `${formatLabel(key)}: ${formatValue(item, depth + 1)}`,
            )
            .join(" • ")
        : "No additional details";
    }

    return String(value);
  };

  // Get actual amount, including numeric strings returned
  // by billing APIs.
  const getAmount = (row: Record<string, unknown>) => {
    const raw =
      row.cost ?? row.amount ?? row.total_cost ?? row.Cost ?? row.Amount;

    if (typeof raw === "number" && Number.isFinite(raw)) {
      return raw;
    }

    if (
      typeof raw === "string" &&
      raw.trim() !== "" &&
      Number.isFinite(Number(raw))
    ) {
      return Number(raw);
    }

    return null;
  };

  // Render every additional billing field as a readable
  // label/value pair instead of exposing JSON.
  const renderBillingEvidence = (row: Record<string, unknown>) => {
    const excludedKeys = new Set([
      "billingservice", // Already shown in the AWS Service column
      "billingservicename",
      "service",
      "servicename",
      "cost",
      "amount",
      "totalcost",
    ]);

    const fields = Object.entries(row)
      .filter(([key, value]) => {
        const normalizedKey = key.replace(/[_\s-]/g, "").toLowerCase();

        return (
          !excludedKeys.has(normalizedKey) &&
          value !== null &&
          value !== undefined &&
          value !== ""
        );
      })
      .map(([key, value]) => ({
        label: formatLabel(key),
        value: formatValue(value),
      }));

    if (fields.length === 0) {
      return (
        <div className="text-xs text-slate-600 leading-relaxed">
          <p className="font-medium text-slate-700">Billing record available</p>
          <p className="text-slate-500 mt-1">
            This service appears in the AWS billing data. No additional usage or
            Region details were provided.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2 text-xs">
        {fields.slice(0, 3).map((field, index) => (
          <div key={`${field.label}-${index}`}>
            <span className="font-semibold text-slate-700">{field.label}:</span>{" "}
            <span className="text-slate-600 break-words">{field.value}</span>
          </div>
        ))}

        {fields.length > 3 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-blue-600 font-medium">
              View {fields.length - 3} more billing details
            </summary>

            <div className="mt-3 space-y-2 border-l-2 border-blue-100 pl-3">
              {fields.slice(3).map((field, index) => (
                <div key={`${field.label}-${index}`}>
                  <span className="font-semibold text-slate-700">
                    {field.label}:
                  </span>{" "}
                  <span className="text-slate-600 break-words">
                    {field.value}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="card-heading mb-1">AWS Billing & Cost</div>

      <p className="card-description mb-5">
        Review actual AWS billing information, including service costs and any
        usage, Region, or billing period details returned by the backend.
        Billing costs do not independently establish workload activity or
        business criticality.
      </p>

      {!billing ? (
        <EmptyState
          title="Billing snapshot unavailable"
          description="No billing information was returned for this discovery scan. This does not mean your AWS spending is zero."
        />
      ) : !billing.available ? (
        <div className="alert warning">
          <div>
            <strong>Billing information unavailable</strong>
            <p className="mt-1">
              AWS billing could not be retrieved. Costs must remain unknown
              rather than showing $0.00.
            </p>
            {billing.warnings?.length ? (
              <ul className="mt-2 list-disc pl-5">
                {billing.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <div className="simple-split mb-5">
            <div className="card card-body">
              <div className="metric-label">Current Period Cost</div>

              <div className="metric-value">
                {money(billing.total_cost, billing.currency)}
              </div>

              <p className="text-xs text-slate-500 mt-2">
                Total amount reported for the billing period.
              </p>
            </div>

            <div className="card card-body">
              <div className="metric-label">Services in Billing Report</div>

              <div className="metric-value">
                {billing.service_costs?.length ?? 0}
              </div>

              <p className="text-xs text-slate-500 mt-2">
                Number of service billing records returned by AWS.
              </p>
            </div>
          </div>

          {billing.warnings?.length ? (
            <div className="alert warning mb-4">
              Some billing evidence includes warnings. Review the information
              before treating the report as complete.
            </div>
          ) : null}

          {billing.service_costs?.length ? (
            <DataTable
              rows={billing.service_costs}
              searchText={(row) =>
                [
                  getAwsServiceName(row),
                  ...Object.entries(row).map(
                    ([key, value]) =>
                      `${formatLabel(key)} ${formatValue(value)}`,
                  ),
                ].join(" ")
              }
              columns={[
                {
                  key: "service",
                  header: "AWS Service",
                  render: (row) => (
                    <div>
                      <div className="font-semibold text-slate-800">
                        {getAwsServiceName(row)}
                      </div>

                      <p className="text-[11px] text-slate-500 mt-1">
                        Service name reported by AWS Billing
                      </p>
                    </div>
                  ),
                },
                {
                  key: "cost",
                  header: "Billed Amount",
                  render: (row) => {
                    const amount = getAmount(row);

                    const currency =
                      typeof row.currency === "string"
                        ? row.currency
                        : billing.currency;

                    return (
                      <div>
                        <span className="font-semibold text-slate-800">
                          {amount !== null
                            ? money(amount, currency)
                            : "Unknown"}
                        </span>

                        <p className="text-[11px] text-slate-500 mt-1">
                          Reported service cost
                        </p>
                      </div>
                    );
                  },
                },
                {
                  key: "data",
                  header: "Billing Evidence & Explanation",
                  render: (row) => renderBillingEvidence(row),
                },
              ]}
            />
          ) : (
            <EmptyState
              title="No billed service records"
              description="Billing access is available, but the backend returned no service cost records for the selected period."
            />
          )}
        </>
      )}
    </>
  );
}
