import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
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
  AlertTriangleIcon,
  RefreshIcon,
  PlusIcon,
} from "@/components/common/Icons";
import IconActionButton from "@/components/common/IconActionButton";
import {
  ApiError,
  createBusinessResource,
  deleteBusinessResource,
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
  maxLength?: number;
  pattern?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  validationMessage?: string;
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!pendingDeleteId) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPendingDeleteId(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingDeleteId]);

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
    setFieldErrors({});
    setIsDrawerOpen(true);
  }

  const handleOpenEdit = useCallback((id: string, row: Record<string, unknown>) => {
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
    setFieldErrors({});
    setIsDrawerOpen(true);
  }, [fields]);

  function handleCloseDrawer() {
    setIsDrawerOpen(false);
    setEditing(null);
    setForm({});
    setFieldErrors({});
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved("");

    // Required + format validation (client-side)
    const errors: Record<string, string> = {};
    fields.forEach((f) => {
      const val = form[f.name];
      const isEmpty = val === undefined || val === null || String(val).trim() === "";
      if (f.required && isEmpty) {
        errors[f.name] = `${f.label} is required. Please fill this field.`;
        return;
      }
      if (!isEmpty && f.pattern && !new RegExp(`^(?:${f.pattern})$`).test(String(val))) {
        errors[f.name] = f.validationMessage || `Enter a valid ${f.label.toLowerCase()}.`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fill in all required fields marked with * before saving.");
      return;
    }

    setFieldErrors({});
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

  const deleteRecord = useCallback(async (id: string) => {
    setError("");
    setSaved("");
    try {
      await deleteBusinessResource(path, id);
      setSaved("Record deleted permanently.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete record.");
    }
  }, [load, path]);

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
              <IconActionButton
                action="edit"
                onClick={() => handleOpenEdit(id, row)}
                title="Edit record"
              />
              <IconActionButton
                action="delete"
                onClick={() => setPendingDeleteId(id)}
                title="Permanently delete record"
              />
            </div>
          );
        },
      },
    ];
  }, [fields, handleOpenEdit]);

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
            {fields.map((field) => {
              const hasErr = Boolean(fieldErrors[field.name]);
              return (
                <div
                  key={field.name}
                  className={`erp-field-group ${hasErr ? "erp-field-group--error" : ""} ${
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
                      hasError={hasErr}
                      value={String(form[field.name] ?? "")}
                      options={field.options}
                      placeholder={`Select ${field.label}...`}
                      onChange={(val) => {
                        setForm({ ...form, [field.name]: val });
                        if (fieldErrors[field.name]) {
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next[field.name];
                            return next;
                          });
                        }
                      }}
                    />
                  ) : field.type === "date" || field.type === "month" ? (
                    /* Custom ErpDatePicker Component */
                    <ErpDatePicker
                      id={`erp-input-${field.name}`}
                      required={field.required}
                      hasError={hasErr}
                      type={field.type}
                      value={String(form[field.name] ?? "")}
                      onChange={(val) => {
                        setForm({ ...form, [field.name]: val });
                        if (fieldErrors[field.name]) {
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next[field.name];
                            return next;
                          });
                        }
                      }}
                    />
                  ) : (
                    <input
                      id={`erp-input-${field.name}`}
                      required={field.required}
                      min={field.min}
                      maxLength={field.maxLength}
                      pattern={field.pattern}
                      inputMode={field.inputMode}
                      type={field.type || "text"}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      value={String(form[field.name] ?? "")}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const next =
                          field.inputMode === "numeric" ? raw.replace(/\D/g, "").slice(0, field.maxLength) : raw;
                        setForm({
                          ...form,
                          [field.name]: field.type === "number" ? Number(next) : next,
                        });
                        if (fieldErrors[field.name]) {
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next[field.name];
                            return next;
                          });
                        }
                      }}
                      className={`erp-input ${hasErr ? "erp-input--error" : ""}`}
                    />
                  )}

                  {hasErr && (
                    <span className="erp-field-error-msg">{fieldErrors[field.name]}</span>
                  )}
                </div>
              );
            })}
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

      {pendingDeleteId ? (
        <div
          className="modal-overlay"
          onClick={() => setPendingDeleteId(null)}
        >
          <div
            aria-describedby="delete-confirm-description"
            aria-labelledby="delete-confirm-title"
            aria-modal="true"
            className="modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-header">
              <h2
                className="modal-title"
                id="delete-confirm-title"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <AlertTriangleIcon size={20} color="#dc2626" />
                Confirm permanent delete
              </h2>
            </div>
            <div className="modal-body">
              <p id="delete-confirm-description">
                This will permanently delete the record. Deletion is blocked while other records still reference it.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setPendingDeleteId(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  const id = pendingDeleteId;
                  setPendingDeleteId(null);
                  void deleteRecord(id);
                }}
                type="button"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
