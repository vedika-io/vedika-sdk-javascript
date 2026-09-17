import type { VastuAssessmentData } from '../../src/types';

const assessmentWithoutScanTelemetry: VastuAssessmentData = {
  system: 'vastu',
  method: 'listing-assessment',
  status: 'assessed',
  confidence: 0.95,
  badgeEligibility: {
    inputSource: 'plan-derived',
    badge: 'plan-derived',
    eligible: true,
    variant: 'standard',
    reason: 'complete plan',
  },
  confidenceBasis: {},
  meta: {},
  scanQuality: null,
};

void assessmentWithoutScanTelemetry;
