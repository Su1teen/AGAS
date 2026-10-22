// localized-ui
import { tr, useUi } from "@/lib/ui";
import { Link } from "@tanstack/react-router";
import { Container } from "./Container";
export function Footer() {
  useUi();
  return (
    <footer className="mt-32 border-t border-border bg-surface">
      <Container>
        <div className="grid grid-cols-2 gap-10 py-20 lg:grid-cols-12">
          <div className="col-span-2 lg:col-span-4">
            <Link to="/" className="font-serif text-3xl tracking-tight">
              AGAS
            </Link>
            <p className="mt-6 max-w-[34ch] text-sm text-ink-soft text-pretty">
              {tr(
                "Спокойная архитектура умного дома. Официальный дистрибьютор AGAS Smart Systems в Республике Казахстан.",
              )}
            </p>
            <p className="mt-6 text-xs text-ink-soft">
              {tr("Астана, ул. Достык, 16")}
              <br />
              {tr("Ежедневно 10:00 \u2014 21:00")}
            </p>
          </div>

          <div>
            <h5 className="eyebrow">{tr("Каталог")}</h5>
            <ul className="mt-6 space-y-3 text-sm text-ink-soft">
              <li>
                <Link to="/catalog" className="transition-colors hover:text-foreground">
                  {tr("Все товары")}
                </Link>
              </li>
              <li>
                <Link
                  to="/category/$slug"
                  params={{ slug: "lighting" }}
                  className="transition-colors hover:text-foreground"
                >
                  {tr("Освещение")}
                </Link>
              </li>
              <li>
                <Link
                  to="/category/$slug"
                  params={{ slug: "audio" }}
                  className="transition-colors hover:text-foreground"
                >
                  {tr("Акустика")}
                </Link>
              </li>
              <li>
                <Link
                  to="/category/$slug"
                  params={{ slug: "climate" }}
                  className="transition-colors hover:text-foreground"
                >
                  {tr("Климат")}
                </Link>
              </li>
              <li>
                <Link
                  to="/category/$slug"
                  params={{ slug: "security" }}
                  className="transition-colors hover:text-foreground"
                >
                  {tr("Безопасность")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="eyebrow">{tr("Сервис")}</h5>
            <ul className="mt-6 space-y-3 text-sm text-ink-soft">
              <li>
                <Link to="/delivery" className="transition-colors hover:text-foreground">
                  {tr("Доставка и оплата")}
                </Link>
              </li>
              <li>
                <Link to="/support" className="transition-colors hover:text-foreground">
                  {tr("Поддержка")}
                </Link>
              </li>
              <li>
                <Link to="/support" className="transition-colors hover:text-foreground">
                  {tr("Гарантия 3 года")}
                </Link>
              </li>
              <li>
                <Link to="/support" className="transition-colors hover:text-foreground">
                  {tr("Установка")}
                </Link>
              </li>
              <li>
                <Link to="/support" className="transition-colors hover:text-foreground">
                  {tr("Возврат")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="eyebrow">{tr("Аккаунт")}</h5>
            <ul className="mt-6 space-y-3 text-sm text-ink-soft">
              <li>
                <Link to="/account" className="transition-colors hover:text-foreground">
                  {tr("Профиль")}
                </Link>
              </li>
              <li>
                <Link to="/account/orders" className="transition-colors hover:text-foreground">
                  {tr("История заказов")}
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="transition-colors hover:text-foreground">
                  {tr("Избранное")}
                </Link>
              </li>
              <li>
                <Link to="/compare" className="transition-colors hover:text-foreground">
                  {tr("Сравнение")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-2">
            <h5 className="eyebrow">{tr("Письма")}</h5>
            <p className="mt-6 text-sm text-ink-soft text-pretty">
              {tr("Раз в месяц \u2014 новые релизы и приватные коллекции.")}
            </p>
            <form
              className="mt-5 flex items-center gap-2 rounded-full border border-border bg-background pl-4 pr-1.5"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder={tr("Email")}
                className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-soft"
              />
              <button
                type="submit"
                className="h-8 rounded-full bg-foreground px-4 text-xs font-medium text-background"
              >
                OK
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-border py-8 text-xs text-ink-soft md:flex-row md:items-center">
          <span>© 2026 AGAS</span>
          <div className="flex flex-wrap gap-6">
            <a href="#" className="hover:text-foreground">
              {tr("Политика конфиденциальности")}
            </a>
            <a href="#" className="hover:text-foreground">
              {tr("Публичная оферта")}
            </a>
            <a href="#" className="hover:text-foreground">
              Instagram
            </a>
            <a href="#" className="hover:text-foreground">
              Telegram
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
