export type WipFailureReason = {
  draftPr: boolean;
  wipTitle: boolean;
};

/** Format the WIP / draft validation PR comment. */
export const formatWipComment = (passed: boolean, reasons: WipFailureReason): string => {
  if (passed) {
    return (
      ':white_check_mark: **WIP / Draft Validation Passed**\n\n' +
      'This pull request is not marked work-in-progress.'
    );
  }

  const lines: string[] = [
    ':x: **WIP / Draft Validation Failed**',
    '',
    'Merge is blocked until this pull request is ready for review.',
    '',
  ];

  if (reasons.wipTitle) {
    lines.push('- PR title starts with a WIP or Draft marker.');
  }
  if (reasons.draftPr) {
    lines.push('- Pull request is still in **draft** state.');
  }

  lines.push(
    '',
    '**How to fix**',
    '- Remove `WIP` / `Draft` / `[WIP]` / `[Draft]` from the start of the title, or',
    '- Use **Mark ready for review** on GitHub if the PR is a draft.',
    '',
    '> Re-run this check by updating the title or draft status (e.g. push, edit title, or mark ready for review).',
  );

  return lines.join('\n');
};
