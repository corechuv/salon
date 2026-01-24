// Footer.tsx
import styles from "./Footer.module.scss";

type SocialKey = "instagram" | "telegram" | "whatsapp" | "youtube" | "tiktok";

export type BeautyFooterProps = {
    brand?: string;
    subtitle?: string;

    phones: string[]; // ["+7 (999) 123-45-67", "+7 (999) 222-33-44"]
    email: string; // "hello@salon.ru"

    socials?: Partial<Record<SocialKey, string>>; // { instagram: "https://...", telegram: "https://..." }

    address?: string;
    hours?: string;

    bookingLabel?: string; // "Записаться"
    bookingHref?: string; // если запись — это ссылка
    onBookingClick?: () => void; // если запись открывает модалку/скролл к форме

    className?: string;
};

function toTelHref(phone: string) {
    // оставляем + и цифры
    const cleaned = phone.replace(/[^\d+]/g, "");
    return cleaned.startsWith("+") ? cleaned : `+${cleaned.replace(/^\+/, "")}`;
}

function Icon({ name }: { name: SocialKey }) {
    const common = {
        className: styles.icon,
        width: 20,
        height: 20,
        viewBox: "0 0 24 24",
        fill: "none" as const,
        xmlns: "http://www.w3.org/2000/svg",
        "aria-hidden": true,
    };

    switch (name) {
        case "telegram":
            return (
                <svg {...common}>
                    <path
                        d="M21.9 4.7 3.5 11.8c-1.2.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.4c.2.6.1.8.7.8.4 0 .6-.2.9-.4l2.7-2.6 5.6 4.1c1 .6 1.7.3 1.9-1l3.1-14.6c.3-1.5-.6-2.1-1.8-1.5Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M8 14.6 18.7 7.9c.6-.4 1.1-.2.7.2L10.2 16"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                </svg>
            );

        case "whatsapp":
            return (
                <img src="/social/Digital_Glyph_White.svg" className={styles.whatsapp} />
            );

        case "instagram":
            return (
                <img src="/social/instagram_white.svg" className={styles.instagram} />
            );

        case "youtube":
            return (
                <img src="/social/youtube_white.png" className={styles.youtube} />
            );

        case "tiktok":
            return (
                <img src="/social/tiktok_white.png" className={styles.tiktok} />
            );

        default:
            return null;
    }
}

const SOCIAL_LABEL: Record<SocialKey, string> = {
    instagram: "Instagram",
    telegram: "Telegram",
    whatsapp: "WhatsApp",
    youtube: "YouTube",
    tiktok: "TikTok",
};

export function Footer(props: BeautyFooterProps) {
    const {
        brand = "Beauty Studio",
        subtitle = "Красота — это сервис, настроение и результат",
        phones,
        email,
        socials,
        address = "Город, улица, дом",
        hours = "Ежедневно 10:00–20:00",
        bookingLabel = "Termin",
        bookingHref,
        onBookingClick,
        className,
    } = props;

    const socialEntries = (Object.entries(socials ?? {}) as Array<[SocialKey, string]>).filter(
        ([, url]) => Boolean(url)
    );

    const BookingAction = bookingHref ? (
        <a className={`${styles.btn} ${styles.btnPrimary}`} href={bookingHref} aria-label={bookingLabel}>
            {bookingLabel}
        </a>
    ) : (
        <button className={`${styles.btn} ${styles.btnPrimary}`} type="button" onClick={onBookingClick} aria-label={bookingLabel}>
            {bookingLabel}
        </button>
    );

    const year = new Date().getFullYear();

    return (
        <footer className={[styles.footer, className].filter(Boolean).join(" ")}>
            <div className={styles.container}>

                <div className={styles.brandBlock}>
                    <div className={styles.brandRow}>
                        <img src="/logo.png" className={styles.logo} />
                    </div>
                    <p className={styles.subtitle}>{subtitle}</p>
                </div>
                <div className={styles.top}>

                    <div className={styles.col}>
                        <div className={styles.bookingNote}>24/7</div>
                        <div className={styles.booking}>{BookingAction}</div>
                    </div>
                    
                    <div className={styles.col}>
                        <div className={styles.meta}>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Adresse</span>
                                <span className={styles.metaValue}>{address}</span>
                            </div>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Öffnungszeiten</span>
                                <span className={styles.metaValue}>{hours}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.col}>
                        <h3 className={styles.heading}>Kontakte</h3>

                        <ul className={styles.list} aria-label="Телефоны">
                            {phones.map((p) => (
                                <li key={p} className={styles.listItem}>
                                    <a className={styles.link} href={`tel:${toTelHref(p)}`}>
                                        {p}
                                    </a>
                                </li>
                            ))}
                        </ul>

                        <div className={styles.inline}>
                            <a className={styles.link} href={`mailto:${email}`}>
                                {email}
                            </a>
                        </div>
                    </div>
                </div>


                {socialEntries.length > 0 ? (
                    <ul className={styles.socials} aria-label="Социальные сети">
                        {socialEntries.map(([key, url]) => (
                            <li key={key}>
                                <a
                                    className={styles.socialLink}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={SOCIAL_LABEL[key]}
                                    title={SOCIAL_LABEL[key]}
                                >
                                    <Icon name={key} />
                                    <span className={styles.socialText}>{SOCIAL_LABEL[key]}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className={styles.muted}>Добавьте ссылки на соцсети в пропсы компонента.</p>
                )}

                <div className={styles.bottom}>
                    <span className={styles.copy}>© {year} {brand}. Alle Rechte vorbehalten.</span>
                    <div className={styles.bottomLinks}>
                        <a className={styles.bottomLink} href="/education">Ausbildung</a>
                        <a className={styles.bottomLink} href="/masters">Meister</a>
                        <a className={styles.bottomLink} href="/contacts">Kontakte</a>
                        <a className={styles.bottomLink} href="/about">Über uns</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
