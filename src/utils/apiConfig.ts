export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "" : "https://zeeshop-server.onrender.com");

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REFRESH: `${API_BASE_URL}/api/auth/refresh`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  LOGOUT_ALL: `${API_BASE_URL}/api/auth/logout-all`,
  PRODUCTS: `${API_BASE_URL}/api/products`,
  CATEGORIES: `${API_BASE_URL}/api/categories`,
  UNITS: `${API_BASE_URL}/api/units`,
  CUSTOMERS: `${API_BASE_URL}/api/v1/customers`,
  USERS: `${API_BASE_URL}/api/users`,
  ROLES: `${API_BASE_URL}/api/roles`,
  SALES: `${API_BASE_URL}/api/v1/sales`,
  SUPPLIERS: `${API_BASE_URL}/api/v1/suppliers`,
  PURCHASE_ORDERS: `${API_BASE_URL}/api/v1/purchase-orders`,
  SWAGGER: `https://zeeshop-server.onrender.com/swagger-ui.html`,
};

