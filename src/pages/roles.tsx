import { useEffect, useState } from "react";
import ErpPageHeader from "@/components/common/ErpPageHeader";
import { CheckCircleIcon, RefreshIcon, RolesIcon, SpinnerIcon } from "@/components/common/Icons";
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
  const { user } = useAuth();
  const [settings, setSettings] = useState<RolePermissionsResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingRole, setSavingRole] = useState<UserRole | null>(null);

  function loadPermissions() {
    setIsLoading(true);
    getRolePermissions()
      .then((result) => {
        setSettings(result);
        setErrorMessage("");
      })
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Could not load role permissions.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  useEffect(() => {
    loadPermissions();
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
            ? Array.from(new Set([...currentActions, action]))
            : currentActions.filter((item) => item !== action);

          return {
            ...role,
            permissions: {
              ...role.permissions,
              [moduleName]: nextActions,
            },
          };
        }),
      };
    });
  }

  async function savePermissions(role: RolePermissionSet) {
    setSavingRole(role.role);
    setErrorMessage("");
    setSavedMessage("");

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
      setSavedMessage(`${roleLabels[role.role]} permissions saved successfully.`);
      setTimeout(() => setSavedMessage(""), 4000);
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
      <div className="erp-module">
        <div className="erp-card" style={{ padding: "32px", textAlign: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Access Restricted</h2>
          <p style={{ color: "#64748b", margin: "8px 0 0" }}>
            Only Owner / Admin users have permission to configure security roles and permissions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="erp-module">
      <ErpPageHeader
        title="Role-Based Access Control"
        description="Configure granular module permissions and operational authorization matrices for each staff role."
        actions={
          <button
            type="button"
            className="erp-btn erp-btn--secondary"
            onClick={loadPermissions}
            disabled={isLoading}
          >
            <RefreshIcon size={14} />
            <span>Reload Roles</span>
          </button>
        }
      />

      {errorMessage && (
        <div className="erp-alert erp-alert--danger" role="alert">
          {errorMessage}
        </div>
      )}

      {savedMessage && (
        <div className="erp-alert erp-alert--success" role="status" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircleIcon size={16} color="#0f766e" />
          <span>{savedMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="erp-card" style={{ padding: "36px", textAlign: "center", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <SpinnerIcon size={20} color="#0f766e" />
          <span>Loading security matrices...</span>
        </div>
      ) : settings ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {settings.roles.map((role) => (
            <div className="erp-card" key={role.role} style={{ overflow: "hidden" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                    {roleLabels[role.role]}
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                    Actions left unchecked are denied at the API gateway.
                  </p>
                </div>
                <button
                  type="button"
                  className="erp-btn erp-btn--primary"
                  disabled={savingRole !== null}
                  onClick={() => void savePermissions(role)}
                >
                  {savingRole === role.role ? "Saving Matrix..." : `Save ${roleLabels[role.role]}`}
                </button>
              </div>

              <div
                style={{
                  padding: "20px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "16px",
                }}
              >
                {settings.modules.map((moduleName) => (
                  <div
                    key={moduleName}
                    style={{
                      border: "1px solid #f1f5f9",
                      borderRadius: "8px",
                      padding: "14px",
                      background: "#ffffff",
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "10px" }}>
                      {moduleLabels[moduleName] ?? moduleName}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {settings.actions.map((action) => {
                        const isChecked = (role.permissions[moduleName] ?? []).includes(action);
                        return (
                          <label
                            key={action}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "12px",
                              color: isChecked ? "#0f766e" : "#64748b",
                              background: isChecked ? "#f0fdfa" : "#f8fafc",
                              border: `1px solid ${isChecked ? "#99f6e4" : "#e2e8f0"}`,
                              padding: "4px 8px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              userSelect: "none",
                              fontWeight: isChecked ? 600 : 400,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(event) =>
                                togglePermission(
                                  role.role,
                                  moduleName,
                                  action,
                                  event.target.checked,
                                )
                              }
                              style={{ accentColor: "#0f766e" }}
                            />
                            {actionLabels[action] ?? action}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
