export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export type SignUpDto = {
  name: string;
  email: string;
  cliCode?: string;
};

export type CreateProjectDto = {
  name: string;
  organizationId: string;
  description?: string;
};

export type EnvDeployTarget = "environment" | "action";

export type DeploySecretsDto = {
  envSlug: string;
  projectId?: string;
  githostEnvironment?: string;
  githostOrigin: string;
  version?: number;
  noMerge?: boolean;
  deployTarget: EnvDeployTarget;
};
