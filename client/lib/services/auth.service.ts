import { ApiResponse, SignUpDto } from "@/lib/types/api";
import { apiClient } from ".";
import { errorHandler } from "@/lib/utils";
import { User } from "../types";

export const signUp = async (body: SignUpDto) => {
  try {
    const response = await apiClient.post("/auth/sign-up", body);

    return response.data;
  } catch (error) {
    errorHandler(error);
  }
};

export const signIn = async (email: string) => {
  try {
    const response = await apiClient.post("/auth/sign-in", { email });

    return response.data;
  } catch (error) {
    errorHandler(error);
  }
};

export const signInWithCode = async (email: string, code: string) => {
  try {
    const response = await apiClient.post<ApiResponse<{ accessToken: string }>>(
      "/auth/sign-in-with-code",
      {
        email,
        code,
      },
    );

    return response.data?.data;
  } catch (error) {
    errorHandler(error);
  }
};

export const getUser = async () => {
  try {
    const response = await apiClient.get<ApiResponse<User>>("/user/me");

    return response.data;
  } catch (error) {
    errorHandler(error);
  }
};

export const updateUser = async (data: { name?: string; profileImage?: string }) => {
  try {
    const response = await apiClient.put<ApiResponse<User>>("/user/me", data);

    return response.data;
  } catch (error) {
    errorHandler(error);
  }
};

export const logOut = async () => {
  try {
    const response = await apiClient.post("/auth/log-out");

    return response.data;
  } catch (error) {
    errorHandler(error);
  }
};
