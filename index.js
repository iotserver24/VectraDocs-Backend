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
    console.log(bold(green('\nWelcome to VectraDocs Backend Setup!\n')));

    let result;
    try {
        result = await prompts(
            [
                {
                    type: 'select',
                    name: 'backend',
                    message: 'Which backend do you want to create?',
                    choices: [
                        { title: 'Cloudflare Workers (AI)', value: 'chat-workers' },
                        { title: 'Node.js (Express)', value: 'chat-backend' },
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

    console.log(green(`\nDone. Now run:\n`));
    console.log(`  cd ${projectName}`);
    console.log(`  npm install`);
    console.log(`  npm run dev\n`);
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
