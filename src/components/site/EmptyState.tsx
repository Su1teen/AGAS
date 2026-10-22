// localized-ui
import { tr, useUi } from "@/lib/ui";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionTo,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  useUi();
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface/60 px-8 py-24 text-center">
      {tr(
        icon && (
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-background text-ink-soft ring-1 ring-border">
            {tr(icon)}
          </div>
        ),
      )}
      <h3 className="font-serif text-3xl text-foreground">{tr(title)}</h3>
      <p className="mt-3 max-w-md text-sm text-ink-soft text-pretty">{tr(description)}</p>
      {tr(
        actionLabel && actionTo && (
          <Link
            to={actionTo}
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background"
          >
            {tr(actionLabel)}
          </Link>
        ),
      )}
    </div>
  );
}
