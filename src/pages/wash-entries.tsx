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
  const [employees, setEmployees] = useState<Item[]>([]);
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
    getBusinessResource<Item>("employees", { limit: 100 })
      .then((res) => setEmployees("items" in res ? res.items : []))
      .catch(() => {});
  }, []);

  // Auto-fetch rate helper when customer or wash type changes
  function updateRate(customerId: string, washTypeId: string) {
    if (!washTypeId) return;
    const wt = washTypes.find((w) => String(w._id) === washTypeId);
    if (!wt) return;
    const rates = Array.isArray(wt.rates) ? (wt.rates as { customerId?: string; amount?: number }[]) : [];
    const customRate = rates.find((r) => String(r.customerId) === customerId)?.amount;
    const rateToSet = customRate !== undefined ? customRate : Number(wt.rate || 350);
    setForm((prev) => ({ ...prev, savedRate: rateToSet, rateModified: false }));
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaved("");
    setIsSubmitting(true);
    try {
      const employeeIds = form.employeeId ? [String(form.employeeId)] : [];
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

  function printReceipt(r: Item, format: "thermal" | "a4" = "thermal") {
    const customer =
      typeof r.customerId === "object" && r.customerId
        ? (r.customerId as { name: string }).name
        : String(r.customerId || "-");
    const vehicle =
      typeof r.vehicleId === "object" && r.vehicleId
        ? (r.vehicleId as { vehicleNumber: string }).vehicleNumber
        : String(r.vehicleId || "-");
    const washType =
      typeof r.washTypeId === "object" && r.washTypeId
        ? (r.washTypeId as { name: string }).name
        : "Standard Tanker Wash";
    const employeesList = Array.isArray(r.employeeIds)
      ? r.employeeIds.map((e) => (typeof e === "object" && e ? (e as { name: string }).name : String(e))).join(", ")
      : "-";
    const entryDate = r.entryDate ? new Date(String(r.entryDate)).toLocaleString("en-IN") : new Date().toLocaleString("en-IN");
    const amount = Number(r.savedRate || 0).toLocaleString("en-IN");

    const thermalCss = `
      body { font-family: 'Courier New', monospace; width: 72mm; margin: 0 auto; padding: 12px; font-size: 12px; line-height: 1.3; color: #000; }
      .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
      .header h2 { margin: 0 0 4px; font-size: 15px; text-transform: uppercase; }
      .header p { margin: 2px 0; font-size: 11px; }
      .row { display: flex; justify-content: space-between; margin: 4px 0; }
      .divider { border-top: 1px dashed #000; margin: 8px 0; }
      .total-row { font-size: 14px; font-weight: bold; }
      .notice { text-align: center; font-size: 10px; margin-top: 10px; font-style: italic; }
      @media print { body { width: 72mm; margin: 0; padding: 4px; } }
    `;

    const a4Css = `
      body { font-family: Arial, sans-serif; max-width: 750px; margin: 20px auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13.5px; color: #1e293b; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
      .header h1 { margin: 0; font-size: 22px; color: #0f172a; }
      .header p { margin: 4px 0; color: #64748b; font-size: 12.5px; }
      .badge { display: inline-block; padding: 4px 10px; background: #e2e8f0; border-radius: 4px; font-weight: bold; font-size: 12px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
      .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 6px; }
      .box strong { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
      .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      .table th { background: #f1f5f9; padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1; font-size: 12px; }
      .table td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; }
      .total-box { margin-left: auto; width: 280px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; margin-top: 10px; }
      .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #0f172a; }
      .notice { margin-top: 30px; text-align: center; color: #64748b; font-size: 11.5px; border-top: 1px dashed #cbd5e1; padding-top: 12px; }
      @media print { body { border: none; padding: 0; margin: 0; max-width: 100%; } }
    `;

    const html = format === "thermal" ? `
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Slip #${String(r.entryNumber)}</title><style>${thermalCss}</style></head>
      <body>
        <div class="header">
          <h2>TANKER WASH SERVICES</h2>
          <p>Solvsutra Wash Management Center</p>
          <p>Ph: +91 98765 43210</p>
        </div>
        <div class="row"><span>Slip No:</span><strong>#${String(r.entryNumber)}</strong></div>
        <div class="row"><span>Date/Time:</span><span>${entryDate}</span></div>
        <div class="divider"></div>
        <div class="row"><span>Customer:</span><strong>${customer}</strong></div>
        <div class="row"><span>Vehicle No:</span><strong>${vehicle}</strong></div>
        <div class="row"><span>Driver:</span><span>${String(r.driverName || "-")} (${String(r.driverMobileNumber || "-")})</span></div>
        <div class="row"><span>Service:</span><span>${washType}</span></div>
        ${employeesList !== "-" ? `<div class="row"><span>Washers:</span><span>${employeesList}</span></div>` : ""}
        <div class="divider"></div>
        <div class="row total-row"><span>Wash Charge:</span><span>₹ ${amount}</span></div>
        <div class="row"><span>Payment:</span><span>${String(r.paymentType).toUpperCase()} ${r.paymentMethod ? `(${String(r.paymentMethod).toUpperCase()})` : ""}</span></div>
        <div class="row"><span>Status:</span><span>${String(r.status).toUpperCase()}</span></div>
        <div class="notice">
          *** Normal Service / Wash Slip ***<br/>
          (Not a GST tax invoice)
        </div>
        <script>window.onload=()=>window.print();<\/script>
      </body></html>
    ` : `
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt #${String(r.entryNumber)}</title><style>${a4Css}</style></head>
      <body>
        <div class="header">
          <div>
            <h1>TANKER WASH MANAGEMENT SYSTEM</h1>
            <p>Professional Tanker Chemical & High-Pressure Wash Center</p>
            <p>Highway Bypass Junction, Industrial Zone | Phone: +91 98765 43210</p>
          </div>
          <div style="text-align: right;">
            <span class="badge">WASH RECEIPT</span>
            <h3 style="margin: 6px 0 0; color: #0f172a;">#${String(r.entryNumber)}</h3>
            <p style="margin: 2px 0;">${entryDate}</p>
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <strong>Customer / Company</strong>
            <div style="font-size: 15px; font-weight: bold; color: #0f172a;">${customer}</div>
            <div style="color: #64748b; font-size: 12px; margin-top: 4px;">Terms: ${String(r.paymentType).toUpperCase()}</div>
          </div>
          <div class="box">
            <strong>Tanker & Driver Details</strong>
            <div style="font-size: 15px; font-weight: bold; color: #0f172a;">Vehicle: ${vehicle}</div>
            <div style="color: #475569; font-size: 12.5px; margin-top: 4px;">Driver: ${String(r.driverName || "Standard")} | Mob: ${String(r.driverMobileNumber || "-")}</div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Description / Wash Service</th>
              <th>Assigned Washers</th>
              <th>Payment Mode</th>
              <th style="text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${washType}</strong></td>
              <td>${employeesList}</td>
              <td>${String(r.paymentType).toUpperCase()} ${r.paymentMethod ? `(${String(r.paymentMethod).toUpperCase()})` : ""}</td>
              <td style="text-align: right; font-weight: bold; color: #0f766e;">₹ ${amount}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-row">
            <span>Total Payable:</span>
            <span>₹ ${amount}</span>
          </div>
          <div style="font-size: 12px; color: #64748b; margin-top: 6px; text-align: right;">
            Wash Status: <strong style="color: #0f172a; text-transform: uppercase;">${String(r.status)}</strong>
          </div>
        </div>

        <div class="notice">
          This receipt is an operational tanker wash service receipt. As per proposal, this is not a GST tax invoice.<br/>
          Thank you for choosing Tanker Wash Services!
        </div>
        <script>window.onload=()=>window.print();<\/script>
      </body></html>
    `;

    const win = window.open("", "", format === "thermal" ? "width=420,height=600" : "width=850,height=800");
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

  const vehicleOptions = useMemo(() => {
    const list = form.customerId
      ? vehicles.filter((v) => {
          const cid = typeof v.customerId === "object" && v.customerId ? (v.customerId as { _id: string })._id : v.customerId;
          return String(cid) === String(form.customerId);
        })
      : vehicles;

    return list.map((v) => ({
      value: String(v._id),
      label: `${String(v.vehicleNumber)} - Driver: ${String(v.driverName || "Standard")}`,
    }));
  }, [vehicles, form.customerId]);

  const washTypeOptions = useMemo(
    () =>
      washTypes.map((wt) => ({
        value: String(wt._id),
        label: `${String(wt.name)}`,
      })),
    [washTypes]
  );

  const employeeOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: String(e._id),
        label: `${String(e.name)} (${String(e.designation || "Washer")})`,
      })),
    [employees]
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
              className="erp-action-btn"
              onClick={() => printReceipt(r, "thermal")}
              title="Print Thermal Slip (72mm)"
            >
              <PrintIcon size={12} style={{ display: "inline-block", marginRight: "3px" }} />
              Thermal
            </button>
            <button
              type="button"
              className="erp-action-btn"
              onClick={() => printReceipt(r, "a4")}
              title="Print A4 Receipt"
            >
              <PrintIcon size={12} style={{ display: "inline-block", marginRight: "3px" }} />
              A4
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
        description="Check-in tanker vehicles, assign washers, track live washing stage and print service receipts."
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
                onChange={(val) => {
                  setForm((prev) => ({ ...prev, customerId: val, vehicleId: "" }));
                  if (form.washTypeId) {
                    updateRate(val, String(form.washTypeId));
                  }
                }}
              />
            </div>

            <div className="erp-field-group">
              <label>Select Vehicle*</label>
              <ErpSelect
                required
                value={String(form.vehicleId || "")}
                options={vehicleOptions}
                placeholder="-- Choose Vehicle --"
                onChange={(val) => {
                  const veh = vehicles.find((v) => String(v._id) === val);
                  const custId = veh && typeof veh.customerId === "object" && veh.customerId ? String((veh.customerId as { _id: string })._id) : String(veh?.customerId || "");
                  setForm((prev) => ({
                    ...prev,
                    vehicleId: val,
                    customerId: prev.customerId || custId,
                    driverName: prev.driverName || String(veh?.driverName || ""),
                    driverMobileNumber: prev.driverMobileNumber || String(veh?.driverMobileNumber || ""),
                  }));
                }}
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
                  setForm((prev) => ({ ...prev, washTypeId: val }));
                  updateRate(String(form.customerId || ""), val);
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
              <label>Assign Washer / Employee</label>
              <ErpSelect
                value={String(form.employeeId || "")}
                options={employeeOptions}
                placeholder="-- Optional Washer Assignment --"
                onChange={(val) => setForm({ ...form, employeeId: val })}
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
