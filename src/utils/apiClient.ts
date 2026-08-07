import { API_BASE_URL, API_ENDPOINTS } from "./apiConfig";

export const getAuthHeader = () => {
  const savedTokens = localStorage.getItem("zeeshop_tokens");
  if (!savedTokens) return {};
  try {
    const parsed = JSON.parse(savedTokens);
    const accessToken =
      parsed.accessToken ||
      parsed.token ||
      parsed.jwt ||
      (typeof parsed === "string" ? parsed : null);
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  } catch {
    return {};
  }
};

export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let msg = errorData.message || errorData.error;
      if (!msg && errorData.errors && typeof errorData.errors === "object") {
        msg = Object.entries(errorData.errors)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
      }
      throw new Error(
        msg || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (err: any) {
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      console.warn(`[API Network Warning] Unable to resolve endpoint: ${endpoint}`);
      throw new Error(`Network Error: Server endpoint unavailable (${endpoint})`);
    }
    throw err;
  }
};

export const fetchProducts = async () => {
  return apiFetch(API_ENDPOINTS.PRODUCTS);
};

export const fetchCustomers = async () => {
  return apiFetch(API_ENDPOINTS.CUSTOMERS);
};

/* --- USER API ENDPOINTS --- */

export interface BackendUser {
  id: string;
  username: string;
  email: string;
  roleName: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendRole {
  id: string;
  name: string;
  description?: string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password?: string;
  roleId?: string;
  enabled?: boolean;
}

export interface UpdateUserPayload {
  username: string;
  email: string;
  password?: string;
  roleId?: string;
  enabled?: boolean;
}

export const fetchRoles = async (): Promise<BackendRole[]> => {
  try {
    const res = await apiFetch(API_ENDPOINTS.ROLES);
    return res.data || res;
  } catch {
    return [];
  }
};

export const fetchUsers = async (): Promise<BackendUser[]> => {
  const res = await apiFetch(API_ENDPOINTS.USERS);
  return res.data || res;
};

export const fetchUserById = async (id: string): Promise<BackendUser> => {
  const res = await apiFetch(`${API_ENDPOINTS.USERS}/${id}`);
  return res.data || res;
};

export const createUser = async (payload: CreateUserPayload): Promise<BackendUser> => {
  const res = await apiFetch(API_ENDPOINTS.USERS, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data || res;
};

export const updateUser = async (id: string, payload: UpdateUserPayload): Promise<BackendUser> => {
  const res = await apiFetch(`${API_ENDPOINTS.USERS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.data || res;
};

export const deleteUser = async (id: string): Promise<void> => {
  await apiFetch(`${API_ENDPOINTS.USERS}/${id}`, {
    method: "DELETE",
  });
};

export const activateUser = async (id: string): Promise<BackendUser> => {
  const res = await apiFetch(`${API_ENDPOINTS.USERS}/${id}/activate`, {
    method: "PATCH",
  });
  return res.data || res;
};

export const deactivateUser = async (id: string): Promise<BackendUser> => {
  const res = await apiFetch(`${API_ENDPOINTS.USERS}/${id}/deactivate`, {
    method: "PATCH",
  });
  return res.data || res;
};

export const fetchSales = async () => {
  return apiFetch(API_ENDPOINTS.SALES);
};
