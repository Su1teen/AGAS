## Концепция

Бренд **AGAS** — премиальный маркетплейс умного дома на русском языке, цены в ₸. Дух Apple Store / B&O / Dyson: спокойный шоурум, матовый алюминий, editorial-подача. Палитра — тёплые нейтральные (zinc-50 фон, zinc-900 текст, акцент анодированный). Типографика: Inter + Instrument Serif для заголовков. Анимация — сдержанная (Motion), hover-подъём карточек, плавный parallax на hero.

## Структура страниц (TanStack Router, `src/routes/`)

```
/                    Главная: hero, категории, featured, рекомендации, lifestyle-сценарии, trust
/catalog             Каталог: sticky-фильтры слева, грид карточек, сортировка, пагинация
/category/$slug      Категория с обложкой и подкатегориями
/product/$slug       Карточка товара: галерея + зум, характеристики, совместимость, отзывы, рекомендации, trust
/compare             Сравнение товаров (таблица характеристик)
/favorites           Избранное (+ empty state)
/cart                Корзина (+ empty state)
/checkout            Оформление: 3 шага (доставка → оплата → подтверждение)
/order/success       Подтверждение заказа
/account             Профиль (layout с sub-routes)
/account/orders      История заказов
/account/addresses   Адреса
/delivery            Доставка и оплата
/support             Поддержка / FAQ
```

Layout shell: общий `__root.tsx` с премиальным навбаром (логотип, каталог, поиск, избранное, корзина, аккаунт) и футером (4 колонки + подписка). Sticky навбар с blur.

## Данные

Локальный mock в `src/data/products.ts` — ~24 устройства с полями: id, slug, name, tagline, category, price (₸), rating, reviewsCount, inStock, images[], specs{}, compatibility[], features[]. Категории: колонки, хабы, датчики движения, датчики климата, камеры, замки, освещение, термостаты, розетки/реле, шторы, сценарии, аксессуары, готовые комплекты.

Состояния корзины и избранного — Zustand store с persist в localStorage. Поиск — простой клиентский фильтр.

## Ключевые компоненты

- `Navbar`, `Footer`, `Container`
- `ProductCard` (премиальная карточка: крупное фото, tagline, цена ₸, рейтинг, статус, hover-действия)
- `ProductGallery` (главное фото + миниатюры + зум при hover)
- `SpecTable`, `CompatibilityList`, `ReviewBlock`, `TrustSignals`
- `CategoryCover`, `LifestyleScene`
- `FiltersSidebar`, `SortBar`, `Pagination`
- `CartItem`, `CheckoutStepper`, `OrderSummary`
- `EmptyState`, `LoadingSkeleton`, `ErrorState`

## Изображения

Генерация ~15–18 ключевых изображений через imagegen (hero, обложки 4 категорий, ~8 product shots, 3 lifestyle-сцены, 1–2 детальных макро). Стиль: студийный свет, матовый алюминий/керамика/стекло на нейтральном фоне. Сохранение в `src/assets/`.

## Технические детали

- Design tokens из выбранного прототипа портируются в `src/styles.css` (oklch): warm zinc neutrals, accent, серифный display-токен, скругления `min(1vw, 24px)`.
- Шрифты подключаются через `<link>` в `__root.tsx` head (Inter + Instrument Serif).
- Каждый route задаёт свой `head()` с уникальным title/description на русском и og-тегами; og:image только на leaf-маршрутах с реальным изображением.
- shadcn компоненты используются под капотом (Button, Input, Sheet для мобильной корзины/фильтров, Tabs, Accordion для FAQ/характеристик), но визуально переопределены под бренд.
- Motion для React — мягкие fade/translate на скролле, hover-состояния.
- Все цвета через семантические токены, никаких `text-white` / `bg-black` напрямую.

## Что НЕ входит

- Реальный бэкенд, авторизация, платежи — это UI-демо с mock-данными.
- Lovable Cloud не включается (нет требований к персистентности на сервере).

## Порядок реализации

1. Дизайн-токены и шрифты → `src/styles.css`, `__root.tsx` (навбар + футер + Outlet).
2. Mock-данные + Zustand stores (cart, favorites).
3. Базовые UI-компоненты (ProductCard, Container, EmptyState).
4. Главная страница (hero + категории + featured + рекомендации + lifestyle + trust).
5. Генерация всех изображений параллельно.
6. Каталог + категория + страница товара (включая галерею, характеристики, отзывы, рекомендации).
7. Корзина → checkout → подтверждение заказа.
8. Избранное, сравнение, профиль + история заказов, доставка, поддержка.
9. Empty / loading / error states по разделам.
10. Полировка, проверка композиции, удаление AI-slop паттернов.

Объём большой — реализация займёт несколько итераций, но архитектура и токены закладываются с первого шага так, чтобы каждый экран ощущался частью одной премиальной экосистемы.
