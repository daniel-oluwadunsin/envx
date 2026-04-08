import chalk from "chalk";

export default class Logger {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  private stringify(...messages: any) {
    return [...messages].map((message: any) => String(message)).join("\n");
  }

  success(...messages: any) {
    console.log(chalk.green(this.stringify(...messages)));
  }

  error(...messages: any) {
    console.log(chalk.red(this.stringify(...messages)));
  }

  info(...messages: any) {
    console.log(chalk.blue(this.stringify(...messages)));
  }

  question(...messages: any) {
    return console.log(this.stringify(...messages));
  }

  log(...messages: any) {
    return console.log(this.stringify(...messages));
  }

  warning(...messages: any) {
    console.log(chalk.yellowBright(this.stringify(...messages)));
  }
}
