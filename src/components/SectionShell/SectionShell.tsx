import { type ReactNode } from "react";
import styles from "./SectionShell.module.scss";

type Props = {
  title: string;
  subtitle?: string;
  controls?: ReactNode;
  className?: string;
  bodyClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  controlsClassName?: string;
};

export function SectionShell({
  title,
  subtitle,
  controls,
  className,
  bodyClassName,
  titleClassName,
  subtitleClassName,
  controlsClassName,
  children,
}: Props & { children?: ReactNode }) {
  return (
    <section className={`${styles.section} ${className ?? ""}`.trim()}>
      <div className={styles.wrap}>
        <div className={styles.header}>
          <div className={styles.heading}>
            <h2 className={`${styles.title} ${titleClassName ?? ""}`.trim()}>{title}</h2>
            {subtitle ? (
              <p className={`${styles.subtitle} ${subtitleClassName ?? ""}`.trim()}>
                {subtitle}
              </p>
            ) : null}
          </div>
          {controls ? (
            <div className={`${styles.controls} ${controlsClassName ?? ""}`.trim()}>
              {controls}
            </div>
          ) : null}
        </div>

        {children ? (
          <div className={`${styles.body} ${bodyClassName ?? ""}`.trim()}>{children}</div>
        ) : null}
      </div>
    </section>
  );
}
