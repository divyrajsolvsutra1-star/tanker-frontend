import "@/styles/globals.css";
import "@/styles/erp.css";
import { useEffect } from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import Layout from "@/components/Layout";
import { SpinnerIcon } from "@/components/common/Icons";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AuthenticatedApp Component={Component} pageProps={pageProps} />
    </AuthProvider>
  );
}

function AuthenticatedApp({
  Component,
  pageProps,
}: Pick<AppProps, "Component" | "pageProps">) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const isPublicRoute =
    router.pathname === "/login" ||
    router.pathname === "/activate";

  useEffect(() => {
    if (!isPublicRoute && !isLoading && !user) {
      void router.replace("/login");
    }
  }, [isPublicRoute, isLoading, router, user]);

  if (!isPublicRoute && (isLoading || !user)) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", color: "#64748b", gap: "10px", fontSize: "14px", fontWeight: 500 }}>
        <SpinnerIcon size={20} color="#0f766e" /> Loading application...
      </main>
    );
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
