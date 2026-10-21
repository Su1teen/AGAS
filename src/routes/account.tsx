import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { Container } from "@/components/site/Container";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Профиль · AGAS" }] }),
  component: AccountLayout,
});

const links = [
  { to: "/account", label: "Профиль", exact: true },
  { to: "/account/orders", label: "История заказов" },
  { to: "/account/addresses", label: "Адреса" },
];

function AccountLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="py-12 md:py-16">
      <Container>
        <div className="mb-12 border-b border-border pb-8">
          <span className="eyebrow">Личный кабинет</span>
          <h1 className="mt-3 font-serif text-5xl text-foreground md:text-6xl">
            Добрый день, Айгерим
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <aside className="lg:col-span-3">
            <nav className="flex flex-col gap-1 lg:sticky lg:top-24">
              {links.map((l) => {
                const active = l.exact ? pathname === l.to : pathname.startsWith(l.to);
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm transition-colors",
                      active
                        ? "bg-surface font-medium text-foreground"
                        : "text-ink-soft hover:bg-surface/60 hover:text-foreground",
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
              <button className="mt-4 rounded-xl px-4 py-3 text-left text-sm text-ink-soft hover:text-foreground">
                Выйти
              </button>
            </nav>
          </aside>
          <div className="lg:col-span-9">
            <Outlet />
          </div>
        </div>
      </Container>
    </div>
  );
}
