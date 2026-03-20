import axios from "axios";

function resolveApiBaseUrl() {
  const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!rawBaseUrl) {
    if (import.meta.env.PROD) {
      console.warn(
        "VITE_API_BASE_URL is not set. Falling back to same-origin /api/v1, which only works if frontend and backend share one domain."
      );
    }
    return "/api/v1";
  }

  const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, "");
  if (!normalizedBaseUrl.startsWith("/") && !/^https?:\/\//i.test(normalizedBaseUrl)) {
    console.warn(
      `VITE_API_BASE_URL should include http:// or https://. Received: ${rawBaseUrl}`
    );
  }
  return normalizedBaseUrl.endsWith("/api/v1")
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/api/v1`;
}

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 20000
});

apiClient.interceptors.request.use((config) => {
  config.headers["X-Requested-With"] = "XMLHttpRequest";
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.code === "ERR_CANCELED") {
      return Promise.reject(error);
    }
    const message = error?.response?.data?.detail || error.message || "Request failed";
    return Promise.reject(new Error(message));
  }
);

export { apiClient };
