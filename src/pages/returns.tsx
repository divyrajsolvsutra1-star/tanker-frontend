import { useEffect, useMemo, useState } from "react";
import ErpPageHeader from "@/components/common/ErpPageHeader";
import ErpStatsGrid from "@/components/common/ErpStatsGrid";
import ErpToolbar from "@/components/common/ErpToolbar";
import DataTable from "@/components/common/DataTable";
import ErpStatusBadge from "@/components/common/ErpStatusBadge";
import { getBusinessResource } from "@/lib/api";

export default function ReturnsPage() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadCancelledEntries() {
      setLoading(true);
      try {
        const res = await getBusinessResource<Record<string, unknown>>("wash-entries", {
          limit: 100,
        });
        const list = ("items" in res ? res.items : []).filter(
          (r) => String(r.status).toLowerCase() === "cancelled" || String(r.status).toLowerCase() === "refunded"
        );
        setItems(list);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    void loadCancelledEntries();
  }, []);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((item) => {
      const vNum = String(item.vehicleNumber || "").toLowerCase();
      return vNum.includes(q);
    });
  }, [items, search]);

  const stats = [
    { label: "RETURN / CANCELLED", value: items.length },
    { label: "PROCESSED REFUNDS", value: 0, color: "active" as const },
    { label: "PENDING REVIEW", value: items.length, color: "inactive" as const },
  ];

  const columns = [
    {
      id: "date",
      header: "DATE",
      cell: (row: Record<string, unknown>) => {
        const d = String(row.createdAt || row.date || "");
        return d ? new Date(d).toLocaleDateString("en-IN") : "-";
      },
    },
    {
      id: "vehicle",
      header: "VEHICLE NUMBER",
      cell: (row: Record<string, unknown>) => String(row.vehicleNumber || "-"),
    },
    {
      id: "reason",
      header: "REASON / REMARK",
      cell: (row: Record<string, unknown>) => String(row.notes || row.remarks || "Cancelled by operator"),
    },
    {
      id: "amount",
      header: "AMOUNT",
      cell: (row: Record<string, unknown>) => (
        <span className="erp-cell-number">
          ₹ {Number(row.rate || row.amount || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      id: "status",
      header: "STATUS",
      cell: () => <ErpStatusBadge status="inactive" label="Cancelled" />,
    },
  ];

  return (
    <div className="erp-module">
      <ErpPageHeader
        title="Returns & Cancellations"
        description="Audit cancelled wash jobs, dispute adjustments and issued refunds."
      />

      <ErpStatsGrid stats={stats} />

      <div className="erp-card">
        <ErpToolbar
          title="Return & Cancelled Register"
          count={filteredItems.length}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search vehicle number..."
        />

        <div className="erp-table-container">
          <DataTable
            caption="Returns Register"
            columns={columns}
            emptyMessage={loading ? "Loading records..." : "No returns or cancelled washes recorded."}
            getRowKey={(row) => String(row._id || Math.random())}
            rows={filteredItems}
          />
        </div>

        <div className="erp-table-footer">
          <span>Total of {filteredItems.length} line(s)</span>
        </div>
      </div>
    </div>
  );
}
