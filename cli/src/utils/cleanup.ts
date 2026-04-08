import Logger from "./logger";

const logger = new Logger("cleanup");

const cleanup = () => {
  process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception:", err);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
  });

  process.on("SIGINT", () => {
    logger.info("👋 Gracefully shutting down.");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    logger.info("👋 Gracefully shutting down.");
    process.exit(0);
  });
};

cleanup();
