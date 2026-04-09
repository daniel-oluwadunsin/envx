import { Axios } from 'axios';
import {
  OAuthProvider,
  TokenResponse,
  GetHttpInstanceProps,
  GetRepoRequest,
  GetRepoResponse,
  CreateEnvironmentRequest,
  GetEnvironmentsResponse,
  GetEnvironmentsRequest,
  CreateSecretRequest,
  GetSecretsRequest,
  GetSecretsResponse,
  GetSecretPublicKeyRequest,
  GetSecretPublicKeyResponse,
  DeleteSecretRequest,
} from 'src/shared/types/oauth';

export interface OAuthProviderInterface {
  readonly provider: OAuthProvider;
  readonly baseUrl: string;
  readonly httpInstance: Axios;

  getOAuthUrl(state: string, redirectUrl?: string): string;

  getInstallationToken?(installationId: string): Promise<string>;

  exchangeCodeForToken?(
    code: string,
    state: string,
    redirectUrl?: string,
  ): Promise<TokenResponse>;

  getHttpInstance(props: GetHttpInstanceProps): Promise<Axios>;

  refreshAccessToken?(refreshToken: string): Promise<TokenResponse>;

  getRepo(props: GetRepoRequest): Promise<GetRepoResponse>;

  getRepoEnvironments(
    props: GetEnvironmentsRequest,
  ): Promise<GetEnvironmentsResponse[]>;

  getSingleEnvironment(
    props: GetEnvironmentsRequest,
    environmentName: string,
  ): Promise<GetEnvironmentsResponse | null>;

  createEnvironment(
    props: CreateEnvironmentRequest,
  ): Promise<GetEnvironmentsResponse>;

  createSecret(props: CreateSecretRequest): Promise<void>;

  getSecrets(props: GetSecretsRequest): Promise<GetSecretsResponse[]>;

  getSecretPublicKey?(
    props: GetSecretPublicKeyRequest,
  ): Promise<GetSecretPublicKeyResponse>;

  deleteSecret?(props: DeleteSecretRequest): Promise<void>;
}
