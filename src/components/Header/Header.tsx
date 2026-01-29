import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./Header.module.scss";

type NavItem = {
    to: string;
    label: string;
};

const NAV: NavItem[] = [
    { to: "/", label: "Startseite" },
    { to: "/Education", label: "Ausbildung" },
    { to: "/about", label: "Über uns" },
];

export function Header() {
    const location = useLocation();
    const isServices =
        location.pathname.startsWith("/services") ||
        location.pathname === "/gift" ||
        location.pathname === "/";
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        if (!isServices) {
            setIsScrolled(false);
            return;
        }
        const onScroll = () => {
            setIsScrolled(window.scrollY > 24);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [isServices]);

    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!isMenuOpen) return;
        const original = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsMenuOpen(false);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = original;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [isMenuOpen]);

    return (
        <>
            <header
                className={`${styles.header} ${
                    isServices ? styles.headerServices : ""
                } ${isServices && isScrolled ? styles.headerScrolled : ""} ${
                    isMenuOpen ? styles.headerMenuOpen : ""
                }`}
            >
                <div className={styles.inner}>
                    <NavLink to="/" className={styles.logo}>
                        <img src="/logo.png" />
                    </NavLink>

                    <button
                        type="button"
                        className={`${styles.burger} ${isMenuOpen ? styles.burgerOpen : ""}`}
                        aria-label="Toggle menu"
                        aria-expanded={isMenuOpen}
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                d="M4 6h16M4 12h16M4 18h16"
                                stroke="currentColor"
                                strokeWidth="1"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>

                    <nav
                        className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ""}`}
                        aria-label="Main navigation"
                    >
                        <div className={styles.navHeader}>
                            <NavLink to="/" className={styles.navLogo}>
                                <img src="/logo.png" />
                            </NavLink>
                            <button
                                type="button"
                                className={styles.navClose}
                                onClick={() => setIsMenuOpen(false)}
                                aria-label="Close menu"
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path
                                        d="M6 6l12 12M18 6L6 18"
                                        stroke="currentColor"
                                        strokeWidth="1"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </button>
                        </div>
                        {NAV.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    isActive ? `${styles.link} ${styles.linkActive}` : styles.link
                                }
                                end={item.to === "/"}
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </header>
            <div
                className={`${styles.backdrop} ${isMenuOpen ? styles.backdropOpen : ""}`}
                onClick={() => setIsMenuOpen(false)}
                aria-hidden="true"
            />
        </>
    );
}
