// localized-ui
import { useEffect, useState } from "react";
import { api } from "@/lib/platform";
import { useUi, tr, type Fx } from "@/lib/ui";
export function UiControls() {
  useUi();
  const { lang, currency, fx, setLang, setCurrency, setFx } = useUi();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    void useUi.persist.rehydrate();
    api<Fx | null>("/fx")
      .then(setFx)
      .catch(() => setFx(null))
      .finally(() => setLoaded(true));
  }, [setFx]);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return (
    <div className="ui-controls">
      <div className="ui-segment" aria-label={tr(tr("Язык интерфейса"))}>
        {tr(
          (["ru", "en"] as const).map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
              {tr(l.toUpperCase())}
            </button>
          )),
        )}
      </div>
      <div className="ui-segment" aria-label={tr(tr("Валюта отображения"))}>
        {tr(
          (["KZT", "USD"] as const).map((c) => (
            <button
              key={c}
              type="button"
              disabled={c === "USD" && !fx}
              title={tr(c === "USD" && !fx ? tr("Курс валют пока недоступен") : undefined)}
              aria-pressed={currency === c}
              onClick={() => setCurrency(c)}
            >
              {tr(c === "USD" ? "$ USD" : "₸ KZT")}
            </button>
          )),
        )}
      </div>
      <details className="ui-rate">
        <summary title={tr(tr("Курс валют"))}>ⓘ</summary>
        <div>
          {tr(
            fx ? (
              <>
                <strong>
                  1 USD = {tr(fx.kztPerUsd.toLocaleString(lang === "ru" ? "ru-RU" : "en-US"))} KZT
                </strong>
                <a href={fx.sourceUrl} target="_blank" rel="noreferrer">
                  {tr(tr(fx.source))} · {tr(fx.asOf)}
                </a>
                {tr(
                  fx.stale && (
                    <p>{tr(tr("Последний доступный курс. Обновление временно недоступно."))}</p>
                  ),
                )}
                <p>{tr(tr("Пересчёт справочный. Счёт выставляется в KZT."))}</p>
              </>
            ) : (
              <p>{tr(tr(loaded ? "Курс валют пока недоступен" : "Загружаем курс валют…"))}</p>
            ),
          )}
        </div>
      </details>
    </div>
  );
}
