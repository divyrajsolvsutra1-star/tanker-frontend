import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import ErpPageHeader from "@/components/common/ErpPageHeader";
import ErpStatsGrid, { type StatItem } from "@/components/common/ErpStatsGrid";
import ErpToolbar from "@/components/common/ErpToolbar";
import ErpDrawer from "@/components/common/ErpDrawer";
import ErpSelect, { type SelectOption } from "@/components/common/ErpSelect";
import ErpStatusBadge from "@/components/common/ErpStatusBadge";
import DataTable from "@/components/common/DataTable";
import { PlusIcon, RefreshIcon, UsersIcon } from "@/components/common/Icons";
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

const roleOptions: SelectOption[] = [
  { value: "owner_admin", label: "Owner / Admin" },
  { value: "manager", label: "Manager" },
  { value: "entry_operator", label: "Entry Operator" },
  { value: "accountant", label: "Accountant" },
  { value: "washer", label: "Washer / Employee" },
];

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("entry_operator");
  const [search, setSearch] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activationUrl, setActivationUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
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
    void loadUsers();
  }, [loadUsers]);

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
      setRole("entry_operator");
      await loadUsers();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Could not create invitation.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (roleLabels[u.role] || "").toLowerCase().includes(q),
    );
  }, [users, search]);

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
        <span className="erp-type-badge">{roleLabels[u.role] || u.role}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (u: UserRecord) => (
        <ErpStatusBadge status={u.status || "active"} />
      ),
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
              <RefreshIcon size={14} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              className="erp-btn erp-btn--primary"
              onClick={() => {
                setActivationUrl("");
                setErrorMessage("");
                setIsDrawerOpen(true);
              }}
            >
              <PlusIcon size={14} />
              <span>Invite Staff</span>
            </button>
          </div>
        }
      />

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
            <div className="erp-field-group erp-field-group--full">
              <label htmlFor="invite-name">
                Full Name <span className="erp-required-star">*</span>
              </label>
              <input
                id="invite-name"
                className="erp-input"
                maxLength={100}
                minLength={2}
                placeholder="e.g. Ramesh Patel"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="erp-field-group erp-field-group--full">
              <label htmlFor="invite-email">
                Work Email <span className="erp-required-star">*</span>
              </label>
              <input
                id="invite-email"
                type="email"
                className="erp-input"
                autoComplete="off"
                placeholder="e.g. ramesh@tanker.local"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="erp-field-group erp-field-group--full">
              <label htmlFor="invite-role">
                Assigned Role <span className="erp-required-star">*</span>
              </label>
              <ErpSelect
                id="invite-role"
                value={role}
                options={roleOptions}
                placeholder="Select role permissions..."
                onChange={(val) => setRole(val as UserRole)}
              />
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
    </div>
  );
}
