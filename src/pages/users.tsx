import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import ErpPageHeader from "@/components/common/ErpPageHeader";
import ErpStatsGrid, { type StatItem } from "@/components/common/ErpStatsGrid";
import ErpToolbar from "@/components/common/ErpToolbar";
import ErpDrawer from "@/components/common/ErpDrawer";
import ErpSelect, { type SelectOption } from "@/components/common/ErpSelect";
import ErpStatusBadge from "@/components/common/ErpStatusBadge";
import DataTable from "@/components/common/DataTable";
import IconActionButton from "@/components/common/IconActionButton";
import {
  CheckCircleIcon,
  PlusIcon,
  RefreshIcon,
} from "@/components/common/Icons";
import {
  activateUserAccount,
  ApiError,
  deleteUserAccount,
  getRolePermissions,
  getUsers,
  inviteUser,
  updateUserRole,
} from "@/lib/api";
import type { RolePermissionSet, UserRecord, UserRole } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<RolePermissionSet[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activationUrl, setActivationUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<UserRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [roleUser, setRoleUser] = useState<UserRecord | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [activationUser, setActivationUser] = useState<UserRecord | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [activationError, setActivationError] = useState("");
  const [isActivating, setIsActivating] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const [result, roleResult] = await Promise.all([
        getUsers(),
        getRolePermissions(),
      ]);
      setUsers(result.users);
      setRoles(roleResult.roles);
      setRole((current) =>
        current && roleResult.roles.some((item) => item.role === current)
          ? current
          : roleResult.roles[0]?.role ?? "",
      );
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
    void Promise.resolve().then(loadUsers);
  }, [loadUsers]);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setActivationUrl("");

    const errors: Record<string, string> = {};
    if (!displayName.trim()) {
      errors.displayName = "Full name is required. Please fill this field.";
    }
    if (!email.trim()) {
      errors.email = "Work email is required. Please fill this field.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid work email address.";
    }
    if (!role) {
      errors.role = "Role is required. Please select an authorization role.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage("Please fill in all required fields marked with * before creating an invitation.");
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const result = await inviteUser({ displayName, email, role });
      setActivationUrl(result.activationUrl);
      setDisplayName("");
      setEmail("");
      setRole(roles[0]?.role ?? "");
      await loadUsers();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Could not create invitation.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteUser() {
    if (!pendingDeleteUser) return;
    setIsDeleting(true);
    setDeleteErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteUserAccount(pendingDeleteUser.id);
      setSuccessMessage(`${pendingDeleteUser.displayName} was deleted.`);
      setPendingDeleteUser(null);
      await loadUsers();
    } catch (error) {
      setDeleteErrorMessage(
        error instanceof ApiError ? error.message : "Could not delete user.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleChangeRole() {
    if (!roleUser || !selectedRole) return;
    setIsUpdatingRole(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const result = await updateUserRole(roleUser.id, selectedRole);
      setUsers((current) =>
        current.map((item) => item.id === roleUser.id ? result.user : item),
      );
      setSuccessMessage(`${roleUser.displayName}'s role was updated.`);
      setRoleUser(null);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Could not update user role.",
      );
    } finally {
      setIsUpdatingRole(false);
    }
  }

  async function handleActivateUser() {
    if (!activationUser) return;
    setIsActivating(true);
    setActivationError("");
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const result = await activateUserAccount(
        activationUser.id,
        temporaryPassword,
      );
      setUsers((current) =>
        current.map((item) => item.id === activationUser.id ? result.user : item),
      );
      setSuccessMessage(
        `${activationUser.displayName} is active. They must change the temporary password at sign-in.`,
      );
      setActivationUser(null);
      setTemporaryPassword("");
    } catch (error) {
      setActivationError(
        error instanceof ApiError ? error.message : "Could not activate user.",
      );
    } finally {
      setIsActivating(false);
    }
  }

  const roleOptions: SelectOption[] = [
    { value: "owner_admin", label: "Owner / Admin" },
    ...roles.map((item) => ({ value: item.role, label: item.name })),
  ];

  const roleName = useCallback(
    (roleId: UserRole) =>
      roleId === "owner_admin"
        ? "Owner / Admin"
        : roles.find((item) => item.role === roleId)?.name ?? roleId,
    [roles],
  );

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        roleName(u.role).toLowerCase().includes(q),
    );
  }, [users, search, roleName]);

  // Summary stats
  const stats: StatItem[] = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === "active").length;
    const invited = users.filter((u) => u.status !== "active").length;
    return [
      { label: "TOTAL ACCOUNTS", value: total },
      { label: "ACTIVE USERS", value: active, highlight: true },
      { label: "PENDING INVITATIONS", value: invited },
    ];
  }, [users]);

  const columns = [
    {
      id: "name",
      header: "Staff Name",
      cell: (u: UserRecord) => (
        <span style={{ fontWeight: 600, color: "#0f172a" }}>{u.displayName}</span>
      ),
    },
    {
      id: "email",
      header: "Email Address",
      cell: (u: UserRecord) => (
        <span style={{ color: "#475569" }}>{u.email}</span>
      ),
    },
    {
      id: "role",
      header: "Assigned Role",
      cell: (u: UserRecord) => (
        <span className="erp-type-badge">{roleName(u.role)}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (u: UserRecord) => (
        <ErpStatusBadge status={u.status || "active"} />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (u: UserRecord) => {
        const canActivate = u.status === "invited" || u.status === "disabled";
        return (
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
            <IconActionButton
              action="edit"
              title="Change user role"
              disabled={isUpdatingRole}
              onClick={() => {
                setErrorMessage("");
                setSelectedRole(u.role);
                setRoleUser(u);
              }}
            />
            {canActivate && (
              <button
                type="button"
                className="erp-btn erp-btn--secondary"
                disabled={isActivating}
                onClick={() => {
                  setActivationError("");
                  setTemporaryPassword("");
                  setActivationUser(u);
                }}
                title="Activate user account"
              >
                <CheckCircleIcon size={16} />
                Activate
              </button>
            )}
            <IconActionButton
              action="delete"
              title={u.id === user?.id ? "You cannot delete your own account." : "Delete user account"}
              disabled={u.id === user?.id || isDeleting}
              onClick={() => {
                setDeleteErrorMessage("");
                setPendingDeleteUser(u);
              }}
            />
          </div>
        );
      },
    },
  ];

  if (user?.role !== "owner_admin") {
    return (
      <div className="erp-module">
        <div className="erp-card" style={{ padding: "32px", textAlign: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Access Restricted</h2>
          <p style={{ color: "#64748b", margin: "8px 0 0" }}>
            Only Owner / Admin users have permission to manage staff accounts and invitations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="erp-module">
      <ErpPageHeader
        title="User & Staff Accounts"
        description="Invite terminal operators, accountants and managers with role-based access control."
        actions={
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="erp-btn erp-btn--secondary"
              onClick={() => void loadUsers()}
              disabled={isLoading}
            >
              <RefreshIcon size={16} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              className="erp-btn erp-btn--primary"
              onClick={() => {
                setActivationUrl("");
                setErrorMessage("");
                setFieldErrors({});
                setIsDrawerOpen(true);
              }}
            >
              <PlusIcon size={16} />
              <span>Invite Staff</span>
            </button>
          </div>
        }
      />

      {successMessage && (
        <div className="erp-alert erp-alert--success" role="status" style={{ marginTop: "12px" }}>
          {successMessage}
        </div>
      )}
      {errorMessage && !isDrawerOpen && !roleUser && (
        <div className="erp-alert erp-alert--danger" role="alert">
          {errorMessage}
        </div>
      )}

      <ErpStatsGrid stats={stats} />

      {/* Main Table Card */}
      <div className="erp-card">
        <ErpToolbar
          title="Staff Directory"
          count={filteredUsers.length}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, email, or role..."
        />

        <div className="erp-table-container">
          <DataTable
            caption="Staff user accounts"
            columns={columns}
            emptyMessage={isLoading ? "Loading staff accounts..." : "No staff accounts found."}
            getRowKey={(row) => row.id}
            rows={filteredUsers}
          />
        </div>

        <div className="erp-table-footer">
          <span>Showing {filteredUsers.length} of {users.length} user accounts</span>
        </div>
      </div>

      {/* Invite User Slide-over Drawer */}
      <ErpDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Invite New Staff Member"
        subtitle="Invited staff will receive a one-time activation link to set their password."
      >
        <form className="erp-drawer-form" onSubmit={handleInvite}>
          <div className="erp-form-grid">
            <div className={`erp-field-group erp-field-group--full ${fieldErrors.displayName ? "erp-field-group--error" : ""}`}>
              <label htmlFor="invite-name">
                Full Name <span className="erp-required-star">*</span>
              </label>
              <input
                id="invite-name"
                className={`erp-input ${fieldErrors.displayName ? "erp-input--error" : ""}`}
                maxLength={100}
                minLength={2}
                placeholder="e.g. Ramesh Patel"
                required
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (fieldErrors.displayName) {
                    setFieldErrors((prev) => {
                      const n = { ...prev };
                      delete n.displayName;
                      return n;
                    });
                  }
                }}
              />
              {fieldErrors.displayName && (
                <span className="erp-field-error-msg">{fieldErrors.displayName}</span>
              )}
            </div>

            <div className={`erp-field-group erp-field-group--full ${fieldErrors.email ? "erp-field-group--error" : ""}`}>
              <label htmlFor="invite-email">
                Work Email <span className="erp-required-star">*</span>
              </label>
              <input
                id="invite-email"
                type="email"
                className={`erp-input ${fieldErrors.email ? "erp-input--error" : ""}`}
                autoComplete="off"
                placeholder="e.g. ramesh@tanker.local"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => {
                      const n = { ...prev };
                      delete n.email;
                      return n;
                    });
                  }
                }}
              />
              {fieldErrors.email && (
                <span className="erp-field-error-msg">{fieldErrors.email}</span>
              )}
            </div>

            <div className={`erp-field-group erp-field-group--full ${fieldErrors.role ? "erp-field-group--error" : ""}`}>
              <label htmlFor="invite-role">
                Assigned Role <span className="erp-required-star">*</span>
              </label>
              <ErpSelect
                id="invite-role"
                value={role}
                hasError={Boolean(fieldErrors.role)}
                options={roleOptions}
                placeholder="Select role permissions..."
                onChange={(val) => {
                  setRole(val as UserRole);
                  if (fieldErrors.role) {
                    setFieldErrors((prev) => {
                      const n = { ...prev };
                      delete n.role;
                      return n;
                    });
                  }
                }}
              />
              {fieldErrors.role && (
                <span className="erp-field-error-msg">{fieldErrors.role}</span>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="erp-alert erp-alert--danger" role="alert" style={{ marginTop: "12px" }}>
              {errorMessage}
            </div>
          )}
          {activationUrl && (
            <div
              className="erp-card"
              style={{
                marginTop: "16px",
                padding: "16px",
                background: "#f0fdfa",
                borderColor: "#99f6e4",
              }}
            >
              <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 700, color: "#0f766e" }}>
                Activation Link Generated:
              </p>
              <div
                style={{
                  wordBreak: "break-all",
                  background: "#ffffff",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ccfbf1",
                  fontSize: "12px",
                  color: "#0f766e",
                  fontWeight: 600,
                }}
              >
                {activationUrl}
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#64748b" }}>
                Share this secure link with the user. Valid for 24 hours.
              </p>
            </div>
          )}

          <div className="erp-drawer-actions">
            <button
              type="button"
              className="erp-btn erp-btn--secondary"
              onClick={() => setIsDrawerOpen(false)}
            >
              Close
            </button>
            <button
              type="submit"
              className="erp-btn erp-btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Invitation..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </ErpDrawer>

      {roleUser && (
        <div
          className="modal-overlay"
          onClick={() => !isUpdatingRole && setRoleUser(null)}
        >
          <section
            aria-labelledby="change-user-role-title"
            aria-modal="true"
            className="modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-header">
              <h2 className="modal-title" id="change-user-role-title">
                Change role for {roleUser.displayName}
              </h2>
            </div>
            <div className="modal-body">
              <label className="form-group">
                <span className="form-label">Role</span>
                <ErpSelect
                  value={selectedRole}
                  options={roleOptions}
                  onChange={setSelectedRole}
                  placeholder="Select role..."
                />
              </label>
              {errorMessage && (
                <div className="erp-alert erp-alert--danger" role="alert">
                  {errorMessage}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="erp-btn erp-btn--secondary"
                disabled={isUpdatingRole}
                onClick={() => setRoleUser(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="erp-btn erp-btn--primary"
                disabled={isUpdatingRole || selectedRole === roleUser.role}
                onClick={() => void handleChangeRole()}
                type="button"
              >
                {isUpdatingRole ? "Saving..." : "Save role"}
              </button>
            </div>
          </section>
        </div>
      )}

      {activationUser && (
        <div
          className="modal-overlay"
          onClick={() => !isActivating && setActivationUser(null)}
        >
          <section
            aria-labelledby="activate-user-title"
            aria-modal="true"
            className="modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-header">
              <h2 className="modal-title" id="activate-user-title">
                Activate {activationUser.displayName}
              </h2>
            </div>
            <div className="modal-body">
              <label className="form-group">
                <span className="form-label">Temporary password</span>
                <input
                  autoComplete="new-password"
                  className="form-input"
                  maxLength={128}
                  minLength={12}
                  onChange={(event) => setTemporaryPassword(event.target.value)}
                  required
                  type="password"
                  value={temporaryPassword}
                />
              </label>
              <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: "12px" }}>
                Share it securely. The user must change it at first sign-in.
              </p>
              {activationError && (
                <div className="erp-alert erp-alert--danger" role="alert" style={{ marginTop: "12px" }}>
                  {activationError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="erp-btn erp-btn--secondary"
                disabled={isActivating}
                onClick={() => setActivationUser(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="erp-btn erp-btn--primary"
                disabled={isActivating || temporaryPassword.length < 12}
                onClick={() => void handleActivateUser()}
                type="button"
              >
                {isActivating ? "Activating..." : "Activate account"}
              </button>
            </div>
          </section>
        </div>
      )}

      {pendingDeleteUser && (
        <div
          className="modal-overlay"
          onClick={() => !isDeleting && setPendingDeleteUser(null)}
        >
          <div
            aria-describedby="delete-user-description"
            aria-labelledby="delete-user-title"
            aria-modal="true"
            className="modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-header">
              <h2 className="modal-title" id="delete-user-title">
                Delete user account?
              </h2>
            </div>
            <div className="modal-body">
              <p id="delete-user-description">
                Permanently delete {pendingDeleteUser.displayName} ({pendingDeleteUser.email})?
                Their active sessions will be revoked.
              </p>
              {deleteErrorMessage && (
                <div className="erp-alert erp-alert--danger" role="alert">
                  {deleteErrorMessage}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                disabled={isDeleting}
                onClick={() => setPendingDeleteUser(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                disabled={isDeleting}
                onClick={() => void handleDeleteUser()}
                type="button"
              >
                {isDeleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
