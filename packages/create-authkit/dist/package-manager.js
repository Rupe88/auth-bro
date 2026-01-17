import { execa } from 'execa';
import path from 'path';
export async function installDependencies(projectPath, packageManager) {
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
export async function runCommand(projectPath, packageManager, command, args = []) {
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
