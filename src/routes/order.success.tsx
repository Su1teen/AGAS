// localized-ui
import { tr, useUi } from "@/lib/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Container } from "@/components/site/Container";
export const Route = createFileRoute("/order/success")({
  component: () => (
    <Container>
      <div className="invoice-flow platform-panel">
        <h1>{tr("Ваши заказы и счета")}</h1>
        <p>{tr("Статус заказа и сохранённые документы доступны в личном кабинете.")}</p>
        <Link className="platform-primary" to="/account/orders">
          {tr("Открыть историю")}
        </Link>
      </div>
    </Container>
  ),
});
