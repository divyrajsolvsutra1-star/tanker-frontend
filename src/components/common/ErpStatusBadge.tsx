interface ErpStatusBadgeProps {
  status: string | boolean;
  type?: "status" | "pill";
  label?: string;
}

export default function ErpStatusBadge({
  status,
  type = "status",
  label,
}: ErpStatusBadgeProps) {
  if (type === "status") {
    const isAct =
      status === true ||
      String(status).toLowerCase() === "active" ||
      String(status).toLowerCase() === "completed";

    return (
      <span className={`erp-status-pill ${isAct ? "erp-status--active" : "erp-status--inactive"}`}>
        <span className="erp-status-dot" aria-hidden="true" />
        {label || (isAct ? "Active" : "Inactive")}
      </span>
    );
  }

  // Pill badge for category/type (company, individual, etc.)
  const strStatus = String(status).toLowerCase();
  let pillClass = "erp-pill";
  if (strStatus === "company") pillClass += " erp-pill--company";
  else if (strStatus === "individual") pillClass += " erp-pill--individual";

  return <span className={pillClass}>{label || String(status)}</span>;
}
