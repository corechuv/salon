import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Confirm.module.scss";

export function Confirm() {
  const { search } = useLocation();
  const token = new URLSearchParams(search).get("token");
  const apiBase = import.meta.env.VITE_API_URL as string | undefined;

  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  useEffect(() => {
    if (!token || !apiBase) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    fetch(`${apiBase}/confirm?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.text();
      })
      .then(() => setStatus("ok"))
      .catch(() => setStatus("error"));
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
            <p>Vielen Dank! Ihre Buchung wurde bestätigt.</p>
          </>
        )}
        {status === "error" && (
          <>
            <h1>Bestätigung fehlgeschlagen</h1>
            <p>Der Link ist ungültig oder abgelaufen.</p>
          </>
        )}
        <Link to="/" className={styles.back}>
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}
