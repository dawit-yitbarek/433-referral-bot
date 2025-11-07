import axios from "axios";
const BackEndUrl = import.meta.env.VITE_BACKEND_URL;

const publicApi = axios.create({
  baseURL: BackEndUrl,
  withCredentials: true,
});

const protectedApi = axios.create({
  baseURL: BackEndUrl,
  withCredentials: true,
});

// Request interceptor: add access token
protectedApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto refresh token if expired
protectedApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If access token expired, try to refresh
    const isAccessTokenExpired =
      error.response &&
      error.response.status === 403 &&
      error.response.data?.message === "Access token expired";

    const isRetry = originalRequest._retry;

    if (isAccessTokenExpired && !isRetry) {
      originalRequest._retry = true;
      console.log("Refreshing expired access token")
      try {
        const refreshResponse = await axios.get(`${BackEndUrl}/api/auth/refresh`, {
          withCredentials: true,
        });

        const newAccessToken = refreshResponse.data.accessToken;

        // Store new access token
        localStorage.setItem("accessToken", newAccessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return protectedApi(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);

        localStorage.removeItem("accessToken");
        return Promise.reject(refreshError);
      }
    }


    if (error.response && error.response.status === 401) {
      localStorage.removeItem("accessToken");
    }

    return Promise.reject(error);
  }
);

export { publicApi, protectedApi };