import { exec } from "child_process";
import { buildSSHCommand } from "./utils/ssh";
import chalk from "chalk";
import * as path from "path";

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
      if (err) { reject(err); return; }
      // TODO: Сделать нормальный вывод ошибок
      if (stderr) resolve(stderr);
      resolve(stdout);
      if (stdout && stdout.length > 0) {
        console.log(`>>> ${stdout}`);
      }
    });
  });
};

export const tab = (count: number = 4) => {
  return " ".repeat(count);
};
export const computeReleaseDirname = (result: string): string => {
  if (!result) return null;

  // Trim last breakline.
  const target = result.replace(/\n$/, "");
  return target.split(path.sep).pop();
};

export const equalValues = (values: Array<string>): boolean => {
  return values.every(value => value === values[0]);
};
