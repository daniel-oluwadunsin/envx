import envxProgram from "../program";
import fsp from "fs/promises";
import fs from "fs";
import path from "path";
import { CONFIG_FILE_NAME } from "../configs/const";
import Logger from "../utils/logger";
import { Command } from "commander";

const logger = new Logger("init");

envxProgram.command("init").action(async () => {
  const configFile = path.join(process.cwd(), CONFIG_FILE_NAME);

  const exists = fs.existsSync(configFile);

  if (exists) {
    logger.error(`Config file already exists at ${configFile}. Aborting....`);
    return;
  }

  // select organization, if there's only one organization, select it by default
  // get their projects, ask if they want to create new project under the organization
  // after that, get the environment for the project, if there's no project, skip and inform them they can set it in the config file later
  // set the latest version of the environment in the config file, if there's no environment, set to 1
});
