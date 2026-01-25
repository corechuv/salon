import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Confirm.module.scss";

export function Confirm() {
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
    fetch(`${apiBase}/confirm?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || "error");
        }
        setMessage(data?.already ? "Bereits bestätigt." : "");
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
            <h1>Bestätigung läuft…</h1>
            <p>Bitte warten Sie einen Moment.</p>
          </>
        )}
        {status === "ok" && (
          <>
            <h1>Termin bestätigt</h1>
            <p>{message || "Vielen Dank! Ihre Buchung wurde bestätigt."}</p>
          </>
        )}
        {status === "error" && (
          <>
            <h1>Bestätigung fehlgeschlagen</h1>
            <p>
              {message === "gift not found"
                ? "Gutschein-Code nicht gefunden. Bitte kontaktieren Sie uns."
                : message === "gift not available"
                  ? "Gutschein ist nicht mehr gültig."
                  : message === "gift empty"
                    ? "Gutschein hat kein Guthaben mehr."
                    : "Der Link ist ungültig oder abgelaufen."}
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
