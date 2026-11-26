import { useState } from "react";
import ErpPageHeader from "@/components/common/ErpPageHeader";
import ErpStatsGrid from "@/components/common/ErpStatsGrid";
import ErpDatePicker from "@/components/common/ErpDatePicker";
import { apiRequest } from "@/lib/api";

export default function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (from) q.set("from", from);
      if (to) q.set("to", to);
      const data = await apiRequest<Record<string, unknown>>(
        `reports/wash${q.size ? "?" + q.toString() : ""}`
      );
      setReport(data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  async function exportCsv() {
    const items = (report?.items as Record<string, unknown>[] | undefined) || [];
    const rows = [
      "Entry,Vehicle,Charge,Status",
      ...items.map((r) => {
        const vehicle =
          typeof r.vehicleId === "object" && r.vehicleId
            ? (r.vehicleId as { vehicleNumber: string }).vehicleNumber
            : "";
        return `${String(r.entryNumber || "")},${vehicle},${Number(r.savedRate || 0)},${String(
          r.status || ""
        )}`;
      }),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wash-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const totals = report?.totals as { count?: number; amount?: number } | undefined;
  const countVal = totals?.count || 0;
  const amountVal = totals?.amount || 0;

  const stats = [
    { label: "WASH ENTRIES REPORTED", value: countVal, color: "teal" as const },
    {
      label: "TOTAL REVENUE",
      value: `₹ ${amountVal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
      color: "active" as const,
    },
    { label: "EXPORT STATUS", value: report ? "Ready" : "Select Date", color: "default" as const },
  ];

  return (
    <div className="erp-module">
      <ErpPageHeader
        title="Reports & Analytics"
        description="Generate filtered wash turnover statements, billing audits, and export to Excel/CSV."
      />

      <ErpStatsGrid stats={stats} />

      <div className="erp-card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px", color: "#0f172a" }}>
          Filter Report Period
        </h3>
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="erp-field-group" style={{ minWidth: "220px" }}>
            <label>Start Date</label>
            <ErpDatePicker
              type="date"
              value={from}
              onChange={setFrom}
              placeholder="Pick start date..."
            />
          </div>

          <div className="erp-field-group" style={{ minWidth: "220px" }}>
            <label>End Date</label>
            <ErpDatePicker
              type="date"
              value={to}
              onChange={setTo}
              placeholder="Pick end date..."
            />
          </div>

          <button
            type="button"
            className="erp-btn erp-btn--primary"
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Wash Report"}
          </button>

          <button
            type="button"
            className="erp-btn erp-btn--secondary"
            disabled={!report}
            onClick={() => void exportCsv()}
          >
            Export to CSV
          </button>
        </div>
      </div>

      {report ? (
        <div className="erp-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>
                Statement Summary
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Period: {from || "All Time"} to {to || "Present"}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", display: "block" }}>
                Total Generated Amount
              </span>
              <strong style={{ fontSize: "24px", color: "#0f766e" }}>
                ₹ {amountVal.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
