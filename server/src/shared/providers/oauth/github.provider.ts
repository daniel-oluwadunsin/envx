import { ConfigService } from '@nestjs/config';
import { OAuthProviderInterface } from '../../interfaces/oauth-provider';
import axios, { Axios } from 'axios';
import { BadRequestException } from '@nestjs/common';

export class GithubProvider implements OAuthProviderInterface {
  readonly provider = 'github';
  readonly baseUrl: string;
  readonly httpInstance: Axios;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = 'https://api.github.com';
    this.httpInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Accept: 'application/json',
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

    console.log('GitHub token response:', response.data);

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
}
