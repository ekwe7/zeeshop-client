export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://zeeshop-server.onrender.com";

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REFRESH: `${API_BASE_URL}/api/auth/refresh`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  LOGOUT_ALL: `${API_BASE_URL}/api/auth/logout-all`,
  PRODUCTS: `${API_BASE_URL}/api/v1/products`,
  CUSTOMERS: `${API_BASE_URL}/api/v1/customers`,
  SWAGGER: `https://zeeshop-server.onrender.com/swagger-ui.html`,
};

