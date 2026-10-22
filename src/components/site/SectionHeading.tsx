// localized-ui
import { tr, useUi } from "@/lib/ui";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
export function SectionHeading({
  eyebrow,
  title,
  description,
  actionLabel,
  actionTo,
  align = "row",
  centered = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
  align?: "row" | "column";
  centered?: boolean;
}) {
  useUi();
  return (
    <div
      className={
        centered
          ? "mb-12 flex flex-col items-center justify-center gap-3"
          : align === "row"
            ? "mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end"
            : "mb-12 flex flex-col items-start gap-3"
      }
    >
      <div
        className={
          centered ? "max-w-2xl mx-auto flex flex-col items-center text-center" : "max-w-2xl"
        }
      >
        {tr(eyebrow && <span className="eyebrow block">{tr(eyebrow)}</span>)}
        <h2 className="mt-3 font-serif text-4xl leading-[1.05] text-foreground md:text-5xl">
          {tr(title)}
        </h2>
        {tr(
          description && (
            <p className="mt-4 max-w-[48ch] text-base text-ink-soft text-pretty">
              {tr(description)}
            </p>
          ),
        )}
      </div>
      {tr(
        actionLabel && actionTo && (
          <Link
            to={actionTo}
            className="group inline-flex shrink-0 items-center gap-2 border-b border-border pb-1.5 text-sm font-medium text-foreground transition-colors hover:border-foreground"
          >
            {tr(actionLabel)}
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        ),
      )}
    </div>
  );
}
