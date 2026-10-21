import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <span className="eyebrow">404</span>
      <h1 className="mt-4 font-serif text-6xl text-foreground">Страница не найдена</h1>
      <p className="mt-4 max-w-md text-sm text-ink-soft text-pretty">
        Возможно, она была перемещена или ещё не опубликована. Вернитесь на главную или откройте
        каталог.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          to="/"
          className="inline-flex h-11 items-center rounded-full bg-foreground px-6 text-sm font-medium text-background"
        >
          На главную
        </Link>
        <Link
          to="/catalog"
          className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium text-foreground"
        >
          В каталог
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <span className="eyebrow">Ошибка</span>
      <h1 className="mt-4 font-serif text-5xl text-foreground">Эта страница не загрузилась</h1>
      <p className="mt-4 max-w-md text-sm text-ink-soft">
        Что-то пошло не так. Попробуйте обновить или вернуться на главную.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="inline-flex h-11 items-center rounded-full bg-foreground px-6 text-sm font-medium text-background"
        >
          Попробовать снова
        </button>
        <a
          href="/"
          className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium text-foreground"
        >
          На главную
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AGAS — Маркетплейс умного дома" },
      {
        name: "description",
        content:
          "Премиальный маркетплейс устройств умного дома в Казахстане: освещение, акустика, климат, безопасность.",
      },
      { name: "author", content: "AGAS Smart Systems" },
      { property: "og:title", content: "AGAS — Маркетплейс умного дома" },
      {
        property: "og:description",
        content: "Спокойная архитектура умного дома. Доставка по Казахстану.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </QueryClientProvider>
  );
}
