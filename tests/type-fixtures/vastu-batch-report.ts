import { VedikaClient } from '../../src/client';
import type { VastuAssessmentsBatchRequest, VastuPlanGenerateRequest, VastuPlanFromRequirementsRequest, VastuPlanOptimizeRequest, VastuPlanReportRequest, VastuArTrueNorthCalibrateRequest } from '../../src/types';

const calibration: VastuArTrueNorthCalibrateRequest = { lat: 28.6, lon: 77.2, datetime: "2026-06-21T03:30:00Z", deviceHeadingAtSunDeg: 70, deviceHeadingAccuracyDeg: 3, headingSampleAgeMs: 0 };
const batch: VastuAssessmentsBatchRequest = { items: [{ id: 'property-1', assessment: { inputSource: 'plan-derived' } }] };
const generate: VastuPlanGenerateRequest = { plot: { width: 40, length: 60 }, includeSvg: false };
const requirements: VastuPlanFromRequirementsRequest = { plot: { width: 40, length: 60 }, includeSvg: false };
const optimize: VastuPlanOptimizeRequest = { rooms: [], includeSvg: false };
const report: VastuPlanReportRequest = { rooms: [], format: 'html', brand: { reportTitle: 'Title', generatedFor: 'Buyer' }, reportTitle: 'Title', generatedFor: 'Buyer', tenantName: 'Tenant' };
// @ts-expect-error Unsupported artifact formats remain rejected.
const unsupported: VastuPlanReportRequest = { rooms: [], format: 'exe' };

async function checked(client: VedikaClient): Promise<void> {
  const north = await client.vastuOperation("ar/true-north-calibrate", calibration);
  const reportedAccuracy: number | null = north.data.headingQuality.accuracyDeg;
  const solarReliable: boolean = north.data.solarGeometryReliable;
  void [reportedAccuracy, solarReliable];
  const result = await client.vastuOperation('assessments/batch', batch, { idempotencyKey: 'saved-batch-42' });
  const status: number = result.data.results[0].status;
  const score: number | undefined = result.data.results[0].response.data?.score;
  const error: string | undefined = result.data.results[0].response.error;
  const plan = await client.vastuOperation('plan/generate', generate);
  const svg: string | undefined = plan.data.svg;
  await client.vastuOperation('plan/from-requirements', requirements);
  await client.vastuOperation('plan/optimize', optimize);
  const resultReport = await client.vastuOperation('plan/report', report);
  const artifact: string | undefined = resultReport.data.artifact?.content;
  void [status, score, error, svg, artifact];
}
void [checked, unsupported];
