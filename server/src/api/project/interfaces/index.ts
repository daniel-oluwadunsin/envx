export interface PopulateProjectAccess {
  projectId: string;
  usersIds: string[];
}

export interface DeleteUserProjectAccess {
  projectId: string;
  userId: string;
}
