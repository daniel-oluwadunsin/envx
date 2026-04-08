import inquirer from "inquirer";
import { GitHosts } from "../enums/githost.enum";
import envxProgram from "../program";
import Logger from "../utils/logger";
import {
  getConfigFileContent,
  isValidUrl,
  parseError,
  parseGitHostInfo,
} from "../utils/parser";
import { githostService } from "../services/githost.service";
import open from "open";
import { AxiosError } from "axios";

const logger = new Logger("githost");

const githostCommand = envxProgram
  .command("githost")
  .description("Manage git hosts");

const validateGitHost = (provider: string) => {
  const validProviders = Object.values(GitHosts);
  if (!validProviders.includes(provider as GitHosts)) {
    console.error(
      `Invalid provider. Valid options are: ${validProviders.join(", ")}`,
    );
    process.exit(1);
  }
};

githostCommand.command("authorize [provider]").action(async (provider) => {
  try {
    const config = await getConfigFileContent();

    if (!config?.projectId) {
      console.error("No project ID found in config file.");
      process.exit(1);
    }

    const configuredProviders = await githostService.getOAuthProviders(
      config.projectId,
    );

    const unconfiguredProviders = Object.values(GitHosts).filter(
      (p) => !configuredProviders.includes(p),
    );

    if (configuredProviders.length > 0) {
      if (provider) {
        if (configuredProviders.includes(provider as GitHosts)) {
          logger.warning(`Project is already authorized with ${provider}.`);
          process.exit(0);
        }
      } else {
        if (unconfiguredProviders.length != 0) {
          logger.warning(
            `Project is already authorized with the following providers: ${configuredProviders.join(", ")}.`,
          );
        }
      }
    }

    if (unconfiguredProviders.length === 0) {
      logger.warning(
        `Project is already authorized with all available providers: ${configuredProviders.join(", ")}.`,
      );

      process.exit(0);
    }

    if (!provider) {
      provider = await inquirer
        .prompt([
          {
            type: "select",
            name: "provider",
            message: "Select a git host provider to authorize:",
            choices: unconfiguredProviders,
          },
        ])
        .then((answers) => answers.provider);
    }

    validateGitHost(provider);
    logger.log(`Authorizing with ${provider}...`);

    const { url } = await githostService.initiateOAuth(
      config.projectId,
      provider,
    );

    logger.log(
      `A browser window will open for you to authorize envx with ${provider}. If it doesn't open, please visit the following URL:`,
    );
    logger.info(url);

    open(url);

    logger.log("Waiting for authorization to complete...");
    const { status } = await githostService.pollVerifyOAuth(
      config.projectId,
      provider,
      3000,
      5 * 60 * 1000,
    );

    if (status === "success") {
      logger.success(`Successfully authorized with ${provider}!`);
    } else {
      logger.error(
        `Authorization with ${provider} failed or timed out. Please try again.`,
      );
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error(parseError(error));
      process.exit(1);
    }
  }
});

githostCommand
  .command("logout [provider]")
  .option("--remove-origins", "Remove associated origins")
  .action(async (provider, options) => {
    const removeOrigins = options.removeOrigins || false;

    const config = await getConfigFileContent();

    if (!config?.projectId) {
      console.error("No project ID found in config file.");
      process.exit(1);
    }

    const configuredProviders = await githostService.getOAuthProviders(
      config.projectId,
    );

    if (configuredProviders.length === 0) {
      logger.warning(`No git host providers are currently authorized.`);
      process.exit(0);
    }

    if (!provider) {
      provider = await inquirer
        .prompt([
          {
            type: "select",
            name: "provider",
            message: "Select a git host provider to remove authorization:",
            choices: configuredProviders,
          },
        ])
        .then((answers) => answers.provider);
    }

    validateGitHost(provider);
    if (!configuredProviders.includes(provider as GitHosts)) {
      logger.error(`Project is not authorized with ${provider}.`);
      process.exit(0);
    }

    logger.log(`Removing authorization with ${provider}...`);

    const success = await githostService.removeOAuth(
      config.projectId,
      provider,
      removeOrigins,
    );

    if (success) {
      logger.success(`Successfully removed authorization with ${provider}.`);
    } else {
      logger.error(
        `Failed to remove authorization with ${provider}. Please try again.`,
      );
    }
  });

githostCommand
  .command("add <originName> <url>")
  .description("Add a git host origin")
  .action(async (originName, url) => {
    try {
      const config = await getConfigFileContent();

      if (!config?.projectId) {
        console.error("No project ID found in config file.");
        process.exit(1);
      }

      if (!isValidUrl(url)) {
        logger.error(
          `Invalid URL: ${url}. Please provide a valid git host URL.`,
        );
        process.exit(1);
      }

      const { platform, owner, repo } = parseGitHostInfo(url);

      if (!platform || !owner || !repo) {
        logger.error(
          `Unable to parse git host information from URL. Please ensure the URL is valid and points to a supported git host repo (GitHub or GitLab).`,
        );
        process.exit(1);
      }

      const configuredProviders = await githostService.getOAuthProviders(
        config.projectId,
      );

      if (!configuredProviders.includes(platform)) {
        logger.error(
          `Project is not authorized with ${platform}. Please authorize first using 'envx githost authorize ${platform}'.`,
        );
        process.exit(1);
      }

      logger.log(`Adding git host origin ${originName}...`);

      await githostService.createGitHostOrigin({
        projectId: config.projectId,
        hostName: originName,
        hostUrl: url,
      });

      logger.success(`Successfully added git host origin ${originName}.`);
    } catch (error) {
      if (error instanceof AxiosError) {
        logger.error(parseError(error));
        process.exit(1);
      }
    }
  });

githostCommand.command("get-hosts [provider]").action(async (provider) => {
  try {
    const config = await getConfigFileContent();

    if (!config?.projectId) {
      console.error("No project ID found in config file.");
      process.exit(1);
    }

    if (provider) {
      validateGitHost(provider);
    }

    logger.log(`Fetching git host origins...`);

    const origins = await githostService.getProjectGitHostOrigins(
      config.projectId,
      provider,
    );

    if (origins.length === 0) {
      logger.info(`No git host origins found for this project.`);
    } else {
      logger.success(`Git host origins:`);
      origins.forEach((origin) => {
        logger.log(`- ${origin.name}: ${origin.repoUrl}`);
      });
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error(parseError(error));
      process.exit(1);
    }
  }
});
