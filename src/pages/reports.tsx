import { useEffect, useState } from "react";
import ErpPageHeader from "@/components/common/ErpPageHeader";
import ErpStatsGrid from "@/components/common/ErpStatsGrid";
import ErpDatePicker from "@/components/common/ErpDatePicker";
import ErpSelect from "@/components/common/ErpSelect";
import { DownloadIcon, PrintIcon } from "@/components/common/Icons";
import { apiRequest } from "@/lib/api";

const REPORT_OPTIONS = [
  { value: "reports/wash", label: "Wash Operations Daily / Date-to-Date Report" },
  { value: "reports/wash-type-wise", label: "Wash Type-wise Volume & Revenue Summary" },
  { value: "reports/customer-wise", label: "Customer-wise Turnover & Outstanding Report" },
  { value: "reports/trial-balance", label: "Accounting: Trial Balance" },
  { value: "reports/profit-loss", label: "Accounting: Profit & Loss Statement" },
  { value: "reports/balance-sheet", label: "Accounting: Balance Sheet" },
  { value: "reports/day-book", label: "Accounting: Day Book Register" },
  { value: "reports/cash-book", label: "Financial: Cash Book" },
  { value: "reports/bank-book", label: "Financial: Bank Book" },
  { value: "reports/expenses", label: "Management: Operating Expense Report" },
  { value: "reports/salary", label: "Management: Monthly Salary Register" },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState("reports/wash");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadReport() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (from) q.set("from", from);
      if (to) q.set("to", to);
      const res = await apiRequest<Record<string, unknown>>(
        `${selectedReport}${q.size ? "?" + q.toString() : ""}`
      );
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReport();
  }, [selectedReport]);

  function exportCSV() {
    if (!data) return;
    let rows: string[] = [];

    if (Array.isArray(data.items)) {
      const items = data.items as Record<string, unknown>[];
      rows = [
        "Entry,Customer,Vehicle,WashType,Rate,PaymentType,Status,Date",
        ...items.map((r) => {
          const cust = typeof r.customerId === "object" && r.customerId ? (r.customerId as { name: string }).name : "";
          const veh = typeof r.vehicleId === "object" && r.vehicleId ? (r.vehicleId as { vehicleNumber: string }).vehicleNumber : "";
          const wt = typeof r.washTypeId === "object" && r.washTypeId ? (r.washTypeId as { name: string }).name : "";
          return `"${r.entryNumber || ""}","${cust}","${veh}","${wt}",${r.savedRate || 0},"${r.paymentType || ""}","${r.status || ""}","${r.entryDate || ""}"`;
        }),
      ];
    } else if (Array.isArray(data.lines)) {
      const lines = data.lines as Record<string, unknown>[];
      if (lines.length > 0) {
        const headers = Object.keys(lines[0]);
        rows = [
          headers.join(","),
          ...lines.map((l) => headers.map((h) => `"${String(l[h] ?? "")}"`).join(",")),
        ];
      }
    } else if (Array.isArray(data.byWashType)) {
      const items = data.byWashType as Record<string, unknown>[];
      rows = [
        "WashType,Count,TotalAmount,AvgAmount,Immediate,Credit",
        ...items.map((i) => `"${i.washType}",${i.count},${i.totalAmount},${i.avgAmount},${i.immediate},${i.credit}`),
      ];
    } else {
      rows = [JSON.stringify(data, null, 2)];
    }

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedReport.replace("/", "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printReport() {
    window.print();
  }

  const stats = [
    { label: "SELECTED REPORT", value: selectedReport.split("/")[1].toUpperCase(), color: "teal" as const },
    {
      label: "STATUS",
      value: loading ? "Loading" : data ? "Ready" : "No data",
      color: data ? ("active" as const) : ("default" as const),
    },
    { label: "TOTAL REPORTS AVAILABLE", value: REPORT_OPTIONS.length, color: "default" as const },
  ];

  return (
    <div className="erp-module">
      <ErpPageHeader
        title="Reports & Financial Statements"
        description="Comprehensive daily, monthly, and accounting reports with multi-format export (Excel CSV, HTML, Print)."
      />

      <ErpStatsGrid stats={stats} />

      <div className="erp-card" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px", color: "#0f172a" }}>
          Select Report & Filter Period
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", alignItems: "flex-end" }}>
          <div className="erp-field-group">
            <label>Report Type*</label>
            <ErpSelect
              value={selectedReport}
              options={REPORT_OPTIONS}
              onChange={(val) => setSelectedReport(val)}
            />
          </div>

          <div className="erp-field-group">
            <label>From Date</label>
            <ErpDatePicker type="date" value={from} onChange={setFrom} />
          </div>

          <div className="erp-field-group">
            <label>To Date</label>
            <ErpDatePicker type="date" value={to} onChange={setTo} />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="erp-btn erp-btn--primary"
              style={{ flex: 1 }}
              onClick={() => void loadReport()}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate"}
            </button>
            <button
              type="button"
              className="erp-btn erp-btn--secondary"
              onClick={exportCSV}
              disabled={!data}
              title="Download Excel / CSV"
            >
              <DownloadIcon size={14} /> CSV
            </button>
            <button
              type="button"
              className="erp-btn erp-btn--secondary"
              onClick={printReport}
              disabled={!data}
              title="Print Report"
            >
              <PrintIcon size={14} /> Print
            </button>
          </div>
        </div>
      </div>

      {/* Report Data Display */}
      <div className="erp-card" style={{ padding: "24px", marginTop: "20px" }}>
        {loading ? (
          <p style={{ color: "#64748b", margin: 0 }}>Generating report...</p>
        ) : !data ? (
          <p style={{ color: "#64748b", margin: 0 }}>No records found for the selected period.</p>
        ) : (
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>
              {String(data.report || selectedReport.split("/")[1].toUpperCase())}
            </h3>

            {/* Trial Balance / Lines Display */}
            {Array.isArray(data.lines) && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #cbd5e1" }}>
                      <th style={{ padding: "10px", textAlign: "left" }}>Code</th>
                      <th style={{ padding: "10px", textAlign: "left" }}>Account / Description</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Debit (₹)</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Credit (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.lines as Record<string, unknown>[]).map((l, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "10px" }}>{String(l.code || l.voucherNumber || "")}</td>
                        <td style={{ padding: "10px", fontWeight: 600 }}>{String(l.name || l.narration || l.accountName || "")}</td>
                        <td style={{ padding: "10px", textAlign: "right", color: Number(l.debit) > 0 ? "#b91c1c" : "#64748b" }}>
                          {Number(l.debit) > 0 ? `₹ ${Number(l.debit).toLocaleString("en-IN")}` : "-"}
                        </td>
                        <td style={{ padding: "10px", textAlign: "right", color: Number(l.credit) > 0 ? "#0f766e" : "#64748b" }}>
                          {Number(l.credit) > 0 ? `₹ ${Number(l.credit).toLocaleString("en-IN")}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {typeof data.totalDebit === "number" && (
                    <tfoot>
                      <tr style={{ background: "#f1f5f9", fontWeight: "bold" }}>
                        <td colSpan={2} style={{ padding: "12px 10px" }}>TOTAL</td>
                        <td style={{ padding: "12px 10px", textAlign: "right" }}>
                          ₹ {Number(data.totalDebit).toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "right" }}>
                          ₹ {Number(data.totalCredit).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* Wash Items Display */}
            {Array.isArray(data.items) && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #cbd5e1" }}>
                      <th style={{ padding: "10px", textAlign: "left" }}>Slip No</th>
                      <th style={{ padding: "10px", textAlign: "left" }}>Customer</th>
                      <th style={{ padding: "10px", textAlign: "left" }}>Vehicle</th>
                      <th style={{ padding: "10px", textAlign: "left" }}>Service</th>
                      <th style={{ padding: "10px", textAlign: "left" }}>Payment</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.items as Record<string, unknown>[]).map((item, i) => {
                      const c = item.customerId as { name?: string } | undefined;
                      const v = item.vehicleId as { vehicleNumber?: string } | undefined;
                      const w = item.washTypeId as { name?: string } | undefined;
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td style={{ padding: "10px", fontWeight: 700 }}>#{String(item.entryNumber)}</td>
                          <td style={{ padding: "10px" }}>{c?.name || "-"}</td>
                          <td style={{ padding: "10px" }}>{v?.vehicleNumber || "-"}</td>
                          <td style={{ padding: "10px" }}>{w?.name || "-"}</td>
                          <td style={{ padding: "10px" }}>{String(item.paymentType).toUpperCase()}</td>
                          <td style={{ padding: "10px", textAlign: "right", fontWeight: 600, color: "#0f766e" }}>
                            ₹ {Number(item.savedRate || 0).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {Boolean(data.totals && typeof (data.totals as { amount?: number }).amount === "number") && (
                    <tfoot>
                      <tr style={{ background: "#f1f5f9", fontWeight: "bold" }}>
                        <td colSpan={5} style={{ padding: "12px 10px" }}>
                          TOTAL ({(data.totals as { count?: number }).count} washes)
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "right", color: "#0f766e" }}>
                          ₹ {Number((data.totals as { amount?: number }).amount).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* Wash Type Breakdown Display */}
            {Array.isArray(data.byWashType) && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #cbd5e1" }}>
                      <th style={{ padding: "10px", textAlign: "left" }}>Wash Service</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Vehicles Washed</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Immediate Payment</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Credit Washes</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Total Revenue (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.byWashType as Record<string, unknown>[]).map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "10px", fontWeight: 700 }}>{String(row.washType)}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{Number(row.count)}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{Number(row.immediate)}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{Number(row.credit)}</td>
                        <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: "#0f766e" }}>
                          ₹ {Number(row.totalAmount).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
