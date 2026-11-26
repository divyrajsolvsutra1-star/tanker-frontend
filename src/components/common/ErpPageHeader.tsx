import Link from "next/link";
import { ReactNode } from "react";

interface ErpPageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}

export default function ErpPageHeader({
  title,
  description,
  backHref = "/",
  backLabel = "Dashboard",
  actions,
}: ErpPageHeaderProps) {
  return (
    <div className="erp-module__header">
      <div className="erp-module__heading">
        {backHref && (
          <Link href={backHref} className="erp-back-btn">
            <span aria-hidden="true">&larr;</span> {backLabel}
          </Link>
        )}
        <h1 className="erp-title">{title}</h1>
        {description && <p className="erp-subtitle">{description}</p>}
      </div>

      {actions && <div className="erp-module__top-actions">{actions}</div>}
    </div>
  );
}
