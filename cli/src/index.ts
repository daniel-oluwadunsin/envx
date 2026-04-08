#!/usr/bin/env node
import envxProgram from "./program";
import pkg from "../package.json";

import "./commands";
import "./hooks";
import "./utils/cleanup";

envxProgram
  .name("envx")
  .description("A CLI tool for managing environment variables")
  .version(pkg.version);

envxProgram.parse(process.argv);
