import { mkdir, writeFile, readdir, copyFile as cpFile, rm, stat as statFn } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';

let _hasGh;

function hasGh() {
  if (_hasGh === undefined) {
    try {
      execSync('gh --version', { stdio: 'ignore' });
      _hasGh = true;
    } catch {
      _hasGh = false;
    }
  }
  return _hasGh;
}

function getToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  if (hasGh()) {
    try {
      return execSync('gh auth token', { encoding: 'utf8' }).trim();
    } catch { /* no token */ }
  }
  return null;
}

function useApi() {
  return hasGh() || getToken();
}

async function api(endpoint, { raw = false } = {}) {
  if (hasGh()) {
    const headerArg = raw ? ' --header "Accept: application/vnd.github.raw"' : '';
    const result = execSync(`gh api "${endpoint}"${headerArg}`, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
    return raw ? result : JSON.parse(result);
  }

  const url = `https://api.github.com/${endpoint}`;
  const headers = { 'User-Agent': 'aae-cli' };
  const token = getToken();
  if (token) headers['Authorization'] = `token ${token}`;
  if (raw) headers['Accept'] = 'application/vnd.github.raw';

  const res = await fetch(url, { headers });
  if (!res.ok) {
    let msg = `GitHub API ${res.status}: ${res.statusText} (${endpoint})`;
    if (res.status === 403 || res.status === 429) {
      msg += '\n\nRate limit exceeded. Set a token to increase the limit:'
        + '\n  export GITHUB_TOKEN=ghp_xxx'
        + '\n  # or install gh CLI: https://cli.github.com';
    }
    throw new Error(msg);
  }
  return raw ? await res.text() : await res.json();
}

// ── Tarball-based download (zero API calls) ──────────────────────────

async function withTarball(owner, repo, fn) {
  const tmp = join(tmpdir(), `aae-${Date.now()}`);
  await mkdir(tmp, { recursive: true });
  try {
    execSync(
      `curl -fsSL "https://github.com/${owner}/${repo}/archive/HEAD.tar.gz" | tar xz -C "${tmp}" --strip-components=1`,
      { stdio: 'pipe', maxBuffer: 50 * 1024 * 1024 }
    );
    return await fn(tmp);
  } finally {
    await rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
}

async function copyRecursive(src, dest) {
  const written = [];
  let entries;
  try {
    entries = await readdir(src, { withFileTypes: true });
  } catch {
    return written;
  }
  for (const entry of entries) {
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    if (entry.isDirectory()) {
      await mkdir(d, { recursive: true });
      written.push(...await copyRecursive(s, d));
    } else {
      await cpFile(s, d);
      written.push(d);
    }
  }
  return written;
}

async function listSubdirs(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter(e => e.isDirectory() && !e.name.startsWith('.')).map(e => e.name);
  } catch {
    return [];
  }
}

async function hasSkillMd(dir) {
  try {
    const s = await statFn(join(dir, 'SKILL.md'));
    return s.isFile();
  } catch {
    return false;
  }
}

// ── Public API ───────────────────────────────────────────────────────

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
  if (!useApi()) {
    return await withTarball(owner, repo, async (tmp) => {
      await mkdir(destDir, { recursive: true });
      return await copyRecursive(join(tmp, remotePath), destDir);
    });
  }

  const contents = await api(`repos/${owner}/${repo}/contents/${remotePath}`);
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
      const content = await api(`repos/${owner}/${repo}/contents/${item.path}`, { raw: true });
      await writeFile(localPath, content, 'utf8');
      written.push(localPath);
    }
  }
  return written;
}

/**
 * Discover components in a remote GitHub repo.
 *
 * Supports two repo layouts:
 *   1. Type-based: skills/<name>/, commands/<name>/, etc.
 *   2. Skill-based: <name>/SKILL.md at the repo root (like mattpocock/skills)
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
      if (!useApi()) {
        return await withTarball(owner, repo, async (tmp) => {
          const dirs = await listSubdirs(join(tmp, subpath));
          return dirs.map(name => ({ type: typeFromPath, name, remotePath: `${subpath}/${name}` }));
        });
      }
      const contents = await api(`repos/${owner}/${repo}/contents/${subpath}`);
      if (!Array.isArray(contents)) return [];
      return contents
        .filter(c => c.type === 'dir')
        .map(c => ({ type: typeFromPath, name: c.name, remotePath: c.path }));
    }

    // Subpath doesn't match a known type — treat as a direct skill
    return [{ type: 'skills', name: parts[parts.length - 1], remotePath: subpath }];
  }

  // No subpath — scan entire repo for components
  if (!useApi()) {
    return await withTarball(owner, repo, async (tmp) => {
      const components = [];
      const rootDirs = await listSubdirs(tmp);

      // First: look for known type directories (skills/, commands/, etc.)
      for (const dir of rootDirs.filter(d => KNOWN_TYPES.includes(d))) {
        const children = await listSubdirs(join(tmp, dir));
        for (const name of children) {
          components.push({ type: dir, name, remotePath: `${dir}/${name}` });
        }
      }

      // Fallback: scan root-level directories for SKILL.md (Agent Skills repos)
      if (components.length === 0) {
        for (const dir of rootDirs) {
          if (await hasSkillMd(join(tmp, dir))) {
            components.push({ type: 'skills', name: dir, remotePath: dir });
          }
        }
      }

      return components;
    });
  }

  // API-based discovery
  const components = [];
  const rootContents = await api(`repos/${owner}/${repo}/contents/`);
  const typeDirs = rootContents.filter(c => c.type === 'dir' && KNOWN_TYPES.includes(c.name));

  if (typeDirs.length > 0) {
    for (const typeDir of typeDirs) {
      const children = await api(`repos/${owner}/${repo}/contents/${typeDir.path}`);
      if (!Array.isArray(children)) continue;
      for (const child of children) {
        if (child.type === 'dir') {
          components.push({ type: typeDir.name, name: child.name, remotePath: child.path });
        }
      }
    }
    return components;
  }

  // No known type dirs — use git tree API to find SKILL.md files (single API call)
  try {
    const tree = await api(`repos/${owner}/${repo}/git/trees/HEAD?recursive=1`);
    const skillMdFiles = tree.tree.filter(
      item => item.type === 'blob' && /^[^/]+\/SKILL\.md$/.test(item.path)
    );
    for (const item of skillMdFiles) {
      const name = item.path.split('/')[0];
      components.push({ type: 'skills', name, remotePath: name });
    }
  } catch {
    // Fallback: check each root dir individually
    const dirs = rootContents.filter(c => c.type === 'dir' && !c.name.startsWith('.'));
    for (const dir of dirs) {
      try {
        const contents = await api(`repos/${owner}/${repo}/contents/${dir.path}`);
        if (Array.isArray(contents) && contents.some(c => c.name === 'SKILL.md' && c.type === 'file')) {
          components.push({ type: 'skills', name: dir.name, remotePath: dir.path });
        }
      } catch { /* skip */ }
    }
  }

  return components;
}
