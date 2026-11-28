import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createBusinessResource, ApiError } from "@/lib/api";
import { CheckIcon, XIcon } from "@/components/common/Icons";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bankAccount: Record<string, unknown>) => void;
  initialName?: string;
}

export default function QuickBankAccountModal({
  isOpen,
  onClose,
  onSuccess,
  initialName = "",
}: Props) {
  const [bankName, setBankName] = useState(initialName);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [openingBalance, setOpeningBalance] = useState<number | string>(0);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBankName(initialName);
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

    if (!bankName.trim()) {
      errs.bankName = "Bank Name is required (e.g. HDFC Bank, SBI).";
    }
    if (!accountName.trim()) {
      errs.accountName = "Account Name / Holder Name is required.";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim() || undefined,
        ifsc: ifsc.trim().toUpperCase() || undefined,
        openingBalance: Number(openingBalance || 0),
        active: true,
      };

      const res = await createBusinessResource<Record<string, unknown>>("bank-accounts", payload);
      const createdRecord = (res as { item?: Record<string, unknown> })?.item || (res as Record<string, unknown>) || payload;
      onSuccess(createdRecord);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add bank account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal quick-master-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "500px", width: "95%" }}
      >
        <div className="modal-header quick-master-header">
          <h2 className="modal-title">New Bank & Cash Account</h2>
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

            <div className="erp-form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div className={`erp-field-group ${fieldErrors.bankName ? "erp-field-group--error" : ""}`} style={{ gridColumn: "span 2" }}>
                <label>
                  Bank Name <span className="erp-required-star">*</span>
                </label>
                <input
                  type="text"
                  className={`erp-input ${fieldErrors.bankName ? "erp-input--error" : ""}`}
                  placeholder="e.g. HDFC Bank / State Bank of India / Petty Cash"
                  value={bankName}
                  onChange={(e) => {
                    setBankName(e.target.value);
                    clearFieldError("bankName");
                  }}
                  autoFocus
                />
                {fieldErrors.bankName && <span className="erp-field-error-msg">{fieldErrors.bankName}</span>}
              </div>

              <div className={`erp-field-group ${fieldErrors.accountName ? "erp-field-group--error" : ""}`} style={{ gridColumn: "span 2" }}>
                <label>
                  Account Holder / Name <span className="erp-required-star">*</span>
                </label>
                <input
                  type="text"
                  className={`erp-input ${fieldErrors.accountName ? "erp-input--error" : ""}`}
                  placeholder="e.g. Tanker Wash Services Current A/c"
                  value={accountName}
                  onChange={(e) => {
                    setAccountName(e.target.value);
                    clearFieldError("accountName");
                  }}
                />
                {fieldErrors.accountName && <span className="erp-field-error-msg">{fieldErrors.accountName}</span>}
              </div>

              <div className="erp-field-group">
                <label>Account Number</label>
                <input
                  type="text"
                  className="erp-input"
                  placeholder="e.g. 50200012345678"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>

              <div className="erp-field-group">
                <label>IFSC Code</label>
                <input
                  type="text"
                  className="erp-input"
                  placeholder="e.g. HDFC0001234"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  style={{ textTransform: "uppercase" }}
                />
              </div>

              <div className="erp-field-group" style={{ gridColumn: "span 2" }}>
                <label>Opening Balance (₹)</label>
                <input
                  type="number"
                  className="erp-input"
                  placeholder="0"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
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
                <span>{submitting ? "Saving..." : "Save & Select Account"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
