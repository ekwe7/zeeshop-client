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

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Clear expired or invalid tokens from local storage
      localStorage.removeItem("zeeshop_tokens");
      localStorage.removeItem("zeeshop_user");
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        errorData.error ||
        `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
};

export const fetchProducts = async () => {
  return apiFetch(API_ENDPOINTS.PRODUCTS);
};

export const fetchCustomers = async () => {
  return apiFetch(API_ENDPOINTS.CUSTOMERS);
};
