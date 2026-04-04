import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { resolveTargetDir, makeTargets } from './targets.mjs';

describe('targets', () => {
  it('resolveTargetDir maps Claude workflows to commands under home layout', () => {
    const dir = resolveTargetDir('claude', 'workflows');
    assert.match(dir, /\.claude[/\\]commands$/);
  });

  it('resolveTargetDir with projectRoot mirrors layout under project', () => {
    const root = join('/proj', 'repo');
    assert.equal(
      resolveTargetDir('cursor', 'skills', { projectRoot: root }),
      join(root, '.cursor', 'skills')
    );
    assert.equal(
      resolveTargetDir('claude', 'workflows', { projectRoot: root }),
      join(root, '.claude', 'commands')
    );
  });

  it('makeTargets builds consistent typeMap keys', () => {
    const t = makeTargets('/tmp/p');
    assert.equal(t.cursor.typeMap.skills, join('/tmp/p', '.cursor', 'skills'));
    assert.equal(t['claude-internal'].configDir, join('/tmp/p', '.claude-internal'));
  });
});
