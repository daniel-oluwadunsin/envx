import { apiClient } from "../configs/axios.config";
import {
  ApiResponse,
  InitSignInResponse,
  VerifyCliSignInResponse,
} from "../types/api";

export const authService = {
  initSignIn: async (): Promise<string> => {
    const response =
      await apiClient.post<ApiResponse<InitSignInResponse>>("/auth/cli/init");

    return response?.data?.data?.deviceCode;
  },

  verifyCliSignIn: async (
    cliCode: string,
  ): Promise<VerifyCliSignInResponse> => {
    const response = await apiClient.post<ApiResponse<VerifyCliSignInResponse>>(
      "/auth/cli/verify",
      {
        cliCode,
      },
    );

    return response?.data?.data;
  },
};
