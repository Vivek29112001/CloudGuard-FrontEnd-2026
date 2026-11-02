import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "default" | "sm";
};
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "secondary", size = "default", className, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={cn(
          "btn",
          variant === "secondary" ? "" : variant,
          size === "sm" ? "sm" : "",
          className,
        )}
        {...props}
      />
    );
  },
);
