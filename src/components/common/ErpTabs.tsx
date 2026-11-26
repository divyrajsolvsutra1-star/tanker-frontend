export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface ErpTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export default function ErpTabs({ tabs, activeTab, onChange }: ErpTabsProps) {
  return (
    <div className="erp-tabs-row">
      <div className="erp-tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`erp-tab ${isActive ? "erp-tab--active" : ""}`}
              onClick={() => onChange(tab.id)}
            >
              {tab.label} {typeof tab.count === "number" ? `(${tab.count})` : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
