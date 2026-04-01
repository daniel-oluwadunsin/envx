import { apiClient } from "../configs/axios.config";
import { ApiResponse, Organization } from "../types/api";

export const orgService = {
  getOrgs: async () => {
    const response = await apiClient.get<ApiResponse<Organization[]>>("/org");

    return response?.data?.data;
  },
};
