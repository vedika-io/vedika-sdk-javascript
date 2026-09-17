/**
 * Vedika API Client
 * Main client class for interacting with the Vedika Astrology API.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  VedikaClientOptions,
  QuestionQuery,
  QuestionResponse,
  BirthChartQuery,
  BirthChart,
  BirthDetails,
  DashaResponse,
  CompatibilityQuery,
  CompatibilityResponse,
  YogaResponse,
  DoshaResponse,
  MuhurthaQuery,
  MuhurthaResponse,
  NumerologyQuery,
  NumerologyResponse,
  BatchQueryItem,
  V2Query,
  PredictionQuery,
  HoroscopeQuery,
  EnhancedQuestionQuery,
  VastuReportQuestion,
  ChartType,
  DashaSystem,
  DoshaType,
  MatchingType,
  MuhurtaType,
  DivisionalChartType,
  PredictionPeriod,
  StrengthType,
  NumerologyType,
  WesternRelationshipType,
  WesternRelationshipResult,
  TarotCard,
  TarotReading,
  SpreadList,
  ChineseZodiac,
  BaZiChart,
  KuaResult,
  Hexagram,
  Crystal,
  BodyGraph,
  HDType,
  MatchResult,
  DoshaResult,
  MantraResult,
  DeityResult,
  PastLifeResult,
  DailyBundle,
  AllDashaResult,
  HealthResult,
  CareerResult,
  VastuMandalaScheme,
  VastuRoomType,
  VastuPlacementFeature,
  VastuAuditKind,
  VastuScoreKind,
  VastuArScanQualityInput,
  VastuOperationResult,
  VastuOperation,
  VastuOperationContracts,
  VastuCallOptions,
} from './types';
import {
  VedikaAPIError,
  AuthenticationError,
  RateLimitError,
  InsufficientCreditsError,
  SubscriptionExpiredError,
  ValidationError,
  TimeoutError,
  ServerError,
  NetworkError,
} from './exceptions';
import type { VoiceQuery, VoiceResult, VoiceMetaHeader, VoiceResponse } from './types';
// Value import (runtime helper) — transition-tolerant western normalizer (3.0.6).
import { normalizeWesternRelationship, VASTU_OPERATIONS } from './types';

/**
 * Main client for the Vedika Astrology API
 *
 * The ONLY B2B astrology API with AI-powered chatbot queries.
 *
 * @example
 * ```typescript
 * import { VedikaClient } from 'vedika-sdk';
 *
 * const client = new VedikaClient({ apiKey: 'vk_live_...' });
 *
 * const response = await client.askQuestion({
 *   question: 'What are my career prospects?',
 *   birthDetails: {
 *     datetime: '1990-06-15T14:30:00',
 *     latitude: 28.6139,
 *     longitude: 77.2090,
 *     timezone: '+05:30'
 *   }
 * });
 * ```
 */
/** Extract the UTC offset (e.g. "+05:30", "Z") from an ISO datetime, or undefined. */
function offsetFromDatetime(dt: string): string | undefined {
  const m = /([+-]\d{2}:?\d{2}|Z)$/.exec(dt || '');
  return m ? m[1] : undefined;
}

/** Strip a leading slash so `vastu('/score/overall')` and `vastu('score/overall')` both work. */
function stripLeadingSlash(path: string): string {
  return path.replace(/^\/+/, '');
}

/**
 * Generate a fresh client-side idempotency key. Not a secret — a dedupe token
 * the server keys a retry-safe charge on (see `v2_idempotency_header` /
 * `deduct_v2_cost_idempotent` in the Rust v2 crate, which accept
 * `Idempotency-Key` / `X-Idempotency-Key` / `X-Request-Id`, case-insensitive).
 * Prefers `crypto.randomUUID` (Node 14.17+ / modern browsers) and falls back
 * to a `Math.random`-based token on older runtimes — this package declares
 * `engines.node >= 14.0.0`, which predates guaranteed `randomUUID` support.
 */
function generateIdempotencyKey(): string {
  const g: any = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
  if (g.crypto && typeof g.crypto.randomUUID === 'function') {
    return g.crypto.randomUUID();
  }
  return `idem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

/** True for HTTP methods that need an idempotency key to make a retry safe. */
function isMutatingMethod(method: string | undefined): boolean {
  const m = (method || 'get').toLowerCase();
  return m === 'post' || m === 'put' || m === 'patch' || m === 'delete';
}

/** The twelve billed Vastu GET operations need a stable charge identity too. */
function isBilledVastuGet(method: string | undefined, url: string | undefined): boolean {
  if ((method || 'get').toLowerCase() !== 'get') return false;
  const path = new URL(url || '', 'https://api.vedika.io').pathname;
  const match = /^\/v2\/(?:astrology\/)?vastu\/(.+)$/.exec(path);
  if (!match) return false;
  const contract = VASTU_OPERATION_CONTRACTS[match[1] as keyof typeof VASTU_OPERATION_CONTRACTS];
  return contract?.method === 'GET' || contract?.method === 'GET_OR_POST';
}

/** Does `headers` already carry a client idempotency key (any accepted casing)? */
function hasIdempotencyHeader(headers: Record<string, any> | undefined): boolean {
  if (!headers) return false;
  return Object.keys(headers).some((k) => {
    const lower = k.toLowerCase();
    return lower === 'idempotency-key' || lower === 'x-idempotency-key' || lower === 'x-request-id';
  });
}

/**
 * True when a failed request is safe to automatically retry: the transport
 * layer never streams/consumes a one-shot body (excludes `askQuestionStream`
 * and `askVoice`'s arraybuffer response), AND the request is either
 * naturally idempotent (GET/HEAD/OPTIONS) or carries a client idempotency key
 * the server can dedupe a retried charge on.
 */
function isRetryableRequest(config: any): boolean {
  if (!config) return false;
  if (config.responseType === 'stream' || config.responseType === 'arraybuffer') return false;
  const method = (config.method || 'get').toLowerCase();
  if (method === 'get' || method === 'head' || method === 'options') return true;
  return hasIdempotencyHeader(config.headers);
}

/** True for the HTTP outcomes worth retrying: rate limit, transient 5xx, or no response at all. */
function isRetryableError(error: AxiosError): boolean {
  if (!error.response) return true; // network error / timeout — request may never have reached the server
  const status = error.response.status;
  return status === 429 || status === 502 || status === 503 || status === 504;
}

/**
 * True for the Vastu ops the backend serves over GET, so the generic `vastu()`
 * escape hatch uses the right verb. The 11 `reference/*` tables (10 original +
 * `reference/gate-obstructions`) are GET-only (a POST returns 405);
 * `direction/declination` is a GET+POST dual whose verified path is
 * GET-with-query. Everything else is POST. Kept in sync with
 * VASTU_GET_REFERENCE_ROUTES + VASTU_DUAL_ROUTE in vedika-v2/src/vastu.rs.
 */
function isVastuGetOp(op: string): boolean {
  return op.startsWith('reference/') || op === 'direction/declination';
}

function vastuCallConfig(op: string, options?: VastuCallOptions): { headers: { 'Idempotency-Key': string } } | undefined {
  const key = options?.idempotencyKey;
  if ((op === 'assessments/batch' || key !== undefined) && (typeof key !== 'string' || !key.trim())) {
    throw new ValidationError('A nonblank caller-retained Idempotency-Key is required');
  }
  return key === undefined ? undefined : { headers: { 'Idempotency-Key': key } };
}

const VASTU_OPERATION_CONTRACTS = {
  'ar/heatmap-raster': { method: 'POST', requestSchema: 'VastuArHeatmapRasterRequest', responseSchema: 'VastuArHeatmapRasterResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'ar/anchor-recommendations': { method: 'POST', requestSchema: 'VastuArAnchorRecommendationsRequest', responseSchema: 'VastuArAnchorRecommendationsResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'ar/zone-textures': { method: 'POST', requestSchema: 'VastuArZoneTexturesRequest', responseSchema: 'VastuArZoneTexturesResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'ar/yantra-meshes': { method: 'POST', requestSchema: 'VastuArYantraMeshesRequest', responseSchema: 'VastuArYantraMeshesResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'ar/deity-icons': { method: 'POST', requestSchema: 'VastuArDeityIconsRequest', responseSchema: 'VastuArDeityIconsResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'ar/room-capture': { method: 'POST', requestSchema: 'VastuArRoomCaptureRequest', responseSchema: 'VastuArRoomCaptureResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'scans/save': { method: 'POST', requestSchema: 'VastuScansSaveRequest', responseSchema: 'VastuScansSaveResponse', auth: 'apiKey', errors: [400, 401, 402, 404, 405, 409, 410, 413, 415, 422, 503] },
  'scans/retrieve': { method: 'POST', requestSchema: 'VastuScansRetrieveRequest', responseSchema: 'VastuScansRetrieveResponse', auth: 'apiKey', errors: [400, 401, 402, 404, 405, 409, 410, 413, 415, 422, 503] },
  'scans/list': { method: 'POST', requestSchema: 'VastuScansListRequest', responseSchema: 'VastuScansListResponse', auth: 'apiKey', errors: [400, 401, 402, 404, 405, 409, 410, 413, 415, 422, 503] },
  'scans/delete': { method: 'POST', requestSchema: 'VastuScansDeleteRequest', responseSchema: 'VastuScansDeleteResponse', auth: 'apiKey', errors: [400, 401, 404, 405, 409, 410, 413, 415, 503] },
  'scans/timelapse': { method: 'POST', requestSchema: 'VastuScansTimelapseRequest', responseSchema: 'VastuScansTimelapseResponse', auth: 'apiKey', errors: [400, 401, 402, 404, 405, 409, 410, 413, 415, 422, 503] },
  'plot/shape': { method: 'POST', requestSchema: 'VastuPlotShapeRequest', responseSchema: 'VastuPlotShapeResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'plot/ratio': { method: 'POST', requestSchema: 'VastuPlotRatioRequest', responseSchema: 'VastuPlotRatioResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'entrance/pada': { method: 'POST', requestSchema: 'VastuEntrancePadaRequest', responseSchema: 'VastuEntrancePadaResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'direction/correct': { method: 'POST', requestSchema: 'VastuDirectionCorrectRequest', responseSchema: 'VastuDirectionCorrectResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'direction/declination': { method: 'GET_OR_POST', requestSchema: 'VastuDirectionDeclinationRequest', responseSchema: 'VastuDirectionDeclinationResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'direction/zone-from-bearing': { method: 'POST', requestSchema: 'VastuDirectionZoneFromBearingRequest', responseSchema: 'VastuDirectionZoneFromBearingResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'audit/floor-plan': { method: 'POST', requestSchema: 'VastuAuditFloorPlanRequest', responseSchema: 'VastuAuditFloorPlanResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 429, 500] },
  'audit/floor-plan-detailed': { method: 'POST', requestSchema: 'VastuAuditFloorPlanDetailedRequest', responseSchema: 'VastuAuditFloorPlanDetailedResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'audit/single-room': { method: 'POST', requestSchema: 'VastuAuditSingleRoomRequest', responseSchema: 'VastuAuditSingleRoomResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'ar/scan-quality': { method: 'POST', requestSchema: 'VastuArScanQualityRequest', responseSchema: 'VastuArScanQualityResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'mandala/project/9-zone': { method: 'POST', requestSchema: 'VastuMandalaProject9ZoneRequest', responseSchema: 'VastuMandalaProject9ZoneResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'mandala/project/81-pada': { method: 'POST', requestSchema: 'VastuMandalaProject81PadaRequest', responseSchema: 'VastuMandalaProject81PadaResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'mandala/project/brahmasthan': { method: 'POST', requestSchema: 'VastuMandalaProjectBrahmasthanRequest', responseSchema: 'VastuMandalaProjectBrahmasthanResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'reference/directions/8': { method: 'GET', requestSchema: null, responseSchema: 'VastuReferenceDirections8Response', auth: 'apiKey', errors: [400, 401, 402, 405, 500] },
  'reference/mandala/9-zone': { method: 'GET', requestSchema: null, responseSchema: 'VastuReferenceMandala9ZoneResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 500] },
  'reference/mandala/45-devatas': { method: 'GET', requestSchema: null, responseSchema: 'VastuReferenceMandala45DevatasResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 500] },
  'reference/defects/catalog': { method: 'GET', requestSchema: null, responseSchema: 'VastuReferenceDefectsCatalogResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 500] },
  'reference/remedies/catalog': { method: 'GET', requestSchema: null, responseSchema: 'VastuReferenceRemediesCatalogResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 500] },
  'reference/directions/16': { method: 'GET', requestSchema: null, responseSchema: 'VastuReferenceDirections16Response', auth: 'apiKey', errors: [400, 401, 402, 405, 500] },
  'reference/directions/32': { method: 'GET', requestSchema: null, responseSchema: 'VastuReferenceDirections32Response', auth: 'apiKey', errors: [400, 401, 402, 405, 500] },
  'reference/colors-by-zone': { method: 'GET', requestSchema: null, responseSchema: 'VastuReferenceColorsByZoneResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 500] },
  'reference/materials-by-zone': { method: 'GET', requestSchema: null, responseSchema: 'VastuReferenceMaterialsByZoneResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 500] },
  'reference/mandala/64-pada': { method: 'GET', requestSchema: null, responseSchema: 'VastuReferenceMandala64PadaResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 500] },
  'reference/gate-obstructions': { method: 'GET', requestSchema: null, responseSchema: 'VastuReferenceGateObstructionsResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 500] },
  'room/kitchen': { method: 'POST', requestSchema: 'VastuRoomKitchenRequest', responseSchema: 'VastuRoomKitchenResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'room/bedroom': { method: 'POST', requestSchema: 'VastuRoomBedroomRequest', responseSchema: 'VastuRoomBedroomResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'room/pooja': { method: 'POST', requestSchema: 'VastuRoomPoojaRequest', responseSchema: 'VastuRoomPoojaResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'room/toilet': { method: 'POST', requestSchema: 'VastuRoomToiletRequest', responseSchema: 'VastuRoomToiletResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'room/staircase': { method: 'POST', requestSchema: 'VastuRoomStaircaseRequest', responseSchema: 'VastuRoomStaircaseResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'room/study': { method: 'POST', requestSchema: 'VastuRoomStudyRequest', responseSchema: 'VastuRoomStudyResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'room/living': { method: 'POST', requestSchema: 'VastuRoomLivingRequest', responseSchema: 'VastuRoomLivingResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'room/dining': { method: 'POST', requestSchema: 'VastuRoomDiningRequest', responseSchema: 'VastuRoomDiningResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'room/store': { method: 'POST', requestSchema: 'VastuRoomStoreRequest', responseSchema: 'VastuRoomStoreResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'room/water-storage': { method: 'POST', requestSchema: 'VastuRoomWaterStorageRequest', responseSchema: 'VastuRoomWaterStorageResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'placement/borewell': { method: 'POST', requestSchema: 'VastuPlacementBorewellRequest', responseSchema: 'VastuPlacementBorewellResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'placement/well': { method: 'POST', requestSchema: 'VastuPlacementWellRequest', responseSchema: 'VastuPlacementWellResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'placement/septic-tank': { method: 'POST', requestSchema: 'VastuPlacementSepticTankRequest', responseSchema: 'VastuPlacementSepticTankResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'placement/overhead-tank': { method: 'POST', requestSchema: 'VastuPlacementOverheadTankRequest', responseSchema: 'VastuPlacementOverheadTankResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'placement/tree': { method: 'POST', requestSchema: 'VastuPlacementTreeRequest', responseSchema: 'VastuPlacementTreeResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'placement/garden': { method: 'POST', requestSchema: 'VastuPlacementGardenRequest', responseSchema: 'VastuPlacementGardenResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'placement/balcony': { method: 'POST', requestSchema: 'VastuPlacementBalconyRequest', responseSchema: 'VastuPlacementBalconyResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'placement/window': { method: 'POST', requestSchema: 'VastuPlacementWindowRequest', responseSchema: 'VastuPlacementWindowResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'placement/generator-electrical': { method: 'POST', requestSchema: 'VastuPlacementGeneratorElectricalRequest', responseSchema: 'VastuPlacementGeneratorElectricalResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'placement/main-gate': { method: 'POST', requestSchema: 'VastuPlacementMainGateRequest', responseSchema: 'VastuPlacementMainGateResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'plot/extensions-cuts': { method: 'POST', requestSchema: 'VastuPlotExtensionsCutsRequest', responseSchema: 'VastuPlotExtensionsCutsResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'plot/slope': { method: 'POST', requestSchema: 'VastuPlotSlopeRequest', responseSchema: 'VastuPlotSlopeResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'plot/orientation': { method: 'POST', requestSchema: 'VastuPlotOrientationRequest', responseSchema: 'VastuPlotOrientationResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'plot/road-orientation': { method: 'POST', requestSchema: 'VastuPlotRoadOrientationRequest', responseSchema: 'VastuPlotRoadOrientationResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'entrance/recommend': { method: 'POST', requestSchema: 'VastuEntranceRecommendRequest', responseSchema: 'VastuEntranceRecommendResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'elements/distribution': { method: 'POST', requestSchema: 'VastuElementsDistributionRequest', responseSchema: 'VastuElementsDistributionResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'elements/balance-suggest': { method: 'POST', requestSchema: 'VastuElementsBalanceSuggestRequest', responseSchema: 'VastuElementsBalanceSuggestResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'direction/auspicious-facing': { method: 'POST', requestSchema: 'VastuDirectionAuspiciousFacingRequest', responseSchema: 'VastuDirectionAuspiciousFacingResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'score/overall': { method: 'POST', requestSchema: 'VastuScoreOverallRequest', responseSchema: 'VastuScoreOverallResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'score/zone-wise': { method: 'POST', requestSchema: 'VastuScoreZoneWiseRequest', responseSchema: 'VastuScoreZoneWiseResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'score/compliance-index': { method: 'POST', requestSchema: 'VastuScoreComplianceIndexRequest', responseSchema: 'VastuScoreComplianceIndexResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'multi-storey/floor-rules': { method: 'POST', requestSchema: 'VastuMultiStoreyFloorRulesRequest', responseSchema: 'VastuMultiStoreyFloorRulesResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'compound/wall-analysis': { method: 'POST', requestSchema: 'VastuCompoundWallAnalysisRequest', responseSchema: 'VastuCompoundWallAnalysisResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'floor/level-analysis': { method: 'POST', requestSchema: 'VastuFloorLevelAnalysisRequest', responseSchema: 'VastuFloorLevelAnalysisResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'specialized/residential': { method: 'POST', requestSchema: 'VastuSpecializedResidentialRequest', responseSchema: 'VastuSpecializedResidentialResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'specialized/commercial': { method: 'POST', requestSchema: 'VastuSpecializedCommercialRequest', responseSchema: 'VastuSpecializedCommercialResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'specialized/temple': { method: 'POST', requestSchema: 'VastuSpecializedTempleRequest', responseSchema: 'VastuSpecializedTempleResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'specialized/factory': { method: 'POST', requestSchema: 'VastuSpecializedFactoryRequest', responseSchema: 'VastuSpecializedFactoryResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'specialized/hospital': { method: 'POST', requestSchema: 'VastuSpecializedHospitalRequest', responseSchema: 'VastuSpecializedHospitalResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'specialized/restaurant': { method: 'POST', requestSchema: 'VastuSpecializedRestaurantRequest', responseSchema: 'VastuSpecializedRestaurantResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'specialized/educational': { method: 'POST', requestSchema: 'VastuSpecializedEducationalRequest', responseSchema: 'VastuSpecializedEducationalResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'timing/bhumi-pujan': { method: 'POST', requestSchema: 'VastuTimingBhumiPujanRequest', responseSchema: 'VastuTimingBhumiPujanResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'timing/grihapravesh': { method: 'POST', requestSchema: 'VastuTimingGrihapraveshRequest', responseSchema: 'VastuTimingGrihapraveshResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'timing/construction-start': { method: 'POST', requestSchema: 'VastuTimingConstructionStartRequest', responseSchema: 'VastuTimingConstructionStartResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'timing/vastu-shanti': { method: 'POST', requestSchema: 'VastuTimingVastuShantiRequest', responseSchema: 'VastuTimingVastuShantiResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'plan/analyze': { method: 'POST', requestSchema: 'VastuPlanAnalyzeRequest', responseSchema: 'VastuPlanAnalyzeResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'plan/upload': { method: 'POST', requestSchema: 'VastuPlanUploadRequest', responseSchema: 'VastuPlanUploadResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'plan/report': { method: 'POST', requestSchema: 'VastuPlanReportRequest', responseSchema: 'VastuPlanReportResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'plan/generate': { method: 'POST', requestSchema: 'VastuPlanGenerateRequest', responseSchema: 'VastuPlanGenerateResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'plan/from-requirements': { method: 'POST', requestSchema: 'VastuPlanFromRequirementsRequest', responseSchema: 'VastuPlanFromRequirementsResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'plan/optimize': { method: 'POST', requestSchema: 'VastuPlanOptimizeRequest', responseSchema: 'VastuPlanOptimizeResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'fusion/chart': { method: 'POST', requestSchema: 'VastuFusionChartRequest', responseSchema: 'VastuFusionChartResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'compare/before-after-remedy': { method: 'POST', requestSchema: 'VastuCompareBeforeAfterRemedyRequest', responseSchema: 'VastuCompareBeforeAfterRemedyResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'entrance/obstruction-check': { method: 'POST', requestSchema: 'VastuEntranceObstructionCheckRequest', responseSchema: 'VastuEntranceObstructionCheckResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'direction/sun-path': { method: 'POST', requestSchema: 'VastuDirectionSunPathRequest', responseSchema: 'VastuDirectionSunPathResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'ar/true-north-calibrate': { method: 'POST', requestSchema: 'VastuArTrueNorthCalibrateRequest', responseSchema: 'VastuArTrueNorthCalibrateResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'assessments': { method: 'POST', requestSchema: 'VastuAssessmentsRequest', responseSchema: 'VastuAssessmentsResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
  'assessments/batch': { method: 'POST', requestSchema: 'VastuAssessmentsBatchRequest', responseSchema: 'VastuAssessmentsBatchResponse', auth: 'apiKey', errors: [400, 401, 402, 405, 415, 500] },
} as const satisfies Record<VastuOperation, {
  method: 'GET' | 'POST' | 'GET_OR_POST';
  requestSchema: string | null;
  responseSchema: string;
  auth: 'apiKey';
  errors: readonly number[];
}>;

/**
 * True only for genuine loopback: the literal `localhost`, the IPv6 loopback
 * `::1`, or an IPv4 address in 127.0.0.0/8. A DNS name that merely starts with
 * "127." (e.g. `127.attacker.invalid`) is NOT loopback and must not bypass the
 * cleartext-HTTP policy.
 */
function isLoopbackHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h === '::1') return true;
  const m = /^127\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (!m) return false;
  return m.slice(1).every((o) => Number(o) <= 255);
}

/** Credentials may use the official HTTPS origin or local loopback HTTP only. */
function assertSafeBaseUrl(baseUrl: string): URL {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new AuthenticationError(`Invalid baseUrl`);
  }
  // Reject embedded credentials: `https://api.vedika.io@attacker.invalid` parses
  // with host `attacker.invalid` but reads as api.vedika.io, so the Bearer API key
  // would ride to the attacker on the very first request. No legitimate API base
  // URL carries userinfo, a path, a query, or a fragment.
  if (url.username || url.password) {
    throw new AuthenticationError(
      `baseUrl must not contain embedded credentials (user:pass@host)`
    );
  }
  if ((url.pathname && url.pathname !== '/') || url.search || url.hash) {
    throw new AuthenticationError(
      `baseUrl must be a bare origin (scheme://host[:port]) with no path/query/fragment`
    );
  }
  if (url.origin === 'https://api.vedika.io') return url;
  if (url.protocol === 'http:' && isLoopbackHost(url.hostname)) return url;
  throw new AuthenticationError(
    'baseUrl must use https://api.vedika.io or loopback http://; custom origins are not allowed'
  );
}

export class VedikaClient {
  /** One entry per mounted logical route; both public URL aliases share it. */
  static readonly VASTU_OPERATIONS = VASTU_OPERATIONS;
  static readonly VASTU_OPERATION_CONTRACTS = VASTU_OPERATION_CONTRACTS;
  private client: AxiosInstance;
  private apiKey: string;
  private defaultLanguage: string;
  /** Maximum automatic retries for safe (idempotent) requests. 0 disables retry. */
  private maxRetries: number;

  /**
   * Create a new Vedika API client
   *
   * @param options - Client configuration options
   * @throws {AuthenticationError} If API key is not provided
   */
  constructor(options: VedikaClientOptions) {
    if (!options.apiKey) {
      throw new AuthenticationError(
        'API key is required. Get one at https://vedika.io/dashboard.html'
      );
    }

    this.apiKey = options.apiKey;
    this.defaultLanguage = options.language || 'en';
    this.maxRetries = options.maxRetries ?? 3;

    const baseURL = options.baseUrl || 'https://api.vedika.io';
    const timeout = options.timeout || 60000;

    // Validate before creating a transport that holds credential headers.
    const allowedOrigin = assertSafeBaseUrl(baseURL).origin;

    // X-API-Key is DEPRECATED at server level, sunset
    // Oct 20, 2026. Send Authorization: Bearer as PRIMARY auth. Keep
    // X-API-Key for backwards-compat with pre-v2.3 server middleware only.
    // UA synced to actual package version.
    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-API-Key': this.apiKey,  // DEPRECATED — remove after 2026-10-20
        'User-Agent': 'vedika-javascript-sdk/3.0.10',
      },
      // Credential-routing hardening, NODE TRANSPORT ONLY. axios strips
      // its default sensitive headers (incl. Authorization) on a cross-origin
      // redirect but forwards the legacy X-API-Key to the redirect destination
      // — leaking the key. Strip BOTH auth headers on any redirect that leaves
      // the current origin or downgrades HTTPS->HTTP (same-origin redirects keep
      // them). beforeRedirect only runs in Node; the browser XHR/fetch adapter
      // follows redirects opaquely and cannot be intercepted here, so browser
      // callers should keep keys server-side behind their own proxy.
      beforeRedirect: (opts: Record<string, any>, _res: unknown, req?: { url?: string }) => {
        let sameOrigin = false;
        try {
          sameOrigin = !!req?.url && new URL(req.url).origin === new URL(opts.href).origin;
        } catch {
          sameOrigin = false;
        }
        if (!sameOrigin && opts.headers) {
          for (const name of Object.keys(opts.headers)) {
            const lower = name.toLowerCase();
            if (lower === 'authorization' || lower === 'x-api-key') delete opts.headers[name];
          }
        }
      },
    });

    // The constructor check alone is not the invariant. axios ignores `baseURL`
    // whenever the request URL is absolute OR protocol-relative (`//host/path`),
    // and a per-request `baseURL` overrides the instance default outright — so a
    // single method that forwarded a caller-supplied path would reopen the leak
    // behind a guard that looks intact. This resolves every outgoing request
    // against the approved origin and refuses anything that lands elsewhere.
    // No public method can reach it today; it is here so none ever can.
    this.client.interceptors.request.use((config) => {
      const base = (config.baseURL ?? baseURL) as string;
      let target: URL;
      try {
        target = new URL(config.url || '', base);
      } catch {
        throw new AuthenticationError(
          `Refusing to send the API key: request URL ${config.url} is not resolvable ` +
          `against ${allowedOrigin}.`
        );
      }
      if (target.origin !== allowedOrigin) {
        throw new AuthenticationError(
          `Refusing to send the API key to ${target.origin} — this client is bound ` +
          `to ${allowedOrigin}.`
        );
      }
      return config;
    });

    // Attach a client idempotency key to every mutating request (POST/PUT/PATCH/
    // DELETE) and billed Vastu GET that doesn't already carry one. The server
    // dedupes a retried charge on this header, including reference-table GETs
    // (see the API idempotency contract, which accepts
    // `Idempotency-Key` / `X-Idempotency-Key` / `X-Request-Id`). The SAME config
    // object is reused across retries (see `this.client.request(config)` below),
    // so the key stays identical for every attempt of one logical call.
    this.client.interceptors.request.use((config) => {
      if ((isMutatingMethod(config.method) || isBilledVastuGet(config.method, config.url)) &&
          !hasIdempotencyHeader(config.headers as any)) {
        config.headers = config.headers || ({} as any);
        (config.headers as any)['Idempotency-Key'] = generateIdempotencyKey();
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        // V2 envelope unwrap (3.0.4): every /v2/* endpoint wraps its payload as
        // { success, data, billing, meta }. Pre-3.0.4 the typed methods returned
        // the WRAPPER, so callers got {success,data,...} instead of the reading.
        // Unwrap to the payload here, centrally, so v1 shapes
        // (askQuestion {success,response,metadata}; chart {chartData,metadata})
        // are never touched. The original envelope stays reachable as a
        // non-enumerable `__envelope` (won't pollute JSON.stringify).
        //
        // TS→Rust transition tolerance (3.0.6): `billing` is no longer REQUIRED
        // to recognise the envelope. The cutover aligns Rust v2 responses to the
        // live TS contract, but some engines/families emit the envelope without a
        // top-level `billing` block (billing may move to `meta`, or be omitted on
        // free/idempotent paths). Keying the unwrap on `billing` left those
        // responses wrapped, so callers on the direct-return methods
        // (matrimony, western relationship, spiritual, human-design, iching)
        // got the raw {success,data} envelope instead of the payload. We now
        // unwrap on the load-bearing `success===true && data is object`
        // signature, which both engines share. v1 payloads
        // ({answer,...} / {ascendant,...}) never carry BOTH keys, so they are
        // still never touched.
        const b: any = response.data;
        if (b && typeof b === 'object' && !Array.isArray(b)
            && b.success === true
            && b.data !== undefined && b.data !== null && typeof b.data === 'object') {
          const payload = b.data;
          try { Object.defineProperty(payload, '__envelope', { value: b, enumerable: false }); }
          catch { /* frozen payload — skip */ }
          response.data = payload;
        }
        return response;
      },
      async (error: AxiosError) => {
        // A credential-routing refusal is thrown by the request interceptor
        // above, so it arrives here as a rejection with no `response`. Both the
        // retry rule ("no response — the request may never have landed") and
        // handleError's fallback would mangle it: the SDK would dial the same
        // refusal three times and then report it as a generic VedikaAPIError.
        // Anything already typed is final — surface it unchanged.
        if (error instanceof VedikaAPIError) throw error;
        // maxRetries: retry BEFORE converting to a typed
        // exception — once handleError throws, the axios config is gone.
        // Only retries requests that are either naturally idempotent (GET) or
        // carry the idempotency key attached above, so a retried POST can
        // never double-charge. Streaming/arraybuffer requests are excluded
        // (askQuestionStream, askVoice) since their body can't be re-sent.
        const config: any = error.config;
        if (this.maxRetries > 0 && isRetryableRequest(config) && isRetryableError(error)) {
          config.__retryCount = (config.__retryCount || 0) + 1;
          if (config.__retryCount <= this.maxRetries) {
            const delayMs = Math.min(1000 * 2 ** (config.__retryCount - 1), 8000);
            await this.sleep(delayMs);
            return this.client.request(config);
          }
        }
        return this.handleError(error);
      }
    );
  }

  /** Delay helper for retry backoff — overridable in tests. */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Handle API errors and convert to appropriate exception types
   */
  private handleError(error: AxiosError): never {
    if (error.response) {
      const status = error.response.status;
      const data: any = error.response.data;
      const message = data?.message || error.message;

      switch (status) {
        case 401:
          throw new AuthenticationError(message);
        case 402:
          // Branch on server code field to
          // distinguish expired subscription from genuine wallet underrun.
          // Server emits SUBSCRIPTION_EXPIRED when billing period ended
          if (data?.code === 'SUBSCRIPTION_EXPIRED') {
            throw new SubscriptionExpiredError(message);
          }
          throw new InsufficientCreditsError(message);
        case 408:
          throw new TimeoutError(message);
        case 422:
          throw new ValidationError(message);
        case 429:
          throw new RateLimitError(message);
        case 500:
        case 502:
        case 503:
        case 504:
          throw new ServerError(message, status);
        default:
          throw new VedikaAPIError(`HTTP ${status}: ${message}`, status);
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new TimeoutError('Request timed out. For complex queries, try increasing timeout.');
    } else if (error.request) {
      throw new NetworkError('Network error. Check your internet connection.');
    } else {
      throw new VedikaAPIError(error.message);
    }
  }

  /**
   * Ask a conversational astrology question (UNIQUE to Vedika!)
   *
   * This is the only B2B astrology API that supports natural language queries.
   *
   * @param query - Question query parameters
   * @returns Promise resolving to the answer
   *
   * @example
   * ```typescript
   * const response = await client.askQuestion({
   *   question: 'What are my career prospects this year?',
   *   birthDetails: {
   *     datetime: '1990-06-15T14:30:00+05:30',
   *     latitude: 28.6139,
   *     longitude: 77.2090,
   *     timezone: '+05:30'
   *   },
   *   language: 'en'
   * });
   *
   * console.log(response.answer);
   * console.log(`Confidence: ${response.confidence}`);
   * ```
   */
  async askQuestion(query: QuestionQuery | EnhancedQuestionQuery): Promise<QuestionResponse> {
    const enhanced = query as EnhancedQuestionQuery;
    const response = await this.client.post<QuestionResponse>('/api/v1/astrology/query', {
      question: query.question,
      birthDetails: query.birthDetails,
      language: query.language || this.defaultLanguage,
      ...(enhanced.system && { system: enhanced.system }),
      ...(enhanced.speed && { speed: enhanced.speed }),
      ...(enhanced.conversationId && { conversationId: enhanced.conversationId }),
      ...(enhanced.partnerBirthDetails && { partnerBirthDetails: enhanced.partnerBirthDetails }),
      ...(enhanced.includeRemedies !== undefined && { includeRemedies: enhanced.includeRemedies }),
      ...(enhanced.category && { category: enhanced.category }),
      ...(enhanced.responseFormat && { responseFormat: enhanced.responseFormat }),
    });

    return response.data;
  }

  /**
   * Ask a question about a Vastu report you already hold.
   *
   * @example
   * ```typescript
   * const report = await client.vastu('plan/analyze', { ... });
   * const first = await client.askVastuReport({ question: 'What should I fix first?', report });
   * const next = await client.askVastuReport({
   *   question: 'And the kitchen?',
   *   conversationId: first.conversationId,
   * });
   * ```
   */
  async askVastuReport(query: VastuReportQuestion): Promise<QuestionResponse & { conversationId?: string }> {
    if (query.report === undefined && !query.conversationId) {
      throw new ValidationError('askVastuReport needs a report or a conversationId that already holds one');
    }
    const response = await this.client.post<QuestionResponse & { conversationId?: string }>('/api/v1/astrology/query', {
      question: query.question,
      language: query.language || this.defaultLanguage,
      ...(query.report !== undefined && { vastuContext: { report: query.report } }),
      ...(query.conversationId && { conversationId: query.conversationId }),
      ...(query.speed && { speed: query.speed }),
    });
    return response.data;
  }

  /**
   * Stream conversational astrology question response in real-time
   *
   * @param query - Question query parameters
   * @returns Async generator yielding response chunks
   *
   * @example
   * ```typescript
   * for await (const chunk of client.askQuestionStream({
   *   question: 'What are my career prospects?',
   *   birthDetails: birthInfo
   * })) {
   *   process.stdout.write(chunk);
   * }
   * ```
   */
  async *askQuestionStream(query: QuestionQuery): AsyncGenerator<string> {
    const response = await this.client.post(
      '/api/v1/astrology/query/stream',
      {
        question: query.question,
        birthDetails: query.birthDetails,
        language: query.language || this.defaultLanguage,
      },
      {
        responseType: 'stream',
      }
    );

    const stream = response.data;

    for await (const chunk of stream) {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          yield line.substring(6);
        }
      }
    }
  }

  /**
   * Generate a complete birth chart
   *
   * @param query - Birth chart query parameters
   * @returns Promise resolving to the birth chart
   *
   * @example
   * ```typescript
   * const chart = await client.getBirthChart({
   *   datetime: '1990-06-15T14:30:00+05:30',
   *   latitude: 28.6139,
   *   longitude: 77.2090,
   *   timezone: '+05:30',
   *   ayanamsa: 'lahiri'
   * });
   *
   * console.log(chart.ascendant);
   * console.log(chart.planets);
   * ```
   */
  async getBirthChart(query: BirthChartQuery): Promise<BirthChart> {
    const response = await this.client.post<BirthChart>('/api/v1/chart', {
      birthDetails: {
        datetime: query.datetime,
        latitude: query.latitude,
        longitude: query.longitude,
        timezone: query.timezone || 'UTC',
      },
      ayanamsa: query.ayanamsa || 'lahiri',
    });

    return response.data;
  }

  /**
   * Get Vimshottari Dasha periods
   *
   * @param birthDetails - Birth information
   * @returns Promise resolving to dasha periods
   *
   * @example
   * ```typescript
   * const dashas = await client.getDashas(birthDetails);
   *
   * dashas.mahadashas.forEach(dasha => {
   *   console.log(`${dasha.planet}: ${dasha.startDate} to ${dasha.endDate}`);
   * });
   * ```
   */
  async getDashas(birthDetails: BirthDetails): Promise<DashaResponse> {
    const response = await this.client.post<DashaResponse>('/v2/astrology/dasha-periods', {
      ...birthDetails,
    });

    const _body = response.data as any;
    return (_body && _body.data !== undefined ? _body.data : _body);
  }

  /**
   * Check marriage compatibility using Ashtakoota matching
   *
   * @param query - Compatibility query parameters
   * @returns Promise resolving to compatibility analysis
   *
   * @example
   * ```typescript
   * const compatibility = await client.checkCompatibility({
   *   person1: birthDetails1,
   *   person2: birthDetails2
   * });
   *
   * console.log(`Total score: ${compatibility.totalScore}/36`);
   * console.log(`Compatibility: ${compatibility.compatibilityLevel}`);
   * ```
   */
  async checkCompatibility(query: CompatibilityQuery): Promise<CompatibilityResponse> {
    const response = await this.client.post<CompatibilityResponse>('/api/v1/compatibility', {
      person1: query.person1,
      person2: query.person2,
    });

    return response.data;
  }

  /**
   * Detect 300+ astrological yogas
   *
   * @param birthDetails - Birth information
   * @returns Promise resolving to detected yogas
   *
   * @example
   * ```typescript
   * const yogas = await client.detectYogas(birthDetails);
   *
   * console.log(`Found ${yogas.yogas.length} yogas:`);
   * yogas.yogas.forEach(yoga => {
   *   console.log(`- ${yoga.name}: ${yoga.description}`);
   * });
   * ```
   */
  async detectYogas(birthDetails: BirthDetails): Promise<YogaResponse> {
    const response = await this.client.post<YogaResponse>('/v2/astrology/jaimini/rajayogas', {
      ...birthDetails,
    });

    const _body = response.data as any;
    return (_body && _body.data !== undefined ? _body.data : _body);
  }

  /**
   * Analyze doshas (Kaal Sarp, Mangal, Sade Sati, etc.)
   *
   * @param birthDetails - Birth information
   * @returns Promise resolving to dosha analysis
   *
   * @example
   * ```typescript
   * const doshas = await client.analyzeDoshas(birthDetails);
   *
   * if (doshas.kaalSarpDosha.present) {
   *   console.log('Kaal Sarp Dosha detected');
   *   console.log(`Type: ${doshas.kaalSarpDosha.type}`);
   * }
   * ```
   */
  async analyzeDoshas(birthDetails: BirthDetails): Promise<DoshaResponse> {
    const response = await this.client.post<DoshaResponse>('/v2/astrology/all-doshas', {
      ...birthDetails,
    });

    const _body = response.data as any;
    return (_body && _body.data !== undefined ? _body.data : _body);
  }

  /**
   * Find auspicious times (Muhurtha) for important events
   *
   * @param query - Muhurtha query parameters
   * @returns Promise resolving to auspicious timing analysis
   *
   * @example
   * ```typescript
   * const muhurtha = await client.getMuhurtha({
   *   date: '2025-11-01',
   *   location: { latitude: 28.6139, longitude: 77.2090 },
   *   eventType: 'wedding'
   * });
   *
   * console.log(`Best time: ${muhurtha.bestTime}`);
   * ```
   */
  async getMuhurtha(query: MuhurthaQuery): Promise<MuhurthaResponse> {
    const response = await this.client.post<MuhurthaResponse>('/v2/astrology/muhurta', {
      date: query.date,
      latitude: query.location.latitude,
      longitude: query.location.longitude,
      eventType: query.eventType,
    });

    const _body = response.data as any;
    return (_body && _body.data !== undefined ? _body.data : _body);
  }

  /**
   * Get numerology analysis (37 calculations)
   *
   * @param query - Numerology query parameters
   * @returns Promise resolving to numerology analysis
   *
   * @example
   * ```typescript
   * const numerology = await client.getNumerology({
   *   name: 'John Doe',
   *   birthDate: '1990-06-15'
   * });
   *
   * console.log(`Life Path Number: ${numerology.lifePath}`);
   * ```
   */
  async getNumerology(query: NumerologyQuery): Promise<NumerologyResponse> {
    const response = await this.client.post<NumerologyResponse>('/v2/astrology/numerology/complete', {
      name: query.name,
      birthDate: query.birthDate,
    });

    const _body = response.data as any;
    return (_body && _body.data !== undefined ? _body.data : _body);
  }

  // ═══════════════════════════════════════════
  // V2 Vedic Computation Endpoints
  // ═══════════════════════════════════════════

  /** Get birth chart via V2 endpoint (faster, cheaper) */
  async getBirthChartV2(type: ChartType | string, birthDetails: V2Query): Promise<Record<string, any>> {
    const response = await this.client.post(`/v2/astrology/${type}`, birthDetails);
    return response.data;
  }

  /** Get Dasha periods via V2 endpoint */
  async getDashaV2(system: DashaSystem | string, birthDetails: V2Query): Promise<Record<string, any>> {
    const response = await this.client.post(`/v2/astrology/${system}`, birthDetails);
    return response.data;
  }

  /** Get Dosha analysis via V2 endpoint */
  async getDoshasV2(type: DoshaType | string, birthDetails: V2Query): Promise<Record<string, any>> {
    const response = await this.client.post(`/v2/astrology/${type}`, birthDetails);
    return response.data;
  }

  /** Get compatibility matching via V2 endpoint */
  async getCompatibilityV2(
    type: MatchingType | string,
    male: V2Query,
    female: V2Query
  ): Promise<Record<string, any>> {
    const response = await this.client.post(`/v2/astrology/${type}`, { male, female });
    return response.data;
  }

  /** Get Panchang (Hindu calendar) data */
  async getPanchang(options?: {
    date?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
  }): Promise<Record<string, any>> {
    const response = await this.client.get('/v2/astrology/panchang', { params: options });
    return response.data;
  }

  /** Get Muhurta (auspicious timing) via V2 endpoint */
  async getMuhurtaV2(
    type: MuhurtaType | string,
    options?: { latitude?: number; longitude?: number; timezone?: string }
  ): Promise<Record<string, any>> {
    const response = await this.client.get(`/v2/astrology/${type}`, { params: options });
    return response.data;
  }

  /** Get divisional chart (D2-D60) */
  async getDivisionalChart(chart: DivisionalChartType | string, birthDetails: V2Query): Promise<Record<string, any>> {
    // D2 'hora' is /v2/astrology/hora-chart; /hora is the muhurta planetary-hours endpoint.
    const path = (chart === 'hora' || chart === 'D2') ? 'hora-chart' : chart;
    const response = await this.client.post(`/v2/astrology/${path}`, birthDetails);
    return response.data;
  }

  /** Get predictions (daily/weekly/monthly/quarterly/yearly) */
  async getPrediction(
    period: PredictionPeriod | string,
    options?: PredictionQuery
  ): Promise<Record<string, any>> {
    const response = await this.client.post(`/v2/astrology/prediction/${period}`, options);
    return response.data;
  }

  /** Get Ashtakavarga analysis */
  async getAshtakavarga(type: 'ashtakavarga' | 'sarvashtakavarga' | string, birthDetails: V2Query): Promise<Record<string, any>> {
    const response = await this.client.post(`/v2/astrology/${type}`, birthDetails);
    return response.data;
  }

  /** Get Varshaphal (annual horoscope) */
  async getVarshaphal(birthDetails: V2Query, year?: number): Promise<Record<string, any>> {
    const response = await this.client.post('/v2/astrology/varshaphal', { ...birthDetails, year });
    return response.data;
  }

  /** Get planetary strength analysis */
  async getStrength(type: StrengthType | string, birthDetails: V2Query): Promise<Record<string, any>> {
    const response = await this.client.post(`/v2/astrology/${type}`, birthDetails);
    return response.data;
  }

  /** Get numerology via V2 endpoint */
  async getNumerologyV2(
    type: NumerologyType | string,
    options: { name?: string; birthDate?: string; system?: string; year?: number }
  ): Promise<Record<string, any>> {
    const response = await this.client.post(`/v2/astrology/numerology/${type}`, options);
    return response.data;
  }

  // ═══════════════════════════════════════════
  // Vastu (82 logical operations, mounted under two public aliases)
  //
  // Vastu takes a BUILDING (plot polygon, rooms, compass zone), never a
  // birth chart. Real paths are verified against the Rust-owned 82-operation
  // served OpenAPI contract — all live under
  // /v2/astrology/vastu/. `vastu()` and `vastuReference()` are generic
  // escape hatches for the long tail of the family set; the named helpers
  // below cover the common operations.
  // ═══════════════════════════════════════════

  /**
   * Any Vastu operation by its path suffix under `/v2/astrology/vastu/`.
   *
   * @example
   * ```typescript
   * const score = await client.vastu('score/overall', { rooms: [...] });
   * ```
   */
  async vastu(op: string, params: Record<string, unknown>, options?: VastuCallOptions): Promise<VastuOperationResult> {
    const path = stripLeadingSlash(op);
    const config = vastuCallConfig(path, options);
    const response = isVastuGetOp(path)
      ? await this.client.get(`/v2/astrology/vastu/${path}`, { params, ...config })
      : config
        ? await this.client.post(`/v2/astrology/vastu/${path}`, params, config)
        : await this.client.post(`/v2/astrology/vastu/${path}`, params);
    return response.data;
  }

  /** Closed, typed Vastu surface. Batch calls require a retained caller key. */
  async vastuOperation<Operation extends VastuOperation>(
    operation: Operation,
    params: VastuOperationContracts[Operation]['request'],
    options?: VastuCallOptions
  ): Promise<VastuOperationContracts[Operation]['response']> {
    const payload = (params ?? {}) as object;
    const config = vastuCallConfig(operation, options);
    const response = isVastuGetOp(operation)
      ? await this.client.get(`/v2/astrology/vastu/${operation}`, { params: payload, ...config })
      : config
        ? await this.client.post(`/v2/astrology/vastu/${operation}`, payload, config)
        : await this.client.post(`/v2/astrology/vastu/${operation}`, payload);
    // The general client unwraps V2 data. Exact typed methods expose the
    // original response so success, billing, and metadata match their types.
    return (response.data?.__envelope ?? response.data) as VastuOperationContracts[Operation]['response'];
  }

  /**
   * Fetch a Vastu reference table, e.g. `reference/mandala/9-zone`,
   * `reference/directions/8`, `reference/defects/catalog`,
   * `reference/remedies/catalog`, `reference/mandala/45-devatas`,
   * `reference/gate-obstructions`.
   */
  async vastuReference(table: string): Promise<Record<string, unknown>> {
    const response = await this.client.get(
      `/v2/astrology/vastu/${stripLeadingSlash(table)}`
    );
    return response.data;
  }

  /**
   * Project a mandala onto a plot. `scheme`: 9-zone, 81-pada, or brahmasthan.
   * Body: `{ plotPolygon, bearingDeg }`.
   */
  async vastuMandalaProject(
    scheme: VastuMandalaScheme | string,
    params: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const response = await this.client.post(
      `/v2/astrology/vastu/mandala/project/${stripLeadingSlash(scheme)}`,
      params
    );
    return response.data;
  }

  /** Exact door-pada operation. Body requires `plotPolygon` and `doorXY`. */
  async vastuEntrancePada(
    params: VastuOperationContracts['entrance/pada']['request']
  ): Promise<VastuOperationContracts['entrance/pada']['response']> {
    return this.vastuOperation('entrance/pada', params);
  }

  /**
   * Grade an AR scan before you pay to audit it.
   *
   * Returns `score` (0-100), `grade` (A-F), per-dimension `dimensions`,
   * `missingData`, `warnings`, `reScanSuggestions`, and `acceptForAudit` — the
   * one field worth branching on. Call this BEFORE an audit or assessment: a
   * scan the grader will not accept produces findings nobody should bill for.
   *
   * Omitted readings score a neutral 50 rather than a zero, so a partial scan
   * is graded on what it actually measured. See {@link VastuArScanQualityInput}.
   *
   * @example
   * ```typescript
   * const q = await client.vastuArScanQuality({
   *   pointCloudDensity: 850, polygonClosure: true, roomsTagged: true,
   *   compassConfidence: 0.9, gpsConfidence: 0.8,
   *   scanDurationSec: 240, scannedAreaM2: 60,
   * });
   * if (!q.data.acceptForAudit) console.log(q.data.reScanSuggestions);
   * ```
   */
  async vastuArScanQuality(
    params: VastuOperationContracts['ar/scan-quality']['request']
  ): Promise<VastuOperationContracts['ar/scan-quality']['response']> {
    return this.vastuOperation('ar/scan-quality', params);
  }

  /**
   * Derive true north from a sun sighting, for devices whose magnetic compass
   * cannot be trusted indoors — the calibration the native `VastuArView`
   * shells perform before any bearing is used.
   *
   * Apply the returned `offsetDeg` as
   * `trueHeadingDeg = (deviceHeadingDeg + offsetDeg) mod 360`.
   *
   * ALWAYS check `reliable` first. The sun is refused as a reference near the
   * horizon and near the zenith (above ~70 degrees elevation), where azimuth
   * moves too fast to fix a heading; in that case `reliable` is `false`,
   * `reason` says why, and `offsetDeg` must not be used.
   *
   * @example
   * ```typescript
   * const cal = await client.vastuArTrueNorthCalibrate({
   *   lat: 28.61, lon: 77.21,
   *   datetime: '2025-12-21T03:30:00Z',
   *   deviceHeadingAtSunDeg: 130,
   * });
   * if (cal.data.reliable) applyOffset(cal.data.offsetDeg);
   * ```
   */
  async vastuArTrueNorthCalibrate(
    params: VastuOperationContracts['ar/true-north-calibrate']['request']
  ): Promise<VastuOperationContracts['ar/true-north-calibrate']['response']> {
    return this.vastuOperation('ar/true-north-calibrate', params);
  }

  /** Exact entrance recommendation operation. Body requires `facing`. */
  async vastuEntranceRecommend(
    params: VastuOperationContracts['entrance/recommend']['request']
  ): Promise<VastuOperationContracts['entrance/recommend']['response']> {
    return this.vastuOperation('entrance/recommend', params);
  }

  /**
   * Single-room placement, e.g. `vastuRoom('kitchen', { zone: 'southeast' })`.
   * `roomType`: kitchen, bedroom, pooja, toilet, staircase, study, living,
   * dining, store, water-storage.
   */
  async vastuRoom(
    roomType: VastuRoomType | string,
    params: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const response = await this.client.post(
      `/v2/astrology/vastu/room/${stripLeadingSlash(roomType)}`,
      params
    );
    return response.data;
  }

  /** Site-feature placement, e.g. `vastuPlacement('borewell', { zone: 'north-east' })`. */
  async vastuPlacement(
    feature: VastuPlacementFeature | string,
    params: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const response = await this.client.post(
      `/v2/astrology/vastu/placement/${stripLeadingSlash(feature)}`,
      params
    );
    return response.data;
  }

  /**
   * Compliance audit. `kind`: single-room, floor-plan, floor-plan-detailed.
   * Body: `{ rooms: [...], plot? }`.
   */
  async vastuAudit(
    kind: VastuAuditKind | string,
    params: Record<string, unknown>
  ): Promise<VastuOperationResult> {
    const response = await this.client.post(
      `/v2/astrology/vastu/audit/${stripLeadingSlash(kind)}`,
      params
    );
    return response.data;
  }

  /**
   * Assess a real-estate listing's Vastu compliance. Folds `score/overall`,
   * the 9-zone reference, `entrance/pada`, and
   * `ar/scan-quality` into one buyer-facing verdict with a badge.
   *
   * Body must include `inputSource` ("seller-typed" | "plan-derived" |
   * "ar-measured") — it decides the badge and confidence ceiling and is never
   * inferred. Only `plan-derived` and `ar-measured` listings can ever carry
   * an assessed badge; `seller-typed` input is scored but never badge-eligible.
   *
   * Returns `score`, `confidence`, `badgeEligibility` (`{ inputSource, badge,
   * eligible, variant }`), `findings`, `grade`, and `confidenceBasis`. Check
   * `badgeEligibility.eligible` before displaying any badge to a buyer.
   */
  async vastuListingAssessment(params: Record<string, unknown>): Promise<VastuOperationResult> {
    const response = await this.client.post('/v2/astrology/vastu/assessments', params);
    return response.data;
  }

  /** Vastu score. `kind`: overall, zone-wise, compliance-index. */
  async vastuScore(
    kind: VastuScoreKind | string,
    params: Record<string, unknown>
  ): Promise<VastuOperationResult> {
    const response = await this.client.post(
      `/v2/astrology/vastu/score/${stripLeadingSlash(kind)}`,
      params
    );
    return response.data;
  }

  /** Generate up to 3 ranked floor plans from a plot + room programme. */
  async vastuPlanGenerate(
    params: VastuOperationContracts['plan/generate']['request']
  ): Promise<VastuOperationContracts['plan/generate']['response']> {
    return this.vastuOperation('plan/generate', params);
  }

  /** Generate a floor plan from a high-level brief (BHK, bathrooms, parking, ...). */
  async vastuPlanFromRequirements(
    params: VastuOperationContracts['plan/from-requirements']['request']
  ): Promise<VastuOperationContracts['plan/from-requirements']['response']> {
    return this.vastuOperation('plan/from-requirements', params);
  }

  /** Magnetic declination (true-north correction) for a location. India grid. */
  async vastuDeclination(
    options: VastuOperationContracts['direction/declination']['request']
  ): Promise<VastuOperationContracts['direction/declination']['response']> {
    return this.vastuOperation('direction/declination', options);
  }

  // ═══════════════════════════════════════════
  // Horoscope
  // ═══════════════════════════════════════════

  /** Get horoscope for a zodiac sign */
  async getHoroscope(
    sign: string,
    options?: HoroscopeQuery
  ): Promise<Record<string, any>> {
    const system = options?.system || 'vedic';
    const basePath = system === 'western' ? '/v2/western' : '/v2/astrology';
    const period = options?.period || 'daily';
    // Western only exposes the base /horoscope/{sign}; the Vedic path supports /{period} segments.
    const path = (period === 'daily' || system === 'western')
      ? `${basePath}/horoscope/${sign}`
      : `${basePath}/horoscope/${sign}/${period}`;
    const response = await this.client.get(path);
    return response.data;
  }

  // ═══════════════════════════════════════════
  // Western Astrology
  // ═══════════════════════════════════════════

  /** Get Western transit chart and aspects */
  async getWesternTransits(
    birthDetails: V2Query,
    transitDateTime?: string
  ): Promise<Record<string, any>> {
    const response = await this.client.post('/v2/western/transit-chart', {
      ...birthDetails,
      transitDateTime,
    });
    return response.data;
  }

  /** Get Western secondary progressions */
  async getWesternProgressions(
    birthDetails: V2Query,
    progressionDate?: string
  ): Promise<Record<string, any>> {
    const response = await this.client.post('/v2/western/progressions', {
      ...birthDetails,
      progressionDate,
    });
    return response.data;
  }

  /** Get Western solar return chart */
  async getWesternSolarReturn(
    birthDetails: V2Query,
    year?: number
  ): Promise<Record<string, any>> {
    const response = await this.client.post('/v2/western/solar-return', {
      ...birthDetails,
      year,
    });
    return response.data;
  }

  /**
   * Get Western relationship analysis (synastry/composite).
   *
   * TS→Rust transition note (3.0.6): the result is normalized so the
   * transition-divergent prose fields (`interpretation`, per-aspect
   * `orbQuality`/`signifies`) are always at least present — the Rust engine may
   * omit them while the computed geometry stays parity-exact. Every prose field
   * on `WesternRelationshipResult` is optional, so consumers never crash on a
   * missing block from either engine. The full raw payload is preserved via the
   * index signature.
   */
  async getWesternRelationship(
    type: WesternRelationshipType | string,
    person1: V2Query,
    person2: V2Query
  ): Promise<WesternRelationshipResult> {
    const response = await this.client.post(`/v2/western/${type}`, { person1, person2 });
    return normalizeWesternRelationship(response.data as Record<string, any>);
  }

  // ═══════════════════════════════════════════
  // Extended Domains
  // ═══════════════════════════════════════════

  /** Tarot domain methods */
  public tarot = {
    /** Get a single card of the day */
    cardOfTheDay: async (): Promise<TarotCard> => {
      const response = await this.client.get<TarotCard>('/v2/tarot/card-of-the-day');
      return response.data;
    },

    /** Draw a tarot spread (spread id is a path segment: love, career, celtic-cross, …) */
    draw: async (spread: string, question?: string): Promise<TarotReading> => {
      const response = await this.client.post<TarotReading>(
        `/v2/tarot/draw/${encodeURIComponent(spread)}`,
        { ...(question && { question }) },
      );
      const _body = response.data as any;
        return (_body && _body.data !== undefined ? _body.data : _body);
    },

    /** List available tarot spreads */
    spreads: async (): Promise<SpreadList> => {
      const response = await this.client.get<SpreadList>('/v2/tarot/spreads');
      return response.data;
    },
  };

  /** Chinese astrology domain methods */
  public chinese = {
    /** Get Chinese zodiac animal for a year */
    zodiacAnimal: async (year: number): Promise<ChineseZodiac> => {
      const response = await this.client.post<ChineseZodiac>('/v2/chinese/zodiac-animal', { year });
      return response.data;
    },

    /** Get BaZi (Four Pillars of Destiny) chart */
    bazi: async (birthDetails: V2Query): Promise<BaZiChart> => {
      const response = await this.client.post<BaZiChart>('/v2/chinese/bazi/chart', birthDetails);
      const _body = response.data as any;
        return (_body && _body.data !== undefined ? _body.data : _body);
    },

    /** Feng Shui sub-domain */
    fengShui: {
      /** Calculate personal Kua number */
      kuaNumber: async (birthYear: number, gender: string): Promise<KuaResult> => {
        const response = await this.client.post<KuaResult>('/v2/chinese/feng-shui/kua-number', {
          birthYear,
          gender,
        });
        const _body = response.data as any;
        return (_body && _body.data !== undefined ? _body.data : _body);
      },
    },
  };

  /** I Ching domain methods */
  public iching = {
    /** Cast an I Ching hexagram */
    cast: async (question?: string): Promise<Hexagram> => {
      const response = await this.client.post<Hexagram>('/v2/iching/cast', {
        ...(question && { question }),
      });
      return response.data;
    },

    /** Get daily I Ching hexagram */
    daily: async (): Promise<Hexagram> => {
      const response = await this.client.get<Hexagram>('/v2/iching/daily');
      return response.data;
    },
  };

  /** Crystal recommendations domain */
  public crystals = {
    /** Get crystals recommended for a zodiac sign */
    byZodiac: async (sign: string): Promise<Crystal[]> => {
      const response = await this.client.get<Crystal[]>(`/v2/crystals/by-zodiac/${encodeURIComponent(sign)}`);
      return response.data;
    },

    /** Get full crystal catalog */
    catalog: async (): Promise<Crystal[]> => {
      const response = await this.client.get<Crystal[]>('/v2/crystals/catalog');
      return response.data;
    },
  };

  /** Human Design domain methods */
  public humanDesign = {
    /** Get full Human Design body graph chart */
    chart: async (birthDetails: V2Query): Promise<BodyGraph> => {
      const response = await this.client.post<BodyGraph>('/v2/human-design/chart', birthDetails);
      return response.data;
    },

    /** Get Human Design type summary */
    type: async (birthDetails: V2Query): Promise<HDType> => {
      const response = await this.client.post<HDType>('/v2/human-design/type', birthDetails);
      return response.data;
    },
  };

  /** Matrimony / advanced matching domain */
  public matrimony = {
    /** Unified match analysis (Vedic + KP combined) */
    unifiedMatch: async (person1: V2Query, person2: V2Query): Promise<MatchResult> => {
      const response = await this.client.post<MatchResult>('/v2/matrimony/unified-match', {
        person1,
        person2,
      });
      return response.data;
    },

    /** Check dosha cancellation between two charts */
    doshaCancellation: async (person1: V2Query, person2: V2Query): Promise<DoshaResult> => {
      const response = await this.client.post<DoshaResult>('/v2/matrimony/dosha-cancellation', {
        person1,
        person2,
      });
      return response.data;
    },
  };

  /** Spiritual guidance domain */
  public spiritual = {
    /** Get personalized mantra recommendation */
    mantra: async (birthDetails: V2Query): Promise<MantraResult> => {
      const response = await this.client.post<MantraResult>('/v2/spiritual/mantra', birthDetails);
      return response.data;
    },

    /** Get recommended deity for worship */
    deity: async (birthDetails: V2Query): Promise<DeityResult> => {
      const response = await this.client.post<DeityResult>('/v2/spiritual/deity', birthDetails);
      return response.data;
    },

    /** Get past life karmic indicators */
    pastLife: async (birthDetails: V2Query): Promise<PastLifeResult> => {
      const response = await this.client.post<PastLifeResult>('/v2/spiritual/past-life', birthDetails);
      return response.data;
    },
  };

  /** Daily insights domain */
  public daily = {
    /** Get comprehensive daily bundle (horoscope + panchang + tarot + mantra) */
    bundle: async (): Promise<DailyBundle> => {
      const response = await this.client.get<DailyBundle>('/v2/daily/bundle');
      return response.data;
    },

    /** Get daily horoscope for a zodiac sign */
    horoscope: async (sign: string): Promise<Record<string, any>> => {
      const response = await this.client.get(`/v2/astrology/horoscope/${sign}`);
      return response.data;
    },
  };

  /** Extended dasha systems */
  public dasha = {
    /** Get Ashtottari Dasha periods (108-year cycle) */
    ashtottari: async (birthDetails: V2Query): Promise<Record<string, any>> => {
      const response = await this.client.post('/v2/astrology/ashtottari-dasha', birthDetails);
      return response.data;
    },

    /** Get Chara (Jaimini) Dasha periods */
    chara: async (birthDetails: V2Query): Promise<Record<string, any>> => {
      const response = await this.client.post('/v2/astrology/chara-dasha', birthDetails);
      return response.data;
    },

    /** Get current periods from ALL dasha systems at once */
    currentAll: async (birthDetails: V2Query): Promise<AllDashaResult> => {
      const response = await this.client.post<AllDashaResult>('/v2/astrology/dasha/current-all', birthDetails);
      return response.data;
    },
  };

  /** Health astrology domain */
  public health = {
    /** Get health analysis from birth chart */
    analysis: async (birthDetails: V2Query): Promise<HealthResult> => {
      const response = await this.client.post<HealthResult>('/v2/health/vulnerabilities', {
        dateOfBirth: birthDetails.datetime.slice(0, 10),
        timeOfBirth: birthDetails.datetime.slice(11, 16),
        latitude: birthDetails.latitude,
        longitude: birthDetails.longitude,
        timezone: birthDetails.timezone || offsetFromDatetime(birthDetails.datetime),
      });
      const _body = response.data as any;
        return (_body && _body.data !== undefined ? _body.data : _body);
    },
  };

  /** Career astrology domain */
  public career = {
    /** Get career analysis from birth chart */
    analysis: async (birthDetails: V2Query): Promise<CareerResult> => {
      const response = await this.client.post<CareerResult>('/v2/career/suitable', {
        dateOfBirth: birthDetails.datetime.slice(0, 10),
        timeOfBirth: birthDetails.datetime.slice(11, 16),
        latitude: birthDetails.latitude,
        longitude: birthDetails.longitude,
        timezone: birthDetails.timezone || offsetFromDatetime(birthDetails.datetime),
      });
      const _body = response.data as any;
        return (_body && _body.data !== undefined ? _body.data : _body);
    },
  };

  // ═══════════════════════════════════════════
  // Convenience Methods (Common Use Cases)
  // ═══════════════════════════════════════════

  /** Get today's panchang (no parameters needed) */
  async getPanchangToday(): Promise<Record<string, any>> {
    const response = await this.client.get('/v2/astrology/panchang/today');
    return response.data;
  }

  /** Get Sade Sati status for a birth chart */
  async getSadeSati(birthDetails: V2Query): Promise<Record<string, any>> {
    return this.getDoshasV2('sade-sati', birthDetails);
  }

  /** Get Chandrashtama (Moon transit) periods */
  async getChandrashtama(birthDetails: V2Query): Promise<Record<string, any>> {
    const response = await this.client.post('/v2/astrology/chandrashtama', birthDetails);
    return response.data;
  }

  /** Get Kundli (complete birth chart with all details) */
  async getKundli(birthDetails: V2Query): Promise<Record<string, any>> {
    return this.getBirthChartV2('kundli', birthDetails);
  }

  /** Get Navamsa (D9) chart */
  async getNavamsa(birthDetails: V2Query): Promise<Record<string, any>> {
    return this.getDivisionalChart('navamsa', birthDetails);
  }

  /** Get Guna Milan (36-point matching) */
  async getGunaMilan(male: V2Query, female: V2Query): Promise<Record<string, any>> {
    return this.getCompatibilityV2('guna-milan', male, female);
  }

  /** Get Vimshottari Dasha timeline */
  async getVimshottariDasha(birthDetails: V2Query): Promise<Record<string, any>> {
    return this.getDashaV2('vimshottari-dasha', birthDetails);
  }

  /** Get daily prediction for a zodiac sign */
  async getDailyPrediction(rashi: string): Promise<Record<string, any>> {
    return this.getPrediction('daily', { rashi });
  }

  /** Get Shadbala (6-fold planetary strength) */
  async getShadbala(birthDetails: V2Query): Promise<Record<string, any>> {
    return this.getStrength('shadbala', birthDetails);
  }

  // ═══════════════════════════════════════════
  // Utility
  // ═══════════════════════════════════════════

  /**
   * List recent active conversations, ordered by last activity.
   * The server defaults to 10 results; limit accepts 1..100.
   * Pass the returned nextCursor to continue, including after an empty page.
   * Stop at null; paginationAvailable=false means the serving backend cannot continue.
   * Activity can change between calls; the listing is not a snapshot.
   */
  async getConversations(limit?: number, cursor?: string): Promise<Record<string, any>> {
    if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 100)) {
      throw new RangeError('limit must be an integer between 1 and 100');
    }
    if (cursor !== undefined && (typeof cursor !== 'string' || !cursor.length || cursor.length > 2048)) {
      throw new TypeError('cursor must be a non-empty string of at most 2048 characters');
    }
    const params = { ...(limit === undefined ? {} : { limit }), ...(cursor === undefined ? {} : { cursor }) };
    const response = await this.client.get('/api/v1/conversations',
      Object.keys(params).length ? { params } : undefined);
    return response.data;
  }

  /** Delete a conversation */
  async deleteConversation(conversationId: string): Promise<void> {
    await this.client.delete(`/api/v1/conversations/${conversationId}`);
  }

  /** Get wallet usage and balance */
  async getUsage(): Promise<Record<string, any>> {
    const response = await this.client.get('/api/v1/usage/wallet');
    return response.data;
  }

  /**
   * Process multiple queries in batch for efficiency
   *
   * @param queries - Array of query items
   * @returns Promise resolving to array of responses
   *
   * @example
   * ```typescript
   * const queries = [
   *   { question: 'Career prospects?', birthDetails: birth1 },
   *   { question: 'Marriage timing?', birthDetails: birth2 }
   * ];
   *
   * const results = await client.batchProcess(queries);
   * ```
   */
  async batchProcess(queries: BatchQueryItem[]): Promise<QuestionResponse[]> {
    const promises = queries.map((query) =>
      this.askQuestion({
        question: query.question,
        birthDetails: query.birthDetails,
        language: query.language,
      })
    );

    return Promise.all(promises);
  }

  // ═══════════════════════════════════════════
  // Voice (audio-in → audio-out)
  // typed voice envelope
  // ═══════════════════════════════════════════

  /**
   * Send a voice query (multipart audio upload).
   *
   * Returns a unified `VoiceResult` that branches on the server response:
   *
   * - **binary mode** (`kind: 'binary'`): TTS succeeded, `audio` holds the
   *   raw `audio/mpeg` bytes and `meta` holds the parsed
   *   `X-Vedika-Voice-Meta` header.
   * - **json mode** (`kind: 'json'`): TTS fallback, `json.audio` is null
   *   and `json.response` holds the text answer.
   *
   * @example
   * ```typescript
   * const audioFile = new Blob([buffer], { type: 'audio/wav' });
   * const result = await client.askVoice({
   *   audio: audioFile,
   *   tier: 'vedika-voice-standard',
   *   birthDetails: { ... },
   * });
   * if (result.kind === 'binary') {
   *   playAudio(result.audio!);
   *   console.log('Language:', result.meta?.language);
   * } else {
   *   console.log('Text fallback:', result.json!.response);
   * }
   * ```
   */
  async askVoice(query: VoiceQuery): Promise<VoiceResult> {
    // FormData is available in both browser and Node 18+ (undici).
    const form = new FormData();

    // Normalize audio input to Blob for FormData compatibility.
    const audioBlob = query.audio instanceof Blob
      ? query.audio
      : new Blob([query.audio as any]);
    form.append('audio', audioBlob as any, 'audio');

    if (query.tier) form.append('tier', query.tier);
    if (query.birthDetails) form.append('birthDetails', JSON.stringify(query.birthDetails));
    if (query.partnerBirthDetails) form.append('partnerBirthDetails', JSON.stringify(query.partnerBirthDetails));
    if (query.language) form.append('language', query.language);
    if (query.includeDailyContext !== undefined) form.append('includeDailyContext', String(query.includeDailyContext));
    if (query.allow_general !== undefined) form.append('allow_general', String(query.allow_general));
    if (query.conversationId) form.append('conversationId', query.conversationId);

    const response = await this.client.post('/api/v1/voice', form, {
      responseType: 'arraybuffer',
      // Let axios/browser set the multipart boundary; drop the JSON default.
      headers: { 'Content-Type': undefined as any },
      // Accept both audio/mpeg (binary) and application/json (TTS fallback)
      // so we can branch on the response content-type.
      validateStatus: (s) => s >= 200 && s < 300,
    });

    const contentType = (response.headers['content-type'] || '') as string;

    if (contentType.includes('application/json')) {
      // TTS fallback path — decode JSON body.
      const buf = response.data as ArrayBuffer;
      const text = new TextDecoder().decode(new Uint8Array(buf));
      const json = JSON.parse(text) as VoiceResponse;
      return { kind: 'json', json, contentType };
    }

    // Binary audio/mpeg path — parse metadata header.
    const metaHeader = response.headers['x-vedika-voice-meta'] as string | undefined;
    let meta: VoiceMetaHeader | undefined;
    if (metaHeader) {
      try {
        // atob is browser-only; Buffer.from is Node. Detect and fall back.
        const decoded = typeof atob === 'function'
          ? atob(metaHeader)
          : Buffer.from(metaHeader, 'base64').toString('utf-8');
        meta = JSON.parse(decoded) as VoiceMetaHeader;
      } catch {
        meta = undefined;
      }
    }

    return {
      kind: 'binary',
      audio: response.data as ArrayBuffer,
      contentType,
      meta,
    };
  }

  /**
   * Get voice pricing tiers, rate limits, and language support.
   * Gated to Business + Enterprise plans (returns 403 VOICE_PLAN_REQUIRED otherwise).
   */
  async getVoicePricing(): Promise<Record<string, any>> {
    const response = await this.client.get('/api/v1/voice/pricing');
    return response.data;
  }
}
