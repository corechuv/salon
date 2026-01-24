import { useMemo, useState, useEffect, type FormEvent } from "react";
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

type Booking = {
  id: string;
  date: string;
  time: string;
  serviceId: string;
  masterId: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  consentName?: string;
  consentAccepted?: boolean;
};

const apiBase = import.meta.env.VITE_API_URL as string | undefined;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDateInput = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().split("T")[0];
};

const parseTime = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const formatTimeLabel = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return `${h}:${String(m).padStart(2, "0")}`;
};

const buildSlots = (start: string, end: string, step: number) => {
  const slots: string[] = [];
  let current = parseTime(start);
  const endMinutes = parseTime(end);
  while (current + step <= endMinutes) {
    const hoursPart = String(Math.floor(current / 60)).padStart(2, "0");
    const minutesPart = String(current % 60).padStart(2, "0");
    slots.push(`${hoursPart}:${minutesPart}`);
    current += step;
  }
  return slots;
};

const getHoursForDate = (dateValue: string, list: Hours[]) => {
  const date = new Date(dateValue);
  const weekday = date.getDay();
  return list.find((entry) => entry.weekday === weekday);
};

const addMinutes = (time: string, minutesToAdd: number) => {
  const total = parseTime(time) + minutesToAdd;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const isOverlap = (startA: string, endA: string, startB: string, endB: string) =>
  parseTime(startA) < parseTime(endB) && parseTime(endA) > parseTime(startB);

const storageKey = "mira_bookings";

const readLocalBookings = (): Booking[] => {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Booking[];
  } catch {
    return [];
  }
};

const writeLocalBookings = (bookings: Booking[]) => {
  localStorage.setItem(storageKey, JSON.stringify(bookings));
};

async function fetchBookings(date: string): Promise<Booking[]> {
  if (!apiBase) return [];
  const response = await fetch(`${apiBase}/bookings?date=${date}`);
  if (!response.ok) return [];
  const data = (await response.json()) as Array<
    Booking & { service_id?: string; master_id?: string }
  >;
  return data.map((item) => ({
    ...item,
    serviceId: item.serviceId ?? item.service_id ?? "",
    masterId: item.masterId ?? item.master_id ?? "",
  }));
}

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

async function sendBooking(payload: Booking): Promise<void> {
  if (!apiBase) {
    throw new Error("API not configured");
  }
  const response = await fetch(`${apiBase}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to send booking");
  }
}

export function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [hours, setHours] = useState<Hours[]>([]);
  const [masterHours, setMasterHours] = useState<MasterHour[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Alle");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState(formatDateInput(new Date()));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedMaster, setSelectedMaster] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentName, setConsentName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const local = readLocalBookings();
    setBookings(local);
  }, []);

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

  useEffect(() => {
    let active = true;
    if (!apiBase) return;
    fetchBookings(selectedDate)
      .then((remote) => {
        if (active && remote.length > 0) {
          setBookings((prev) => {
            const merged = [...prev];
            remote.forEach((item) => {
              if (!merged.find((b) => b.id === item.id)) {
                merged.push(item);
              }
            });
            return merged;
          });
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [selectedDate]);

  useEffect(() => {
    setSelectedTime(null);
  }, [selectedDate]);

  useEffect(() => {
    if (!isModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isModalOpen]);

  const activeHours = useMemo(() => getHoursForDate(selectedDate, hours), [selectedDate, hours]);

  const masterActiveHours = useMemo(() => {
    if (!selectedMaster) return [];
    const date = new Date(selectedDate);
    const weekday = date.getDay();
    return masterHours.filter(
      (entry) => entry.masterId === selectedMaster && entry.weekday === weekday
    );
  }, [masterHours, selectedDate, selectedMaster]);

  const slots = useMemo(() => {
    if (masterActiveHours.length === 0) return [];
    const all = masterActiveHours.flatMap((interval) =>
      buildSlots(interval.start, interval.end, 30)
    );
    const unique = Array.from(new Set(all));
    return unique.sort((a, b) => parseTime(a) - parseTime(b));
  }, [masterActiveHours]);

  const availableMasters = useMemo(() => {
    if (!selectedService) return masters;
    return masters.filter((master) => master.services.includes(selectedService.id));
  }, [selectedService, masters]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(services.map((service) => service.category)));
    return ["Alle", ...unique];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === "Alle") return services;
    return services.filter((service) => service.category === selectedCategory);
  }, [services, selectedCategory]);

  const bookedRanges = useMemo(() => {
    const serviceMap = new Map(services.map((s) => [s.id, s.durationMin]));
    return bookings
      .filter((item) => item.date === selectedDate)
      .filter((item) => (selectedMaster ? item.masterId === selectedMaster : true))
      .map((item) => {
        const duration = serviceMap.get(item.serviceId) ?? 0;
        const end = addMinutes(item.time, duration);
        return { start: item.time, end };
      });
  }, [bookings, selectedDate, selectedMaster, services]);

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

  const closedAfter = useMemo(() => {
    if (masterActiveHours.length === 0) return null;
    return masterActiveHours.map((interval) => interval.end);
  }, [masterActiveHours]);

  const openModal = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
    setSelectedTime(null);
    if (!selectedMaster) {
      const iryna = masters.find((master) => master.name.toLowerCase() === "iryna marinina");
      setSelectedMaster(iryna ? iryna.id : masters[0]?.id ?? null);
    }
    setError(null);
    setSuccess(null);
    setConsent(false);
    setConsentName("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedService || !selectedTime || !selectedMaster) {
      setError("Bitte Service, Datum, Uhrzeit und Meister waehlen.");
      return;
    }
    if (!consent) {
      setError("Bitte die Zustimmung zur Behandlung bestaetigen.");
      return;
    }
    if (!consentName.trim()) {
      setError("Bitte den Namen fuer die Zustimmung eingeben.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const payload: Booking = {
      id: crypto.randomUUID(),
      date: selectedDate,
      time: selectedTime,
      serviceId: selectedService.id,
      masterId: selectedMaster,
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      notes: String(form.get("notes") || ""),
      consentName: consentName.trim(),
      consentAccepted: consent,
    };

    if (!payload.name || !payload.email || !payload.phone) {
      setError("Bitte alle Kontaktfelder ausfuellen.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await sendBooking(payload);
      setSuccess("Termin gesendet. Bitte bestaetige ueber den Link in deiner E-Mail.");
    } catch (_err) {
      setError("Versand fehlgeschlagen. Bitte spaeter erneut versuchen.");
    }

    setBookings((prev) => {
      const next = [...prev, payload];
      writeLocalBookings(next);
      return next;
    });

    setIsSubmitting(false);
  };

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
        {isLoading ? (
          <p className={styles.slots__closed}>Lade Daten...</p>
        ) : null}
        {loadError ? (
          <p className={styles.form__error}>{loadError}</p>
        ) : null}
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
                  onClick={() => openModal(service)}
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
                    <div className={styles.card__price}>
                      ab {formatCurrency(service.priceFrom)}
                    </div>
                  </div>
                  <p className={styles.card__desc}>{service.short}</p>
                  <div className={styles.card__meta}>
                    <span>Individuell anpassbar</span>
                    <span className={styles.card__durationMin}>{service.durationMin} min</span>
                  </div>
                  <button
                    className={styles.card__action}
                    type="button"
                    onClick={() => openModal(service)}
                  >
                    Buchen
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.team}>
        <div className={styles.team__header}>
          <h2>Unsere Meister</h2>
          <p>
            Alle Spezialistinnen sind handverlesen und arbeiten nach klaren
            Standards.
          </p>
        </div>
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
      </section>

      {isModalOpen && selectedService ? (
        <div className={styles.modal} role="dialog" aria-modal="true">
          <div className={styles.modal__overlay} onClick={closeModal} />
          <div className={styles.modal__panel}>
            <div className={styles.modal__head}>
              <div>
                <p className={styles.modal__title}>{selectedService.title}</p>
                <p className={styles.modal__subtitle}>
                  ab {formatCurrency(selectedService.priceFrom)} · {selectedService.durationMin} min
                </p>
              </div>
              <button type="button" className={styles.modal__close} onClick={closeModal} aria-label="Schliessen">
                ✕
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.form__grid}>
                <label>
                  Datum
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    min={formatDateInput(new Date())}
                    required
                  />
                </label>
                <label>
                  Meister
                  <select
                    value={selectedMaster ?? ""}
                    onChange={(event) => setSelectedMaster(event.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Bitte waehlen
                    </option>
                    {availableMasters.map((master) => (
                      <option key={master.id} value={master.id}>
                        {master.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className={styles.slots}>
                <p className={styles.slots__title}>Uhrzeit</p>
                {!activeHours ? (
                  <p className={styles.slots__closed}>Sonntag ist geschlossen.</p>
                ) : !selectedMaster ? (
                  <p className={styles.slots__closed}>
                    Bitte zuerst einen Meister waehlen.
                  </p>
                ) : masterActiveHours.length === 0 ? (
                  <p className={styles.slots__closed}>
                    Dieser Meister arbeitet an diesem Tag nicht.
                  </p>
                ) : (
                  <div className={styles.slots__grid}>
                    {slots.map((slot) => {
                      const duration = selectedService?.durationMin ?? 0;
                      const slotEnd = addMinutes(slot, duration);
                      const exceedsClosing = closedAfter
                        ? !masterActiveHours.some(
                            (interval) =>
                              parseTime(slot) >= parseTime(interval.start) &&
                              parseTime(slotEnd) <= parseTime(interval.end)
                          )
                        : false;
                      const isBusy = bookedRanges.some((range) =>
                        isOverlap(slot, slotEnd, range.start, range.end)
                      );
                      return (
                        <button
                          key={slot}
                          type="button"
                          className={`${styles.slot} ${
                            selectedTime === slot ? styles.slot__active : ""
                          } ${isBusy || exceedsClosing ? styles.slot__busy : ""}`}
                          onClick={() => {
                            if (isBusy || exceedsClosing) return;
                            setSelectedTime(slot);
                          }}
                          disabled={isBusy || exceedsClosing}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={styles.form__grid}>
                <label>
                  Name
                  <input name="name" type="text" placeholder="Ihr Name" required />
                </label>
                <label>
                  Telefon
                  <input name="phone" type="tel" placeholder="+49" required />
                </label>
                <label>
                  E-Mail
                  <input name="email" type="email" placeholder="name@mail.de" required />
                </label>
              </div>

              <label className={styles.form__wide}>
                Notiz
                <textarea name="notes" placeholder="Wunsch oder Hinweis" rows={3} />
              </label>
              <label className={styles.form__wide}>
                Unterschrift (vollstaendiger Name)
                <input
                  type="text"
                  value={consentName}
                  onChange={(event) => setConsentName(event.target.value)}
                  placeholder="Vor- und Nachname"
                  required
                />
              </label>
              <label className={styles.form__consent}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  required
                />
                <span>
                  Ich bestaetige, dass ich mit den Bedingungen und dem
                  Behandlungsvertrag einverstanden bin.
                </span>
              </label>

              {error ? <p className={styles.form__error}>{error}</p> : null}
              {success ? <p className={styles.form__success}>{success}</p> : null}

              <div className={styles.form__actions}>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Senden..." : "Termin anfragen"}
                </button>
                <span className={styles.form__hint}>
                  Bestaetigung erfolgt per E-Mail.
                </span>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
