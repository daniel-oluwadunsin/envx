import { CreateEnvxConfigFileParams } from "../types/script";
import fsp from "fs/promises";
import fs from "fs";
import path from "path";
import {
  DEFAULT_ENV_FILE_PATH,
  DEFAULT_LOCAL_BACKUP_PATH,
} from "../configs/const";
import Logger from "../utils/logger";

const logger = new Logger("scripts");

export const createEnvxConfigFile = async (
  configFilePath: string,
  config: CreateEnvxConfigFileParams,
) => {
  if (config.localBackupBeforePull) {
    const envFilePath = path.join(
      process.cwd(),
      config.envFilePath || DEFAULT_ENV_FILE_PATH,
    );

    const localBackupPath = path.join(
      process.cwd(),
      config.localBackupPath || DEFAULT_LOCAL_BACKUP_PATH,
    );

    try {
      if (fs.existsSync(envFilePath)) {
        await fsp.copyFile(
          envFilePath,
          localBackupPath,
          fs.constants.COPYFILE_FICLONE_FORCE, // override if exists, and try to create a copy-on-write clone for efficiency
        );

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
  }
};
