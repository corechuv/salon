import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CarouselSection } from "../../components/CarouselSection/CarouselSection";
import styles from "./Home.module.scss";

export function Home() {
  const [serviceTitles, setServiceTitles] = useState<string[]>([]);
  const apiBase = import.meta.env.VITE_API_URL as string | undefined;

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
    <CarouselSection
      variant="line"
      title="Leistungen"
      subtitle="Kurzer Überblick über die beliebtesten Services."
      items={serviceTitles}
    />
    <CarouselSection
      variant="marquee"
      title="Zertifikate"
      images={certificateImages}
      perView={3.5}
      speedPxPerSec={28}
    />
  </div>;
}
