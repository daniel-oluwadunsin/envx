import { ConfigService } from '@nestjs/config';
import { OAuthProviderInterface } from '../../interfaces/oauth-provider';
import axios, { Axios } from 'axios';
import * as qs from 'qs';

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

    console.log('Redirect URL in GitLab provider (getOAuthUrl):', redirectUri);

    const url = `https://gitlab.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;

    return url;
  }

  async exchangeCodeForToken(
    code: string,
    state: string,
    redirectUrl?: string,
  ): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    const tokenUrl = 'https://gitlab.com/oauth/token';
    const clientId = process.env['GITLAB_APP_ID'];
    const clientSecret = process.env['GITLAB_CLIENT_SECRET'];

    console.log('Redirect URL in GitLab provider:', redirectUrl);

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
}
