import styles from "./MiraProjects.module.scss";

const PROJECTS = [
  {
    name: "INFO-Center",
    accent: "#7cf2e4",
    description:
      "Круглосуточные консультации, ответы на вопросы и поддержка через GPT‑чаты и экспертов.",
    url: "https://center-mira.com/info",
  },
  {
    name: "MIRA Academy",
    accent: "#ffd27a",
    description:
      "Обучение и повышение квалификации. Онлайн‑курсы, библиотека знаний и сопровождение.",
    url: "https://center-mira.com/academy",
  },
  {
    name: "MIRA Library",
    accent: "#b6c3ff",
    description:
      "База материалов и исследований по темам от дерматологии до аппаратной косметологии.",
    url: "https://center-mira.com/library",
  },
  {
    name: "MIRA Support",
    accent: "#9fe6b8",
    description:
      "Поддержка специалистов и партнёров: консультации, документы, сопровождение проектов.",
    url: "https://center-mira.com/support",
  },
  {
    name: "MIRA devices",
    accent: "#ff9ec4",
    description:
      "Оборудование и решения для современной косметологии, помощь с подбором и сервисом.",
    url: "https://center-mira.com/devices",
  },
  {
    name: "MIRA Store",
    accent: "#9dd6ff",
    description:
      "Маркетплейс товаров и услуг, обмена и продаж. Удобный старт для проектов.",
    url: "https://center-mira.com/store",
  },
  {
    name: "For Life & Peace",
    accent: "#c5f08f",
    description:
      "Благотворительная инициатива: помощь семьям и поддержка социальных проектов.",
    url: "https://center-mira.com/foundation",
  },
];

export function MiraProjects() {
  return (
    <section className={styles.projects}>
      <div className={styles.projects__inner}>
        <div className={styles.projects__header}>
          <h2 className={styles.projects__title}>CENTER MIRA</h2>
          <h3 className={styles.projects__subtitle}>ECO‑SYSTEM</h3>
          <p className={styles.projects__lead}>
            Краткий обзор ключевых направлений. У каждого проекта — отдельная платформа и
            собственные материалы.
          </p>
        </div>

        <div className={styles.projects__roadmap}>
          <div className={styles.projects__line} aria-hidden="true" />
          <div className={styles.projects__grid}>
            {PROJECTS.map((project, index) => (
              <article key={project.name} className={styles.project}>
                <div className={styles.project__badge} style={{ color: project.accent }}>
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className={styles.project__title}>{project.name}</h3>
                <p className={styles.project__text}>{project.description}</p>
                <a
                  className={styles.project__link}
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Подробнее
                </a>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
