import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { count } from "@/lib/utils/format";
export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "blue",
  description,
}: {
  label: string;
  value: number | string | null | undefined;
  icon: LucideIcon;
  tone?: "blue" | "red" | "yellow" | "green";
  description?: string;
}) {
  return (
    <Card className="metric-card">
      <span className={`metric-icon ${tone}`}>
        <Icon size={23} strokeWidth={2.3} />
      </span>
      <div>
        <div className="metric-label">{label}</div>
        <div className="metric-value">
          {typeof value === "number" ? count(value) : value || "—"}
        </div>
        <div className="metric-meta">
          {description || "Based on available evidence"}
        </div>
      </div>
    </Card>
  );
}
