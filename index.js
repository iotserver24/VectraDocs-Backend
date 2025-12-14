#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prompts from 'prompts';
import { red, green, bold } from 'kolorist';

// Helpers
const cwd = process.cwd();
const renameFiles = {
    _gitignore: '.gitignore',
};

async function init() {
    console.log(bold(green('\n🚀 Welcome to VectraDocs Backend Setup!\n')));
    console.log('This tool will scaffold a production-ready AI backend for your docs.\n');

    let result;
    try {
        result = await prompts(
            [
                {
                    type: 'select',
                    name: 'backend',
                    message: 'Select your backend infrastructure:',
                    choices: [
                        {
                            title: 'Node.js (Express) (Recommended)',
                            description: 'Standard server. Runs on Vercel/VPS. Uses OpenAI SDK.',
                            value: 'chat-backend'
                        },
                        {
                            title: 'Cloudflare Workers',
                            description: 'Serverless, runs at the Edge, uses Helpers AI.',
                            value: 'chat-workers'
                        },
                    ],
                },
                {
                    type: 'text',
                    name: 'projectName',
                    message: 'Project name:',
                    initial: prev => prev, // Default to the value of backend (chat-workers or chat-backend)
                },
            ],
            {
                onCancel: () => {
                    throw new Error(red('✖') + ' Operation cancelled');
                },
            }
        );
    } catch (cancelled) {
        console.log(cancelled.message);
        return;
    }

    const { backend, projectName } = result;

    // Additional configuration prompts
    let config;
    try {
        config = await prompts([
            {
                type: 'text',
                name: 'frontendUrl',
                message: 'Frontend URL (for CORS):',
                initial: 'http://localhost:5173',
            },
            {
                type: 'toggle',
                name: 'generateKey',
                message: 'Generate a secure API Key?',
                initial: true,
                active: 'yes',
                inactive: 'no',
            }
        ], {
            onCancel: () => { throw new Error(red('✖') + ' Operation cancelled'); }
        });
    } catch (cancelled) {
        console.log(cancelled.message);
        return;
    }

    const apiKey = config.generateKey
        ? Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        : 'your-secret-api-key';

    const root = path.join(cwd, projectName);
    const templateDir = path.resolve(
        fileURLToPath(import.meta.url),
        '../templates',
        backend
    );

    if (fs.existsSync(root)) {
        console.log(red(`\nDirectory ${projectName} already exists. Please choose a different name or delete the directory.`));
        return;
    }

    console.log(`\nScaffolding project in ${root}...`);

    fs.mkdirSync(root, { recursive: true });
    copy(templateDir, root);

    // --- Configuration Injection ---
    console.log('Configuring environment...');

    if (backend === 'chat-workers') {
        // Update wrangler.toml
        const wranglerPath = path.join(root, 'wrangler.toml');
        let wranglerContent = fs.readFileSync(wranglerPath, 'utf-8');

        wranglerContent = wranglerContent
            .replace('# API_KEY = "your-secret-key"', `API_KEY = "${apiKey}"`)
            .replace('# FRONTEND_URL = "http://localhost:3000"', `FRONTEND_URL = "${config.frontendUrl}"`);

        fs.writeFileSync(wranglerPath, wranglerContent);

    } else if (backend === 'chat-backend') {
        // Setup .env
        const envExample = path.join(root, '.env.example');
        const envDest = path.join(root, '.env');

        let envContent = fs.readFileSync(envExample, 'utf-8');
        envContent = envContent
            .replace('FRONTEND_URL=http://localhost:5173', `FRONTEND_URL=${config.frontendUrl}`)
            .replace('API_KEY=your-secret-api-key', `API_KEY=${apiKey}`);

        fs.writeFileSync(envDest, envContent);
    }

    console.log(bold(green(`\n✔ Success! Project created in ${projectName}\n`)));

    console.log('Next steps:');
    console.log(`  1. cd ${projectName}`);
    console.log(`  2. npm install`);

    if (backend === 'chat-workers') {
        console.log(`  3. npx wrangler login  (if not logged in)`);
        console.log(`  4. npm run deploy`);
    } else {
        console.log(`  3. Open .env and add your LLM_API_KEY`);
        console.log(`  4. npm run dev`);
    }

    console.log(`\nYour API Key is: ${bold(apiKey)} (Saved in config)\n`);
    console.log(`See ${bold('README.md')} inside the folder for more details.\n`);
}

function copy(src, dest) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        copyDir(src, dest);
    } else {
        copyFile(src, dest);
    }
}

function copyDir(srcDir, destDir) {
    fs.mkdirSync(destDir, { recursive: true });
    for (const file of fs.readdirSync(srcDir)) {
        const srcFile = path.resolve(srcDir, file);
        const destFile = path.resolve(destDir, file);
        copy(srcFile, destFile);
    }
}

function copyFile(src, dest) {
    const basename = path.basename(src);
    const targetName = renameFiles[basename] || basename;
    const targetPath = path.join(path.dirname(dest), targetName);
    fs.copyFileSync(src, targetPath);
}

init().catch((e) => {
    console.error(e);
});
