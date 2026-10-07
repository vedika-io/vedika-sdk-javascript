import { VedikaClient } from '../../src/client';
import type { VastuJobsRequest, VastuReportQuestion } from '../../src/types';

const request: VastuJobsRequest = { operation: 'assessments', items: [{ id: 'p1', input: { inputSource: 'plan-derived' } }] };
const ask: VastuReportQuestion = { question: 'What first?', reportRef: { type: 'upload', id: 'vup_0123456789abcdef0123456789abcdef' } };
// @ts-expect-error Only the assessments operation can be queued.
const wrongOperation: VastuJobsRequest = { operation: 'score/overall', items: [] };
// @ts-expect-error Each item carries its assessment under `input`.
const wrongItem: VastuJobsRequest = { operation: 'assessments', items: [{ id: 'p1', assessment: { inputSource: 'plan-derived' } }] };

async function checked(client: VedikaClient): Promise<void> {
  const queued = await client.vastuJobSubmit(request, { idempotencyKey: 'saved-job-7' });
  const jobId: string = queued.data.jobId;
  const maxCharge: number = queued.data.maxCharge;
  const status = await client.vastuJobStatus(jobId);
  const pending: number = status.data.counts.pending;
  const page = await client.vastuJobResults(jobId, { cursor: 'c1' });
  const next: string | null = page.data.nextCursor;
  const code: string | null | undefined = page.data.results[0]?.code;
  for await (const item of client.vastuJobResultItems(jobId)) { const http: number = item.status; void http; }
  const cancelled = await client.vastuJobCancel(jobId);
  const requested: boolean = cancelled.data.cancelRequested;
  const upload = await client.uploadVastuReport({ data: new Uint8Array([1]) }, { idempotencyKey: 'upload-1' });
  const uploadId: string = upload.uploadId;
  await client.askVastuReport({ question: 'q', reportRef: { type: 'upload', id: uploadId } });
  const listing = await client.vastuListingAssessment({ inputSource: 'plan-derived' }, { idempotencyKey: 'k' });
  const assessed: string = listing.status;
  const eligible: boolean = listing.badgeEligibility.eligible;
  // @ts-expect-error Templated job paths need the typed job methods.
  await client.vastuOperation('jobs/{id}', undefined);
  // @ts-expect-error The listing helper is typed: inputSource is required.
  await client.vastuListingAssessment({ rooms: [] });
  // @ts-expect-error Submit needs a retained key.
  await client.vastuJobSubmit(request);
  void [maxCharge, pending, next, code, requested, assessed, eligible];
}
void [ask, wrongOperation, wrongItem, checked];
