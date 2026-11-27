import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/common/Icons";

interface ErpDatePickerProps {
  id?: string;
  type?: "date" | "month";
  value: string; // "YYYY-MM" or "YYYY-MM-DD"
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  hasError?: boolean;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const FULL_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function ErpDatePicker({
  id,
  type = "date",
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  className = "",
  hasError = false,
}: ErpDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial year and month from value or current date
  const parsed = useMemo(() => {
    if (!value) {
      const now = new Date();
      return {
        year: now.getFullYear(),
        month: now.getMonth(), // 0-indexed
        day: now.getDate(),
      };
    }
    const parts = value.split("-").map(Number);
    return {
      year: parts[0] || new Date().getFullYear(),
      month: (parts[1] || 1) - 1, // 0-indexed
      day: parts[2] || 1,
    };
  }, [value]);

  const [viewYear, setViewYear] = useState(parsed.year);
  const [viewMonth, setViewMonth] = useState(parsed.month);

  useEffect(() => {
    setViewYear(parsed.year);
    setViewMonth(parsed.month);
  }, [parsed.year, parsed.month]);

  // Close on click outside
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

  // Close on Escape key
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

  // Formatted trigger label
  const formattedLabel = useMemo(() => {
    if (!value) return placeholder || (type === "month" ? "Select month..." : "Select date...");
    if (type === "month") {
      const parts = value.split("-");
      const y = parts[0];
      const m = parseInt(parts[1], 10) - 1;
      return `${FULL_MONTH_NAMES[m] || ""} ${y}`;
    }
    // "YYYY-MM-DD"
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }, [value, type, placeholder]);

  // Calendar days generation for "date" mode
  const calendarDays = useMemo(() => {
    if (type !== "date") return [];
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [type, viewYear, viewMonth]);

  function handleSelectMonth(mIndex: number) {
    const mm = String(mIndex + 1).padStart(2, "0");
    const nextVal = `${viewYear}-${mm}`;
    onChange(nextVal);
    setIsOpen(false);
  }

  function handleSelectDay(day: number) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const nextVal = `${viewYear}-${mm}-${dd}`;
    onChange(nextVal);
    setIsOpen(false);
  }

  function handleSelectToday() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    if (type === "month") {
      onChange(`${yyyy}-${mm}`);
    } else {
      const dd = String(now.getDate()).padStart(2, "0");
      onChange(`${yyyy}-${mm}-${dd}`);
    }
    setIsOpen(false);
  }

  function handleClear() {
    onChange("");
    setIsOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className={`erp-datepicker-container ${disabled ? "erp-datepicker-disabled" : ""} ${hasError ? "erp-datepicker-container--error" : ""} ${className}`}
    >
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

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        className={`erp-datepicker-trigger ${isOpen ? "erp-datepicker-trigger--open" : ""} ${hasError ? "erp-datepicker-trigger--error" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="erp-datepicker-icon">
          <CalendarIcon size={16} />
        </span>
        <span className={`erp-datepicker-value ${!value ? "erp-datepicker-placeholder" : ""}`}>
          {formattedLabel}
        </span>
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div className="erp-datepicker-popover" role="dialog">
          {/* Header with Navigation */}
          <div className="erp-datepicker-header">
            <button
              type="button"
              className="erp-datepicker-nav-btn"
              onClick={() => {
                if (type === "month") {
                  setViewYear((y) => y - 1);
                } else {
                  if (viewMonth === 0) {
                    setViewMonth(11);
                    setViewYear((y) => y - 1);
                  } else {
                    setViewMonth((m) => m - 1);
                  }
                }
              }}
              title="Previous"
            >
              <ChevronLeftIcon size={16} />
            </button>

            <div className="erp-datepicker-title">
              {type === "date" ? `${MONTH_NAMES[viewMonth]} ` : ""}
              <strong>{viewYear}</strong>
            </div>

            <button
              type="button"
              className="erp-datepicker-nav-btn"
              onClick={() => {
                if (type === "month") {
                  setViewYear((y) => y + 1);
                } else {
                  if (viewMonth === 11) {
                    setViewMonth(0);
                    setViewYear((y) => y + 1);
                  } else {
                    setViewMonth((m) => m + 1);
                  }
                }
              }}
              title="Next"
            >
              <ChevronRightIcon size={16} />
            </button>
          </div>

          {/* Month Picker View */}
          {type === "month" ? (
            <div className="erp-datepicker-months-grid">
              {MONTH_NAMES.map((name, idx) => {
                const mm = String(idx + 1).padStart(2, "0");
                const isSelected = value === `${viewYear}-${mm}`;
                const isCurrentMonth =
                  new Date().getFullYear() === viewYear && new Date().getMonth() === idx;

                return (
                  <button
                    key={name}
                    type="button"
                    className={`erp-datepicker-month-btn ${isSelected ? "selected" : ""} ${
                      isCurrentMonth && !isSelected ? "current" : ""
                    }`}
                    onClick={() => handleSelectMonth(idx)}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Day Date Picker View */
            <div className="erp-datepicker-days-view">
              <div className="erp-datepicker-weekdays">
                {WEEK_DAYS.map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </div>
              <div className="erp-datepicker-days-grid">
                {calendarDays.map((d, index) => {
                  if (d === null) {
                    return <span key={`empty-${index}`} className="erp-datepicker-empty" />;
                  }
                  const mm = String(viewMonth + 1).padStart(2, "0");
                  const dd = String(d).padStart(2, "0");
                  const isSelected = value === `${viewYear}-${mm}-${dd}`;
                  const isToday =
                    new Date().getFullYear() === viewYear &&
                    new Date().getMonth() === viewMonth &&
                    new Date().getDate() === d;

                  return (
                    <button
                      key={`day-${d}`}
                      type="button"
                      className={`erp-datepicker-day-btn ${isSelected ? "selected" : ""} ${
                        isToday && !isSelected ? "today" : ""
                      }`}
                      onClick={() => handleSelectDay(d)}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Popover Footer with Quick Actions */}
          <div className="erp-datepicker-footer">
            <button
              type="button"
              className="erp-datepicker-action-btn"
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              type="button"
              className="erp-datepicker-action-btn erp-datepicker-action-btn--primary"
              onClick={handleSelectToday}
            >
              {type === "month" ? "This month" : "Today"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
