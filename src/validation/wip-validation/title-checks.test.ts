import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isWipTitle, stripLeadingReleasePrefix } from './constants';

describe('stripLeadingReleasePrefix', () => {
  it('strips a leading release bracket prefix', () => {
    assert.equal(stripLeadingReleasePrefix('[release-4.21] WIP: fix'), 'WIP: fix');
  });

  it('leaves titles without a release prefix unchanged', () => {
    assert.equal(stripLeadingReleasePrefix('WIP: fix'), 'WIP: fix');
  });
});

describe('isWipTitle', () => {
  it('detects common WIP title prefixes', () => {
    const wipTitles = [
      'WIP: CNV-12345 fix',
      'WIP - fix',
      'WIP fix',
      '[WIP] CNV-12345',
      'wip: lowercase',
    ];
    for (const title of wipTitles) {
      assert.equal(isWipTitle(title), true, title);
    }
  });

  it('detects Draft title prefixes', () => {
    const draftTitles = ['Draft: spec', '[Draft] spec', 'draft - spec'];
    for (const title of draftTitles) {
      assert.equal(isWipTitle(title), true, title);
    }
  });

  it('detects WIP after a release prefix', () => {
    assert.equal(isWipTitle('[release-4.21] WIP: feature'), true);
  });

  it('does not match WIP or Draft in the middle of the title', () => {
    assert.equal(isWipTitle('CNV-1: Fix draft saving'), false);
    assert.equal(isWipTitle('CNV-2: WIP cleanup later'), false);
  });
});
