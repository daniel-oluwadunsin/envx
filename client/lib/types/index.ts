export interface User {
  id: string;
  name: string;
  email: string;
  role: "User";
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  members: number;
  projects: number;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  orgId: string;
  orgName: string;
  environments: number;
  lastUpdated: string;
  description?: string;
}

export interface Environment {
  id: string;
  name: string;
  slug: string;
  projectId: string;
  latestVersion: number;
  lastUpdated: string;
  variableCount: number;
}

export interface EnvVariable {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
  updatedBy: string;
}

export interface EnvVersion {
  id: string;
  version: number;
  createdBy: string;
  createdAt: string;
  changes: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  project: string;
  environment: string;
  user: string;
  time: string;
}

export interface Token {
  id: string;
  name: string;
  lastUsed: string;
  createdAt: string;
  prefix: string;
}
