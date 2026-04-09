export enum GitHosts {
  GitHub = "github",
  GitLab = "gitlab",
}

export const GitHostDisplayNames: Record<GitHosts, string> = {
  [GitHosts.GitHub]: "GitHub",
  [GitHosts.GitLab]: "GitLab",
};

export enum EnvDeployTarget {
  Environment = "environment",
  Action = "action",
}
