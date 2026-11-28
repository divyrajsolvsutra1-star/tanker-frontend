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

export type UserRole = string;

export interface AuthUser {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
}

export interface UserRecord extends AuthUser {
  status: "invited" | "active" | "disabled";
  createdAt: string;
}

export interface RolePermissionSet {
  role: UserRole;
  name: string;
  permissions: Record<string, string[]>;
}

export interface RolePermissionsResponse {
  modules: string[];
  actions: string[];
  roles: RolePermissionSet[];
}

export interface ApiErrorResponse {
  error?: string;
  field?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly field?: string,
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
      body?.field,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function getApiHealth(signal?: AbortSignal) {
  return apiRequest<ApiHealth>("health", { signal });
}

export function login(email: string, password: string) {
  return apiRequest<{ user: AuthUser; expiresAt: string }>("auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser() {
  return apiRequest<{ user: AuthUser }>("auth/me");
}

export function logout() {
  return apiRequest<void>("auth/logout", { method: "POST" });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiRequest<{ user: AuthUser }>("auth/password", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function acceptInvitation(token: string, password: string) {
  return apiRequest<{ user: AuthUser; expiresAt: string }>("auth/invitations/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
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

export function deleteUserAccount(id: string) {
  return apiRequest<void>(`users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function updateUserRole(id: string, role: UserRole) {
  return apiRequest<{ user: UserRecord }>(`users/${encodeURIComponent(id)}/role`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
}

export function updateUser(
  id: string,
  input: { displayName?: string; role?: UserRole; password?: string },
) {
  return apiRequest<{ user: UserRecord; message?: string }>(`users/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function resetUserPassword(id: string, password: string) {
  return apiRequest<{ user: UserRecord; message?: string }>(
    `users/${encodeURIComponent(id)}/password`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    },
  );
}

export function activateUserAccount(id: string, password: string) {
  return apiRequest<{ user: UserRecord }>(`users/${encodeURIComponent(id)}/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}

export function getRolePermissions() {
  return apiRequest<RolePermissionsResponse>("roles/permissions");
}

export function createRole(name: string) {
  return apiRequest<RolePermissionSet>("roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function renameRole(role: UserRole, name: string) {
  return apiRequest<RolePermissionSet>(`roles/${encodeURIComponent(role)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function deleteRole(role: UserRole) {
  return apiRequest<void>(`roles/${encodeURIComponent(role)}`, {
    method: "DELETE",
  });
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

export interface PaginatedResponse<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export async function getBusinessResource<T>(
  path: string,
  params: Record<string,string|number|undefined> = {},
) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key,value])=>{
    if(value !== undefined && value !== "") query.set(key,String(value));
  });
  const suffix = query.size ? `?${query.toString()}` : "";
  return apiRequest<PaginatedResponse<T> | {items:T[]; [key:string]:unknown}>(`${path}${suffix}`);
}

export function createBusinessResource<T>(path:string, body:Record<string,unknown>) {
  return apiRequest<{item:T}>(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
}

export function updateBusinessResource<T>(path:string, id:string, body:Record<string,unknown>) {
  return apiRequest<{item:T}>(`${path}/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
}

export function deleteBusinessResource(path: string, id: string) {
  return apiRequest<void>(`${path}/${id}`, { method: "DELETE" });
}

export interface DashboardSummary {
  todayWashEntries:number;
  todayVehicles:number;
  washTypeSummary:Record<string,number>;
  statuses:{booked:number;washing:number;completed:number;delivered:number;cancelled:number};
  todayCollections:number;
  collectionByMethod:Record<string,number>;
  totalCustomerOutstanding:number;
  cashBalance:number;
  bankBalances:{id:string;name:string;bankName:string;balance:number}[];
  monthlyExpenses:number;
  creditAlerts?:unknown[];
  overduePayments?:unknown[];
}

export function getDashboardSummary() {
  return apiRequest<DashboardSummary>("dashboard");
}
