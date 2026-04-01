import { apiClient } from "../configs/axios.config";
import { ApiResponse, Project } from "../types/api";

export const projectService = {
  getProjects: async (organizationId?: string) => {
    const response = await apiClient.get<ApiResponse<Project[]>>(`/project`, {
      params: { organizationId },
    });
    return response.data?.data ?? [];
  },

  createProject: async (name: string, organizationId: string) => {
    const response = await apiClient.post<ApiResponse<Project>>(`/project`, {
      name,
      organizationId,
    });
    return response.data?.data;
  },
};
