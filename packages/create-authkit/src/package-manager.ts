import { execa } from 'execa';
import path from 'path';

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

export async function installDependencies(
  projectPath: string,
  packageManager: PackageManager
): Promise<void> {
  const cwd = path.resolve(projectPath);

  switch (packageManager) {
    case 'npm':
      await execa('npm', ['install'], { cwd, stdio: 'inherit' });
      break;

    case 'yarn':
      await execa('yarn', ['install'], { cwd, stdio: 'inherit' });
      break;

    case 'pnpm':
      await execa('pnpm', ['install'], { cwd, stdio: 'inherit' });
      break;

    default:
      throw new Error(`Unsupported package manager: ${packageManager}`);
  }
}

export async function runCommand(
  projectPath: string,
  packageManager: PackageManager,
  command: string,
  args: string[] = []
): Promise<void> {
  const cwd = path.resolve(projectPath);

  switch (packageManager) {
    case 'npm':
      await execa('npm', ['run', command, ...args], { cwd, stdio: 'inherit' });
      break;

    case 'yarn':
      await execa('yarn', [command, ...args], { cwd, stdio: 'inherit' });
      break;

    case 'pnpm':
      await execa('pnpm', [command, ...args], { cwd, stdio: 'inherit' });
      break;
  }
}
