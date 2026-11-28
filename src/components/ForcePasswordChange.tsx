import { useState } from "react";
import type { FormEvent } from "react";
import { EyeIcon, EyeOffIcon, LockIcon } from "@/components/common/Icons";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ForcePasswordChange() {
  const { changePassword, signOut } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};

    if (!currentPassword.trim()) {
      errs.currentPassword = "Temporary password is required.";
    }

    if (!newPassword.trim()) {
      errs.newPassword = "New password is required.";
    } else if (newPassword.length < 6) {
      errs.newPassword = "Password must be at least 6 characters long.";
    } else if (newPassword === currentPassword) {
      errs.newPassword = "New password must be different from temporary password.";
    }

    if (!confirmPassword.trim()) {
      errs.confirmPassword = "Confirm password is required.";
    } else if (confirmPassword !== newPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    return errs;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralError("");

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
    } catch (error) {
      setGeneralError(
        error instanceof ApiError
          ? error.message
          : "Could not update your password. Please check your credentials.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFieldChange(field: string, val: string, setter: (v: string) => void) {
    setter(val);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", background: "#f8fafc" }}>
      <section
        className="erp-card"
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "32px 28px",
          borderRadius: "12px",
          border: "1px solid #cbd5e1",
          boxShadow: "0 20px 45px -10px rgba(15, 23, 42, 0.15)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "#f0fdfa",
              color: "#0f766e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LockIcon size={20} />
          </div>
          <h1 style={{ margin: 0, fontSize: "19px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
            Set a new password
          </h1>
        </div>

        <p style={{ margin: "6px 0 20px", color: "#64748b", fontSize: "12.5px", lineHeight: "1.4" }}>
          Your administrator provided a temporary password. Change it before continuing into your account.
        </p>

        {generalError && (
          <div className="erp-alert erp-alert--danger" role="alert" style={{ marginBottom: "16px" }}>
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Temporary Password Field */}
          <div className={`erp-field-group ${fieldErrors.currentPassword ? "erp-field-group--error" : ""}`}>
            <label htmlFor="temp-password">
              Temporary password <span className="erp-required-star">*</span>
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                id="temp-password"
                autoComplete="current-password"
                className={`erp-input ${fieldErrors.currentPassword ? "erp-input--error" : ""}`}
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                placeholder="Enter temporary password..."
                style={{ paddingRight: "40px" }}
                onChange={(e) => handleFieldChange("currentPassword", e.target.value, setCurrentPassword)}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((p) => !p)}
                style={{
                  position: "absolute",
                  right: "8px",
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                }}
                title={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
            {fieldErrors.currentPassword && (
              <span className="erp-field-error-msg">{fieldErrors.currentPassword}</span>
            )}
          </div>

          {/* New Password Field */}
          <div className={`erp-field-group ${fieldErrors.newPassword ? "erp-field-group--error" : ""}`}>
            <label htmlFor="new-password">
              New password <span className="erp-required-star">*</span>
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                id="new-password"
                autoComplete="new-password"
                className={`erp-input ${fieldErrors.newPassword ? "erp-input--error" : ""}`}
                type={showNew ? "text" : "password"}
                value={newPassword}
                placeholder="At least 6 characters..."
                style={{ paddingRight: "40px" }}
                onChange={(e) => handleFieldChange("newPassword", e.target.value, setNewPassword)}
              />
              <button
                type="button"
                onClick={() => setShowNew((p) => !p)}
                style={{
                  position: "absolute",
                  right: "8px",
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                }}
                title={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
            {fieldErrors.newPassword && (
              <span className="erp-field-error-msg">{fieldErrors.newPassword}</span>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className={`erp-field-group ${fieldErrors.confirmPassword ? "erp-field-group--error" : ""}`}>
            <label htmlFor="confirm-password">
              Confirm new password <span className="erp-required-star">*</span>
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                id="confirm-password"
                autoComplete="new-password"
                className={`erp-input ${fieldErrors.confirmPassword ? "erp-input--error" : ""}`}
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                placeholder="Re-enter your new password..."
                style={{ paddingRight: "40px" }}
                onChange={(e) => handleFieldChange("confirmPassword", e.target.value, setConfirmPassword)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                style={{
                  position: "absolute",
                  right: "8px",
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                }}
                title={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <span className="erp-field-error-msg">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            <button
              className="erp-btn erp-btn--primary"
              disabled={isSubmitting}
              type="submit"
              style={{
                width: "100%",
                minHeight: "40px",
                background: "#0f766e",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "13px",
                justifyContent: "center",
              }}
            >
              {isSubmitting ? "Updating Password..." : "Update password"}
            </button>
            <button
              className="erp-btn erp-btn--secondary"
              disabled={isSubmitting}
              onClick={() => void signOut()}
              type="button"
              style={{
                width: "100%",
                minHeight: "38px",
                background: "#ffffff",
                border: "1.5px solid #cbd5e1",
                color: "#475569",
                fontWeight: 600,
                fontSize: "12.5px",
                justifyContent: "center",
              }}
            >
              Sign out
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
