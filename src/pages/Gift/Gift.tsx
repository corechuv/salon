import { useLocation } from "react-router-dom";
import { useState } from "react";
import styles from "./Gift.module.scss";

const PRESETS = [50, 100, 150, 200];

export function Gift() {
  const { search } = useLocation();
  const giftStatus = new URLSearchParams(search).get("gift");
  const [email, setEmail] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAmount, setModalAmount] = useState<number | null>(null);
  const [, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiBase = import.meta.env.VITE_API_URL as string | undefined;

  const openModal = (amount: number) => {
    setSelectedAmount(amount);
    setModalAmount(amount);
    setIsModalOpen(true);
    setError(null);
  };

  const startCheckout = async (amount: number) => {
    if (!apiBase) {
      setError("API nicht konfiguriert.");
      return;
    }
    if (!email) {
      setError("Bitte E-Mail eingeben.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/gift/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, email }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setError("Zahlung fehlgeschlagen. Bitte spaeter erneut versuchen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.banner} role="presentation" aria-hidden="true" />
      <section className={styles.hero}>
        <div>
          <h1 className={styles.title}>Geschenkgutscheine</h1>
          <p className={styles.subtitle}>
            Schenke Schoenheit, Pflege und Zeit fuer sich selbst. Gutschein wird per
            E‑Mail verschickt.
          </p>
        </div>
      </section>
      {giftStatus === "success" ? (
        <section className={styles.noticeSuccess}>
          Zahlung erfolgreich. Der Gutschein-Code wurde per E‑Mail versendet.
        </section>
      ) : null}
      {giftStatus === "cancel" ? (
        <section className={styles.noticeError}>
          Zahlung abgebrochen. Du kannst es jederzeit erneut versuchen.
        </section>
      ) : null}

      <section className={styles.grid}>
        {PRESETS.map((value) => (
          <article key={value} className={styles.card}>
            <div className={styles.giftCard}>
              <div className={styles.cardLogo}>
                <img src="/logo.png" alt="MIRA" />
              </div>
              <h3>{value} €</h3>
              <p>Gutschein fuer Behandlungen bei Mira Studio</p>
            </div>
            <div className={styles.cardFooter}>
              <span>Gültig 12 Monate</span>
              <button type="button" onClick={() => openModal(value)}>
                Kaufen
              </button>
            </div>
          </article>
        ))}

        <article className={`${styles.card} ${styles.cardCustom}`}>
          <div className={`${styles.giftCard} ${styles.giftCardCustom}`}>
            <div className={styles.cardLogo}>
              <img src="/logo.png" alt="MIRA" />
            </div>
            <h3 className={styles.customTitle}>Eigener Betrag</h3>
            <p className={styles.customText}>Wähle einen Betrag zwischen 50€ und 500€.</p>
          </div>
          <div className={styles.customRow}>
            <input
              type="number"
              min={50}
              max={500}
              placeholder="50–500"
              value={customAmount}
              onChange={(event) => setCustomAmount(event.target.value)}
            />
            <span>€</span>
          </div>
          <div className={styles.cardFooter}>
            <span>Gültig 12 Monate</span>
            <button
              type="button"
              onClick={() => {
                const val = Number(customAmount);
                if (!Number.isFinite(val) || val < 50 || val > 500) return;
                openModal(val);
              }}
            >
              Kaufen
            </button>
          </div>
        </article>
      </section>

      {isModalOpen && modalAmount ? (
        <div className={styles.modal} role="dialog" aria-modal="true">
          <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)} />
          <div className={styles.modalPanel}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setIsModalOpen(false)}
              aria-label="Schliessen"
            >
              ✕
            </button>
            <h2>Gutschein {modalAmount} €</h2>
            <p>Wir senden den Gutschein-Code per E‑Mail.</p>
            <input
              type="email"
              placeholder="name@mail.de"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => startCheckout(modalAmount)}
            >
              {loading ? "Bitte warten..." : "Zur Zahlung"}
            </button>
            {error ? <p className={styles.modalNote}>{error}</p> : null}
            <p className={styles.modalNote}>Zahlung per Stripe.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
