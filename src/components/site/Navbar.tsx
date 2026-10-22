// localized-ui
import { tr, useUi } from "@/lib/ui";
import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Heart, ShoppingBag, User, Menu } from "lucide-react";
import { useState } from "react";
import { UiControls } from "@/components/UiControls";
import { Container } from "./Container";
import { useCart } from "@/store/cart";
import { useFavorites } from "@/store/favorites";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { catalogGroups } from "@/data/categories";
const navLinks = [
  { to: "/catalog", label: "Каталог" },
  { to: "/category/lighting", label: "Свет" },
  { to: "/category/control", label: "Управление" },
  { to: "/category/security", label: "Безопасность" },
  { to: "/category/hubs-networking", label: "B2B" },
  { to: "/subscriptions", label: "Подписка" },
];
export function Navbar() {
  useUi();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const cartCount = useCart((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));
  const favCount = useFavorites((s) => s.ids.length);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <Container>
        <div className="flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-10">
            <Link to="/" className="font-serif text-2xl tracking-tight">
              AGAS
            </Link>
            <nav className="hidden items-center gap-7 xl:flex">
              {tr(
                navLinks.map((link) => {
                  const active =
                    link.to === "/catalog" ? pathname === "/catalog" : pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="text-[13px] font-medium tracking-tight text-ink-soft transition-colors hover:text-foreground data-[active=true]:text-foreground"
                      data-active={active}
                    >
                      {tr(link.label)}
                    </Link>
                  );
                }),
              )}
              <div className="group relative">
                <button className="text-[13px] font-medium tracking-tight text-ink-soft transition-colors hover:text-foreground">
                  {tr("Категории")}
                </button>
                <div className="pointer-events-none absolute left-1/2 top-full w-[720px] -translate-x-1/2 pt-5 opacity-0 transition-all duration-300 group-hover:pointer-events-auto group-hover:opacity-100">
                  <div className="grid grid-cols-2 gap-8 rounded-3xl border border-border bg-background/95 p-8 shadow-2xl shadow-foreground/5 backdrop-blur-xl">
                    {tr(
                      catalogGroups.map((group) => (
                        <div key={group.slug}>
                          <div className="mb-4">
                            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-soft">
                              {tr(group.shortTitle)}
                            </p>
                            <p className="mt-1 font-serif text-xl text-foreground">
                              {tr(group.title)}
                            </p>
                          </div>
                          <div className="grid gap-2">
                            {tr(
                              group.categories.map((category) => (
                                <Link
                                  key={category.slug}
                                  to="/category/$slug"
                                  params={{ slug: category.slug }}
                                  className="rounded-2xl border border-transparent p-3 transition-colors hover:border-border hover:bg-surface"
                                >
                                  <span className="block text-sm font-medium text-foreground">
                                    {tr(category.shortTitle)}
                                  </span>
                                  <span className="mt-1 line-clamp-1 block text-xs text-ink-soft">
                                    {tr(category.tagline)}
                                  </span>
                                </Link>
                              )),
                            )}
                          </div>
                        </div>
                      )),
                    )}
                  </div>
                </div>
              </div>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <UiControls />
            <button
              aria-label={tr("Поиск")}
              className="hidden h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface md:flex"
            >
              <Search className="size-[18px]" strokeWidth={1.5} />
            </button>
            <Link
              to="/favorites"
              aria-label={tr("Избранное")}
              className="relative hidden h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface md:flex"
            >
              <Heart className="size-[18px]" strokeWidth={1.5} />
              {tr(
                favCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-medium text-background">
                    {tr(favCount)}
                  </span>
                ),
              )}
            </Link>
            <Link
              to="/account"
              aria-label={tr("Профиль")}
              className="hidden h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface md:flex"
            >
              <User className="size-[18px]" strokeWidth={1.5} />
            </Link>
            <Link
              to="/cart"
              className="ml-1 flex h-9 items-center gap-2 rounded-full bg-foreground px-4 text-[13px] font-medium text-background transition-transform hover:scale-[1.02]"
            >
              <ShoppingBag className="size-[15px]" strokeWidth={1.7} />
              <span className="hidden sm:inline">{tr("Корзина")}</span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/15 px-1.5 text-[10px] font-medium">
                {tr(cartCount)}
              </span>
            </Link>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label={tr("Меню")}
                  className="ml-1 flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface xl:hidden"
                >
                  <Menu className="size-[18px]" strokeWidth={1.5} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-background">
                <SheetHeader>
                  <SheetTitle className="font-serif text-2xl">AGAS</SheetTitle>
                </SheetHeader>
                <nav className="mt-8 flex flex-col gap-1">
                  {tr(
                    navLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-md px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-surface"
                      >
                        {tr(link.label)}
                      </Link>
                    )),
                  )}
                  {tr(
                    catalogGroups.map((group) => (
                      <div key={group.slug} className="mt-4">
                        <p className="px-3 text-[10px] font-medium uppercase tracking-[0.22em] text-ink-soft">
                          {tr(group.title)}
                        </p>
                        <div className="mt-2 grid gap-1">
                          {tr(
                            group.categories.map((category) => (
                              <Link
                                key={category.slug}
                                to="/category/$slug"
                                params={{ slug: category.slug }}
                                onClick={() => setMobileOpen(false)}
                                className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                              >
                                {tr(category.title)}
                              </Link>
                            )),
                          )}
                        </div>
                      </div>
                    )),
                  )}
                  <div className="my-3 h-px bg-border" />
                  <Link
                    to="/favorites"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-3 text-base font-medium text-ink-soft transition-colors hover:bg-surface"
                  >
                    {tr("Избранное")}
                  </Link>
                  <Link
                    to="/account"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-3 text-base font-medium text-ink-soft transition-colors hover:bg-surface"
                  >
                    {tr("Профиль")}
                  </Link>
                  <Link
                    to="/delivery"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-3 text-base font-medium text-ink-soft transition-colors hover:bg-surface"
                  >
                    {tr("Доставка")}
                  </Link>
                  <Link
                    to="/support"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-3 text-base font-medium text-ink-soft transition-colors hover:bg-surface"
                  >
                    {tr("Поддержка")}
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </Container>
    </header>
  );
}
