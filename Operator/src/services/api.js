const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function apiFetch(path, options = {}) {
  const token = localStorage.getItem("operatorToken");

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
