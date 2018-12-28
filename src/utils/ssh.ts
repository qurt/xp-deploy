interface IOptions {
  user: string;
  server: string;
}

export const buildSSHCommand = (cmd: string, options: IOptions): string => {
  return `ssh -T ${options.user}@${options.server} '${cmd}'`;
};
