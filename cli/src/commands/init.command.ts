import envxProgram from "../program";
import fsp from "fs/promises";
import fs from "fs";
import path from "path";
import {
  CONFIG_FILE_NAME,
  DEFAULT_ENV_FILE_PATH,
  DEFAULT_LOCAL_BACKUP_PATH,
} from "../configs/const";
import Logger from "../utils/logger";
import { Command } from "commander";
import { orgService } from "../services/org.service";
import { CreateEnvxConfigFileParams } from "../types/script";
import inquirer from "inquirer";
import { projectService } from "../services/project.service";
import { envService } from "../services/env.service";
import { createEnvxConfigFile } from "../scripts";

const logger = new Logger("init");

envxProgram.command("init").action(async () => {
  try {
    const configFile = path.join(process.cwd(), CONFIG_FILE_NAME);

    const exists = fs.existsSync(configFile);

    if (exists) {
      logger.error(`Config file already exists at ${configFile}. Aborting....`);
      return;
    }

    const config: CreateEnvxConfigFileParams = {
      projectId: "",
      organizationId: "",
      currentEnvVersion: 1,
      environment: "",
      localBackupBeforePull: true,
      localBackupPath: DEFAULT_LOCAL_BACKUP_PATH,
      envFilePath: DEFAULT_ENV_FILE_PATH,
    };

    // select organization, if there's only one organization, select it by default
    const orgs = await orgService.getOrgs();

    if (orgs.length === 0) {
      logger.error(
        "You don't have any organization yet. Please create an organization in the web app before initializing the config file.",
      );
      return;
    }

    if (orgs.length === 1) {
      config.organizationId = orgs[0].id;
      logger.info(
        `Only one organization found. Selected organization: ${orgs[0].name}`,
      );
    } else {
      const choice = await inquirer.prompt([
        {
          type: "select",
          name: "org",
          message: "Select an organization:",
          choices: orgs.map((org) => ({
            name: org.name,
            value: org.id,
          })),
        },
      ]);

      const selectedOrg = orgs.find((org) => org.id === choice.org);
      config.organizationId = choice.org;

      logger.info(`Selected organization: ${selectedOrg?.name}`);
    }

    logger.info("Fetching projects...");

    const projects = await projectService.getProjects(config.organizationId!);

    const projectChoices = new Array(projects.length + 1)
      .fill(null)
      .map((_, index) => {
        if (index == projects.length) {
          return {
            value: "add",
            name: "Create new project",
          };
        }

        return {
          value: projects[index].id,
          name: projects[index].name,
        };
      });

    const projectChoice = await inquirer.prompt([
      {
        type: "select",
        name: "project",
        message: "Select a project:",
        choices: projectChoices,
      },
    ]);

    if (projectChoice.project === "add") {
      logger.question(
        "What do you want to name your new project? (You can also change this later in the web app)",
      );

      const newProjectName = await inquirer.prompt([
        {
          type: "input",
          message: "",
          name: "name",
          validate: (input) => {
            if (!input || input.trim() === "") {
              return "Project name cannot be empty";
            }
            return true;
          },
        },
      ]);

      logger.info("Creating project...");

      const newProject = await projectService.createProject(
        newProjectName.name,
        config.organizationId!,
      );

      config.projectId = newProject?.id;
      logger.info(`Project "${newProjectName.name}" created and selected`);
    } else {
      const selectedProject = projects.find(
        (project) => project.id === projectChoice.project,
      );
      config.projectId = projectChoice.project;

      logger.info(`Selected project: ${selectedProject?.name}`);
    }

    const environments = await envService.getProjectEnvironments(
      config.projectId!,
    );

    if (environments.length === 0) {
      logger.warning(
        "No environment found for this project. You can set the environment in the config file later....",
      );
    } else {
      const envChoices = environments.map((env) => ({
        name: `${env.name} (latest version: ${env.latestVersion}`,
        value: env.slug,
      }));

      const envChoice = await inquirer.prompt([
        {
          type: "select",
          name: "env",
          message: "Select an environment to pull:",
          choices: envChoices,
        },
      ]);

      const selectedEnv = environments.find(
        (env) => env.slug === envChoice.env,
      );

      config.environment = envChoice.env;
      config.currentEnvVersion = selectedEnv?.latestVersion || 1;

      logger.info(`Selected environment: ${selectedEnv?.name}`);
    }

    await createEnvxConfigFile(configFile, config);
    logger.success(
      "Envx configured successfully, config file created at " + configFile,
    );
  } catch (error) {
    logger.error("Failed to initialize envx config file:", error);
  }
});
