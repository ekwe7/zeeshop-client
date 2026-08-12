import { API_BASE_URL, API_ENDPOINTS } from "./apiConfig";

export const getAuthHeader = () => {
  const directToken = localStorage.getItem("accessToken");
  if (directToken) {
    return { Authorization: `Bearer ${directToken}` };
  }

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

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const savedTokens = localStorage.getItem("zeeshop_tokens");
    let refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken && savedTokens) {
      const parsed = JSON.parse(savedTokens);
      refreshToken = parsed.refreshToken;
    }

    if (!refreshToken) return null;

    const res = await fetch(API_ENDPOINTS.REFRESH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const payload = data.data || data;
    const newAccessToken = payload.accessToken || payload.token || payload.jwt;

    if (newAccessToken) {
      localStorage.setItem("accessToken", newAccessToken);
      if (savedTokens) {
        const parsed = JSON.parse(savedTokens);
        localStorage.setItem(
          "zeeshop_tokens",
          JSON.stringify({ ...parsed, accessToken: newAccessToken })
        );
      }
      return newAccessToken;
    }
  } catch {
    return null;
  }
  return null;
};

export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  let headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  try {
    let response = await fetch(endpoint, {
      ...options,
      headers,
    });

    // If 401 Unauthorized, attempt token refresh once
    if (response.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers = {
          ...headers,
          Authorization: `Bearer ${newToken}`,
        };
        response = await fetch(endpoint, {
          ...options,
          headers,
        });
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let msg = "";

      if (errorData.errors && typeof errorData.errors === "object") {
        if (Array.isArray(errorData.errors)) {
          msg = errorData.errors
            .map((e: any) => (typeof e === "string" ? e : e.message || e.defaultMessage || JSON.stringify(e)))
            .join("; ");
        } else {
          msg = Object.entries(errorData.errors)
            .map(([k, v]) => `${k}: ${v}`)
            .join("; ");
        }
      }

      if (!msg) {
        msg = errorData.message || errorData.error || errorData.detail;
      }

      throw new Error(
        msg || `HTTP ${response.status}: Validation failed (${response.statusText})`
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

export interface ProductPayload {
  name: string;
  sku: string;
  description?: string;
  price: number;
  categoryId?: string;
  unitId?: string;
  initialQuantity?: number;
  lowStockThreshold?: number;
}

export interface CategoryPayload {
  name: string;
  description?: string;
}

export interface FetchProductsParams {
  name?: string;
  categoryId?: string;
  unitId?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const fetchProducts = async (params?: FetchProductsParams) => {
  const query = new URLSearchParams();
  if (params?.name) query.append("name", params.name);
  if (params?.categoryId) query.append("categoryId", params.categoryId);
  if (params?.unitId) query.append("unitId", params.unitId);
  if (params?.page !== undefined) query.append("page", params.page.toString());
  if (params?.size !== undefined) query.append("size", params.size.toString());
  if (params?.sort) query.append("sort", params.sort);

  const queryString = query.toString();
  const url = queryString
    ? `${API_ENDPOINTS.PRODUCTS}?${queryString}`
    : API_ENDPOINTS.PRODUCTS;

  const res = await apiFetch(url);
  return res.data || res;
};

export const fetchProductById = async (id: string) => {
  const res = await apiFetch(`${API_ENDPOINTS.PRODUCTS}/${id}`);
  return res.data || res;
};

export const createProduct = async (payload: ProductPayload) => {
  const res = await apiFetch(API_ENDPOINTS.PRODUCTS, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data || res;
};

export const updateProduct = async (id: string, payload: ProductPayload) => {
  const res = await apiFetch(`${API_ENDPOINTS.PRODUCTS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.data || res;
};

export const deleteProduct = async (id: string) => {
  const res = await apiFetch(`${API_ENDPOINTS.PRODUCTS}/${id}`, {
    method: "DELETE",
  });
  return res.data || res;
};

export interface UnitPayload {
  name: string;
  symbol: string;
}

export const fetchUnits = async () => {
  const res = await apiFetch(API_ENDPOINTS.UNITS);
  return res.data || res;
};

export const fetchUnitById = async (id: string) => {
  const res = await apiFetch(`${API_ENDPOINTS.UNITS}/${id}`);
  return res.data || res;
};

export const createUnit = async (payload: UnitPayload) => {
  const res = await apiFetch(API_ENDPOINTS.UNITS, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data || res;
};

export const updateUnit = async (id: string, payload: UnitPayload) => {
  const res = await apiFetch(`${API_ENDPOINTS.UNITS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.data || res;
};

export const deleteUnit = async (id: string) => {
  const res = await apiFetch(`${API_ENDPOINTS.UNITS}/${id}`, {
    method: "DELETE",
  });
  return res.data || res;
};

/* --- CATEGORY ENDPOINTS --- */

export const fetchCategories = async () => {
  const res = await apiFetch(API_ENDPOINTS.CATEGORIES);
  return res.data || res;
};

export const createCategory = async (payload: CategoryPayload) => {
  const res = await apiFetch(API_ENDPOINTS.CATEGORIES, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data || res;
};

export const updateCategory = async (id: string, payload: CategoryPayload) => {
  const res = await apiFetch(`${API_ENDPOINTS.CATEGORIES}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.data || res;
};

export const deleteCategory = async (id: string) => {
  const res = await apiFetch(`${API_ENDPOINTS.CATEGORIES}/${id}`, {
    method: "DELETE",
  });
  return res.data || res;
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
  role?: string;
  roleId?: string;
  enabled?: boolean;
}

export interface UpdateUserPayload {
  username: string;
  email: string;
  password?: string;
  role?: string;
  roleId?: string;
  enabled?: boolean;
}

export const fetchRoles = async (): Promise<BackendRole[]> => {
  try {
    const res = await apiFetch(API_ENDPOINTS.ROLES);
    const rolesList: BackendRole[] = res.data || res;
    if (Array.isArray(rolesList) && rolesList.length > 0) {
      return rolesList.filter((r) => r.name.toUpperCase() !== "ADMIN" && r.id.toUpperCase() !== "ADMIN");
    }
  } catch (e) {
    // Dynamic fetch fallback to local roles
  }
  return [
    { id: "CASHIER", name: "CASHIER", description: "Cashier / Staff" },
    { id: "MANAGER", name: "MANAGER", description: "Store Manager" },
  ];
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
  const requestBody: Record<string, any> = {
    username: payload.username,
    email: payload.email,
    password: payload.password,
    roleId: payload.roleId || payload.role,
    enabled: payload.enabled ?? true,
  };

  const res = await apiFetch(API_ENDPOINTS.USERS, {
    method: "POST",
    body: JSON.stringify(requestBody),
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

export interface SaleItemPayload {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSalePayload {
  items: SaleItemPayload[];
  paymentMethod?: string;
  customerName?: string;
}

export const fetchSales = async () => {
  const res = await apiFetch(API_ENDPOINTS.SALES);
  return res.data || res;
};

export const createSale = async (payload: CreateSalePayload) => {
  const res = await apiFetch(API_ENDPOINTS.SALES, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data || res;
};

export interface CustomerPayload {
  name: string;
  email?: string;
  phone?: string;
  creditLimit?: number;
}

export const createCustomer = async (payload: CustomerPayload) => {
  const res = await apiFetch(API_ENDPOINTS.CUSTOMERS, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data || res;
};

export interface SupplierPayload {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface BackendSupplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  balance?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const fetchSuppliers = async (): Promise<BackendSupplier[]> => {
  const res = await apiFetch(API_ENDPOINTS.SUPPLIERS);
  return res.data || res;
};

export const fetchSupplierById = async (id: string): Promise<BackendSupplier> => {
  const res = await apiFetch(`${API_ENDPOINTS.SUPPLIERS}/${id}`);
  return res.data || res;
};

export const createSupplier = async (payload: SupplierPayload): Promise<BackendSupplier> => {
  const res = await apiFetch(API_ENDPOINTS.SUPPLIERS, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data || res;
};

export const updateSupplier = async (id: string, payload: SupplierPayload): Promise<BackendSupplier> => {
  const res = await apiFetch(`${API_ENDPOINTS.SUPPLIERS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.data || res;
};

export const deleteSupplier = async (id: string): Promise<void> => {
  await apiFetch(`${API_ENDPOINTS.SUPPLIERS}/${id}`, {
    method: "DELETE",
  });
};

export const fetchSupplierBalance = async (id: string): Promise<number> => {
  const res = await apiFetch(`${API_ENDPOINTS.SUPPLIERS}/${id}/balance`);
  return res.data !== undefined ? res.data : res;
};

export const fetchPurchaseOrders = async () => {
  const res = await apiFetch(API_ENDPOINTS.PURCHASE_ORDERS);
  return res.data || res;
};

export const createPurchaseOrder = async (payload: any) => {
  const res = await apiFetch(API_ENDPOINTS.PURCHASE_ORDERS, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data || res;
};
