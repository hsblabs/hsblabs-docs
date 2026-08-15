import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

import { loadEnabledProjects } from '../src/lib/projects';
import { pathExists } from './lib/fs';

const repositoriesRoot = resolve(process.cwd(), '.context/repos');

function runGit(args: readonly string[]): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('git', args, {
      stdio: 'inherit',
      shell: false,
    });

    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      reject(new Error(`git ${args.join(' ')} failed with exit code ${code}`));
    });
  });
}

for (const project of loadEnabledProjects()) {
  const target = resolve(repositoriesRoot, project.slug);
  await rm(target, { recursive: true, force: true });

  console.log(`sync ${project.repository}@${project.ref}`);

  await runGit([
    'clone',
    '--depth=1',
    '--filter=blob:none',
    '--sparse',
    '--single-branch',
    '--branch',
    project.ref,
    `https://github.com/${project.repository}.git`,
    target,
  ]);

  await runGit(['-C', target, 'sparse-checkout', 'set', 'docs/www']);

  const docsRoot = resolve(target, 'docs/www');
  if (!(await pathExists(docsRoot))) {
    throw new Error(
      `${project.repository}@${project.ref} does not contain docs/www`,
    );
  }
}
