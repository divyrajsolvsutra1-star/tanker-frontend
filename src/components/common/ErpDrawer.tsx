import { ReactNode } from "react";

interface ErpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function ErpDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: ErpDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="erp-drawer-backdrop" onClick={onClose}>
      <div className="erp-drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="erp-drawer-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            type="button"
            className="erp-drawer-close"
            onClick={onClose}
            aria-label="Close drawer"
          >
            &times;
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
