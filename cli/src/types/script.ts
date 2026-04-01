export type CreateEnvxConfigFileParams = {
  organizationId?: string;
  projectId?: string;
  currentEnvVersion?: number;
  environment?: string;
  localBackupBeforePull?: boolean;
  localBackupPath?: string;
  envFilePath?: string;
};
