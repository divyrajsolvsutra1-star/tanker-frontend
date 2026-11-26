import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Button from "@/components/common/Button";
import DataTable from "@/components/common/DataTable";
import ErpPageHeader from "@/components/common/ErpPageHeader";
import ErpStatsGrid from "@/components/common/ErpStatsGrid";
import ErpTabs from "@/components/common/ErpTabs";
import ErpToolbar from "@/components/common/ErpToolbar";
import ErpDrawer from "@/components/common/ErpDrawer";
import ErpStatusBadge from "@/components/common/ErpStatusBadge";
import ErpSelect from "@/components/common/ErpSelect";
import {
  RefreshIcon,
  PlusIcon,
  PrintIcon,
} from "@/components/common/Icons";
import { ApiError, apiRequest, getBusinessResource } from "@/lib/api";

type Item = Record<string, unknown>;

export default function WashEntriesPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Item[]>([]);
  const [vehicles, setVehicles] = useState<Item[]>([]);
  const [washTypes, setWashTypes] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "booked" | "washing" | "completed" | "delivered">("all");
  const [search, setSearch] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<Record<string, string | number | boolean>>({
    paymentType: "immediate",
    paymentMethod: "cash",
    status: "booked",
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await apiRequest<{ items: Item[] }>("wash-entries?limit=100");
      setItems(r.items || []);
      setError("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load wash entries.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load);
    getBusinessResource<Item>("customers", { limit: 100 })
      .then((res) => setCustomers("items" in res ? res.items : []))
      .catch(() => {});
    getBusinessResource<Item>("vehicles", { limit: 100 })
      .then((res) => setVehicles("items" in res ? res.items : []))
      .catch(() => {});
    getBusinessResource<Item>("wash-types", { limit: 100 })
      .then((res) => setWashTypes("items" in res ? res.items : []))
      .catch(() => {});
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaved("");
    setIsSubmitting(true);
    try {
      const employeeIds = String(form.employeeIds || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const r = await apiRequest<{ item: Item }>("wash-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, employeeIds }),
      });
      setSaved(`Wash entry #${String(r.item.entryNumber)} registered successfully.`);
      setForm({ paymentType: "immediate", paymentMethod: "cash", status: "booked" });
      setIsDrawerOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create wash entry.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    try {
      await apiRequest(`wash-entries/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setSaved(`Entry status updated to ${newStatus}.`);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not update status.");
    }
  }

  function printReceipt(r: Item) {
    const customer =
      typeof r.customerId === "object" && r.customerId
        ? (r.customerId as { name: string }).name
        : String(r.customerId || "-");
    const vehicle =
      typeof r.vehicleId === "object" && r.vehicleId
        ? (r.vehicleId as { vehicleNumber: string }).vehicleNumber
        : String(r.vehicleId || "-");
    const html = `<html><head><title>Wash Receipt #${String(
      r.entryNumber
    )}</title><style>body{font-family:Arial,sans-serif;width:300px;margin:20px auto;border:1px solid #ccc;padding:16px;border-radius:8px}@media print{body{width:72mm;margin:0;border:none}}h2{margin:0 0 8px;font-size:18px}p{margin:6px 0;font-size:13px}</style></head><body><h2>Tanker Wash Receipt</h2><p><strong>Entry No:</strong> #${String(
      r.entryNumber
    )}</p><p><strong>Customer:</strong> ${customer}</p><p><strong>Vehicle:</strong> ${vehicle}</p><p><strong>Charge:</strong> ₹${Number(
      r.savedRate || 0
    ).toLocaleString("en-IN")}</p><p><strong>Payment:</strong> ${String(r.paymentType)} ${
      r.paymentMethod ? `(${String(r.paymentMethod)})` : ""
    }</p><p><strong>Status:</strong> ${String(r.status)}</p><script>window.onload=()=>window.print()<\/script></body></html>`;
    const win = window.open("", "", "width=440,height=600");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  const customerOptions = useMemo(
    () =>
      customers.map((c) => ({
        value: String(c._id),
        label: `${String(c.name)} (${String(c.customerType || "Account")})`,
      })),
    [customers]
  );

  const vehicleOptions = useMemo(
    () =>
      vehicles.map((v) => ({
        value: String(v._id),
        label: `${String(v.vehicleNumber)} - Driver: ${String(v.driverName || "Standard")}`,
      })),
    [vehicles]
  );

  const washTypeOptions = useMemo(
    () =>
      washTypes.map((wt) => ({
        value: String(wt._id),
        label: `${String(wt.name)} - ₹${Number(wt.rate || 0)}`,
      })),
    [washTypes]
  );

  const paymentTypeOptions = [
    { value: "immediate", label: "Immediate Counter Payment" },
    { value: "credit", label: "Credit Line (Customer Ledger)" },
  ];

  const paymentMethodOptions = [
    { value: "cash", label: "Cash" },
    { value: "upi", label: "UPI / Online" },
    { value: "bank", label: "Bank Card / Transfer" },
  ];

  const filteredItems = useMemo(() => {
    return items.filter((row) => {
      const st = String(row.status || "").toLowerCase();
      if (activeTab !== "all" && st !== activeTab) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      const num = String(row.entryNumber || "");
      const cust = String((row.customerId as { name?: string })?.name || row.customerId || "").toLowerCase();
      const veh = String((row.vehicleId as { vehicleNumber?: string })?.vehicleNumber || row.vehicleId || "").toLowerCase();
      return num.includes(q) || cust.includes(q) || veh.includes(q);
    });
  }, [items, activeTab, search]);

  const activeWashCount = useMemo(
    () => items.filter((r) => String(r.status).toLowerCase() === "washing").length,
    [items]
  );
  const completedCount = useMemo(
    () => items.filter((r) => String(r.status).toLowerCase() === "completed").length,
    [items]
  );
  const totalRevenue = useMemo(
    () => items.reduce((acc, r) => acc + Number(r.savedRate || 0), 0),
    [items]
  );

  const stats = [
    { label: "TOTAL ENTRIES", value: items.length },
    { label: "CURRENTLY WASHING", value: activeWashCount, color: "teal" as const },
    { label: "COMPLETED TODAY", value: completedCount, color: "active" as const },
    {
      label: "TOTAL BILLED AMOUNT",
      value: `₹ ${totalRevenue.toLocaleString("en-IN")}`,
      color: "active" as const,
    },
  ];

  const cols = [
    {
      id: "number",
      header: "ENTRY NO",
      cell: (r: Item) => <strong style={{ color: "#0f172a" }}>#{String(r.entryNumber)}</strong>,
    },
    {
      id: "customer",
      header: "CUSTOMER",
      cell: (r: Item) => {
        const c = r.customerId as { name?: string } | undefined;
        return c?.name || String(r.customerId || "-");
      },
    },
    {
      id: "vehicle",
      header: "VEHICLE NO",
      cell: (r: Item) => {
        const v = r.vehicleId as { vehicleNumber?: string } | undefined;
        return <span className="erp-cell-number">{v?.vehicleNumber || String(r.vehicleId || "-")}</span>;
      },
    },
    {
      id: "charge",
      header: "CHARGE",
      cell: (r: Item) => (
        <span className="erp-cell-number" style={{ color: "#0f766e" }}>
          ₹ {Number(r.savedRate || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      id: "payment",
      header: "PAYMENT",
      cell: (r: Item) => {
        const isCredit = String(r.paymentType).toLowerCase() === "credit";
        return (
          <span className={`erp-pill ${isCredit ? "erp-pill--individual" : "erp-pill--company"}`}>
            {isCredit ? "Credit / Ledger" : `Immediate (${String(r.paymentMethod || "Cash")})`}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "WASH STATUS",
      cell: (r: Item) => {
        const st = String(r.status || "booked");
        return <ErpStatusBadge status={st} label={st.toUpperCase()} />;
      },
    },
    {
      id: "actions",
      header: "ACTIONS",
      align: "right" as const,
      cell: (r: Item) => {
        const id = String(r._id);
        const st = String(r.status || "");
        return (
          <div className="erp-table-actions">
            {st === "booked" && (
              <button
                type="button"
                className="erp-action-btn erp-action-btn--edit"
                onClick={() => void updateStatus(id, "washing")}
              >
                Start Wash
              </button>
            )}
            {st === "washing" && (
              <button
                type="button"
                className="erp-action-btn erp-action-btn--edit"
                onClick={() => void updateStatus(id, "completed")}
              >
                Mark Completed
              </button>
            )}
            {st === "completed" && (
              <button
                type="button"
                className="erp-btn erp-btn--primary"
                style={{ padding: "3px 8px", fontSize: "11px" }}
                onClick={() => void updateStatus(id, "delivered")}
              >
                Deliver
              </button>
            )}
            <button
              type="button"
              className="erp-action-btn erp-action-btn--deactivate"
              onClick={() => printReceipt(r)}
              title="Print Receipt"
            >
              <PrintIcon size={12} style={{ display: "inline-block", marginRight: "3px" }} />
              Print
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="erp-module">
      <ErpPageHeader
        title="Tanker Wash Operations"
        description="Check-in tanker vehicles, assign washers, track live washing stage and print tax receipts."
        actions={
          <>
            <button
              type="button"
              className="erp-btn erp-btn--secondary"
              onClick={() => void load()}
            >
              <RefreshIcon size={14} /> Refresh
            </button>
            <button
              type="button"
              className="erp-btn erp-btn--primary"
              onClick={() => setIsDrawerOpen(true)}
            >
              <PlusIcon size={14} /> New Wash Entry
            </button>
          </>
        }
      />

      <ErpStatsGrid stats={stats} />

      <ErpTabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
        tabs={[
          { id: "all", label: "All Washes", count: items.length },
          { id: "booked", label: "Booked Queue" },
          { id: "washing", label: "Washing Bay", count: activeWashCount },
          { id: "completed", label: "Ready", count: completedCount },
          { id: "delivered", label: "Delivered" },
        ]}
      />

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

      <div className="erp-card">
        <ErpToolbar
          title="Wash Operations Queue"
          count={filteredItems.length}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search entry number, customer, or vehicle number..."
        />

        <div className="erp-table-container">
          <DataTable
            caption="Wash Entries"
            columns={cols}
            emptyMessage={loading ? "Loading wash entries..." : "No wash entries in this status."}
            getRowKey={(r) => String(r._id || Math.random())}
            rows={filteredItems}
          />
        </div>

        <div className="erp-table-footer">
          <span>Total of {filteredItems.length} wash entry(ies)</span>
        </div>
      </div>

      {/* New Wash Entry Slide-over Drawer with Custom Selects */}
      <ErpDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="New Tanker Wash Check-In"
        subtitle="Record entry details, select vehicle, choose wash service and payment method."
      >
        <form className="erp-drawer-form" onSubmit={submit}>
          <div className="erp-form-grid">
            <div className="erp-field-group">
              <label>Select Customer*</label>
              <ErpSelect
                required
                value={String(form.customerId || "")}
                options={customerOptions}
                placeholder="-- Choose Customer --"
                onChange={(val) => setForm({ ...form, customerId: val })}
              />
            </div>

            <div className="erp-field-group">
              <label>Select Vehicle*</label>
              <ErpSelect
                required
                value={String(form.vehicleId || "")}
                options={vehicleOptions}
                placeholder="-- Choose Vehicle --"
                onChange={(val) => setForm({ ...form, vehicleId: val })}
              />
            </div>

            <div className="erp-field-group">
              <label>Wash Type Service*</label>
              <ErpSelect
                required
                value={String(form.washTypeId || "")}
                options={washTypeOptions}
                placeholder="-- Choose Wash Service --"
                onChange={(val) => {
                  const wt = washTypes.find((w) => String(w._id) === val);
                  setForm({
                    ...form,
                    washTypeId: val,
                    savedRate: Number(wt?.rate || 0),
                  });
                }}
              />
            </div>

            <div className="erp-field-group">
              <label>Wash Charge Rate (₹)*</label>
              <input
                type="number"
                min="0"
                required
                className="erp-input"
                placeholder="Rate in ₹"
                value={String(form.savedRate ?? "")}
                onChange={(e) =>
                  setForm({ ...form, savedRate: Number(e.target.value), rateModified: true })
                }
              />
            </div>

            <div className="erp-field-group">
              <label>Payment Terms*</label>
              <ErpSelect
                value={String(form.paymentType)}
                options={paymentTypeOptions}
                onChange={(val) => setForm({ ...form, paymentType: val })}
              />
            </div>

            {form.paymentType === "immediate" ? (
              <div className="erp-field-group">
                <label>Counter Payment Method*</label>
                <ErpSelect
                  value={String(form.paymentMethod)}
                  options={paymentMethodOptions}
                  onChange={(val) => setForm({ ...form, paymentMethod: val })}
                />
              </div>
            ) : (
              <div
                className="erp-field-group"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  marginTop: "24px",
                }}
              >
                <label style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(form.creditApproved)}
                    onChange={(e) => setForm({ ...form, creditApproved: e.target.checked })}
                  />
                  <span>Authorize Credit Outstanding</span>
                </label>
              </div>
            )}

            <div className="erp-field-group">
              <label>Driver Name</label>
              <input
                className="erp-input"
                placeholder="e.g. Ramesh Singh"
                value={String(form.driverName || "")}
                onChange={(e) => setForm({ ...form, driverName: e.target.value })}
              />
            </div>

            <div className="erp-field-group">
              <label>Driver Phone Number</label>
              <input
                type="tel"
                className="erp-input"
                placeholder="+91 98765 43210"
                value={String(form.driverMobileNumber || "")}
                onChange={(e) => setForm({ ...form, driverMobileNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="erp-drawer-footer">
            <button
              type="button"
              className="erp-btn erp-btn--secondary"
              onClick={() => setIsDrawerOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <Button type="submit" disabled={isSubmitting} className="erp-btn erp-btn--primary">
              {isSubmitting ? "Registering..." : "Save & Generate Receipt"}
            </Button>
          </div>
        </form>
      </ErpDrawer>
    </div>
  );
}
