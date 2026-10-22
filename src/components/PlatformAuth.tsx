// localized-ui
import { tr, useUi } from "@/lib/ui";
import { useState, type FormEvent } from "react";
import { api, type User } from "@/lib/platform";
export function PlatformAuth({
  supplier = false,
  onSuccess,
}: {
  supplier?: boolean;
  onSuccess: (user: User) => void;
}) {
  useUi();
  useUi();
  const [create, setCreate] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const user = await api<User>(create ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(
          create
            ? {
                email: f.get("email"),
                password: f.get("password"),
                name: f.get("name"),
                company: f.get("company") || undefined,
                kind: supplier ? "supplier" : "buyer",
              }
            : { email: f.get("email"), password: f.get("password") },
        ),
      });
      onSuccess(user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={"platform-auth"}>
      <span className={"eyebrow"}>
        {tr("AGAS \u00B7 ")}
        {tr(supplier ? "Кабинет поставщика" : "Личный кабинет")}
      </span>
      <h2>{tr(create ? "Создать аккаунт" : "Рады видеть вас снова")}</h2>
      <p>
        {tr(
          supplier
            ? "Управляйте каталогом, поставками и документами в одном месте."
            : "Войдите, чтобы сохранить заказ и получить защищённый доступ к счетам.",
        )}
      </p>
      <form onSubmit={submit}>
        {tr(
          create && (
            <>
              <label>
                {tr("Ваше имя")}
                <input
                  name={"name"}
                  required={true}
                  minLength={2}
                  maxLength={120}
                  autoComplete={"name"}
                />
              </label>
              {tr(
                supplier && (
                  <label>
                    {tr("Организация")}
                    <input name={"company"} required={true} minLength={2} maxLength={120} />
                  </label>
                ),
              )}
            </>
          ),
        )}
        <label>
          {tr("Электронная почта")}
          <input type={"email"} name={"email"} required={true} autoComplete={"email"} />
        </label>
        <label>
          {tr("Пароль")}
          <input
            type={"password"}
            name={"password"}
            required={true}
            minLength={12}
            maxLength={128}
            autoComplete={create ? "new-password" : "current-password"}
          />
        </label>
        {tr(
          create && (
            <small>{tr("Не менее 12 символов. Не используйте пароль от других сервисов.")}</small>
          ),
        )}
        {tr(
          error && (
            <p className={"platform-error"} role={"alert"}>
              {tr(error)}
            </p>
          ),
        )}
        <button className={"platform-primary"} disabled={busy}>
          {tr(busy ? "Подождите\u2026" : create ? "Зарегистрироваться" : "Войти")}
        </button>
      </form>
      <button
        className={"platform-link"}
        onClick={() => {
          setCreate(!create);
          setError("");
        }}
      >
        {tr(create ? "Уже есть аккаунт? Войти" : "Создать аккаунт")}
      </button>
    </section>
  );
}
