import { ConfigService } from '@nestjs/config';
import { OAuthProviderInterface } from './oauth-provider.interface';
import axios, { Axios } from 'axios';
import * as qs from 'qs';
import {
  CreateEnvironmentRequest,
  CreateSecretRequest,
  DeleteSecretRequest,
  GetEnvironmentsRequest,
  GetEnvironmentsResponse,
  GetHttpInstanceProps,
  GetRepoRequest,
  GetRepoResponse,
  GetSecretsRequest,
  GetSecretsResponse,
  GitlabCICDVariable,
  GitlabRepo,
  TokenResponse,
} from 'src/shared/types/oauth';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GitlabProvider implements OAuthProviderInterface {
  readonly provider = 'gitlab';
  readonly baseUrl: string;
  readonly httpInstance: Axios;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = 'https://gitlab.com/api/v4';
    this.httpInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Accept: 'application/json',
      },
    });
  }

  getOAuthUrl(state: string, redirectUrl?: string) {
    const clientId = process.env['GITLAB_APP_ID'];
    const redirectUri = redirectUrl;

    const scope = 'read_user read_api api';

    const url = `https://gitlab.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri || '')}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;

    return url;
  }

  async exchangeCodeForToken(
    code: string,
    redirectUrl?: string,
  ): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    const tokenUrl = 'https://gitlab.com/oauth/token';
    const clientId = process.env['GITLAB_APP_ID'];
    const clientSecret = process.env['GITLAB_CLIENT_SECRET'];

    const requestBody = {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUrl,
      grant_type: 'authorization_code',
    };

    const response = await axios.post<{
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    }>(tokenUrl, qs.stringify(requestBody), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const accessToken = response.data.access_token;
    const refreshToken = response.data.refresh_token;
    const expiresIn = response.data.expires_in;

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : undefined;

    if (!accessToken) {
      throw new Error('Failed to obtain access token from GitLab');
    }

    return { accessToken: response.data.access_token, refreshToken, expiresAt };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const tokenUrl = 'https://gitlab.com/oauth/token';
    const clientId = process.env['GITLAB_APP_ID'];
    const clientSecret = process.env['GITLAB_CLIENT_SECRET'];

    const requestBody = {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      redirect_uri: process.env['GITLAB_REDIRECT_URI'],
    };

    const response = await axios.post<{
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    }>(tokenUrl, qs.stringify(requestBody), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const accessToken = response.data.access_token;
    const newRefreshToken = response.data.refresh_token;
    const expiresIn = response.data.expires_in;

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : undefined;

    if (!accessToken) {
      throw new Error('Failed to refresh access token from GitLab');
    }

    return { accessToken, refreshToken: newRefreshToken, expiresAt };
  }

  async getHttpInstance(props: GetHttpInstanceProps): Promise<Axios> {
    const expiresAt = props.expiresAt ? new Date(props.expiresAt) : null;

    if (expiresAt && expiresAt.getTime() < Date.now()) {
      const { accessToken } = await this.refreshAccessToken(
        props.refreshToken!,
      );

      props.updateAccessToken?.(accessToken, expiresAt);

      props.accessToken = accessToken;
      props.expiresAt = expiresAt;
    }

    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${props.accessToken}`,
      },
    });
  }

  async getRepo(props: GetRepoRequest): Promise<GetRepoResponse> {
    const http = await this.getHttpInstance(props);

    const response = await http.get<GitlabRepo>(
      `/projects/${encodeURIComponent(props.repoFullPath)}`,
    );

    return {
      id: response.data.id,
      repoName: response.data.name,
      repoFullPath: response.data.path_with_namespace,
      private: response.data.visibility !== 'public',
      repoDescription: response.data.description,
      repoUrl: response.data.web_url,
    };
  }

  async getRepoEnvironments(
    props: GetEnvironmentsRequest,
  ): Promise<GetEnvironmentsResponse[]> {
    const http = await this.getHttpInstance(props);

    const response = await http.get<
      { id: number; name: string; created_at: string; updated_at: string }[]
    >(`/projects/${encodeURIComponent(props.repoFullPath)}/environments`);

    return response.data.map((env) => ({
      id: env.id,
      name: env.name,
      createdAt: new Date(env.created_at),
      updatedAt: new Date(env.updated_at),
    }));
  }

  async getSingleEnvironment(
    props: GetEnvironmentsRequest,
    environmentName: string,
  ): Promise<GetEnvironmentsResponse | null> {
    const http = await this.getHttpInstance(props);

    try {
      const response = await http.get<{
        id: number;
        name: string;
        created_at: string;
        updated_at: string;
      }>(
        `/projects/${encodeURIComponent(props.repoFullPath)}/environments/${encodeURIComponent(environmentName)}`,
      );

      return {
        id: response.data.id,
        name: response.data.name,
        createdAt: new Date(response.data.created_at),
        updatedAt: new Date(response.data.updated_at),
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createEnvironment(
    props: CreateEnvironmentRequest,
  ): Promise<GetEnvironmentsResponse> {
    const http = await this.getHttpInstance(props);

    const response = await http.post<GitlabRepo>(
      `/projects/${encodeURIComponent(props.repoFullPath)}/environments`,
      {
        name: props.name,
      },
    );

    return {
      id: response.data.id,
      name: response.data.name,
      createdAt: new Date(response.data.created_at),
      updatedAt: new Date(response.data.updated_at),
    };
  }

  async createSecret(props: CreateSecretRequest): Promise<void> {
    const http = await this.getHttpInstance(props);

    await http.post<GitlabCICDVariable>(
      `/projects/${encodeURIComponent(props.repoFullPath)}/variables`,
      {
        key: props.name,
        value: props.value,
        protected: false,
        masked: true,
        environment_scope: props.environmentName || '*',
      },
    );

    return;
  }

  async getSecrets(props: GetSecretsRequest): Promise<GetSecretsResponse[]> {
    const http = await this.getHttpInstance(props);

    const response = await http.get<GitlabCICDVariable[]>(
      `/projects/${encodeURIComponent(props.repoFullPath)}/variables`,
    );

    return response.data
      .filter((variable) =>
        props.environmentName
          ? variable.environment_scope?.toLowerCase() ===
            props.environmentName.toLowerCase()
          : true,
      )
      .map((variable) => ({
        name: variable.key,
        value: variable.value,
        protected: variable.protected,
        masked: variable.masked,
        createdAt: new Date(variable.created_at),
        updatedAt: new Date(variable.updated_at),
        environment_scope: variable.environment_scope,
        description: variable.description,
      }));
  }

  async deleteSecret(props: DeleteSecretRequest): Promise<void> {
    const http = await this.getHttpInstance(props);

    if (!props.environmentName) {
      await http.delete(
        `/projects/${encodeURIComponent(props.repoFullPath)}/variables/${encodeURIComponent(props.name)}`,
      );
    } else {
      const formData = new FormData();
      formData.append('filter[environment_scope]', props.environmentName);

      await http.delete(
        `/projects/${encodeURIComponent(props.repoFullPath)}/variables/${encodeURIComponent(props.name)}`,
        {
          data: formData,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
    }
  }
}
