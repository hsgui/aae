import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { execSync } from 'node:child_process';

function gh(endpoint) {
  const raw = execSync(`gh api "${endpoint}"`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  return JSON.parse(raw);
}

function ghRaw(url) {
  return execSync(`gh api "${url}" --header "Accept: application/vnd.github.raw"`, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
}

/**
 * Parse a GitHub source string into owner, repo, and subpath.
 *
 * Accepts:
 *   owner/repo
 *   owner/repo/path/to/component
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo/tree/main/path/to/component
 */
export function parseSource(source) {
  let cleaned = source.trim().replace(/\/+$/, '');

  if (cleaned.startsWith('https://github.com/')) {
    cleaned = cleaned.replace('https://github.com/', '');
    const treeMatch = cleaned.match(/^([^/]+)\/([^/]+)\/tree\/[^/]+\/(.+)$/);
    if (treeMatch) {
      return { owner: treeMatch[1], repo: treeMatch[2], subpath: treeMatch[3] };
    }
    cleaned = cleaned.replace(/\.git$/, '');
  }

  const parts = cleaned.split('/');
  if (parts.length < 2) {
    throw new Error(`Invalid source: "${source}". Expected format: owner/repo[/path]`);
  }

  const [owner, repo, ...rest] = parts;
  return { owner, repo, subpath: rest.length > 0 ? rest.join('/') : '' };
}

/**
 * Recursively download a directory from GitHub into a local destination.
 */
export async function downloadDir(owner, repo, remotePath, destDir) {
  const contents = gh(`repos/${owner}/${repo}/contents/${remotePath}`);
  const items = Array.isArray(contents) ? contents : [contents];
  const written = [];

  for (const item of items) {
    const relativePath = remotePath
      ? item.path.slice(remotePath.length).replace(/^\//, '')
      : item.path;
    const localPath = join(destDir, relativePath);

    if (item.type === 'dir') {
      const sub = await downloadDir(owner, repo, item.path, destDir);
      written.push(...sub);
    } else if (item.type === 'file') {
      await mkdir(dirname(localPath), { recursive: true });
      const content = ghRaw(`repos/${owner}/${repo}/contents/${item.path}`);
      await writeFile(localPath, content, 'utf8');
      written.push(localPath);
    }
  }
  return written;
}

/**
 * Discover components in a remote GitHub path.
 */
export async function discoverRemoteComponents(owner, repo, subpath) {
  const KNOWN_TYPES = ['skills', 'commands', 'agents', 'hooks', 'workflows'];

  if (subpath) {
    const parts = subpath.split('/');
    const typeFromPath = KNOWN_TYPES.find(t => parts[0] === t);

    if (typeFromPath && parts.length >= 2) {
      return [{ type: typeFromPath, name: parts[1], remotePath: subpath }];
    }

    if (typeFromPath && parts.length === 1) {
      const contents = gh(`repos/${owner}/${repo}/contents/${subpath}`);
      if (!Array.isArray(contents)) return [];
      return contents
        .filter(c => c.type === 'dir')
        .map(c => ({ type: typeFromPath, name: c.name, remotePath: c.path }));
    }

    return [{ type: null, name: parts[parts.length - 1], remotePath: subpath }];
  }

  const components = [];
  const rootContents = gh(`repos/${owner}/${repo}/contents/`);
  const typeDirs = rootContents.filter(c => c.type === 'dir' && KNOWN_TYPES.includes(c.name));

  for (const typeDir of typeDirs) {
    const children = gh(`repos/${owner}/${repo}/contents/${typeDir.path}`);
    if (!Array.isArray(children)) continue;
    for (const child of children) {
      if (child.type === 'dir') {
        components.push({ type: typeDir.name, name: child.name, remotePath: child.path });
      }
    }
  }
  return components;
}
