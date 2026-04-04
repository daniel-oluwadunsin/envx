import { apiClient } from "../configs/axios.config";
import {
  ApiResponse,
  CreateEnvDto,
  Environment,
  GetEnvDto,
} from "../types/api";

export const envService = {
  async getProjectEnvironments(projectId: string) {
    const response = await apiClient.get<ApiResponse<Environment[]>>(
      `/environment/project/${projectId}`,
    );
    return response.data?.data ?? [];
  },

  async getEnvFile(envDto: GetEnvDto) {
    const response = await apiClient.post<
      ApiResponse<{ envObj: Record<string, string>; version: number }>
    >(`/environment/get-env`, envDto);
    return response.data?.data;
  },

  async getProjectEnvironmentBySlug(projectId: string, envSlug: string) {
    const response = await apiClient.get<ApiResponse<Environment>>(
      `/environment/project/${projectId}/slug/${envSlug}`,
    );
    return response.data?.data;
  },

  async createEnvironment(
    projectId: string,
    name: string,
    description?: string,
  ) {
    const response = await apiClient.post<ApiResponse<Environment>>(
      `/environment`,
      {
        projectId,
        name,
        description,
      },
    );
    return response.data?.data;
  },

  async createEnv(body: CreateEnvDto) {
    const response = await apiClient.post<ApiResponse<{ version: number }>>(
      "/environment/create-env",
      body,
    );

    return response.data?.data;
  },
};
