import { exec } from "child_process";
import { buildSSHCommand } from "./utils/ssh";
import chalk from "chalk";

export const remote = (
  user: string,
  server: string,
  cmd: string
): Promise<string> => {
  return local(buildSSHCommand(cmd, { user, server }));
};

export const local = (cmd: string): Promise<string> => {
  console.log(chalk.gray(`Run '${cmd}'`));
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) reject(err);
      if (stderr) reject(stderr);
      resolve(stdout);
      console.log(`>>> ${stdout}`);
    });
  });
};

export const tab = (count: number = 4) => {
  return " ".repeat(count);
};
