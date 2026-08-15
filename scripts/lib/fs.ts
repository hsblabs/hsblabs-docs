import {
  lstat,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
  copyFile,
} from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export async function resetDirectory(path: string): Promise<void> {
  await rm(path, { recursive: true, force: true });
  await mkdir(path, { recursive: true });
}

export async function ensureParent(path: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
}

export async function walkFiles(root: string): Promise<readonly string[]> {
  const output: string[] = [];

  async function walk(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = resolve(directory, entry.name);

      if (entry.isSymbolicLink()) {
        throw new Error(`Symlinks are not allowed in docs/www: ${absolute}`);
      }

      if (entry.isDirectory()) {
        await walk(absolute);
        continue;
      }

      if (entry.isFile()) {
        output.push(absolute);
      }
    }
  }

  await walk(root);
  return output;
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch {
    return false;
  }
}

export async function copyFileEnsuringParent(
  source: string,
  destination: string,
): Promise<void> {
  await ensureParent(destination);
  await copyFile(source, destination);
}

export async function writeText(
  destination: string,
  content: string,
): Promise<void> {
  await ensureParent(destination);
  await writeFile(destination, content, 'utf8');
}

export async function readText(path: string): Promise<string> {
  return readFile(path, 'utf8');
}
