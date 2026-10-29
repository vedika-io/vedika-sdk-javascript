import { VedikaClient } from '../../src/client';
import { OutputBudgetExhaustedError, ProUltraUnavailableError, QuestionErrorCode, ServerError, VedikaAPIError } from '../../src/index';
import type {
  EnhancedQuestionQuery,
  QuestionDegradedReason,
  QuestionFinishReason,
  QuestionGenerationControls,
  QuestionResponseMetadata,
  QuestionSpeed,
  VastuReportQuestion,
} from '../../src/index';

const birthDetails = { datetime: '1990-06-15T14:30:00+05:30', latitude: 28.6139, longitude: 77.209, timezone: '+05:30' };

const speeds: QuestionSpeed[] = ['standard', 'fast', 'eco', 'pro-ultra'];
const controls: QuestionGenerationControls = {
  speed: 'pro-ultra',
  detail: 'brief',
  maxTokens: 600,
  stop: ['END', 'STOP'],
  seed: 0,
};
const standardV2: QuestionGenerationControls = { speed: 'standard', version: '2' };
const standardV25: QuestionGenerationControls = { version: '2.5', stop: 'END' };
const query: EnhancedQuestionQuery = { question: 'q', birthDetails, ...controls };
const report: VastuReportQuestion = { question: 'q', report: {}, speed: 'pro-ultra', detail: 'detailed', maxTokens: 900 };

// @ts-expect-error Only the four published tiers are accepted.
const unknownSpeed: QuestionGenerationControls = { speed: 'turbo' };
// @ts-expect-error `detail` is brief, standard or detailed.
const unknownDetail: QuestionGenerationControls = { detail: 'long' };
// @ts-expect-error `version` is "2" or "2.5".
const unknownVersion: QuestionGenerationControls = { version: '3' };
// @ts-expect-error `maxTokens` is a number.
const stringTokens: QuestionGenerationControls = { maxTokens: '600' };
// @ts-expect-error `seed` is a number.
const stringSeed: QuestionGenerationControls = { seed: '7' };
// @ts-expect-error `stop` is a string or an array of strings.
const numberStop: QuestionGenerationControls = { stop: 3 };

async function checked(client: VedikaClient): Promise<void> {
  await client.askQuestion(query);
  await client.askQuestion({ question: 'q', birthDetails, speed: 'pro-ultra', detail: 'brief' });
  await client.askVastuReport(report);
  for await (const chunk of client.askQuestionStream({ question: 'q', birthDetails, speed: 'pro-ultra', maxTokens: 400 })) {
    const text: string = chunk;
    void text;
  }
  // A plain question still type-checks with no controls at all.
  await client.askQuestion({ question: 'q', birthDetails });
  for await (const chunk of client.askQuestionStream({ question: 'q', birthDetails })) void chunk;
}

const finishReasons: QuestionFinishReason[] = ['complete', 'length', 'budgetExceeded', 'stopSequence', 'filtered', 'unknown'];
const degradedReasons: QuestionDegradedReason[] = ['budget_truncated', 'upstream_unavailable', 'upstream_timeout'];
const cutOff: QuestionResponseMetadata = {
  speed: 'pro-ultra',
  finishReason: 'length',
  truncated: true,
  degraded: true,
  degradedReason: 'budget_truncated',
  cost: { total: '0' },
};
// @ts-expect-error `finishReason` is the closed vocabulary the API returns.
const unknownFinish: QuestionResponseMetadata = { finishReason: 'stop' };
// @ts-expect-error `degradedReason` is the closed vocabulary the API returns.
const unknownDegraded: QuestionResponseMetadata = { degradedReason: 'too_long' };
// @ts-expect-error `truncated` is a boolean.
const stringTruncated: QuestionResponseMetadata = { truncated: 'yes' };

async function readsTruncation(client: VedikaClient): Promise<boolean> {
  const answer = await client.askQuestion({ question: 'q', birthDetails, speed: 'pro-ultra', maxTokens: 300 });
  const reason: QuestionFinishReason | undefined = answer.metadata?.finishReason;
  const degraded: QuestionDegradedReason | undefined = answer.metadata?.degradedReason;
  const report = await client.askVastuReport({ question: 'q', report: {} });
  return answer.metadata?.truncated === true || reason === 'length' || degraded === 'budget_truncated' || report.metadata?.truncated === true;
}

async function handlesRefusals(client: VedikaClient): Promise<string | undefined> {
  try {
    await client.askQuestion({ question: 'q', birthDetails, speed: 'pro-ultra' });
  } catch (error) {
    if (error instanceof ProUltraUnavailableError) {
      const server: ServerError = error;
      const wait: number | undefined = error.retryAfter;
      return `${server.statusCode} ${wait}`;
    }
    if (error instanceof OutputBudgetExhaustedError) {
      const base: VedikaAPIError = error;
      return base.code === QuestionErrorCode.OUTPUT_BUDGET_EXHAUSTED ? 'raise maxTokens' : undefined;
    }
    if (error instanceof VedikaAPIError && error.code === QuestionErrorCode.CONTROL_UNSUPPORTED_FOR_TIER) return 'drop the control';
  }
  return undefined;
}
// @ts-expect-error A code that is not one of the published ones is not a QuestionErrorCode.
const unknownCode: QuestionErrorCode = 'NOT_A_CODE';

void [
  speeds, standardV2, standardV25, unknownSpeed, unknownDetail, unknownVersion, stringTokens, stringSeed, numberStop, checked,
  finishReasons, degradedReasons, cutOff, unknownFinish, unknownDegraded, stringTruncated, readsTruncation, handlesRefusals, unknownCode,
];
