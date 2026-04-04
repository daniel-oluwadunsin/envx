import inquirer from "inquirer";
import envxProgram from "../program";
import { createEnvFile, createEnvxConfigFile } from "../scripts";
import { envService } from "../services/env.service";
import { orgService } from "../services/org.service";
import { projectService } from "../services/project.service";
import { getConfigFilePath } from "../utils/helpers";
import Logger from "../utils/logger";
import {
  getConfigFileContent,
  parseEnvErrors,
  parseObjectToEnv,
} from "../utils/parser";
import {
  DEFAULT_ENV_FILE_PATH,
  DEFAULT_LOCAL_BACKUP_PATH,
  ENCRYPTION_PUBLIC_KEY,
} from "../configs/const";
import fsp from "fs/promises";
import fs from "fs";
import path from "path";
import {
  encrypt,
  encryptWithPublicKey,
  generateAesKey,
} from "../utils/encryption";

const logger = new Logger("env-crud");

const environmentsCommand = envxProgram.command("environments");
const organizationsCommand = envxProgram.command("organizations");
const projectsCommand = envxProgram.command("projects");

organizationsCommand.command("list").action(async () => {
  logger.info("Fetching organizations...");

  const orgs = await orgService.getOrgs();

  if (orgs.length === 0) {
    logger.info("No organizations found.");
    process.exit(1);
  }

  orgs.forEach((org) => {
    logger.info(`- ${org.name} (ID: ${org.id})`);
  });
});

projectsCommand
  .command("list")
  .option("-o, --organization <organizationId>")
  .action(async (_, options) => {
    const { organizationId, skipOrgs } = options;

    logger.info("Fetching projects...");

    let organization = undefined;

    if (organizationId) {
      organization = organizationId;
    }

    const projects = await projectService.getProjects(organization);
    if (projects.length === 0) {
      logger.info("No projects found.");
      process.exit(1);
    }

    projects.forEach((project) => {
      // log with organization name and id and project id
      logger.info(
        `- ${project.name} (ID: ${project.id}) - Organization: ${project.orgName} (ID: ${project.orgId})`,
      );
    });
  });

environmentsCommand
  .command("list")
  .option("-p --project <projectId>")
  .action(async (_, options) => {
    logger.info("Fetching environments...");

    let { projectId } = options;

    if (!projectId) {
      const config = await getConfigFileContent();

      projectId = config.projectId;
    }

    if (!projectId) {
      logger.error(
        "Project not configured, please update config file or run envx configure",
      );

      process.exit(1);
    }

    const environments = await envService.getProjectEnvironments(projectId);

    if (environments.length === 0) {
      logger.info("No environments found.");
      process.exit(1);
    }

    environments.forEach((env) => {
      // if slug is not the same as name, then add name in brackets to the log
      const envDisplayName =
        env.slug.toLowerCase() !== env.name.toLowerCase()
          ? `${env.slug} (${env.name})`
          : env.slug;
      logger.info(`- ${envDisplayName} (Latest Version: ${env.latestVersion})`);
    });
  });

environmentsCommand
  .command("create [name]")
  .option("-p --project <projectId>")
  .action(async (name, options) => {
    const { projectId } = options;
    logger.info("Creating a new environment...");

    const config = await getConfigFileContent();
    const targetProjectId = projectId || config.projectId;

    if (!targetProjectId) {
      logger.error(
        "Project not configured, please update config file or run envx configure",
      );
      process.exit(1);
    }

    const envName = name
      ? { envName: name }
      : await inquirer.prompt([
          {
            type: "input",
            name: "envName",
            message: "Enter a name for the new environment:",
            validate: (input) => {
              if (!input.trim()) {
                return "Environment name cannot be empty.";
              }
              return true;
            },
          },
        ]);

    try {
      const newEnv = await envService.createEnvironment(
        targetProjectId!,
        envName.envName,
      );

      logger.success(
        `Environment "${envName}" created successfully with slug "${newEnv.slug}"!`,
      );
    } catch (error: any) {
      logger.error(`Failed to create environment: ${error?.message}`);
      process.exit(1);
    }
  });

envxProgram
  .command("switch <environment>")
  .option(
    "-p --project <projectId>",
    "Specify project ID to switch environment in",
  )
  .option("-v, --version <version>", "Specify environment version to switch to")
  .action(async (environment, options) => {
    const { version, projectId } = options;

    logger.info(`🚘 Cruising to environment: ${environment}`);

    const config = await getConfigFileContent();
    const targetProjectId = projectId || config.projectId;

    if (!targetProjectId) {
      logger.error(
        "Project not configured, please update config file or run envx configure",
      );
      process.exit(1);
    }

    if (targetProjectId && environment.toLowerCase() === config.environment) {
      logger.info(`Already in environment: ${environment}`);
      process.exit(1);
    }

    config.projectId = targetProjectId;

    const envData = await envService
      .getProjectEnvironmentBySlug(targetProjectId, environment)
      .catch((error) => {
        if (error.response?.status === 404) {
          logger.error(`Environment with name ${environment} not found.`);
          return null;
        }

        logger.error(`Failed to fetch environment: ${error.message}`);
        return null;
      });

    if (envData) {
      const latestVersion = envData.latestVersion;

      if (version && latestVersion && version > latestVersion) {
        logger.error(
          `Specified version ${version} exceeds latest version ${latestVersion}.`,
        );
        process.exit(1);
      }

      config.environment = environment;
      config.currentEnvVersion = version || latestVersion;

      if (config.currentEnvVersion) {
        const envFile = await envService.getEnvFile({
          envSlug: environment,
          version: config.currentEnvVersion,
          projectId: targetProjectId,
        });

        if (!envFile) {
          logger.error(
            "No environment file found for the selected environment and version.",
          );
          process.exit(1);
        }

        const envObject = envFile.envObj;
        const envContent = parseObjectToEnv(envObject);

        await createEnvFile({
          envContent,
          envFilePath: config.envFilePath,
          localBackupBeforePull: config.localBackupBeforePull,
          localBackupPath: config.localBackupPath,
          overrideEnvFile: true,
        });
      }

      await createEnvxConfigFile(getConfigFilePath(), config);

      logger.success(
        `Switched to environment: ${environment} (version ${config.currentEnvVersion}) successfully!`,
      );

      if (!config.currentEnvVersion) {
        logger.warning(
          "Current environment has no version, .env file is not created/altered.",
        );
      }
    }
  });

envxProgram
  .command("pull")
  .option(
    "-f --file <filePath>",
    "Specify custom path to save the pulled env file",
  )
  .option("-e --environment <environment>", "Specify environment to pull")
  .option("-v, --version <version>", "Specify environment version to pull")
  .option(
    "--no-backup",
    "Do not create a local backup of the existing env file before pulling",
  )
  .option(
    "--backup-path <backupPath>",
    "Specify custom path for local backup of existing env file (default: .env.backup)",
  )
  .option(
    "--no-config",
    "Do not update envx config file with the pulled environment and version",
  )
  .option("--no-override", "Do not override env file but merge it instead")
  .action(async (options) => {
    logger.info("Pulling environment....");
    const config = await getConfigFileContent();

    const targetEnvironment = options.environment || config.environment;
    const targetProjectId = config.projectId;
    const targetEnvFilePath =
      options.file || config.envFilePath || DEFAULT_ENV_FILE_PATH;
    const targetEnvLocalBackupFilePath =
      options.backupPath || config.localBackupPath || DEFAULT_LOCAL_BACKUP_PATH;
    const localBackupBeforePull =
      options.backup !== false && config.localBackupBeforePull;
    const saveConfig = options.config !== false;
    const overrideEnvFile =
      config.alwaysOverrideEnvFile || options.override === true;

    if (!targetProjectId) {
      logger.error(
        "Project not configured, please update config file or run envx configure",
      );
      process.exit(1);
    }

    if (!targetEnvironment) {
      logger.error(
        "Environment not specified. Please provide an environment to pull using --environment option or set a default environment in the config file.",
      );
      process.exit(1);
    }

    if (!overrideEnvFile) {
      logger.warning(
        "Pass --no-override or set alwaysOverrideEnvFile to false, to merge local and remote envs when pulling.",
      );
    }

    const environment = await envService
      .getProjectEnvironmentBySlug(targetProjectId, targetEnvironment)
      .catch((error) => {
        if (error.response?.status === 404) {
          logger.error(
            `Environment with name ${targetEnvironment} not found in this project.`,
          );
          return null;
        }

        logger.error(`Failed to fetch environment: ${error.message}`);
        return null;
      });

    if (!environment) process.exit(1);

    const targetVersion = options.version || environment.latestVersion;

    if (
      targetVersion &&
      environment.latestVersion &&
      targetVersion > environment.latestVersion
    ) {
      logger.error(
        `Specified version ${targetVersion} exceeds latest version ${environment.latestVersion}.`,
      );
      process.exit(1);
    }

    if (environment.latestVersion <= config.currentEnvVersion) {
      const isSame = environment.latestVersion == config.currentEnvVersion;
      const confirm = await inquirer.prompt({
        type: "confirm",
        message: `The remote version is currently ${isSame ? "the same as" : "lower than"} your local version, pulling may override your changes. Do you want to proceed with pull?`,
        name: "proceed",
      });

      if (confirm.proceed != true) {
        logger.error("Pull cancelled by user");
        process.exit(1);
      }
    }

    const envFile = await envService.getEnvFile({
      envSlug: targetEnvironment,
      version: targetVersion,
      projectId: targetProjectId,
    });

    if (!envFile) {
      logger.error("Environment file not found for the specified environment.");
      process.exit(1);
    }

    const envObject = envFile.envObj;
    const envContent = parseObjectToEnv(envObject);

    await createEnvFile({
      envContent,
      envFilePath: targetEnvFilePath,
      localBackupBeforePull,
      localBackupPath: targetEnvLocalBackupFilePath,
      overrideEnvFile: overrideEnvFile,
    });

    if (saveConfig) {
      config.environment = targetEnvironment;
      config.currentEnvVersion = targetVersion;

      await createEnvxConfigFile(getConfigFilePath(), config);
    }

    logger.success(
      `Environment "${targetEnvironment}" (version ${targetVersion}) pulled successfully!`,
    );
  });

envxProgram
  .command("push")
  .requiredOption(
    "-c, --changelog <changelog>",
    "Add a changelog message for this push",
  )
  .action(async (options) => {
    logger.info("Pushing local .env file to the current environment...");

    const config = await getConfigFileContent();

    const envFilePath = config.envFilePath || DEFAULT_ENV_FILE_PATH;

    const filePathExists = fs.existsSync(path.join(process.cwd(), envFilePath));

    if (!filePathExists) {
      logger.error(".env file not found at specified path.");
      process.exit(1);
    }

    const envContent: string = await fsp
      .readFile(envFilePath, "utf-8")
      .catch((error) => {
        logger.error(
          `Failed to read .env file at ${envFilePath}: ${error.message}`,
        );
        return "0";
      });

    if (envContent == "0") process.exit(1);
    if (!envContent) {
      logger.error(".env file is empty, can not push empty file");
      process.exit(1);
    }

    const parsingError = parseEnvErrors(envContent);
    if (parsingError) {
      logger.error(parsingError);
      process.exit(1);
    }

    try {
      const latestVersion = await envService
        .getProjectEnvironmentBySlug(config.projectId, config.environment)
        .then((r) => r?.latestVersion || 0)
        .catch(() => 0);

      if (
        latestVersion &&
        config.currentEnvVersion &&
        config.currentEnvVersion < latestVersion
      ) {
        const confirm = await inquirer.prompt({
          type: "confirm",
          message: `A newer version (${latestVersion}) is available. Pushing now will override those changes. You can pull first instead. Proceed with push?`,
          name: "confirmPush",
        });

        console.log({ confirmPush: confirm.confirmPush });

        if (confirm.confirmPush != true) {
          logger.error("Push cancelled by user.");
          process.exit(1);
        }
      }

      const fileEncryptionKey = generateAesKey();
      const encryptedEnvContent = encrypt(envContent, fileEncryptionKey);
      const encryptedAesKey = encryptWithPublicKey(
        fileEncryptionKey,
        ENCRYPTION_PUBLIC_KEY,
      );

      const response = await envService.createEnv({
        envSlug: config.environment,
        envFile: JSON.stringify(encryptedEnvContent),
        encryptionKey: encryptedAesKey,
        projectId: config.projectId,
        changelog: options.changelog,
      });

      config.currentEnvVersion = response.version;
      await createEnvxConfigFile(getConfigFilePath(), config);

      logger.success(
        `Successfully pushed local .env to environment "${config.environment}". Latest version is now ${config.currentEnvVersion}.`,
      );
    } catch (error) {
      logger.error("Oops! error occured");
    }
  });
