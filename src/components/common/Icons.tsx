import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
};

const defaultProps = (props: IconProps) => ({
  width: props.size || props.width || 18,
  height: props.size || props.height || 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: props.strokeWidth || 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const TruckIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M15 18H9" />
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14v10Z" />
    <circle cx="17" cy="18.5" r="2.5" />
    <circle cx="7" cy="18.5" r="2.5" />
  </svg>
);

export const DashboardIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
);

export const DailySalesIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
    <path d="m9 16 2 2 4-4" />
  </svg>
);

export const ReturnsIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

export const CustomersIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const VehiclesIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

export const WashEntriesIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

export const WashTypesIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <path d="M7 7h.01" />
  </svg>
);

export const LedgerIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="M6 6h10" />
    <path d="M6 10h10" />
    <path d="M6 14h6" />
  </svg>
);

export const BankAccountsIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <line x1="3" x2="21" y1="22" y2="22" />
    <line x1="6" x2="6" y1="18" y2="11" />
    <line x1="10" x2="10" y1="18" y2="11" />
    <line x1="14" x2="14" y1="18" y2="11" />
    <line x1="18" x2="18" y1="18" y2="11" />
    <polygon points="12 2 20 7 4 7" />
  </svg>
);

export const ExpensesIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M12 2v20" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

export const EmployeesIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" x2="20" y1="8" y2="14" />
    <line x1="23" x2="17" y1="11" y2="11" />
  </svg>
);

export const SalaryIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <rect width="20" height="12" x="2" y="6" rx="2" />
    <circle cx="12" cy="12" r="2" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);

export const AccountingIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <rect width="16" height="20" x="4" y="2" rx="2" />
    <line x1="8" x2="16" y1="6" y2="6" />
    <line x1="16" x2="16" y1="14" y2="18" />
    <path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01" />
  </svg>
);

export const ReportsIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

export const UsersIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const RolesIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const AuditIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 14 14" />
  </svg>
);

export const SettingsIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const BellIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export const SearchIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const PlusIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

export const RefreshIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

export const EditIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

export const TrashIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

export const ChevronDownIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ChevronLeftIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const ChevronRightIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export const CalendarIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const CloseIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const PrintIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect width="12" height="8" x="6" y="14" />
  </svg>
);

export const KeyIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
  </svg>
);

export const AlertTriangleIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" x2="12" y1="9" y2="13" />
    <line x1="12" x2="12.01" y1="17" y2="17" />
  </svg>
);

export const CheckCircleIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export const MailIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

export const LockIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const EyeIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

export const ZapIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export const ShieldCheckIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const FileTextIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

export const InfoIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

export const SpinnerIcon = (props: IconProps) => (
  <svg
    {...defaultProps(props)}
    style={{ animation: "erp-spin 1s linear infinite", ...props.style }}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export const DropletIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

export const DownloadIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);


export const BuildingIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
  </svg>
);

export const UserIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const XIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const SparkleIcon = (props: IconProps) => (
  <svg {...defaultProps(props)}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);
