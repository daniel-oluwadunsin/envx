export type CreateEnvxConfigFileParams = {
  projectId?: string;
  currentEnvVersion?: number;
  environment?: string;
  localBackupBeforePull?: boolean;
  localBackupPath?: string;
  envFilePath?: string;
  alwaysOverrideEnvFile?: boolean;
};

export type CreateEnvFileParams = {
  envFilePath?: string;
  envContent?: string;
  localBackupPath?: string;
  localBackupBeforePull?: boolean;
  overrideEnvFile?: boolean;
};
