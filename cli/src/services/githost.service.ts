import { differenceInMilliseconds } from "date-fns";
import { apiClient } from "../configs/axios.config";
import { GitHosts } from "../enums/githost.enum";
import {
  ApiResponse,
  CreateGitHostOriginDto,
  GitHostOrigin,
  InitiateOAuthResponse,
  SignInStatus,
} from "../types/api";

export const githostService = {
  initiateOAuth: async (projectId: string, provider: GitHosts) => {
    const response = await apiClient.post<ApiResponse<InitiateOAuthResponse>>(
      `/project/oauth/initiate`,
      {
        projectId,
        provider,
      },
    );

    return response?.data?.data;
  },

  verifyOAuth: async (projectId: string, provider: GitHosts) => {
    const response = await apiClient.get<ApiResponse<{ hasOAuth: boolean }>>(
      `/project/oauth/verify`,
      {
        params: {
          projectId,
          provider,
        },
      },
    );

    return response?.data?.data;
  },

  pollVerifyOAuth: async (
    projectId: string,
    provider: GitHosts,
    interval: number,
    timeout: number,
  ): Promise<{ status: SignInStatus }> => {
    const startTime = Date.now();
    let status: SignInStatus = "pending";
    while (differenceInMilliseconds(new Date(), startTime) < timeout) {
      const response = await githostService.verifyOAuth(projectId, provider);

      status = response?.hasOAuth ? "success" : "pending";

      if (status !== "pending") {
        break;
      }

      // wait for the specified interval before checking again
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    return { status };
  },

  removeOAuth: async (
    projectId: string,
    provider: GitHosts,
    removeOrigins: boolean,
  ) => {
    const response = await apiClient.post<ApiResponse<null>>(
      `/project/oauth/remove`,
      {
        projectId,
        provider,
        removeOrigins,
      },
    );

    return response?.data?.success;
  },

  getOAuthProviders: async (projectId: string) => {
    const response = await apiClient.get<
      ApiResponse<{ configuredOAuths: GitHosts[] }>
    >(`/project/oauth/providers`, {
      params: {
        projectId,
      },
    });

    return response?.data?.data?.configuredOAuths || [];
  },

  createGitHostOrigin: async (body: CreateGitHostOriginDto) => {
    const response = await apiClient.post<ApiResponse<null>>(
      `/project/githost/create`,
      body,
    );

    return response?.data?.success;
  },

  getProjectGitHostOrigins: async (projectId: string, provider?: GitHosts) => {
    const response = await apiClient.get<ApiResponse<GitHostOrigin[]>>(
      `/project/${projectId}/githost`,
      {
        params: {
          provider,
        },
      },
    );

    return response?.data?.data || [];
  },
};
