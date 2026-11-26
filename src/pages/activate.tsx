import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import type { FormEvent } from "react";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import PageContainer from "@/components/common/PageContainer";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ActivatePage() {
  const router = useRouter();
  const { activateAccount } = useAuth();
  const token = typeof router.query.token === "string" ? router.query.token : "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await activateAccount(token, password);
      await router.replace("/");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Could not activate the account. Check that the backend is running.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer className="auth-container">
      <Link className="brand-mark" href="/" aria-label="Tanker Wash">
        TANKER
        <span className="brand-mark__subtitle">WASH MANAGEMENT</span>
      </Link>
      <Card className="auth-card">
        <p className="intro-kicker">Account setup</p>
        <h1>Activate your account</h1>
        <p className="auth-description">
          Create a password to finish setting up your invited account.
        </p>
        <form className="app-form" onSubmit={handleSubmit}>
          <label>
            New password
            <input
              autoComplete="new-password"
              minLength={12}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <p className="field-hint">Use at least 12 characters.</p>
          <label>
            Confirm password
            <input
              autoComplete="new-password"
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          </label>
          {errorMessage ? <p className="connection-error" role="alert">{errorMessage}</p> : null}
          <Button disabled={isSubmitting || !token} type="submit">
            {isSubmitting ? "Activating..." : "Activate account"}
          </Button>
        </form>
      </Card>
    </PageContainer>
  );
}
