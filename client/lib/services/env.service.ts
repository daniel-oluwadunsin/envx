import { apiClient } from ".";
import { Environment, EnvVersion } from "../types";
import { ApiResponse, DeploySecretsDto } from "../types/api";
import { errorHandler } from "../utils";

export async function getProjectEnvironments(projectId: string) {
  const response = await apiClient.get<ApiResponse<Environment[]>>(
    `/environment/project/${projectId}`,
  );
  return response.data?.data ?? [];
}

export async function getProjectEnvironmentBySlug(
  projectId: string,
  envSlug: string,
) {
  const response = await apiClient.get<ApiResponse<Environment>>(
    `/environment/project/${projectId}/slug/${envSlug}`,
  );
  return response.data?.data;
}

export async function getEnvFileKeys(
  projectId: string,
  envSlug: string,
  version: number,
) {
  const response = await apiClient.post<ApiResponse<{ envKeys: string[] }>>(
    "/environment/get-env/keys",
    {
      projectId,
      envSlug,
      version,
    },
  );
  return response.data?.data?.envKeys ?? [];
}

export async function getEnvValue(
  projectId: string,
  envSlug: string,
  key: string,
  version: number,
) {
  const response = await apiClient.post<ApiResponse<{ value: string }>>(
    "/environment/get-env/value",
    {
      projectId,
      envSlug,
      key,
      version,
    },
  );
  return response.data?.data?.value;
}

export async function getEnvVersions(projectId: string, envSlug: string) {
  const response = await apiClient.post<ApiResponse<EnvVersion[]>>(
    "/environment/get-versions",
    {
      projectId,
      envSlug,
    },
  );
  return response.data?.data ?? [];
}

export async function restoreEnvVersion(
  projectId: string,
  envSlug: string,
  version: number,
) {
  try {
    const response = await apiClient.post<ApiResponse<{ newVersion: number }>>(
      "/environment/restore-env-version",
      {
        projectId,
        envSlug,
        version,
      },
    );
    return response.data?.data;
  } catch (error) {
    errorHandler(error);
  }
}

export async function createEnvironment(
  projectId: string,
  name: string,
  description?: string,
) {
  try {
    const response = await apiClient.post<ApiResponse<Environment>>(
      "/environment",
      {
        projectId,
        name,
        description,
      },
    );
    return response.data?.data;
  } catch (error) {
    errorHandler(error);
  }
}

export async function deploySecrets(body: DeploySecretsDto) {
  try {
    const response = await apiClient.post<ApiResponse<null>>(
      "/environment/deploy-secrets",
      body,
    );

    return response.data?.success ?? false;
  } catch (error) {
    errorHandler(error);
  }
}
