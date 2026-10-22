// localized-ui
import { tr, useUi } from "@/lib/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, FileText, Download, ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { Container } from "@/components/site/Container";
import { PlatformAuth } from "@/components/PlatformAuth";
import { useCart } from "@/store/cart";
import {
  API,
  api,
  money,
  useResource,
  type User,
  type Invoice,
  type PlatformConfig,
  type CatalogItem,
} from "@/lib/platform";
export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Счёт на оплату · AGAS" }] }),
  component: Checkout,
});
const emptyBuyer = {
  kind: "individual",
  name: "",
  email: "",
  phone: "",
  country: "KZ",
  city: "",
  address: "",
  postalCode: "",
  companyName: "",
  bin: "",
  bank: "",
  iban: "",
  bik: "",
};
const labels: Record<string, string> = {
  name: "Покупатель",
  email: "Email",
  phone: "Телефон",
  city: "Город",
  address: "Адрес",
  postalCode: "Индекс",
  companyName: "Организация",
  bin: "БИН",
  bank: "Банк",
  iban: "IBAN",
  bik: "БИК",
};
function Checkout() {
  useUi();
  useUi();
  const items = useCart((s) => s.items),
    clear = useCart((s) => s.clear);
  const [user, setUser] = useState<User | null>(null),
    [authLoaded, setAuthLoaded] = useState(false);
  const { data: config, error: configError } = useResource<PlatformConfig | null>("/config", null),
    { data: catalog } = useResource<CatalogItem[]>("/catalog", []);
  const [buyer, setBuyer] = useState(emptyBuyer),
    [delivery, setDelivery] = useState("pickup"),
    [review, setReview] = useState(false),
    [quote, setQuote] = useState<Invoice | null>(null),
    [invoice, setInvoice] = useState<Invoice | null>(null),
    [history, setHistory] = useState<Invoice[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const request = useRef<{
    key: string;
    body: string;
  } | null>(null);
  useEffect(() => {
    api<User>("/auth/me")
      .catch(() => api<User>("/auth/guest", { method: "POST" }))
      .then(setUser)
      .catch((e) => setError(e.message))
      .finally(() => setAuthLoaded(true));
  }, []);
  useEffect(() => {
    if (user) {
      if (!user.guest)
        setBuyer((b) => ({ ...b, name: b.name || user.name, email: b.email || user.email }));
      api<Invoice[]>("/invoices")
        .then(setHistory)
        .catch((e) => setError(e.message));
    }
  }, [user]);
  const body = () => ({
    buyer: Object.fromEntries(
      Object.entries(buyer).filter(
        ([k, v]) =>
          v !== "" &&
          (buyer.kind === "company" || !["companyName", "bin", "bank", "iban", "bik"].includes(k)),
      ),
    ),
    delivery,
    items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
  });
  async function preview(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      setQuote(await api<Invoice>("/quote", { method: "POST", body: JSON.stringify(body()) }));
      setReview(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function issue() {
    setBusy(true);
    setError("");
    const data = JSON.stringify(body());
    try {
      const fingerprint = Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data))),
      )
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("");
      if (request.current?.body !== fingerprint) {
        let pending: {
          key: string;
          body: string;
        } | null = null;
        try {
          pending = JSON.parse(sessionStorage.getItem("agas-pending-invoice") || "null");
        } catch {
          /* Storage can be unavailable in private browsing. */
        }
        request.current =
          pending?.body === fingerprint ? pending : { body: fingerprint, key: crypto.randomUUID() };
        try {
          sessionStorage.setItem("agas-pending-invoice", JSON.stringify(request.current));
        } catch {
          /* In-memory idempotency remains available. */
        }
      }
      const result = await api<Invoice>("/invoices", {
        method: "POST",
        headers: { "Idempotency-Key": request.current!.key },
        body: data,
      });
      setInvoice(result);
      setHistory((h) => [result, ...h.filter((i) => i.id !== result.id)]);
      try {
        sessionStorage.removeItem("agas-pending-invoice");
      } catch {
        /* No persisted key. */
      }
      request.current = null;
      clear();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function email(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const recipient = new FormData(e.currentTarget).get("email");
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(`/invoices/${invoice!.id}/email`, {
        method: "POST",
        body: JSON.stringify({ email: recipient }),
      });
      setNotice("Письмо отправлено");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const field = (
    key: keyof typeof buyer,
    label: string,
    required = true,
    placeholder = "",
    pattern?: string,
  ) => (
    <label key={key}>
      {tr(label)}
      <input
        name={key}
        value={buyer[key]}
        onChange={(e) =>
          setBuyer((b) => ({
            ...b,
            [key]: e.target.value,
          }))
        }
        maxLength={key === "address" ? 400 : 200}
        type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
        autoComplete={
          key === "name" ? "name" : key === "email" ? "email" : key === "phone" ? "tel" : void 0
        }
      />
    </label>
  );
  return (
    <Container>
      <div className={"invoice-flow"}>
        <Link to={"/cart"} className={"platform-link"}>
          <ArrowLeft size={16} />
          {tr(" Вернуться в корзину")}
        </Link>
        <header className={"invoice-heading"}>
          <span className={"eyebrow"}>{tr("ЗАКАЗ И ДОКУМЕНТЫ")}</span>
          <h1>{tr(invoice ? "Ваш счёт готов" : "Всё готово для вашего заказа")}</h1>
          <p>{tr("Проверьте данные, получите счёт и оплатите его по реквизитам продавца.")}</p>
        </header>
        <ol className={"invoice-steps"}>
          {tr(
            ["Данные покупателя", "Проверка заказа", "Счёт на оплату"].map((s, i) => (
              <li data-active={invoice ? true : review ? i < 2 : i === 0} key={s}>
                <span>{tr(i + 1)}</span>
                {tr(s)}
              </li>
            )),
          )}
        </ol>
        {tr(
          configError && (
            <p className={"platform-error"} role={"alert"}>
              {tr(configError)}
            </p>
          ),
        )}
        {tr(
          error && (
            <p className={"platform-error"} role={"alert"}>
              {tr(error)}
            </p>
          ),
        )}
        {tr(
          notice && (
            <p className={"platform-success"} role={"status"}>
              {tr(notice)}
            </p>
          ),
        )}
        {tr(
          !authLoaded ? (
            <p>{tr("Загрузка аккаунта\u2026")}</p>
          ) : !user ? (
            <section className="platform-panel">
              <p>{tr("Не удалось подключиться. Попробуйте позже.")}</p>
              <button className="platform-secondary" onClick={() => window.location.reload()}>
                {tr("Повторить")}
              </button>
            </section>
          ) : invoice ? (
            <section className={"invoice-complete"}>
              <CheckCircle2 size={40} />
              <span className={"platform-badge"}>{tr("Ожидает оплаты")}</span>
              <h2>{tr(invoice.number)}</h2>
              <p>{tr("Заказ сохранён. Формирование счёта не подтверждает оплату.")}</p>
              {user.guest && (
                <p>
                  {tr(
                    "Счёт доступен в этом браузере. Скачайте PDF или отправьте его на email, чтобы сохранить копию.",
                  )}
                </p>
              )}
              <strong>{tr(money(invoice.totalMinor))}</strong>
              <div className={"platform-actions"}>
                <a
                  className={"platform-primary"}
                  href={`${API}/api/invoices/${invoice.id}/pdf`}
                  target={"_blank"}
                  rel={"noreferrer"}
                >
                  <FileText size={17} />
                  {tr("Открыть / печать")}
                </a>
                <a
                  className={"platform-secondary"}
                  href={`${API}/api/invoices/${invoice.id}/pdf?download=1`}
                >
                  <Download size={17} />
                  {tr("Скачать PDF")}
                </a>
              </div>
              <small>
                {tr("Печать доступна в просмотрщике PDF браузера. Версия")}
                {tr(" ")}
                {tr(invoice.versions.at(-1)?.version || 1)}
                {tr(" сохранена.")}
              </small>
              <form onSubmit={email} className={"invoice-email"}>
                <label>
                  {tr("Отправить на email")}
                  <input
                    type={"email"}
                    name={"email"}
                    defaultValue={invoice.buyer.email}
                    required={true}
                  />
                </label>
                <button className={"platform-secondary"} disabled={busy || !config?.emailReady}>
                  <Mail size={16} />
                  {tr("Отправить")}
                </button>
              </form>
              {tr(
                !config?.emailReady && (
                  <p>{tr("Отправка писем пока недоступна. Вы можете скачать счёт.")}</p>
                ),
              )}
            </section>
          ) : items.length === 0 ? (
            <section className={"platform-panel"}>
              <h2>{tr("В корзине пока нет товаров")}</h2>
              <Link to={"/catalog"} className={"platform-primary"}>
                {tr("Выбрать товары")}
              </Link>
            </section>
          ) : (
            <div className={"invoice-grid"}>
              <section className={"platform-panel"}>
                {tr(
                  !review ? (
                    <form onSubmit={preview}>
                      <h2>{tr("Покупатель")}</h2>
                      <p>
                        {tr("Данные будут перенесены в счёт. Все поля со звёздочкой обязательны.")}
                      </p>
                      <div className={"invoice-kind"}>
                        {tr(
                          [
                            ["individual", "Физическое лицо"],
                            ["company", "Юридическое лицо / ИП"],
                          ].map(([k, l]) => (
                            <button
                              type={"button"}
                              aria-pressed={buyer.kind === k}
                              className={
                                buyer.kind === k ? "platform-primary" : "platform-secondary"
                              }
                              onClick={() =>
                                setBuyer((b) => ({
                                  ...b,
                                  kind: k,
                                }))
                              }
                              key={k}
                            >
                              {tr(l)}
                            </button>
                          )),
                        )}
                      </div>
                      <div className={"invoice-fields"}>
                        {tr(
                          buyer.kind === "company" && (
                            <>
                              {tr(field("companyName", "Название организации *"))}
                              {tr(field("bin", "БИН *", true, "12 цифр", "[0-9]{12}"))}
                            </>
                          ),
                        )}
                        {tr(field("name", "ФИО контактного лица *"))}
                        {tr(field("email", "Электронная почта *"))}
                        {tr(field("phone", "Телефон *", true, "+77001234567", "+7[0-9]{10}"))}
                        {tr(field("city", "Город *"))}
                        {tr(
                          field(
                            "postalCode",
                            "Почтовый индекс *",
                            true,
                            "010000",
                            "([0-9]{6}|[A-Z0-9]{7})",
                          ),
                        )}
                        {tr(field("address", "Улица, дом, квартира / офис *"))}
                        {tr(
                          buyer.kind === "company" && (
                            <>
                              <h3 className={"invoice-wide"}>
                                {tr("Банковские реквизиты покупателя (необязательно)")}
                              </h3>
                              {tr(field("bank", "Банк", false))}
                              {tr(field("iban", "IBAN", false, "KZ\u2026", "KZ[A-Z0-9]{18}"))}
                              {tr(field("bik", "БИК", false, "", "[A-Z0-9]{8}([A-Z0-9]{3})?"))}
                            </>
                          ),
                        )}
                      </div>
                      <h2>{tr("Получение заказа")}</h2>
                      <div className={"invoice-kind"}>
                        {tr(
                          [
                            ["pickup", "Самовывоз"],
                            ["courier", "Курьерская доставка"],
                          ].map(([k, l]) => (
                            <label className={"delivery-choice"} key={k}>
                              <input
                                type={"radio"}
                                name={"delivery"}
                                value={k}
                                checked={delivery === k}
                                onChange={() => setDelivery(k)}
                              />
                              <span>
                                {tr(l)}
                                <small>
                                  {tr(
                                    k === "pickup"
                                      ? "Адрес и время согласует менеджер"
                                      : money(config?.deliveryMinor || 0),
                                  )}
                                </small>
                              </span>
                            </label>
                          )),
                        )}
                      </div>
                      <button className={"platform-primary"} disabled={busy}>
                        {tr(busy ? "Проверяем\u2026" : "Перейти к проверке")}
                      </button>
                    </form>
                  ) : (
                    <div>
                      <h2>{tr("Проверьте заказ")}</h2>
                      <dl className={"invoice-details"}>
                        {tr(
                          Object.entries(buyer)
                            .filter(
                              ([k, v]) =>
                                v &&
                                k !== "kind" &&
                                k !== "country" &&
                                (buyer.kind === "company" ||
                                  !["companyName", "bin", "bank", "iban", "bik"].includes(k)),
                            )
                            .map(([k, v]) => (
                              <div key={k}>
                                <dt>{tr(labels[k] || k)}</dt>
                                <dd>{tr(v)}</dd>
                              </div>
                            )),
                        )}
                      </dl>
                      <button className={"platform-link"} onClick={() => setReview(false)}>
                        {tr("Изменить данные")}
                      </button>
                      <p className={"invoice-note"}>
                        <ShieldCheck size={20} />
                        {tr("Цена и наличие проверены сервером. Счёт сохранится в вашем аккаунте.")}
                      </p>
                      {tr(
                        !config?.sellerReady && (
                          <p className={"platform-error"}>
                            {tr("Продавец ещё не заполнил реквизиты для счёта. Обратитесь в AGAS.")}
                          </p>
                        ),
                      )}
                      <button
                        className={"platform-primary"}
                        onClick={issue}
                        disabled={busy || !config?.sellerReady}
                      >
                        {tr(busy ? "Формируем PDF\u2026" : "Сформировать счёт")}
                      </button>
                    </div>
                  ),
                )}
              </section>
              <aside className={"platform-panel invoice-summary"}>
                <h2>
                  {tr("Ваш заказ ")}
                  <span>{tr(items.length)}</span>
                </h2>
                {tr(
                  items.map((i) => {
                    const p = catalog.find((p2) => p2.id === i.productId);
                    return (
                      <div className={"invoice-line"} key={i.productId}>
                        <div>
                          <strong>{tr(p?.name || "Загружаем товар\u2026")}</strong>
                          <small>
                            {tr(i.quantity)}
                            {tr(" шт. \u00B7 ")}
                            {tr(p?.sku)}
                          </small>
                        </div>
                        <b>{tr(p ? money(p.price_minor * i.quantity) : "\u2014")}</b>
                      </div>
                    );
                  }),
                )}
                {tr(
                  quote && review ? (
                    <>
                      <div className={"invoice-line"}>
                        <span>{tr("Товары")}</span>
                        {tr(money(quote.subtotalMinor))}
                      </div>
                      <div className={"invoice-line"}>
                        <span>{tr("Доставка")}</span>
                        {tr(money(quote.deliveryMinor))}
                      </div>
                      <div className={"invoice-line"}>
                        <span>{tr(quote.vatLabel)}</span>
                        {tr(money(quote.taxMinor))}
                      </div>
                      <div className={"invoice-total"}>
                        <span>{tr("Итого")}</span>
                        <strong>{tr(money(quote.totalMinor))}</strong>
                      </div>
                    </>
                  ) : (
                    <p className={"invoice-note"}>
                      {tr("Итоговая сумма, доставка и НДС будут проверены на следующем шаге.")}
                    </p>
                  ),
                )}
                <small>{tr("Валюта счёта \u2014 тенге (KZT). Данные карты не требуются.")}</small>
              </aside>
            </div>
          ),
        )}
        {tr(
          user && history.length > 0 && (
            <section className={"platform-panel invoice-history"}>
              <h2>{tr("Ваши счета")}</h2>
              {tr(
                history.map((i) => (
                  <div className={"invoice-line"} key={i.id}>
                    <button
                      className={"platform-link"}
                      onClick={() => {
                        setInvoice(i);
                        setError("");
                        setNotice("");
                      }}
                    >
                      {tr(i.number)}
                    </button>
                    <span>{tr(money(i.totalMinor))}</span>
                    <span className={"platform-badge"}>{tr("Ожидает оплаты")}</span>
                    <a
                      href={`${API}/api/invoices/${i.id}/pdf`}
                      target={"_blank"}
                      rel={"noreferrer"}
                    >
                      {tr("PDF \u2197")}
                    </a>
                  </div>
                )),
              )}
            </section>
          ),
        )}
      </div>
    </Container>
  );
}
