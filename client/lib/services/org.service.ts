import { apiClient } from ".";
import { Organization, OrganizationMmebers } from "../types";
import { ApiResponse } from "../types/api";
import { errorHandler } from "../utils";

export const createOrganization = async (name: string) => {
  try {
    const response = await apiClient.post("/org", { name });
    return response.data;
  } catch (e) {
    errorHandler(e);
  }
};

export const inviteMember = async (organizationId: string, email: string) => {
  try {
    const response = await apiClient.post(`/org/${organizationId}/invite`, {
      email,
    });
    return response.data;
  } catch (e) {
    errorHandler(e);
  }
};

export const acceptInvite = async (organizationId: string, token: string) => {
  try {
    const response = await apiClient.post(
      `/org/${organizationId}/invite/accept`,
      { token },
    );
    return response.data;
  } catch (e) {
    errorHandler(e);
  }
};

export const getOrganization = async (organizationId: string) => {
  try {
    const response = await apiClient.get<ApiResponse<Organization>>(
      `/org/${organizationId}`,
    );
    return response.data?.data;
  } catch (e) {
    errorHandler(e);
  }
};

export const getUserOrganizations = async () => {
  try {
    const response = await apiClient.get<ApiResponse<Organization[]>>(`/org`);
    return response.data?.data || [];
  } catch (e) {
    errorHandler(e);
  }
};

export const getOrganizationMembers = async (orgId: string) => {
  try {
    const response = await apiClient.get<ApiResponse<OrganizationMmebers[]>>(
      `/org/${orgId}/members`,
    );

    return response.data?.data || [];
  } catch (error) {
    errorHandler(error);
  }
};

export const getOrganizationInvites = async (orgId: string) => {
  try {
    const response = await apiClient.get(`/org/${orgId}/invites`);
    return response.data?.data || [];
  } catch (error) {
    errorHandler(error);
  }
};

export const removeMember = async (orgId: string, memberId: string) => {
  try {
    const response = await apiClient.delete(
      `/org/${orgId}/members/${memberId}`,
    );
    return response.data;
  } catch (error) {
    errorHandler(error);
  }
};

export const getPublicOrganization = async (organizationId: string) => {
  try {
    const response = await apiClient.get<ApiResponse<Organization>>(
      `/org/${organizationId}/public`,
    );
    return response.data?.data;
  } catch (e) {
    errorHandler(e);
  }
};
