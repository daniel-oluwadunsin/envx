export interface SendMail<CTX extends {} = {}> {
  to: string;
  subject: string;
  template: string;
  context?: CTX;
}

export interface SendMailViaApi {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}