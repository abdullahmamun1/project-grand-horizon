const API_BASE = "/api";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest<T>(
  method: string,
  endpoint: string,
  data?: unknown
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  const config: RequestInit = {
    method,
    headers,
  };

  if (data && method !== "GET") {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function uploadImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("images", file);
  });

  const token = localStorage.getItem("token");
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(`${API_BASE}/admin/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(error.message);
  }

  const result = await response.json();
  return result.urls;
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>("GET", endpoint),
  post: <T>(endpoint: string, data?: unknown) => apiRequest<T>("POST", endpoint, data),
  put: <T>(endpoint: string, data?: unknown) => apiRequest<T>("PUT", endpoint, data),
  patch: <T>(endpoint: string, data?: unknown) => apiRequest<T>("PATCH", endpoint, data),
  delete: <T>(endpoint: string) => apiRequest<T>("DELETE", endpoint),
};
