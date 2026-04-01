export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export type SignUpDto = {
  name: string;
  email: string;
  cliCode?: string;
};

export type CreateProjectDto = {
  name: string;
  organizationId: string;
  description?: string;
};
