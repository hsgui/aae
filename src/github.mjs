import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';

const GITHUB_API = 'https://api.github.com';

function getHeaders() {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'aae-cli',
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers['Authorization'] = `token ${token}`;
  return headers;
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
 * Fetch the contents of a directory from GitHub API.
 * Returns an array of { path, type, download_url } entries.
 */
async function fetchContents(owner, repo, path = '') {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Not found: ${owner}/${repo}/${path}`);
    if (res.status === 403) throw new Error(`Rate limited. Set GITHUB_TOKEN env var for higher limits.`);
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Recursively download a directory from GitHub into a local destination.
 * Returns the list of files written.
 */
export async function downloadDir(owner, repo, remotePath, destDir) {
  const contents = await fetchContents(owner, repo, remotePath);
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
    } else if (item.type === 'file' && item.download_url) {
      await mkdir(dirname(localPath), { recursive: true });
      const fileRes = await fetch(item.download_url);
      const content = await fileRes.text();
      await writeFile(localPath, content, 'utf8');
      written.push(localPath);
    }
  }
  return written;
}

/**
 * Discover components in a remote GitHub path.
 * Looks for known type directories (skills/, commands/, agents/, hooks/, workflows/)
 * or infers the type from the path.
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
      const contents = await fetchContents(owner, repo, subpath);
      if (!Array.isArray(contents)) return [];
      return contents
        .filter(c => c.type === 'dir')
        .map(c => ({ type: typeFromPath, name: c.name, remotePath: c.path }));
    }

    return [{ type: null, name: parts[parts.length - 1], remotePath: subpath }];
  }

  const components = [];
  const rootContents = await fetchContents(owner, repo, '');
  const typeDirs = rootContents.filter(c => c.type === 'dir' && KNOWN_TYPES.includes(c.name));

  for (const typeDir of typeDirs) {
    const children = await fetchContents(owner, repo, typeDir.path);
    if (!Array.isArray(children)) continue;
    for (const child of children) {
      if (child.type === 'dir') {
        components.push({ type: typeDir.name, name: child.name, remotePath: child.path });
      }
    }
  }
  return components;
}
