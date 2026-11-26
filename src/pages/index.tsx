import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { getDashboardSummary, type DashboardSummary } from "@/lib/api";
import ErpPageHeader from "@/components/common/ErpPageHeader";
import {
  AccountingIcon,
  AlertTriangleIcon,
  BankAccountsIcon,
  ExpensesIcon,
  InfoIcon,
  LedgerIcon,
  PlusIcon,
  ReportsIcon,
  SpinnerIcon,
  VehiclesIcon,
  WashEntriesIcon,
} from "@/components/common/Icons";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    getDashboardSummary()
      .then((data) => {
        if (!active) return;
        setMetrics(data);
        setErrorMessage("");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Could not load dashboard data.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="erp-module">
        <div style={{ padding: "48px 0", textAlign: "center", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          <SpinnerIcon size={24} color="#0f766e" />
          <span>Loading live terminal dashboard...</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="erp-module">
        <div className="erp-alert erp-alert--danger" role="alert">
          {errorMessage || "Failed to load dashboard data"}
        </div>
      </div>
    );
  }

  const totalBankBalance = (metrics.bankBalances || []).reduce(
    (sum, b) => sum + (b.balance || 0),
    0,
  );

  return (
    <div className="erp-module">
      <ErpPageHeader
        title="Operations Dashboard"
        description="Real-time tanker wash operations, today's queue, revenue collections, and account liquidity."
      />

      {/* KPI Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <KPICard
          title="Today's Vehicles"
          value={metrics.todayVehicles || 0}
          subtitle="Wash entries recorded today"
          icon={<VehiclesIcon size={26} color="#0f766e" />}
          color="#0f766e"
        />
        <KPICard
          title="Today's Washes"
          value={metrics.todayWashEntries || 0}
          subtitle="Completed wash services"
          icon={<WashEntriesIcon size={26} color="#0d9488" />}
          color="#0d9488"
        />
        <KPICard
          title="Today's Collection"
          value={`₹${(metrics.todayCollections || 0).toLocaleString()}`}
          subtitle="Cash & bank collected today"
          icon={<AccountingIcon size={26} color="#16a34a" />}
          color="#16a34a"
        />
        <KPICard
          title="Outstanding Balance"
          value={`₹${(metrics.totalCustomerOutstanding || 0).toLocaleString()}`}
          subtitle="Total customer dues pending"
          icon={<AlertTriangleIcon size={26} color="#d97706" />}
          color="#d97706"
        />
      </div>

      {/* Status Breakdown & Balances */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        {/* Status Breakdown */}
        <div className="erp-card" style={{ padding: "20px" }}>
          <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
              Wash Queue Breakdown
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <StatusBar
              label="Booked (Waiting)"
              value={metrics.statuses?.booked || 0}
              total={metrics.todayWashEntries || 0}
              color="#3b82f6"
            />
            <StatusBar
              label="Washing in Bay"
              value={metrics.statuses?.washing || 0}
              total={metrics.todayWashEntries || 0}
              color="#f59e0b"
            />
            <StatusBar
              label="Completed"
              value={metrics.statuses?.completed || 0}
              total={metrics.todayWashEntries || 0}
              color="#10b981"
            />
            <StatusBar
              label="Delivered & Invoiced"
              value={metrics.statuses?.delivered || 0}
              total={metrics.todayWashEntries || 0}
              color="#8b5cf6"
            />
          </div>
        </div>

        {/* Account Balances */}
        <div className="erp-card" style={{ padding: "20px" }}>
          <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
              Cash & Bank Liquidity
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <BalanceItem
              label="Cash in Hand"
              amount={metrics.cashBalance || 0}
              icon={<LedgerIcon size={20} color="#0f766e" />}
            />
            <BalanceItem
              label="Bank Accounts Total"
              amount={totalBankBalance}
              icon={<BankAccountsIcon size={20} color="#2563eb" />}
            />
            <BalanceItem
              label="Monthly Expenses"
              amount={metrics.monthlyExpenses || 0}
              icon={<ExpensesIcon size={20} color="#dc2626" />}
              variant="expense"
            />
          </div>
        </div>
      </div>

      {/* Operational Alerts if any */}
      {((metrics.creditAlerts && metrics.creditAlerts.length > 0) ||
        (metrics.overduePayments && metrics.overduePayments.length > 0)) && (
        <div className="erp-card" style={{ padding: "20px", marginBottom: "24px" }}>
          <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangleIcon size={18} color="#d97706" />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
              Operational Alerts
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {metrics.creditAlerts && metrics.creditAlerts.length > 0 && (
              <div
                style={{
                  padding: "10px 14px",
                  borderLeft: "4px solid #f59e0b",
                  background: "#fffbeb",
                  color: "#92400e",
                  fontSize: "13px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <AlertTriangleIcon size={16} color="#d97706" />
                <span>{metrics.creditAlerts.length} customer(s) have reached or exceeded credit limits.</span>
              </div>
            )}
            {metrics.overduePayments && metrics.overduePayments.length > 0 && (
              <div
                style={{
                  padding: "10px 14px",
                  borderLeft: "4px solid #ef4444",
                  background: "#fef2f2",
                  color: "#991b1b",
                  fontSize: "13px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <AlertTriangleIcon size={16} color="#dc2626" />
                <span>{metrics.overduePayments.length} payment(s) are past due settlement terms.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Operational Shortcuts */}
      <div className="erp-card" style={{ padding: "20px" }}>
        <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
            Quick Operations
          </h3>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/wash-entries" className="erp-btn erp-btn--primary">
            <PlusIcon size={15} />
            <span>New Wash Entry</span>
          </Link>
          <Link href="/customers" className="erp-btn erp-btn--secondary">
            <PlusIcon size={15} />
            <span>Add Customer</span>
          </Link>
          <Link href="/ledger" className="erp-btn erp-btn--secondary">
            <LedgerIcon size={15} />
            <span>Customer Ledger</span>
          </Link>
          <Link href="/reports" className="erp-btn erp-btn--secondary">
            <ReportsIcon size={15} />
            <span>Generate Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  color: string;
}) {
  return (
    <div
      className="erp-card"
      style={{
        padding: "20px 24px",
        borderLeft: `4px solid ${color}`,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p
            style={{
              margin: "0 0 6px",
              fontSize: "12px",
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {title}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "26px",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
            }}
          >
            {value}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#94a3b8" }}>
            {subtitle}
          </p>
        </div>
        <div
          style={{
            background: "#f8fafc",
            padding: "10px",
            borderRadius: "10px",
            border: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
          fontSize: "13px",
          color: "#334155",
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: "#0f172a" }}>
          {value}{total > 0 && ` / ${total}`}
        </span>
      </div>
      <div
        style={{
          height: "7px",
          background: "#e2e8f0",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            background: color,
            width: `${percentage}%`,
            transition: "width 0.3s ease",
            borderRadius: "4px",
          }}
        />
      </div>
    </div>
  );
}

function BalanceItem({
  label,
  amount,
  icon,
  variant = "normal",
}: {
  label: string;
  amount: number;
  icon: ReactNode;
  variant?: "normal" | "expense";
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 12px",
        background: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #f1f5f9",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
          }}
        >
          {icon}
        </div>
        <span style={{ fontSize: "13.5px", fontWeight: 500, color: "#334155" }}>
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: variant === "expense" ? "#dc2626" : "#0f766e",
        }}
      >
        {variant === "expense" ? "-" : ""}₹{amount.toLocaleString()}
      </span>
    </div>
  );
}
