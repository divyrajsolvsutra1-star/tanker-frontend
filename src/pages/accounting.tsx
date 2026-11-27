import { useEffect, useState } from "react";
import ErpPageHeader from "@/components/common/ErpPageHeader";
import ErpStatsGrid from "@/components/common/ErpStatsGrid";
import ErpStatusBadge from "@/components/common/ErpStatusBadge";
import { apiRequest } from "@/lib/api";

interface AccountingData {
  accounts: Record<string, unknown>[];
  journals: Record<string, unknown>[];
}

export default function AccountingPage() {
  const [data, setData] = useState<AccountingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiRequest<AccountingData>("accounting")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const accountsCount = data?.accounts?.length || 0;
  const journalsCount = data?.journals?.length || 0;

  const stats = [
    { label: "CHART OF ACCOUNTS", value: accountsCount, color: "teal" as const },
    { label: "POSTED JOURNALS", value: journalsCount, color: "active" as const },
  ];

  return (
    <div className="erp-module">
      <ErpPageHeader
        title="Accounting & General Ledger"
        description="Double-entry chart of accounts, automatically balanced vouchers, and journal records."
      />

      <ErpStatsGrid stats={stats} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
        {/* Chart of Accounts */}
        <div className="erp-card">
          <div className="erp-table-toolbar">
            <span className="erp-toolbar-title">
              Chart of Accounts - <strong>{accountsCount}</strong>
            </span>
          </div>

          <div style={{ padding: "16px 20px" }}>
            {loading ? (
              <p style={{ color: "#64748b", fontSize: "13px" }}>Loading accounts...</p>
            ) : accountsCount === 0 ? (
              <p style={{ color: "#64748b", fontSize: "13px" }}>
                Accounts will appear automatically after the first posted transaction.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {data?.accounts.map((a) => (
                  <div
                    key={String(a._id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div>
                      <strong style={{ color: "#0f172a", fontSize: "13.5px", marginRight: "8px" }}>
                        {String(a.code)}
                      </strong>
                      <span style={{ color: "#334155", fontSize: "13px" }}>{String(a.name)}</span>
                    </div>
                    <ErpStatusBadge status={String(a.type || "—")} type="pill" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Posted Journals */}
        <div className="erp-card">
          <div className="erp-table-toolbar">
            <span className="erp-toolbar-title">
              Posted Journals - <strong>{journalsCount}</strong>
            </span>
          </div>

          <div style={{ padding: "16px 20px" }}>
            {loading ? (
              <p style={{ color: "#64748b", fontSize: "13px" }}>Loading journal vouchers...</p>
            ) : journalsCount === 0 ? (
              <p style={{ color: "#64748b", fontSize: "13px" }}>
                No balanced journal vouchers have been posted yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {data?.journals.map((j) => (
                  <div
                    key={String(j._id)}
                    style={{
                      padding: "10px 14px",
                      background: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <strong style={{ color: "#0f766e", fontSize: "13px" }}>
                        {String(j.voucherNumber)}
                      </strong>
                      <span className="erp-pill erp-pill--company">{String(j.voucherType)}</span>
                    </div>
                    <div style={{ color: "#64748b", fontSize: "12.5px" }}>
                      {String(j.narration || "—")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
