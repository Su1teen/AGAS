// localized-ui
import { tr, useUi } from "@/lib/ui";
import { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Container } from "@/components/site/Container";
import sceneMorning from "@/assets/scene_morning_1780626899705.png";
import sceneOffice from "@/assets/scene_office_1780626911612.png";
import sceneSecurity from "@/assets/scene_security_1780626922479.png";
import sceneEvening from "@/assets/scene_evening_relax_1780626810145.png";
import sceneKids from "@/assets/scene_kids_room_1780626820663.png";
import sceneParty from "@/assets/scene_party_1780626832121.png";
import sceneLeaving from "@/assets/scene_leaving_1780626850798.png";
import sceneSport from "@/assets/scene_sport_1780626860236.png";
import sceneCinema from "@/assets/scene_cinema_1780626870211.png";
type ScenarioItem = {
  img: string;
  title: string;
  text: string;
  stat: string;
  link: string;
};
const scenarios: ScenarioItem[] = [
  {
    img: sceneMorning,
    title: "Доброе утро",
    text: "Кофе, свет, проветривание и голосовая сводка Алисы.",
    stat: "08:00",
    link: "Настроить утро",
  },
  {
    img: sceneOffice,
    title: "Домашний офис",
    text: "Фокусный свет, тишина и идеальный климат для продуктивности.",
    stat: "4 устройства",
    link: "Настроить офис",
  },
  {
    img: sceneSecurity,
    title: "Умная безопасность",
    text: "Замок, камера, видеозвонок и датчики в едином сценарии.",
    stat: "24/7",
    link: "Настроить защиту",
  },
  {
    img: sceneEvening,
    title: "Вечерний релакс",
    text: "Уютное освещение, очищенный воздух и музыка.",
    stat: "7 устройств",
    link: "Настроить вечерний свет",
  },
  {
    img: sceneKids,
    title: "Детская опека",
    text: "Контроль сна, мягкий свет и аудионяня.",
    stat: "5 сценариев",
    link: "Настроить детскую",
  },
  {
    img: sceneParty,
    title: "Праздничный настрой",
    text: "Мультимедийный свет и музыка.",
    stat: "∞ оттенков",
    link: "Сценарии праздника",
  },
  {
    img: sceneLeaving,
    title: "Готовность к выходу",
    text: "Безопасность при выходе, проверка дверей.",
    stat: "1 касание",
    link: "Настроить отъезд",
  },
  {
    img: sceneSport,
    title: "Спорт и энергия",
    text: "Энергичный свет, музыка и климат-контроль.",
    stat: "3 зоны",
    link: "Настроить спорт",
  },
  {
    img: sceneCinema,
    title: "Кинотеатр дома",
    text: "Приглушенный свет, управление проектором.",
    stat: "Dolby Atmos",
    link: "Сценарии кино",
  },
];
const CARD_WIDTH = 340;
const CARD_GAP = 20;
const SCROLL_SPEED = 0.5; // px per frame
export function ScenariosCarousel() {
  useUi();
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollPos = useRef(0);
  const isPaused = useRef(false);
  const rafId = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const totalCards = scenarios.length;
  const singleSetWidth = totalCards * (CARD_WIDTH + CARD_GAP);
  // We render 3 copies for seamless infinite scroll
  const tripled = [...scenarios, ...scenarios, ...scenarios];
  const updateActiveIndex = useCallback(() => {
    const offset = scrollPos.current % singleSetWidth;
    const idx = Math.round(offset / (CARD_WIDTH + CARD_GAP)) % totalCards;
    setActiveIndex(idx);
  }, [singleSetWidth, totalCards]);
  const animate = useCallback(() => {
    if (!isPaused.current && trackRef.current) {
      scrollPos.current += SCROLL_SPEED;
      // Reset seamlessly when we've scrolled past the first copy
      if (scrollPos.current >= singleSetWidth) {
        scrollPos.current -= singleSetWidth;
      }
      trackRef.current.style.transform = `translate3d(-${scrollPos.current}px, 0, 0)`;
      updateActiveIndex();
    }
    rafId.current = requestAnimationFrame(animate);
  }, [singleSetWidth, updateActiveIndex]);
  useEffect(() => {
    // Start at the beginning of the second copy so we can scroll both ways
    scrollPos.current = 0;
    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [animate]);
  const goToSlide = (index: number) => {
    scrollPos.current = index * (CARD_WIDTH + CARD_GAP);
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(-${scrollPos.current}px, 0, 0)`;
    }
    setActiveIndex(index);
  };
  const handleMouseEnter = () => {
    isPaused.current = true;
  };
  const handleMouseLeave = () => {
    isPaused.current = false;
  };
  // Touch handling for mobile swipe
  const touchStartX = useRef(0);
  const touchStartScroll = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    isPaused.current = true;
    touchStartX.current = e.touches[0].clientX;
    touchStartScroll.current = scrollPos.current;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.touches[0].clientX;
    let newPos = touchStartScroll.current + diff;
    if (newPos < 0) newPos += singleSetWidth;
    if (newPos >= singleSetWidth) newPos -= singleSetWidth;
    scrollPos.current = newPos;
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(-${scrollPos.current}px, 0, 0)`;
    }
    updateActiveIndex();
  };
  const handleTouchEnd = () => {
    isPaused.current = false;
  };
  return (
    <section className="pt-10 pb-24 overflow-hidden">
      {/* Header - inside Container for alignment */}
      <Container>
        <div className="mb-12">
          <span className="eyebrow">{tr("Сценарии")}</span>
          <h2 className="mt-4 font-serif text-4xl leading-[1.05] text-foreground md:text-5xl text-balance">
            {tr("Один дом \u2014 десятки")}
            {tr(" ")}
            <em className="font-serif italic">{tr("настроений")}</em>
          </h2>
          <p className="mt-4 max-w-[52ch] text-base text-ink-soft text-pretty">
            {tr(
              "Каждый сценарий \u2014 это скоординированная работа света, климата, звука и безопасности. Всё автоматически.",
            )}
          </p>
        </div>
      </Container>

      {/* Carousel Track - full width, overflows container */}
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={trackRef}
          className="flex will-change-transform"
          style={{
            gap: `${CARD_GAP}px`,
            paddingLeft: "max(1.5rem, calc((100vw - 80rem) / 2 + 1.5rem))",
          }}
        >
          {tr(
            tripled.map((scene, i) => (
              <Link
                key={`${scene.title}-${i}`}
                to="/catalog"
                className="group flex-shrink-0 block rounded-2xl border border-border bg-surface/60 overflow-hidden transition-all duration-500 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1"
                style={{ width: `${CARD_WIDTH}px` }}
              >
                {/* Image */}
                <div className="relative overflow-hidden h-[200px]">
                  <img
                    src={scene.img}
                    alt={tr(scene.title)}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  {/* Stat badge */}
                  <div className="absolute top-3 left-3 rounded-full bg-background/85 backdrop-blur-md px-3 py-1">
                    <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-foreground tabular-nums">
                      {tr(scene.stat)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h4 className="font-serif text-xl text-foreground leading-tight">
                    {tr(scene.title)}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft text-pretty line-clamp-2">
                    {tr(scene.text)}
                  </p>
                  <span className="mt-4 inline-block text-xs font-medium uppercase tracking-widest text-ink-soft transition-colors group-hover:text-foreground">
                    {tr(scene.link)} →
                  </span>
                </div>
              </Link>
            )),
          )}
        </div>
      </div>

      {/* Navigation dots */}
      <Container>
        <div className="mt-8 flex items-center justify-center gap-2">
          {tr(
            scenarios.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`
                h-2 rounded-full transition-all duration-300 cursor-pointer
                ${
                  activeIndex === i
                    ? "w-6 bg-foreground"
                    : "w-2 bg-foreground/20 hover:bg-foreground/40"
                }
              `}
                aria-label={tr(`Перейти к сценарию ${i + 1}`)}
              />
            )),
          )}
        </div>
      </Container>
    </section>
  );
}
