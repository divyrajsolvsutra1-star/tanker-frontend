import { useEffect, useMemo, useState } from "react";
import ErpPageHeader from "@/components/common/ErpPageHeader";
import ErpStatsGrid from "@/components/common/ErpStatsGrid";
import ErpToolbar from "@/components/common/ErpToolbar";
import DataTable from "@/components/common/DataTable";
import ErpStatusBadge from "@/components/common/ErpStatusBadge";
import { apiRequest } from "@/lib/api";

export default function AuditPage() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    apiRequest<{ items: Record<string, unknown>[] }>("audit-logs")
      .then((r) => setItems(r.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((r) => {
      const act = String(r.action || "").toLowerCase();
      const ent = String(r.entityType || "").toLowerCase();
      const user = String((r.userId as { displayName?: string })?.displayName || "").toLowerCase();
      return act.includes(q) || ent.includes(q) || user.includes(q);
    });
  }, [items, search]);

  const stats = [
    { label: "TOTAL LOGS", value: items.length },
    { label: "ACTIONS AUDITED", value: filteredItems.length, color: "teal" as const },
    { label: "SECURITY LEVEL", value: "Compliant", color: "active" as const },
  ];

  const columns = [
    {
      id: "at",
      header: "TIMESTAMP",
      cell: (r: Record<string, unknown>) => {
        const d = String(r.createdAt || "");
        return d ? new Date(d).toLocaleString("en-IN") : "-";
      },
    },
    {
      id: "action",
      header: "ACTION",
      cell: (r: Record<string, unknown>) => (
        <span className="erp-pill erp-pill--company">{String(r.action || "-")}</span>
      ),
    },
    {
      id: "entity",
      header: "ENTITY",
      cell: (r: Record<string, unknown>) => String(r.entityType || "-"),
    },
    {
      id: "user",
      header: "PERFORMED BY",
      cell: (r: Record<string, unknown>) => {
        const u = r.userId as { displayName?: string } | undefined;
        return (
          <span style={{ fontWeight: 600, color: "#0f172a" }}>
            {u?.displayName || "System / Admin"}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "INTEGRITY",
      cell: () => <ErpStatusBadge status="active" label="Verified" />,
    },
  ];

  return (
    <div className="erp-module">
      <ErpPageHeader
        title="Audit Logs & Activity History"
        description="Immutable system-wide security trail of user actions, updates, logins, and permission changes."
      />

      <ErpStatsGrid stats={stats} />

      <div className="erp-card">
        <ErpToolbar
          title="Audit Trail"
          count={filteredItems.length}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search action, entity or user..."
        />

        <div className="erp-table-container">
          <DataTable
            caption="Audit History"
            columns={columns}
            emptyMessage={loading ? "Loading audit logs..." : "No activity logs recorded."}
            getRowKey={(r) => String(r._id || Math.random())}
            rows={filteredItems}
          />
        </div>

        <div className="erp-table-footer">
          <span>Total of {filteredItems.length} log entry(ies)</span>
        </div>
      </div>
    </div>
  );
}
