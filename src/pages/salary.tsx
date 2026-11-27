import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBusinessResource<Record<string, unknown>>("employees", { limit: 100 })
      .then((res) => setEmployees("items" in res ? res.items : []))
      .catch((err: unknown) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load employees.",
        );
      });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Record<string, unknown>>(
        `salary/register?month=${encodeURIComponent(month)}`
      );
      setRegister(data);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Could not load salary register.",
      );
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaved("");

    const errors: Record<string, string> = {};
    if (!month) {
      errors.month = "Month is required.";
    }
    if (!tx.employeeId) {
      errors.employeeId = "Employee is required. Please choose an employee.";
    }
    if (!tx.amount || Number(tx.amount) <= 0) {
      errors.amount = "Valid amount is required (greater than ₹ 0).";
    }
    if (!tx.paymentMethod) {
      errors.paymentMethod = "Payment mode is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fill in all required fields marked with *.");
      return;
    }

    setFieldErrors({});
    try {
      await apiRequest("salary/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tx, month, amount: Number(tx.amount) }),
      });
      setSaved("Salary transaction recorded successfully.");
      setTx({ employeeId: "", type: "salary", amount: "", paymentMethod: "cash" });
      setFieldErrors({});
      await load();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Could not record salary transaction.",
      );
    }
  }

  const rows = useMemo(
    () =>
      Array.isArray(register?.rows)
        ? (register.rows as Record<string, unknown>[])
        : [],
    [register],
  );

  const totalPayroll = useMemo(() => {
    return rows.reduce((acc, r) => acc + Number(r.monthlySalary || 0), 0);
  }, [rows]);

  const totalPaid = useMemo(() => {
    return rows.reduce((acc, r) => acc + Number(r.paid || 0), 0);
  }, [rows]);

  const stats = [
    { label: "PAYROLL EMPLOYEES", value: rows.length },
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
    return employees.flatMap((emp) => {
      const id = typeof emp._id === "string" ? emp._id : "";
      const name = typeof emp.name === "string" ? emp.name.trim() : "";
      if (!id || !name) return [];
      return [{ value: id, label: name }];
    });
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
        return <strong style={{ color: "#0f172a" }}>{emp?.name || "—"}</strong>;
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
        <div className="erp-alert erp-alert--error" role="alert" style={{ marginBottom: "16px" }}>
          {error}
        </div>
      ) : null}
      {saved ? (
        <div className="erp-alert erp-alert--success" role="status" style={{ marginBottom: "16px" }}>
          {saved}
        </div>
      ) : null}

      {/* Disburse Salary Form using Custom Dropdowns & Date Picker */}
      <div className="erp-card erp-card--popover-visible" style={{ padding: "24px" }}>
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
          <div className={`erp-field-group ${fieldErrors.month ? "erp-field-group--error" : ""}`}>
            <label>Select Month <span className="erp-required-star">*</span></label>
            <ErpDatePicker
              type="month"
              value={month}
              hasError={Boolean(fieldErrors.month)}
              onChange={(val) => {
                setMonth(val);
                if (fieldErrors.month) {
                  setFieldErrors((prev) => {
                    const n = { ...prev };
                    delete n.month;
                    return n;
                  });
                }
              }}
              placeholder="Pick payroll month..."
            />
            {fieldErrors.month && <span className="erp-field-error-msg">{fieldErrors.month}</span>}
          </div>

          {/* Custom Employee Select */}
          <div className={`erp-field-group ${fieldErrors.employeeId ? "erp-field-group--error" : ""}`}>
            <label>Employee <span className="erp-required-star">*</span></label>
            <ErpSelect
              required
              hasError={Boolean(fieldErrors.employeeId)}
              value={tx.employeeId}
              options={employeeOptions}
              placeholder="-- Choose Employee --"
              onChange={(val) => {
                setTx({ ...tx, employeeId: val });
                if (fieldErrors.employeeId) {
                  setFieldErrors((prev) => {
                    const n = { ...prev };
                    delete n.employeeId;
                    return n;
                  });
                }
              }}
            />
            {fieldErrors.employeeId && <span className="erp-field-error-msg">{fieldErrors.employeeId}</span>}
          </div>

          {/* Custom Payment Type Select */}
          <div className="erp-field-group">
            <label>Payment Type <span className="erp-required-star">*</span></label>
            <ErpSelect
              value={tx.type}
              options={paymentTypeOptions}
              onChange={(val) => setTx({ ...tx, type: val })}
            />
          </div>

          <div className={`erp-field-group ${fieldErrors.amount ? "erp-field-group--error" : ""}`}>
            <label>Amount (₹) <span className="erp-required-star">*</span></label>
            <input
              type="number"
              min="1"
              required
              className={`erp-input ${fieldErrors.amount ? "erp-input--error" : ""}`}
              placeholder="e.g. 15000"
              value={tx.amount}
              onChange={(e) => {
                setTx({ ...tx, amount: e.target.value });
                if (fieldErrors.amount) {
                  setFieldErrors((prev) => {
                    const n = { ...prev };
                    delete n.amount;
                    return n;
                  });
                }
              }}
            />
            {fieldErrors.amount && <span className="erp-field-error-msg">{fieldErrors.amount}</span>}
          </div>

          {/* Custom Payment Mode Select */}
          <div className={`erp-field-group ${fieldErrors.paymentMethod ? "erp-field-group--error" : ""}`}>
            <label>Payment Mode <span className="erp-required-star">*</span></label>
            <ErpSelect
              value={tx.paymentMethod}
              hasError={Boolean(fieldErrors.paymentMethod)}
              options={paymentMethodOptions}
              onChange={(val) => {
                setTx({ ...tx, paymentMethod: val });
                if (fieldErrors.paymentMethod) {
                  setFieldErrors((prev) => {
                    const n = { ...prev };
                    delete n.paymentMethod;
                    return n;
                  });
                }
              }}
            />
            {fieldErrors.paymentMethod && <span className="erp-field-error-msg">{fieldErrors.paymentMethod}</span>}
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
            getRowKey={(r) => String((r.employee as { _id?: string } | undefined)?._id ?? "")}
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
