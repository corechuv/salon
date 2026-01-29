import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CarouselSection } from "../../components/CarouselSection/CarouselSection";
import { Button } from "../../components/UI/Button/Button";
import { MapContainer, TileLayer, Marker, CircleMarker, ZoomControl } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import styles from "./Home.module.scss";

export function Home() {
  const navigate = useNavigate();
  const [serviceTitles, setServiceTitles] = useState<string[]>([]);
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const apiBase = import.meta.env.VITE_API_URL as string | undefined;
  const mapCenter: [number, number] = [53.552, 9.94];
  const addressLabel = "Neuen Großen Bergstraße 7, 22767 Hamburg";
  const mapsQuery = encodeURIComponent(addressLabel);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${mapsQuery}`;
  const isApple =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
  const mapsUrl = isApple ? appleMapsUrl : googleMapsUrl;
  const [mapReady, setMapReady] = useState(false);

  const mapMarkerIcon = useMemo(
    () =>
      L.icon({
        iconRetinaUrl: markerIcon2x,
        iconUrl: markerIcon,
        shadowUrl: markerShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    []
  );

  useEffect(() => {
    setMapReady(true);
  }, []);

  useEffect(() => {
    if (!apiBase) return;
    fetch(`${apiBase}/services`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: Array<{ title: string; category?: string }>) => {
        const titles = data.map((item) => item.title).filter(Boolean);
        setServiceTitles(titles.slice(0, 12));
        const categories = Array.from(
          new Set(data.map((item) => item.category).filter(Boolean))
        ) as string[];
        setServiceCategories(categories);
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
            <Button type="button" onClick={() => navigate("/services")}>
              Termin
            </Button>
          </div>
        </div>
      </div>
    </div>
    <section className={styles.categoryStrip}>
      <div className={styles.categoryStrip__inner}>
        <div className={styles.categoryStrip__list}>
          {serviceCategories.map((category) => (
            <button
              key={category}
              type="button"
              className={styles.categoryStrip__chip}
              onClick={() => navigate(`/services?category=${encodeURIComponent(category)}`)}
            >
              {category}
            </button>
          ))}
        </div>
        <Button type="button" onClick={() => navigate("/services")}>
          Alle Services
        </Button>
      </div>
    </section>
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
    <section className={styles.location}>
        <div className={styles.location__map}>
          {mapReady ? (
            <MapContainer
              center={mapCenter}
              zoom={17}
              scrollWheelZoom={false}
              zoomControl={false}
              className={styles.location__leaflet}
            >
              <ZoomControl position="topright" />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                detectRetina
                maxZoom={20}
              />
              <CircleMarker
                center={mapCenter}
                radius={18}
                pathOptions={{
                  color: "lightgray",
                  weight: 1,
                  fillColor: "lightgray",
                  fillOpacity: 0.6,
                }}
              />
              <Marker position={mapCenter} icon={mapMarkerIcon} />
            </MapContainer>
          ) : (
            <div className={styles.location__mapFallback}>Karte wird geladen…</div>
          )}
          <div className={styles.location__addressWrap}>
            <span className={styles.location__addressText}>{addressLabel}</span>
          </div>
          <div className={styles.location__ctaWrap}>
            <a
              className={styles.location__cta}
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Route öffnen
            </a>
          </div>
        </div>
    </section>
  </div>;
}
