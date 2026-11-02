import { Badge } from "@/components/ui/badge";
export function StatusBadge({ status }: { status?: string | null }) {
  const value = (status || "UNKNOWN").toUpperCase();
  const tone = /^(VERIFIED|SUCCESS|COMPLETED|AVAILABLE|CONNECTED)$/.test(value)
    ? "success"
    : /^(ERROR|FAILED|DENIED|ACCESS_DENIED|EXCLUDED|REMOVED BY USER)$/.test(
          value,
        )
      ? "danger"
      : /^(INCOMPLETE|PENDING|PARTIAL|RUNNING|UNKNOWN|UNVERIFIED)$/.test(value)
        ? "warning"
        : "neutral";
  return <Badge tone={tone}>{status || "Unknown"}</Badge>;
}
