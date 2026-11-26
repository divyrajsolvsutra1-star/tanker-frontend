export interface StatItem {
  label: string;
  value: string | number;
  color?: "active" | "inactive" | "teal" | "default";
}

interface ErpStatsGridProps {
  stats: StatItem[];
}

export default function ErpStatsGrid({ stats }: ErpStatsGridProps) {
  if (!stats || stats.length === 0) return null;

  return (
    <div className="erp-stats-grid">
      {stats.map((stat, idx) => {
        let colorClass = "";
        if (stat.color === "active") colorClass = "erp-stat-value--active";
        else if (stat.color === "inactive") colorClass = "erp-stat-value--inactive";
        else if (stat.color === "teal") colorClass = "erp-stat-value--teal";

        return (
          <div key={idx} className="erp-stat-card">
            <span className="erp-stat-label">{stat.label}</span>
            <strong className={`erp-stat-value ${colorClass}`}>{stat.value}</strong>
          </div>
        );
      })}
    </div>
  );
}
