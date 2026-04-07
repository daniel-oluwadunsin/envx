import { Axios } from 'axios';

export interface OAuthProviderInterface {
  readonly provider: OAuthProvider;
  readonly baseUrl: string;
  readonly httpInstance: Axios;

  getOAuthUrl(state: string, redirectUrl?: string): string;

  exchangeCodeForToken(
    code: string,
    state: string,
    redirectUrl?: string,
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  }>;
}
