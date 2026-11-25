import type { HTMLAttributes } from "react";

type PageContainerProps = HTMLAttributes<HTMLElement>;

export default function PageContainer({
  className = "",
  ...props
}: PageContainerProps) {
  return <main className={`page-container ${className}`.trim()} {...props} />;
}
