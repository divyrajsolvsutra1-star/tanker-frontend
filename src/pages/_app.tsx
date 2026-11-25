import "@/styles/globals.css";
import { useEffect } from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { AuthProvider, useAuth } from "@/lib/auth-context";

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
    router.pathname === "/" ||
    router.pathname === "/login" ||
    router.pathname === "/activate";

  useEffect(() => {
    if (!isPublicRoute && !isLoading && !user) {
      void router.replace("/login");
    }
  }, [isPublicRoute, isLoading, router, user]);

  if (!isPublicRoute && (isLoading || !user)) {
    return (
      <main className="auth-loading" aria-live="polite">
        Checking your secure session…
      </main>
    );
  }

  return <Component {...pageProps} />;
}
