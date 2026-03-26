import { apiClient } from ".";
import { Project } from "../types";
import { ApiResponse, CreateProjectDto } from "../types/api";
import { errorHandler } from "../utils";

export const createProject = async (data: CreateProjectDto) => {
  try {
    const response = await apiClient.post<ApiResponse<Project>>(
      `/project`,
      data,
    );
    return response.data?.data;
  } catch (e) {
    errorHandler(e);
  }
};

export const getProjects = async (organizationId?: string) => {
  try {
    const response = await apiClient.get<ApiResponse<Project[]>>(`/project`, {
      params: { organizationId },
    });
    return response.data?.data;
  } catch (e) {
    errorHandler(e);
  }
};
