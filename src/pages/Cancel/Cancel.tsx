import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "../Confirm/Confirm.module.scss";

export function Cancel() {
  const { search } = useLocation();
  const token = new URLSearchParams(search).get("token");
  const apiBase = import.meta.env.VITE_API_URL as string | undefined;

  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token || !apiBase) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    fetch(`${apiBase}/cancel?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || "error");
        }
        setMessage(data?.already ? "Bereits storniert." : "");
        return;
      })
      .then(() => setStatus("ok"))
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "error";
        setMessage(msg);
        setStatus("error");
      });
  }, [token, apiBase]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {status === "loading" && (
          <>
            <h1>Stornierung läuft…</h1>
            <p>Bitte warten Sie einen Moment.</p>
          </>
        )}
        {status === "ok" && (
          <>
            <h1>Termin storniert</h1>
            <p>{message || "Ihre Buchung wurde storniert."}</p>
          </>
        )}
        {status === "error" && (
          <>
            <h1>Stornierung fehlgeschlagen</h1>
            <p>
              {message === "Der Link ist abgelaufen."
                ? "Der Link ist abgelaufen. Bitte buchen Sie erneut."
                : message === "Buchung nicht gefunden."
                  ? "Buchung nicht gefunden."
                  : "Stornierung nicht möglich."}
            </p>
          </>
        )}
        <Link to="/" className={styles.back}>
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}
