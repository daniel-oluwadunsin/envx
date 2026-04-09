import { apiClient } from ".";
import { GitHostOrigin, GitHostProvider } from "../types";
import { ApiResponse } from "../types/api";
import { errorHandler } from "../utils";

export const initiateProjectGitHostOAuth = async (
  projectId: string,
  provider: GitHostProvider,
) => {
  try {
    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      "/project/oauth/initiate",
      {
        projectId,
        provider,
      },
    );

    return response.data?.data;
  } catch (error) {
    errorHandler(error);
  }
};

export const verifyProjectGitHostOAuth = async (
  projectId: string,
  provider: GitHostProvider,
) => {
  try {
    const response = await apiClient.get<ApiResponse<{ hasOAuth: boolean }>>(
      "/project/oauth/verify",
      {
        params: {
          projectId,
          provider,
        },
      },
    );

    return response.data?.data;
  } catch (error) {
    errorHandler(error);
  }
};

export const logoutProjectGitHostOAuth = async (
  projectId: string,
  provider: GitHostProvider,
  removeOrigins: boolean,
) => {
  try {
    const response = await apiClient.post<ApiResponse<null>>(
      "/project/oauth/remove",
      {
        projectId,
        provider,
        removeOrigins,
      },
    );

    return response.data?.success ?? false;
  } catch (error) {
    errorHandler(error);
  }
};

export const getConfiguredProjectGitHostProviders = async (
  projectId: string,
) => {
  try {
    const response = await apiClient.get<
      ApiResponse<{ configuredOAuths: GitHostProvider[] }>
    >(`/project/oauth/providers`, {
      params: { projectId },
    });

    return response.data?.data?.configuredOAuths ?? [];
  } catch (error) {
    errorHandler(error);
  }
};

export const getProjectGitHostOrigins = async (
  projectId: string,
  provider?: GitHostProvider,
) => {
  try {
    const response = await apiClient.get<ApiResponse<GitHostOrigin[]>>(
      `/project/${projectId}/githost`,
      {
        params: { provider },
      },
    );

    return response.data?.data ?? [];
  } catch (error) {
    errorHandler(error);
  }
};

export const createProjectGitHostOrigin = async (body: {
  projectId: string;
  hostName: string;
  hostUrl: string;
}) => {
  try {
    const response = await apiClient.post<ApiResponse<null>>(
      "/project/githost/create",
      body,
    );

    return response.data?.success ?? false;
  } catch (error) {
    errorHandler(error);
  }
};
