import { AUTH_TIMEOUT, FRONTEND_URL } from "../configs/const";
import envxProgram from "../program";
import { authService } from "../services";
import Logger from "../utils/logger";
import open from "open";
import { differenceInMilliseconds } from "date-fns";
import { SignInStatus, VerifyCliSignInResponse } from "../types/api";
import { KeychainUserData } from "../types/keychain";
import { KeychainKey } from "../enums/keychain.enum";
import { keychainService } from "../utils/keychain";

const logger = new Logger("auth");

envxProgram
  .command("login")
  .description("Authenticate and login to envx")
  .action(async () => {
    try {
      const cliCode = await authService.initSignIn();

      const url = `${FRONTEND_URL}/cli?code=${cliCode}`;

      open(url);
      logger.info(
        "A browser window has been opened for you to complete the login process. If it doesn't open, please open the following URL in your browser:",
        url,
      );

      logger.info("Waiting for authentication to complete...");
      const startTime = Date.now();
      let status: SignInStatus = "pending";
      let authResponse: VerifyCliSignInResponse | null = null;

      // rewrite with setInterval for better performance and user experience
      while (differenceInMilliseconds(new Date(), startTime) < AUTH_TIMEOUT) {
        authResponse = await authService.verifyCliSignIn(cliCode);

        status = authResponse.status;

        if (status !== "pending") {
          break;
        }

        // wait for 3 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      if (status === "failed") {
        logger.error("Authentication failed, please try again.");

        return;
      } else if (status === "expired" || status === "pending") {
        logger.error("Authentication timed out, please try again.");

        return;
      }

      const accessToken = authResponse?.accessToken;

      if (accessToken) {
        const keychainData: KeychainUserData = {
          userId: authResponse.user.id,
          userName: authResponse.user.name,
          accessToken,
        };

        await keychainService.setValue(
          KeychainKey.Access,
          JSON.stringify(keychainData),
        );

        logger.success("Successfully authenticated! ✅");
      } else {
        logger.error("Authentication failed, no access token received.");
      }
    } catch (error) {
      console.log(error);
      logger.error("Error signing in, try again");
    }
  });

envxProgram
  .command("logout")
  .description("Logout and clear your authenticated session")
  .action(async () => {
    try {
      const keychainData = await keychainService.getValue(KeychainKey.Access);

      if (!keychainData) {
        logger.warning("You are not logged in.");
        return;
      }

      await keychainService.deleteValue(KeychainKey.Access);
      logger.success("Successfully logged out! ✅");
    } catch (error) {
      logger.error("Error logging out, try again");
    }
  });
