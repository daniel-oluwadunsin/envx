import { KeychainKey } from "../enums/keychain.enum";
import envxProgram from "../program";
import { keychainService } from "../utils/keychain";
import Logger from "../utils/logger";

const logger = new Logger("auth-hook");

const publicCommands = ["login", "help", "version"];

envxProgram.hook("preAction", async (thisCommand, actionCommand) => {
  if (publicCommands.includes(actionCommand.name())) {
    return;
  }

  // check if user is authenticated
  const isAuthenticated = await keychainService.getValue(KeychainKey.Access);

  if (!isAuthenticated) {
    logger.error(
      "You are not authenticated. Please run `envx login` to authenticate.",
    );
    process.exit(1);
  }

  return;
});
