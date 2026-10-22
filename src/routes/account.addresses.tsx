// localized-ui
import { tr, useUi } from "@/lib/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useResource, type Invoice } from "@/lib/platform";
export const Route = createFileRoute("/account/addresses")({ component: Addresses });
function Addresses() {
  useUi();
  const { data, error, loading } = useResource<Invoice[]>("/invoices", []);
  const addresses = [
    ...new Set(data.map((i) => `${i.buyer.postalCode}, ${i.buyer.city}, ${i.buyer.address}`)),
  ];
  return (
    <section className="platform-panel">
      <h2>{tr("Адреса в ваших заказах")}</h2>
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
        ) : addresses.length ? (
          addresses.map((a) => (
            <p className="invoice-line" key={a}>
              {tr(a)}
            </p>
          ))
        ) : (
          <p>{tr("Адреса появятся после оформления первого счёта.")}</p>
        ),
      )}
    </section>
  );
}
