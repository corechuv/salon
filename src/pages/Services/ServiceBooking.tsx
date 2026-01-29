import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  durationMin?: number;
  status?: string;
  createdAt?: string;
  giftCodes?: string[];
  consentName?: string;
  consentAccepted?: boolean;
};

type GiftValidation = {
  status: "idle" | "checking" | "valid" | "invalid";
  items: Array<{
    code: string;
    balance?: number;
    currency?: string;
    reason?: string;
  }>;
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

const normalizeDateValue = (value: string) => value.split("T")[0];

const normalizeTimeValue = (value: string) => {
  if (!value) return value;
  return value.slice(0, 5);
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const parseTime = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const addMinutes = (time: string, minutesToAdd: number) => {
  const total = parseTime(time) + minutesToAdd;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const isOverlap = (startA: string, endA: string, startB: string, endB: string) =>
  parseTime(startA) < parseTime(endB) && parseTime(endA) > parseTime(startB);

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

const storageKey = "mira_bookings";
const PENDING_TTL_MINUTES = 30;

const isRecentBooking = (createdAt?: string, status?: string) => {
  if (status && status !== "pending") return true;
  if (!createdAt) return true;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return true;
  return Date.now() - created < PENDING_TTL_MINUTES * 60_000;
};

const readLocalBookings = (): Booking[] => {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return [];
  try {
    const items = JSON.parse(raw) as Booking[];
    return items.filter((item) => isRecentBooking(item.createdAt, item.status));
  } catch {
    return [];
  }
};

const writeLocalBookings = (bookings: Booking[]) => {
  localStorage.setItem(storageKey, JSON.stringify(bookings));
};

const mergeBookings = (prev: Booking[], incoming: Booking[]) => {
  const next = [...prev];
  incoming.forEach((item) => {
    const index = next.findIndex((entry) => entry.id === item.id);
    if (index >= 0) {
      next[index] = { ...next[index], ...item };
    } else {
      next.push(item);
    }
  });
  return next.filter((item) => isRecentBooking(item.createdAt, item.status));
};

async function fetchBookings(date: string): Promise<Booking[]> {
  if (!apiBase) return [];
  const response = await fetch(`${apiBase}/bookings?date=${date}`);
  if (!response.ok) return [];
  const data = (await response.json()) as Array<
    Booking & {
      service_id?: string;
      master_id?: string;
      duration_min?: number;
      status?: string;
      created_at?: string;
    }
  >;
  return data.map((item) => ({
    ...item,
    date: item.date ? normalizeDateValue(String(item.date)) : item.date,
    time: item.time ? normalizeTimeValue(String(item.time)) : item.time,
    serviceId: item.serviceId ?? item.service_id ?? "",
    masterId: item.masterId ?? item.master_id ?? "",
    durationMin: item.durationMin ?? item.duration_min ?? undefined,
    createdAt: item.createdAt ?? item.created_at ?? undefined,
    status: item.status ?? undefined,
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
    const data = await response.json().catch(() => null);
    const message = data?.error || "Failed to send booking";
    throw new Error(message);
  }
}

export function ServiceBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const datePickerRef = useRef<HTMLInputElement | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [masterHours, setMasterHours] = useState<MasterHour[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState(formatDateInput(new Date()));
  const [weekStart, setWeekStart] = useState(formatDateInput(new Date()));
  const [weekLength, setWeekLength] = useState(7);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedMaster, setSelectedMaster] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentName, setConsentName] = useState("");
  const [giftCodes, setGiftCodes] = useState<string[]>([""]);
  const [giftValidation, setGiftValidation] = useState<GiftValidation>({
    status: "idle",
    items: [],
  });
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
    Promise.all([fetchServices(), fetchMasters(), fetchMasterHours()])
      .then(([servicesData, mastersData, masterHoursData]) => {
        if (!active) return;
        if (!servicesData || !mastersData || !masterHoursData) {
          setLoadError("Daten konnten nicht geladen werden.");
          return;
        }
        setServices(servicesData);
        setMasters(mastersData);
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
    if (!id || services.length === 0) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    const matched = services.find((service) => service.id === id);
    setSelectedService(matched ?? null);
    setSelectedTime(null);
    setError(null);
    setSuccess(null);
    setConsent(false);
    setConsentName("");
    setGiftCodes([""]);
    setGiftValidation({ status: "idle", items: [] });
  }, [id, services]);

  useEffect(() => {
    let active = true;
    if (!apiBase) return;
    fetchBookings(selectedDate)
      .then((remote) => {
        if (active && remote.length > 0) {
          setBookings((prev) => mergeBookings(prev, remote));
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
      buildSlots(interval.start, interval.end, 15)
    );
    const unique = Array.from(new Set(all));
    return unique.sort((a, b) => parseTime(a) - parseTime(b));
  }, [masterActiveHours]);

  const availableMasters = useMemo(() => {
    if (!selectedService) return masters;
    return masters.filter((master) => master.services.includes(selectedService.id));
  }, [selectedService, masters]);

  const selectedDateObj = useMemo(
    () => new Date(`${selectedDate}T00:00:00`),
    [selectedDate]
  );

  const weekDates = useMemo(() => {
    const base = new Date(`${weekStart}T00:00:00`);
    return Array.from({ length: weekLength }, (_, index) => addDays(base, index));
  }, [weekStart, weekLength]);

  const rangeLabel = useMemo(() => {
    if (weekDates.length === 0) return "";
    const formatter = new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "short",
    });
    const first = formatter.format(weekDates[0]);
    const last = formatter.format(weekDates[weekDates.length - 1]);
    return `${first} – ${last}`;
  }, [weekDates]);

  const todayValue = useMemo(() => formatDateInput(new Date()), []);
  const canGoPrev = useMemo(() => {
    const start = new Date(`${weekStart}T00:00:00`);
    const today = new Date(`${todayValue}T00:00:00`);
    return start.getTime() > today.getTime();
  }, [weekStart, todayValue]);

  useEffect(() => {
      const start = new Date(`${weekStart}T00:00:00`);
      const end = addDays(start, weekLength - 1);
      const today = new Date(`${todayValue}T00:00:00`);
      if (selectedDateObj < start || selectedDateObj > end) {
        const nextStart = selectedDateObj < today ? today : selectedDateObj;
        setWeekStart(formatDateInput(nextStart));
        setWeekLength(7);
      }
  }, [selectedDateObj, weekStart, weekLength, todayValue]);

  const bookedRanges = useMemo(() => {
    const serviceMap = new Map(services.map((s) => [s.id, s.durationMin]));
    return bookings
      .filter((item) => item.date === selectedDate)
      .filter((item) => (selectedMaster ? item.masterId === selectedMaster : true))
      .filter((item) => !item.status || item.status === "pending" || item.status === "confirmed")
      .filter((item) => isRecentBooking(item.createdAt, item.status))
      .map((item) => {
        const duration = item.durationMin ?? serviceMap.get(item.serviceId) ?? 0;
        const end = addMinutes(item.time, duration);
        return { start: item.time, end, status: item.status ?? "confirmed" };
      });
  }, [bookings, selectedDate, selectedMaster, services]);

  const getSlotState = (slot: string) => {
    const duration = selectedService?.durationMin ?? 0;
    const slotEnd = addMinutes(slot, duration);
    const isToday = selectedDate === formatDateInput(new Date());
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const isPastToday = isToday && parseTime(slot) <= nowMinutes;
    const exceedsClosing =
      masterActiveHours.length > 0 &&
      !masterActiveHours.some(
        (interval) =>
          parseTime(slot) >= parseTime(interval.start) &&
          parseTime(slotEnd) <= parseTime(interval.end)
      );
    const overlapEntry = bookedRanges.find((range) =>
      isOverlap(slot, slotEnd, range.start, range.end)
    );
    const isBusy = Boolean(overlapEntry) || isPastToday;
    const statusLabel = isPastToday
      ? "Vergangen"
      : exceedsClosing
      ? "Nicht verfügbar"
      : overlapEntry?.status === "pending"
        ? "Reserviert"
        : overlapEntry
          ? "Belegt"
          : "";
    return { isBusy, exceedsClosing, statusLabel };
  };

  useEffect(() => {
    if (!selectedTime || !selectedService || !selectedMaster) return;
    const { isBusy, exceedsClosing } = getSlotState(selectedTime);
    if (isBusy || exceedsClosing) {
      setSelectedTime(null);
    }
  }, [
    selectedTime,
    selectedService,
    selectedMaster,
    selectedDate,
    bookedRanges,
    masterActiveHours,
  ]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedService || !selectedTime || !selectedMaster) {
      setError("Bitte Service, Datum, Uhrzeit und Meister waehlen.");
      return;
    }
    const slotState = getSlotState(selectedTime);
    if (slotState.isBusy || slotState.exceedsClosing) {
      setError("Dieser Termin ist bereits belegt. Bitte eine andere Zeit waehlen.");
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
    const normalizedCodes = giftCodes.map((code) => code.trim()).filter(Boolean);
    if (normalizedCodes.length > 0 && giftValidation.status !== "valid") {
      setError("Bitte Gutschein-Code zuerst prüfen.");
      return;
    }

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
      giftCodes:
        giftValidation.status === "valid"
          ? giftValidation.items.map((item) => item.code)
          : undefined,
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
      setBookings((prev) => {
        const next = mergeBookings(prev, [
          {
            ...payload,
            status: "pending",
            createdAt: new Date().toISOString(),
          },
        ]);
        writeLocalBookings(next);
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Versand fehlgeschlagen.";
      if (message === "gift not found") {
        setError("Gutschein-Code nicht gefunden.");
      } else if (message === "gift not available") {
        setError("Gutschein ist bereits vollständig eingelöst.");
      } else if (message === "gift empty") {
        setError("Gutschein hat kein Guthaben mehr.");
      } else if (message === "gift currency mismatch") {
        setError("Gutschein-Währung passt nicht.");
      } else if (message === "slot overlaps") {
        setError("Dieser Termin ist bereits belegt. Bitte eine andere Zeit waehlen.");
        fetchBookings(selectedDate)
          .then((remote) => {
            if (remote.length > 0) {
              setBookings((prev) => mergeBookings(prev, remote));
            }
          })
          .catch(() => undefined);
      } else if (message === "rate_limited") {
        setError("Zu viele Versuche. Bitte spaeter versuchen.");
      } else {
        setError("Versand fehlgeschlagen. Bitte spaeter erneut versuchen.");
      }
    }
    setIsSubmitting(false);
  };

  const handleCheckGift = async () => {
    const codes = giftCodes
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean);
    const uniqueCodes = Array.from(new Set(codes));
    if (uniqueCodes.length === 0) {
      setGiftValidation({ status: "invalid", items: [] });
      return;
    }
    if (!apiBase) {
      setGiftValidation({
        status: "invalid",
        items: uniqueCodes.map((code) => ({ code, reason: "error" })),
      });
      return;
    }
    setGiftValidation({ status: "checking", items: [] });
    try {
      const results = await Promise.all(
        uniqueCodes.map(async (code) => {
          const response = await fetch(
            `${apiBase}/gift/validate?code=${encodeURIComponent(code)}`
          );
          const data = await response.json().catch(() => null);
          if (response.status === 429) {
            return { code, reason: "rate_limited" };
          }
          if (!data?.valid) {
            return { code, reason: data?.reason || "not_found" };
          }
          return { code, balance: data.balance, currency: data.currency };
        })
      );
      const invalid = results.filter((item) => item.reason);
      setGiftValidation({
        status: invalid.length === 0 ? "valid" : "invalid",
        items: results,
      });
      if (uniqueCodes.length > 0 && giftCodes[giftCodes.length - 1]?.trim()) {
        setGiftCodes((prev) => [...prev, ""]);
      }
    } catch {
      setGiftValidation({
        status: "invalid",
        items: uniqueCodes.map((code) => ({ code, reason: "error" })),
      });
    }
  };

  const updateGiftCode = (index: number, value: string) => {
    setGiftCodes((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setGiftValidation({ status: "idle", items: [] });
  };

  const removeGiftCode = (index: number) => {
    setGiftCodes((prev) => prev.filter((_, idx) => idx !== index));
    setGiftValidation({ status: "idle", items: [] });
  };

  const totalGiftBalance = giftValidation.items.reduce(
    (sum, item) => sum + (item.balance || 0),
    0
  );

  return (
    <div className={styles.page}>
      <div className={styles.banner} role="presentation" aria-hidden="true" />
      
      {isLoading ? <p className={styles.slots__closed}>Lade Daten...</p> : null}
      {loadError ? <p className={styles.form__error}>{loadError}</p> : null}

      {selectedService ? (
        <section className={styles.bookingPage}>
          <div className={styles.booking__panel}>
            <div className={styles.booking__head}>
              <div>
                <p className={styles.booking__title}>{selectedService.title}</p>
                <p className={styles.booking__subtitle}>
                  ab {formatCurrency(selectedService.priceFrom)} · {selectedService.durationMin} min
                </p>
              </div>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              {success ? (
                <div className={styles.successCard}>
                  <p className={styles.successCard__title}>Gesendet</p>
                  <p className={styles.successCard__text}>
                    Wir haben deine Anfrage erhalten. Bitte bestätige den Termin per E-Mail.
                  </p>
                  <div className={styles.successCard__details}>
                    <span>{selectedService?.title}</span>
                    <span>
                      {selectedDate} · {selectedTime}
                    </span>
                    <span>
                      {masters.find((m) => m.id === selectedMaster)?.name || selectedMaster}
                    </span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => navigate("/services")}
                  >
                    Zurück zu Services
                  </Button>
                </div>
              ) : (
                <>
                  <div className={styles.weekPicker}>
                    <div className={styles.weekPicker__inner}>
                      <div className={styles.weekPicker__header}>
                      <button
                        type="button"
                        className={styles.weekPicker__nav}
                        onClick={() => {
                          if (!canGoPrev) return;
                          const start = new Date(`${weekStart}T00:00:00`);
                          const nextStart = addDays(start, -7);
                          const today = new Date(`${todayValue}T00:00:00`);
                          const clamped = nextStart < today ? today : nextStart;
                          const value = formatDateInput(clamped);
                          setWeekStart(value);
                          setSelectedDate(value);
                          setWeekLength(7);
                        }}
                        disabled={!canGoPrev}
                        aria-label="Vorherige Woche"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M15 6l-6 6 6 6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={styles.weekPicker__range}
                        onClick={() => {
                          if (datePickerRef.current?.showPicker) {
                            datePickerRef.current.showPicker();
                          } else {
                            datePickerRef.current?.focus();
                          }
                        }}
                      >
                        {rangeLabel}
                      </button>
                      <button
                        type="button"
                        className={styles.weekPicker__nav}
                        onClick={() => {
                          const start = new Date(`${weekStart}T00:00:00`);
                          const nextStart = addDays(start, 7);
                          const value = formatDateInput(nextStart);
                          setWeekStart(value);
                          setSelectedDate(value);
                          setWeekLength(7);
                        }}
                        aria-label="Nächste Woche"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M9 6l6 6-6 6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      </div>
                      <div className={styles.weekPicker__list}>
                        {weekDates.map((date, index) => {
                          const value = formatDateInput(date);
                          const isActive = value === selectedDate;
                          const weekday = new Intl.DateTimeFormat("de-DE", {
                            weekday: "short",
                          })
                            .format(date)
                            .toUpperCase();
                          const dayNumber = new Intl.DateTimeFormat("de-DE", {
                            day: "2-digit",
                          }).format(date);
                          return (
                            <button
                              key={value}
                              type="button"
                              className={`${styles.weekPicker__item} ${
                                isActive ? styles.weekPicker__itemActive : ""
                              }`}
                              onClick={() => {
                                setSelectedDate(value);
                                if (index === weekDates.length - 1) {
                                  setWeekLength((prev) => prev + 1);
                                }
                              }}
                            >
                              <span className={styles.weekPicker__dow}>{weekday}</span>
                              <span className={styles.weekPicker__day}>{dayNumber}</span>
                            </button>
                          );
                        })}
                      </div>
                      <input
                        ref={datePickerRef}
                        className={styles.weekPicker__input}
                        type="date"
                        value={selectedDate}
                        onChange={(event) => setSelectedDate(event.target.value)}
                        min={formatDateInput(new Date())}
                      />
                    </div>
                  </div>

                  <div className={styles.form__wrap}>
                    <div className={styles.form__grid}>
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
                      {!selectedMaster ? (
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
                            const { isBusy, exceedsClosing, statusLabel } = getSlotState(slot);
                            return (
                              <button
                                key={slot}
                                type="button"
                                className={`${styles.slot} ${
                                  selectedTime === slot ? styles.slot__active : ""
                                } ${isBusy || exceedsClosing ? styles.slot__busy : ""} ${
                                  statusLabel ? "" : styles.slot__single
                                }`}
                                onClick={() => {
                                  if (isBusy || exceedsClosing) return;
                                  setSelectedTime(slot);
                                }}
                                disabled={isBusy || exceedsClosing}
                                title={statusLabel ? `${slot} · ${statusLabel}` : slot}
                              >
                                <span className={styles.slot__time}>{slot}</span>
                                {statusLabel ? (
                                  <span className={styles.slot__label}>{statusLabel}</span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {selectedService && selectedMaster && selectedTime ? (
                      <div className={styles.summary}>
                        <p className={styles.summary__title}>Dein Termin</p>
                        <div className={styles.summary__grid}>
                          <div>
                            <span>Service</span>
                            <strong>{selectedService.title}</strong>
                          </div>
                          <div>
                            <span>Meister</span>
                            <strong>
                              {masters.find((m) => m.id === selectedMaster)?.name ||
                                selectedMaster}
                            </strong>
                          </div>
                          <div>
                            <span>Datum</span>
                            <strong>{selectedDate}</strong>
                          </div>
                          <div>
                            <span>Uhrzeit</span>
                            <strong>{selectedTime}</strong>
                          </div>
                        </div>
                      </div>
                    ) : null}

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
                      Gutschein-Codes (optional)
                      <div className={styles.form__giftList}>
                        {giftCodes.map((code, index) => {
                          const normalized = code.trim().toUpperCase();
                          const item = giftValidation.items.find(
                            (entry) => entry.code === normalized
                          );
                          return (
                            <div key={`${index}-${code}`} className={styles.form__giftRow}>
                              <input
                                type="text"
                                placeholder="GIFT-XXXX-XXX"
                                value={code}
                                onChange={(event) => updateGiftCode(index, event.target.value)}
                              />
                              {giftCodes.length > 1 ? (
                                <button
                                  type="button"
                                  className={styles.form__giftRemove}
                                  onClick={() => removeGiftCode(index)}
                                  aria-label="Entfernen"
                                >
                                  ✕
                                </button>
                              ) : null}
                              {item?.balance ? (
                                <span className={styles.form__giftOk}>
                                  Guthaben: {item.balance} EUR
                                </span>
                              ) : item?.reason ? (
                                <span className={styles.form__giftError}>
                                  {item.reason === "rate_limited"
                                    ? "Zu viele Versuche. Bitte spaeter versuchen."
                                    : item.reason === "not_found"
                                      ? "Nicht gefunden"
                                      : item.reason === "not_available"
                                        ? "Nicht gültig"
                                        : item.reason === "empty"
                                          ? "Kein Guthaben"
                                          : "Fehler"}
                                </span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                      <div className={styles.form__giftActions}>
                        <Button
                          type="button"
                          onClick={handleCheckGift}
                          disabled={giftValidation.status === "checking"}
                        >
                          {giftValidation.status === "checking" ? "Prüfen..." : "Prüfen"}
                        </Button>
                      </div>
                    </label>

                    {selectedService ? (
                      <div className={styles.form__price}>
                        <span>Preis: {formatCurrency(selectedService.priceFrom)}</span>
                        {giftValidation.status === "valid" ? (
                          <>
                            <span>
                              Gutschein: -
                              {formatCurrency(
                                Math.min(totalGiftBalance, selectedService.priceFrom)
                              )}
                            </span>
                            <span className={styles.form__priceStrong}>
                              Zu zahlen:{" "}
                              {formatCurrency(
                                Math.max(0, selectedService.priceFrom - totalGiftBalance)
                              )}
                            </span>
                          </>
                        ) : null}
                      </div>
                    ) : null}

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
                    <div className={styles.form__actions}>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Senden..." : "Termin anfragen"}
                      </Button>
                      <span className={styles.form__hint}>
                        Bestaetigung erfolgt per E-Mail.
                      </span>
                    </div>
                  </div>
                </>
              )}
            </form>
          </div>
        </section>
      ) : (
        <section className={styles.bookingPage}>
          <p className={styles.form__error}>Service nicht gefunden.</p>
        </section>
      )}
    </div>
  );
}
