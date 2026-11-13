import type { Octokit } from '@octokit/rest';

import { reportGateResult } from '../../github-comments';
import { createOctokit } from '../../github-repo';
import type { GitHubConfig } from '../../types/index';
import { WIP_BLOCK_LABEL, WIP_VALIDATION_COMMENT_MARKER } from '../../types/index';
import { HandledValidationError } from '../pr-path-validation/errors';
import { isWipTitle } from './constants';
import { formatWipComment } from './format-comment';

export type WipValidationInput = {
  config: GitHubConfig;
  isDraft: boolean;
  octokit?: Octokit;
  prNumber: number;
  prTitle: string;
};

/** Block merge when the PR title is WIP/Draft or the PR is a GitHub draft. */
export const executeWipValidation = async (input: WipValidationInput): Promise<void> => {
  const { config, isDraft, prNumber, prTitle } = input;
  const octokit = input.octokit ?? createOctokit(config);

  const wipTitle = isWipTitle(prTitle);
  const failed = wipTitle || isDraft;
  const passed = !failed;

  const commentBody = formatWipComment(passed, { draftPr: isDraft, wipTitle });
  await reportGateResult(
    octokit,
    config.owner,
    config.repo,
    prNumber,
    passed,
    commentBody,
    WIP_VALIDATION_COMMENT_MARKER,
    WIP_BLOCK_LABEL,
  );

  if (failed) {
    throw new HandledValidationError('WIP/draft validation failed. See PR comment for details.');
  }

  console.log('WIP/draft validation passed.');
};
