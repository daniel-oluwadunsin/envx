export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export type SignUpDto = {
  name: string;
  email: string;
};
