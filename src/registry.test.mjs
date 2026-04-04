import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { homedir } from 'node:os';
import { getStoreRoot, findComponentDir, listComponents } from './registry.mjs';

describe('registry store', () => {
  it('getStoreRoot defaults to ~/.aae', () => {
    const r = getStoreRoot();
    assert.equal(r, join(homedir(), '.aae'));
  });

  it('getStoreRoot resolves explicit store path', () => {
    assert.equal(getStoreRoot({ store: '/var/tmp/aae-store' }), join('/var', 'tmp', 'aae-store'));
  });

  it('findComponentDir finds skill in custom store', async () => {
    const base = await mkdtemp(join(tmpdir(), 'aae-reg-'));
    const skillDir = join(base, 'skills', 'z-aae-test-skill');
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, 'SKILL.md'), '---\nname: z\n---\n# Z\n');
    const found = await findComponentDir('skills', 'z-aae-test-skill', { store: base });
    assert.equal(found, skillDir);
  });

  it('listComponents includes custom store entries', async () => {
    const base = await mkdtemp(join(tmpdir(), 'aae-reg-'));
    const skillDir = join(base, 'skills', 'z-aae-list-skill');
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, 'SKILL.md'), '---\nname: z\n---\n# Z\n');
    const items = await listComponents('skills', { store: base });
    const names = items.map(i => i.name);
    assert.ok(names.includes('z-aae-list-skill'));
  });
});
