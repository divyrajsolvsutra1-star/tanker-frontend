import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createBusinessResource, ApiError } from "@/lib/api";
import { CheckIcon, XIcon } from "@/components/common/Icons";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (employee: Record<string, unknown>) => void;
  initialName?: string;
}

export default function QuickEmployeeModal({
  isOpen,
  onClose,
  onSuccess,
  initialName = "",
}: Props) {
  const [name, setName] = useState(initialName);
  const [mobileNumber, setMobileNumber] = useState("");
  const [details, setDetails] = useState("");
  const [monthlySalary, setMonthlySalary] = useState<number | string>(0);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setError("");
      setFieldErrors({});
    }
  }, [isOpen, initialName]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function clearFieldError(field: string) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = "Employee / Washer Name is required.";
    }

    const mob = mobileNumber.trim();
    if (mob && !/^[6-9]\d{9}$/.test(mob)) {
      errs.mobileNumber = "Enter a valid 10-digit mobile number (starting 6-9).";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        mobileNumber: mob || undefined,
        details: details.trim() || undefined,
        monthlySalary: Number(monthlySalary || 0),
        status: "active",
      };

      const res = await createBusinessResource<Record<string, unknown>>("employees", payload);
      const createdRecord = (res as { item?: Record<string, unknown> })?.item || (res as Record<string, unknown>) || payload;
      onSuccess(createdRecord);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add employee.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal quick-master-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "480px", width: "95%" }}
      >
        <div className="modal-header quick-master-header">
          <h2 className="modal-title">New Employee Registration</h2>
          <button
            type="button"
            className="quick-master-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body quick-master-body">
            {error && (
              <div className="erp-alert erp-alert--error" style={{ marginBottom: "14px" }}>
                {error}
              </div>
            )}

            <div className="erp-form-grid" style={{ gridTemplateColumns: "1fr", gap: "14px" }}>
              <div className={`erp-field-group ${fieldErrors.name ? "erp-field-group--error" : ""}`}>
                <label>
                  Employee Name <span className="erp-required-star">*</span>
                </label>
                <input
                  type="text"
                  className={`erp-input ${fieldErrors.name ? "erp-input--error" : ""}`}
                  placeholder="e.g. Suresh Kumar"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearFieldError("name");
                  }}
                  autoFocus
                />
                {fieldErrors.name && <span className="erp-field-error-msg">{fieldErrors.name}</span>}
              </div>

              <div className={`erp-field-group ${fieldErrors.mobileNumber ? "erp-field-group--error" : ""}`}>
                <label>Mobile Number (10 Digits)</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className={`erp-input ${fieldErrors.mobileNumber ? "erp-input--error" : ""}`}
                  placeholder="e.g. 9825123456"
                  value={mobileNumber}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setMobileNumber(clean);
                    clearFieldError("mobileNumber");
                  }}
                />
                {fieldErrors.mobileNumber && (
                  <span className="erp-field-error-msg">{fieldErrors.mobileNumber}</span>
                )}
              </div>

              <div className="erp-field-group">
                <label>Role / Details</label>
                <input
                  type="text"
                  className="erp-input"
                  placeholder="e.g. Senior Washer / Driver / Supervisor"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>

              <div className="erp-field-group">
                <label>Monthly Salary (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="erp-input"
                  placeholder="0"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer quick-master-footer">
            <span className="quick-modal-esc">
              <kbd>ESC</kbd> to cancel
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                <CheckIcon size={14} />
                <span>{submitting ? "Saving..." : "Save & Select Employee"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
