import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import PageContainer from "@/components/common/PageContainer";
import { ApiError, acceptInvitation } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface MfaSetup {
  setupToken: string;
  otpauthUrl: string;
  manualSecret: string;
}

export default function ActivatePage() {
  const router = useRouter();
  const { finishMfaEnrollment } = useAuth();
  const token = typeof router.query.token === "string" ? router.query.token : "";
  const [password, setPassword] = useState("");
  const [setup, setSetup] = useState<MfaSetup | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!setup) return;

    let active = true;
    QRCode.toDataURL(setup.otpauthUrl, { width: 220, margin: 2 })
      .then((dataUrl) => {
        if (active) setQrCode(dataUrl);
      })
      .catch(() => {
        if (active) setErrorMessage("Could not display the QR code. Use the manual key below.");
      });

    return () => {
      active = false;
    };
  }, [setup]);

  async function handleAcceptInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      setSetup(await acceptInvitation(token, password));
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

  async function handleConfirmMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!setup) return;
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await finishMfaEnrollment(setup.setupToken, code);
      await router.replace("/");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "MFA setup could not be completed.",
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
        {!setup ? (
          <>
            <p className="auth-description">
              Choose a password, then set up mandatory authenticator verification.
            </p>
            <form className="app-form" onSubmit={handleAcceptInvitation}>
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
              {errorMessage ? (
                <p className="connection-error" role="alert">
                  {errorMessage}
                </p>
              ) : null}
              <Button disabled={isSubmitting || !token} type="submit">
                {isSubmitting ? "Checking invitation..." : "Continue"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <p className="auth-description">
              Scan this QR code with an authenticator app, then enter its
              six-digit code to finish setup.
            </p>
            <div className="mfa-setup">
              {qrCode ? (
                <Image
                  alt="Authenticator setup QR code"
                  height={220}
                  src={qrCode}
                  unoptimized
                  width={220}
                />
              ) : (
                <p aria-live="polite">Creating QR code…</p>
              )}
              <p>
                Manual setup key: <code>{setup.manualSecret}</code>
              </p>
            </div>
            <form className="app-form" onSubmit={handleConfirmMfa}>
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
                {isSubmitting ? "Verifying..." : "Verify and activate"}
              </Button>
            </form>
          </>
        )}
      </Card>
    </PageContainer>
  );
}
