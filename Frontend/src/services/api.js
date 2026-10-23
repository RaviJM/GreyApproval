const API_URL = "http://localhost:3000";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401 && path !== "/api/login") {
    window.dispatchEvent(new Event("auth:logout"));
  }

  return response;
}
