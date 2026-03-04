import type {
  User,
  Organization,
  Project,
  Environment,
  EnvVariable,
  EnvVersion,
  ActivityLog,
  Token,
} from "@/lib/types";

export const currentUser: User = {
  id: "usr_1",
  name: "Alex Chen",
  email: "alex@envx.dev",
  avatar: "",
  role: "owner",
};

export const organizations: Organization[] = [
  {
    id: "org_1",
    name: "Acme Corp",
    slug: "acme-corp",
    members: 12,
    projects: 5,
    createdAt: "2025-08-15",
  },
  {
    id: "org_2",
    name: "Startup Labs",
    slug: "startup-labs",
    members: 4,
    projects: 2,
    createdAt: "2025-11-02",
  },
  {
    id: "org_3",
    name: "DevOps Inc",
    slug: "devops-inc",
    members: 8,
    projects: 3,
    createdAt: "2026-01-10",
  },
];

export const projects: Project[] = [
  {
    id: "prj_1",
    name: "Web App",
    slug: "web-app",
    orgId: "org_1",
    orgName: "Acme Corp",
    environments: 3,
    lastUpdated: "2 hours ago",
    description: "Main production web application",
  },
  {
    id: "prj_2",
    name: "API Server",
    slug: "api-server",
    orgId: "org_1",
    orgName: "Acme Corp",
    environments: 3,
    lastUpdated: "5 hours ago",
    description: "REST API backend service",
  },
  {
    id: "prj_3",
    name: "Mobile App",
    slug: "mobile-app",
    orgId: "org_1",
    orgName: "Acme Corp",
    environments: 2,
    lastUpdated: "1 day ago",
    description: "React Native mobile application",
  },
  {
    id: "prj_4",
    name: "Auth Service",
    slug: "auth-service",
    orgId: "org_2",
    orgName: "Startup Labs",
    environments: 2,
    lastUpdated: "3 days ago",
    description: "Authentication microservice",
  },
  {
    id: "prj_5",
    name: "Data Pipeline",
    slug: "data-pipeline",
    orgId: "org_2",
    orgName: "Startup Labs",
    environments: 1,
    lastUpdated: "1 week ago",
    description: "ETL data processing pipeline",
  },
];

export const environments: Environment[] = [
  {
    id: "env_1",
    name: "Development",
    slug: "development",
    projectId: "prj_1",
    latestVersion: 14,
    lastUpdated: "2 hours ago",
    variableCount: 24,
  },
  {
    id: "env_2",
    name: "Staging",
    slug: "staging",
    projectId: "prj_1",
    latestVersion: 12,
    lastUpdated: "1 day ago",
    variableCount: 24,
  },
  {
    id: "env_3",
    name: "Production",
    slug: "production",
    projectId: "prj_1",
    latestVersion: 10,
    lastUpdated: "3 days ago",
    variableCount: 22,
  },
];

export const envVariables: EnvVariable[] = [
  {
    id: "var_1",
    key: "DATABASE_URL",
    value: "postgresql://user:pass@db.example.com:5432/mydb",
    updatedAt: "2 hours ago",
    updatedBy: "Alex Chen",
  },
  {
    id: "var_2",
    key: "REDIS_URL",
    value: "redis://default:secret@redis.example.com:6379",
    updatedAt: "2 hours ago",
    updatedBy: "Alex Chen",
  },
  {
    id: "var_3",
    key: "API_SECRET_KEY",
    value: "sk_live_abc123def456ghi789jkl012mno345",
    updatedAt: "5 hours ago",
    updatedBy: "Jordan Lee",
  },
  {
    id: "var_4",
    key: "NEXT_PUBLIC_APP_URL",
    value: "https://app.acme.com",
    updatedAt: "1 day ago",
    updatedBy: "Alex Chen",
  },
  {
    id: "var_5",
    key: "STRIPE_SECRET_KEY",
    value: "sk_live_51abc123def456ghi789jkl012mno345pqr678",
    updatedAt: "1 day ago",
    updatedBy: "Sam Park",
  },
  {
    id: "var_6",
    key: "SMTP_HOST",
    value: "smtp.sendgrid.net",
    updatedAt: "3 days ago",
    updatedBy: "Alex Chen",
  },
  {
    id: "var_7",
    key: "SMTP_PASSWORD",
    value: "SG.abc123def456ghi789jkl012mno345pqr678",
    updatedAt: "3 days ago",
    updatedBy: "Alex Chen",
  },
  {
    id: "var_8",
    key: "JWT_SECRET",
    value: "super_secret_jwt_key_that_should_not_be_shared",
    updatedAt: "1 week ago",
    updatedBy: "Jordan Lee",
  },
];

export const envVersions: EnvVersion[] = [
  {
    id: "ver_1",
    version: 14,
    createdBy: "Alex Chen",
    createdAt: "2 hours ago",
    changes: 2,
  },
  {
    id: "ver_2",
    version: 13,
    createdBy: "Jordan Lee",
    createdAt: "1 day ago",
    changes: 1,
  },
  {
    id: "ver_3",
    version: 12,
    createdBy: "Alex Chen",
    createdAt: "3 days ago",
    changes: 3,
  },
  {
    id: "ver_4",
    version: 11,
    createdBy: "Sam Park",
    createdAt: "5 days ago",
    changes: 1,
  },
  {
    id: "ver_5",
    version: 10,
    createdBy: "Alex Chen",
    createdAt: "1 week ago",
    changes: 4,
  },
  {
    id: "ver_6",
    version: 9,
    createdBy: "Jordan Lee",
    createdAt: "2 weeks ago",
    changes: 2,
  },
];

export const activityLogs: ActivityLog[] = [
  {
    id: "log_1",
    action: "Updated variable",
    project: "Web App",
    environment: "Development",
    user: "Alex Chen",
    time: "2 hours ago",
  },
  {
    id: "log_2",
    action: "Deployed to staging",
    project: "API Server",
    environment: "Staging",
    user: "Jordan Lee",
    time: "5 hours ago",
  },
  {
    id: "log_3",
    action: "Created environment",
    project: "Mobile App",
    environment: "Preview",
    user: "Sam Park",
    time: "1 day ago",
  },
  {
    id: "log_4",
    action: "Rotated secret",
    project: "Web App",
    environment: "Production",
    user: "Alex Chen",
    time: "2 days ago",
  },
  {
    id: "log_5",
    action: "Added variable",
    project: "Auth Service",
    environment: "Development",
    user: "Jordan Lee",
    time: "3 days ago",
  },
  {
    id: "log_6",
    action: "Restored version",
    project: "Data Pipeline",
    environment: "Production",
    user: "Sam Park",
    time: "5 days ago",
  },
];

export const tokens: Token[] = [
  {
    id: "tok_1",
    name: "CI/CD Pipeline",
    lastUsed: "2 hours ago",
    createdAt: "2025-09-15",
    prefix: "envx_ci_",
  },
  {
    id: "tok_2",
    name: "Local Development",
    lastUsed: "1 day ago",
    createdAt: "2025-11-20",
    prefix: "envx_dev_",
  },
  {
    id: "tok_3",
    name: "Staging Deploy",
    lastUsed: "1 week ago",
    createdAt: "2026-01-05",
    prefix: "envx_stg_",
  },
];

export const teamMembers: User[] = [
  currentUser,
  {
    id: "usr_2",
    name: "Jordan Lee",
    email: "jordan@envx.dev",
    avatar: "",
    role: "admin",
  },
  {
    id: "usr_3",
    name: "Sam Park",
    email: "sam@envx.dev",
    avatar: "",
    role: "member",
  },
  {
    id: "usr_4",
    name: "Riley Kim",
    email: "riley@envx.dev",
    avatar: "",
    role: "member",
  },
];
