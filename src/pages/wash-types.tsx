import { useEffect, useState } from "react";
import ErpPageHeader from "@/components/common/ErpPageHeader";
import ErpStatsGrid from "@/components/common/ErpStatsGrid";
import ErpDrawer from "@/components/common/ErpDrawer";
import ErpStatusBadge from "@/components/common/ErpStatusBadge";
import DataTable from "@/components/common/DataTable";
import Button from "@/components/common/Button";
import IconActionButton from "@/components/common/IconActionButton";
import { RefreshIcon } from "@/components/common/Icons";
import { apiRequest, getBusinessResource } from "@/lib/api";

type WashType = {
  _id: string;
  name: string;
  description?: string;
  active: boolean;
  rates?: { customerId: string | { _id: string; name: string }; amount: number }[];
};

type Customer = {
  _id: string;
  name: string;
  customerType: string;
};

export default function WashTypesPage() {
  const [washTypes, setWashTypes] = useState<WashType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedType, setSelectedType] = useState<WashType | null>(null);
  const [rateInputs, setRateInputs] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [resWT, resCust] = await Promise.all([
        getBusinessResource<WashType>("wash-types", { limit: 100 }),
        getBusinessResource<Customer>("customers", { limit: 100 }),
      ]);
      setWashTypes("items" in resWT ? (resWT.items as WashType[]) : []);
      setCustomers("items" in resCust ? (resCust.items as Customer[]) : []);
    } catch {
      setErrorMsg("Failed to load wash types and rates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function openRateConfig(wt: WashType) {
    setSelectedType(wt);
    const existingRates: Record<string, number> = {};
    if (Array.isArray(wt.rates)) {
      wt.rates.forEach((r) => {
        const cid = typeof r.customerId === "object" && r.customerId ? r.customerId._id : String(r.customerId);
        if (cid) existingRates[cid] = r.amount;
      });
    }
    setRateInputs(existingRates);
    setSavedMsg("");
    setErrorMsg("");
  }

  async function saveRates() {
    if (!selectedType) return;
    setSaving(true);
    setErrorMsg("");
    try {
      const rates = Object.entries(rateInputs)
        .filter(([, amount]) => amount > 0)
        .map(([customerId, amount]) => ({ customerId, amount }));

      await apiRequest(`wash-types/${selectedType._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rates }),
      });

      setSavedMsg(`Custom rates saved for ${selectedType.name}`);
      await loadData();
      setSelectedType(null);
    } catch {
      setErrorMsg("Failed to save custom rates.");
    } finally {
      setSaving(false);
    }
  }

  const stats = [
    { label: "WASH SERVICES", value: washTypes.length, color: "teal" as const },
    {
      label: "ACTIVE SERVICES",
      value: washTypes.filter((w) => w.active).length,
      color: "active" as const,
    },
    { label: "COMPANIES CONFIGURED", value: customers.length, color: "default" as const },
  ];

  const columns = [
    {
      id: "name",
      header: "WASH SERVICE NAME",
      cell: (r: WashType) => <strong style={{ color: "#0f172a" }}>{r.name}</strong>,
    },
    {
      id: "description",
      header: "DESCRIPTION",
      cell: (r: WashType) => (
        <span style={{ color: "#475569" }}>{r.description || "—"}</span>
      ),
    },
    {
      id: "ratesCount",
      header: "COMPANY-WISE RATES",
      cell: (r: WashType) => {
        const count = Array.isArray(r.rates) ? r.rates.length : 0;
        return (
          <span className="erp-pill erp-pill--company">
            {count} Company Rate{count === 1 ? "" : "s"} Configured
          </span>
        );
      },
    },
    {
      id: "status",
      header: "STATUS",
      cell: (r: WashType) => (
        <ErpStatusBadge status={r.active ? "active" : "inactive"} label={r.active ? "ACTIVE" : "INACTIVE"} />
      ),
    },
    {
      id: "actions",
      header: "ACTIONS",
      align: "right" as const,
      cell: (r: WashType) => (
        <IconActionButton
          action="edit"
          title="Configure company rates"
          onClick={() => openRateConfig(r)}
        />
      ),
    },
  ];

  return (
    <div className="erp-module">
      <ErpPageHeader
        title="Wash Types & Company-wise Rate Management"
        description="Proposal Section 4.3: Configure Normal, Detergent, and Uria wash types with company-specific tariff rates."
        actions={
          <button type="button" className="erp-btn erp-btn--secondary" onClick={() => void loadData()}>
            <RefreshIcon size={14} /> Refresh
          </button>
        }
      />

      <ErpStatsGrid stats={stats} />

      {errorMsg ? (
        <div className="erp-alert erp-alert--error" role="alert">
          {errorMsg}
        </div>
      ) : null}
      {savedMsg ? (
        <div className="erp-alert erp-alert--success" role="status">
          {savedMsg}
        </div>
      ) : null}

      <div className="erp-card">
        <div className="erp-table-container">
          <DataTable
            caption="Wash Types"
            columns={columns}
            emptyMessage={loading ? "Loading wash types..." : "No wash services configured."}
            getRowKey={(r) => r._id}
            rows={washTypes}
          />
        </div>
      </div>

      {/* Company Rates Configuration Drawer */}
      <ErpDrawer
        isOpen={Boolean(selectedType)}
        onClose={() => setSelectedType(null)}
        title={`Configure Rates: ${selectedType?.name || ""}`}
        subtitle="Set different washing charges for each customer company as required by the business."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
            Enter the pre-agreed washing charge (₹) for each company. During check-in, the system will automatically fetch this rate.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "420px", overflowY: "auto" }}>
            {customers.map((c) => {
              const currentVal = rateInputs[c._id];
              return (
                <div
                  key={c._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                  }}
                >
                  <div>
                    <strong style={{ color: "#0f172a", fontSize: "13.5px" }}>{c.name}</strong>
                    <div style={{ color: "#64748b", fontSize: "11.5px" }}>
                      Type: {c.customerType.toUpperCase()}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "#64748b", fontSize: "13px", fontWeight: 600 }}>₹</span>
                    <input
                      type="number"
                      min="0"
                      className="erp-input"
                      style={{ width: "110px", padding: "6px 8px" }}
                      placeholder="Rate in ₹"
                      value={currentVal !== undefined ? currentVal : ""}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRateInputs((prev) => ({ ...prev, [c._id]: val }));
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="erp-drawer-footer" style={{ marginTop: "16px" }}>
            <button
              type="button"
              className="erp-btn erp-btn--secondary"
              onClick={() => setSelectedType(null)}
              disabled={saving}
            >
              Cancel
            </button>
            <Button
              type="button"
              onClick={() => void saveRates()}
              disabled={saving}
              className="erp-btn erp-btn--primary"
            >
              {saving ? "Saving Rates..." : "Save Company Rates"}
            </Button>
          </div>
        </div>
      </ErpDrawer>
    </div>
  );
}
