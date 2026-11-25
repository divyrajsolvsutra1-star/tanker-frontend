import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLElement>;

export default function Card({ className = "", ...props }: CardProps) {
  return <section className={`card ${className}`.trim()} {...props} />;
}
