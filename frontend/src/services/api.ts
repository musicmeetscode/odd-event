import axios from "axios";

// Environment-based API URL
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Automatically attach token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("devfest-token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }

    // Debug logging
    console.log(
      "🚀 API Request:",
      config.method?.toUpperCase(),
      config.url,
      config.data
    );

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle common errors (401, 403, etc.)
apiClient.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error(
      "❌ API Error:",
      error.response?.status,
      error.response?.data
    );

    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth and redirect
      localStorage.removeItem("devfest-token");
      localStorage.removeItem("devfest-username");
      localStorage.removeItem("devfest-is-speaker");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default apiClient;
