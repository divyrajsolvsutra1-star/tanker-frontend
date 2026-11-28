import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import type { FormEvent } from "react";
import { EyeIcon, EyeOffIcon, LockIcon } from "@/components/common/Icons";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ActivatePage() {
  const router = useRouter();
  const { activateAccount } = useAuth();
  const token = typeof router.query.token === "string" ? router.query.token : "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (!password.trim()) {
      errs.password = "Password is required.";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters long.";
    }

    if (!confirmPassword.trim()) {
      errs.confirmPassword = "Confirm password is required.";
    } else if (confirmPassword !== password) {
      errs.confirmPassword = "Passwords do not match.";
    }
    return errs;
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
        await activateAccount(token, password);
        await router.replace("/");
      } catch (error) {
          setGeneralError(
            error instanceof ApiError
              ? error.message
              : "Could not activate the account. Check that the backend is running.",
          );
      } finally {
        setIsSubmitting(false);
      }
    }

    return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", background: "#f8fafc" }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "#0f766e", letterSpacing: "1px" }}>
              TANKER
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "1.5px", marginTop: "2px" }}>
              WASH MANAGEMENT
            </span>
          </Link>
        </div>

        <section
          className="erp-card"
          style={{
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
              Activate your account
            </h1>
          </div>

          <p style={{ margin: "6px 0 20px", color: "#64748b", fontSize: "12.5px", lineHeight: "1.4" }}>
            Create a password to finish setting up your invited staff account.
          </p>

          {generalError && (
            <div className="erp-alert erp-alert--danger" role="alert" style={{ marginBottom: "16px" }}>
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className={`erp-field-group ${fieldErrors.password ? "erp-field-group--error" : ""}`}>
              <label htmlFor="new-password">
                New password <span className="erp-required-star">*</span>
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  id="new-password"
                  autoComplete="new-password"
                  className={`erp-input ${fieldErrors.password ? "erp-input--error" : ""}`}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="At least 6 characters..."
                  style={{ paddingRight: "40px" }}
                  onChange={(e) => handleFieldChange("password", e.target.value, setPassword)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={{
                    position: "absolute",
                    right: "8px",
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "6px",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
              {fieldErrors.password ? (
                <span className="erp-field-error-msg">{fieldErrors.password}</span>
              ) : (
                <span style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>Minimum 6 characters.</span>
              )}
            </div>

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
                  placeholder="Re-enter password..."
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
                    justifyContent: "center",
                    padding: "6px",
                  }}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <span className="erp-field-error-msg">{fieldErrors.confirmPassword}</span>
              )}
            </div>

            <div style={{ marginTop: "10px" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || !token}
                style={{ width: "100%", justifyContent: "center", height: "40px", fontSize: "13px" }}
              >
                {isSubmitting ? "Activating account..." : "Activate account"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
    );
  }
