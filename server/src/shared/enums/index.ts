export enum EventNames {
  SendMail = 'send.mail',
  SendSms = 'send.sms',
  PopulateProjectAccess = 'populate.project.access',
  DeleteUserProjectAccess = 'delete.user.project.access',
}

export const CacheKeys = {
  UserProjectAccess: (userId: string, projectId: string) =>
    `user:${userId}:project:${projectId}:access`,
};

export enum EnvDeployTarget {
  Environment = 'environment',
  Action = 'action',
}
