import axios from "axios";
import { useUserStore } from "../store/user.store";
import { toast } from "sonner";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useUserStore.getState();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useUserStore.getState().clearUser();
      toast.error("Unauthorized", {
        description: "Your session has expired. Please sign in again.",
      });
      window.location.href = "/signin";
    }

    return Promise.reject(error);
  },
);
