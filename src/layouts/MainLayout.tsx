import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./MainLayout.module.scss";
import { Header } from "../components/Header/Header";
import Footer from "../components/Footer/Footer";

export function MainLayout() {
    const apiBase = import.meta.env.VITE_API_URL as string | undefined;
    const [hours, setHours] = useState<string>("Mo–Sa 10:00–20:00");

    useEffect(() => {
        if (!apiBase) return;
        const formatTime = (value: string) => {
            const [h, m] = value.split(":").map(Number);
            return `${h}:${String(m).padStart(2, "0")}`;
        };

        fetch(`${apiBase}/hours`)
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((data: Array<{ start: string; end: string }>) => {
                if (!Array.isArray(data) || data.length === 0) return;
                const starts = data.map((item) => item.start);
                const ends = data.map((item) => item.end);
                const minStart = starts.sort()[0];
                const maxEnd = ends.sort().slice(-1)[0];
                setHours(`Mo–Sa ${formatTime(minStart)}–${formatTime(maxEnd)}`);
            })
            .catch(() => undefined);
    }, [apiBase]);

    return (
        <div className={styles.layout}>
            <Header />
            <main className={styles.main}>
                <Outlet />
            </main>
            <Footer
                brand="MiRA"
                subtitle="Pflege, Stil und Selbstvertrauen – jeden Tag"
                phones={["+49 176 71766851", "+38 098 1161611"]}
                email="info@center-mira.com"
                address="Neuen Großen Bergstraße 7, 22767 Hamburg"
                hours={hours}
                bookingHref="/services"
                socials={{
                    whatsapp: "https://wa.me/4917671766851",
                    instagram: "https://instagram.com/mira",
                    tiktok: "https://wa.me/4917671766851",
                    youtube: "https://wa.me/4917671766851",
                }}
            />

        </div>
    );
}
