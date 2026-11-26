import { useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangleIcon, EditIcon, FileTextIcon, TrashIcon } from "@/components/common/Icons";

export interface Column<Row extends object> {
  key: keyof Row & string;
  label: string;
  render?: (value: Row[keyof Row], row: Row) => ReactNode;
  width?: string;
}

export interface DataTableProps<T extends object> {
  data: T[];
  columns: Column<T>[];
  title: string;
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  actions?: boolean;
}

export default function DataTable<T extends { _id?: string; id?: string }>({
  data,
  columns,
  title,
  onAdd,
  onEdit,
  onDelete,
  loading = false,
  emptyMessage = "No data available",
  actions = true,
}: DataTableProps<T>) {
  const [deleteConfirm, setDeleteConfirm] = useState<T | null>(null);

  const getItemId = (item: T) => {
    const id = item._id ?? item.id;
    if (!id) {
      throw new Error("Every data table row must have an _id or id.");
    }
    return id;
  };

  const renderValue = (value: unknown): ReactNode => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string" || typeof value === "number") return value;
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{title}</h2>
          {onAdd && (
            <button className="btn btn-primary" onClick={onAdd} type="button">
              <span>+</span> New {title}
            </button>
          )}
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">
            <FileTextIcon size={36} />
          </div>
          <p>{emptyMessage}</p>
          {onAdd && (
            <button className="btn btn-primary" onClick={onAdd} style={{ marginTop: "16px" }} type="button">
              Add First Record
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {title} <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>({data.length})</span>
          </h2>
          {onAdd && (
            <button className="btn btn-primary" onClick={onAdd} type="button">
              <span>+</span> New {title}
            </button>
          )}
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} style={{ width: col.width }}>
                    {col.label}
                  </th>
                ))}
                {actions && <th style={{ width: "150px" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={getItemId(row)}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render
                        ? col.render(row[col.key], row)
                        : renderValue(row[col.key])}
                    </td>
                  ))}
                  {actions && (
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {onEdit && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onEdit(row)}
                            title="Edit"
                            type="button"
                          >
                            <EditIcon size={14} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteConfirm(row)}
                            title="Delete"
                            type="button"
                          >
                            <TrashIcon size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangleIcon size={20} color="#dc2626" /> Confirm Delete
              </h2>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this record? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (deleteConfirm && onDelete) {
                    onDelete(deleteConfirm);
                    setDeleteConfirm(null);
                  }
                }}
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
