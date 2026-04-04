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

    const responseData = error?.response?.data;
    const responseDetail =
      typeof responseData === "object" && responseData !== null
        ? responseData.detail
        : null;
    const responseText =
      typeof responseData === "string"
        ? responseData.slice(0, 240)
        : "";
    const message = responseDetail || error.message || "Request failed";

    const normalizedError = new Error(message);
    normalizedError.code = error?.code;
    normalizedError.status = error?.response?.status ?? null;
    normalizedError.responseText = responseText;
    normalizedError.responseContentType = error?.response?.headers?.["content-type"] || "";
    normalizedError.requestUrl = error?.config?.url || "";

    return Promise.reject(normalizedError);
  }
);

export { apiClient };
