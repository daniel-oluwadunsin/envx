export type ApiResponse<T> = {
  success: true;
  data: T;
  message: string;
};

export type InitSignInResponse = {
  deviceCode: string;
  expiresAt: Date;
};

export type SignInStatus = "pending" | "success" | "expired" | "failed";

export type VerifyCliSignInResponse = {
  status: SignInStatus;
  accessToken?: string;
  user: {
    id?: string;
    name?: string;
  };
};
