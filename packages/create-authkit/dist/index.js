#!/usr/bin/env node
import { createApp } from './create-app';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
async function main() {
    const args = process.argv.slice(2);
    // Show help
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        return;
    }
    // Show version
    if (args.includes('--version') || args.includes('-v')) {
        showVersion();
        return;
    }
    // Get project name
    const projectName = args[0];
    if (!projectName) {
        console.error(chalk.red('Error: Please provide a project name'));
        console.log('Usage: npx create-authkit <project-name>');
        process.exit(1);
    }
    try {
        await createApp(projectName);
    }
    catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
    }
}
function showHelp() {
    console.log(`
${chalk.bold.blue('🚀 AuthKit Project Creator')}

${chalk.bold('Usage:')}
  npx create-authkit <project-name> [options]

${chalk.bold('Options:')}
  --help, -h     Show this help message
  --version, -v  Show version number

${chalk.bold('Examples:')}
  npx create-authkit my-app
  npx create-authkit my-project --template express
`);
}
function showVersion() {
    try {
        const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
        console.log(`create-authkit v${packageJson.version}`);
    }
    catch {
        console.log('create-authkit v1.0.0');
    }
}
main().catch((error) => {
    console.error(chalk.red('Unexpected error:'), error);
    process.exit(1);
});
