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
    const isServices = location.pathname === "/services";
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

    return (
        <header
            className={`${styles.header} ${
                isServices ? styles.headerServices : ""
            } ${isServices && isScrolled ? styles.headerScrolled : ""}`}
        >
            <div className={styles.inner}>
                <NavLink to="/" className={styles.logo}>
                    <img src="./logo.png" />
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

                <div
                    className={`${styles.backdrop} ${isMenuOpen ? styles.backdropOpen : ""}`}
                    onClick={() => setIsMenuOpen(false)}
                    aria-hidden="true"
                />

                <nav
                    className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ""}`}
                    aria-label="Main navigation"
                >
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
    );
}
