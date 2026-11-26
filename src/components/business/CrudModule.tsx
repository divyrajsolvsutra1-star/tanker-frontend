import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Button from "@/components/common/Button";
import DataTable from "@/components/common/DataTable";
import ErpPageHeader from "@/components/common/ErpPageHeader";
import ErpStatsGrid, { StatItem } from "@/components/common/ErpStatsGrid";
import ErpTabs from "@/components/common/ErpTabs";
import ErpToolbar from "@/components/common/ErpToolbar";
import ErpDrawer from "@/components/common/ErpDrawer";
import ErpStatusBadge from "@/components/common/ErpStatusBadge";
import ErpSelect from "@/components/common/ErpSelect";
import ErpDatePicker from "@/components/common/ErpDatePicker";
import {
  RefreshIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
} from "@/components/common/Icons";
import {
  ApiError,
  createBusinessResource,
  deactivateBusinessResource,
  getBusinessResource,
  updateBusinessResource,
} from "@/lib/api";

export type CrudField = {
  name: string;
  label: string;
  type?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  min?: number;
};

type Props = {
  title: string;
  description: string;
  path: string;
  fields: CrudField[];
  permission?: boolean;
};

export default function CrudModule({ title, description, path, fields }: Props) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState<Record<string, string | number>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "inactive">("all");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getBusinessResource<Record<string, unknown>>(path, {
        search,
        limit: 100,
      });
      setItems("items" in result ? result.items : []);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load records.");
    } finally {
      setLoading(false);
    }
  }, [path, search]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  // Tab Filtering
  const filteredItems = useMemo(() => {
    if (activeTab === "all") return items;
    return items.filter((row) => {
      const status = String(row.status ?? row.active ?? "active").toLowerCase();
      if (activeTab === "active") return status === "active" || status === "true";
      return status === "inactive" || status === "false";
    });
  }, [items, activeTab]);

  // KPI Metrics
  const activeCount = useMemo(() => {
    return items.filter((r) => {
      const s = String(r.status ?? r.active ?? "active").toLowerCase();
      return s === "active" || s === "true";
    }).length;
  }, [items]);

  const inactiveCount = items.length - activeCount;

  // Calculate sum of financial field if any
  const totalValue = useMemo(() => {
    const valField = fields.find((f) =>
      ["creditLimit", "openingBalance", "amount", "balance", "rate", "monthlySalary"].includes(f.name)
    );
    if (!valField) return null;
    const sum = items.reduce((acc, row) => {
      const v = Number(row[valField.name] || 0);
      return acc + (isNaN(v) ? 0 : v);
    }, 0);
    return {
      label: `TOTAL ${valField.label.toUpperCase()}`,
      formatted: `₹ ${sum.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
    };
  }, [items, fields]);

  const statItems: StatItem[] = useMemo(() => {
    const list: StatItem[] = [
      { label: "LINES SHOWN", value: filteredItems.length },
      { label: "ACTIVE RECORDS", value: activeCount, color: "active" },
      { label: "INACTIVE / ON HOLD", value: inactiveCount, color: "inactive" },
    ];
    if (totalValue) {
      list.push({
        label: totalValue.label,
        value: totalValue.formatted,
        color: "teal",
      });
    }
    return list;
  }, [filteredItems.length, activeCount, inactiveCount, totalValue]);

  function handleOpenCreate() {
    setEditing(null);
    setForm({});
    setError("");
    setSaved("");
    setIsDrawerOpen(true);
  }

  function handleOpenEdit(id: string, row: Record<string, unknown>) {
    setEditing(id);
    const next: Record<string, string | number> = {};
    fields.forEach((f) => {
      const v = row[f.name];
      if (typeof v === "string" || typeof v === "number") {
        next[f.name] = v;
      }
    });
    setForm(next);
    setError("");
    setSaved("");
    setIsDrawerOpen(true);
  }

  function handleCloseDrawer() {
    setIsDrawerOpen(false);
    setEditing(null);
    setForm({});
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved("");
    setIsSubmitting(true);
    try {
      const body = { ...form };
      if (editing) {
        await updateBusinessResource(path, editing, body);
        setSaved("Record updated successfully.");
      } else {
        await createBusinessResource(path, body);
        setSaved("Record created successfully.");
      }
      handleCloseDrawer();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save record.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deactivate(id: string) {
    if (!window.confirm("Are you sure you want to change the status of this record?")) return;
    try {
      await deactivateBusinessResource(path, id);
      setSaved("Status updated.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update status.");
    }
  }

  // Columns for the modern table
  const columns = useMemo(() => {
    const visibleFields = fields.slice(0, 6);
    return [
      ...visibleFields.map((field) => ({
        id: field.name,
        header: field.label,
        cell: (row: Record<string, unknown>) => {
          const value = row[field.name];

          if (typeof value === "boolean") {
            return <ErpStatusBadge status={value} />;
          }

          if (typeof value === "object" && value !== null) {
            const obj = value as { name?: string; accountName?: string; code?: string };
            return obj.name || obj.accountName || obj.code || "-";
          }

          if (
            field.type === "number" &&
            typeof value === "number" &&
            ["creditLimit", "openingBalance", "amount", "balance", "rate", "monthlySalary"].includes(field.name)
          ) {
            return (
              <span className="erp-cell-number">
                ₹ {value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </span>
            );
          }

          if (field.options && typeof value === "string") {
            const opt = field.options.find((o) => o.value === value);
            const label = opt ? opt.label : value;
            return <ErpStatusBadge status={value} type="pill" label={label} />;
          }

          return String(value ?? "-");
        },
      })),
      {
        id: "status",
        header: "STATUS",
        cell: (row: Record<string, unknown>) => {
          const st = String(row.status ?? (row.active === false ? "inactive" : "active")).toLowerCase();
          return <ErpStatusBadge status={st} />;
        },
      },
      {
        id: "actions",
        header: "ACTIONS",
        align: "right" as const,
        cell: (row: Record<string, unknown>) => {
          const id = String(row._id);
          return (
            <div className="erp-table-actions">
              <button
                type="button"
                className="erp-action-btn erp-action-btn--edit"
                onClick={() => handleOpenEdit(id, row)}
                title="Edit record"
              >
                <EditIcon size={13} style={{ display: "inline-block", marginRight: "4px" }} />
                Edit
              </button>
              <button
                type="button"
                className="erp-action-btn erp-action-btn--deactivate"
                onClick={() => void deactivate(id)}
                title="Toggle status"
              >
                Deactivate
              </button>
            </div>
          );
        },
      },
    ];
  }, [fields]);

  return (
    <div className="erp-module">
      {/* Top Header with Back Button and Actions */}
      <ErpPageHeader
        title={title}
        description={description}
        backHref="/"
        backLabel="Dashboard"
        actions={
          <>
            <button
              type="button"
              className="erp-btn erp-btn--secondary"
              onClick={() => void load()}
              title="Refresh table data"
            >
              <RefreshIcon size={14} /> Refresh
            </button>
            <button
              type="button"
              className="erp-btn erp-btn--primary"
              onClick={handleOpenCreate}
            >
              <PlusIcon size={14} /> Add {title.replace(/s\b|&.*/g, "").trim()}
            </button>
          </>
        }
      />

      {/* KPI Summary Cards */}
      <ErpStatsGrid stats={statItems} />

      {/* Tabs */}
      <ErpTabs
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as "all" | "active" | "inactive")}
        tabs={[
          { id: "all", label: "All Records", count: items.length },
          { id: "active", label: "Active", count: activeCount },
          { id: "inactive", label: "Inactive", count: inactiveCount },
        ]}
      />

      {/* Alerts */}
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

      {/* Main Table Card */}
      <div className="erp-card">
        <ErpToolbar
          title={title}
          count={filteredItems.length}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={`Search ${title.toLowerCase()}...`}
        />

        <div className="erp-table-container">
          <DataTable
            caption={title}
            columns={columns}
            emptyMessage={loading ? "Loading data from server..." : `No ${title.toLowerCase()} found.`}
            getRowKey={(row) => String(row._id || Math.random())}
            rows={filteredItems}
          />
        </div>

        <div className="erp-table-footer">
          <span>Total of {filteredItems.length} line(s)</span>
          {loading && <span className="erp-loading-indicator">Updating...</span>}
        </div>
      </div>

      {/* Slide-over Drawer with Modern Custom Select & Date Pickers */}
      <ErpDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={editing ? `Edit ${title}` : `Add New ${title.replace(/s\b|&.*/g, "").trim()}`}
        subtitle="Fill out the details below to save the record in the system."
      >
        <form className="erp-drawer-form" onSubmit={submit}>
          <div className="erp-form-grid">
            {fields.map((field) => (
              <div
                key={field.name}
                className={`erp-field-group ${
                  field.name === "address" || field.name === "notes" ? "erp-field-group--full" : ""
                }`}
              >
                <label htmlFor={`erp-input-${field.name}`}>
                  {field.label}
                  {field.required && <span className="erp-required-star">*</span>}
                </label>

                {/* Custom ErpSelect Component */}
                {field.options ? (
                  <ErpSelect
                    id={`erp-input-${field.name}`}
                    required={field.required}
                    value={String(form[field.name] ?? "")}
                    options={field.options}
                    placeholder={`Select ${field.label}...`}
                    onChange={(val) => setForm({ ...form, [field.name]: val })}
                  />
                ) : field.type === "date" || field.type === "month" ? (
                  /* Custom ErpDatePicker Component */
                  <ErpDatePicker
                    id={`erp-input-${field.name}`}
                    required={field.required}
                    type={field.type}
                    value={String(form[field.name] ?? "")}
                    onChange={(val) => setForm({ ...form, [field.name]: val })}
                  />
                ) : (
                  <input
                    id={`erp-input-${field.name}`}
                    required={field.required}
                    min={field.min}
                    type={field.type || "text"}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    value={String(form[field.name] ?? "")}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [field.name]: field.type === "number" ? Number(e.target.value) : e.target.value,
                      })
                    }
                    className="erp-input"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="erp-drawer-footer">
            <button
              type="button"
              className="erp-btn erp-btn--secondary"
              onClick={handleCloseDrawer}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <Button type="submit" disabled={isSubmitting} className="erp-btn erp-btn--primary">
              {isSubmitting ? "Saving..." : editing ? "Update Record" : "Save Record"}
            </Button>
          </div>
        </form>
      </ErpDrawer>
    </div>
  );
}
