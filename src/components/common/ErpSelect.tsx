import { useEffect, useMemo, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "@/components/common/Icons";

export interface SelectOption {
  value: string;
  label: string;
}

interface ErpSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  hasError?: boolean;
}

export default function ErpSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  required = false,
  className = "",
  hasError = false,
}: ErpSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find currently selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setFilterQuery("");
      if (options.length > 5) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    }
  }, [isOpen, options.length]);

  function handleSelect(optValue: string) {
    onChange(optValue);
    setIsOpen(false);
  }

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!filterQuery.trim()) return options;
    const q = filterQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q),
    );
  }, [options, filterQuery]);

  return (
    <div
      ref={containerRef}
      className={`erp-select-container ${disabled ? "erp-select-disabled" : ""} ${hasError ? "erp-select-container--error" : ""} ${className}`}
    >
      {/* Hidden input for form validation if required */}
      {required && (
        <input
          tabIndex={-1}
          autoComplete="off"
          style={{ opacity: 0, width: 0, height: 0, position: "absolute", pointerEvents: "none" }}
          value={value}
          required={required}
          onChange={() => {}}
        />
      )}

      {/* Select Trigger */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        className={`erp-select-trigger ${isOpen ? "erp-select-trigger--open" : ""} ${hasError ? "erp-select-trigger--error" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`erp-select-value ${!selectedOption ? "erp-select-placeholder" : ""}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`erp-select-chevron ${isOpen ? "erp-select-chevron--open" : ""}`}>
          <ChevronDownIcon size={16} />
        </span>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="erp-select-dropdown" role="listbox">
          {/* Search bar inside dropdown when options > 5 */}
          {options.length > 5 && (
            <div className="erp-select-search-box">
              <SearchIcon size={14} className="erp-select-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="erp-select-search-input"
                placeholder="Search options..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {filterQuery && (
                <button
                  type="button"
                  className="erp-select-search-clear"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterQuery("");
                  }}
                >
                  &times;
                </button>
              )}
            </div>
          )}

          <div className="erp-select-options-list">
            {placeholder && !filterQuery && (
              <div
                className={`erp-select-option erp-select-option--placeholder ${!value ? "selected" : ""}`}
                onClick={() => handleSelect("")}
                role="option"
                aria-selected={!value}
              >
                <span>{placeholder}</span>
                {!value && <CheckIcon size={14} className="erp-select-check" />}
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="erp-select-no-options">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    className={`erp-select-option ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelect(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <CheckIcon size={14} className="erp-select-check" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
