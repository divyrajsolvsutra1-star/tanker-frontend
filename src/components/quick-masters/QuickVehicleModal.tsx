import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createBusinessResource, getBusinessResource, ApiError } from "@/lib/api";
import { CheckIcon, PlusIcon, XIcon } from "@/components/common/Icons";
import ErpSelect from "@/components/common/ErpSelect";
import QuickCustomerModal from "./QuickCustomerModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (vehicle: Record<string, unknown>) => void;
  initialVehicleNumber?: string;
  initialCustomerId?: string;
  customers?: Record<string, unknown>[];
}

export default function QuickVehicleModal({
  isOpen,
  onClose,
  onSuccess,
  initialVehicleNumber = "",
  initialCustomerId = "",
  customers: initialCustomers = [],
}: Props) {
  const [customerList, setCustomerList] = useState<Record<string, unknown>[]>(initialCustomers);
  const [vehicleNumber, setVehicleNumber] = useState(initialVehicleNumber);
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [driverName, setDriverName] = useState("");
  const [driverMobileNumber, setDriverMobileNumber] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVehicleNumber(initialVehicleNumber);
      setCustomerId(initialCustomerId);
      setError("");
      setFieldErrors({});

      getBusinessResource<Record<string, unknown>>("customers", { limit: 100 })
        .then((res) => {
          const list = "items" in res ? res.items : [];
          setCustomerList(list);
        })
        .catch(() => { });
    }
  }, [isOpen, initialVehicleNumber, initialCustomerId]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen || showQuickCustomer) return;
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showQuickCustomer, onClose]);

  function clearFieldError(field: string) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  // Deduplicate and format options for ErpSelect
  const customerSelectOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { value: string; label: string }[] = [];
    customerList.forEach((c) => {
      const id = String(c._id);
      if (id && !seen.has(id)) {
        seen.add(id);
        opts.push({
          value: id,
          label: c.customerType
            ? `${String(c.name)} (${String(c.customerType)})`
            : String(c.name),
        });
      }
    });
    return opts;
  }, [customerList]);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const errs: Record<string, string> = {};

    const veh = vehicleNumber.trim().toUpperCase();
    if (!veh) {
      errs.vehicleNumber = "Tanker / Vehicle Number is required.";
    } else if (veh.replace(/[^A-Za-z0-9]/g, "").length < 5) {
      errs.vehicleNumber = "Enter a valid vehicle plate (e.g. GJ-05-MH-2005).";
    }

    if (!customerId) {
      errs.customerId = "Please select the Customer / Transporter owner.";
    }

    const mob = driverMobileNumber.trim();
    if (mob && !/^[6-9]\d{9}$/.test(mob)) {
      errs.driverMobileNumber = "Enter a valid 10-digit mobile number (starting 6-9).";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        vehicleNumber: veh,
        customerId,
        driverName: driverName.trim() || undefined,
        driverMobileNumber: mob || undefined,
        status: "active",
      };

      const res = await createBusinessResource<Record<string, unknown>>("vehicles", payload);
      const createdRecord = (res as { item?: Record<string, unknown> })?.item || (res as Record<string, unknown>) || payload;
      onSuccess(createdRecord);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.field === "vehicleNumber" || err.message.toLowerCase().includes("plate") || err.message.toLowerCase().includes("vehicle")) {
          setFieldErrors((prev) => ({ ...prev, vehicleNumber: err.message }));
        }
        setError(err.message);
      } else {
        setError("Failed to register vehicle.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleCustomerCreated(newCust: Record<string, unknown>) {
    const newId = String(newCust._id);
    setCustomerList((prev) => [newCust, ...prev.filter((c) => String(c._id) !== newId)]);
    setCustomerId(newId);
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
        <div
          className="modal quick-master-modal"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: "540px", width: "95%" }}
        >
          <div className="modal-header quick-master-header">
            <h2 className="modal-title">Register New Tanker Vehicle</h2>
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
                <div className={`erp-field-group ${fieldErrors.vehicleNumber ? "erp-field-group--error" : ""}`} style={{ gridColumn: "span 2" }}>
                  <label>
                    Vehicle / Tanker Number <span className="erp-required-star">*</span>
                  </label>
                  <input
                    type="text"
                    className={`erp-input ${fieldErrors.vehicleNumber ? "erp-input--error" : ""}`}
                    placeholder="e.g. GJ01AB1234 / MH04XY9999"
                    value={vehicleNumber}
                    onChange={(e) => {
                      setVehicleNumber(e.target.value.toUpperCase());
                      clearFieldError("vehicleNumber");
                    }}
                    style={{ textTransform: "uppercase", fontWeight: 600, letterSpacing: "1px" }}
                    autoFocus
                  />
                  {fieldErrors.vehicleNumber && (
                    <span className="erp-field-error-msg">{fieldErrors.vehicleNumber}</span>
                  )}
                </div>

                <div className={`erp-field-group ${fieldErrors.customerId ? "erp-field-group--error" : ""}`} style={{ gridColumn: "span 2" }}>
                  <label>
                    Customer / Transporter Owner <span className="erp-required-star">*</span>
                  </label>
                  <ErpSelect
                    value={customerId}
                    options={customerSelectOptions}
                    placeholder="Select Customer / Company..."
                    onChange={(val) => {
                      setCustomerId(val);
                      clearFieldError("customerId");
                    }}
                    onAddNew={() => setShowQuickCustomer(true)}
                    addNewLabel="Add New Customer"
                  />
                  {fieldErrors.customerId && (
                    <span className="erp-field-error-msg">{fieldErrors.customerId}</span>
                  )}
                </div>

                <div className="erp-field-group">
                  <label>Default Driver Name</label>
                  <input
                    type="text"
                    className="erp-input"
                    placeholder="e.g. Rajesh Kumar"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                  />
                </div>

                <div className={`erp-field-group ${fieldErrors.driverMobileNumber ? "erp-field-group--error" : ""}`}>
                  <label>Driver Mobile Number</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className={`erp-input ${fieldErrors.driverMobileNumber ? "erp-input--error" : ""}`}
                    placeholder="e.g. 9898123456"
                    value={driverMobileNumber}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "");
                      setDriverMobileNumber(clean);
                      clearFieldError("driverMobileNumber");
                    }}
                  />
                  {fieldErrors.driverMobileNumber && (
                    <span className="erp-field-error-msg">{fieldErrors.driverMobileNumber}</span>
                  )}
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
                  <span>{submitting ? "Saving..." : "Save & Select Vehicle"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {showQuickCustomer && (
        <QuickCustomerModal
          isOpen={showQuickCustomer}
          onClose={() => setShowQuickCustomer(false)}
          onSuccess={handleCustomerCreated}
        />
      )}
    </>
  );
}
