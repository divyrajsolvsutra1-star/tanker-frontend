import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import DataTable from "@/components/common/DataTable";
import Dialog from "@/components/common/Dialog";
import PageContainer from "@/components/common/PageContainer";
import { publicEnv } from "@/config/env";
import { getApiHealth } from "@/lib/api";
import type { ApiHealth } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type HealthRow = {
  component: string;
  status: string;
  detail: string;
  healthy: boolean;
};

const healthColumns = [
  {
    id: "component",
    header: "Component",
    cell: (row: HealthRow) => row.component,
  },
  {
    id: "status",
    header: "Status",
    cell: (row: HealthRow) => (
      <span
        className={`health-state ${row.healthy ? "health-state--ready" : "health-state--waiting"}`}
      >
        {row.status}
      </span>
    ),
  },
  {
    id: "detail",
    header: "Details",
    cell: (row: HealthRow) => row.detail,
  },
] as const;

export default function Home() {
  const { user, signOut } = useAuth();
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    getApiHealth(controller.signal)
      .then((result) => {
        if (!active) return;
        setHealth(result);
        setErrorMessage("");
      })
      .catch((error: unknown) => {
        if (!active || (error instanceof Error && error.name === "AbortError")) {
          return;
        }

        setHealth(null);
        setErrorMessage(
          error instanceof Error ? error.message : "The API health check failed.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [refreshKey]);

  const databaseStatus = health?.database.status ?? "unknown";
  const apiStatus = health ? "Connected" : errorMessage ? "Unavailable" : "Checking";
  const rows: HealthRow[] = [
    {
      component: "Express API",
      status: apiStatus,
      detail: health?.service ?? "Waiting for the backend health endpoint",
      healthy: health !== null,
    },
    {
      component: "MongoDB",
      status: databaseStatus,
      detail: health
        ? "Database connectivity reported by the backend"
        : "Status is available when the API responds",
      healthy: databaseStatus === "connected",
    },
  ];

  function refreshHealth() {
    setIsLoading(true);
    setRefreshKey((current) => current + 1);
  }

  return (
    <PageContainer className="dashboard-container">
      <header className="dashboard-topbar">
        <Link className="brand-mark" href="/" aria-label="Tanker Wash home">
          TANKER
          <span className="brand-mark__subtitle">WASH MANAGEMENT</span>
        </Link>
        <div className="user-header">
          {user?.role === "owner_admin" ? (
            <>
              <Link className="text-link" href="/users">
                User management
              </Link>
              <Link className="text-link" href="/roles">
                Role permissions
              </Link>
            </>
          ) : null}
          {user ? (
            <>
              <span className="dashboard-environment">{user.displayName}</span>
              <Button
                onClick={() => void signOut()}
                type="button"
                variant="secondary"
              >
                Sign out
              </Button>
            </>
          ) : (
            <Link className="text-link" href="/login">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-heading" aria-labelledby="dashboard-title">
          <div>
            <p className="intro-kicker">Operations</p>
            <h1 id="dashboard-title">Tanker Wash Management</h1>
            <p className="dashboard-description">
              Application and database connectivity. Operational records will
              appear here as the approved modules are implemented.
            </p>
          </div>
          <div className="dashboard-actions">
            <Button
              disabled={isLoading}
              onClick={refreshHealth}
              type="button"
              variant="secondary"
            >
              {isLoading ? "Checking..." : "Refresh status"}
            </Button>
            <Button
              disabled={!health && !errorMessage}
              onClick={() => setIsDialogOpen(true)}
              type="button"
            >
              Connection details
            </Button>
          </div>
        </section>

        <Card className="dashboard-card">
          <div className="dashboard-card__heading">
            <div>
              <h2>System readiness</h2>
              <p>Live status from the Express health endpoint.</p>
            </div>
            <span
              className={`health-badge ${health ? "health-badge--ready" : "health-badge--waiting"}`}
            >
              {health ? "API reachable" : isLoading ? "Checking" : "Not connected"}
            </span>
          </div>

          {errorMessage ? (
            <p className="connection-error" role="alert">
              Could not reach the backend: {errorMessage}
            </p>
          ) : null}

          {health && databaseStatus !== "connected" ? (
            <p className="connection-warning" role="status">
              MongoDB is {databaseStatus}. The backend reports this status
              directly; no sample business data is being shown.
            </p>
          ) : null}

          <DataTable
            caption="Live application and database connectivity"
            columns={healthColumns}
            emptyMessage="Checking service status..."
            getRowKey={(row) => row.component}
            rows={rows}
          />
        </Card>

        <p className="dashboard-note">
          API base URL: <code>{publicEnv.apiUrl}</code>
        </p>
      </main>

      <Dialog
        description="Live connectivity details returned by the backend."
        onOpenChange={setIsDialogOpen}
        open={isDialogOpen}
        size="small"
        title="Connection details"
      >
        <dl className="connection-details">
          <div>
            <dt>API URL</dt>
            <dd>{publicEnv.apiUrl}</dd>
          </div>
          <div>
            <dt>Backend</dt>
            <dd>{health?.service ?? "Unavailable"}</dd>
          </div>
          <div>
            <dt>MongoDB</dt>
            <dd>{databaseStatus}</dd>
          </div>
          <div>
            <dt>Last checked</dt>
            <dd>
              {health
                ? new Date(health.timestamp).toLocaleString()
                : "No successful response"}
            </dd>
          </div>
        </dl>
        {errorMessage ? <p className="connection-error">{errorMessage}</p> : null}
      </Dialog>
    </PageContainer>
  );
}
