import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import ErpPageHeader from "@/components/common/ErpPageHeader";
import ErpStatsGrid from "@/components/common/ErpStatsGrid";
import Button from "@/components/common/Button";
import ErpSelect from "@/components/common/ErpSelect";
import { ApiError, apiRequest, getBusinessResource } from "@/lib/api";

type Ledger = Record<string, unknown>;

export default function LedgerPage() {
  const [customers, setCustomers] = useState<Record<string, unknown>[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [payment, setPayment] = useState<Record<string, unknown>>({
    paymentMethod: "cash",
    amount: "",
    allocations: "",
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBusinessResource<Record<string, unknown>>("customers", { limit: 100 })
      .then((res) => {
        setCustomers("items" in res ? res.items : []);
      })
      .catch(() => {});
  }, []);

  async function load() {
    if (!customerId) return;
    setError("");
    setLoading(true);
    try {
      const data = await apiRequest<Ledger>(`ledger/${customerId}`);
      setLedger(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load ledger.");
    } finally {
      setLoading(false);
    }
  }

  async function receive(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaved("");
    try {
      const allocations = String(payment.allocations || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
        .map((v) => {
          const [p, amount] = v.split(":");
          return { washEntryId: p, amount: Number(amount) };
        });

      await apiRequest("ledger/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          amount: Number(payment.amount),
          paymentMethod: payment.paymentMethod,
          allocations,
          idempotencyKey: crypto.randomUUID(),
          bankAccountId: payment.bankAccountId || undefined,
        }),
      });
      setSaved("Payment recorded successfully.");
      setPayment({ paymentMethod: "cash", amount: "", allocations: "" });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not record payment.");
    }
  }

  const customerOptions = useMemo(() => {
    return customers.map((c) => ({
      value: String(c._id),
      label: `${String(c.name)} (${String(c.customerType || "Customer")})`,
    }));
  }, [customers]);

  const paymentMethodOptions = [
    { value: "cash", label: "Cash Counter" },
    { value: "upi", label: "UPI / QR Code" },
    { value: "bank", label: "Bank Transfer / NEFT" },
  ];

  const stats = ledger
    ? [
        {
          label: "OUTSTANDING BALANCE",
          value: `₹ ${Number(ledger.outstanding || 0).toLocaleString("en-IN")}`,
          color: "active" as const,
        },
        {
          label: "CREDIT LIMIT",
          value: `₹ ${Number(ledger.creditLimit || 0).toLocaleString("en-IN")}`,
          color: "teal" as const,
        },
        {
          label: "ADVANCE BALANCE",
          value: `₹ ${Number(ledger.advance || 0).toLocaleString("en-IN")}`,
          color: "inactive" as const,
        },
      ]
    : [
        { label: "REGISTERED CUSTOMERS", value: customers.length, color: "teal" as const },
        { label: "LEDGER STATUS", value: "Ready", color: "active" as const },
      ];

  return (
    <div className="erp-module">
      <ErpPageHeader
        title="Customer Ledger & Payments"
        description="View outstanding balances, payment terms, and record customer invoice allocations."
      />

      <ErpStatsGrid stats={stats} />

      {error ? (
        <div className="erp-alert erp-alert--error" role="alert">
          {error}
        </div>
      ) : null}
      {saved ? (
        <div className="erp-alert erp-alert--success" role="status">
          {saved}
        </div>
      ) : null}

      {/* Select Customer Box with Custom Dropdown */}
      <div className="erp-card" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 12px", color: "#0f172a" }}>
          Select Customer Account
        </h3>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: "380px" }}>
            <ErpSelect
              value={customerId}
              options={customerOptions}
              placeholder="-- Choose Customer Account --"
              onChange={(val) => {
                setCustomerId(val);
                setLedger(null);
              }}
            />
          </div>

          <button
            type="button"
            className="erp-btn erp-btn--primary"
            onClick={() => void load()}
            disabled={!customerId || loading}
          >
            {loading ? "Loading..." : "Load Ledger Balance"}
          </button>
        </div>
      </div>

      {/* Payment Form if customer selected */}
      {ledger ? (
        <div className="erp-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 16px", color: "#0f172a" }}>
            Receive & Allocate Payment
          </h3>
          <form
            onSubmit={receive}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "16px",
            }}
          >
            <div className="erp-field-group">
              <label>Payment Amount (₹)*</label>
              <input
                type="number"
                min="1"
                required
                className="erp-input"
                placeholder="Enter amount in ₹"
                value={String(payment.amount || "")}
                onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
              />
            </div>

            <div className="erp-field-group">
              <label>Payment Mode*</label>
              <ErpSelect
                value={String(payment.paymentMethod)}
                options={paymentMethodOptions}
                onChange={(val) => setPayment({ ...payment, paymentMethod: val })}
              />
            </div>

            <div className="erp-field-group" style={{ gridColumn: "1 / -1" }}>
              <label>Manual Wash Allocations (Optional: washEntryId:amount, comma separated)</label>
              <input
                type="text"
                className="erp-input"
                placeholder="e.g. entry123:500, entry124:1000"
                value={String(payment.allocations || "")}
                onChange={(e) => setPayment({ ...payment, allocations: e.target.value })}
              />
            </div>

            <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
              <Button type="submit" className="erp-btn erp-btn--primary">
                Record Payment Received
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
