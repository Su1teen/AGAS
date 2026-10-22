// localized-ui
import { tr, useUi } from "@/lib/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { API, money, useResource, type Invoice } from "@/lib/platform";
export const Route = createFileRoute("/account/orders")({ component: Orders });
function Orders() {
  useUi();
  const { data, error, loading } = useResource<Invoice[]>("/invoices", []);
  return (
    <section className="platform-panel">
      <h2>{tr("Заказы и счета")}</h2>
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
        ) : data.length ? (
          data.map((i) => (
            <article key={i.id} className="invoice-line">
              <div>
                <strong>{tr(i.number)}</strong>
                <small>
                  {tr(new Date(i.createdAt).toLocaleDateString("ru-RU"))} ·{" "}
                  {tr(i.lines.map((l) => `${l.name} × ${l.quantity}`).join(", "))}
                </small>
              </div>
              <span>{tr(money(i.totalMinor))}</span>
              <span className="platform-badge">{tr("Ожидает оплаты")}</span>
              <a
                className="platform-link"
                href={`${API}/api/invoices/${i.id}/pdf`}
                target="_blank"
                rel="noreferrer"
              >
                {tr("Открыть PDF \u2197")}
              </a>
            </article>
          ))
        ) : (
          <p>{tr("Пока нет сохранённых заказов.")}</p>
        ),
      )}
      <div className="platform-actions">
        <Link to="/checkout" className="platform-secondary">
          {tr("Счета и отправка по email")}
        </Link>
      </div>
    </section>
  );
}
