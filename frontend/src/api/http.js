import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api/v1",
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
    const message = error?.response?.data?.detail || error.message || "请求失败";
    return Promise.reject(new Error(message));
  }
);

export { apiClient };
