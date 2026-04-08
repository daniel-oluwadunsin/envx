import { differenceInMilliseconds } from "date-fns/differenceInMilliseconds";
import { apiClient } from "../configs/axios.config";
import {
  ApiResponse,
  InitSignInResponse,
  SignInStatus,
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

  pollCliSignIn: async (
    cliCode: string,
    interval: number,
    timeout: number,
  ): Promise<{
    status: SignInStatus;
    authResponse: VerifyCliSignInResponse | null;
  }> => {
    const startTime = Date.now();
    let status: SignInStatus = "pending";
    let authResponse: VerifyCliSignInResponse | null = null;
    while (differenceInMilliseconds(new Date(), startTime) < timeout) {
      authResponse = await authService.verifyCliSignIn(cliCode);

      status = authResponse.status;

      if (status !== "pending") {
        break;
      }

      // wait for the specified interval before checking again
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    return { status, authResponse };
  },
};
