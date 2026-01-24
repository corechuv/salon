import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./CertificatesMarquee.module.scss";
import ChevronLeftIcon from "../Icons/ChevronLeftIcon";
import ChevronRightIcon from "../Icons/ChevronRightIcon";

type Props = {
  images: string[];
  title?: string;
  subtitle?: string;
  perView?: number;         // 3.5
  speedPxPerSec?: number;   // скорость непрерывного движения
};

export function CertificatesMarquee({
  images,
  title = "Zertifikate",
  subtitle = "Offizielle Nachweise und Fortbildungen",
  perView = 3.5,
  speedPxPerSec = 35, // медленно; увеличьте до 60-90 если нужно быстрее
}: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [slideW, setSlideW] = useState(0);
  const [offset, setOffset] = useState(0);      // px
  const [paused, setPaused] = useState(false);

  // модалка
  const [isOpen, setIsOpen] = useState(false);
  const [openSrc, setOpenSrc] = useState<string | null>(null);

  // лента: дублируем список, чтобы можно было “зациклить”
  const tape = useMemo(() => [...images, ...images], [images]);

  // измеряем viewport и считаем ширину карточки (3.5 шт. видно)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const calc = () => {
      const w = el.clientWidth;
      setSlideW(w > 0 ? w / perView : 0);
    };

    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [perView]);

  // непрерывная анимация
  useEffect(() => {
    if (!images.length) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      // при открытой модалке/на паузе — не двигаем
      if (!paused && !isOpen) {
        setOffset((prev) => prev + speedPxPerSec * dt);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [images.length, paused, isOpen, speedPxPerSec]);

  // зацикливание: когда offset проходит длину одного набора — сбрасываем
  useEffect(() => {
    if (!slideW || !images.length) return;
    const oneSetWidth = slideW * images.length;

    if (offset >= oneSetWidth) {
      // сброс без скачка (оставляем “остаток”)
      setOffset((o) => o - oneSetWidth);
    } else if (offset < 0) {
      // если ручными кнопками ушли в минус
      setOffset((o) => o + oneSetWidth);
    }
  }, [offset, slideW, images.length]);

  // ручные кнопки: “пинок” на 1 карточку
  const nudge = (dir: -1 | 1) => {
    if (!slideW) return;
    setOffset((o) => o + dir * slideW);
  };

  // модалка: esc закрыть, блокируем скролл
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  if (!images.length) return null;

  return (
    <section className={styles.wrap} aria-label={title}>
      <div className={styles.header}>
        <div className={styles.heading}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => nudge(-1)}
            aria-label="Влево"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => nudge(1)}
            aria-label="Вправо"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <div
        className={styles.viewport}
        ref={viewportRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <div
          className={styles.track}
          ref={trackRef}
          style={{
            transform: `translateX(-${offset}px)`,
          }}
        >
          {tape.map((src, i) => (
            <div
              className={styles.slide}
              key={`${src}-${i}`}
              style={{ width: slideW ? `${slideW}px` : undefined }}
            >
              <button
                type="button"
                className={styles.slideBtn}
                onClick={() => {
                  setOpenSrc(src);
                  setIsOpen(true);
                }}
                aria-label="Открыть сертификат"
              >
                <img className={styles.img} src={src} alt="Zertifikat" draggable={false} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {isOpen && openSrc && (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className={styles.modal}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setIsOpen(false)}
              aria-label="Закрыть"
            >
              ✕
            </button>

            <div className={styles.modalBody}>
              <img className={styles.modalImg} src={openSrc} alt="Zertifikat" draggable={false} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
