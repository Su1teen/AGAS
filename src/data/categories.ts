import catLighting from "@/assets/cat-lighting.jpg";
import catAudio from "@/assets/cat-audio.jpg";
import catClimate from "@/assets/cat-climate.jpg";
import catSecurity from "@/assets/cat-security.jpg";
import lifestyleBedroom from "@/assets/lifestyle-bedroom.jpg";
import lifestyleKitchen from "@/assets/lifestyle-kitchen.jpg";
import lifestyleLiving from "@/assets/lifestyle-living.jpg";
import detail from "@/assets/detail-material.jpg";
import demo from "./demo-products.json";

export type CatalogGroupSlug = "b2c" | "b2b";

export type Subcategory = {
  slug: string;
  title: string;
};

export type Category = {
  slug: string;
  group: CatalogGroupSlug;
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  cover: string;
  subcategories: Subcategory[];
};

export type CatalogGroup = {
  slug: CatalogGroupSlug;
  title: string;
  shortTitle: string;
  description: string;
  categories: Category[];
};

const cover = (slug: string) => demo.find((item) => item.categorySlug === slug)?.image || detail;
export const shoppingCategories: Category[] = [
  {
    slug: "kids",
    group: "b2c",
    title: "Детям",
    shortTitle: "Детям",
    tagline: "Конструкторы, игры и творчество",
    description: "Игрушки для самостоятельной игры, семейных вечеров и первых занятий творчеством.",
    cover: cover("kids"),
    subcategories: [
      { slug: "building", title: "Конструкторы" },
      { slug: "games", title: "Игры и пазлы" },
      { slug: "creativity", title: "Творчество и развитие" },
    ],
  },
  {
    slug: "parents",
    group: "b2c",
    title: "Родителям",
    shortTitle: "Родителям",
    tagline: "Кормление, уход и прогулки",
    description: "Товары для кормления, повседневного ухода и прогулок с малышом.",
    cover: cover("parents"),
    subcategories: [
      { slug: "feeding", title: "Кормление" },
      { slug: "travel", title: "Прогулки и поездки" },
      { slug: "care", title: "Уход" },
    ],
  },
  {
    slug: "home-appliances",
    group: "b2c",
    title: "Техника для дома",
    shortTitle: "Для дома",
    tagline: "Для кухни и уборки",
    description: "Кухонная техника и приборы для ухода за домом на каждый день.",
    cover: cover("home-appliances"),
    subcategories: [
      { slug: "kitchen", title: "Кухня" },
      { slug: "cleaning", title: "Уборка" },
    ],
  },
  {
    slug: "clothing",
    group: "b2c",
    title: "Одежда",
    shortTitle: "Одежда",
    tagline: "Футболки, платья, худи и свитшоты",
    description: "Повседневная одежда для прогулок, работы и отдыха.",
    cover: cover("clothing"),
    subcategories: [
      { slug: "womens", title: "Женская одежда" },
      { slug: "tshirts", title: "Мужские футболки и поло" },
      { slug: "hoodies", title: "Худи и свитшоты" },
    ],
  },
];

export const categories: Category[] = [
  ...shoppingCategories,
  {
    slug: "lighting",
    group: "b2c",
    title: "Освещение и световой дизайн",
    shortTitle: "Свет",
    tagline: "Лампы, ленты, архитектурный свет",
    description:
      "Световые сценарии для конечного пользователя: RGBW-лампы, COB-ленты, дизайнерские светильники, ночники и мягкая архитектурная подсветка.",
    cover: catLighting,
    subcategories: [
      { slug: "smart-bulbs", title: "Умные лампы" },
      { slug: "led-strips", title: "Светодиодные ленты и неон" },
      { slug: "architectural-outdoor", title: "Архитектурный и уличный свет" },
      { slug: "designer-fixtures", title: "Дизайнерские светильники" },
      { slug: "night-lights", title: "Ночники и световые будильники" },
    ],
  },
  {
    slug: "control",
    group: "b2c",
    title: "Интерфейсы управления",
    shortTitle: "Управление",
    tagline: "Выключатели, панели, кнопки",
    description:
      "Тактильные точки контакта с домом: настенные панели, стеклянные выключатели, беспроводные кнопки, кубики и диммеры.",
    cover: detail,
    subcategories: [
      { slug: "smart-switches", title: "Умные выключатели" },
      { slug: "wall-panels", title: "Настенные смарт-панели" },
      { slug: "wireless-buttons", title: "Беспроводные кнопки и кубики" },
      { slug: "rotary-dimmers", title: "Поворотные регуляторы" },
      { slug: "wired-panels", title: "Проводные панели" },
    ],
  },
  {
    slug: "climate",
    group: "b2c",
    title: "Климат и биом",
    shortTitle: "Климат",
    tagline: "Воздух, тепло, влажность",
    description:
      "Термостаты, радиаторные клапаны, ИК-пульты, очистители, увлажнители и ароматизация для стабильного биома дома.",
    cover: catClimate,
    subcategories: [
      { slug: "thermostats", title: "Умные термостаты" },
      { slug: "radiator-valves", title: "Термоголовки для радиаторов" },
      { slug: "ir-remotes", title: "ИК-пульты и кондиционеры" },
      { slug: "air-care", title: "Очистители и увлажнители" },
      { slug: "aroma", title: "Умные диффузоры ароматов" },
    ],
  },
  {
    slug: "shading",
    group: "b2c",
    title: "Экосистема штор и солнцезащиты",
    shortTitle: "Шторы",
    tagline: "Карнизы, рулонные шторы, окна",
    description:
      "Электрокарнизы, моторы рулонных штор, жалюзи и оконные приводы, которые работают по свету, времени и сценарию.",
    cover: lifestyleBedroom,
    subcategories: [
      { slug: "curtain-tracks", title: "Электрокарнизы" },
      { slug: "roller-shades", title: "Рулонные шторы и блайнды" },
      { slug: "smart-blinds", title: "Умные жалюзи" },
      { slug: "window-actuators", title: "Приводы окон и фрамуг" },
    ],
  },
  {
    slug: "audio",
    group: "b2c",
    title: "Аудио и мультимедиа",
    shortTitle: "Аудио",
    tagline: "Голос, кино, стриминг",
    description:
      "Умные колонки, пространственный звук, саундбары, медиаплееры и домашние кинотеатры для тихой мультимедийной инфраструктуры.",
    cover: catAudio,
    subcategories: [
      { slug: "smart-speakers", title: "Умные колонки и аудиосистемы" },
      { slug: "soundbars", title: "Саундбары и кинотеатры" },
      { slug: "media-players", title: "Медиаплееры и ТВ-приставки" },
    ],
  },
  {
    slug: "security",
    group: "b2c",
    title: "Безопасность и мониторинг",
    shortTitle: "Защита",
    tagline: "Замки, камеры, датчики",
    description:
      "Биометрические замки, камеры, видеозвонки, mmWave-датчики, герконы, датчики протечки, дыма, газа, света и климата.",
    cover: catSecurity,
    subcategories: [
      { slug: "smart-locks", title: "Умные замки" },
      { slug: "cameras", title: "Камеры видеонаблюдения" },
      { slug: "doorbells", title: "Видеодомофоны и звонки" },
      { slug: "presence-sensors", title: "Датчики движения и присутствия" },
      { slug: "opening-sensors", title: "Датчики открытия" },
      { slug: "leak-sensors", title: "Датчики протечки" },
      { slug: "smoke-gas-sensors", title: "Датчики дыма, CO и газа" },
      { slug: "light-uv-sensors", title: "Датчики освещенности и УФ" },
      { slug: "temperature-sensors", title: "Датчики температуры и влажности" },
      { slug: "sensors", title: "Датчики умного дома" },
    ],
  },
  {
    slug: "lifestyle",
    group: "b2c",
    title: "Премиальный быт, Wellness и Lifestyle",
    shortTitle: "Lifestyle",
    tagline: "Wellness, уборка, питание",
    description:
      "Флагманские роботы, смарт-розетки, скрытые зарядки, умная сантехника, кухня, уход за питомцами и системы сна.",
    cover: lifestyleKitchen,
    subcategories: [
      { slug: "robot-vacuums", title: "Роботы-пылесосы и станции" },
      { slug: "smart-plugs", title: "Умные розетки и фильтры" },
      { slug: "hidden-chargers", title: "Скрытые беспроводные зарядки" },
      { slug: "smart-plumbing", title: "Умная сантехника" },
      { slug: "smart-kitchen", title: "Умная кухонная техника" },
      { slug: "pet-care", title: "Уход за питомцами" },
      { slug: "smart-sleep", title: "Умный сон" },
    ],
  },
  {
    slug: "hubs-networking",
    group: "b2b",
    title: "Хабы, шлюзы и сетевая инфраструктура",
    shortTitle: "Хабы",
    tagline: "Matter, Thread, PoE, Wi‑Fi 7",
    description:
      "Мультипротокольные хабы, корпоративная сеть, PoE-коммутация, бесшовные точки доступа, стойки и шкафы автоматизации.",
    cover: detail,
    subcategories: [
      { slug: "multi-protocol-hubs", title: "Мультипротокольные хабы" },
      { slug: "networking", title: "Сетевое оборудование" },
      { slug: "automation-racks", title: "Стойки и шкафы автоматизации" },
    ],
  },
  {
    slug: "relays-actuators",
    group: "b2b",
    title: "Реле и силовые модули",
    shortTitle: "Реле",
    tagline: "Подрозетники, DIN, диммеры",
    description:
      "Встраиваемые реле, сухие контакты, DIN-модули, TRIAC, 0–10V, DALI, KNX, модули штор и умные автоматы защиты.",
    cover: catLighting,
    subcategories: [
      { slug: "embedded-relays", title: "Встраиваемые беспроводные реле" },
      { slug: "din-relays", title: "DIN-реечные силовые реле" },
      { slug: "din-dimmers", title: "DIN-реечные диммеры" },
      { slug: "curtain-actuators", title: "DIN-модули управления шторами" },
      { slug: "smart-breakers", title: "Умные автоматы защиты" },
      { slug: "pwm-controllers", title: "ШИМ контроллеры" },
      { slug: "embedded-dimmers", title: "Встраиваемые диммеры" },
    ],
  },
  {
    slug: "gateways-protocols",
    group: "b2b",
    title: "Модули интеграции, шлюзы и протоколы",
    shortTitle: "Протоколы",
    tagline: "KNX, Modbus, DALI, RS‑485",
    description:
      "Профессиональные шлюзы KNX, конвертеры Modbus RTU/TCP, DALI-интерфейсы и преобразователи RS‑485/Ethernet.",
    cover: lifestyleLiving,
    subcategories: [
      { slug: "knx-gateways", title: "Шлюзы KNX" },
      { slug: "modbus-converters", title: "Конвертеры Modbus" },
      { slug: "dali-gateways", title: "Шлюзы DALI" },
      { slug: "interface-converters", title: "Преобразователи интерфейсов" },
      { slug: "dali-masters", title: "DALI мастера" },
      { slug: "protocol-converters", title: "Конвертеры протоколов" },
      { slug: "wireless-gateways", title: "Шлюзы и конвертеры" },
    ],
  },
  {
    slug: "bus-systems",
    group: "b2b",
    title: "Проводная автоматизация",
    shortTitle: "Шины",
    tagline: "KNX-кабели, БП, шинные датчики",
    description:
      "Шинные кабели, стабилизированные источники питания 24/30V DC и проводные датчики/выключатели для Bus Systems.",
    cover: detail,
    subcategories: [
      { slug: "bus-cables", title: "Шинные кабели и аксессуары" },
      { slug: "bus-power", title: "Блоки питания для шины" },
      { slug: "bus-sensors-switches", title: "Шинные датчики и выключатели" },
    ],
  },
  {
    slug: "water-gas",
    group: "b2b",
    title: "Защита от протечек и контроль жидкостей",
    shortTitle: "Вода и газ",
    tagline: "Краны, датчики, клапаны",
    description:
      "Шаровые краны с электроприводом, проводные датчики протечки и электромагнитные газовые клапаны для аварийного отсечения.",
    cover: catSecurity,
    subcategories: [
      { slug: "motorized-valves", title: "Шаровые краны с электроприводом" },
      { slug: "wired-leak-sensors", title: "Проводные датчики протечки" },
      { slug: "gas-valves", title: "Электромагнитные клапаны для газа" },
    ],
  },
  {
    slug: "hvac-controllers",
    group: "b2b",
    title: "Модули управления отоплением и вентиляцией",
    shortTitle: "HVAC",
    tagline: "OpenTherm, сервоприводы, фанкойлы",
    description:
      "Контроллеры котлов, термоэлектрические сервоприводы коллекторных групп и профессиональные модули управления вентиляцией.",
    cover: catClimate,
    subcategories: [
      { slug: "boiler-controllers", title: "Контроллеры отопительных котлов" },
      { slug: "manifold-actuators", title: "Сервоприводы коллекторных групп" },
      { slug: "ventilation-fancoil", title: "Фанкойлы и приточно-вытяжные установки" },
    ],
  },
];

export const catalogGroups: CatalogGroup[] = [
  {
    slug: "b2c",
    title: "Для дома и семьи",
    shortTitle: "Для дома и семьи",
    description: "Готовые устройства и сценарии для квартир, домов и wellness-пространств.",
    categories: categories.filter((category) => category.group === "b2c"),
  },
  {
    slug: "b2b",
    title: "Для профессионалов",
    shortTitle: "Для профессионалов",
    description: "Инженерная база для интеграторов, щитов, шинных протоколов и HVAC.",
    categories: categories.filter((category) => category.group === "b2b"),
  },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
