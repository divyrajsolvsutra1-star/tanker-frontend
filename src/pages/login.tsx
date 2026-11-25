import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import type { FormEvent } from "react";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import PageContainer from "@/components/common/PageContainer";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await signIn(email, password, code);
      await router.replace("/");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Could not connect to the API. Check that the backend is running.",
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
        <p className="intro-kicker">Secure access</p>
        <h1>Sign in</h1>
        <p className="auth-description">
          Use your invited account and the code from your authenticator app.
        </p>
        <form className="app-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="username"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <label>
            Authenticator code
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              pattern="\d{6}"
              placeholder="6-digit code"
              required
              value={code}
            />
          </label>
          {errorMessage ? (
            <p className="connection-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="auth-footnote">
          Access is invitation-only. Contact your Owner/Admin if you need an
          account.
        </p>
        <p className="auth-footnote">
          First-time setup: start MongoDB, then run{" "}
          <code>npm run create-owner -- owner@example.com &quot;Owner Name&quot;</code>{" "}
          from the backend folder.
        </p>
      </Card>
    </PageContainer>
  );
}
