import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionShell } from "../../components/SectionShell/SectionShell";
import { Button } from "../../components/UI/Button/Button";
import styles from "./Services.module.scss";

type Service = {
  id: string;
  title: string;
  category: string;
  priceFrom: number;
  durationMin: number;
  short: string;
};

type Master = {
  id: string;
  name: string;
  role: string;
  experienceYears: number;
  services: string[];
  photo: string;
};

type Hours = {
  day: string;
  label: string;
  weekday: number;
  start: string;
  end: string;
  slotMinutes: number;
};

type MasterHour = {
  masterId: string;
  day: string;
  label: string;
  weekday: number;
  start: string;
  end: string;
};

const apiBase = import.meta.env.VITE_API_URL as string | undefined;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

const parseTime = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const formatTimeLabel = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return `${h}:${String(m).padStart(2, "0")}`;
};

async function fetchServices(): Promise<Service[] | null> {
  if (!apiBase) return null;
  const response = await fetch(`${apiBase}/services`);
  if (!response.ok) return null;
  return (await response.json()) as Service[];
}

async function fetchMasters(): Promise<Master[] | null> {
  if (!apiBase) return null;
  const response = await fetch(`${apiBase}/masters`);
  if (!response.ok) return null;
  return (await response.json()) as Master[];
}

async function fetchHours(): Promise<Hours[] | null> {
  if (!apiBase) return null;
  const response = await fetch(`${apiBase}/hours`);
  if (!response.ok) return null;
  return (await response.json()) as Hours[];
}

async function fetchMasterHours(): Promise<MasterHour[] | null> {
  if (!apiBase) return null;
  const response = await fetch(`${apiBase}/master-hours`);
  if (!response.ok) return null;
  return (await response.json()) as MasterHour[];
}

export function ServicesList() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [hours, setHours] = useState<Hours[]>([]);
  const [masterHours, setMasterHours] = useState<MasterHour[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Alle");
  const [selectedMaster, setSelectedMaster] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!apiBase) {
      setLoadError("API URL ist nicht konfiguriert.");
      setIsLoading(false);
      return;
    }
    Promise.all([fetchServices(), fetchMasters(), fetchHours(), fetchMasterHours()])
      .then(([servicesData, mastersData, hoursData, masterHoursData]) => {
        if (!active) return;
        if (!servicesData || !mastersData || !hoursData || !masterHoursData) {
          setLoadError("Daten konnten nicht geladen werden.");
          return;
        }
        setServices(servicesData);
        setMasters(mastersData);
        setHours(hoursData);
        setMasterHours(masterHoursData);
        const iryna = mastersData.find(
          (master) => master.name.toLowerCase() === "iryna marinina"
        );
        if (iryna) {
          setSelectedMaster(iryna.id);
        }
      })
      .catch(() => {
        if (active) setLoadError("Daten konnten nicht geladen werden.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(services.map((service) => service.category)));
    return ["Alle", ...unique];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === "Alle") return services;
    return services.filter((service) => service.category === selectedCategory);
  }, [services, selectedCategory]);

  const masterHoursByDay = useMemo(() => {
    if (!selectedMaster) return new Map<number, MasterHour[]>();
    const map = new Map<number, MasterHour[]>();
    masterHours
      .filter((entry) => entry.masterId === selectedMaster)
      .sort((a, b) => parseTime(a.start) - parseTime(b.start))
      .forEach((entry) => {
        const list = map.get(entry.weekday) ?? [];
        list.push(entry);
        map.set(entry.weekday, list);
      });
    return map;
  }, [masterHours, selectedMaster]);

  return (
    <div className={styles.page}>
      <div className={styles.banner} role="presentation" aria-hidden="true" />
      <section className={styles.hero}>
        <div className={styles.hero__content}>
          <h1 className={styles.hero__title}>Unsere Services</h1>
          <p className={styles.hero__text}>
            Transparente Preise, klare Ablaufe und persoenliche Betreuung. Waehlen
            Sie eine Leistung und buchen Sie Ihren Termin.
          </p>
        </div>
        <div className={styles.hero__panel}>
          <div>
            <p className={styles.hero__panelTitle}>Oeffnungszeiten</p>
            <ul className={styles.hours}>
              {hours.map((day) => {
                const intervals = masterHoursByDay.get(day.weekday) ?? [];
                return (
                  <li key={day.day}>
                    <span>{day.label}</span>
                    <span>
                      {intervals.length > 0
                        ? intervals
                            .map(
                              (entry) =>
                                `${formatTimeLabel(entry.start)} - ${formatTimeLabel(entry.end)}`
                            )
                            .join(" / ")
                        : `${formatTimeLabel(day.start)} - ${formatTimeLabel(day.end)}`}
                    </span>
                  </li>
                );
              })}
              <li className={styles.hours__closed}>
                <span>Sonntag</span>
                <span>geschlossen</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.services}>
        {isLoading ? <p className={styles.slots__closed}>Lade Daten...</p> : null}
        {loadError ? <p className={styles.form__error}>{loadError}</p> : null}
        <div className={styles.services__layout}>
          <aside className={styles.categoryNav}>
            <p className={styles.categoryNav__title}>Kategorien</p>
            <div className={styles.categoryNav__list}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.categoryNav__item} ${
                    selectedCategory === cat ? styles.categoryNav__itemActive : ""
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </aside>

          <div className={styles.services__content}>
            <div className={styles.services__line}>
              {filteredServices.map((service) => (
                <button
                  key={service.id}
                  className={styles.lineItem}
                  type="button"
                  onClick={() => navigate(`/services/${service.id}`)}
                >
                  {service.title}
                </button>
              ))}
            </div>

            <div className={styles.cards}>
              {filteredServices.map((service) => (
                <article key={service.id} className={styles.card}>
                  <div className={styles.card__head}>
                    <div>
                      <p className={styles.card__title}>{service.title}</p>
                      <p className={styles.card__category}>{service.category}</p>
                    </div>
                    <div className={styles.card__price}>ab {formatCurrency(service.priceFrom)}</div>
                  </div>
                  <p className={styles.card__desc}>{service.short}</p>
                  <div className={styles.card__meta}>
                    <span>Individuell anpassbar</span>
                    <span className={styles.card__durationMin}>{service.durationMin} min</span>
                  </div>
                  <Button type="button" onClick={() => navigate(`/services/${service.id}`)}>
                    Buchen
                  </Button>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SectionShell
        className={styles.team}
        title="Unsere Meister"
        subtitle="Alle Spezialistinnen sind handverlesen und arbeiten nach klaren Standards."
      >
        <div className={styles.team__grid}>
          {masters.map((master) => (
            <article key={master.id} className={styles.master}>
              <div className={styles.master__media}>
                {master.photo ? (
                  <img src={master.photo} alt={master.name} />
                ) : (
                  <span>
                    {master.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <div className={styles.master__info}>
                <p className={styles.master__name}>{master.name}</p>
                <p className={styles.master__role}>{master.role}</p>
                <p className={styles.master__exp}>{master.experienceYears} Jahre Erfahrung</p>
              </div>
            </article>
          ))}
        </div>
      </SectionShell>
    </div>
  );
}
