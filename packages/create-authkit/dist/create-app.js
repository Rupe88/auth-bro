import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { generateTemplate } from './template-generator';
import { installDependencies } from './package-manager';
import { SchemaGenerator } from 'authkit';
export async function createApp(projectName) {
    console.log(chalk.bold.blue('🚀 Welcome to AuthKit!'));
    console.log(chalk.gray('Let\'s create your authentication-powered app...\n'));
    // Check if directory already exists
    if (await fs.pathExists(projectName)) {
        const { overwrite } = await prompts({
            type: 'confirm',
            name: 'overwrite',
            message: `Directory "${projectName}" already exists. Overwrite?`,
            initial: false,
        });
        if (!overwrite) {
            console.log(chalk.yellow('Aborted.'));
            return;
        }
        await fs.remove(projectName);
    }
    // Get project configuration
    const config = await getProjectConfig();
    // Create project
    const spinner = ora('Creating project...').start();
    try {
        // Create project directory
        await fs.ensureDir(projectName);
        // Generate template files
        await generateTemplate(projectName, config, projectName);
        spinner.text = 'Installing dependencies...';
        // Install dependencies
        await installDependencies(projectName, config.packageManager);
        // Generate Prisma schema and run migrations if needed
        if (config.database !== 'mongodb') {
            spinner.text = 'Setting up database...';
            await setupDatabase(projectName, config);
        }
        // Generate environment file
        await generateEnvFile(projectName, config);
        // Generate Docker Compose if requested
        if (config.docker) {
            await generateDockerCompose(projectName, config);
        }
        spinner.succeed(chalk.green('Project created successfully! 🎉'));
        // Show next steps
        showNextSteps(projectName, config);
    }
    catch (error) {
        spinner.fail(chalk.red('Failed to create project'));
        throw error;
    }
}
async function getProjectConfig() {
    const config = await prompts([
        {
            type: 'select',
            name: 'framework',
            message: 'Which framework would you like to use?',
            choices: [
                { title: 'Express + TypeScript', value: 'express' },
                { title: 'Fastify + TypeScript', value: 'fastify' },
                { title: 'Next.js + TypeScript', value: 'nextjs' },
            ],
            initial: 0,
        },
        {
            type: 'select',
            name: 'database',
            message: 'Which database would you like to use?',
            choices: [
                { title: 'PostgreSQL', value: 'postgresql' },
                { title: 'MySQL', value: 'mysql' },
                { title: 'SQLite', value: 'sqlite' },
                { title: 'MongoDB', value: 'mongodb' },
            ],
            initial: 0,
        },
        {
            type: 'multiselect',
            name: 'strategies',
            message: 'Which authentication strategies?',
            choices: [
                { title: 'Email/Password', value: 'local', selected: true },
                { title: 'Google OAuth', value: 'google' },
                { title: 'GitHub OAuth', value: 'github' },
                { title: 'Magic Link', value: 'magic-link' },
                { title: 'Phone/SMS', value: 'phone' },
            ],
            min: 1,
        },
        {
            type: 'multiselect',
            name: 'features',
            message: 'Which features would you like to enable?',
            choices: [
                { title: 'Email verification', value: 'email-verification' },
                { title: 'Password reset', value: 'password-reset' },
                { title: 'Rate limiting', value: 'rate-limiting', selected: true },
                { title: 'Role-based access', value: 'roles' },
                { title: 'Two-factor authentication', value: '2fa' },
            ],
        },
        {
            type: 'confirm',
            name: 'docker',
            message: 'Set up Docker Compose for database?',
            initial: true,
        },
        {
            type: 'select',
            name: 'packageManager',
            message: 'Which package manager?',
            choices: [
                { title: 'npm', value: 'npm' },
                { title: 'yarn', value: 'yarn' },
                { title: 'pnpm', value: 'pnpm' },
            ],
            initial: 0,
        },
    ]);
    return config;
}
async function setupDatabase(projectPath, config) {
    const dbPath = path.join(projectPath, 'prisma');
    // Generate Prisma schema
    const schema = SchemaGenerator.generate(config.database);
    await fs.ensureDir(dbPath);
    await fs.writeFile(path.join(dbPath, 'schema.prisma'), schema);
    // Initialize Prisma
    await execa('npx', ['prisma', 'generate'], {
        cwd: projectPath,
        stdio: 'inherit',
    });
    // For SQLite, create the database file
    if (config.database === 'sqlite') {
        await execa('npx', ['prisma', 'db', 'push'], {
            cwd: projectPath,
            stdio: 'inherit',
        });
    }
}
async function generateEnvFile(projectPath, config) {
    const envContent = SchemaGenerator.generateEnvTemplate(config.database);
    await fs.writeFile(path.join(projectPath, '.env'), envContent);
}
async function generateDockerCompose(projectPath, config) {
    const dockerContent = SchemaGenerator.generateDockerCompose(config.database);
    await fs.writeFile(path.join(projectPath, 'docker-compose.yml'), dockerContent);
}
function showNextSteps(projectName, config) {
    console.log('\n' + chalk.bold('🎯 Next steps:'));
    console.log(`1. ${chalk.cyan(`cd ${projectName}`)}`);
    if (config.docker) {
        console.log(`2. ${chalk.cyan('docker compose up -d')} (Start database)`);
    }
    console.log(`3. ${chalk.cyan('npm run dev')} (Start development server)`);
    console.log(`4. Visit ${chalk.cyan('http://localhost:3000')} in your browser`);
    console.log('\n' + chalk.bold('📚 Available routes:'));
    console.log(`• POST /api/auth/register`);
    console.log(`• POST /api/auth/login`);
    console.log(`• GET  /api/auth/me`);
    console.log(`• POST /api/auth/logout`);
    console.log('\n' + chalk.bold('🔐 Your app is ready with:'));
    config.strategies.forEach(strategy => {
        console.log(`• ${strategy.charAt(0).toUpperCase() + strategy.slice(1)} authentication`);
    });
    config.features.forEach(feature => {
        console.log(`• ${feature.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
    });
    console.log('\n' + chalk.blue('Happy coding! 🚀'));
}
