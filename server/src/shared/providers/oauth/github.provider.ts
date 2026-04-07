import { ConfigService } from '@nestjs/config';
import { OAuthProviderInterface } from './oauth-provider.interface';
import axios, { Axios } from 'axios';
import { BadRequestException } from '@nestjs/common';
import {
  CreateEnvironmentRequest,
  CreateSecretRequest,
  GetEnvironmentsRequest,
  GetEnvironmentsResponse,
  GetHttpInstanceProps,
  GetRepoRequest,
  GetRepoResponse,
  GetSecretPublicKeyRequest,
  GetSecretPublicKeyResponse,
  GetSecretsRequest,
  GetSecretsResponse,
  GithubPublicKey,
  GithubRepo,
  GithubRepoEnvironment,
  GithubSecret,
  TokenResponse,
} from 'src/shared/types/oauth';
import { UtilsService } from 'src/shared/services/utils.service';

export class GithubProvider implements OAuthProviderInterface {
  readonly provider = 'github';
  readonly baseUrl: string;
  readonly httpInstance: Axios;

  constructor(
    private readonly configService: ConfigService,
    private readonly utilService: UtilsService,
  ) {
    this.baseUrl = 'https://api.github.com';
    this.httpInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Accept: 'application/vnd.github+json',
      },
    });
  }

  getOAuthUrl(state: string, redirectUrl?: string) {
    const clientId = process.env['GITHUB_CLIENT_ID'];
    const redirectUri = redirectUrl;

    const scope = 'read:user read:org repo admin:repo_hook workflow';

    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;

    return url;
  }

  async exchangeCodeForToken(
    code: string,
    redirectUrl?: string,
  ): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    const tokenUrl = 'https://github.com/login/oauth/access_token';
    const clientId = process.env['GITHUB_CLIENT_ID'];
    const clientSecret = process.env['GITHUB_CLIENT_SECRET'];

    const requestBody = {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUrl,
    };

    const response = await axios.post<string>(tokenUrl, requestBody);

    const params = new URLSearchParams(response.data);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const expiresIn = params.get('expires_in');

    let expiresAt: Date | undefined;
    if (expiresIn) {
      expiresAt = new Date(Date.now() + parseInt(expiresIn) * 1000);
    }

    if (!accessToken) {
      throw new BadRequestException(
        'Failed to obtain access token from GitHub',
      );
    }

    return { accessToken, refreshToken, expiresAt };
  }

  async getHttpInstance(props: GetHttpInstanceProps): Promise<Axios> {
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${props.accessToken}`,
      },
    });
  }

  async getRepo(props: GetRepoRequest): Promise<GetRepoResponse> {
    const http = await this.getHttpInstance(props);

    const response = await http.get<GithubRepo>(`/repos/${props.repoFullPath}`);

    return {
      id: response.data.id,
      repoName: response.data.name,
      repoFullPath: response.data.full_name,
      private: response.data.private,
      repoDescription: response.data.description,
      repoUrl: response.data.html_url,
    };
  }

  async getRepoEnvironments(
    props: GetEnvironmentsRequest,
  ): Promise<GetEnvironmentsResponse[]> {
    const http = await this.getHttpInstance(props);

    const response = await http.get<{ environments: GithubRepoEnvironment[] }>(
      `/repos/${props.repoFullPath}/environments`,
    );

    const data = response.data.environments.map(
      (environment): GetEnvironmentsResponse => ({
        id: environment.id,
        name: environment.name,
        url: environment.url,
        createdAt: new Date(environment.created_at),
        updatedAt: new Date(environment.updated_at),
      }),
    );

    return data;
  }

  async createEnvironment(
    props: CreateEnvironmentRequest,
  ): Promise<GetEnvironmentsResponse> {
    const http = await this.getHttpInstance(props);

    const response = await http.put<GithubRepoEnvironment>(
      `/repos/${props.repoFullPath}/environments/${props.environmentName}`,
      {},
    );

    return {
      id: response.data.id,
      name: response.data.name,
      url: response.data.url,
      createdAt: new Date(response.data.created_at),
      updatedAt: new Date(response.data.updated_at),
    };
  }

  async getSecretPublicKey(
    props: GetSecretPublicKeyRequest,
  ): Promise<GetSecretPublicKeyResponse> {
    const http = await this.getHttpInstance(props);

    const response = await http.get<GithubPublicKey>(
      props.environmentName
        ? `/repos/${props.repoFullPath}/environments/${props.environmentName}/secrets/public-key`
        : `/repos/${props.repoFullPath}/actions/secrets/public-key`,
    );

    return {
      keyId: response.data.key_id,
      publicKey: response.data.key,
    };
  }

  async createSecret(props: CreateSecretRequest) {
    const http = await this.getHttpInstance(props);

    const { publicKey, keyId } = await this.getSecretPublicKey(props);

    const encryptedValue = this.utilService.encryptLibSodium(
      props.value,
      publicKey,
    );

    await http.put<GithubRepoEnvironment>(
      props.envrionmentName
        ? `/repos/${props.repoFullPath}/environments/${props.envrionmentName}/secrets/${props.name}`
        : `/repos/${props.repoFullPath}/actions/secrets/${props.name}`,
      {
        encrypted_value: encryptedValue,
        key_id: keyId,
      },
    );
  }

  async getSecrets(props: GetSecretsRequest): Promise<GetSecretsResponse[]> {
    const http = await this.getHttpInstance(props);

    const response = await http.get<{ secrets: GithubSecret[] }>(
      props.environmentName
        ? `/repos/${props.repoFullPath}/environments/${props.environmentName}/secrets`
        : `/repos/${props.repoFullPath}/actions/secrets`,
    );

    return response.data.secrets.map((secret) => ({
      name: secret.name,
      createdAt: new Date(secret.created_at),
      updatedAt: new Date(secret.updated_at),
    }));
  }
}
