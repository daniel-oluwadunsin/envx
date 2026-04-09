import { ConfigService } from '@nestjs/config';
import { OAuthProviderInterface } from './oauth-provider.interface';
import axios, { Axios } from 'axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  CreateEnvironmentRequest,
  CreateSecretRequest,
  DeleteSecretRequest,
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

@Injectable()
export class GithubProvider implements OAuthProviderInterface {
  readonly provider = 'github';
  readonly baseUrl = 'https://api.github.com';
  readonly httpInstance: Axios;

  constructor(
    private readonly configService: ConfigService,
    private readonly utilService: UtilsService,
  ) {
    this.httpInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Accept: 'application/vnd.github+json',
      },
    });
  }

  private generateAppJWT(): string {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!appId || !privateKey) {
      throw new BadRequestException(
        'GITHUB_APP_ID and GITHUB_PRIVATE_KEY must be configured',
      );
    }

    const now = Math.floor(Date.now() / 1000);

    const encodedHeader = Buffer.from(
      JSON.stringify({ alg: 'RS256', typ: 'JWT' }),
    )
      .toString('base64url')
      .replace(/=/g, '');

    const encodedPayload = Buffer.from(
      JSON.stringify({ iat: now - 60, exp: now + 600, iss: appId }),
    )
      .toString('base64url')
      .replace(/=/g, '');

    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto
      .createSign('RSA-SHA256')
      .update(unsignedToken)
      .end()
      .sign(privateKey)
      .toString('base64url')
      .replace(/=/g, '');

    return `${unsignedToken}.${signature}`;
  }

  getOAuthUrl(_: string, redirectUrl?: string, state?: string) {
    const appName = process.env.GITHUB_APP_SLUG;

    if (!appName) {
      throw new BadRequestException('GITHUB_APP_SLUG must be configured');
    }

    const url = new URL(
      `https://github.com/apps/${appName}/installations/new?state=${state}`,
    );

    if (redirectUrl) {
      url.searchParams.set('redirect_url', redirectUrl);
    }

    return url.toString();
  }

  async exchangeCodeForToken(
    _code: string,
    _redirectUrl?: string,
  ): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    throw new BadRequestException(
      'GitHub OAuth code exchange is not supported. Use GitHub App installation flow.',
    );
  }

  async createInstallationAccessToken(
    installationId: string,
  ): Promise<TokenResponse> {
    if (!installationId) {
      throw new BadRequestException('GitHub installation id is required');
    }

    const jwtToken = this.generateAppJWT();
    const res = await axios.post(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {},
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );

    if (!res.data?.token) {
      throw new BadRequestException(
        'Failed to create GitHub installation token',
      );
    }

    return {
      accessToken: res.data.token,
      expiresAt: res.data.expires_at
        ? new Date(res.data.expires_at)
        : undefined,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    return this.createInstallationAccessToken(refreshToken);
  }

  async getHttpInstance(props: GetHttpInstanceProps): Promise<Axios> {
    const shouldRefresh =
      !props.accessToken ||
      (!!props.expiresAt && props.expiresAt.getTime() <= Date.now() + 60_000);

    if (shouldRefresh && props.refreshToken) {
      const token = await this.refreshAccessToken(props.refreshToken);
      props.accessToken = token.accessToken;
      props.expiresAt = token.expiresAt;
      await props.updateAccessToken?.(token.accessToken, token.expiresAt);
    }

    if (!props.accessToken) {
      throw new BadRequestException('GitHub access token is not configured');
    }

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

    return response.data.environments.map((env) => ({
      id: env.id,
      name: env.name,
      url: env.url,
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
      const response = await http.get<GithubRepoEnvironment>(
        `/repos/${props.repoFullPath}/environments/${environmentName}`,
      );

      return {
        id: response.data.id,
        name: response.data.name,
        url: response.data.url,
        createdAt: new Date(response.data.created_at),
        updatedAt: new Date(response.data.updated_at),
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404)
        return null;
      throw error;
    }
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

    return { keyId: response.data.key_id, publicKey: response.data.key };
  }

  async createSecret(props: CreateSecretRequest) {
    const http = await this.getHttpInstance(props);
    const { publicKey, keyId } = await this.getSecretPublicKey(props);

    const encryptedValue = await this.utilService.encryptLibSodium(
      props.value,
      publicKey,
    );

    await http.put(
      props.environmentName
        ? `/repos/${props.repoFullPath}/environments/${props.environmentName}/secrets/${props.name}`
        : `/repos/${props.repoFullPath}/actions/secrets/${props.name}`,
      { encrypted_value: encryptedValue, key_id: keyId },
      {
        headers: {
          'X-GitHub-Api-Version': '2026-03-10',
        },
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

  async deleteSecret(props: DeleteSecretRequest): Promise<void> {
    const http = await this.getHttpInstance(props);
    await http.delete(
      props.environmentName
        ? `/repos/${props.repoFullPath}/environments/${props.environmentName}/secrets/${props.name}`
        : `/repos/${props.repoFullPath}/actions/secrets/${props.name}`,
    );
  }
}
