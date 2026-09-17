/**
 * Vedika JavaScript/Node.js SDK
 * The only B2B astrology API with AI-powered chatbot queries.
 *
 * @packageDocumentation
 */

export { VedikaClient } from './client';

export type {
  BirthDetails,
  QuestionResponse,
  Citation,
  Planet,
  House,
  BirthChart,
  Dasha,
  DashaResponse,
  CompatibilityResponse,
  Yoga,
  YogaResponse,
  DoshaInfo,
  DoshaResponse,
  TimeWindow,
  MuhurthaResponse,
  NumerologyResponse,
  VedikaClientOptions,
  QuestionQuery,
  BirthChartQuery,
  CompatibilityQuery,
  MuhurthaQuery,
  NumerologyQuery,
  BatchQueryItem,
  V2Query,
  PredictionQuery,
  HoroscopeQuery,
  EnhancedQuestionQuery,
  VastuReportQuestion,
  VastuReportContext,
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
  // TS→Rust transition-tolerant surfaces (3.0.6)
  SynastryAspect,
  WesternRelationshipResult,
  ResponseFormat,
  StructuredResponse,
  StructuredResponseSection,
  VoiceQuery,
  VoiceResponse,
  VoiceMetaHeader,
  VoiceResult,
  // Additional calculation types
  TarotCard,
  TarotReading,
  SpreadInfo,
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
  // Vastu (80 operations, 17 families)
  VastuMandalaScheme,
  VastuRoomType,
  VastuPlacementFeature,
  VastuAuditKind,
  VastuScoreKind,
  VastuArScanQualityInput,
  VastuArTrueNorthInput,
  VastuAssessmentsRequest,
  VastuAssessmentData,
  VastuAssessmentBadgeEligibility,
  VastuAssessmentsResponse,
} from './types';

// TS→Rust transition-tolerant value helper (3.0.6).
export { normalizeWesternRelationship } from './types';

export {
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

// Package metadata
export const VERSION = '3.0.9';
export const AUTHOR = 'Vedika Intelligence';
export const HOMEPAGE = 'https://vedika.io';
