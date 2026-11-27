import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import type { FormEvent } from "react";
import Button from "@/components/common/Button";
import {
  AlertTriangleIcon,
  LockIcon,
  MailIcon,
  ReportsIcon,
  ShieldCheckIcon,
  TruckIcon,
  ZapIcon,
} from "@/components/common/Icons";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      await signIn(email, password);
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
    <main className="login-shell">
      {/* Left Showcase Banner */}
      <section className="login-showcase" aria-label="Tanker Wash Management">
        <div className="login-showcase__top">
          <Link className="login-brand" href="/" aria-label="Tanker Wash home">
            <span className="login-brand__icon" aria-hidden="true">
              <TruckIcon size={22} />
            </span>
            <div className="login-brand__text">
              <span className="login-brand__title">TANKER</span>
              <span className="login-brand__sub">WASH MANAGEMENT</span>
            </div>
          </Link>
          <span className="login-tag">Enterprise Portal</span>
        </div>

        <div className="login-showcase__copy">
          <span className="login-eyebrow">INTELLIGENT WASH HUB</span>
          <h1>
            Operational excellence for modern tanker wash facilities.
          </h1>
          <p>
            Seamlessly coordinate wash orders, automated double-entry accounting,
            real-time vehicle tracking, and role-based operational permissions.
          </p>

          <div className="login-highlights">
            <div className="login-highlight-item">
              <span className="login-highlight-icon">
                <ZapIcon size={18} />
              </span>
              <div>
                <strong>Rapid Wash Entries</strong>
                <p>Preserved pricing, instant receipts, and vehicle history.</p>
              </div>
            </div>
            <div className="login-highlight-item">
              <span className="login-highlight-icon">
                <ReportsIcon size={18} />
              </span>
              <div>
                <strong>Automated Ledgers</strong>
                <p>Auto-balanced journals, customer credit lines, and cash flow.</p>
              </div>
            </div>
            <div className="login-highlight-item">
              <span className="login-highlight-icon">
                <ShieldCheckIcon size={18} />
              </span>
              <div>
                <strong>Role-Based Security</strong>
                <p>Granular access control with verifiable audit logging.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="login-showcase__foot">
          <span>Secure workspace for your tanker wash operations.</span>
        </div>
      </section>

      {/* Right Login Panel */}
      <section className="login-panel">
        <div className="login-panel__content">
          <div className="login-mobile-brand">
            <span className="login-brand__icon" aria-hidden="true">
              <TruckIcon size={20} />
            </span>
            <strong>TANKER WASH</strong>
          </div>

          <div className="login-header">
            <span className="login-eyebrow login-eyebrow--blue">WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p className="login-intro">
              Enter your authorized work email and password to access the portal.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-form-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="login-input-wrap">
                <span className="login-input-icon" aria-hidden="true">
                  <MailIcon size={16} />
                </span>
                <input
                  autoComplete="username"
                  id="login-email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@tanker.local"
                  required
                  type="email"
                  value={email}
                />
              </div>
            </div>

            <div className="login-form-group">
              <div className="login-password-header">
                <label htmlFor="login-password">Password</label>
              </div>
              <div className="login-input-wrap">
                <span className="login-input-icon" aria-hidden="true">
                  <LockIcon size={16} />
                </span>
                <input
                  autoComplete="current-password"
                  id="login-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="login-show-password"
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {errorMessage ? (
              <div className="login-error-alert" role="alert">
                <span className="login-error-icon" aria-hidden="true">
                  <AlertTriangleIcon size={16} />
                </span>
                <span>{errorMessage}</span>
              </div>
            ) : null}

            <Button className="login-submit" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Signing in..." : "Sign in to Dashboard"}
              {!isSubmitting ? <span aria-hidden="true">&rarr;</span> : null}
            </Button>
          </form>

          <p className="login-help">
            Need access? Contact your <strong>Owner / Administrator</strong> for invitation.
          </p>
        </div>
      </section>
    </main>
  );
}
