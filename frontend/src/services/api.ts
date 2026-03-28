import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("events-token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect if it's a google login attempt
      if (error.config.url?.includes('/auth/google/')) {
        return Promise.reject(error);
      }
      localStorage.removeItem("events-token");
      localStorage.removeItem("events-username");
      localStorage.removeItem("events-role");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
