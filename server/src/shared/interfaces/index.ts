import { OAuthProvider } from '../types/oauth';

export interface SendSmsDto {
  to: string;
  message: string;
}

export interface OAuthCallbackDto {
  code: string;
  state: string;
  provider: OAuthProvider;
}
