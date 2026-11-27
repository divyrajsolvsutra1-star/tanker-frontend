import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import ErpPageHeader from "@/components/common/ErpPageHeader";
import ErpStatsGrid from "@/components/common/ErpStatsGrid";
import Button from "@/components/common/Button";
import ErpSelect from "@/components/common/ErpSelect";
import DataTable from "@/components/common/DataTable";
import { PrintIcon } from "@/components/common/Icons";
import { ApiError, apiRequest, getBusinessResource } from "@/lib/api";

type Ledger = {
  customer?: Record<string, unknown>;
  lines?: { date: string; type: string; reference: string; debit: number; credit: number; balance: number }[];
  pendingEntries?: { _id: string; entryNumber: string; savedRate: number; outstanding: number; entryDate: string }[];
  advance?: number;
  outstanding?: number;
  creditLimit?: number;
  creditPeriod?: number;
};

export default function LedgerPage() {
  const [customers, setCustomers] = useState<Record<string, unknown>[]>([]);
  const [bankAccounts, setBankAccounts] = useState<Record<string, unknown>[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [payment, setPayment] = useState<Record<string, string>>({
    paymentMethod: "cash",
    amount: "",
    bankAccountId: "",
  });
  const [allocationsMap, setAllocationsMap] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBusinessResource<Record<string, unknown>>("customers", { limit: 100 })
      .then((res) => {
        setCustomers("items" in res ? res.items : []);
      })
      .catch(() => {});
    getBusinessResource<Record<string, unknown>>("bank-accounts", { limit: 100 })
      .then((res) => {
        setBankAccounts("items" in res ? res.items : []);
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
      setAllocationsMap({});
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
      const allocations = Object.entries(allocationsMap)
        .filter(([, amt]) => amt > 0)
        .map(([washEntryId, amount]) => ({ washEntryId, amount }));

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
      setSaved("Payment recorded and ledger updated successfully.");
      setPayment({ paymentMethod: "cash", amount: "", bankAccountId: "" });
      setAllocationsMap({});
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not record payment.");
    }
  }

  function printStatement() {
    if (!ledger || !ledger.customer) return;
    const cust = ledger.customer;
    const lines = ledger.lines || [];
    const html = `
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Customer Ledger - ${String(cust.name)}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>
        body { font-family: 'Montserrat', sans-serif; max-width: 800px; margin: 20px auto; padding: 24px; color: #1e293b; }
        .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; }
        .header h1 { margin: 0; font-size: 20px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; background: #f8fafc; padding: 14px; border: 1px solid #e2e8f0; border-radius: 6px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
        th { background: #f1f5f9; padding: 10px 8px; text-align: left; border-bottom: 2px solid #cbd5e1; }
        td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
        .number { text-align: right; }
        .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        @media print { body { padding: 0; max-width: 100%; } }
      </style></head>
      <body>
        <div class="header">
          <div>
            <h1>CUSTOMER LEDGER STATEMENT</h1>
            <p style="margin: 4px 0; color: #64748b;">Tanker Wash Operations & Accounting</p>
          </div>
          <div style="text-align: right;">
            <strong>Statement Date:</strong> ${new Date().toLocaleDateString("en-IN")}<br/>
            <strong>Outstanding:</strong> ₹ ${Number(ledger.outstanding || 0).toLocaleString("en-IN")}
          </div>
        </div>
        <div class="info-grid">
          <div>
            <strong>Customer / Company:</strong> ${String(cust.name)}<br/>
            <strong>Contact:</strong> ${String(cust.contactPerson || cust.ownerName || "-")}<br/>
            <strong>Mobile:</strong> ${String(cust.mobileNumber || "-")}
          </div>
          <div>
            <strong>Credit Limit:</strong> ₹ ${Number(ledger.creditLimit || 0).toLocaleString("en-IN")}<br/>
            <strong>Credit Period:</strong> ${Number(ledger.creditPeriod || 0)} Days<br/>
            <strong>Advance Balance:</strong> ₹ ${Number(ledger.advance || 0).toLocaleString("en-IN")}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction Type</th>
              <th>Reference</th>
              <th class="number">Debit (Charge)</th>
              <th class="number">Credit (Payment)</th>
              <th class="number">Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${lines.map((l) => `
              <tr>
                <td>${l.date ? new Date(l.date).toLocaleDateString("en-IN") : "-"}</td>
                <td>${l.type}</td>
                <td>${l.reference}</td>
                <td class="number">${l.debit > 0 ? "₹ " + Number(l.debit).toLocaleString("en-IN") : "-"}</td>
                <td class="number">${l.credit > 0 ? "₹ " + Number(l.credit).toLocaleString("en-IN") : "-"}</td>
                <td class="number" style="font-weight: bold;">₹ ${Number(l.balance).toLocaleString("en-IN")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div class="footer">
          System-generated statement from Tanker Wash Management System. Please contact accounts for discrepancies.
        </div>
        <script>window.onload=()=>window.print();<\/script>
      </body></html>
    `;
    const win = window.open("", "", "width=850,height=800");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  const customerOptions = useMemo(() => {
    return customers.map((c) => ({
      value: String(c._id),
      label: c.customerType
        ? `${String(c.name)} (${String(c.customerType)})`
        : String(c.name),
    }));
  }, [customers]);

  const bankOptions = useMemo(() => {
    return bankAccounts.map((b) => ({
      value: String(b._id),
      label: `${String(b.bankName)} - ${String(b.accountName)}`,
    }));
  }, [bankAccounts]);

  const paymentMethodOptions = [
    { value: "cash", label: "Cash Counter" },
    { value: "upi", label: "UPI / QR Code" },
    { value: "bank", label: "Bank Transfer / NEFT" },
  ];

  const isOverLimit = Boolean(
    ledger &&
    Number(ledger.creditLimit || 0) > 0 &&
    Number(ledger.outstanding || 0) > Number(ledger.creditLimit || 0)
  );

  const stats = ledger
    ? [
        {
          label: "OUTSTANDING BALANCE",
          value: `₹ ${Number(ledger.outstanding || 0).toLocaleString("en-IN")}`,
          color: isOverLimit ? ("inactive" as const) : ("active" as const),
        },
        {
          label: "CREDIT LIMIT",
          value: `₹ ${Number(ledger.creditLimit || 0).toLocaleString("en-IN")}`,
          color: "teal" as const,
        },
        {
          label: "ADVANCE BALANCE",
          value: `₹ ${Number(ledger.advance || 0).toLocaleString("en-IN")}`,
          color: "active" as const,
        },
      ]
    : [
        { label: "REGISTERED CUSTOMERS", value: customers.length, color: "teal" as const },
        { label: "BANK ACCOUNTS", value: bankAccounts.length, color: "default" as const },
      ];

  const statementCols = [
    {
      id: "date",
      header: "DATE",
      cell: (r: { date: string }) => r.date ? new Date(r.date).toLocaleDateString("en-IN") : "-",
    },
    {
      id: "type",
      header: "TRANSACTION TYPE",
      cell: (r: { type: string }) => <strong>{r.type}</strong>,
    },
    {
      id: "reference",
      header: "REFERENCE",
      cell: (r: { reference: string }) => <span className="erp-cell-number">{r.reference}</span>,
    },
    {
      id: "debit",
      header: "CHARGE / DEBIT",
      align: "right" as const,
      cell: (r: { debit: number }) => r.debit > 0 ? (
        <span style={{ color: "#b91c1c", fontWeight: 600 }}>
          ₹ {Number(r.debit).toLocaleString("en-IN")}
        </span>
      ) : "-",
    },
    {
      id: "credit",
      header: "PAYMENT / CREDIT",
      align: "right" as const,
      cell: (r: { credit: number }) => r.credit > 0 ? (
        <span style={{ color: "#0f766e", fontWeight: 600 }}>
          ₹ {Number(r.credit).toLocaleString("en-IN")}
        </span>
      ) : "-",
    },
    {
      id: "balance",
      header: "RUNNING BALANCE",
      align: "right" as const,
      cell: (r: { balance: number }) => (
        <span className="erp-cell-number" style={{ fontWeight: 700 }}>
          ₹ {Number(r.balance).toLocaleString("en-IN")}
        </span>
      ),
    },
  ];

  return (
    <div className="erp-module">
      <ErpPageHeader
        title="Customer Ledger & Outstanding Management"
        description="Track credit limits, customer-wise wash debits, payments, advance unallocated funds and statements."
        actions={
          ledger ? (
            <button
              type="button"
              className="erp-btn erp-btn--secondary"
              onClick={printStatement}
            >
              <PrintIcon size={14} /> Print Statement
            </button>
          ) : undefined
        }
      />

      <ErpStatsGrid stats={stats} />

      {isOverLimit && (
        <div className="erp-alert erp-alert--error" role="alert">
          <strong>⚠️ Credit Limit Alert:</strong> This customer has exceeded their configured credit limit of ₹{Number(ledger?.creditLimit).toLocaleString("en-IN")}. Current outstanding is ₹{Number(ledger?.outstanding).toLocaleString("en-IN")}. New credit washes will require manager authorization.
        </div>
      )}

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

      {/* Select Customer Box */}
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
            {loading ? "Loading..." : "Load Customer Ledger"}
          </button>
        </div>
      </div>

      {/* Payment Collection & Outstanding Washes Allocation Form */}
      {ledger ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
          {/* Payment Collection Form */}
          <div className="erp-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 16px", color: "#0f172a" }}>
              Record Payment Collection
            </h3>
            <form onSubmit={receive} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="erp-field-group">
                <label>Received Amount (₹)*</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="erp-input"
                  placeholder="Enter payment amount"
                  value={payment.amount}
                  onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
                />
              </div>

              <div className="erp-field-group">
                <label>Payment Mode*</label>
                <ErpSelect
                  value={payment.paymentMethod}
                  options={paymentMethodOptions}
                  onChange={(val) => setPayment({ ...payment, paymentMethod: val })}
                />
              </div>

              {payment.paymentMethod === "bank" && (
                <div className="erp-field-group">
                  <label>Receiving Bank Account*</label>
                  <ErpSelect
                    required
                    value={payment.bankAccountId}
                    options={bankOptions}
                    placeholder="-- Select Bank Account --"
                    onChange={(val) => setPayment({ ...payment, bankAccountId: val })}
                  />
                </div>
              )}

              <Button type="submit" className="erp-btn erp-btn--primary" style={{ marginTop: "8px" }}>
                Save Payment & Post Journal
              </Button>
            </form>
          </div>

          {/* Pending Washes for Allocation */}
          <div className="erp-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px", color: "#0f172a" }}>
              Allocate to Outstanding Washes
            </h3>
            <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 16px" }}>
              Allocate against specific washes or leave blank to record as advance balance.
            </p>

            {(!ledger.pendingEntries || ledger.pendingEntries.length === 0) ? (
              <p style={{ color: "#059669", fontSize: "13px", fontWeight: 600 }}>
                ✓ No unpaid credit wash entries for this customer.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "260px", overflowY: "auto" }}>
                {ledger.pendingEntries.map((pe) => {
                  const currentAlloc = allocationsMap[pe._id] || 0;
                  return (
                    <div
                      key={pe._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                      }}
                    >
                      <div>
                        <strong>#{pe.entryNumber}</strong>
                        <div style={{ color: "#64748b", fontSize: "12px" }}>
                          Total: ₹{pe.savedRate} | Due: <span style={{ color: "#b91c1c" }}>₹{pe.outstanding}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                          type="number"
                          min="0"
                          max={pe.outstanding}
                          className="erp-input"
                          style={{ width: "90px", padding: "4px 8px" }}
                          placeholder="₹ Amt"
                          value={currentAlloc || ""}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setAllocationsMap((prev) => ({ ...prev, [pe._id]: val }));
                          }}
                        />
                        <button
                          type="button"
                          className="erp-btn erp-btn--secondary"
                          style={{ padding: "4px 8px", fontSize: "11px" }}
                          onClick={() => {
                            setAllocationsMap((prev) => ({ ...prev, [pe._id]: pe.outstanding }));
                            setPayment((prev) => ({
                              ...prev,
                              amount: String(Math.max(Number(prev.amount || 0), pe.outstanding)),
                            }));
                          }}
                        >
                          Full
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Customer Ledger Statement Table */}
      {ledger && ledger.lines && ledger.lines.length > 0 && (
        <div className="erp-card" style={{ marginTop: "20px" }}>
          <div className="erp-table-toolbar">
            <span className="erp-toolbar-title">
              Customer Ledger Statement - <strong>{String(ledger.customer?.name || "")}</strong>
            </span>
          </div>
          <div className="erp-table-container">
            <DataTable
              caption="Ledger Statement"
              columns={statementCols}
              rows={ledger.lines}
              getRowKey={(r) => `${r.date}-${r.reference}-${r.type}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
