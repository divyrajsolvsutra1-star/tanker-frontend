import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import ErpPageHeader from "@/components/common/ErpPageHeader";
import ErpStatsGrid from "@/components/common/ErpStatsGrid";
import Button from "@/components/common/Button";
import DataTable from "@/components/common/DataTable";
import ErpSelect from "@/components/common/ErpSelect";
import ErpDatePicker from "@/components/common/ErpDatePicker";
import { ApiError, apiRequest, getBusinessResource } from "@/lib/api";

export default function SalaryPage() {
  const [employees, setEmployees] = useState<Record<string, unknown>[]>([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [register, setRegister] = useState<Record<string, unknown> | null>(null);
  const [tx, setTx] = useState<Record<string, string>>({
    employeeId: "",
    type: "salary",
    amount: "",
    paymentMethod: "cash",
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBusinessResource<Record<string, unknown>>("employees", { limit: 100 })
      .then((res) => setEmployees("items" in res ? res.items : []))
      .catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<Record<string, unknown>>(
        `salary/register?month=${encodeURIComponent(month)}`
      );
      setRegister(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load salary register.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [month]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaved("");
    try {
      await apiRequest("salary/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tx, month, amount: Number(tx.amount) }),
      });
      setSaved("Salary transaction recorded successfully.");
      setTx({ employeeId: "", type: "salary", amount: "", paymentMethod: "cash" });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not record salary transaction.");
    }
  }

  const rows = (register?.rows as Record<string, unknown>[] | undefined) || [];

  const totalPayroll = useMemo(() => {
    return rows.reduce((acc, r) => acc + Number(r.monthlySalary || 0), 0);
  }, [rows]);

  const totalPaid = useMemo(() => {
    return rows.reduce((acc, r) => acc + Number(r.paid || 0), 0);
  }, [rows]);

  const stats = [
    { label: "PAYROLL EMPLOYEES", value: rows.length || employees.length },
    {
      label: "TOTAL PAYROLL COMMITMENT",
      value: `₹ ${totalPayroll.toLocaleString("en-IN")}`,
      color: "teal" as const,
    },
    {
      label: "DISBURSED THIS MONTH",
      value: `₹ ${totalPaid.toLocaleString("en-IN")}`,
      color: "active" as const,
    },
  ];

  const employeeOptions = useMemo(() => {
    return employees.map((emp) => ({
      value: String(emp._id),
      label: `${String(emp.name)} (${String(emp.designation || "Staff")})`,
    }));
  }, [employees]);

  const paymentTypeOptions = [
    { value: "salary", label: "Monthly Salary Payment" },
    { value: "advance", label: "Salary Advance" },
  ];

  const paymentMethodOptions = [
    { value: "cash", label: "Cash Counter" },
    { value: "bank", label: "Bank / NEFT Transfer" },
  ];

  const columns = [
    {
      id: "name",
      header: "EMPLOYEE NAME",
      cell: (r: Record<string, unknown>) => {
        const emp = r.employee as { name?: string } | undefined;
        return <strong style={{ color: "#0f172a" }}>{emp?.name || "Staff Member"}</strong>;
      },
    },
    {
      id: "salary",
      header: "MONTHLY SALARY",
      cell: (r: Record<string, unknown>) => (
        <span className="erp-cell-number">₹ {Number(r.monthlySalary || 0).toLocaleString("en-IN")}</span>
      ),
    },
    {
      id: "advances",
      header: "ADVANCES",
      cell: (r: Record<string, unknown>) => (
        <span className="erp-cell-number" style={{ color: "#d97706" }}>
          ₹ {Number(r.advances || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      id: "paid",
      header: "PAID",
      cell: (r: Record<string, unknown>) => (
        <span className="erp-cell-number" style={{ color: "#059669" }}>
          ₹ {Number(r.paid || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      id: "remaining",
      header: "BALANCE DUE",
      cell: (r: Record<string, unknown>) => (
        <span className="erp-cell-number" style={{ color: "#ef4444" }}>
          ₹ {Number(r.remaining || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
  ];

  return (
    <div className="erp-module">
      <ErpPageHeader
        title="Staff Payroll & Salary Register"
        description="Monthly employee salary disbursement, advance tracking, and cash/bank payroll ledger."
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

      {/* Disburse Salary Form using Custom Dropdowns & Date Picker */}
      <div className="erp-card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px", color: "#0f172a" }}>
          Disburse Salary or Advance Payment
        </h3>
        <form
          onSubmit={submit}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            alignItems: "flex-end",
          }}
        >
          {/* Custom Month Picker */}
          <div className="erp-field-group">
            <label>Select Month</label>
            <ErpDatePicker
              type="month"
              value={month}
              onChange={setMonth}
              placeholder="Pick payroll month..."
            />
          </div>

          {/* Custom Employee Select */}
          <div className="erp-field-group">
            <label>Employee*</label>
            <ErpSelect
              required
              value={tx.employeeId}
              options={employeeOptions}
              placeholder="-- Choose Employee --"
              onChange={(val) => setTx({ ...tx, employeeId: val })}
            />
          </div>

          {/* Custom Payment Type Select */}
          <div className="erp-field-group">
            <label>Payment Type*</label>
            <ErpSelect
              value={tx.type}
              options={paymentTypeOptions}
              onChange={(val) => setTx({ ...tx, type: val })}
            />
          </div>

          <div className="erp-field-group">
            <label>Amount (₹)*</label>
            <input
              type="number"
              min="1"
              required
              className="erp-input"
              placeholder="e.g. 15000"
              value={tx.amount}
              onChange={(e) => setTx({ ...tx, amount: e.target.value })}
            />
          </div>

          {/* Custom Payment Mode Select */}
          <div className="erp-field-group">
            <label>Payment Mode*</label>
            <ErpSelect
              value={tx.paymentMethod}
              options={paymentMethodOptions}
              onChange={(val) => setTx({ ...tx, paymentMethod: val })}
            />
          </div>

          <div>
            <Button type="submit" className="erp-btn erp-btn--primary" style={{ width: "100%" }}>
              Record Payment
            </Button>
          </div>
        </form>
      </div>

      {/* Salary Register Table */}
      <div className="erp-card">
        <div className="erp-table-toolbar">
          <span className="erp-toolbar-title">
            Payroll Register for <strong>{month}</strong> - {rows.length} employee(s)
          </span>
        </div>

        <div className="erp-table-container">
          <DataTable
            caption={`Salary Register for ${month}`}
            columns={columns}
            emptyMessage={loading ? "Loading salary register..." : "No salary records loaded for this month."}
            getRowKey={(r) => String(r._id || Math.random())}
            rows={rows}
          />
        </div>

        <div className="erp-table-footer">
          <span>Total of {rows.length} employee record(s)</span>
        </div>
      </div>
    </div>
  );
}
