import { publicEnv } from "@/config/env";

const apiBaseUrl = publicEnv.apiUrl.replace(/\/+$/, "");

export interface ApiHealth {
  status: "ok";
  service: string;
  database: {
    status: "connected" | "connecting" | "disconnected" | "disconnecting" | "unknown";
  };
  timestamp: string;
}

export type UserRole =
  | "owner_admin"
  | "manager"
  | "entry_operator"
  | "accountant"
  | "washer";

export interface AuthUser {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
}

export interface UserRecord extends AuthUser {
  status: "invited" | "active" | "disabled";
  createdAt: string;
}

export interface RolePermissionSet {
  role: UserRole;
  permissions: Record<string, string[]>;
}

export interface RolePermissionsResponse {
  modules: string[];
  actions: string[];
  roles: RolePermissionSet[];
}

export interface ApiErrorResponse {
  error?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const endpoint = `${apiBaseUrl}/${path.replace(/^\/+/, "")}`;
  const response = await fetch(endpoint, {
    ...init,
    credentials: init?.credentials ?? "include",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | ApiErrorResponse
      | null;
    throw new ApiError(
      body?.error ?? `API request failed (${response.status} ${response.statusText})`,
      response.status,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function getApiHealth(signal?: AbortSignal) {
  return apiRequest<ApiHealth>("health", { signal });
}

export function login(email: string, password: string, code: string) {
  return apiRequest<{ user: AuthUser; expiresAt: string }>("auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, code }),
  });
}

export function getCurrentUser() {
  return apiRequest<{ user: AuthUser }>("auth/me");
}

export function logout() {
  return apiRequest<void>("auth/logout", { method: "POST" });
}

export function acceptInvitation(token: string, password: string) {
  return apiRequest<{
    setupToken: string;
    otpauthUrl: string;
    manualSecret: string;
  }>("auth/invitations/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
}

export function confirmMfaEnrollment(setupToken: string, code: string) {
  return apiRequest<{ user: AuthUser; expiresAt: string }>("auth/mfa/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ setupToken, code }),
  });
}

export function getUsers() {
  return apiRequest<{ users: UserRecord[] }>("users");
}

export function inviteUser(input: {
  displayName: string;
  email: string;
  role: UserRole;
}) {
  return apiRequest<{
    user: UserRecord;
    activationUrl: string;
    expiresAt: string;
  }>("users/invitations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function getRolePermissions() {
  return apiRequest<RolePermissionsResponse>("roles/permissions");
}

export function saveRolePermissions(
  role: UserRole,
  permissions: Record<string, string[]>,
) {
  return apiRequest<RolePermissionSet>(`roles/${role}/permissions`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permissions }),
  });
}
