import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Octokit } from '@octokit/rest';

import type { GitHubConfig } from '../../types/index';
import { WIP_BLOCK_LABEL, WIP_VALIDATION_COMMENT_MARKER } from '../../types/index';
import { HandledValidationError } from '../pr-path-validation/errors';
import { executeWipValidation } from './execute';

type Call = { args: unknown; method: string };

type FakeOctokitOptions = {
  labels?: string[];
};

const fakeOctokit = (options: FakeOctokitOptions, calls: Call[]): Octokit => {
  const labels = new Set(options.labels ?? []);
  const listComments = async () => ({ data: [] as Array<{ body: string; id: number }> });
  return {
    issues: {
      addLabels: async (args: unknown) => {
        calls.push({ args, method: 'addLabels' });
      },
      createComment: async (args: unknown) => {
        calls.push({ args, method: 'createComment' });
      },
      createLabel: async () => ({ data: {} }),
      getLabel: async ({ name }: { name: string }) => {
        if (!labels.has(name)) {
          const err = new Error('Not Found') as Error & { status: number };
          err.status = 404;
          throw err;
        }
        return { data: {} };
      },
      listComments,
      listLabelsOnIssue: async () => ({ data: [...labels].map((name) => ({ name })) }),
      removeLabel: async (args: unknown) => {
        calls.push({ args, method: 'removeLabel' });
      },
      updateComment: async () => {},
    },
    paginate: async (method: unknown) => {
      if (method === listComments) return (await listComments()).data;
      return [];
    },
  } as unknown as Octokit;
};

const CONFIG: GitHubConfig = { owner: 'kubevirt-ui', repo: 'kubevirt-plugin', token: 'x' };

const addLabelsOf = (calls: Call[]): string[] =>
  calls
    .filter((c) => c.method === 'addLabels')
    .flatMap((c) => (c.args as { labels: string[] }).labels);

const commentsOf = (calls: Call[]): string[] =>
  calls.filter((c) => c.method === 'createComment').map((c) => (c.args as { body: string }).body);

describe('executeWipValidation', () => {
  it('fails on WIP title: adds block label and posts marker comment', async () => {
    const calls: Call[] = [];
    const octokit = fakeOctokit({}, calls);

    await assert.rejects(
      executeWipValidation({
        config: CONFIG,
        isDraft: false,
        octokit,
        prNumber: 42,
        prTitle: 'WIP: unfinished',
      }),
      HandledValidationError,
    );

    assert.deepEqual(addLabelsOf(calls), [WIP_BLOCK_LABEL]);
    assert.equal(commentsOf(calls).length, 1);
    assert.match(commentsOf(calls)[0], new RegExp(WIP_VALIDATION_COMMENT_MARKER));
    assert.match(commentsOf(calls)[0], /WIP \/ Draft Validation Failed/);
  });

  it('fails when PR is draft without WIP title', async () => {
    const calls: Call[] = [];
    const octokit = fakeOctokit({}, calls);

    await assert.rejects(
      executeWipValidation({
        config: CONFIG,
        isDraft: true,
        octokit,
        prNumber: 7,
        prTitle: 'CNV-1234: Real title',
      }),
      HandledValidationError,
    );

    assert.deepEqual(addLabelsOf(calls), [WIP_BLOCK_LABEL]);
  });

  it('passes clean title: removes block label and posts pass comment', async () => {
    const calls: Call[] = [];
    const octokit = fakeOctokit({ labels: [WIP_BLOCK_LABEL] }, calls);

    await executeWipValidation({
      config: CONFIG,
      isDraft: false,
      octokit,
      prNumber: 3,
      prTitle: 'CNV-99: Ship feature',
    });

    assert.equal(
      calls.some((c) => c.method === 'removeLabel'),
      true,
    );
    assert.equal(addLabelsOf(calls).length, 0);
    assert.match(commentsOf(calls)[0], /WIP \/ Draft Validation Passed/);
  });
});
