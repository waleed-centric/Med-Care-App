import axios from "axios";
import Cookies from "js-cookie";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Attach token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    // If authorization header is already set, don't overwrite it
    if (config.headers.Authorization) {
      return config;
    }

    const lsToken =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const ckToken = Cookies.get("token");
    const token = ckToken || lsToken || null; // Prefer cookie over local storage as auth hook sets cookie
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle 401 errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove("token");
      Cookies.remove("user");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
