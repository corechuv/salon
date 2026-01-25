import { type ButtonHTMLAttributes, type ReactNode } from "react";
import styles from "./Button.module.scss";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function Button({ className, children, ...props }: Props) {
  return (
    <button className={`${styles.button} ${className ?? ""}`.trim()} {...props}>
      {children}
    </button>
  );
}
