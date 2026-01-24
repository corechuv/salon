import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CertificatesMarquee } from "../../components/CertificatesMarquee/CertificatesMarquee";
import ChevronLeftIcon from "../../components/Icons/ChevronLeftIcon";
import ChevronRightIcon from "../../components/Icons/ChevronRightIcon";
import styles from "./Home.module.scss";

export function Home() {
  const servicesLineRef = useRef<HTMLDivElement | null>(null);
  const [serviceTitles, setServiceTitles] = useState<string[]>([]);
  const apiBase = import.meta.env.VITE_API_URL as string | undefined;

  const scrollServices = (dir: -1 | 1) => {
    const el = servicesLineRef.current;
    if (!el) return;
    const step = Math.max(160, el.clientWidth * 0.6);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  useEffect(() => {
    if (!apiBase) return;
    fetch(`${apiBase}/services`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: Array<{ title: string }>) => {
        const titles = data.map((item) => item.title).filter(Boolean);
        setServiceTitles(titles.slice(0, 12));
      })
      .catch(() => undefined);
  }, [apiBase]);

  const certificateImages = [
    "/certificates/EMF (Hochfrequenzgeräte) in der Kosmetik_page-0001.jpg",
    "/certificates/Grundlagen der Haut und deren Anhangsgebilde_page-0001.jpg",
    "/certificates/Ultraschall_page-0001.jpg",
  ];

  return <div>
    <div className={styles.ba}>
      <img src="/ba/IMG_2.png" className={styles.ba__image} alt="Banner" />
      <div className={styles.ba__content}>
        <div className={styles.ba__block}>
          <h1 className={styles.ba__title}>DEINE SCHÖNHEIT IST DEIN SELBSTVERTRAUEN</h1>
          <p className={styles.ba__text}>
            Bei uns läuft alles reibungslos.
          </p>

          <div className={styles.ba__actions}>
            <Link to="/services" className={`${styles.ba__btn} ${styles.ba__btnPrimary}`}>
              Termin
            </Link>
          </div>
        </div>
      </div>
    </div>
    <section className={styles.servicesPreview}>
      <div className={styles.servicesPreview__header}>
        <div>
          <h2 className={styles.servicesPreview__title}>Leistungen</h2>
          <p className={styles.servicesPreview__subtitle}>
            Kurzer Überblick über die beliebtesten Services.
          </p>
        </div>
        <div className={styles.servicesPreview__controls}>
          <button
            type="button"
            className={styles.servicesPreview__navBtn}
            onClick={() => scrollServices(-1)}
            aria-label="Nach links"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            className={styles.servicesPreview__navBtn}
            onClick={() => scrollServices(1)}
            aria-label="Nach rechts"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>
      <div className={styles.servicesPreview__line} ref={servicesLineRef}>
        {serviceTitles.length > 0
          ? serviceTitles.map((title) => <span key={title}>{title}</span>)
          : null}
      </div>
    </section>
      <CertificatesMarquee
        images={certificateImages}
        perView={3.5}
        speedPxPerSec={28}  // ещё медленнее => меньше число
        title="Zertifikate"
      />
  </div>;
}
