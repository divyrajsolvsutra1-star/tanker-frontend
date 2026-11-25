import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  confirmMfaEnrollment,
  getCurrentUser,
  login,
  logout,
} from "@/lib/api";
import type { AuthUser } from "@/lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string, code: string) => Promise<void>;
  finishMfaEnrollment: (setupToken: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then(({ user: currentUser }) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, code: string) => {
      const result = await login(email, password, code);
      setUser(result.user);
    },
    [],
  );

  const finishMfaEnrollment = useCallback(
    async (setupToken: string, code: string) => {
      const result = await confirmMfaEnrollment(setupToken, code);
      setUser(result.user);
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, signIn, finishMfaEnrollment, signOut }),
    [user, isLoading, signIn, finishMfaEnrollment, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
