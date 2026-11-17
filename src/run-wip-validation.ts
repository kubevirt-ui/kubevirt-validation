import { buildConfigFromEnv } from './build-config';
import { requireEnv, safeErrorMessage } from './utils';
import { HandledValidationError } from './validation/pr-path-validation/errors';
import { executeWipValidation } from './validation/wip-validation/execute';

const main = async (): Promise<void> => {
  const config = buildConfigFromEnv();
  const prNumber = parseInt(requireEnv('PR_NUMBER'), 10);
  const prTitle = requireEnv('PR_TITLE');
  const isDraft = requireEnv('PR_IS_DRAFT') === 'true';

  await executeWipValidation({
    config,
    isDraft,
    prNumber,
    prTitle,
  });
};

void main().catch((err) => {
  if (err instanceof HandledValidationError) {
    console.error(safeErrorMessage(err));
    process.exit(0);
  }
  console.error(safeErrorMessage(err));
  process.exit(1);
});
