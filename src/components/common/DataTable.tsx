import type { Key, ReactNode } from "react";

export interface DataTableColumn<Row> {
  id: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<Row> {
  caption: string;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => Key;
  emptyMessage?: string;
}

export default function DataTable<Row>({
  caption,
  columns,
  rows,
  getRowKey,
  emptyMessage = "No records found.",
}: DataTableProps<Row>) {
  if (columns.length === 0) {
    throw new Error("DataTable requires at least one column.");
  }

  return (
    <div className="table-scroll-region">
      <table className="data-table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                className={`data-table__cell data-table__cell--${column.align ?? "left"}`}
                key={column.id}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="data-table__empty" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => (
                  <td
                    className={`data-table__cell data-table__cell--${column.align ?? "left"}`}
                    key={column.id}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
