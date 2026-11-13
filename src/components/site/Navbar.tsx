// localized-ui
import { tr, useUi } from "@/lib/ui";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Heart, ShoppingBag, User, Menu, ChevronDown } from "lucide-react";
import { useState } from "react";
import { UiControls } from "@/components/UiControls";
import { Container } from "./Container";
import { useCart } from "@/store/cart";
import { useFavorites } from "@/store/favorites";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { catalogGroups, shoppingCategories } from "@/data/categories";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
export function Navbar() {
  useUi();
  const navigate = useNavigate();
  const cartCount = useCart((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));
  const favCount = useFavorites((s) => s.ids.length);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <Container>
        <div className="flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-10">
            <Link to="/" className="font-serif text-2xl tracking-tight">
              AGAS
            </Link>
            <nav aria-label={tr("Разделы магазина")} className="hidden items-center gap-5 xl:flex">
              <Link to="/catalog" className="text-sm font-medium hover:underline">
                {tr("Каталог")}
              </Link>
              {shoppingCategories.map((category) => (
                <Link
                  key={category.slug}
                  to="/category/$slug"
                  params={{ slug: category.slug }}
                  className="text-sm text-ink-soft hover:text-foreground data-[status=active]:font-semibold data-[status=active]:text-foreground"
                >
                  {tr(category.shortTitle)}
                </Link>
              ))}
              <Popover open={categoriesOpen} onOpenChange={setCategoriesOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-foreground">
                    {tr("Все разделы")}
                    <ChevronDown size={15} />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="center"
                  className="max-h-[75vh] w-[650px] overflow-y-auto rounded-2xl bg-background p-6"
                >
                  <div className="grid grid-cols-2 gap-6">
                    {tr(
                      catalogGroups.map((group) => (
                        <div key={group.slug}>
                          <div className="mb-4">
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
                                  onClick={() => setCategoriesOpen(false)}
                                  className="rounded-xl border border-transparent px-3 py-2 transition-colors hover:border-border hover:bg-surface"
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
                </PopoverContent>
              </Popover>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <UiControls />
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <button
                  aria-label={tr("Поиск")}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface"
                >
                  <Search className="size-[18px]" strokeWidth={1.5} />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[min(20rem,90vw)] bg-background">
                <form
                  role="search"
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const q = String(new FormData(event.currentTarget).get("q") || "").trim();
                    setSearchOpen(false);
                    void navigate({ to: "/catalog", search: { q, all: !q } });
                  }}
                >
                  <input
                    name="q"
                    type="search"
                    maxLength={120}
                    aria-label={tr("Поиск товаров")}
                    placeholder={tr("Название, бренд или артикул")}
                    className="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-sm"
                  />
                  <button
                    aria-label={tr("Найти")}
                    className="rounded-lg bg-foreground px-3 text-background"
                  >
                    <Search size={17} />
                  </button>
                </form>
              </PopoverContent>
            </Popover>
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
              <SheetContent side="right" className="w-80 overflow-y-auto bg-background">
                <SheetHeader>
                  <SheetTitle className="font-serif text-2xl">AGAS</SheetTitle>
                </SheetHeader>
                <nav className="mt-8 flex flex-col gap-1">
                  <Link
                    to="/catalog"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-3 text-base font-medium hover:bg-surface"
                  >
                    {tr("Каталог")}
                  </Link>
                  <Link
                    to="/subscriptions"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-3 text-base font-medium hover:bg-surface"
                  >
                    {tr("Подписка")}
                  </Link>
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
