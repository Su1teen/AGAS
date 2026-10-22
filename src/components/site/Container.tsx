// localized-ui
import { tr, useUi } from "@/lib/ui";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
export function Container({
  children,
  className,
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide";
}) {
  useUi();
  return (
    <div
      className={cn(
        "mx-auto px-6 md:px-8",
        size === "narrow" && "max-w-4xl",
        size === "default" && "max-w-7xl",
        size === "wide" && "max-w-[1440px]",
        className,
      )}
    >
      {tr(children)}
    </div>
  );
}
