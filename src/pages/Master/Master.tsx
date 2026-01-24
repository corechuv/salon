import styles from "./Master.module.scss";

const masters = [
  {
    name: "Iryna Marinina",
    role: "Косметолог-эстетист",
    focus: "Чистая кожа и ровный рельеф",
    experience: "9 лет практики",
    description:
      "Специализируется на проблемной коже и постакне. Объясняет каждый шаг и ведёт курс до результата.",
    services: ["Комбинированная чистка", "Пилинги", "Сопровождение курса"],
    photo: "/masters/iryna.jpeg",
  },
  {
    name: "Лина Крамер",
    role: "Мастер по уходу",
    focus: "Сияние и восстановление",
    experience: "7 лет практики",
    description:
      "Собирает индивидуальные протоколы под сезон и состояние кожи. Много работает с чувствительной кожей.",
    services: ["Увлажняющие уходы", "Массаж лица", "Атравматичные методики"],
    photo: "/masters/iryna marinina.jpeg",
  },
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export function Master() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.hero__left}>
          <p className={styles.hero__eyebrow}>MIRA • TEAM</p>
          <h1 className={styles.hero__title}>Handwerker, denen man das Leder anvertraut.</h1>
          <p className={styles.hero__subtitle}>
            Wir arbeiten schonend und präzise, ​​passen die Behandlungen individuell an und erklären jeden Schritt. Bei uns gibt es keine willkürlichen Verfahren – nur bewährte Methoden und ehrliche Ergebnisse.
          </p>
          <div className={styles.hero__stats}>
            <div>
              <span className={styles.hero__statValue}>2</span>
              <span className={styles.hero__statLabel}>Meister</span>
            </div>
            <div>
              <span className={styles.hero__statValue}>18+</span>
              <span className={styles.hero__statLabel}>Jahre Erfahrung</span>
            </div>
            <div>
              <span className={styles.hero__statValue}>360°</span>
              <span className={styles.hero__statLabel}>Pflege und Unterstützung</span>
            </div>
          </div>
          <div className={styles.hero__actions}>
            <button className={styles.hero__primary}>Termin</button>
            <button className={styles.hero__ghost}>Wählen Sie einen Master aus</button>
          </div>
        </div>
        <div className={styles.hero__right}>
          <div className={styles.hero__card}>
            <p className={styles.hero__cardTitle}>Как мы работаем</p>
            <ul className={styles.hero__list}>
              <li>Диагностика + персональный план</li>
              <li>Комбинация ручных и аппаратных техник</li>
              <li>Рекомендации домашнего ухода</li>
            </ul>
            <div className={styles.hero__cardFooter}>
              <span>Спокойный сервис</span>
              <span>Без лишних обещаний</span>
            </div>
          </div>
          <div className={styles.hero__badge}>Natural glow</div>
        </div>
      </section>

      <section className={styles.gallery}>
        <div className={styles.gallery__header}>
          <h2 className={styles.gallery__title}>Команда</h2>
          <p className={styles.gallery__text}>
            Каждый мастер — отдельный характер и стиль работы. Выбирайте по задаче
            и ощущению.
          </p>
        </div>

        <div className={styles.cards}>
          {masters.map((master) => (
            <article key={master.name} className={styles.card}>
              <div className={styles.card__media}>
                {master.photo ? (
                  <img src={master.photo} alt={master.name} />
                ) : (
                  <span>{getInitials(master.name)}</span>
                )}
              </div>
              <div className={styles.card__body}>
                <div className={styles.card__head}>
                  <div>
                    <p className={styles.card__name}>{master.name}</p>
                    <p className={styles.card__role}>{master.role}</p>
                  </div>
                  <span className={styles.card__exp}>{master.experience}</span>
                </div>
                <p className={styles.card__focus}>{master.focus}</p>
                <p className={styles.card__desc}>{master.description}</p>
                <div className={styles.card__tags}>
                  {master.services.map((service) => (
                    <span key={service} className={styles.tag}>
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.spotlight}>
        <div className={styles.spotlight__content}>
          <h3>Нужен подбор мастера?</h3>
          <p>
            Напишите нам, и мы поможем подобрать специалиста под вашу задачу — от
            деликатного ухода до интенсивных программ.
          </p>
        </div>
        <button className={styles.spotlight__cta}>Консультация</button>
      </section>
    </div>
  );
}
