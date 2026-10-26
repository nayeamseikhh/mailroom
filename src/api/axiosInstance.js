import axios from "axios";

const defaultApiUrl = import.meta.env.DEV
  ? "http://localhost:5001/api"
  : "https://mailroom-backend-8dm7.onrender.com/api";

const rawApiUrl = (import.meta.env.VITE_API_URL || defaultApiUrl)
  .trim()
  .replace(/\/+$/, "");
export const API_BASE_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;
export const API_HOST_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token =
    window.localStorage?.getItem("mailroom-auth-token") ||
    window.sessionStorage?.getItem("mailroom-auth-token");

  if (token && !(config.headers?.Authorization || config.headers?.authorization)) {
    config.headers = config.headers || {};
    config.headers.Authorization = "Bearer " + token;
  }

  return config;
});

export default axiosInstance;
