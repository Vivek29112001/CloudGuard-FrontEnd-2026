import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";
export function EmptyState({
  title,
  description,
  icon: Icon = Info,
  action,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-panel">
      <span className="empty-icon">
        <Icon size={25} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
