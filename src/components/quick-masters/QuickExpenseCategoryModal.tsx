import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createBusinessResource, ApiError } from "@/lib/api";
import { CheckIcon, XIcon } from "@/components/common/Icons";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (category: Record<string, unknown>) => void;
  initialName?: string;
}

export default function QuickExpenseCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  initialName = "",
}: Props) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription("");
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

    const cleanName = name.trim();
    if (!cleanName) {
      errs.name = "Category Name is required (e.g. Chemicals, Office Supplies).";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: cleanName,
        description: description.trim() || undefined,
        status: "active",
      };

      const res = await createBusinessResource<Record<string, unknown>>("expense-categories", payload);
      const createdRecord =
        (res as { item?: Record<string, unknown> })?.item ||
        (res as Record<string, unknown>) ||
        payload;
      onSuccess(createdRecord);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.field === "name" || err.message.toLowerCase().includes("duplicate") || err.message.toLowerCase().includes("already exists")) {
          setFieldErrors({ name: `Category '${cleanName}' already exists.` });
        }
        setError(err.message);
      } else {
        setError("Failed to create expense category.");
      }
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
          <h2 className="modal-title">New Expense Category</h2>
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
                  Category Name <span className="erp-required-star">*</span>
                </label>
                <input
                  type="text"
                  className={`erp-input ${fieldErrors.name ? "erp-input--error" : ""}`}
                  placeholder="e.g. Chemicals / Cleaning Supplies, Driver Allowance"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearFieldError("name");
                  }}
                  autoFocus
                />
                {fieldErrors.name && <span className="erp-field-error-msg">{fieldErrors.name}</span>}
              </div>

              <div className="erp-field-group">
                <label>Description / Notes</label>
                <input
                  type="text"
                  className="erp-input"
                  placeholder="e.g. Tanker washing chemicals, soaps, consumables"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                <span>{submitting ? "Saving..." : "Save & Select Category"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
