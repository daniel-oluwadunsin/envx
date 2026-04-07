import {
  CreateEnvFileParams,
  CreateEnvxConfigFileParams,
} from "../types/script";
import fsp from "fs/promises";
import fs from "fs";
import path from "path";
import {
  DEFAULT_ENV_FILE_PATH,
  DEFAULT_LOCAL_BACKUP_PATH,
} from "../configs/const";
import Logger from "../utils/logger";
import { parseEnv, parseObjectToEnv } from "../utils/parser";

const logger = new Logger("scripts");

const addFileToGitIgnore = async (fileName: string) => {
  const gitignorePath = path.join(process.cwd(), ".gitignore");

  if (!fs.existsSync(gitignorePath)) {
    console.log(".gitignore file does not exist.");
    return;
  }

  const gitignoreContent = await fsp.readFile(gitignorePath, "utf-8");
  const lines = gitignoreContent.split(/\r?\n/).map((line) => line.trim());

  // Only check for an exact match
  const exists = lines.includes(fileName);

  if (!exists) {
    await fsp.appendFile(gitignorePath, `\n${fileName}\n`, {
      encoding: "utf-8",
    });
  }
};

export const createEnvxConfigFile = async (
  configFilePath: string,
  config: CreateEnvxConfigFileParams,
) => {
  try {
    await fsp.writeFile(configFilePath, JSON.stringify(config, null, 2), {
      encoding: "utf-8",
    });
    logger.success(`Envx config file created at ${configFilePath}`);
  } catch (error) {
    logger.error(
      `Failed to create envx config file at ${configFilePath}:`,
      error,
    );
    throw error;
  }
};

export const createEnvFile = async (params: CreateEnvFileParams) => {
  if (!params.envContent) {
    logger.error("Env content is required to create env file.");
    return;
  }

  const envFilePath = path.join(
    process.cwd(),
    params.envFilePath || DEFAULT_ENV_FILE_PATH,
  );

  if (params.localBackupBeforePull) {
    const localBackupPath = path.join(
      process.cwd(),
      params.localBackupPath || DEFAULT_LOCAL_BACKUP_PATH,
    );

    try {
      if (fs.existsSync(envFilePath)) {
        if (!fs.existsSync(localBackupPath)) {
          await fsp.writeFile(localBackupPath, "", { encoding: "utf-8" });
        }

        await fsp.copyFile(envFilePath, localBackupPath);

        const backupFileName = path.basename(localBackupPath);
        await addFileToGitIgnore(backupFileName);

        logger.success(
          `Local backup created at ${localBackupPath} before pulling from server.`,
        );
      } else {
        logger.warning(
          `No existing env file found at ${envFilePath}. Skipping local backup.`,
        );
      }
    } catch (error) {
      logger.error(
        `Failed to create local backup at ${localBackupPath}:`,
        error,
      );
      throw error;
    }
  }

  const previousEnvContentExists = fs.existsSync(envFilePath);

  if (params.overrideEnvFile || !previousEnvContentExists) {
    await fsp.writeFile(envFilePath, params.envContent, {
      encoding: "utf-8",
    });
  } else {
    const previousEnvContent = await fsp.readFile(envFilePath, "utf-8");

    const previousEnvObj = parseEnv(previousEnvContent);
    const currentEnvObj = parseEnv(params.envContent);

    Object.entries(currentEnvObj).forEach(([key, value]) => {
      previousEnvObj[key] = value;
    });

    const newEnvContent = parseObjectToEnv(previousEnvObj);

    await fsp.writeFile(envFilePath, newEnvContent, {
      encoding: "utf-8",
    });
  }

  await addFileToGitIgnore(path.basename(envFilePath));
  logger.success(`Env file created at ${envFilePath}`);
};
