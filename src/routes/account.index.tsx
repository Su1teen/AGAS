// localized-ui
import { tr, useUi } from "@/lib/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useResource, type User } from "@/lib/platform";
export const Route = createFileRoute("/account/")({ component: Profile });
function Profile() {
  useUi();
  const { data, error } = useResource<User | null>("/auth/me", null);
  return (
    <section className="platform-panel">
      <h2>{tr("Профиль")}</h2>
      {tr(
        error && (
          <p className="platform-error" role="alert">
            {tr(error)}
          </p>
        ),
      )}
      {tr(
        data && (
          <dl className="invoice-details">
            <div>
              <dt>{tr("Имя")}</dt>
              <dd>{tr(data.name)}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{tr(data.email)}</dd>
            </div>
          </dl>
        ),
      )}
      <p className="invoice-note">
        {tr("Данные получателя и адрес можно указать для каждого заказа при формировании счёта.")}
      </p>
    </section>
  );
}
