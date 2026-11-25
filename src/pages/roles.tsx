import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import PageContainer from "@/components/common/PageContainer";
import {
  ApiError,
  getRolePermissions,
  saveRolePermissions,
} from "@/lib/api";
import type {
  RolePermissionsResponse,
  RolePermissionSet,
  UserRole,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const roleLabels: Record<UserRole, string> = {
  owner_admin: "Owner / Admin",
  manager: "Manager",
  entry_operator: "Entry Operator",
  accountant: "Accountant",
  washer: "Washer / Employee",
};

const moduleLabels: Record<string, string> = {
  dashboard: "Dashboard",
  customers: "Customers & Companies",
  vehicles: "Vehicles",
  washTypesRates: "Wash Types & Rates",
  washEntries: "Wash Entries",
  washStatuses: "Wash Statuses",
  receipts: "Receipts",
  customerLedger: "Customer Ledger",
  cashBank: "Cash & Bank",
  expenses: "Expenses",
  employees: "Employees & Salary",
  accounting: "Accounting",
  reports: "Reports & Export",
  userManagement: "User Management",
  auditLogs: "Activity Logs",
  backups: "Backups",
};

const actionLabels: Record<string, string> = {
  read: "View",
  create: "Create",
  update: "Edit",
  deactivate: "Deactivate",
  approve: "Approve",
  export: "Export",
};

export default function RolesPage() {
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState<RolePermissionsResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingRole, setSavingRole] = useState<UserRole | null>(null);

  useEffect(() => {
    let active = true;

    getRolePermissions()
      .then((result) => {
        if (active) setSettings(result);
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(
            error instanceof ApiError
              ? error.message
              : "Could not load role permissions.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function togglePermission(
    roleName: UserRole,
    moduleName: string,
    action: string,
    enabled: boolean,
  ) {
    setSettings((current) => {
      if (!current) return current;

      return {
        ...current,
        roles: current.roles.map((role) => {
          if (role.role !== roleName) return role;

          const currentActions = role.permissions[moduleName] ?? [];
          const nextActions = enabled
            ? [...new Set([...currentActions, action])]
            : currentActions.filter((item) => item !== action);

          return {
            ...role,
            permissions: { ...role.permissions, [moduleName]: nextActions },
          };
        }),
      };
    });
  }

  async function savePermissions(role: RolePermissionSet) {
    setSavingRole(role.role);
    setSavedMessage("");
    setErrorMessage("");

    try {
      const saved = await saveRolePermissions(role.role, role.permissions);
      setSettings((current) =>
        current
          ? {
              ...current,
              roles: current.roles.map((item) =>
                item.role === role.role ? saved : item,
              ),
            }
          : current,
      );
      setSavedMessage(`${roleLabels[role.role]} permissions saved.`);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Could not save role permissions.",
      );
    } finally {
      setSavingRole(null);
    }
  }

  if (user?.role !== "owner_admin") {
    return (
      <PageContainer>
        <Card>
          <h1>Access denied</h1>
          <p>Only Owner/Admin users can configure permissions.</p>
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
            <h1>Role permissions</h1>
            <p className="dashboard-description">
              Owner/Admin always retains full access. Configure access for each
              other role by module and action.
            </p>
          </div>
          <Link className="text-link" href="/">
            Back to dashboard
          </Link>
        </div>
        {errorMessage ? (
          <p className="connection-error" role="alert">{errorMessage}</p>
        ) : null}
        {savedMessage ? (
          <p className="connection-success" role="status">{savedMessage}</p>
        ) : null}
        {isLoading ? (
          <Card>Loading permission settings…</Card>
        ) : settings ? (
          <div className="permission-roles">
            {settings.roles.map((role) => (
              <Card className="permission-role" key={role.role}>
                <div className="dashboard-card__heading">
                  <div>
                    <h2>{roleLabels[role.role]}</h2>
                    <p>Unselected actions are denied.</p>
                  </div>
                  <Button
                    disabled={savingRole !== null}
                    onClick={() => void savePermissions(role)}
                    type="button"
                  >
                    {savingRole === role.role ? "Saving..." : "Save permissions"}
                  </Button>
                </div>
                <div className="permission-modules">
                  {settings.modules.map((moduleName) => (
                    <fieldset className="permission-module" key={moduleName}>
                      <legend>{moduleLabels[moduleName] ?? moduleName}</legend>
                      <div className="permission-actions">
                        {settings.actions.map((action) => (
                          <label key={action}>
                            <input
                              checked={(role.permissions[moduleName] ?? []).includes(
                                action,
                              )}
                              onChange={(event) =>
                                togglePermission(
                                  role.role,
                                  moduleName,
                                  action,
                                  event.target.checked,
                                )
                              }
                              type="checkbox"
                            />
                            {actionLabels[action] ?? action}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </main>
    </PageContainer>
  );
}
