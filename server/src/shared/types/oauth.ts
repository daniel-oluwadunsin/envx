export type OAuthProvider = 'github' | 'gitlab';

export type OAuthTypes = 'project';

type AltProjectRequestParams = { repoFullPath: string } & {
  projectId?: number;
};

export type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string;
  html_url: string;
};

export type GitlabRepo = {
  id: number;
  description: string;
  name: string;
  path: string;
  path_with_namespace: string;
  created_at: Date;
  updated_at: Date;
  web_url: string;
  visibility: 'private' | 'internal' | 'public';
};

export type GithubRepoEnvironment = {
  id: number;
  name: string;
  url: string;
  created_at: Date;
  updated_at: Date;
};

export type GitlabRepoEnvironment = {
  id: number;
  name: string;
  external_url: string;
  created_at: Date;
  updated_at: Date;
};

export type GithubSecret = {
  name: string;
  created_at: Date;
  updated_at: Date;
};

export type GitlabCICDVariable = {
  variable_type: 'env_var';
  key: string;
  value: string;
  protected: boolean;
  masked: boolean;
  created_at: Date;
  updated_at: Date;
  environment_scope: string;
  description: string;
};

export type GithubPublicKey = {
  key_id: string;
  key: string;
};

export type CreateGithubEnvrionmentDto = {
  environmentName: string;
  repoFullPath: string;
};

export type CreateGitlabEnvrionmentDto = {
  projectId?: number;
  name: string;
};

export type TokenResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
};

export type GetHttpInstanceProps = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  installationId?: string;
  updateAccessToken?: (token: string, expiresAt?: Date) => void;
};

export type MakeOAuthRequest = GetHttpInstanceProps;

export type GetRepoRequest = MakeOAuthRequest & AltProjectRequestParams;

export type GetRepoResponse = {
  id: number;
  repoName: string;
  repoFullPath: string;
  private: boolean;
  repoDescription: string;
  repoUrl: string;
};

export type CreateEnvironmentRequest = MakeOAuthRequest &
  (CreateGithubEnvrionmentDto & CreateGitlabEnvrionmentDto);

export type GetEnvironmentsRequest = MakeOAuthRequest & AltProjectRequestParams;

export type GetEnvironmentsResponse = {
  id: number;
  name: string;
  url?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateSecretRequest = MakeOAuthRequest &
  AltProjectRequestParams & {
    name?: string;
    value?: string;
    environmentName?: string;
  };

export type GetSecretsRequest = MakeOAuthRequest &
  AltProjectRequestParams & {
    environmentName?: string;
  };

export type GetSecretsResponse = {
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DeleteSecretRequest = MakeOAuthRequest &
  AltProjectRequestParams & {
    name: string;
    environmentName?: string;
  };

export type GetSecretPublicKeyRequest = MakeOAuthRequest &
  AltProjectRequestParams & {
    environmentName?: string;
  };

export type GetSecretPublicKeyResponse = {
  keyId: string;
  publicKey: string;
};
