import path from "node:path";
import { CreateEnvxConfigFileParams } from "../types/script";
import { CONFIG_FILE_NAME } from "../configs/const";
import { existsSync } from "node:fs";
import fsp from "fs/promises";
import { GitHosts } from "../enums/githost.enum";

export function parseEnv(envContent: string): Record<string, string> {
  const result: Record<string, string> = {};

  const lines = envContent.split(/\r?\n/);

  let multilineKey: string | null = null;
  let multilineValue: string[] = [];

  for (let rawLine of lines) {
    let line = rawLine.trim();

    // Skip empty lines or comments
    if (!line || line.startsWith("#")) continue;

    // Handle ongoing multiline
    if (multilineKey) {
      // Remove trailing backslash if present
      if (line.endsWith("\\")) {
        multilineValue.push(line.slice(0, -1));
        continue;
      } else {
        multilineValue.push(line);
        result[multilineKey] = multilineValue.join("\n");
        multilineKey = null;
        multilineValue = [];
        continue;
      }
    }

    // Split key and value on the **first '='**
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      // Ignore malformed line
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    // Handle quoted values
    if (
      (value.startsWith('"') && !value.endsWith('"')) ||
      (value.startsWith("'") && !value.endsWith("'"))
    ) {
      // Start of multiline
      multilineKey = key;
      multilineValue.push(value.slice(1)); // remove starting quote
      continue;
    } else if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      // Strip quotes
      value = value.slice(1, -1);
    }

    // Handle escaped sequences
    value = value
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\=/g, "=")
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");

    result[key] = value;
  }

  return result;
}

export function parseObjectToEnv(obj: Record<string, any>): string {
  return Object.entries(obj)
    .map(([key, value]) => {
      if (typeof value === "string") {
        // Escape special characters and wrap in quotes if necessary
        const escapedValue = value
          .replace(/\\/g, "\\\\")
          .replace(/\n/g, "\\n")
          .replace(/\r/g, "\\r")
          .replace(/\t/g, "\\t")
          .replace(/"/g, '\\"');

        return `${key}="${escapedValue}"`;
      } else if (typeof value === "object") {
        // For objects/arrays, stringify and wrap in quotes
        const stringValue = JSON.stringify(value)
          .replace(/\\/g, "\\\\")
          .replace(/\n/g, "\\n")
          .replace(/\r/g, "\\r")
          .replace(/\t/g, "\\t")
          .replace(/"/g, '\\"');

        return `${key}="${stringValue}"`;
      } else {
        // For other types (number, boolean, etc.), convert to string
        return `${key}="${String(value)}"`;
      }
    })
    .join("\n");
}

export async function getConfigFileContent(): Promise<CreateEnvxConfigFileParams> {
  const configFilePath = path.join(process.cwd(), CONFIG_FILE_NAME);

  if (!existsSync(configFilePath)) {
    throw new Error(
      `Config file not found at ${configFilePath}. Please run 'envx init' to create a new configuration.`,
    );
  }

  const configContent = await fsp.readFile(configFilePath, "utf-8");
  const config = JSON.parse(configContent) as CreateEnvxConfigFileParams;

  return config;
}

export function parseTruthyFalsyInput(
  input: string,
  defaultValue: boolean,
): boolean {
  const normalizedInput = input?.trim().toLowerCase();

  if (["true", "yes", "y", "1"].includes(normalizedInput)) {
    return true;
  } else if (["false", "no", "n", "0"].includes(normalizedInput)) {
    return false;
  } else {
    // If input is not recognized, return the default value
    return defaultValue;
  }
}

export function parseEnvErrors(envContent: string) {
  const content = parseEnv(envContent);

  if (typeof content != "object") return "Error parsing env";
  if (!Object.values(content).every((val) => val))
    return "Some fields are empty";

  return null;
}

export function parseError<T>(error: any): T {
  const extractedError =
    typeof error === "object" && "response" in error
      ? error.response?.data?.message ||
        error.response?.data?.error ||
        error.message
      : error;

  return extractedError as T;
}

export function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch (err) {
    return false;
  }
}

export function parseGitHostInfo(url: string): {
  platform: GitHosts;
  owner: string;
  repo: string;
  repoPath: string;
} {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.toLowerCase();
    const pathParts = parsed.pathname.split("/").filter(Boolean); // remove empty strings

    let platform: GitHosts | null = null;
    if (domain === "github.com") platform = GitHosts.GitHub;
    else if (domain === "gitlab.com") platform = GitHosts.GitLab;
    else platform = null;

    if (!platform || pathParts.length < 2)
      return { platform, owner: null, repo: null, repoPath: null };

    const owner = pathParts[0];
    const repo = pathParts[1].replace(/\.git$/, ""); // remove .git if present

    const repoPath = `${owner}/${repo}`;

    return { platform, owner, repo, repoPath };
  } catch {
    // Invalid URL
    return { platform: null, owner: null, repo: null, repoPath: null };
  }
}
