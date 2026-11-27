import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ForcePasswordChange() {
  const { changePassword, signOut } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirmation do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Could not update your password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", background: "#f8fafc" }}>
      <section className="erp-card" style={{ width: "100%", maxWidth: "440px", padding: "28px" }}>
        <h1 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Set a new password</h1>
        <p style={{ margin: "8px 0 20px", color: "#64748b", fontSize: "13px" }}>
          Your administrator provided a temporary password. Change it before continuing.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
          <label className="form-group">
            <span className="form-label">Temporary password</span>
            <input
              autoComplete="current-password"
              className="form-input"
              minLength={12}
              required
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>
          <label className="form-group">
            <span className="form-label">New password</span>
            <input
              autoComplete="new-password"
              className="form-input"
              maxLength={128}
              minLength={12}
              required
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
          <label className="form-group">
            <span className="form-label">Confirm new password</span>
            <input
              autoComplete="new-password"
              className="form-input"
              maxLength={128}
              minLength={12}
              required
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
          {errorMessage && (
            <div className="erp-alert erp-alert--danger" role="alert">
              {errorMessage}
            </div>
          )}
          <button
            className="erp-btn erp-btn--primary"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Updating..." : "Update password"}
          </button>
          <button
            className="erp-btn erp-btn--secondary"
            disabled={isSubmitting}
            onClick={() => void signOut()}
            type="button"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
