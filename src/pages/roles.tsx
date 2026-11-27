import { useCallback, useEffect, useState } from "react";
import ErpPageHeader from "@/components/common/ErpPageHeader";
import IconActionButton from "@/components/common/IconActionButton";
import {
  CheckCircleIcon,
  PlusIcon,
  RefreshIcon,
  SpinnerIcon,
  TrashIcon,
} from "@/components/common/Icons";
import {
  ApiError,
  createRole,
  deleteRole,
  getRolePermissions,
  renameRole,
  saveRolePermissions,
} from "@/lib/api";
import type {
  RolePermissionsResponse,
  RolePermissionSet,
  UserRole,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

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
  delete: "Delete",
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
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [permissionsDraft, setPermissionsDraft] = useState<Record<string, string[]> | null>(null);
  const [roleNameDraft, setRoleNameDraft] = useState("");
  const [roleDialog, setRoleDialog] = useState<{ role: UserRole | null } | null>(null);
  const [savingRoleDefinition, setSavingRoleDefinition] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RolePermissionSet | null>(null);
  const [deletingRole, setDeletingRole] = useState(false);

  const loadPermissions = useCallback(() => {
    setIsLoading(true);
    void getRolePermissions()
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
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadPermissions);
  }, [loadPermissions]);

  function openPermissions(role: RolePermissionSet) {
    setEditingRole(role.role);
    setPermissionsDraft(
      Object.fromEntries(
        Object.entries(role.permissions).map(([moduleName, actions]) => [
          moduleName,
          [...actions],
        ]),
      ),
    );
  }

  function closePermissions() {
    setEditingRole(null);
    setPermissionsDraft(null);
  }

  function togglePermission(
    roleName: UserRole,
    moduleName: string,
    action: string,
    enabled: boolean,
  ) {
    if (editingRole !== roleName) return;
    setPermissionsDraft((current) => {
      if (!current) return current;
      const currentActions = current[moduleName] ?? [];
      const nextActions = enabled
        ? Array.from(new Set([...currentActions, action]))
        : currentActions.filter((item) => item !== action);
      return {
        ...current,
        [moduleName]: nextActions,
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
      setSavedMessage(`${role.name} permissions saved successfully.`);
      closePermissions();
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

  function openRoleDialog(role: RolePermissionSet | null) {
    setRoleDialog({ role: role?.role ?? null });
    setRoleNameDraft(role?.name ?? "");
    setErrorMessage("");
  }

  async function saveRoleDefinition() {
    if (!roleDialog) return;
    setSavingRoleDefinition(true);
    setErrorMessage("");
    setSavedMessage("");

    try {
      if (roleDialog.role) {
        await renameRole(roleDialog.role, roleNameDraft);
        setSavedMessage("Role updated successfully.");
      } else {
        await createRole(roleNameDraft);
        setSavedMessage("Role created successfully.");
      }
      setRoleDialog(null);
      await loadPermissions();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Could not save this role.",
      );
    } finally {
      setSavingRoleDefinition(false);
    }
  }

  async function removeRole() {
    if (!roleToDelete) return;
    setDeletingRole(true);
    setErrorMessage("");
    setSavedMessage("");

    try {
      await deleteRole(roleToDelete.role);
      setRoleToDelete(null);
      setSavedMessage(`${roleToDelete.name} role deleted.`);
      await loadPermissions();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Could not delete this role.",
      );
    } finally {
      setDeletingRole(false);
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

  const selectedRole = settings?.roles.find((role) => role.role === editingRole);

  return (
    <div className="erp-module">
      <ErpPageHeader
        title="Role-Based Access Control"
        description="Configure granular module permissions and operational authorization matrices for each staff role."
        actions={
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="erp-btn erp-btn--secondary"
              onClick={() => openRoleDialog(null)}
            >
              <PlusIcon size={16} />
              <span>Create role</span>
            </button>
            <button
              type="button"
              className="erp-btn erp-btn--secondary"
              onClick={() => void loadPermissions()}
              disabled={isLoading}
            >
              <RefreshIcon size={16} />
              <span>Reload Roles</span>
            </button>
          </div>
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
        <div className="erp-card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", color: "#475569", fontSize: "12px" }}>
                  <th scope="col" style={{ padding: "14px 20px" }}>Role</th>
                  <th scope="col" style={{ padding: "14px 20px" }}>Assigned permissions</th>
                  <th scope="col" style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {settings.roles.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                      No roles yet. Create a role to get started.
                    </td>
                  </tr>
                )}
                {settings.roles.map((role) => {
                  const grantedActions = Object.values(role.permissions).reduce(
                    (total, actions) => total + actions.length,
                    0,
                  );
                  const grantedModules = Object.values(role.permissions).filter(
                    (actions) => actions.length > 0,
                  ).length;

                  return (
                    <tr key={role.role} style={{ borderTop: "1px solid #e2e8f0" }}>
                      <th scope="row" style={{ padding: "16px 20px", color: "#0f172a", fontSize: "14px" }}>
                        {role.name}
                      </th>
                      <td style={{ padding: "16px 20px", color: "#64748b", fontSize: "13px" }}>
                        {grantedModules} modules - {grantedActions} actions
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", flexWrap: "wrap" }}>
                          <IconActionButton
                            action="edit"
                            onClick={() => openRoleDialog(role)}
                            title="Edit role name"
                          />
                          <button
                            type="button"
                            className="erp-btn erp-btn--secondary"
                            onClick={() => openPermissions(role)}
                          >
                            Manage permissions
                          </button>
                          <IconActionButton
                            action="delete"
                            onClick={() => {
                              setErrorMessage("");
                              setRoleToDelete(role);
                            }}
                            title="Delete role"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {selectedRole && settings && (
        <div
          className="modal-overlay"
          onClick={() => savingRole === null && closePermissions()}
        >
          <section
            aria-labelledby="role-permissions-title"
            aria-modal="true"
            className="modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            style={{ maxWidth: "1000px", width: "calc(100% - 32px)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
          >
            <header className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
              <div>
                <h2 className="modal-title" id="role-permissions-title">
                  {selectedRole.name} permissions
                </h2>
                <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "12px" }}>
                  Unchecked actions are denied. Dashboard data remains a read-only summary.
                </p>
              </div>
              <button
                type="button"
                className="erp-btn erp-btn--secondary"
                onClick={closePermissions}
                disabled={savingRole !== null}
                aria-label="Close permissions"
              >
                Close
              </button>
            </header>

            <div className="modal-body" style={{ overflowY: "auto" }}>
              {errorMessage && (
                <div className="erp-alert erp-alert--danger" role="alert" style={{ marginBottom: "12px" }}>
                  {errorMessage}
                </div>
              )}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "12px",
                }}
              >
                {settings.modules.map((moduleName) => (
                  <fieldset
                    key={moduleName}
                    style={{
                      minWidth: 0,
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                  >
                    <legend style={{ padding: "0 4px", fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                      {moduleLabels[moduleName] ?? moduleName}
                    </legend>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {settings.actions.map((action) => {
                        const isChecked = (permissionsDraft?.[moduleName] ?? []).includes(action);
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
                                  selectedRole.role,
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
                  </fieldset>
                ))}
              </div>
            </div>

            <footer className="modal-footer">
              <button
                type="button"
                className="erp-btn erp-btn--secondary"
                onClick={closePermissions}
                disabled={savingRole !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className="erp-btn erp-btn--primary"
                disabled={savingRole !== null}
                onClick={() =>
                  void savePermissions({
                    role: selectedRole.role,
                    name: selectedRole.name,
                    permissions: permissionsDraft ?? selectedRole.permissions,
                  })
                }
              >
                {savingRole === selectedRole.role ? "Saving..." : "Save permissions"}
              </button>
            </footer>
          </section>
        </div>
      )}

      {roleDialog && (
        <div
          className="modal-overlay"
          onClick={() => !savingRoleDefinition && setRoleDialog(null)}
        >
          <form
            aria-labelledby="role-form-title"
            aria-modal="true"
            className="modal"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              void saveRoleDefinition();
            }}
            role="dialog"
          >
            <div className="modal-header">
              <h2 className="modal-title" id="role-form-title">
                {roleDialog.role ? "Edit role" : "Create role"}
              </h2>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label" htmlFor="role-name">Role name</label>
                <input
                  autoFocus
                  className="form-input"
                  id="role-name"
                  maxLength={60}
                  minLength={2}
                  onChange={(event) => setRoleNameDraft(event.target.value)}
                  required
                  value={roleNameDraft}
                />
              </div>
              {roleDialog.role && (
                <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: "12px" }}>
                  Renaming keeps existing user assignments and permissions.
                </p>
              )}
              {errorMessage && (
                <div className="erp-alert erp-alert--danger" role="alert" style={{ marginTop: "12px" }}>
                  {errorMessage}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="erp-btn erp-btn--secondary"
                disabled={savingRoleDefinition}
                onClick={() => setRoleDialog(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="erp-btn erp-btn--primary"
                disabled={savingRoleDefinition}
                type="submit"
              >
                {savingRoleDefinition ? "Saving..." : "Save role"}
              </button>
            </div>
          </form>
        </div>
      )}

      {roleToDelete && (
        <div
          className="modal-overlay"
          onClick={() => !deletingRole && setRoleToDelete(null)}
        >
          <section
            aria-describedby="delete-role-description"
            aria-labelledby="delete-role-title"
            aria-modal="true"
            className="modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-header">
              <h2 className="modal-title" id="delete-role-title">Delete role?</h2>
            </div>
            <div className="modal-body">
              <p id="delete-role-description">
                Permanently delete the {roleToDelete.name} role? Roles assigned to users cannot be deleted.
              </p>
              {errorMessage && (
                <div className="erp-alert erp-alert--danger" role="alert">
                  {errorMessage}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="erp-btn erp-btn--secondary"
                disabled={deletingRole}
                onClick={() => setRoleToDelete(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="erp-btn erp-btn--secondary"
                disabled={deletingRole}
                onClick={() => void removeRole()}
                type="button"
              >
                <TrashIcon size={16} />
                {deletingRole ? "Deleting..." : "Delete role"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
