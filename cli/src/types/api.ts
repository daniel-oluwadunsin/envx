export type ApiResponse<T> = {
  success: true;
  data: T;
  message: string;
};

export type InitSignInResponse = {
  deviceCode: string;
  expiresAt: Date;
};

export type SignInStatus = "pending" | "success" | "expired" | "failed";

export type VerifyCliSignInResponse = {
  status: SignInStatus;
  accessToken?: string;
  user: {
    id?: string;
    name?: string;
  };
};

export type GetEnvDto = {
  envSlug: string;
  projectId?: string;
  version?: number;
};

export type Project = {
  id: string;
  name: string;
  orgId: string;
  orgName: string;
  environments: number;
  lastUpdated: string;
  description?: string;
};

export type Organization = {
  id: string;
  name: string;
  membersCount: number;
  projectsCount: number;
  createdAt: string;
  role: "owner" | "member";
  ownerId: string;
};

export type Environment = {
  id: string;
  name: string;
  slug: string;
  projectId: string;
  latestVersion: number;
  lastUpdated: string;
  variableCount: number;
};

export type EnvFileRes = {
  envObj: Record<string, string>;
  version: number;
};
