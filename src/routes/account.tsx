// localized-ui
import { tr, useUi } from "@/lib/ui";
import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Container } from "@/components/site/Container";
import { PlatformAuth } from "@/components/PlatformAuth";
import { api, type User } from "@/lib/platform";
export const Route = createFileRoute("/account")({ component: Account });
function Account() {
  useUi();
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    api<User>("/auth/me")
      .then((u) => setUser(u.guest ? null : u))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Container>
      <div className="invoice-flow">
        <header className="invoice-heading">
          <span className="eyebrow">{tr("ЛИЧНЫЙ КАБИНЕТ")}</span>
          <h1>{tr(user ? `Здравствуйте, ${user.name}` : "Ваши заказы и документы")}</h1>
        </header>
        {tr(
          error && (
            <p className="platform-error" role="alert">
              {tr(error)}
            </p>
          ),
        )}
        {tr(
          loading ? (
            <p>{tr("Загрузка\u2026")}</p>
          ) : !user ? (
            <PlatformAuth onSuccess={setUser} />
          ) : (
            <>
              <nav className="platform-actions">
                <Link className="platform-secondary" to="/account">
                  {tr("Профиль")}
                </Link>
                <Link className="platform-secondary" to="/account/orders">
                  {tr("Заказы и счета")}
                </Link>
                <Link className="platform-secondary" to="/account/addresses">
                  {tr("Адреса")}
                </Link>
                <button className="platform-link" onClick={logout}>
                  {tr("Выйти")}
                </button>
              </nav>
              <Outlet />
            </>
          ),
        )}
      </div>
    </Container>
  );
}
