const RELEASE_PREFIX = /^\[release-[\d.]+\]\s*/i;

const WIP_TITLE =
  /^(?:wip(?:\s|:|\s*-\s*|\s)|\[wip\](?:\s|$))/i;

const DRAFT_TITLE =
  /^(?:draft(?:\s|:|\s*-\s*|\s)|\[draft\](?:\s|$))/i;

/** Strip a leading `[release-X.YY]` prefix from a PR title. */
export const stripLeadingReleasePrefix = (title: string): string =>
  title.replace(RELEASE_PREFIX, '');

/** True when the title starts with WIP or Draft markers (after optional release prefix). */
export const isWipTitle = (title: string): boolean => {
  const normalized = stripLeadingReleasePrefix(title.trim());
  return WIP_TITLE.test(normalized) || DRAFT_TITLE.test(normalized);
};
