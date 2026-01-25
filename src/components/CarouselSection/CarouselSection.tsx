import { useEffect, useMemo, useRef, useState } from "react";
import { SectionShell } from "../SectionShell/SectionShell";
import ChevronLeftIcon from "../Icons/ChevronLeftIcon";
import ChevronRightIcon from "../Icons/ChevronRightIcon";
import styles from "./CarouselSection.module.scss";

type BaseProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

type LineProps = BaseProps & {
  variant: "line";
  items: string[];
};

type MarqueeProps = BaseProps & {
  variant: "marquee";
  images: string[];
  perView?: number;
  speedPxPerSec?: number;
};

type Props = LineProps | MarqueeProps;

export function CarouselSection(props: Props) {
  const { title, subtitle, className } = props;

  if (props.variant === "line") {
    return <LineCarousel {...props} title={title} subtitle={subtitle} className={className} />;
  }

  return <MarqueeCarousel {...props} title={title} subtitle={subtitle} className={className} />;
}

function LineCarousel({ title, subtitle, items, className }: LineProps) {
  const lineRef = useRef<HTMLDivElement | null>(null);

  const scrollLine = (dir: -1 | 1) => {
    const el = lineRef.current;
    if (!el) return;
    const step = Math.max(160, el.clientWidth * 0.6);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <SectionShell
      className={`${styles.section} ${className ?? ""}`.trim()}
      title={title}
      subtitle={subtitle}
      controls={
        <>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => scrollLine(-1)}
            aria-label="Nach links"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => scrollLine(1)}
            aria-label="Nach rechts"
          >
            <ChevronRightIcon />
          </button>
        </>
      }
    >
      <div className={styles.line} ref={lineRef}>
        {items.map((item) => (
          <span key={item} className={styles.lineItem}>
            {item}
          </span>
        ))}
      </div>
    </SectionShell>
  );
}

function MarqueeCarousel({
  title,
  subtitle,
  images,
  perView = 3.5,
  speedPxPerSec = 35,
  className,
}: MarqueeProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [slideW, setSlideW] = useState(0);
  const [offset, setOffset] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [openSrc, setOpenSrc] = useState<string | null>(null);

  const tape = useMemo(() => [...images, ...images], [images]);

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

  useEffect(() => {
    if (!images.length) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      if (!paused && !isOpen) {
        setOffset((prev) => prev + speedPxPerSec * dt);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [images.length, paused, isOpen, speedPxPerSec]);

  useEffect(() => {
    if (!slideW || !images.length) return;
    const oneSetWidth = slideW * images.length;

    if (offset >= oneSetWidth) {
      setOffset((o) => o - oneSetWidth);
    } else if (offset < 0) {
      setOffset((o) => o + oneSetWidth);
    }
  }, [offset, slideW, images.length]);

  const nudge = (dir: -1 | 1) => {
    if (!slideW) return;
    setOffset((o) => o + dir * slideW);
  };

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
    <section className={`${styles.section} ${className ?? ""}`.trim()} aria-label={title}>
      <SectionShell
        title={title}
        subtitle={subtitle}
        controls={
          <>
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
          </>
        }
      >
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
      </SectionShell>

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
