
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: (
    import.meta.env.VITE_API_URL || "http://localhost:5001/api"
  ).replace(/\/+$/, ""),
  withCredentials: true,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

export default axiosInstance;
