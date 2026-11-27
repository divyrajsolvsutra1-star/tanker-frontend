import { useRouter } from "next/router";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { ReactNode, useMemo } from "react";
import {
  TruckIcon,
  DashboardIcon,
  DailySalesIcon,
  ReturnsIcon,
  CustomersIcon,
  VehiclesIcon,
  WashEntriesIcon,
  WashTypesIcon,
  LedgerIcon,
  BankAccountsIcon,
  ExpensesIcon,
  EmployeesIcon,
  SalaryIcon,
  AccountingIcon,
  ReportsIcon,
  UsersIcon,
  RolesIcon,
  AuditIcon,
  SettingsIcon,
  BellIcon,
} from "@/components/common/Icons";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const menuItems = [
  {
    section: "MAIN",
    items: [
      { icon: <DashboardIcon size={17} />, label: "Dashboard", href: "/" },
      { icon: <DailySalesIcon size={17} />, label: "Daily Sales", href: "/daily-sales" },
      { icon: <ReturnsIcon size={17} />, label: "Returns", href: "/returns" },
    ],
  },
  {
    section: "OPERATIONS",
    items: [
      { icon: <CustomersIcon size={17} />, label: "Customers", href: "/customers" },
      { icon: <VehiclesIcon size={17} />, label: "Vehicles", href: "/vehicles" },
      { icon: <WashEntriesIcon size={17} />, label: "Wash Entries", href: "/wash-entries" },
      { icon: <WashTypesIcon size={17} />, label: "Wash Types", href: "/wash-types" },
    ],
  },
  {
    section: "FINANCE",
    items: [
      { icon: <LedgerIcon size={17} />, label: "Ledger", href: "/ledger" },
      { icon: <BankAccountsIcon size={17} />, label: "Bank Accounts", href: "/bank-accounts" },
      { icon: <ExpensesIcon size={17} />, label: "Expenses", href: "/expenses" },
      { icon: <EmployeesIcon size={17} />, label: "Employees", href: "/employees" },
      { icon: <SalaryIcon size={17} />, label: "Salary", href: "/salary" },
    ],
  },
  {
    section: "ACCOUNTING",
    items: [
      { icon: <AccountingIcon size={17} />, label: "Accounting", href: "/accounting" },
      { icon: <ReportsIcon size={17} />, label: "Reports", href: "/reports" },
    ],
  },
  {
    section: "SETUP",
    items: [
      { icon: <UsersIcon size={17} />, label: "Users", href: "/users" },
      { icon: <RolesIcon size={17} />, label: "Roles", href: "/roles" },
      { icon: <AuditIcon size={17} />, label: "Audit Logs", href: "/audit" },
      { icon: <SettingsIcon size={17} />, label: "Settings", href: "/settings" },
    ],
  },
];

export default function Layout({ children, title, description }: LayoutProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const isPublicRoute = router.pathname === "/login" || router.pathname === "/activate";

  const currentItem = useMemo(() => {
    return menuItems
      .flatMap((s) => s.items.map((i) => ({ ...i, section: s.section })))
      .find((i) => i.href === router.pathname);
  }, [router.pathname]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    await router.push("/login");
  };

  const displayTitle = title || currentItem?.label || "Dashboard";
  const displaySection = currentItem?.section || "Operations";

  return (
    <main className="app-layout">
      {/* Sidebar matching Drixo ERP */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-brand">
            <span className="sidebar-logo-icon" aria-hidden="true">
              <TruckIcon size={20} color="#ffffff" />
            </span>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">TANKER</span>
              <span className="sidebar-brand-sub">WASH MANAGEMENT</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((section) => (
            <div key={section.section} className="sidebar-section">
              <div className="sidebar-label">{section.section}</div>
              <ul className="sidebar-nav">
                {section.items.map((item) => {
                  const isActive = router.pathname === item.href;
                  return (
                    <li key={item.href} className="sidebar-item">
                      <Link
                        href={item.href}
                        prefetch
                        onMouseEnter={() => {
                          void router.prefetch(item.href);
                        }}
                        className={`sidebar-link ${isActive ? "active" : ""}`}
                      >
                        <span className="sidebar-icon">{item.icon}</span>
                        <span className="sidebar-text">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Modern Topbar matching Drixo ERP */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-breadcrumb">
              <span className="topbar-section-pill">{displaySection}</span>
              <span className="topbar-sep">&rsaquo;</span>
              <span className="topbar-page-name">{displayTitle}</span>
            </div>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="topbar-icon-btn"
              title="Notifications"
              aria-label="Notifications"
            >
              <BellIcon size={17} />
            </button>

            <div className="topbar-user-pill">
              <div className="topbar-avatar">
                {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="topbar-user-info">
                <span className="topbar-user-name">
                  {user.displayName || user.email?.split("@")[0]}
                </span>
                <span className="topbar-user-role">{user.role || "Super Admin"}</span>
              </div>
            </div>

            <Link href="/settings" className="topbar-btn-pill">
              Settings
            </Link>

            <button
              onClick={handleSignOut}
              className="topbar-btn-pill topbar-btn-pill--signout"
              type="button"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Page Container */}
        <div className="page-container">
          {children}
        </div>
      </div>
    </main>
  );
}
