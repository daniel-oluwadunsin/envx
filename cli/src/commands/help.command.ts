import { Command, Option } from "commander";
import envxProgram from "../program";

type FlatCommand = {
  command: Command;
  path: string[];
};

const SPACE_BETWEEN_COLUMNS = 2;

const formatTable = (rows: Array<{ left: string; right: string }>) => {
  if (rows.length === 0) {
    return "";
  }

  const leftWidth = Math.max(...rows.map((row) => row.left.length));

  return rows
    .map(
      (row) =>
        `${row.left.padEnd(leftWidth + SPACE_BETWEEN_COLUMNS)}${row.right}`,
    )
    .join("\n");
};

const isRelevantCommand = (_command: Command) => true;

const formatArgumentName = (arg: Command["registeredArguments"][number]) => {
  const argName = arg.name() + (arg.variadic ? "..." : "");

  return arg.required ? `<${argName}>` : `[${argName}]`;
};

const flattenCommands = (
  command: Command,
  parentPath: string[] = [],
): FlatCommand[] => {
  return command.commands.filter(isRelevantCommand).flatMap((child) => {
    const currentPath = [...parentPath, child.name()];

    return [
      { command: child, path: currentPath },
      ...flattenCommands(child, currentPath),
    ];
  });
};

const getCommandLabel = (flatCommand: FlatCommand) => {
  const args = flatCommand.command.registeredArguments
    .map((arg) => formatArgumentName(arg))
    .join(" ");

  return args
    ? `${flatCommand.path.join(" ")} ${args}`
    : flatCommand.path.join(" ");
};

const getCommandUsage = (flatCommand: FlatCommand) => {
  const command = flatCommand.command;
  const args = command.registeredArguments
    .map((arg) => formatArgumentName(arg))
    .join(" ");
  const hasOptions = command.options.length > 0;

  const usageParts = [envxProgram.name(), flatCommand.path.join(" ")];

  if (hasOptions) {
    usageParts.push("[options]");
  }

  if (args) {
    usageParts.push(args);
  }

  return usageParts.join(" ");
};

const formatOption = (option: Option) => {
  const description = option.description || "No description provided";
  const defaultValue = option.defaultValue;

  if (defaultValue !== undefined) {
    return `${description} (default: ${String(defaultValue)})`;
  }

  return description;
};

const printOverviewHelp = (commands: FlatCommand[]) => {
  const commandRows = commands.map((flatCommand) => ({
    left: getCommandLabel(flatCommand),
    right: flatCommand.command.description() || "No description provided",
  }));

  const optionRows = envxProgram.options.map((option) => ({
    left: option.flags,
    right: formatOption(option),
  }));

  console.log("USAGE");
  console.log(`  ${envxProgram.name()} <command> [options]\n`);

  console.log("COMMANDS");
  console.log(formatTable(commandRows));

  if (optionRows.length > 0) {
    console.log("\nOPTIONS");
    console.log(formatTable(optionRows));
  }
};

const printDetailedHelp = (flatCommand: FlatCommand) => {
  const command = flatCommand.command;
  const args = command.registeredArguments;
  const options = command.options;

  console.log("USAGE");
  console.log(`  ${getCommandUsage(flatCommand)}\n`);

  console.log("DESCRIPTION");
  console.log(`  ${command.description() || "No description provided"}`);

  console.log("\nARGUMENTS");
  if (args.length === 0) {
    console.log("  None");
  } else {
    const rows = args.map((arg) => ({
      left: formatArgumentName(arg),
      right: arg.description || "No description provided",
    }));
    console.log(formatTable(rows));
  }

  console.log("\nOPTIONS");
  if (options.length === 0) {
    console.log("  None");
  } else {
    const rows = options.map((option) => ({
      left: option.flags,
      right: formatOption(option),
    }));
    console.log(formatTable(rows));
  }
};

const resolveCommandMatch = (commands: FlatCommand[], input: string) => {
  const normalized = input.trim().toLowerCase();

  const exact = commands.find(
    (flatCommand) => flatCommand.path.join(" ").toLowerCase() === normalized,
  );

  if (exact) {
    return { match: exact, candidates: [] as FlatCommand[] };
  }

  const byLeafName = commands.filter(
    (flatCommand) => flatCommand.command.name().toLowerCase() === normalized,
  );

  if (byLeafName.length === 1) {
    return { match: byLeafName[0], candidates: [] as FlatCommand[] };
  }

  const partialMatches = commands.filter((flatCommand) =>
    flatCommand.path.join(" ").toLowerCase().includes(normalized),
  );

  const descriptionMatches = commands.filter((flatCommand) =>
    (flatCommand.command.description() || "")
      .toLowerCase()
      .includes(normalized),
  );

  const candidates = [...partialMatches];

  descriptionMatches.forEach((candidate) => {
    if (
      !candidates.some(
        (item) => item.path.join(" ") === candidate.path.join(" "),
      )
    ) {
      candidates.push(candidate);
    }
  });

  return {
    match: candidates.length === 1 ? candidates[0] : null,
    candidates,
  };
};

// Commander already injects a default help command. Disable it so custom output is used.
envxProgram.addHelpCommand(false);

envxProgram
  .command("help [command]")
  .description("Show summary or detailed help for commands")
  .action((commandName?: string) => {
    const commands = flattenCommands(envxProgram);

    if (!commandName) {
      printOverviewHelp(commands);
      return;
    }

    const { match, candidates } = resolveCommandMatch(commands, commandName);

    if (!match) {
      console.log(`Unknown command: ${commandName}`);

      if (candidates.length > 1) {
        console.log("\nDid you mean:");
        candidates.forEach((candidate) => {
          console.log(`  - ${candidate.path.join(" ")}`);
        });
      }

      return;
    }

    printDetailedHelp(match);
  });
