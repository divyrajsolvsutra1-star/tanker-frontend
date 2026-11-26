import { useState } from "react";
import type { FormEvent } from "react";
import ErpSelect from "@/components/common/ErpSelect";
import ErpDatePicker from "@/components/common/ErpDatePicker";

type FormValue = string | number;
type FormValues = Record<string, FormValue>;

export interface FormField {
  key: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "date" | "select" | "textarea";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: (value: FormValue) => string | null;
}

export interface FormDialogProps {
  title: string;
  fields: FormField[];
  initialData?: FormValues;
  onSubmit: (data: FormValues) => Promise<void>;
  onClose: () => void;
  submitLabel?: string;
  loading?: boolean;
}

export default function FormDialog({
  title,
  fields,
  initialData = {},
  onSubmit,
  onClose,
  submitLabel = "Save",
  loading = false,
}: FormDialogProps) {
  const [formData, setFormData] = useState<FormValues>(() => ({ ...initialData }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    for (const field of fields) {
      const value = formData[field.key];

      // Check required
      const isEmpty =
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "");
      if (field.required && isEmpty) {
        newErrors[field.key] = `${field.label} is required`;
        continue;
      }

      if (field.validation && !isEmpty) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.key] = error;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Could not save this record.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (key: string, value: FormValue) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        aria-labelledby="form-dialog-title"
        aria-modal="true"
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        style={{ maxWidth: "600px" }}
      >
        <div className="modal-header">
          <h2 className="modal-title" id="form-dialog-title">{title}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {fields.map((field) => (
              <div key={field.key} className="form-group">
                <label className="form-label" htmlFor={`form-${field.key}`}>
                  {field.label}
                  {field.required && <span style={{ color: "var(--danger)" }}>*</span>}
                </label>

                {field.type === "textarea" ? (
                  <textarea
                    className="form-textarea"
                    id={`form-${field.key}`}
                    value={formData[field.key] ?? ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={4}
                  />
                ) : field.type === "select" ? (
                  <ErpSelect
                    id={`form-${field.key}`}
                    value={String(formData[field.key] ?? "")}
                    options={field.options || []}
                    placeholder={`Select ${field.label}...`}
                    required={field.required}
                    onChange={(val) => handleChange(field.key, val)}
                  />
                ) : field.type === "date" ? (
                  <ErpDatePicker
                    id={`form-${field.key}`}
                    type="date"
                    value={String(formData[field.key] ?? "")}
                    required={field.required}
                    onChange={(val) => handleChange(field.key, val)}
                  />
                ) : (
                  <input
                    className="form-input"
                    id={`form-${field.key}`}
                    type={field.type}
                    value={formData[field.key] ?? ""}
                    onChange={(e) =>
                      handleChange(
                        field.key,
                        field.type === "number" && e.target.value !== ""
                          ? e.target.valueAsNumber
                          : e.target.value,
                      )
                    }
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}

                {errors[field.key] && (
                  <p style={{ color: "var(--danger)", fontSize: "12px", marginTop: "4px" }}>
                    {errors[field.key]}
                  </p>
                )}
              </div>
            ))}
            {submitError ? (
              <p className="connection-error" role="alert">{submitError}</p>
            ) : null}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting || loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || loading}
            >
              {submitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
