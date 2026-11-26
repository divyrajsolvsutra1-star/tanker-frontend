import { ReactNode } from "react";
import { SearchIcon } from "@/components/common/Icons";

interface ErpToolbarProps {
  title?: string;
  count?: number;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  extraFilters?: ReactNode;
}

export default function ErpToolbar({
  title,
  count,
  search,
  onSearchChange,
  searchPlaceholder = "Search records...",
  extraFilters,
}: ErpToolbarProps) {
  return (
    <div className="erp-table-toolbar">
      <div className="erp-toolbar-left">
        {title && (
          <span className="erp-toolbar-title">
            {title} {typeof count === "number" && <>- <strong>{count}</strong></>}
          </span>
        )}
      </div>

      <div className="erp-toolbar-right">
        {extraFilters}
        <div className="erp-search-box">
          <span className="erp-search-icon" aria-hidden="true">
            <SearchIcon size={16} />
          </span>
          <input
            type="text"
            className="erp-search-input"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search ? (
            <button
              type="button"
              className="erp-search-clear"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              &times;
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
