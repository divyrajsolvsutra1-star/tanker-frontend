import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import DataTable from "@/components/common/DataTable";
import PageContainer from "@/components/common/PageContainer";
import { ApiError, getUsers, inviteUser } from "@/lib/api";
import type { UserRecord, UserRole } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const roleLabels: Record<UserRole, string> = {
  owner_admin: "Owner / Admin",
  manager: "Manager",
  entry_operator: "Entry Operator",
  accountant: "Accountant",
  washer: "Washer / Employee",
};

const userColumns = [
  { id: "name", header: "Name", cell: (user: UserRecord) => user.displayName },
  { id: "email", header: "Email", cell: (user: UserRecord) => user.email },
  {
    id: "role",
    header: "Role",
    cell: (user: UserRecord) => roleLabels[user.role],
  },
  {
    id: "status",
    header: "Status",
    cell: (user: UserRecord) => (
      <span className="health-state health-state--waiting">{user.status}</span>
    ),
  },
] as const;

export default function UsersPage() {
  const { user, signOut } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("entry_operator");
  const [activationUrl, setActivationUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const result = await getUsers();
      setUsers(result.users);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Could not load users.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    getUsers()
      .then((result) => {
        if (!active) return;
        setUsers(result.users);
        setErrorMessage("");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setErrorMessage(
          error instanceof ApiError ? error.message : "Could not load users.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setActivationUrl("");

    try {
      const result = await inviteUser({ displayName, email, role });
      setActivationUrl(result.activationUrl);
      setDisplayName("");
      setEmail("");
      await loadUsers();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Could not create invitation.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (user?.role !== "owner_admin") {
    return (
      <PageContainer>
        <Card>
          <h1>Access denied</h1>
          <p>Only Owner/Admin users can manage accounts.</p>
          <Link href="/">Return to dashboard</Link>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="dashboard-container">
      <header className="dashboard-topbar">
        <Link className="brand-mark" href="/">
          TANKER
          <span className="brand-mark__subtitle">WASH MANAGEMENT</span>
        </Link>
        <div className="user-header">
          <span>{user.displayName}</span>
          <Button onClick={() => void signOut()} type="button" variant="secondary">
            Sign out
          </Button>
        </div>
      </header>
      <main className="users-main">
        <div className="users-heading">
          <div>
            <p className="intro-kicker">Administration</p>
            <h1>User management</h1>
            <p className="dashboard-description">
              Invite staff accounts. Each person sets a password and enrolls
              mandatory authenticator MFA before they can sign in.
            </p>
          </div>
          <Link className="text-link" href="/">
            Back to dashboard
          </Link>
        </div>

        <div className="users-layout">
          <Card>
            <h2>Invite a user</h2>
            <form className="app-form" onSubmit={handleInvite}>
              <label>
                Full name
                <input
                  maxLength={100}
                  minLength={2}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                  value={displayName}
                />
              </label>
              <label>
                Email
                <input
                  autoComplete="off"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </label>
              <label>
                Role
                <select
                  onChange={(event) => setRole(event.target.value as UserRole)}
                  value={role}
                >
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {errorMessage ? (
                <p className="connection-error" role="alert">
                  {errorMessage}
                </p>
              ) : null}
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Creating invitation..." : "Create invitation"}
              </Button>
            </form>
            {activationUrl ? (
              <div className="invitation-result" role="status">
                <strong>Share this one-time activation link securely:</strong>
                <a href={activationUrl}>{activationUrl}</a>
                <span>It expires after 24 hours.</span>
              </div>
            ) : null}
          </Card>

          <Card>
            <div className="dashboard-card__heading">
              <div>
                <h2>Staff accounts</h2>
                <p>Invited users must enroll MFA before gaining access.</p>
              </div>
              <Button
                disabled={isLoading}
                onClick={() => {
                  setIsLoading(true);
                  void loadUsers();
                }}
                type="button"
                variant="secondary"
              >
                Refresh
              </Button>
            </div>
            {errorMessage && users.length > 0 ? (
              <p className="connection-error" role="alert">{errorMessage}</p>
            ) : null}
            <DataTable
              caption="User accounts"
              columns={userColumns}
              emptyMessage={isLoading ? "Loading users..." : "No users found."}
              getRowKey={(row) => row.id}
              rows={users}
            />
          </Card>
        </div>
      </main>
    </PageContainer>
  );
}
