/**
 * Vedika API Type Definitions
 * TypeScript type definitions for the Vedika Astrology API.
 */

/**
 * Birth details for astrological calculations
 */
export interface BirthDetails {
  /** Birth datetime in ISO 8601 format (e.g., "1990-06-15T14:30:00+05:30") */
  datetime: string;
  /** Birth location latitude (-90 to 90) */
  latitude: number;
  /** Birth location longitude (-180 to 180) */
  longitude: number;
  /** UTC offset timezone (e.g., "+05:30", "-04:00"). Must be UTC offset format, NOT IANA names. */
  timezone?: string;
}

/**
 * A single citation referencing a classical source in the AI response.
 *
 * Added to model forthcoming public-surface
 * citation field. Currently only surfaced on enterprise responses; all
 * fields are optional on free/standard tiers.
 */
export interface Citation {
  /** Short ID of the cited passage */
  id?: string;
  /** Classical topic/rule reference (e.g. "Marriage — 7th house lord") */
  topic?: string;
  /** Source text (e.g. "BPHS", "Saravali", "Phaladeepika") */
  source?: string;
  /** Chapter and verse reference (e.g. "BPHS 7.1-7.5") */
  reference?: string;
  /** The cited passage text, if provided */
  text?: string;
}

/**
 * Response from AI chatbot query (UNIQUE to Vedika!)
 */
export interface QuestionResponse {
  /** Detailed astrological answer */
  answer: string;
  /** Prediction confidence score (0.0 to 1.0) */
  confidence: number;
  /** Credits consumed for this query */
  creditsUsed: number;
  /** Time taken to process (seconds) */
  processingTime: number;
  /** Response language */
  language: string;
  /** Astrological factors considered */
  sources?: string[];
  /**
   * Citations to classical sources used by the response. Optional — only
   * returned when the server-side citation-gate is enabled. Empty or
   * missing on non-enterprise tiers.
   */
  citations?: Citation[];
  /** Structured response (present only when responseFormat='json') */
  structuredResponse?: StructuredResponse;
  /** Present when the question was answered from a Vastu report. */
  vastuContext?: VastuReportContext;
}

/**
 * Ask about a Vastu report you already hold. Pass the body returned by
 * plan/analyze, plan/report, plan/generate, audit or score endpoints (up to
 * 64 KB; drop `svg`). Birth details are not needed.
 */
export interface VastuReportQuestion {
  question: string;
  /** The Vastu response to discuss. Omit on a follow-up that passes `conversationId`. */
  report?: Record<string, unknown>;
  /** Continue a conversation; its saved report is reused when `report` is omitted. */
  conversationId?: string;
  language?: string;
  speed?: 'standard' | 'fast' | 'eco';
}

/** How the server used the report. The report is caller-supplied and never verified. */
export interface VastuReportContext {
  digestSha256: string;
  reportKind: string;
  /** Row ids the answer may cite, such as `D1` or `R2`. */
  itemIds: string[];
  itemsUsed: number;
  itemsTotal: number;
  /** True when lower-severity rows were left out to fit the size limit. */
  truncated: boolean;
  /** Row ids the answer cites; citations of unknown rows are removed. */
  citedItems: string[];
  reusedFromConversation: boolean;
  verified: false;
}

/**
 * Voice response envelope (JSON fallback).
 *
 * Types the JSON body returned by
 * `/api/v1/voice` when TTS fails (binary audio unavailable).
 * The primary voice response is binary `audio/mpeg` with metadata in the
 * `X-Vedika-Voice-Meta` base64-JSON header — see `VoiceMetaHeader`.
 */
export interface VoiceResponse {
  success: boolean;
  /** Base64 audio, null when TTS failed and text fallback is used */
  audio: string | null;
  /** AI-generated text answer */
  response: string;
  /** Detected/output language (ISO 639-1 code) */
  language?: string;
  /** Voice tier served (public label) */
  tier?: string;
  /** Billing block (customer-facing only) */
  billing?: {
    costUsd: number;
    currency: 'USD';
  };
  /** End-to-end processing duration in ms */
  durationMs?: number;
  /** Speech-to-text processing duration in seconds */
  sttDurationSec?: number;
  /** Text-to-speech synthesis duration in seconds (null when TTS failed) */
  ttsDurationSec?: number | null;
  /** Conversation ID for multi-turn voice threading */
  conversationId?: string;
}

/**
 * Metadata carried in the `X-Vedika-Voice-Meta` header (base64-decoded JSON)
 * for binary audio/mpeg voice responses. Parallel to VoiceResponse — same
 * fields, minus audio/response body since those are the binary payload.
 *
 */
export interface VoiceMetaHeader {
  language?: string;
  tier?: string;
  billing?: {
    costUsd: number;
    currency: 'USD';
  };
  durationMs?: number;
  sttDurationSec?: number;
  ttsDurationSec?: number | null;
  conversationId?: string;
}

/**
 * Unified voice result returned by the SDK. Either binary audio with
 * parsed metadata, or JSON fallback with inline text.
 *
 */
export interface VoiceResult {
  /** 'binary' = audio/mpeg body, 'json' = TTS-failed fallback */
  kind: 'binary' | 'json';
  /** Raw audio bytes (binary mode) */
  audio?: ArrayBuffer;
  /** Content-Type (e.g. 'audio/mpeg') */
  contentType?: string;
  /** Parsed header metadata (binary mode) */
  meta?: VoiceMetaHeader;
  /** JSON response body (fallback mode) */
  json?: VoiceResponse;
}

/**
 * Voice query parameters (multipart upload).
 */
export interface VoiceQuery {
  /** Audio file — supported: wav, mp3, mp4, m4a, webm, ogg (max 20 MB) */
  audio: Blob | Buffer | ArrayBuffer;
  /** Voice tier identifier from the current API catalog. */
  tier?: string;
  /** Birth details for chart-bound questions */
  birthDetails?: BirthDetails;
  /** Partner birth details for synastry/compat voice queries */
  partnerBirthDetails?: BirthDetails;
  /** ISO 639-1 language hint (auto-detected when omitted) */
  language?: string;
  /** Inject today's panchang into the prompt */
  includeDailyContext?: boolean;
  /** Bypass chart-bound question gate for theory Q's */
  allow_general?: boolean;
  /** Existing conversation to continue */
  conversationId?: string;
}

/**
 * Planet position in birth chart
 */
export interface Planet {
  name: string;
  longitude: number;
  latitude: number;
  sign: string;
  house: number;
  nakshatra: string;
  retrograde?: boolean;
}

/**
 * House cusp in birth chart
 */
export interface House {
  number: number;
  sign: string;
  degree: number;
  lord: string;
}

/**
 * Complete birth chart (Kundali/Horoscope)
 */
export interface BirthChart {
  /** Rising sign */
  ascendant: string;
  /** Planetary positions */
  planets: Planet[];
  /** House cusps */
  houses: House[];
  /** Ayanamsa system used */
  ayanamsa: string;
}

/**
 * Dasha (planetary period) information
 */
export interface Dasha {
  planet: string;
  startDate: string;
  endDate: string;
  durationYears: number;
  level: 'Mahadasha' | 'Antardasha' | 'Pratyantardasha';
}

/**
 * Vimshottari Dasha periods
 */
export interface DashaResponse {
  /** Major planetary periods (120 years) */
  mahadashas: Dasha[];
  /** Sub-periods within current Mahadasha */
  antardashas?: Dasha[];
  /** Sub-sub-periods within current Antardasha */
  pratyantardashas?: Dasha[];
  /** Currently active Mahadasha */
  currentDasha?: string;
}

/**
 * Marriage compatibility analysis (Ashtakoota)
 */
export interface CompatibilityResponse {
  /** Total compatibility score (0-36) */
  totalScore: number;
  /** Overall compatibility (Excellent/Good/Average/Poor) */
  compatibilityLevel: string;
  /** Varna koota score (1) */
  varna: number;
  /** Vashya koota score (2) */
  vashya: number;
  /** Tara koota score (3) */
  tara: number;
  /** Yoni koota score (4) */
  yoni: number;
  /** Graha Maitri koota score (5) */
  grahaMaitri: number;
  /** Gana koota score (6) */
  gana: number;
  /** Bhakoot koota score (7) */
  bhakoot: number;
  /** Nadi koota score (8) */
  nadi: number;
  /** Mangal dosha compatibility */
  mangalDoshaCheck?: string;
}

/**
 * Astrological Yoga (planetary combination)
 */
export interface Yoga {
  name: string;
  description: string;
  strength: 'Strong' | 'Moderate' | 'Weak';
  effects?: string[];
}

/**
 * Yoga detection results (300+ yogas)
 */
export interface YogaResponse {
  /** List of detected yogas */
  yogas: Yoga[];
  /** Total number of yogas found */
  totalCount: number;
  /** Number of beneficial yogas */
  beneficialCount: number;
  /** Number of malefic yogas */
  maleficCount: number;
}

/**
 * Information about a specific dosha
 */
export interface DoshaInfo {
  present: boolean;
  type?: string;
  severity?: 'High' | 'Medium' | 'Low';
  description?: string;
  remedies?: string[];
}

/**
 * Comprehensive dosha analysis
 */
export interface DoshaResponse {
  /** Kaal Sarp Dosha details */
  kaalSarpDosha: DoshaInfo;
  /** Mangal/Kuja Dosha details */
  mangalDosha: DoshaInfo;
  /** Sade Sati period details */
  sadeSati: DoshaInfo;
  /** Pitra Dosha details */
  pitraDosha: DoshaInfo;
}

/**
 * Auspicious or inauspicious time window
 */
export interface TimeWindow {
  startTime: string;
  endTime: string;
  quality: 'Excellent' | 'Good' | 'Average' | 'Avoid';
  reason?: string;
}

/**
 * Muhurtha (auspicious timing) analysis
 */
export interface MuhurthaResponse {
  /** Date analyzed */
  date: string;
  /** Auspicious time windows */
  goodTimes: TimeWindow[];
  /** Inauspicious time windows */
  badTimes: TimeWindow[];
  /** Most auspicious time */
  bestTime?: string;
  /** Type of event */
  eventType: string;
}

/**
 * Numerology analysis (37 calculations)
 */
export interface NumerologyResponse {
  /** Life path number (1-9, 11, 22, 33) */
  lifePath: number;
  /** Expression/Destiny number */
  expression: number;
  /** Soul urge/Heart's desire number */
  soulUrge: number;
  /** Personality number */
  personality: number;
  /** Birth day number */
  birthDay: number;
  /** Maturity number */
  maturity: number;
  /** Lucky numbers */
  luckyNumbers?: number[];
  /** Lucky colors */
  luckyColors?: string[];
  /** Lucky days of the week */
  luckyDays?: string[];
}

/**
 * Client configuration options
 */
export interface VedikaClientOptions {
  /** Your Vedika API key */
  apiKey: string;
  /**
   * API base URL (default: `https://api.vedika.io`).
   *
   * Must be a Vedika origin (`vedika.io` or a `*.vedika.io` subdomain) over
   * HTTPS, or loopback for local development. Any other origin throws: the
   * client would otherwise send your API key there. To route calls through
   * your own gateway, proxy them server-side and keep the key on the server.
   */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 60000) */
  timeout?: number;
  /** Maximum number of retries for failed requests (default: 3) */
  maxRetries?: number;
  /** Enable prompt caching for cost savings (default: true) */
  cacheEnabled?: boolean;
  /** Default language for responses (default: "en") */
  language?: string;
  /** @deprecated Retained for source compatibility; cannot enable remote HTTP. */
  allowInsecureHttp?: boolean;
}

/**
 * Question query parameters
 */
export interface QuestionQuery {
  /** Your astrology question in natural language */
  question: string;
  /** Birth information */
  birthDetails: BirthDetails;
  /** Response language (optional) */
  language?: string;
}

/**
 * Birth chart query parameters
 */
export interface BirthChartQuery {
  /** Birth datetime in ISO 8601 format */
  datetime: string;
  /** Birth location latitude */
  latitude: number;
  /** Birth location longitude */
  longitude: number;
  /** Timezone (default: "UTC") */
  timezone?: string;
  /** Ayanamsa system (default: "lahiri") */
  ayanamsa?: string;
}

/**
 * Compatibility query parameters
 */
export interface CompatibilityQuery {
  /** First person's birth details */
  person1: BirthDetails;
  /** Second person's birth details */
  person2: BirthDetails;
}

/**
 * Muhurtha query parameters
 */
export interface MuhurthaQuery {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Location coordinates */
  location: {
    latitude: number;
    longitude: number;
  };
  /** Type of event (wedding, business, etc.) */
  eventType: string;
}

/**
 * Numerology query parameters
 */
export interface NumerologyQuery {
  /** Full name */
  name: string;
  /** Birth date in YYYY-MM-DD format */
  birthDate: string;
}

/**
 * Batch query item
 */
export interface BatchQueryItem {
  question: string;
  birthDetails: BirthDetails;
  language?: string;
}

/** V2 computation query (generic for all V2 endpoints) */
export interface V2Query {
  datetime: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  ayanamsa?: string;
}

/** Prediction query */
export interface PredictionQuery {
  /** Zodiac sign */
  rashi?: string;
  /** Or derive from birth details */
  birthDetails?: BirthDetails;
}

/** Horoscope query options */
export interface HoroscopeQuery {
  /** daily, weekly, or monthly */
  period?: string;
  /** vedic or western */
  system?: string;
}

// ═══════════════════════════════════════════
// V2 Type-Safe String Unions
// ═══════════════════════════════════════════

/** Valid chart types for getBirthChartV2() */
export type ChartType = 'kundli' | 'birth-chart' | 'planet-positions' | 'house-cusps' | 'ascendant';

/** Valid dasha systems for getDashaV2() */
export type DashaSystem = 'vimshottari-dasha' | 'mahadasha' | 'antardasha' | 'pratyantardasha' | 'yogini-dasha' | 'ashtottari-dasha' | 'chara-dasha';

/** Valid dosha types for getDoshasV2() */
export type DoshaType = 'mangal-dosha' | 'kaal-sarp-dosha' | 'sade-sati' | 'pitru-dosha' | 'nadi-dosha' | 'all-doshas';

/** Valid matching types for getCompatibilityV2() */
export type MatchingType = 'guna-milan' | 'kundali-matching' | 'kundli-matching' | 'ashtakoot-match' | 'nakshatra-porutham';

/** Valid muhurta types for getMuhurtaV2() */
export type MuhurtaType = 'choghadiya' | 'hora' | 'rahu-kaal' | 'abhijit-muhurta' | 'brahma-muhurta' | 'durmuhurta' | 'gulika-kaal' | 'yamaghanta';

/** Valid divisional chart types for getDivisionalChart() */
export type DivisionalChartType = 'navamsa' | 'dashamsa' | 'saptamsa' | 'dwadashamsa' | 'shashtiamsa' | 'drekkana' | 'chaturthamsa' | 'shodasamsa' | 'vimsamsa' | 'chaturvimsamsa' | 'bhamsa' | 'trimsamsa' | 'khavedamsa' | 'akshavedamsa' | 'hora';

/** Valid prediction periods for getPrediction() */
export type PredictionPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

/** Valid strength types for getStrength() */
export type StrengthType = 'shadbala' | 'chandra-bala' | 'tara-bala';

/** Valid numerology types for getNumerologyV2() */
export type NumerologyType = 'complete' | 'life-path' | 'destiny' | 'personality' | 'soul-urge' | 'personal-year' | 'compatibility';

/** Valid Western relationship types for getWesternRelationship() */
export type WesternRelationshipType = 'synastry' | 'synastry-aspects' | 'composite' | 'composite-aspects';

// ═══════════════════════════════════════════
// Vastu (generated from the 82-route served OpenAPI contract)
// ═══════════════════════════════════════════
export type VastuJsonValue = string | number | boolean | null | VastuJsonValue[] | { [key: string]: VastuJsonValue };
export const VASTU_OPERATIONS = [
  "scans/timelapse",
  "scans/delete",
  "scans/list",
  "scans/retrieve",
  "scans/save",
  "ar/deity-icons",
  "ar/room-capture",
  "ar/yantra-meshes",
  "ar/zone-textures",
  "ar/anchor-recommendations",
  "ar/heatmap-raster",
  "ar/scan-quality",
  "ar/true-north-calibrate",
  "assessments",
  "assessments/batch",
  "audit/floor-plan",
  "audit/floor-plan-detailed",
  "audit/single-room",
  "compare/before-after-remedy",
  "compound/wall-analysis",
  "direction/auspicious-facing",
  "direction/correct",
  "direction/declination",
  "direction/sun-path",
  "direction/zone-from-bearing",
  "elements/balance-suggest",
  "elements/distribution",
  "entrance/obstruction-check",
  "entrance/pada",
  "entrance/recommend",
  "floor/level-analysis",
  "fusion/chart",
  "mandala/project/81-pada",
  "mandala/project/9-zone",
  "mandala/project/brahmasthan",
  "multi-storey/floor-rules",
  "placement/balcony",
  "placement/borewell",
  "placement/garden",
  "placement/generator-electrical",
  "placement/main-gate",
  "placement/overhead-tank",
  "placement/septic-tank",
  "placement/tree",
  "placement/well",
  "placement/window",
  "plan/analyze",
  "plan/from-requirements",
  "plan/generate",
  "plan/optimize",
  "plan/report",
  "plan/upload",
  "plot/extensions-cuts",
  "plot/orientation",
  "plot/ratio",
  "plot/road-orientation",
  "plot/shape",
  "plot/slope",
  "reference/colors-by-zone",
  "reference/defects/catalog",
  "reference/directions/16",
  "reference/directions/32",
  "reference/directions/8",
  "reference/gate-obstructions",
  "reference/mandala/45-devatas",
  "reference/mandala/64-pada",
  "reference/mandala/9-zone",
  "reference/materials-by-zone",
  "reference/remedies/catalog",
  "room/bedroom",
  "room/dining",
  "room/kitchen",
  "room/living",
  "room/pooja",
  "room/staircase",
  "room/store",
  "room/study",
  "room/toilet",
  "room/water-storage",
  "score/compliance-index",
  "score/overall",
  "score/zone-wise",
  "specialized/commercial",
  "specialized/educational",
  "specialized/factory",
  "specialized/hospital",
  "specialized/residential",
  "specialized/restaurant",
  "specialized/temple",
  "timing/bhumi-pujan",
  "timing/construction-start",
  "timing/grihapravesh",
  "timing/vastu-shanti",
] as const;
export type VastuOperation = (typeof VASTU_OPERATIONS)[number];
export interface VastuApiKeyAuth { apiKey: string }
/** Concrete operation envelopes retain required fields; legacy envelope types stay optional. */
export interface VastuResponseBilling extends VastuBilling { charged: number; currency: string; balanceAfter: number; endpoint: string; category: string }
export interface VastuResponseMeta extends VastuMeta { source?: string; engine: string; version: string }
export interface VastuErrorResponse { success?: false; error?: string; message?: string; code: string; status?: string }
export interface VastuResponse<Data> { success: true; data: Data; billing: VastuResponseBilling; meta: VastuResponseMeta }
/** Assessment can return valid insufficient-data results without billing. */
export interface VastuResponseWithOptionalBilling<Data> { success: true; data: Data; billing?: VastuResponseBilling; meta: VastuResponseMeta }
export interface VastuArHeatmapRasterRequestRoomsItem {
  roomType: string;
  zone: string;
}
export interface VastuArHeatmapRasterRequest {
  rooms: Array<VastuArHeatmapRasterRequestRoomsItem>;
  plotPolygon?: Array<Array<number>>;
  bearingDeg?: number;
}
export interface VastuArPlanToWorld {
  units: "metres";
  origin: Array<number>;
  xAxis: Array<number>;
  yAxis: Array<number>;
}
export interface VastuArAnchorRecommendationsRequest {
  plotPolygon: Array<Array<number>>;
  bearingDeg: number;
  planToWorld: VastuArPlanToWorld;
}
export interface VastuArZoneTexturesRequest {
  zone?: "NW" | "N" | "NE" | "W" | "CENTER" | "E" | "SW" | "S" | "SE";
}
export interface VastuArYantraMeshesRequest {
  model: "nine-zone-mandala";
  format?: "gltf" | "usdz";
}
export interface VastuArDeityIconsRequest {
  zone?: "NW" | "N" | "NE" | "W" | "CENTER" | "E" | "SW" | "S" | "SE";
}
export interface VastuRoomCaptureDevice {
  platform: "ios" | "android" | "web";
  method: "roomplan" | "arkit-raycast" | "arcore-hit" | "webxr-hit" | "manual-trace";
  depth: "lidar" | "arcore-depth" | "none";
}
export interface VastuRoomCaptureFrameNorth {
  referenceFrame: "true" | "manual" | "magnetic";
  headingSource: string;
  declinationDeg?: number | null;
  declinationProvenance: "live" | "manual" | "native" | "fixture" | "unset";
  yawSamples: number;
  yawSpreadDeg?: number | null;
  compassConfidence: number;
}
export interface VastuRoomCaptureFrame {
  units: "metres";
  axes: "+X east,+Y true north";
  north: VastuRoomCaptureFrameNorth;
  planToWorld?: VastuArPlanToWorld | null;
}
export interface VastuRoomCaptureOutline {
  polygon: Array<Array<number>>;
  source: "traced";
}
export interface VastuRoomCaptureRoomsItemOpeningsItem {
  kind: "door" | "window" | "opening";
  centerXY: Array<number>;
  widthM: number;
  heightM?: number | null;
  confidence: "low" | "medium" | "high";
}
export interface VastuRoomCaptureRoomsItem {
  id: string;
  label: string | null;
  labelSource: "user" | "roomplan-section" | "none";
  polygon: Array<Array<number>>;
  areaM2: number;
  heightM?: number | null;
  floorIndex: number;
  openings?: Array<VastuRoomCaptureRoomsItemOpeningsItem>;
}
export interface VastuRoomCaptureQuality {
  polygonClosure: boolean;
  closureGapM?: number | null;
  pointCloudDensity?: number | null;
  pointCloudDensityBasis: "feature-points" | "lidar-depth" | "none";
  coveragePercent?: number | null;
  scanDurationSec?: number | null;
  scannedAreaM2?: number | null;
  roomCount: number;
  expectedRoomCount?: number | null;
  roomsTagged: number;
  gpsConfidence?: number | null;
}
export interface VastuRoomCapture {
  schema: "vedika.roomCapture/1";
  captureId: string;
  capturedAtEpoch: number;
  device: VastuRoomCaptureDevice;
  frame: VastuRoomCaptureFrame;
  outline: VastuRoomCaptureOutline;
  rooms: Array<VastuRoomCaptureRoomsItem>;
  quality: VastuRoomCaptureQuality;
  attestation: "caller-reported";
}
export interface VastuArRoomCaptureRequest {
  capture: VastuRoomCapture;
  zoneResolution?: 8 | 16 | 32;
}
export interface VastuScanSnapshotRoomsItem {
  roomType: string;
  zone: string;
}
export interface VastuScanTelemetry {
  pointCloudDensity: number;
  polygonClosure: boolean;
  compassConfidence: number;
  gpsConfidence: number;
  roomsTagged: number;
  scanDurationSec: number;
  scannedAreaM2: number;
  roomCount?: number;
  expectedRoomCount?: number;
}
export interface VastuScanSnapshot {
  inputSource: "self-reported" | "plan-derived" | "device-reported";
  rooms?: Array<VastuScanSnapshotRoomsItem>;
  plotPolygon?: Array<Array<number>>;
  bearingDeg?: number;
  telemetry?: VastuScanTelemetry;
  capture?: VastuRoomCapture;
}
export interface VastuScansSaveRequest {
  scanId: string;
  propertyId: string;
  title: string;
  retentionDays: number;
  snapshot: VastuScanSnapshot;
}
export interface VastuScansRetrieveRequest {
  requestId: string;
  scanId: string;
}
export interface VastuScansListRequest {
  requestId: string;
  limit: number;
  cursor?: string | null;
}
export interface VastuScansDeleteRequest {
  scanId: string;
}
export interface VastuScansTimelapseRequest {
  requestId: string;
  scanIds: Array<string>;
}

export interface VastuArScanQualityRequest {
  "pointCloudDensity"?: number;
  "polygonClosure"?: boolean;
  "roomsTagged"?: number | boolean;
  "compassConfidence"?: number;
  "gpsConfidence"?: number;
  "scanDurationSec"?: number;
  "scannedAreaM2"?: number;
  "roomCount"?: number;
  "expectedRoomCount"?: number;
  "pointCloudDensityPerM2"?: number;
  "polygonClosed"?: boolean;
  "coveragePercent"?: number;
  "pointCloudDensityBasis"?: "feature-points" | "lidar-depth" | "none" | null;
}
export interface VastuArTrueNorthCalibrateRequest {
  "lat": number;
  "lon": number;
  "datetime": string;
  "deviceHeadingAtSunDeg": number;
  "deviceHeadingAccuracyDeg"?: number;
  "headingSampleAgeMs"?: number;
}
/** Retain this key when retrying a logical call after restarting the client. */
export interface VastuCallOptions {
  idempotencyKey?: string;
}

export interface VastuAssessmentsRequest {
  "inputSource": string;
  "rooms"?: Array<{ "roomType": string; "zone": string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
  "plotPolygon"?: Array<Array<number>>;
  "doorXY"?: Array<number>;
  "bearingDeg"?: number;
  "confidence"?: number;
  "pointCloudDensity"?: number;
  "polygonClosure"?: boolean;
  "roomsTagged"?: boolean;
  "compassConfidence"?: number;
  "gpsConfidence"?: number;
  "scanDurationSec"?: number;
  "scannedAreaM2"?: number;
}
/** One to twenty items. Item IDs must be unique; retain the caller key for retries. */
export interface VastuAssessmentsBatchRequest {
  items: Array<{ id: string; assessment: VastuAssessmentsRequest }>;
}

export interface VastuAuditFloorPlanDetailedRequest {
  "rooms": Array<{ "name": string; "roomType"?: string; "zone"?: string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
  "plotPolygon"?: Array<Array<number>>;
  "bearingDeg"?: number;
}
export interface VastuAuditFloorPlanRequest {
  "rooms"?: Array<{ "name": string; "roomType"?: string; "zone"?: string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
  "text"?: string;
}
export interface VastuAuditSingleRoomRequest {
  "roomType": string;
  "zone": string;
}
export interface VastuCompareBeforeAfterRemedyRequest {
  "rooms"?: Array<{ "name": string; "roomType"?: string; "zone"?: string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
  "text"?: string;
  "remedies": Array<{ "room"?: string; "name"?: string; "roomType"?: string; "toZone": string; "zone"?: string; }>;
}
export interface VastuCompoundWallAnalysisRequest {
  "walls"?: Array<Record<string, VastuJsonValue>> | Record<string, VastuJsonValue>;
}
export interface VastuDirectionAuspiciousFacingRequest {
  "purpose": string;
  "occupant"?: string;
}
export interface VastuDirectionCorrectRequest {
  "direction": string;
  "lat": number;
  "lon": number;
  "date"?: string;
}
export interface VastuDirectionDeclinationRequest {
  "lat": number;
  "lon": number;
  "date"?: string;
}
export interface VastuDirectionSunPathRequest {
  "lat": number;
  "lon": number;
  "date"?: string;
}
export interface VastuDirectionZoneFromBearingRequest {
  "bearingDeg": number;
}
export interface VastuElementsBalanceSuggestRequest {
  "distribution"?: Record<string, VastuJsonValue>;
  "deficient"?: Array<string>;
  "excess"?: Array<string>;
}
export interface VastuElementsDistributionRequest {
  "rooms": Array<{ "name": string; "roomType"?: string; "zone"?: string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
}
export interface VastuEntranceObstructionCheckRequest {
  "feature": string;
  "houseHeightMeters"?: number;
  "distanceMeters"?: number;
}
export interface VastuEntrancePadaRequest {
  "plotPolygon": Array<Array<number>>;
  "doorXY": Array<number>;
  "bearingDeg"?: number;
}
export interface VastuEntranceRecommendRequest {
  "facing": string;
}
export interface VastuFloorLevelAnalysisRequest {
  "levels"?: Array<Record<string, VastuJsonValue>> | Record<string, VastuJsonValue>;
}
export interface VastuFusionChartRequest {
  "datetime": string;
  "latitude": number;
  "longitude": number;
  "timezone"?: string;
  "facing"?: string;
}
export interface VastuMandalaProject81PadaRequest {
  "plotPolygon": Array<Array<number>>;
  "bearingDeg"?: number;
  "doorXY"?: Array<number>;
}
export interface VastuMandalaProject9ZoneRequest {
  "plotPolygon": Array<Array<number>>;
  "bearingDeg"?: number;
  "doorXY"?: Array<number>;
}
export interface VastuMandalaProjectBrahmasthanRequest {
  "plotPolygon": Array<Array<number>>;
  "bearingDeg"?: number;
  "doorXY"?: Array<number>;
}
export interface VastuMultiStoreyFloorRulesRequest {
  "floors": number;
}
export interface VastuPlacementBalconyRequest {
  "zone"?: string;
  "direction"?: string;
  "proposedZone"?: string;
  "proposedDirection"?: string;
  "placement"?: string;
  "latitude"?: number;
  "longitude"?: number;
}
export interface VastuPlacementBorewellRequest {
  "zone"?: string;
  "direction"?: string;
  "proposedZone"?: string;
  "proposedDirection"?: string;
  "placement"?: string;
  "latitude"?: number;
  "longitude"?: number;
}
export interface VastuPlacementGardenRequest {
  "zone"?: string;
  "direction"?: string;
  "proposedZone"?: string;
  "proposedDirection"?: string;
  "placement"?: string;
  "latitude"?: number;
  "longitude"?: number;
}
export interface VastuPlacementGeneratorElectricalRequest {
  "zone"?: string;
  "direction"?: string;
  "proposedZone"?: string;
  "proposedDirection"?: string;
  "placement"?: string;
  "latitude"?: number;
  "longitude"?: number;
}
export interface VastuPlacementMainGateRequest {
  "facing": string;
  "direction"?: string;
  "zone"?: string;
  "pada"?: number;
}
export interface VastuPlacementOverheadTankRequest {
  "zone"?: string;
  "direction"?: string;
  "proposedZone"?: string;
  "proposedDirection"?: string;
  "placement"?: string;
  "latitude"?: number;
  "longitude"?: number;
}
export interface VastuPlacementSepticTankRequest {
  "zone"?: string;
  "direction"?: string;
  "proposedZone"?: string;
  "proposedDirection"?: string;
  "placement"?: string;
  "latitude"?: number;
  "longitude"?: number;
}
export interface VastuPlacementTreeRequest {
  "zone"?: string;
  "direction"?: string;
  "proposedZone"?: string;
  "proposedDirection"?: string;
  "placement"?: string;
  "latitude"?: number;
  "longitude"?: number;
}
export interface VastuPlacementWellRequest {
  "zone"?: string;
  "direction"?: string;
  "proposedZone"?: string;
  "proposedDirection"?: string;
  "placement"?: string;
  "latitude"?: number;
  "longitude"?: number;
}
export interface VastuPlacementWindowRequest {
  "zone"?: string;
  "direction"?: string;
  "proposedZone"?: string;
  "proposedDirection"?: string;
  "placement"?: string;
  "latitude"?: number;
  "longitude"?: number;
}
export interface VastuPlanAnalyzeRequest {
  "rooms": Array<{ "name": string; "roomType"?: string; "zone"?: string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
  "plot"?: Record<string, VastuJsonValue>;
  "zoneResolution"?: 8 | 16 | 32;
}
export interface VastuPlanFromRequirementsRequest {
  "plot": { "width"?: number; "length"?: number; "facing"?: string; "polygon"?: Array<Array<number>>; "setbacks"?: { "front"?: number; "rear"?: number; "left"?: number; "right"?: number; }; };
  "entrance"?: Record<string, VastuJsonValue>;
  "rooms"?: Array<{ "name": string; "roomType"?: string; "zone"?: string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
  "requirements"?: Record<string, VastuJsonValue>;
  "parking"?: Record<string, VastuJsonValue>;
  "staircase"?: Record<string, VastuJsonValue>;
  "lift"?: Record<string, VastuJsonValue>;
  "variants"?: number;
  "variantSvg"?: boolean;
  "includeSvg"?: boolean;
}
export interface VastuPlanGenerateRequest {
  "plot": { "width"?: number; "length"?: number; "facing"?: string; "polygon"?: Array<Array<number>>; "setbacks"?: { "front"?: number; "rear"?: number; "left"?: number; "right"?: number; }; };
  "entrance"?: Record<string, VastuJsonValue>;
  "rooms"?: Array<{ "name": string; "roomType"?: string; "zone"?: string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
  "requirements"?: Record<string, VastuJsonValue>;
  "parking"?: Record<string, VastuJsonValue>;
  "staircase"?: Record<string, VastuJsonValue>;
  "lift"?: Record<string, VastuJsonValue>;
  "variants"?: number;
  "variantSvg"?: boolean;
  "includeSvg"?: boolean;
}
export interface VastuPlanOptimizeRequest {
  "rooms": Array<{ "name": string; "roomType"?: string; "zone"?: string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
  "plot"?: Record<string, VastuJsonValue>;
  "includeSvg"?: boolean;
}
export interface VastuPlanReportRequest {
  "rooms": Array<{ "name": string; "roomType"?: string; "zone"?: string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
  "plot"?: Record<string, VastuJsonValue>;
  "format"?: 'json' | 'html';
  "brand"?: { "reportTitle"?: string; "generatedFor"?: string; };
  "reportTitle"?: string;
  "generatedFor"?: string;
  "tenantName"?: string;
}
export interface VastuPlanUploadRequest {
  "rooms"?: Array<{ "name": string; "roomType"?: string; "zone"?: string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
  "layout"?: Record<string, VastuJsonValue>;
  "asciiGrid"?: string;
  "plot"?: Record<string, VastuJsonValue>;
}
export interface VastuPlotExtensionsCutsRequest {
  "plotPolygon"?: Array<Array<number>>;
  "length"?: number;
  "width"?: number;
}
export interface VastuPlotOrientationRequest {
  "facingBearingDeg"?: number;
  "bearingDeg"?: number;
}
export interface VastuPlotRatioRequest {
  "plotPolygon": Array<Array<number>>;
  "bearingDeg"?: number;
  "doorXY"?: Array<number>;
}
export interface VastuPlotRoadOrientationRequest {
  "roads"?: Array<string>;
  "roadSides"?: Array<string>;
  "veedhiShoola"?: string;
  "tPointFrom"?: string;
  "roadThrustFrom"?: string;
}
export interface VastuPlotShapeRequest {
  "plotPolygon": Array<Array<number>>;
  "bearingDeg"?: number;
  "doorXY"?: Array<number>;
}
export interface VastuPlotSlopeRequest {
  "slopeDirection"?: string;
  "lowSide"?: string;
  "lowCorner"?: string;
  "slopeBearingDeg"?: number;
}
export interface VastuRoomBedroomRequest {
  "zone"?: string;
  "direction"?: string;
  "proposedZone"?: string;
  "proposedDirection"?: string;
  "placement"?: string;
  "latitude"?: number;
  "longitude"?: number;
}
export interface VastuRoomDiningRequest {
  "zone"?: string;
  "direction"?: string;
  "proposedZone"?: string;
  "proposedDirection"?: string;
  "placement"?: string;
  "latitude"?: number;
  "longitude"?: number;
}
export interface VastuRoomKitchenRequest {
  "zone"?: string;
  "direction"?: string;
  "proposedZone"?: string;
  "proposedDirection"?: string;
  "placement"?: string;
  "latitude"?: number;
  "longitude"?: number;
}
export interface VastuRoomLivingRequest {
  "zone"?: string;
  "direction"?: string;
  "proposedZone"?: string;
  "proposedDirection"?: string;
  "placement"?: string;
  "latitude"?: number;
  "longitude"?: number;
}
export interface VastuRoomPoojaRequest {
  "zone"?: string;
  "direction"?: string;
  "proposedZone"?: string;
  "proposedDirection"?: string;
  "placement"?: string;
  "latitude"?: number;
  "longitude"?: number;
}
export interface VastuRoomStaircaseRequest {
  "zone"?: string;
  "direction"?: string;
  "proposedZone"?: string;
  "proposedDirection"?: string;
  "placement"?: string;
  "latitude"?: number;
  "longitude"?: number;
}
export interface VastuRoomStoreRequest {
  "zone"?: string;
  "direction"?: string;
  "proposedZone"?: string;
  "proposedDirection"?: string;
  "placement"?: string;
  "latitude"?: number;
  "longitude"?: number;
}
export interface VastuRoomStudyRequest {
  "zone"?: string;
  "direction"?: string;
  "proposedZone"?: string;
  "proposedDirection"?: string;
  "placement"?: string;
  "latitude"?: number;
  "longitude"?: number;
}
export interface VastuRoomToiletRequest {
  "zone"?: string;
  "direction"?: string;
  "proposedZone"?: string;
  "proposedDirection"?: string;
  "placement"?: string;
  "latitude"?: number;
  "longitude"?: number;
}
export interface VastuRoomWaterStorageRequest {
  "zone"?: string;
  "direction"?: string;
  "proposedZone"?: string;
  "proposedDirection"?: string;
  "placement"?: string;
  "latitude"?: number;
  "longitude"?: number;
}
export interface VastuScoreComplianceIndexRequest {
  "rooms": Array<{ "name": string; "roomType"?: string; "zone"?: string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
  "plot"?: Record<string, VastuJsonValue>;
}
export interface VastuScoreOverallRequest {
  "rooms": Array<{ "name": string; "roomType"?: string; "zone"?: string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
  "plot"?: Record<string, VastuJsonValue>;
}
export interface VastuScoreZoneWiseRequest {
  "rooms": Array<{ "name": string; "roomType"?: string; "zone"?: string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
  "plot"?: Record<string, VastuJsonValue>;
}
export interface VastuSpecializedCommercialRequest {
  "rooms": Array<{ "name": string; "roomType"?: string; "zone"?: string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
  "facing"?: string;
  "buildingFacing"?: string;
  "lat"?: number;
  "lon"?: number;
}
export interface VastuSpecializedEducationalRequest {
  "rooms": Array<{ "name": string; "roomType"?: string; "zone"?: string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
  "facing"?: string;
  "buildingFacing"?: string;
  "lat"?: number;
  "lon"?: number;
}
export interface VastuSpecializedFactoryRequest {
  "rooms": Array<{ "name": string; "roomType"?: string; "zone"?: string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
  "facing"?: string;
  "buildingFacing"?: string;
  "lat"?: number;
  "lon"?: number;
}
export interface VastuSpecializedHospitalRequest {
  "rooms": Array<{ "name": string; "roomType"?: string; "zone"?: string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
  "facing"?: string;
  "buildingFacing"?: string;
  "lat"?: number;
  "lon"?: number;
}
export interface VastuSpecializedResidentialRequest {
  "rooms": Array<{ "name": string; "roomType"?: string; "zone"?: string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
  "facing"?: string;
  "buildingFacing"?: string;
  "lat"?: number;
  "lon"?: number;
}
export interface VastuSpecializedRestaurantRequest {
  "rooms": Array<{ "name": string; "roomType"?: string; "zone"?: string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
  "facing"?: string;
  "buildingFacing"?: string;
  "lat"?: number;
  "lon"?: number;
}
export interface VastuSpecializedTempleRequest {
  "rooms": Array<{ "name": string; "roomType"?: string; "zone"?: string; "direction"?: string; "polygon"?: Array<Array<number>>; "area"?: number; }>;
  "facing"?: string;
  "buildingFacing"?: string;
  "lat"?: number;
  "lon"?: number;
}
export interface VastuTimingBhumiPujanRequest {
  "latitude": number;
  "longitude": number;
  "datetime"?: string;
  "date"?: string;
  "time"?: string;
  "timezone"?: string;
  "windowDays"?: number;
}
export interface VastuTimingConstructionStartRequest {
  "latitude": number;
  "longitude": number;
  "datetime"?: string;
  "date"?: string;
  "time"?: string;
  "timezone"?: string;
  "windowDays"?: number;
}
export interface VastuTimingGrihapraveshRequest {
  "latitude": number;
  "longitude": number;
  "datetime"?: string;
  "date"?: string;
  "time"?: string;
  "timezone"?: string;
  "windowDays"?: number;
}
export interface VastuTimingVastuShantiRequest {
  "latitude": number;
  "longitude": number;
  "datetime"?: string;
  "date"?: string;
  "time"?: string;
  "timezone"?: string;
  "windowDays"?: number;
}
// BEGIN GENERATED VASTU RESPONSE DATA
export interface VastuAssessmentBadgeEligibility {
  "inputSource": "seller-supplied" | "plan-derived" | "measured";
  "badge": "plan-derived" | "measured" | null;
  "eligible": boolean;
  "variant": "standard" | "low_confidence" | null;
  "confidence"?: number;
  "fullBadgeThreshold"?: number;
  "minimumConfidence"?: number;
  "reason": string;
}
export interface VastuArAnchorRecommendationsData {
  "anchors": Array<{ "id": string; "zone": "NW" | "N" | "NE" | "W" | "CENTER" | "E" | "SW" | "S" | "SE"; "deity": string; "deityClassification"?: "classical" | "convention"; "deitySource"?: string; "planPosition": Array<number>; "worldPosition": Array<number>; "normal": Array<number>; "insidePlot": true; }>;
  "omittedZones": Array<"NW" | "N" | "NE" | "W" | "CENTER" | "E" | "SW" | "S" | "SE">;
  "planToWorld": VastuJsonValue;
  "bearingDeg": number;
  "bearingAssumedNorth": false;
  "physicalRegistrationVerified": false;
  "physicalNorthVerified": false;
  "sources": Array<string>;
  "verified": false;
  "provenance": VastuJsonValue;
  "computed": true;
  "physicalCoverageVerified": false;
  "coordinateNote": string;
  "omissionNote": string;
}
export interface VastuArDeityIconsData {
  "icons": Array<{ "zone": "NW" | "N" | "NE" | "W" | "CENTER" | "E" | "SW" | "S" | "SE"; "deity": string; "deityClassification"?: "classical" | "convention"; "deitySource"?: string; "kind": "typographic-nameplate"; "png": VastuJsonValue; "svg": VastuJsonValue; "width": number; "height": number; }>;
  "verified": false;
  "provenance": VastuJsonValue;
}
export interface VastuArHeatmapRasterData {
  "mask": number;
  "texture": VastuJsonValue;
  "maskBitOrder": Array<"NW" | "N" | "NE" | "W" | "CENTER" | "E" | "SW" | "S" | "SE">;
  "zones": Array<{ "zone": "NW" | "N" | "NE" | "W" | "CENTER" | "E" | "SW" | "S" | "SE"; "deity": string; "deityClassification"?: "classical" | "convention"; "deitySource"?: string; "disturbed": boolean; "observed": boolean; "roomCount": number; }>;
  "observedZones": Array<"NW" | "N" | "NE" | "W" | "CENTER" | "E" | "SW" | "S" | "SE">;
  "unobservedZones": Array<"NW" | "N" | "NE" | "W" | "CENTER" | "E" | "SW" | "S" | "SE">;
  "mandalaProjection": Record<string, VastuJsonValue> | null;
  "bearingAssumedNorth": boolean;
  "completeness": { "status": "partial" | "computed_from_supplied_input"; "computedComponents": Array<string>; "missingInputs": Array<string>; "projectedCellCount": number; "physicalCoverageVerified": false; "note": string; };
  "sources": Array<string>;
  "physicalCoverageVerified": false;
  "verified": false;
  "provenance": VastuJsonValue;
  "legend": { "disturbed": { "color": string; "meaning": string; }; "neutral": { "color": string; "meaning": string; }; "observed": string; };
  "computed": true;
}
export interface VastuArRoomCaptureData {
  "method": "room-capture";
  "schema": "vedika.roomCapture/1";
  "capture": { "captureId": string; "capturedAtEpoch": number; "device": Record<string, VastuJsonValue>; "north": Record<string, VastuJsonValue>; "floorIndex": number; "outline": { "polygon": Array<Array<number>>; "source": "traced"; "width": number; "length": number; "areaM2": number; }; "originShiftM": Array<number>; "roomCount": number; "openingCount": number; };
  "rooms": Array<{ "id": string; "label": string | null; "roomType": string | null; "zone": "NW" | "N" | "NE" | "W" | "CENTER" | "E" | "SW" | "S" | "SE"; "zoneBasis": string; "areaM2": number; "centroid": Array<number>; "heightM": number | null; "openingCount": number; "polygon": Array<Array<number>>; }>;
  "derivedRequests": { "planAnalyze": VastuJsonValue; "auditFloorPlanDetailed": VastuJsonValue; "scanQuality": VastuJsonValue; "anchorRecommendations": VastuJsonValue | null; };
  "planAnalysis": VastuJsonValue;
  "audit": VastuJsonValue;
  "scanQuality": VastuJsonValue;
  "anchorRecommendations": VastuJsonValue | null;
  "completeness": { "acceptForAudit": boolean; "labelledRooms": number; "unlabelledRooms": Array<string>; "missing": Array<string>; "warnings": Array<string>; };
  "sources": Array<string>;
  "verified": false;
  "captureVerification": "unverified-caller-input";
  "attestation": "caller-reported";
  "note": string;
}
export interface VastuArScanQualityData {
  "grade": "A" | "B" | "C" | "D" | "F" | null;
  "score": number | null;
  "missingData": Array<string>;
  "warnings": Array<string>;
  "reScanSuggestions": Array<string>;
  "dimensions": { "pointCloudDensity": { "score": number | null; "reason": string; "status": "reported" | "unknown"; "basis": "feature-points" | "lidar-depth" | "none" | "unreported"; }; "polygonClosure": { "score": number | null; "reason": string; "status": "reported" | "unknown"; }; "compassConfidence": { "score": number | null; "reason": string; "status": "reported" | "unknown"; }; "gpsConfidence": { "score": number | null; "reason": string; "status": "reported" | "unknown"; }; "roomsTagged": { "score": number | null; "reason": string; "status": "reported" | "unknown"; }; "coverage": { "score": number | null; "reason": string; "status": "reported" | "unknown"; "basis": "reported-percent" | "duration-area-proxy" | "unknown"; }; };
  "acceptForAudit": boolean;
  "sources": Array<string>;
  "verified": boolean;
  "roomsTaggedCount": number | null;
  "unreportedDimensions": Array<string>;
  "roomCount": number | null;
  "roomCoverage": { "expectedRoomCount": number | null; "percent": number | null; "status": "complete" | "partial" | "invalid" | "unknown"; "scope": "caller-declared-room-set"; };
  "scoreScope": "reported-scan-telemetry";
  "evidenceSource": "caller-reported";
  "sensorAttestation": false;
  "limitations": string;
}
export interface VastuArTrueNorthData {
  "input": { "lat": number; "lon": number; "datetime": string; "deviceHeadingAtSunDeg": number; };
  "sunAzimuthTrueDeg": number;
  "solarElevationDeg": number;
  "offsetDeg": number;
  "headingCorrection": string;
  "reliable": boolean;
  "reason": string;
  "sources": Array<string>;
  "verified": boolean;
  "solarGeometryReliable": boolean;
  "headingQuality": { "accuracyDeg": number | null; "sampleAgeMs": number | null; "maxAccuracyDeg": 11.25; "maxSampleAgeMs": 4000; "reliable": boolean; "basis": string; };
}
export interface VastuArYantraMeshesData {
  "name": string;
  "format": "gltf" | "usdz";
  "asset": VastuJsonValue;
  "dimensionsMetres": Array<number>;
  "geometry": { "vertices": number; "triangles": number; "upAxis": string; "northAxis": string; "eastAxis": string; "units": "metres"; };
  "ritualDesign": false;
  "remedyEfficacyClaimed": false;
  "verified": false;
  "provenance": VastuJsonValue;
  "assetId": "nine-zone-mandala";
}
export interface VastuArZoneTexturesData {
  "png": VastuJsonValue;
  "svg": VastuJsonValue;
  "width": number;
  "height": number;
  "cells": Array<{ "contentInsetPixels": number; "devata": string; "gltfUvBoundsTopLeft": Array<number>; "maskBit": number; "pixelBoundsExclusive": Array<number>; "usdUvBoundsBottomLeft": Array<number>; "zone": "NW" | "N" | "NE" | "W" | "CENTER" | "E" | "SW" | "S" | "SE"; }>;
  "verified": false;
  "provenance": VastuJsonValue;
  "pixelBoundsConvention": string;
  "gltfUvOrigin": string;
  "usdUvOrigin": string;
}
export interface VastuAssessmentBatchData {
  "results": Array<{ "id": string; "status": number; "response": { "success": boolean; "data"?: { "system": "vastu"; "method": "listing-assessment"; "status": "assessed" | "insufficient_data"; "score"?: number; "confidence": number; "badgeEligibility": { "inputSource": "seller-supplied" | "plan-derived" | "measured"; "badge": "plan-derived" | "measured" | null; "eligible": boolean; "variant": "standard" | "low_confidence" | null; "confidence"?: number; "fullBadgeThreshold"?: number; "minimumConfidence"?: number; "reason": string; }; "findings"?: Array<Record<string, VastuJsonValue>>; "maxScore"?: number; "grade"?: string | null; "gradeLabel"?: string | null; "scoreBreakdown"?: Record<string, VastuJsonValue> | null; "confidenceBasis": Record<string, VastuJsonValue>; "entrance"?: Record<string, VastuJsonValue> | null; "scanQuality"?: Record<string, VastuJsonValue> | null; "zoneReference"?: Record<string, VastuJsonValue> | null; "sources"?: Array<{ "source": string; "scope": string; "verified": boolean; "classification": "classical" | "convention" | "computed"; "tradition"?: string; }>; "verified"?: boolean; "tradition"?: string; "reason"?: string; "requiredConfidence"?: number; "missingData"?: Array<string>; "reScanSuggestions"?: Array<string>; "charged"?: boolean; "meta": Record<string, VastuJsonValue>; "listingId"?: VastuJsonValue; }; "error"?: string; "code"?: string; "billing"?: { "charged": number; "currency": string; "balanceBefore": number; "balanceAfter": number; "endpoint": string; "category": string; }; "meta"?: { "source"?: string; "engine": "vedika-intelligence"; "version": string; "dataSource"?: "vedika-ephemeris"; }; }; }>;
  "summary": { "total": number; "succeeded": number; "failed": number; };
  "billingBasis": string;
  "execution": "synchronous";
}
export interface VastuAssessmentData {
  "system": "vastu";
  "method": "listing-assessment";
  "status": "assessed" | "insufficient_data";
  "score"?: number;
  "confidence": number;
  "badgeEligibility": { "inputSource": "seller-supplied" | "plan-derived" | "measured"; "badge": "plan-derived" | "measured" | null; "eligible": boolean; "variant": "standard" | "low_confidence" | null; "confidence"?: number; "fullBadgeThreshold"?: number; "minimumConfidence"?: number; "reason": string; };
  "findings"?: Array<{ "code"?: string; "room"?: string | null; "zone"?: string | null; "severity"?: string | null; "detail"?: string | null; "recommendedZone"?: string | null; "remedy"?: string | null; "remedyType"?: string | null; "remedyClassification"?: string | null; "remedySource"?: string | null; "zoneReference"?: Record<string, VastuJsonValue> | null; "pada"?: Record<string, VastuJsonValue> | null; "missingData"?: Array<VastuJsonValue>; "reScanSuggestions"?: Array<VastuJsonValue>; "classification"?: string; "verified"?: boolean; "computed"?: boolean; "source"?: string; }>;
  "maxScore"?: number;
  "grade"?: string | null;
  "gradeLabel"?: string | null;
  "scoreBreakdown"?: Record<string, VastuJsonValue> | null;
  "confidenceBasis": Record<string, VastuJsonValue>;
  "entrance"?: Record<string, VastuJsonValue> | null;
  "scanQuality"?: Record<string, VastuJsonValue> | null;
  "zoneReference"?: Record<string, VastuJsonValue> | null;
  "sources"?: Array<{ "source": string; "scope": string; "verified": boolean; "classification": "classical" | "convention" | "computed"; "tradition"?: string; }>;
  "verified"?: boolean;
  "tradition"?: string;
  "reason"?: string;
  "requiredConfidence"?: number;
  "missingData"?: Array<string>;
  "reScanSuggestions"?: Array<string>;
  "charged"?: boolean;
  "meta": Record<string, VastuJsonValue>;
  "listingId"?: VastuJsonValue;
}
export interface VastuAuspiciousFacingData {
  "purpose": string;
  "bestFacing": Array<Record<string, VastuJsonValue>>;
  "bestZone": Array<Record<string, VastuJsonValue>>;
  "avoidFacing": Array<Record<string, VastuJsonValue>>;
  "verifiedPlacement": Record<string, VastuJsonValue> | null;
  "zoneComplianceCheck": Array<Record<string, VastuJsonValue>>;
  "verified": boolean;
  "input"?: Record<string, VastuJsonValue>;
  "meta"?: Record<string, VastuJsonValue>;
  "method"?: string;
  "rationale"?: string;
  "system"?: string;
  "tradition"?: string;
}
export interface VastuBearingZoneData {
  "bearingDeg": number;
  "zone": string;
  "deity": string;
  "element": string;
  "prescribedRooms": Array<string>;
  "forbiddenRooms": Array<string>;
  "sources": Array<string>;
  "verified": boolean;
  "deityClassification"?: string;
  "deitySource"?: string;
  "elementClassification"?: string;
  "elementSource"?: string;
  "verseBackedRooms"?: Array<string>;
  "roomRulesClassification"?: string;
}
export interface VastuBrahmasthanProjectionData {
  "centerPolygon": Array<Array<number>>;
  "bufferPolygon": Array<Array<number>>;
  "centroid": Array<number>;
  "area": number;
  "forbiddenActions": Array<string>;
  "classicalSource": string;
  "sources": Array<string>;
  "verified": boolean;
  "computed": boolean;
  "classification": string;
  "bearingAssumedNorth"?: boolean;
  "forbiddenActionsClassification"?: string;
  "forbiddenActionsSource"?: string;
  "classicalSourceScope"?: string;
}
export interface VastuCatalogReferenceData {
  "defectCount"?: number;
  "defects"?: Array<{ "labelKey"?: string; "labelParams"?: Record<string, VastuJsonValue>; "code"?: string; "label"?: string; "severity"?: string; "source"?: string; "classification"?: string; "verified"?: boolean; }>;
  "remedyCount"?: number;
  "remedies"?: Array<{ "remedyKey"?: string; "remedyParams"?: Record<string, VastuJsonValue>; "defectCode"?: string; "remedy"?: string; "classification"?: string; "source"?: string; }>;
  "featureCount"?: number;
  "features"?: Array<Record<string, VastuJsonValue>>;
  "rangeClassification"?: "convention";
  "rangeSource"?: string;
  "sources"?: Array<string>;
  "verified": boolean;
  "note"?: string;
  "meta"?: Record<string, VastuJsonValue>;
  "referenceVersion": string;
}
export interface VastuComplianceIndexData {
  "score": number;
  "complianceIndex": string;
  "drivingDefects": Array<{ "room"?: string; "zone"?: string; "severity"?: string; "weight"?: number; "pointsLost"?: number; "issue"?: string; "recommendedZone"?: string | null; "remedy"?: string | null; "remedyType"?: string | null; "remedyClassification"?: string | null; "remedySource"?: string | null; "source"?: string; "verified"?: boolean; "computed"?: boolean; "classification"?: string; "ruleProvenance"?: Record<string, VastuJsonValue>; "tradition"?: string; }>;
  "sources": Array<Record<string, VastuJsonValue>>;
  "verified": boolean;
  "basis"?: string;
  "defectsSummary"?: Record<string, VastuJsonValue>;
  "indexLabel"?: string;
  "indexScale"?: Array<Record<string, VastuJsonValue>>;
  "indexScaleNote"?: string;
  "indexType"?: string;
  "input"?: Record<string, VastuJsonValue>;
  "meta"?: Record<string, VastuJsonValue>;
  "method"?: string;
  "system"?: string;
  "tradition"?: string;
  "verdict"?: string;
  "scoring": { "version": string; "unit": string; "formula": string; "basis": string; "comparisonBasis": string; "classification": string; "inputPlacementCount": number; "uniquePlacementCount": number; "duplicatePlacementCount": number; "verified": false; };
}
export interface VastuDetailedFloorPlanAuditData {
  "score": number;
  "grade": string;
  "totalRooms": number;
  "prescribedCount": number;
  "defects": Array<{ "issueKey"?: string; "issueParams"?: { "roomType": string; "zone": string; "severity": string; }; "remedyKey"?: string | null; "remedyParams"?: Record<string, VastuJsonValue>; "room"?: string; "zone"?: string; "issue"?: string; "remedy"?: string; "severity"?: string; "classification"?: string; "recommendedZone"?: string | null; "source"?: string | null; "code"?: string | null; "remedyClassification"?: string | null; "remedySource"?: string | null; }>;
  "devataHeatmap": Array<{ "zone"?: string; "deity"?: string; "deityClassification"?: string; "deitySource"?: string; "devatas"?: Array<Record<string, VastuJsonValue>>; "disturbed"?: boolean; }>;
  "mandalaProjection": Record<string, VastuJsonValue> | null;
  "remediationOrder": Array<{ "actionKey"?: string | null; "actionParams"?: Record<string, VastuJsonValue>; "room"?: string; "zone"?: string; "action"?: string; "severity"?: string; "source"?: string | null; "code"?: string | null; "step"?: number; "classification"?: string; "remedyClassification"?: string | null; "remedySource"?: string | null; }>;
  "sources": Array<string>;
  "verified": boolean;
  "computed": boolean;
  "classification": string;
  "bearingAssumedNorth"?: boolean;
  "gradeScale"?: Record<string, VastuJsonValue>;
  "scoring": { "version": string; "unit": string; "formula": string; "basis": string; "comparisonBasis": string; "classification": string; "inputPlacementCount": number; "uniquePlacementCount": number; "duplicatePlacementCount": number; "verified": false; };
  "completeness": { "status": "partial" | "computed_from_supplied_input"; "computedComponents": Array<string>; "missingInputs": Array<string>; "projectedCellCount": number; "physicalCoverageVerified": false; "note": string; };
}
export interface VastuDirectionCorrectData {
  "input": Record<string, VastuJsonValue>;
  "magneticBearingDeg": number | null;
  "declinationDeg": number;
  "trueBearingDeg": number | null;
  "correctedZone": string;
  "sources": Array<string>;
  "verified": boolean;
  "correctedZoneIsMagnetic"?: boolean;
  "declinationCoverage"?: string;
}
export interface VastuDirectionDeclinationData {
  "lat": number;
  "lon": number;
  "date": string;
  "declinationDeg": number;
  "interpretation": string;
  "gridEpoch": string;
  "sources": Array<string>;
  "verified": boolean;
  "computed": boolean;
  "classification": string;
  "declinationCoverage"?: string;
}
export interface VastuDirections32ReferenceData {
  "system"?: string;
  "method"?: string;
  "padaCount": number;
  "padaWidthDeg"?: number;
  "auspiciousCount"?: number;
  "avoidCount"?: number;
  "classicalDoorScheme"?: Record<string, VastuJsonValue>;
  "padas": Array<Record<string, VastuJsonValue>>;
  "note"?: string;
  "verified": boolean;
  "tradition"?: string;
  "meta"?: Record<string, VastuJsonValue>;
  "referenceVersion": string;
}
export interface VastuDirectionsReferenceData {
  "directionCount": number;
  "directions": Array<{ "code"?: string; "sanskrit"?: string; "deity"?: string; "deityClassification"?: string; "deitySource"?: string; "element"?: string; "bearingStart"?: number; "bearingEnd"?: number; "verified"?: boolean; "tradition"?: string; "source"?: string; }>;
  "note"?: string;
  "sources"?: Array<string>;
  "verified": boolean;
  "system"?: string;
  "method"?: string;
  "sectorWidthDeg"?: number;
  "meta"?: Record<string, VastuJsonValue>;
  "tradition"?: string;
  "referenceVersion": string;
}
export interface VastuElementBalanceData {
  "derivedFrom": string;
  "deficientElements": Array<string>;
  "excessElements": Array<string>;
  "remedies": Array<Record<string, VastuJsonValue>>;
  "balanced": boolean;
  "meta"?: Record<string, VastuJsonValue>;
  "method"?: string;
  "summary"?: string;
  "system"?: string;
}
export interface VastuElementDistributionData {
  "elementDistribution": Array<Record<string, VastuJsonValue>>;
  "idealModel": Record<string, VastuJsonValue>;
  "dominantElement": string;
  "deficientElements": Array<string>;
  "excessElements": Array<string>;
  "zoneBreakdown": Array<Record<string, VastuJsonValue>>;
  "meta"?: Record<string, VastuJsonValue>;
  "method"?: string;
  "system"?: string;
  "totalRooms"?: number;
  "weightingBasis"?: string;
}
export interface VastuEntrancePadaData {
  "doorXY": Array<number>;
  "plotCentroid": Array<number>;
  "rawBearingDeg": number;
  "trueBearingDeg": number;
  "pada": { "index": number; "deity": string; "quadrant": string; "subIndex": number; "bearingStart": number; "bearingEnd": number; "auspiciousness": string; "source": string; "deityRosterName"?: string | null; "deityNameClassification"?: "classical" | "convention"; "deityNameSource"?: string; "deityPlacementClassification"?: "classical" | "convention"; "deityPlacementSource"?: string; };
  "edgeRefined": boolean;
  "sources": Array<string>;
  "verified": boolean;
}
export interface VastuEntranceRecommendData {
  "facing": Record<string, VastuJsonValue>;
  "bestEntrancePada": Record<string, VastuJsonValue>;
  "recommendedPadas": Array<Record<string, VastuJsonValue>>;
  "avoidPadas": Array<Record<string, VastuJsonValue>>;
  "facingCaution"?: Record<string, VastuJsonValue> | null;
  "meta"?: Record<string, VastuJsonValue>;
  "method"?: string;
  "poojaPrescribedHere"?: Record<string, VastuJsonValue> | null;
  "prescribedRoomsAtFacing"?: Array<string>;
  "system"?: string;
}
export interface VastuFloorPlanAuditData {
  "score": number;
  "grade": string;
  "totalRooms": number;
  "prescribedCount": number;
  "defects": Array<{ "issueKey"?: string; "issueParams"?: { "roomType": string; "zone": string; "severity": string; }; "remedyKey"?: string | null; "remedyParams"?: Record<string, VastuJsonValue>; "room"?: string; "zone"?: string; "issue"?: string; "remedy"?: string; "severity"?: string; "classification"?: string; "recommendedZone"?: string | null; "source"?: string | null; "code"?: string | null; "remedyClassification"?: string | null; "remedySource"?: string | null; }>;
  "sources": Array<string>;
  "verified": boolean;
  "computed": boolean;
  "classification": string;
  "gradeScale"?: Record<string, VastuJsonValue>;
  "scoring": { "version": string; "unit": string; "formula": string; "basis": string; "comparisonBasis": string; "classification": string; "inputPlacementCount": number; "uniquePlacementCount": number; "duplicatePlacementCount": number; "verified": false; };
  "textParse"?: { "version": string; "transliterations": string; "grammar": string; "coverage": string; "supportedLanguages": Array<string>; "roomVocabulary": Array<string>; "directionVocabulary": Array<string>; "unparsedClauses": Array<string>; "parsedClauseCount": number; };
}
export interface VastuFloorRulesData {
  "masterBedroomFloor": number;
  "floorRules": Array<Record<string, VastuJsonValue>>;
  "sources": Array<Record<string, VastuJsonValue>>;
  "verified": boolean;
  "input"?: Record<string, VastuJsonValue>;
  "meta"?: Record<string, VastuJsonValue>;
  "method"?: string;
  "principle"?: string;
  "system"?: string;
  "tradition"?: string;
}
export interface VastuFusionChartData {
  "ascendant": Record<string, VastuJsonValue>;
  "grahaDirections": Array<Record<string, VastuJsonValue>>;
  "favourableDirections": Array<Record<string, VastuJsonValue>>;
  "cautionDirections": Array<string>;
  "methodology": Record<string, VastuJsonValue>;
  "summary": string;
  "sources": Array<string>;
  "meta"?: Record<string, VastuJsonValue>;
  "method"?: string;
  "system"?: string;
  "tradition"?: string;
  "verified"?: boolean;
}
export interface VastuLevelAnalysisData {
  "idealLevels": Array<Record<string, VastuJsonValue>>;
  "observedAnalysis": Record<string, VastuJsonValue> | null;
  "sources": Array<Record<string, VastuJsonValue>>;
  "verified": boolean;
  "idealOrdering"?: string;
  "input"?: Record<string, VastuJsonValue>;
  "meta"?: Record<string, VastuJsonValue>;
  "method"?: string;
  "principle"?: string;
  "system"?: string;
  "tradition"?: string;
}
export interface VastuMainGateData {
  "facing": string;
  "padaScheme": string;
  "prescribedPadas": Array<number>;
  "rule": string;
  "remedy": string;
  "sources": Array<Record<string, VastuJsonValue>>;
  "computed": boolean;
  "classification": string;
  "padaVerdict"?: Record<string, VastuJsonValue>;
  "feature"?: string;
  "meta"?: Record<string, VastuJsonValue>;
  "method"?: string;
  "remedyType"?: string;
  "system"?: string;
  "verified"?: boolean;
}
export interface VastuMandalaProjectionData {
  "cells": Array<Record<string, VastuJsonValue>>;
  "plotCentroid": Array<number>;
  "bearingDeg": number;
  "sources": Array<string>;
  "verified": boolean;
  "bearingAssumedNorth"?: boolean;
  "classification"?: string;
  "computed"?: boolean;
}
export interface VastuMandalaReferenceData {
  "zoneCount"?: number;
  "zones"?: Array<{ "remedyKey"?: string; "remedyParams"?: Record<string, VastuJsonValue>; "zone"?: string; "deity"?: string; "element"?: string; "remedy"?: string; "source"?: string; "sourceClassification"?: string; "remedyClassification"?: string; "remedySource"?: string; "prescribed"?: Array<string>; "forbidden"?: Array<string>; "verseBackedRooms"?: Array<string>; "verseBackedRoomsSource"?: string; "deityClassification"?: string; "deitySource"?: string; "elementClassification"?: string; "elementSource"?: string; }>;
  "devataCount"?: number;
  "devatas"?: Array<Record<string, VastuJsonValue>>;
  "cells"?: Array<{ "id"?: string; "padaNumber"?: number; "row"?: number; "col"?: number; "zone"?: string; "isBrahmasthan"?: boolean; "devata"?: string | null; "source"?: string; "devataVerified"?: boolean; "devataNameVerified"?: boolean; "placementClassification"?: string; "placementSource"?: string; "polygon"?: Array<Array<number>>; "centroid"?: Array<number>; "area"?: number; "insidePlot"?: boolean; }>;
  "padaCount"?: number;
  "grid"?: Record<string, VastuJsonValue>;
  "sources"?: Array<string>;
  "verified": boolean;
  "system"?: string;
  "method"?: string;
  "note"?: string;
  "meta"?: Record<string, VastuJsonValue>;
  "bearingDeg"?: number;
  "brahmasthanPadas"?: Array<number>;
  "classBreakdown"?: Record<string, VastuJsonValue>;
  "devataSource"?: string;
  "devataVerified"?: boolean;
  "mandala"?: string;
  "plotCentroid"?: Array<number>;
  "projected"?: boolean;
  "tradition"?: string;
  "referenceVersion": string;
}
export interface VastuObstructionData {
  "input": Record<string, VastuJsonValue>;
  "matchedFeature": string;
  "effect": string;
  "rangeChecked": boolean;
  "inRange": boolean | null;
  "houseHeightMultiples": number | null;
  "verdict": string;
  "note": string;
  "source": string;
  "sources": Array<string>;
  "verified": boolean;
  "computed": boolean;
  "classification": string;
  "rangeClassification"?: string;
  "rangeSource"?: string;
}
export interface VastuOverallScoreData {
  "score": number;
  "grade": string;
  "placements": Array<{ "room"?: string; "zone"?: string; "severity"?: string; "weight"?: number; "merit"?: number; "demerit"?: number; "compliant"?: boolean; "recommendedZone"?: string | null; "issue"?: string; "remedy"?: string | null; "remedyType"?: string | null; "remedyClassification"?: string | null; "remedySource"?: string | null; "source"?: string; "verified"?: boolean; "computed"?: boolean; "classification"?: string; "ruleProvenance"?: Record<string, VastuJsonValue>; "tradition"?: string; }>;
  "sources": Array<Record<string, VastuJsonValue>>;
  "verified": boolean;
  "basis"?: string;
  "formula"?: string;
  "gradeLabel"?: string;
  "indexType"?: string;
  "input"?: Record<string, VastuJsonValue>;
  "maxScore"?: number;
  "meta"?: Record<string, VastuJsonValue>;
  "method"?: string;
  "scoreBreakdown"?: Record<string, VastuJsonValue>;
  "system"?: string;
  "tradition"?: string;
  "verdict"?: string;
  "scoring": { "version": string; "unit": string; "formula": string; "basis": string; "comparisonBasis": string; "classification": string; "inputPlacementCount": number; "uniquePlacementCount": number; "duplicatePlacementCount": number; "verified": false; };
}
export interface VastuPlacementData {
  "system": string;
  "method": string;
  "feature": string;
  "proposedZone": string;
  "verdict": string;
  "severity": string;
  "idealZones": Array<string>;
  "acceptableZones": Array<string>;
  "forbiddenZones": Array<string>;
  "deity": string;
  "deityClassification"?: "classical" | "convention";
  "deitySource"?: string;
  "element": string;
  "elementVerified": boolean;
  "elementSource"?: string;
  "principle": string;
  "reason": string;
  "remedy": string | null;
  "remedyType": string | null;
  "sources": Array<Record<string, VastuJsonValue>>;
  "verified": boolean;
  "meta": Record<string, VastuJsonValue>;
  "tradition"?: string;
}
export interface VastuPlanAuditData {
  "system": string;
  "method": string;
  "input": Record<string, VastuJsonValue>;
  "facing": Record<string, VastuJsonValue>;
  "plotShape": Record<string, VastuJsonValue>;
  "overallScore": number;
  "grade": string;
  "summary": string;
  "zoneCompliance": Array<Record<string, VastuJsonValue>>;
  "roomByRoom": Array<{ "room"?: string; "zone"?: string; "zoneSource"?: string; "ideal"?: string | null; "verdict"?: string; "severity"?: string; "defect"?: string | null; "remedy"?: string | null; "remedyClassification"?: string | null; "remedySource"?: string | null; "source"?: string; "verified"?: boolean; "computed"?: boolean; "classification"?: string; "ruleProvenance"?: Record<string, VastuJsonValue>; "tradition"?: string; }>;
  "defects": Array<{ "room"?: string; "zone"?: string; "severity"?: string; "issue"?: string; "remedy"?: string; "source"?: string; "verified"?: boolean; "tradition"?: string; "remedyType"?: string; "remedyClassification"?: string | null; "remedySource"?: string | null; }>;
  "remedies": Array<{ "priority"?: number; "room"?: string; "zone"?: string; "severity"?: string; "action"?: string; "source"?: string; "verified"?: boolean; "tradition"?: string; "remedyType"?: string; "remedyClassification"?: string | null; "remedySource"?: string | null; }>;
  "elementBalance": Record<string, VastuJsonValue>;
  "sources": Array<string>;
  "provenance": Record<string, VastuJsonValue>;
  "meta": Record<string, VastuJsonValue>;
  "printReady"?: Record<string, VastuJsonValue>;
  "tracedGeometry"?: Record<string, VastuJsonValue>;
  "gradeLabel"?: string;
  "scoreDisclaimer"?: string;
  "artifact"?: { "contentType": "text/html; charset=utf-8"; "filename": "vastu-report.html"; "content": string; };
}
export interface VastuPlanGenerateData {
  "plot": Record<string, VastuJsonValue>;
  "entrance": Record<string, VastuJsonValue>;
  "rooms": Array<Record<string, VastuJsonValue>>;
  "mandala": Record<string, VastuJsonValue>;
  "compliance": Record<string, VastuJsonValue>;
  "openings": Record<string, VastuJsonValue>;
  "svg"?: string;
  "variants": Array<Record<string, VastuJsonValue>>;
  "recommendedVariant": string;
  "architecturalRooms"?: Array<Record<string, VastuJsonValue>>;
  "derivedRoomProgramme"?: Array<Record<string, VastuJsonValue>>;
  "input"?: Record<string, VastuJsonValue>;
  "meta"?: Record<string, VastuJsonValue>;
  "method"?: string;
  "requirements"?: Record<string, VastuJsonValue>;
  "roomProgrammeNote"?: string;
  "sources"?: Array<Record<string, VastuJsonValue>>;
  "system"?: string;
  "variantCount"?: number;
  "variantNote"?: string;
  "verified"?: boolean;
  "floors"?: Array<Record<string, VastuJsonValue>>;
  "core"?: Record<string, VastuJsonValue>;
  "verticalChecks"?: Array<Record<string, VastuJsonValue>>;
  "floorNote"?: string;
}
export interface VastuPlanOptimizeData {
  "before": Record<string, VastuJsonValue>;
  "after": Record<string, VastuJsonValue>;
  "improvement": Record<string, VastuJsonValue>;
  "moves": Array<Record<string, VastuJsonValue>>;
  "mandala": Record<string, VastuJsonValue>;
  "svg"?: string;
  "compliance"?: Record<string, VastuJsonValue>;
  "entrance"?: Record<string, VastuJsonValue>;
  "meta"?: Record<string, VastuJsonValue>;
  "method"?: string;
  "openings"?: Record<string, VastuJsonValue>;
  "plot"?: Record<string, VastuJsonValue>;
  "sources"?: Array<Record<string, VastuJsonValue>>;
  "system"?: string;
  "verified"?: boolean;
}
export interface VastuPlotExtensionsCutsData {
  "directions": Array<Record<string, VastuJsonValue>>;
  "extensions": Array<string>;
  "cuts": Array<Record<string, VastuJsonValue>>;
  "severeCuts": Array<Record<string, VastuJsonValue>>;
  "sources": Array<string>;
  "verified": boolean;
  "actualPlotArea"?: number;
  "areaEfficiency"?: number;
  "idealRectangleArea"?: number;
  "input"?: Record<string, VastuJsonValue>;
  "meta"?: Record<string, VastuJsonValue>;
  "method"?: string;
  "provenance"?: Record<string, VastuJsonValue>;
  "summary"?: string;
  "system"?: string;
  "verdict"?: string;
}
export interface VastuPlotOrientationData {
  "facing": string;
  "grade": string;
  "doorPadaScheme": Record<string, VastuJsonValue>;
  "sources": Array<string>;
  "verified": boolean;
  "auspicious"?: boolean;
  "deity"?: string;
  "facingSanskrit"?: string;
  "gradeProvenance"?: Record<string, VastuJsonValue>;
  "input"?: Record<string, VastuJsonValue>;
  "meta"?: Record<string, VastuJsonValue>;
  "method"?: string;
  "note"?: string;
  "provenance"?: Record<string, VastuJsonValue>;
  "system"?: string;
}
export interface VastuPlotRatioData {
  "length": number;
  "width": number;
  "units": string;
  "unitsNote": string;
  "lengthM": number | null;
  "widthM": number | null;
  "ratio": number;
  "category": string;
  "acceptable": boolean;
  "remedy": string | null;
  "classicalSource": string;
  "sources": Array<string>;
  "verified": boolean;
  "boundingFrame": "longest-edge-aligned";
}
export interface VastuPlotShapeData {
  "shape": string;
  "vertices": number;
  "area": number;
  "bboxArea": number;
  "fillRatio": number;
  "vastuGrade": string;
  "notes": string;
  "classicalSource": string;
  "sources": Array<string>;
  "verified": boolean;
  "boundingFrame": "longest-edge-aligned";
}
export interface VastuPlotSlopeData {
  "downSlopeDirection": string;
  "classicalReference": Record<string, VastuJsonValue>;
  "verdict"?: string;
  "remedy"?: string | null;
  "sources": Array<string>;
  "verified": boolean;
  "auspicious"?: boolean;
  "effect"?: string;
  "effectProvenance"?: Record<string, VastuJsonValue>;
  "idealRule"?: string;
  "idealRuleProvenance"?: Record<string, VastuJsonValue>;
  "input"?: Record<string, VastuJsonValue>;
  "meta"?: Record<string, VastuJsonValue>;
  "method"?: string;
  "provenance"?: Record<string, VastuJsonValue>;
  "remedyType"?: string | null;
  "system"?: string;
}
export interface VastuRemedyComparisonData {
  "before": { "score"?: number; "grade"?: string; "defectCount"?: number; "prescribedCount"?: number; "defects"?: Array<{ "room"?: string; "zone"?: string; "issue"?: string; "severity"?: string; "remedy"?: string; "recommendedZone"?: string | null; "source"?: string; "classification"?: string; "remedyClassification"?: string | null; "remedySource"?: string | null; }>; };
  "after": { "score"?: number; "grade"?: string; "defectCount"?: number; "prescribedCount"?: number; "defects"?: Array<{ "room"?: string; "zone"?: string; "issue"?: string; "severity"?: string; "remedy"?: string; "recommendedZone"?: string | null; "source"?: string; "classification"?: string; "remedyClassification"?: string | null; "remedySource"?: string | null; }>; };
  "scoreDelta": number;
  "scoring": Record<string, VastuJsonValue>;
  "verdict": string;
  "remediesApplied": Array<Record<string, VastuJsonValue>>;
  "roomChanges": Array<Record<string, VastuJsonValue>>;
  "sources": Array<string>;
  "meta"?: Record<string, VastuJsonValue>;
  "method"?: string;
  "system"?: string;
  "tradition"?: string;
  "verified"?: boolean;
}
export interface VastuRoadOrientationData {
  "roadAnalysis": Array<Record<string, VastuJsonValue>>;
  "beneficRoads": Array<string>;
  "cautionRoads": Array<string>;
  "veedhiShoola": Record<string, VastuJsonValue>;
  "sources": Array<string>;
  "verified": boolean;
  "chaturMukhi"?: boolean;
  "hasNorthOrEastRoad"?: boolean;
  "input"?: Record<string, VastuJsonValue>;
  "meta"?: Record<string, VastuJsonValue>;
  "method"?: string;
  "provenance"?: Record<string, VastuJsonValue>;
  "summary"?: string;
  "system"?: string;
  "verdict"?: string;
}
export interface VastuRoomData {
  "system": string;
  "method": string;
  "room": string;
  "placement": Record<string, VastuJsonValue>;
  "verdict": string;
  "severity": string;
  "idealZones": Array<string>;
  "acceptableZones": Array<string>;
  "forbiddenZones": Array<string>;
  "defect": Record<string, VastuJsonValue> | null;
  "remedy": string | null;
  "remedyType": string | null;
  "guidance": string | null;
  "citation": Record<string, VastuJsonValue>;
  "verified": boolean;
  "meta": Record<string, VastuJsonValue>;
  "storageType"?: string;
  "placementVerified"?: boolean;
  "guidanceClassification"?: string | null;
}
export interface VastuScanStoredData {
  "schemaVersion": 1;
  "propertyId": string;
  "snapshot": VastuJsonValue;
  "audit": VastuJsonValue;
  "scanQuality": VastuJsonValue | null;
  "captureVerification": "unverified-caller-input";
  "geometryUnits": "metres";
  "assessmentNote": string;
}
export interface VastuScansDeleteData {
  "scanId": string;
  "deleted": boolean;
  "deletionScope": string;
  "persistence": "account-store" | "preview-only";
  "previewNote"?: string;
}
export interface VastuScansListData {
  "scans": Array<VastuJsonValue>;
  "nextCursor": string | null;
  "paginationNote"?: string;
  "persistence": "account-store" | "preview-only";
  "previewNote"?: string;
}
export interface VastuScansRetrieveData {
  "scan": VastuJsonValue;
  "persistence": "account-store" | "preview-only";
  "previewNote"?: string;
}
export interface VastuScansSaveData {
  "scan": VastuJsonValue;
  "replayed": boolean;
  "retentionNote"?: string;
  "persistence": "account-store" | "preview-only";
  "previewNote"?: string;
}
export interface VastuScansTimelapseData {
  "propertyId": string;
  "scans": Array<VastuJsonValue>;
  "comparisonNote": string;
  "physicalChangeVerified": false;
  "persistence": "account-store" | "preview-only";
  "previewNote"?: string;
}
export interface VastuSingleRoomAuditData {
  "input": Record<string, VastuJsonValue>;
  "compliance": string;
  "severity": string;
  "recommendedZone": string | null;
  "remedy": string;
  "sources": Array<string>;
  "verified": boolean;
  "computed": boolean;
  "classification": string;
  "remedyKey"?: string | null;
  "remedyParams"?: Record<string, VastuJsonValue>;
  "remedyClassification"?: string | null;
  "remedySource"?: string | null;
}
export interface VastuSpecializedAuditData {
  "system": string;
  "method": string;
  "buildingType": string;
  "score": number;
  "grade": string;
  "scoringBasis": string;
  "auditedRooms": number;
  "idealCount": number;
  "compliantCount": number;
  "defectCount": number;
  "findings": Array<{ "room"?: string; "zone"?: string; "function"?: string; "status"?: string; "severity"?: string; "idealZones"?: Array<string>; "deity"?: string; "deityClassification"?: string; "deitySource"?: string; "element"?: string; "elementTradition"?: string; "waterEffect"?: Record<string, VastuJsonValue> | null; "note"?: string; "verified"?: boolean; "computed"?: boolean; "classification"?: string; "tradition"?: string; "source"?: string; }>;
  "remedies": Array<Record<string, VastuJsonValue>>;
  "unknownRooms": Array<Record<string, VastuJsonValue>>;
  "sources": Array<string>;
  "provenance": Record<string, VastuJsonValue>;
  "meta": Record<string, VastuJsonValue>;
  "buildingDirection"?: Record<string, VastuJsonValue>;
}
export interface VastuSunPathData {
  "input": { "lat": number; "lon": number; "date": string; };
  "sunriseUtc": string;
  "sunriseAzimuthDeg": number;
  "solarNoonUtc": string;
  "solarNoonAzimuthDeg": number;
  "solarNoonElevationDeg": number;
  "sunsetUtc": string;
  "sunsetAzimuthDeg": number;
  "declinationDeg": number;
  "arc": Array<Record<string, VastuJsonValue>>;
  "sources": Array<string>;
  "verified": boolean;
}
export interface VastuTimingData {
  "system": string;
  "method": string;
  "activity": string;
  "input": Record<string, VastuJsonValue>;
  "summary": Record<string, VastuJsonValue>;
  "auspiciousDates": Array<Record<string, VastuJsonValue>>;
  "meta": Record<string, VastuJsonValue>;
  "guidance": Record<string, VastuJsonValue>;
  "foundationRite"?: Record<string, VastuJsonValue>;
}
export interface VastuWallAnalysisData {
  "idealWalls": Array<Record<string, VastuJsonValue>>;
  "observedAnalysis": Record<string, VastuJsonValue> | null;
  "sources": Array<Record<string, VastuJsonValue>>;
  "verified": boolean;
  "idealOrdering"?: string;
  "input"?: Record<string, VastuJsonValue>;
  "meta"?: Record<string, VastuJsonValue>;
  "method"?: string;
  "principle"?: string;
  "system"?: string;
  "tradition"?: string;
}
export interface VastuZoneReferenceData {
  "system"?: string;
  "method"?: string;
  "zoneCount": number;
  "zones": Array<Record<string, VastuJsonValue>>;
  "note"?: string;
  "verified": boolean;
  "tradition"?: string;
  "meta"?: Record<string, VastuJsonValue>;
  "referenceVersion": string;
}
export interface VastuZoneWiseScoreData {
  "zones": Array<{ "zone"?: string; "zoneWeight"?: number; "zoneImportance"?: string; "score"?: number; "grade"?: string; "worstSeverity"?: string; "rooms"?: Array<{ "room"?: string; "severity"?: string; "compliant"?: boolean; "issue"?: string; "remedy"?: string | null; "remedyType"?: string | null; "remedyClassification"?: string | null; "remedySource"?: string | null; "recommendedZone"?: string | null; }>; "source"?: string; "verified"?: boolean; "tradition"?: string; }>;
  "sources": Array<Record<string, VastuJsonValue>>;
  "verified": boolean;
  "basis"?: string;
  "indexType"?: string;
  "input"?: Record<string, VastuJsonValue>;
  "meta"?: Record<string, VastuJsonValue>;
  "method"?: string;
  "overallGrade": string;
  "overallScore": number;
  "strongestZone"?: string;
  "system"?: string;
  "tradition"?: string;
  "weakestZone"?: string;
  "zoneWeightingNote"?: string;
  "scoring": { "version": string; "unit": string; "formula": string; "basis": string; "comparisonBasis": string; "classification": string; "inputPlacementCount": number; "uniquePlacementCount": number; "duplicatePlacementCount": number; "verified": false; };
}
export type VastuArScanQualityResponse = VastuResponse<VastuArScanQualityData>;
export type VastuArTrueNorthCalibrateResponse = VastuResponse<VastuArTrueNorthData>;
export type VastuAssessmentsResponse = VastuResponseWithOptionalBilling<VastuAssessmentData>;
export interface VastuAssessmentsBatchResponse {
  success: true;
  data: VastuAssessmentBatchData;
}
export type VastuAuditFloorPlanResponse = VastuResponse<VastuFloorPlanAuditData>;
export type VastuAuditFloorPlanDetailedResponse = VastuResponse<VastuDetailedFloorPlanAuditData>;
export type VastuAuditSingleRoomResponse = VastuResponse<VastuSingleRoomAuditData>;
export type VastuCompareBeforeAfterRemedyResponse = VastuResponse<VastuRemedyComparisonData>;
export type VastuCompoundWallAnalysisResponse = VastuResponse<VastuWallAnalysisData>;
export type VastuDirectionAuspiciousFacingResponse = VastuResponse<VastuAuspiciousFacingData>;
export type VastuDirectionCorrectResponse = VastuResponse<VastuDirectionCorrectData>;
export type VastuDirectionDeclinationResponse = VastuResponse<VastuDirectionDeclinationData>;
export type VastuDirectionSunPathResponse = VastuResponse<VastuSunPathData>;
export type VastuDirectionZoneFromBearingResponse = VastuResponse<VastuBearingZoneData>;
export type VastuElementsBalanceSuggestResponse = VastuResponse<VastuElementBalanceData>;
export type VastuElementsDistributionResponse = VastuResponse<VastuElementDistributionData>;
export type VastuEntranceObstructionCheckResponse = VastuResponse<VastuObstructionData>;
export type VastuEntrancePadaResponse = VastuResponse<VastuEntrancePadaData>;
export type VastuEntranceRecommendResponse = VastuResponse<VastuEntranceRecommendData>;
export type VastuFloorLevelAnalysisResponse = VastuResponse<VastuLevelAnalysisData>;
export type VastuFusionChartResponse = VastuResponse<VastuFusionChartData>;
export type VastuMandalaProject81PadaResponse = VastuResponse<VastuMandalaProjectionData>;
export type VastuMandalaProject9ZoneResponse = VastuResponse<VastuMandalaProjectionData>;
export type VastuMandalaProjectBrahmasthanResponse = VastuResponse<VastuBrahmasthanProjectionData>;
export type VastuMultiStoreyFloorRulesResponse = VastuResponse<VastuFloorRulesData>;
export type VastuPlacementBalconyResponse = VastuResponse<VastuPlacementData>;
export type VastuPlacementBorewellResponse = VastuResponse<VastuPlacementData>;
export type VastuPlacementGardenResponse = VastuResponse<VastuPlacementData>;
export type VastuPlacementGeneratorElectricalResponse = VastuResponse<VastuPlacementData>;
export type VastuPlacementMainGateResponse = VastuResponse<VastuMainGateData>;
export type VastuPlacementOverheadTankResponse = VastuResponse<VastuPlacementData>;
export type VastuPlacementSepticTankResponse = VastuResponse<VastuPlacementData>;
export type VastuPlacementTreeResponse = VastuResponse<VastuPlacementData>;
export type VastuPlacementWellResponse = VastuResponse<VastuPlacementData>;
export type VastuPlacementWindowResponse = VastuResponse<VastuPlacementData>;
export type VastuPlanAnalyzeResponse = VastuResponse<VastuPlanAuditData>;
export type VastuPlanFromRequirementsResponse = VastuResponse<VastuPlanGenerateData>;
export type VastuPlanGenerateResponse = VastuResponse<VastuPlanGenerateData>;
export type VastuPlanOptimizeResponse = VastuResponse<VastuPlanOptimizeData>;
export type VastuPlanReportResponse = VastuResponse<VastuPlanAuditData>;
export type VastuPlanUploadResponse = VastuResponse<VastuPlanAuditData>;
export type VastuPlotExtensionsCutsResponse = VastuResponse<VastuPlotExtensionsCutsData>;
export type VastuPlotOrientationResponse = VastuResponse<VastuPlotOrientationData>;
export type VastuPlotRatioResponse = VastuResponse<VastuPlotRatioData>;
export type VastuPlotRoadOrientationResponse = VastuResponse<VastuRoadOrientationData>;
export type VastuPlotShapeResponse = VastuResponse<VastuPlotShapeData>;
export type VastuPlotSlopeResponse = VastuResponse<VastuPlotSlopeData>;
export type VastuReferenceColorsByZoneResponse = VastuResponse<VastuZoneReferenceData>;
export type VastuReferenceDefectsCatalogResponse = VastuResponse<VastuCatalogReferenceData>;
export type VastuReferenceDirections16Response = VastuResponse<VastuDirectionsReferenceData>;
export type VastuReferenceDirections32Response = VastuResponse<VastuDirections32ReferenceData>;
export type VastuReferenceDirections8Response = VastuResponse<VastuDirectionsReferenceData>;
export type VastuReferenceGateObstructionsResponse = VastuResponse<VastuCatalogReferenceData>;
export type VastuReferenceMandala45DevatasResponse = VastuResponse<VastuMandalaReferenceData>;
export type VastuReferenceMandala64PadaResponse = VastuResponse<VastuMandalaReferenceData>;
export type VastuReferenceMandala9ZoneResponse = VastuResponse<VastuMandalaReferenceData>;
export type VastuReferenceMaterialsByZoneResponse = VastuResponse<VastuZoneReferenceData>;
export type VastuReferenceRemediesCatalogResponse = VastuResponse<VastuCatalogReferenceData>;
export type VastuRoomBedroomResponse = VastuResponse<VastuRoomData>;
export type VastuRoomDiningResponse = VastuResponse<VastuRoomData>;
export type VastuRoomKitchenResponse = VastuResponse<VastuRoomData>;
export type VastuRoomLivingResponse = VastuResponse<VastuRoomData>;
export type VastuRoomPoojaResponse = VastuResponse<VastuRoomData>;
export type VastuRoomStaircaseResponse = VastuResponse<VastuRoomData>;
export type VastuRoomStoreResponse = VastuResponse<VastuRoomData>;
export type VastuRoomStudyResponse = VastuResponse<VastuRoomData>;
export type VastuRoomToiletResponse = VastuResponse<VastuRoomData>;
export type VastuRoomWaterStorageResponse = VastuResponse<VastuRoomData>;
export type VastuScoreComplianceIndexResponse = VastuResponse<VastuComplianceIndexData>;
export type VastuScoreOverallResponse = VastuResponse<VastuOverallScoreData>;
export type VastuScoreZoneWiseResponse = VastuResponse<VastuZoneWiseScoreData>;
export type VastuSpecializedCommercialResponse = VastuResponse<VastuSpecializedAuditData>;
export type VastuSpecializedEducationalResponse = VastuResponse<VastuSpecializedAuditData>;
export type VastuSpecializedFactoryResponse = VastuResponse<VastuSpecializedAuditData>;
export type VastuSpecializedHospitalResponse = VastuResponse<VastuSpecializedAuditData>;
export type VastuSpecializedResidentialResponse = VastuResponse<VastuSpecializedAuditData>;
export type VastuSpecializedRestaurantResponse = VastuResponse<VastuSpecializedAuditData>;
export type VastuSpecializedTempleResponse = VastuResponse<VastuSpecializedAuditData>;
export type VastuTimingBhumiPujanResponse = VastuResponse<VastuTimingData>;
export type VastuTimingConstructionStartResponse = VastuResponse<VastuTimingData>;
export type VastuTimingGrihapraveshResponse = VastuResponse<VastuTimingData>;
export type VastuTimingVastuShantiResponse = VastuResponse<VastuTimingData>;
export type VastuArHeatmapRasterResponse = VastuResponse<VastuArHeatmapRasterData>;
export type VastuArAnchorRecommendationsResponse = VastuResponse<VastuArAnchorRecommendationsData>;
export type VastuArZoneTexturesResponse = VastuResponse<VastuArZoneTexturesData>;
export type VastuArYantraMeshesResponse = VastuResponse<VastuArYantraMeshesData>;
export type VastuArDeityIconsResponse = VastuResponse<VastuArDeityIconsData>;
export type VastuArRoomCaptureResponse = VastuResponse<VastuArRoomCaptureData>;
export interface VastuScansSaveResponse { success: true; data: VastuScansSaveData; billing?: VastuResponseBilling | null; meta?: VastuResponseMeta }
export interface VastuScansRetrieveResponse { success: true; data: VastuScansRetrieveData; billing?: VastuResponseBilling | null; meta?: VastuResponseMeta }
export interface VastuScansListResponse { success: true; data: VastuScansListData; billing?: VastuResponseBilling | null; meta?: VastuResponseMeta }
export interface VastuScansDeleteResponse { success: true; data: VastuScansDeleteData; billing?: VastuResponseBilling | null; meta?: VastuResponseMeta }
export interface VastuScansTimelapseResponse { success: true; data: VastuScansTimelapseData; billing?: VastuResponseBilling | null; meta?: VastuResponseMeta }
export interface VastuOperationContracts {
  "scans/timelapse": { method: 'POST'; request: VastuScansTimelapseRequest; auth: VastuApiKeyAuth; response: VastuScansTimelapseResponse; error: VastuErrorResponse };
  "scans/delete": { method: 'POST'; request: VastuScansDeleteRequest; auth: VastuApiKeyAuth; response: VastuScansDeleteResponse; error: VastuErrorResponse };
  "scans/list": { method: 'POST'; request: VastuScansListRequest; auth: VastuApiKeyAuth; response: VastuScansListResponse; error: VastuErrorResponse };
  "scans/retrieve": { method: 'POST'; request: VastuScansRetrieveRequest; auth: VastuApiKeyAuth; response: VastuScansRetrieveResponse; error: VastuErrorResponse };
  "scans/save": { method: 'POST'; request: VastuScansSaveRequest; auth: VastuApiKeyAuth; response: VastuScansSaveResponse; error: VastuErrorResponse };
  "ar/deity-icons": { method: 'POST'; request: VastuArDeityIconsRequest; auth: VastuApiKeyAuth; response: VastuArDeityIconsResponse; error: VastuErrorResponse };
  "ar/room-capture": { method: 'POST'; request: VastuArRoomCaptureRequest; auth: VastuApiKeyAuth; response: VastuArRoomCaptureResponse; error: VastuErrorResponse };
  "ar/yantra-meshes": { method: 'POST'; request: VastuArYantraMeshesRequest; auth: VastuApiKeyAuth; response: VastuArYantraMeshesResponse; error: VastuErrorResponse };
  "ar/zone-textures": { method: 'POST'; request: VastuArZoneTexturesRequest; auth: VastuApiKeyAuth; response: VastuArZoneTexturesResponse; error: VastuErrorResponse };
  "ar/anchor-recommendations": { method: 'POST'; request: VastuArAnchorRecommendationsRequest; auth: VastuApiKeyAuth; response: VastuArAnchorRecommendationsResponse; error: VastuErrorResponse };
  "ar/heatmap-raster": { method: 'POST'; request: VastuArHeatmapRasterRequest; auth: VastuApiKeyAuth; response: VastuArHeatmapRasterResponse; error: VastuErrorResponse };
  "ar/scan-quality": { method: 'POST'; request: VastuArScanQualityRequest; auth: VastuApiKeyAuth; response: VastuArScanQualityResponse; error: VastuErrorResponse };
  "ar/true-north-calibrate": { method: 'POST'; request: VastuArTrueNorthCalibrateRequest; auth: VastuApiKeyAuth; response: VastuArTrueNorthCalibrateResponse; error: VastuErrorResponse };
  "assessments": { method: 'POST'; request: VastuAssessmentsRequest; auth: VastuApiKeyAuth; response: VastuAssessmentsResponse; error: VastuErrorResponse };
  "assessments/batch": { method: 'POST'; request: VastuAssessmentsBatchRequest; auth: VastuApiKeyAuth; response: VastuAssessmentsBatchResponse; error: VastuErrorResponse };
  "audit/floor-plan": { method: 'POST'; request: VastuAuditFloorPlanRequest; auth: VastuApiKeyAuth; response: VastuAuditFloorPlanResponse; error: VastuErrorResponse };
  "audit/floor-plan-detailed": { method: 'POST'; request: VastuAuditFloorPlanDetailedRequest; auth: VastuApiKeyAuth; response: VastuAuditFloorPlanDetailedResponse; error: VastuErrorResponse };
  "audit/single-room": { method: 'POST'; request: VastuAuditSingleRoomRequest; auth: VastuApiKeyAuth; response: VastuAuditSingleRoomResponse; error: VastuErrorResponse };
  "compare/before-after-remedy": { method: 'POST'; request: VastuCompareBeforeAfterRemedyRequest; auth: VastuApiKeyAuth; response: VastuCompareBeforeAfterRemedyResponse; error: VastuErrorResponse };
  "compound/wall-analysis": { method: 'POST'; request: VastuCompoundWallAnalysisRequest; auth: VastuApiKeyAuth; response: VastuCompoundWallAnalysisResponse; error: VastuErrorResponse };
  "direction/auspicious-facing": { method: 'POST'; request: VastuDirectionAuspiciousFacingRequest; auth: VastuApiKeyAuth; response: VastuDirectionAuspiciousFacingResponse; error: VastuErrorResponse };
  "direction/correct": { method: 'POST'; request: VastuDirectionCorrectRequest; auth: VastuApiKeyAuth; response: VastuDirectionCorrectResponse; error: VastuErrorResponse };
  "direction/declination": { method: 'GET' | 'POST'; request: VastuDirectionDeclinationRequest; auth: VastuApiKeyAuth; response: VastuDirectionDeclinationResponse; error: VastuErrorResponse };
  "direction/sun-path": { method: 'POST'; request: VastuDirectionSunPathRequest; auth: VastuApiKeyAuth; response: VastuDirectionSunPathResponse; error: VastuErrorResponse };
  "direction/zone-from-bearing": { method: 'POST'; request: VastuDirectionZoneFromBearingRequest; auth: VastuApiKeyAuth; response: VastuDirectionZoneFromBearingResponse; error: VastuErrorResponse };
  "elements/balance-suggest": { method: 'POST'; request: VastuElementsBalanceSuggestRequest; auth: VastuApiKeyAuth; response: VastuElementsBalanceSuggestResponse; error: VastuErrorResponse };
  "elements/distribution": { method: 'POST'; request: VastuElementsDistributionRequest; auth: VastuApiKeyAuth; response: VastuElementsDistributionResponse; error: VastuErrorResponse };
  "entrance/obstruction-check": { method: 'POST'; request: VastuEntranceObstructionCheckRequest; auth: VastuApiKeyAuth; response: VastuEntranceObstructionCheckResponse; error: VastuErrorResponse };
  "entrance/pada": { method: 'POST'; request: VastuEntrancePadaRequest; auth: VastuApiKeyAuth; response: VastuEntrancePadaResponse; error: VastuErrorResponse };
  "entrance/recommend": { method: 'POST'; request: VastuEntranceRecommendRequest; auth: VastuApiKeyAuth; response: VastuEntranceRecommendResponse; error: VastuErrorResponse };
  "floor/level-analysis": { method: 'POST'; request: VastuFloorLevelAnalysisRequest; auth: VastuApiKeyAuth; response: VastuFloorLevelAnalysisResponse; error: VastuErrorResponse };
  "fusion/chart": { method: 'POST'; request: VastuFusionChartRequest; auth: VastuApiKeyAuth; response: VastuFusionChartResponse; error: VastuErrorResponse };
  "mandala/project/81-pada": { method: 'POST'; request: VastuMandalaProject81PadaRequest; auth: VastuApiKeyAuth; response: VastuMandalaProject81PadaResponse; error: VastuErrorResponse };
  "mandala/project/9-zone": { method: 'POST'; request: VastuMandalaProject9ZoneRequest; auth: VastuApiKeyAuth; response: VastuMandalaProject9ZoneResponse; error: VastuErrorResponse };
  "mandala/project/brahmasthan": { method: 'POST'; request: VastuMandalaProjectBrahmasthanRequest; auth: VastuApiKeyAuth; response: VastuMandalaProjectBrahmasthanResponse; error: VastuErrorResponse };
  "multi-storey/floor-rules": { method: 'POST'; request: VastuMultiStoreyFloorRulesRequest; auth: VastuApiKeyAuth; response: VastuMultiStoreyFloorRulesResponse; error: VastuErrorResponse };
  "placement/balcony": { method: 'POST'; request: VastuPlacementBalconyRequest; auth: VastuApiKeyAuth; response: VastuPlacementBalconyResponse; error: VastuErrorResponse };
  "placement/borewell": { method: 'POST'; request: VastuPlacementBorewellRequest; auth: VastuApiKeyAuth; response: VastuPlacementBorewellResponse; error: VastuErrorResponse };
  "placement/garden": { method: 'POST'; request: VastuPlacementGardenRequest; auth: VastuApiKeyAuth; response: VastuPlacementGardenResponse; error: VastuErrorResponse };
  "placement/generator-electrical": { method: 'POST'; request: VastuPlacementGeneratorElectricalRequest; auth: VastuApiKeyAuth; response: VastuPlacementGeneratorElectricalResponse; error: VastuErrorResponse };
  "placement/main-gate": { method: 'POST'; request: VastuPlacementMainGateRequest; auth: VastuApiKeyAuth; response: VastuPlacementMainGateResponse; error: VastuErrorResponse };
  "placement/overhead-tank": { method: 'POST'; request: VastuPlacementOverheadTankRequest; auth: VastuApiKeyAuth; response: VastuPlacementOverheadTankResponse; error: VastuErrorResponse };
  "placement/septic-tank": { method: 'POST'; request: VastuPlacementSepticTankRequest; auth: VastuApiKeyAuth; response: VastuPlacementSepticTankResponse; error: VastuErrorResponse };
  "placement/tree": { method: 'POST'; request: VastuPlacementTreeRequest; auth: VastuApiKeyAuth; response: VastuPlacementTreeResponse; error: VastuErrorResponse };
  "placement/well": { method: 'POST'; request: VastuPlacementWellRequest; auth: VastuApiKeyAuth; response: VastuPlacementWellResponse; error: VastuErrorResponse };
  "placement/window": { method: 'POST'; request: VastuPlacementWindowRequest; auth: VastuApiKeyAuth; response: VastuPlacementWindowResponse; error: VastuErrorResponse };
  "plan/analyze": { method: 'POST'; request: VastuPlanAnalyzeRequest; auth: VastuApiKeyAuth; response: VastuPlanAnalyzeResponse; error: VastuErrorResponse };
  "plan/from-requirements": { method: 'POST'; request: VastuPlanFromRequirementsRequest; auth: VastuApiKeyAuth; response: VastuPlanFromRequirementsResponse; error: VastuErrorResponse };
  "plan/generate": { method: 'POST'; request: VastuPlanGenerateRequest; auth: VastuApiKeyAuth; response: VastuPlanGenerateResponse; error: VastuErrorResponse };
  "plan/optimize": { method: 'POST'; request: VastuPlanOptimizeRequest; auth: VastuApiKeyAuth; response: VastuPlanOptimizeResponse; error: VastuErrorResponse };
  "plan/report": { method: 'POST'; request: VastuPlanReportRequest; auth: VastuApiKeyAuth; response: VastuPlanReportResponse; error: VastuErrorResponse };
  "plan/upload": { method: 'POST'; request: VastuPlanUploadRequest; auth: VastuApiKeyAuth; response: VastuPlanUploadResponse; error: VastuErrorResponse };
  "plot/extensions-cuts": { method: 'POST'; request: VastuPlotExtensionsCutsRequest; auth: VastuApiKeyAuth; response: VastuPlotExtensionsCutsResponse; error: VastuErrorResponse };
  "plot/orientation": { method: 'POST'; request: VastuPlotOrientationRequest; auth: VastuApiKeyAuth; response: VastuPlotOrientationResponse; error: VastuErrorResponse };
  "plot/ratio": { method: 'POST'; request: VastuPlotRatioRequest; auth: VastuApiKeyAuth; response: VastuPlotRatioResponse; error: VastuErrorResponse };
  "plot/road-orientation": { method: 'POST'; request: VastuPlotRoadOrientationRequest; auth: VastuApiKeyAuth; response: VastuPlotRoadOrientationResponse; error: VastuErrorResponse };
  "plot/shape": { method: 'POST'; request: VastuPlotShapeRequest; auth: VastuApiKeyAuth; response: VastuPlotShapeResponse; error: VastuErrorResponse };
  "plot/slope": { method: 'POST'; request: VastuPlotSlopeRequest; auth: VastuApiKeyAuth; response: VastuPlotSlopeResponse; error: VastuErrorResponse };
  "reference/colors-by-zone": { method: 'GET'; request: undefined; auth: VastuApiKeyAuth; response: VastuReferenceColorsByZoneResponse; error: VastuErrorResponse };
  "reference/defects/catalog": { method: 'GET'; request: undefined; auth: VastuApiKeyAuth; response: VastuReferenceDefectsCatalogResponse; error: VastuErrorResponse };
  "reference/directions/16": { method: 'GET'; request: undefined; auth: VastuApiKeyAuth; response: VastuReferenceDirections16Response; error: VastuErrorResponse };
  "reference/directions/32": { method: 'GET'; request: undefined; auth: VastuApiKeyAuth; response: VastuReferenceDirections32Response; error: VastuErrorResponse };
  "reference/directions/8": { method: 'GET'; request: undefined; auth: VastuApiKeyAuth; response: VastuReferenceDirections8Response; error: VastuErrorResponse };
  "reference/gate-obstructions": { method: 'GET'; request: undefined; auth: VastuApiKeyAuth; response: VastuReferenceGateObstructionsResponse; error: VastuErrorResponse };
  "reference/mandala/45-devatas": { method: 'GET'; request: undefined; auth: VastuApiKeyAuth; response: VastuReferenceMandala45DevatasResponse; error: VastuErrorResponse };
  "reference/mandala/64-pada": { method: 'GET'; request: undefined; auth: VastuApiKeyAuth; response: VastuReferenceMandala64PadaResponse; error: VastuErrorResponse };
  "reference/mandala/9-zone": { method: 'GET'; request: undefined; auth: VastuApiKeyAuth; response: VastuReferenceMandala9ZoneResponse; error: VastuErrorResponse };
  "reference/materials-by-zone": { method: 'GET'; request: undefined; auth: VastuApiKeyAuth; response: VastuReferenceMaterialsByZoneResponse; error: VastuErrorResponse };
  "reference/remedies/catalog": { method: 'GET'; request: undefined; auth: VastuApiKeyAuth; response: VastuReferenceRemediesCatalogResponse; error: VastuErrorResponse };
  "room/bedroom": { method: 'POST'; request: VastuRoomBedroomRequest; auth: VastuApiKeyAuth; response: VastuRoomBedroomResponse; error: VastuErrorResponse };
  "room/dining": { method: 'POST'; request: VastuRoomDiningRequest; auth: VastuApiKeyAuth; response: VastuRoomDiningResponse; error: VastuErrorResponse };
  "room/kitchen": { method: 'POST'; request: VastuRoomKitchenRequest; auth: VastuApiKeyAuth; response: VastuRoomKitchenResponse; error: VastuErrorResponse };
  "room/living": { method: 'POST'; request: VastuRoomLivingRequest; auth: VastuApiKeyAuth; response: VastuRoomLivingResponse; error: VastuErrorResponse };
  "room/pooja": { method: 'POST'; request: VastuRoomPoojaRequest; auth: VastuApiKeyAuth; response: VastuRoomPoojaResponse; error: VastuErrorResponse };
  "room/staircase": { method: 'POST'; request: VastuRoomStaircaseRequest; auth: VastuApiKeyAuth; response: VastuRoomStaircaseResponse; error: VastuErrorResponse };
  "room/store": { method: 'POST'; request: VastuRoomStoreRequest; auth: VastuApiKeyAuth; response: VastuRoomStoreResponse; error: VastuErrorResponse };
  "room/study": { method: 'POST'; request: VastuRoomStudyRequest; auth: VastuApiKeyAuth; response: VastuRoomStudyResponse; error: VastuErrorResponse };
  "room/toilet": { method: 'POST'; request: VastuRoomToiletRequest; auth: VastuApiKeyAuth; response: VastuRoomToiletResponse; error: VastuErrorResponse };
  "room/water-storage": { method: 'POST'; request: VastuRoomWaterStorageRequest; auth: VastuApiKeyAuth; response: VastuRoomWaterStorageResponse; error: VastuErrorResponse };
  "score/compliance-index": { method: 'POST'; request: VastuScoreComplianceIndexRequest; auth: VastuApiKeyAuth; response: VastuScoreComplianceIndexResponse; error: VastuErrorResponse };
  "score/overall": { method: 'POST'; request: VastuScoreOverallRequest; auth: VastuApiKeyAuth; response: VastuScoreOverallResponse; error: VastuErrorResponse };
  "score/zone-wise": { method: 'POST'; request: VastuScoreZoneWiseRequest; auth: VastuApiKeyAuth; response: VastuScoreZoneWiseResponse; error: VastuErrorResponse };
  "specialized/commercial": { method: 'POST'; request: VastuSpecializedCommercialRequest; auth: VastuApiKeyAuth; response: VastuSpecializedCommercialResponse; error: VastuErrorResponse };
  "specialized/educational": { method: 'POST'; request: VastuSpecializedEducationalRequest; auth: VastuApiKeyAuth; response: VastuSpecializedEducationalResponse; error: VastuErrorResponse };
  "specialized/factory": { method: 'POST'; request: VastuSpecializedFactoryRequest; auth: VastuApiKeyAuth; response: VastuSpecializedFactoryResponse; error: VastuErrorResponse };
  "specialized/hospital": { method: 'POST'; request: VastuSpecializedHospitalRequest; auth: VastuApiKeyAuth; response: VastuSpecializedHospitalResponse; error: VastuErrorResponse };
  "specialized/residential": { method: 'POST'; request: VastuSpecializedResidentialRequest; auth: VastuApiKeyAuth; response: VastuSpecializedResidentialResponse; error: VastuErrorResponse };
  "specialized/restaurant": { method: 'POST'; request: VastuSpecializedRestaurantRequest; auth: VastuApiKeyAuth; response: VastuSpecializedRestaurantResponse; error: VastuErrorResponse };
  "specialized/temple": { method: 'POST'; request: VastuSpecializedTempleRequest; auth: VastuApiKeyAuth; response: VastuSpecializedTempleResponse; error: VastuErrorResponse };
  "timing/bhumi-pujan": { method: 'POST'; request: VastuTimingBhumiPujanRequest; auth: VastuApiKeyAuth; response: VastuTimingBhumiPujanResponse; error: VastuErrorResponse };
  "timing/construction-start": { method: 'POST'; request: VastuTimingConstructionStartRequest; auth: VastuApiKeyAuth; response: VastuTimingConstructionStartResponse; error: VastuErrorResponse };
  "timing/grihapravesh": { method: 'POST'; request: VastuTimingGrihapraveshRequest; auth: VastuApiKeyAuth; response: VastuTimingGrihapraveshResponse; error: VastuErrorResponse };
  "timing/vastu-shanti": { method: 'POST'; request: VastuTimingVastuShantiRequest; auth: VastuApiKeyAuth; response: VastuTimingVastuShantiResponse; error: VastuErrorResponse };
}

/** Valid mandala projection schemes for vastuMandalaProject() */
export type VastuMandalaScheme = '9-zone' | '81-pada' | 'brahmasthan';

/** Valid room types for vastuRoom() */
export type VastuRoomType =
  | 'kitchen'
  | 'bedroom'
  | 'pooja'
  | 'toilet'
  | 'staircase'
  | 'study'
  | 'living'
  | 'dining'
  | 'store'
  | 'water-storage';

/** Valid site-feature placements for vastuPlacement() */
export type VastuPlacementFeature =
  | 'main-gate'
  | 'borewell'
  | 'well'
  | 'overhead-tank'
  | 'septic-tank'
  | 'generator-electrical'
  | 'garden'
  | 'tree'
  | 'balcony'
  | 'window';

/** Valid compliance-audit kinds for vastuAudit() */
export type VastuAuditKind = 'single-room' | 'floor-plan' | 'floor-plan-detailed';

/** Valid scoring kinds for vastuScore() */
export type VastuScoreKind = 'overall' | 'zone-wise' | 'compliance-index';

/**
 * Sensor readings for `vastuArScanQuality()`.
 *
 * Every field is optional and an ABSENT field is not the same as a bad one:
 * the grader scores a missing dimension at a neutral 50 and says so in that
 * dimension's `reason`, rather than assuming the worst. Send only what the
 * device actually measured.
 *
 * Field names are verified against the live handler
 * (`ported::vastu::ar_scan_quality`) — a misspelling is silently ignored and
 * costs you a neutral 50 on that dimension.
 */
export type VastuArScanQualityInput = VastuArScanQualityRequest;

/**
 * Input for `vastuArTrueNorthCalibrate()` — all four fields are required.
 *
 * Point the device at the sun, record the heading it reports, and send it with
 * the observation time and location. The response's `offsetDeg` converts any
 * later device heading only while the same sensor reference remains valid.
 * Supply deviceHeadingAccuracyDeg and headingSampleAgeMs for the reported
 * quality gate; without both, reliable is false. Historical datetime values
 * compute the observation geometry and do not certify current calibration.
 */
export type VastuArTrueNorthInput = VastuArTrueNorthCalibrateRequest;

/**
 * Legacy envelope metadata stays optional for existing integrations. The
 * generated operation contracts above use VastuResponseBilling and
 * VastuResponseMeta to require the fields present in their schemas.
 */
export interface VastuBilling {
  charged?: number;
  currency?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  endpoint?: string;
  category?: string;
}

export interface VastuMeta {
  source?: string;
  engine?: string;
  version?: string;
  dataSource?: string;
}

/**
 * The response interceptor (see `client.ts` constructor) unwraps
 * every `/v2/*` response to its `data` payload and stashes the ORIGINAL
 * envelope — including `billing`/`meta`, which are siblings of `data`, not
 * nested inside it — on a non-enumerable `__envelope` property so
 * `JSON.stringify` and normal iteration stay clean. That property existed at
 * runtime but had NO type before this: a TypeScript caller had no way to know
 * `result.__envelope?.billing` was reachable at all. This documents the real
 * shape rather than inventing a `billing`/`meta` that would appear directly on
 * the payload (it does not).
 */
export interface VastuEnvelope {
  success?: boolean;
  data?: unknown;
  billing?: VastuBilling;
  meta?: VastuMeta;
}

/**
 * Return type for the Vastu operations. An index signature keeps every
 * unmodeled per-op field reachable (unchanged behavior from
 * `Record<string, unknown>`); `__envelope` exposes the original wrapper
 * (including `billing`/`meta`) when the server sent one.
 */
export interface VastuOperationResult {
  [key: string]: unknown;
  __envelope?: VastuEnvelope;
}

/**
 * Response format type
 */
export type ResponseFormat = 'text' | 'markdown' | 'json';

/**
 * Section within a structured response
 */
export interface StructuredResponseSection {
  heading: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  paragraphs: string[];
  bullets: string[];
  numbered: string[];
}

/**
 * Structured JSON response object (when responseFormat='json')
 */
export interface StructuredResponse {
  title: string | null;
  preamble: string | null;
  sections: StructuredResponseSection[];
  raw: string;
}

// ═══════════════════════════════════════════
// Extended Domain Types
// ═══════════════════════════════════════════

/** Tarot card result */
export interface TarotCard {
  /** Card name (e.g. "The Fool", "Ten of Cups") */
  name: string;
  /** Major or minor arcana */
  arcana: 'major' | 'minor';
  /** Suit for minor arcana (wands, cups, swords, pentacles) */
  suit?: string;
  /** Card number / rank */
  number?: number;
  /** Upright or reversed */
  orientation: 'upright' | 'reversed';
  /** Card meaning in context */
  meaning: string;
  /** Keywords associated with this card */
  keywords: string[];
  /** Image URL for the card */
  imageUrl?: string;
}

/** Full tarot reading with spread */
export interface TarotReading {
  /** Spread type used (e.g. "celtic-cross", "three-card", "single") */
  spread: string;
  /** Question asked, if any */
  question?: string;
  /** Cards drawn in spread order */
  cards: TarotCard[];
  /** AI-generated interpretation of the full spread */
  interpretation: string;
  /** Overall theme or message */
  theme?: string;
}

/** Available tarot spread definitions */
export interface SpreadInfo {
  /** Spread slug (e.g. "celtic-cross") */
  id: string;
  /** Human-readable name */
  name: string;
  /** Number of cards in the spread */
  cardCount: number;
  /** Description of the spread */
  description: string;
}

/** List of available tarot spreads */
export interface SpreadList {
  spreads: SpreadInfo[];
}

/** Chinese zodiac animal result */
export interface ChineseZodiac {
  /** Animal name (e.g. "Dragon", "Rat") */
  animal: string;
  /** Yin or Yang polarity */
  polarity: 'yin' | 'yang';
  /** Fixed element for this animal */
  fixedElement: string;
  /** Heavenly stem element for the year */
  yearElement: string;
  /** Personality traits */
  traits: string[];
  /** Compatible animals */
  compatible: string[];
  /** Incompatible animals */
  incompatible: string[];
  /** Year analyzed */
  year: number;
}

/** BaZi (Four Pillars) chart */
export interface BaZiChart {
  /** Year pillar */
  yearPillar: { stem: string; branch: string };
  /** Month pillar */
  monthPillar: { stem: string; branch: string };
  /** Day pillar (Day Master) */
  dayPillar: { stem: string; branch: string };
  /** Hour pillar */
  hourPillar: { stem: string; branch: string };
  /** Day Master element */
  dayMaster: string;
  /** Day Master strength */
  dayMasterStrength: 'strong' | 'weak' | 'neutral';
  /** Favorable elements */
  favorableElements: string[];
  /** Unfavorable elements */
  unfavorableElements: string[];
  /** Luck pillars */
  luckPillars?: Array<{ stem: string; branch: string; startAge: number; endAge: number }>;
  /** AI interpretation */
  interpretation: string;
}

/** Feng Shui Kua number result */
export interface KuaResult {
  /** Personal Kua number (1-9) */
  kuaNumber: number;
  /** East or West group */
  group: 'east' | 'west';
  /** Auspicious directions */
  auspiciousDirections: string[];
  /** Inauspicious directions */
  inauspiciousDirections: string[];
  /** Best direction for each purpose */
  bestDirections: {
    success: string;
    health: string;
    relationships: string;
    personal: string;
  };
  /** Gender used for calculation */
  gender: string;
  /** Birth year used */
  birthYear: number;
}

/** I Ching hexagram result */
export interface Hexagram {
  /** Hexagram number (1-64) */
  number: number;
  /** Hexagram name (Chinese) */
  chineseName: string;
  /** Hexagram name (English) */
  englishName: string;
  /** Six-line binary representation (bottom to top) */
  lines: Array<{ position: number; type: 'yin' | 'yang'; changing: boolean }>;
  /** Upper trigram */
  upperTrigram: string;
  /** Lower trigram */
  lowerTrigram: string;
  /** Judgment text */
  judgment: string;
  /** Image text */
  image: string;
  /** Moving lines interpretation */
  movingLines?: string[];
  /** Relating (changed) hexagram, if any moving lines */
  relatingHexagram?: { number: number; chineseName: string; englishName: string };
  /** AI interpretation */
  interpretation: string;
  /** Question asked */
  question?: string;
}

/** Crystal recommendation */
export interface Crystal {
  /** Crystal name */
  name: string;
  /** Primary healing properties */
  properties: string[];
  /** Chakra association */
  chakra: string;
  /** Element association */
  element: string;
  /** Zodiac sign affinity */
  zodiacAffinity: string[];
  /** Color description */
  color: string;
  /** How to use the crystal */
  usage: string;
  /** Image URL */
  imageUrl?: string;
}

/** Human Design body graph */
export interface BodyGraph {
  /** Human Design type */
  type: string;
  /** Strategy */
  strategy: string;
  /** Authority (inner decision-making) */
  authority: string;
  /** Profile (e.g. "1/3", "4/6") */
  profile: string;
  /** Defined centers */
  definedCenters: string[];
  /** Undefined / open centers */
  openCenters: string[];
  /** Defined channels */
  channels: Array<{ name: string; gates: [number, number] }>;
  /** Incarnation cross */
  incarnationCross: string;
  /** Gates activated (conscious + unconscious) */
  gates: Array<{ number: number; line: number; conscious: boolean }>;
  /** AI interpretation */
  interpretation: string;
}

/** Human Design type summary */
export interface HDType {
  /** Type name (Manifestor, Generator, etc.) */
  type: string;
  /** Strategy for this type */
  strategy: string;
  /** Not-self theme */
  notSelfTheme: string;
  /** Signature when aligned */
  signature: string;
  /** Authority */
  authority: string;
  /** Description of this type */
  description: string;
}

/** Matrimony match result (unified Vedic + KP) */
export interface MatchResult {
  /** Ashtakoota / Dashakoota total score */
  totalScore: number;
  /** Maximum possible score */
  maxScore: number;
  /** Compatibility percentage */
  percentage: number;
  /** Compatibility verdict */
  verdict: 'Excellent' | 'Good' | 'Average' | 'Below Average' | 'Poor';
  /** Individual koota scores */
  kootas: Array<{ name: string; obtained: number; max: number; description: string }>;
  /** Dosha analysis */
  doshaAnalysis: {
    mangalDosha: { person1: boolean; person2: boolean; cancelled: boolean; details: string };
    nadiDosha: { present: boolean; cancelled: boolean; details: string };
    bhaKoot: { present: boolean; cancelled: boolean; details: string };
  };
  /** AI recommendation */
  recommendation: string;
}

/** Dosha cancellation result */
export interface DoshaResult {
  /** Dosha type analyzed */
  doshaType: string;
  /** Whether dosha is present for person 1 */
  person1HasDosha: boolean;
  /** Whether dosha is present for person 2 */
  person2HasDosha: boolean;
  /** Whether the dosha is cancelled by chart factors */
  cancelled: boolean;
  /** Cancellation reasons, if cancelled */
  cancellationReasons: string[];
  /** Severity if not cancelled */
  severity?: 'High' | 'Medium' | 'Low';
  /** Remedial measures */
  remedies: string[];
  /** Detailed explanation */
  explanation: string;
}

/** Mantra recommendation result */
export interface MantraResult {
  /** Primary recommended mantra */
  mantra: string;
  /** Transliteration in Latin script */
  transliteration: string;
  /** Meaning / translation */
  meaning: string;
  /** Associated deity */
  deity: string;
  /** Associated planet */
  planet: string;
  /** Recommended repetitions (japa count) */
  repetitions: number;
  /** Best time to chant */
  bestTime: string;
  /** Additional mantras */
  additionalMantras?: Array<{ mantra: string; transliteration: string; purpose: string }>;
}

/** Deity recommendation result */
export interface DeityResult {
  /** Primary recommended deity */
  deity: string;
  /** Reason for recommendation (based on chart) */
  reason: string;
  /** Associated planet / house */
  associatedPlanet: string;
  /** Worship method */
  worshipMethod: string;
  /** Auspicious day for worship */
  auspiciousDay: string;
  /** Offerings recommended */
  offerings: string[];
  /** Temple / direction to face */
  direction: string;
  /** Additional deities */
  additionalDeities?: Array<{ deity: string; reason: string }>;
}

/** Past life indication result */
export interface PastLifeResult {
  /** Past life karmic indicators */
  indicators: Array<{
    planet: string;
    house: number;
    indication: string;
    strength: 'Strong' | 'Moderate' | 'Subtle';
  }>;
  /** 5th house analysis (Purva Punya) */
  purvaPunya: string;
  /** 12th house analysis (past life indicator) */
  twelfthHouse: string;
  /** Karmic debts identified */
  karmicDebts: string[];
  /** Karmic blessings identified */
  karmicBlessings: string[];
  /** AI narrative interpretation */
  interpretation: string;
}

/** Daily bundle combining multiple daily insights */
export interface DailyBundle {
  /** Daily horoscope */
  horoscope: {
    sign: string;
    prediction: string;
    luckyNumber: number;
    luckyColor: string;
  };
  /** Panchang summary for today */
  panchang: {
    tithi: string;
    nakshatra: string;
    yoga: string;
    karana: string;
  };
  /** Tarot card of the day */
  tarotCard?: TarotCard;
  /** Daily mantra */
  mantra?: { text: string; transliteration: string };
  /** Daily crystal */
  crystal?: { name: string; properties: string[] };
  /** Date for this bundle */
  date: string;
}

/** All dasha systems result */
export interface AllDashaResult {
  /** Vimshottari dasha current period */
  vimshottari: { planet: string; startDate: string; endDate: string; level: string };
  /** Ashtottari dasha current period */
  ashtottari?: { planet: string; startDate: string; endDate: string; level: string };
  /** Chara dasha current period */
  chara?: { sign: string; startDate: string; endDate: string; level: string };
  /** Yogini dasha current period */
  yogini?: { yogini: string; planet: string; startDate: string; endDate: string };
  /** Currently active system recommendation */
  recommended: string;
}

/** Health astrology result */
export interface HealthResult {
  /** Vulnerable body areas based on chart */
  vulnerableAreas: Array<{ area: string; planet: string; house: number; risk: 'High' | 'Medium' | 'Low' }>;
  /** Current health transit influences */
  currentTransits: string;
  /** Preventive recommendations */
  recommendations: string[];
  /** Ayurvedic constitution (dosha type) */
  ayurvedicDosha: string;
  /** Favorable healing modalities */
  healingModalities: string[];
}

/** Career astrology result */
export interface CareerResult {
  /** Best career fields based on chart */
  suitableFields: string[];
  /** 10th house analysis */
  tenthHouse: string;
  /** Career-relevant yogas */
  careerYogas: Array<{ name: string; effect: string }>;
  /** Current career transit forecast */
  transitForecast: string;
  /** Best periods for career moves */
  auspiciousPeriods: Array<{ period: string; description: string }>;
  /** AI career guidance */
  guidance: string;
}

// ═══════════════════════════════════════════
// TS→Rust Transition-Tolerant Surfaces (SDK 3.0.6)
// ═══════════════════════════════════════════
//
// The TS→Rust cutover aligns Rust v2 responses to the live TS contract, so most
// families parse unchanged across either engine. A few families have a KNOWN
// transition divergence between supported server versions:
//   - western synastry/composite: Rust may OMIT the `interpretation`,
//     `orbQuality`, `signifies` prose blocks (uncited Western lore held back).
//   - matchmaking scoring: total score may differ by engine (value, not shape).
//   - angel-message: value/semantics differ (not surfaced as a typed SDK method).
//
// These types make every transition-divergent field OPTIONAL so a response from
// EITHER engine type-checks and parses cleanly. They are additive — existing
// untyped `Record<string, any>` returns are unchanged. No field is invented.

/** A single inter-chart aspect in a Western synastry/composite reading. */
export interface SynastryAspect {
  /** First planet in the aspect */
  planet1?: string;
  /** Second planet in the aspect */
  planet2?: string;
  /** Aspect type (conjunction, trine, square, …) */
  aspect?: string;
  /** Orb in degrees */
  orb?: number;
  /** Orb quality (exact / close / wide). OPTIONAL — omitted by some engines. */
  orbQuality?: string;
  /** What this aspect signifies. OPTIONAL — prose held back on some engines. */
  signifies?: string;
  /** Aspect interpretation prose. OPTIONAL — transition-divergent. */
  interpretation?: string;
}

/**
 * Western relationship (synastry / composite) result — transition-tolerant.
 *
 * EVERY interpretive/prose field is optional because the Rust engine may omit
 * `interpretation`, `orbQuality`, and `signifies` during the cutover while the
 * computed geometry (planets, aspects, orbs, MC) is value-parity-exact. Typing
 * these as optional means consumers that opt into the type never crash on a
 * missing prose block from either engine.
 */
export interface WesternRelationshipResult {
  /** synastry | composite | synastry-aspects | composite-aspects */
  type?: string;
  /** Inter-chart aspects (computed on both engines) */
  aspects?: SynastryAspect[];
  /** Overall relationship interpretation. OPTIONAL — transition-divergent. */
  interpretation?: string;
  /** Composite midheaven, if a composite reading */
  compositeMidheaven?: Record<string, any>;
  /** Any additional engine-specific fields are preserved as-is. */
  [key: string]: any;
}

/**
 * Normalize a Western relationship response so transition-divergent prose
 * fields are always at least present (defaulted to ''/[]), regardless of which
 * engine (TS or Rust) produced it. Pure shape-tolerance — invents NO data, only
 * guarantees the keys exist so downstream `.interpretation.length` etc. never
 * throws. Pass the raw `getWesternRelationship()` result through this.
 */
export function normalizeWesternRelationship(
  raw: Record<string, any> | null | undefined
): WesternRelationshipResult {
  const r = (raw && typeof raw === 'object') ? raw : {};
  const aspects = Array.isArray(r.aspects)
    ? r.aspects.map((a: any): SynastryAspect => ({
        ...(a && typeof a === 'object' ? a : {}),
        orbQuality: a?.orbQuality ?? a?.orb_quality ?? '',
        signifies: a?.signifies ?? '',
        interpretation: a?.interpretation ?? '',
      }))
    : [];
  return {
    ...r,
    aspects,
    interpretation: r.interpretation ?? '',
  };
}

/** Enhanced question query with V2 options */
export interface EnhancedQuestionQuery extends QuestionQuery {
  /** Astrology system: vedic, western, or kp */
  system?: 'vedic' | 'western' | 'kp';
  /**
   * Delivery tier. `standard` (default) and `fast` are always available; `fast`
   * trades some depth for latency. `eco` is served by the Vedika Eco engine — when
   * that engine is not configured on the serving deploy an eco request fails closed
   * with a masked 503 `ECO_UNAVAILABLE` before any wallet debit, so it is never charged.
   */
  speed?: 'standard' | 'fast' | 'eco';
  /** Conversation ID for multi-turn context */
  conversationId?: string;
  /** Partner birth details (for compatibility questions) */
  partnerBirthDetails?: BirthDetails;
  /** Include BPHS remedies */
  includeRemedies?: boolean;
  /** Query category hint */
  category?: string;
  /** Response format: 'text', 'markdown', or 'json' */
  responseFormat?: ResponseFormat;
}
