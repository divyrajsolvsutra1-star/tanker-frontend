import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createBusinessResource, ApiError } from "@/lib/api";
import { BuildingIcon, UserIcon, XIcon, CheckIcon } from "@/components/common/Icons";
import ErpSelect from "@/components/common/ErpSelect";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: Record<string, unknown>) => void;
  initialName?: string;
}

const paymentTermsOptions = [
  { value: "immediate", label: "Immediate Counter Payment" },
  { value: "15_days", label: "15 Days Credit" },
  { value: "30_days", label: "30 Days Credit" },
  { value: "other", label: "Other Terms" },
];

export default function QuickCustomerModal({
  isOpen,
  onClose,
  onSuccess,
  initialName = "",
}: Props) {
  const [formData, setFormData] = useState({
    customerType: "company",
    name: initialName,
    ownerName: "",
    contactPerson: "",
    mobileNumber: "",
    gstNumber: "",
    openingBalance: 0,
    creditLimit: 0,
    paymentTerms: "immediate",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        name: initialName || prev.name,
      }));
      setError("");
      setFieldErrors({});
    }
  }, [isOpen, initialName]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
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

    if (!formData.name.trim()) {
      errs.name = "Customer / Company name is required.";
    }

    const mob = formData.mobileNumber.trim();
    if (mob && !/^[6-9]\d{9}$/.test(mob)) {
      errs.mobileNumber = "Enter a valid 10-digit mobile number (starts 6-9).";
    }

    const gst = formData.gstNumber.trim().toUpperCase();
    if (gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst)) {
      errs.gstNumber = "Enter a valid 15-character GSTIN format.";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        customerType: formData.customerType,
        name: formData.name.trim(),
        ownerName: formData.ownerName.trim() || undefined,
        contactPerson: formData.contactPerson.trim() || undefined,
        mobileNumber: mob || undefined,
        gstNumber: gst || undefined,
        openingBalance: Number(formData.openingBalance || 0),
        creditLimit: Number(formData.creditLimit || 0),
        paymentTerms: formData.paymentTerms,
        status: "active",
      };

      const res = await createBusinessResource<Record<string, unknown>>("customers", payload);
      const createdRecord = (res as { item?: Record<string, unknown> })?.item || (res as Record<string, unknown>) || payload;
      onSuccess(createdRecord);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create customer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal quick-master-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "560px", width: "95%" }}
      >
        <div className="modal-header quick-master-header">
          <h2 className="modal-title">New Customer Registration</h2>
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
                {/* Segmented Customer Type Buttons (No ugly radio circles) */}
                <div className="erp-field-group" style={{ gridColumn: "span 2" }}>
                  <label>
                    Customer Classification <span className="erp-required-star">*</span>
                  </label>
                  <div className="quick-type-toggle-row">
                    <button
                      type="button"
                      className={`quick-type-card ${formData.customerType === "company" ? "active" : ""}`}
                      onClick={() => setFormData((p) => ({ ...p, customerType: "company" }))}
                    >
                      <BuildingIcon size={16} />
                      <span>Company / Transporter</span>
                      {formData.customerType === "company" && <CheckIcon size={14} className="quick-type-check" />}
                    </button>
                    <button
                      type="button"
                      className={`quick-type-card ${formData.customerType === "individual" ? "active" : ""}`}
                      onClick={() => setFormData((p) => ({ ...p, customerType: "individual" }))}
                    >
                      <UserIcon size={16} />
                      <span>Individual Owner / Driver</span>
                      {formData.customerType === "individual" && <CheckIcon size={14} className="quick-type-check" />}
                    </button>
                  </div>
                </div>

                  <div className={`erp-field-group ${fieldErrors.name ? "erp-field-group--error" : ""}`} style={{ gridColumn: "span 2" }}>
                    <label>
                      {formData.customerType === "company" ? "Company / Firm Name" : "Customer Full Name"}{" "}
                      <span className="erp-required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className={`erp-input ${fieldErrors.name ? "erp-input--error" : ""}`}
                      placeholder={
                        formData.customerType === "company"
                          ? "e.g. Shree Ram Roadways Pvt Ltd"
                          : "e.g. Ramesh Bhai Patel"
                      }
                      value={formData.name}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, name: e.target.value }));
                        clearFieldError("name");
                      }}
                      autoFocus
                    />
                    {fieldErrors.name && <span className="erp-field-error-msg">{fieldErrors.name}</span>}
                  </div>

                  <div className="erp-field-group">
                    <label>Contact Person / Owner</label>
                    <input
                      type="text"
                      className="erp-input"
                      placeholder="e.g. Rajesh Kumar"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData((p) => ({ ...p, contactPerson: e.target.value }))}
                    />
                  </div>

                    <div className={`erp-field-group ${fieldErrors.mobileNumber ? "erp-field-group--error" : ""}`}>
                      <label>Mobile Number (10 Digits)</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        className={`erp-input ${fieldErrors.mobileNumber ? "erp-input--error" : ""}`}
                        placeholder="e.g. 9825012345"
                        value={formData.mobileNumber}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, "");
                          setFormData((p) => ({ ...p, mobileNumber: clean }));
                          clearFieldError("mobileNumber");
                        }}
                      />
                      {fieldErrors.mobileNumber && (
                        <span className="erp-field-error-msg">{fieldErrors.mobileNumber}</span>
                      )}
                    </div>

                      <div className={`erp-field-group ${fieldErrors.gstNumber ? "erp-field-group--error" : ""}`}>
                        <label>GSTIN Number (Optional)</label>
                        <input
                          type="text"
                          maxLength={15}
                          className={`erp-input ${fieldErrors.gstNumber ? "erp-input--error" : ""}`}
                          placeholder="e.g. 24ABCDE1234F1Z5"
                          value={formData.gstNumber}
                          onChange={(e) => {
                            setFormData((p) => ({ ...p, gstNumber: e.target.value.toUpperCase() }));
                            clearFieldError("gstNumber");
                          }}
                          style={{ textTransform: "uppercase" }}
                        />
                        {fieldErrors.gstNumber && <span className="erp-field-error-msg">{fieldErrors.gstNumber}</span>}
                      </div>

                      <div className="erp-field-group">
                        <label>Payment Terms</label>
                        <ErpSelect
                          value={formData.paymentTerms}
                          options={paymentTermsOptions}
                          onChange={(val) => setFormData((p) => ({ ...p, paymentTerms: val }))}
                          showQuickAddButton={false}
                        />
                      </div>

                      <div className="erp-field-group">
                        <label>Credit Limit (₹)</label>
                        <input
                          type="number"
                          min="0"
                          className="erp-input"
                          placeholder="0"
                          value={formData.creditLimit || ""}
                          onChange={(e) => setFormData((p) => ({ ...p, creditLimit: Number(e.target.value) }))}
                        />
                      </div>

                      <div className="erp-field-group">
                        <label>Opening Balance (₹)</label>
                        <input
                          type="number"
                          min="0"
                          className="erp-input"
                          placeholder="0"
                          value={formData.openingBalance || ""}
                          onChange={(e) => setFormData((p) => ({ ...p, openingBalance: Number(e.target.value) }))}
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
                        <span>{submitting ? "Saving Customer..." : "Save & Select Customer"}</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            );
}
