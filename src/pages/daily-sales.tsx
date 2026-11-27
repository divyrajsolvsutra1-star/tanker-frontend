import { useEffect, useMemo, useState } from "react";
import ErpPageHeader from "@/components/common/ErpPageHeader";
import ErpStatsGrid from "@/components/common/ErpStatsGrid";
import ErpToolbar from "@/components/common/ErpToolbar";
import DataTable from "@/components/common/DataTable";
import ErpStatusBadge from "@/components/common/ErpStatusBadge";
import { getBusinessResource } from "@/lib/api";

export default function DailySalesPage() {
  const [entries, setEntries] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadDailySales() {
      setLoading(true);
      try {
        const res = await getBusinessResource<Record<string, unknown>>("wash-entries", {
          limit: 100,
        });
        setEntries("items" in res ? res.items : []);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    }
    void loadDailySales();
  }, []);

  const filteredEntries = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter((item) => {
      const vNum = String(item.vehicleNumber || "").toLowerCase();
      const cName = String((item.customer as { name?: string })?.name || "").toLowerCase();
      const wType = String((item.washType as { name?: string })?.name || "").toLowerCase();
      return vNum.includes(q) || cName.includes(q) || wType.includes(q);
    });
  }, [entries, search]);

  const totalSales = useMemo(() => {
    return entries.reduce((acc, r) => acc + Number(r.rate || r.amount || 0), 0);
  }, [entries]);

  const completedCount = useMemo(() => {
    return entries.filter((r) => String(r.status).toLowerCase() === "completed").length;
  }, [entries]);

  const stats = [
    { label: "TODAY'S ENTRIES", value: entries.length },
    { label: "COMPLETED WASHES", value: completedCount, color: "active" as const },
    {
      label: "TOTAL SALES VALUE",
      value: `₹ ${totalSales.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
      color: "teal" as const,
    },
  ];

  const columns = [
    {
      id: "date",
      header: "DATE / TIME",
      cell: (row: Record<string, unknown>) => {
        const d = String(row.createdAt || row.date || "");
        return d ? new Date(d).toLocaleDateString("en-IN") : "-";
      },
    },
    {
      id: "vehicle",
      header: "VEHICLE NO",
      cell: (row: Record<string, unknown>) => String(row.vehicleNumber || "-"),
    },
    {
      id: "customer",
      header: "CUSTOMER",
      cell: (row: Record<string, unknown>) => {
        const c = row.customer as { name?: string } | undefined;
        return c?.name || String(row.customerId || "-");
      },
    },
    {
      id: "washType",
      header: "WASH TYPE",
      cell: (row: Record<string, unknown>) => {
        const w = row.washType as { name?: string } | undefined;
        return <ErpStatusBadge status={w?.name || "—"} type="pill" />;
      },
    },
    {
      id: "rate",
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
      cell: (row: Record<string, unknown>) => (
        <ErpStatusBadge status={String(row.status || "—")} />
      ),
    },
  ];

  return (
    <div className="erp-module">
      <ErpPageHeader
        title="Daily Sales & Wash Register"
        description="Real-time daily tanker wash billing, counter collection, and vehicle turnover."
      />

      <ErpStatsGrid stats={stats} />

      <div className="erp-card">
        <ErpToolbar
          title="Daily Sales Register"
          count={filteredEntries.length}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search vehicle, customer, or wash type..."
        />

        <div className="erp-table-container">
          <DataTable
            caption="Daily Sales Register"
            columns={columns}
            emptyMessage={loading ? "Loading daily sales..." : "No sales entries recorded today."}
            getRowKey={(row) => String(row._id || Math.random())}
            rows={filteredEntries}
          />
        </div>

        <div className="erp-table-footer">
          <span>Total of {filteredEntries.length} line(s)</span>
          <span className="erp-cell-number">
            Net Sales: ₹ {totalSales.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </div>
  );
}
