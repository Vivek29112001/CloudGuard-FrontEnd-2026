import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <section className={cn("card", className)} {...rest} />;
}
export function CardContent({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-body", className)} {...rest} />;
}
