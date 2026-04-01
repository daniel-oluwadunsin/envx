import { apiClient } from "../configs/axios.config";
import { ApiResponse, Environment, GetEnvDto } from "../types/api";

export const envService = {
  async getProjectEnvironments(projectId: string) {
    const response = await apiClient.get<ApiResponse<Environment[]>>(
      `/environment/project/${projectId}`,
    );
    return response.data?.data ?? [];
  },

  async getEnvFiles(envDto: GetEnvDto) {
    const response = await apiClient.post<
      ApiResponse<{ fileName: string; content: string }[]>
    >(`/environment/get-env`, envDto);
    return response.data?.data ?? [];
  },
};
