import { useEffect } from "react";
import { useRouter } from "next/router";
import {
  CustomersIcon,
  VehiclesIcon,
  WashEntriesIcon,
  WashTypesIcon,
  BankAccountsIcon,
  EmployeesIcon,
  ExpensesIcon,
  XIcon,
} from "@/components/common/Icons";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenCustomer: () => void;
  onOpenVehicle: () => void;
  onOpenWashType: () => void;
  onOpenBankAccount: () => void;
  onOpenEmployee: () => void;
  onOpenExpenseCategory?: () => void;
}

export default function QuickMasterPaletteModal({
  isOpen,
  onClose,
  onOpenCustomer,
  onOpenVehicle,
  onOpenWashType,
  onOpenBankAccount,
  onOpenEmployee,
  onOpenExpenseCategory,
}: Props) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      title: "New Wash Entry",
      description: "Quick tanker check-in & counter slip",
      icon: <WashEntriesIcon size={20} />,
      shortcut: "Alt + W",
      color: "#0f766e",
      onClick: () => {
        onClose();
        void router.push("/wash-entries?action=new");
      },
    },
    {
      title: "Add Customer / Company",
      description: "Register customer company or transporter",
      icon: <CustomersIcon size={20} />,
      shortcut: "Alt + C",
      color: "#2563eb",
      onClick: () => {
        onClose();
        onOpenCustomer();
      },
    },
    {
      title: "Add Tanker Vehicle",
      description: "Register vehicle & assign customer",
      icon: <VehiclesIcon size={20} />,
      shortcut: "Alt + V",
      color: "#7c3aed",
      onClick: () => {
        onClose();
        onOpenVehicle();
      },
    },
    {
      title: "Add Wash Service Type",
      description: "Create wash type & set base charge rate",
      icon: <WashTypesIcon size={20} />,
      shortcut: "Alt + T",
      color: "#0891b2",
      onClick: () => {
        onClose();
        onOpenWashType();
      },
    },
    {
      title: "Record Operating Expense",
      description: "Add daily water, electricity or repair cost",
      icon: <ExpensesIcon size={20} />,
      shortcut: "Alt + E",
      color: "#ea580c",
      onClick: () => {
        onClose();
        void router.push("/expenses?action=new");
      },
    },
    {
      title: "Add Cash / Bank Account",
      description: "Set up bank account or cash ledger",
      icon: <BankAccountsIcon size={20} />,
      shortcut: "",
      color: "#059669",
      onClick: () => {
        onClose();
        onOpenBankAccount();
      },
    },
    {
      title: "Add Employee / Washer",
      description: "Register washer staff or supervisor",
      icon: <EmployeesIcon size={20} />,
      shortcut: "",
      color: "#475569",
      onClick: () => {
        onClose();
        onOpenEmployee();
      },
    },
    {
      title: "Add Expense Category",
      description: "Create category for fuel, chemicals, maintenance",
      icon: <ExpensesIcon size={20} />,
      shortcut: "",
      color: "#d97706",
      onClick: () => {
        onClose();
        onOpenExpenseCategory?.();
      },
    },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal quick-palette-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "620px", width: "95%", borderRadius: "12px", overflow: "hidden" }}
      >
        <div className="modal-header quick-master-header" style={{ padding: "16px 20px" }}>
          <h2 className="modal-title" style={{ fontSize: "16px" }}>Fast Master & Entry Shortcuts</h2>
          <button
            type="button"
            className="quick-master-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="quick-palette-body" style={{ padding: "16px", maxHeight: "450px", overflowY: "auto" }}>
          <p style={{ margin: "0 0 14px 4px", fontSize: "13px", color: "#334155", fontWeight: 500 }}>
            Select an action or use keyboard shortcuts anytime to open quick masters without leaving your screen:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {actions.map((act) => (
              <button
                key={act.title}
                type="button"
                onClick={act.onClick}
                className="quick-palette-btn"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  background: "#ffffff",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: `${act.color}15`,
                    color: act.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {act.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                      {act.title}
                    </span>
                    {act.shortcut && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          background: "#f1f5f9",
                          borderRadius: "4px",
                          color: "#334155",
                          border: "1px solid #cbd5e1",
                          fontFamily: "monospace",
                        }}
                      >
                        {act.shortcut}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "#475569",
                      marginTop: "3px",
                      lineHeight: "1.35",
                      fontWeight: 500,
                    }}
                  >
                    {act.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div
          className="modal-footer quick-master-footer"
          style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <span className="quick-modal-esc">
            <kbd>ESC</kbd> to close
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: "6px 14px", fontSize: "12.5px" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
