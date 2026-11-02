import { cn } from "@/lib/utils/cn";
export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "success" | "danger" | "warning" | "info" | "neutral";
  className?: string;
}) {
  return <span className={cn("badge", tone, className)}>{children}</span>;
}
