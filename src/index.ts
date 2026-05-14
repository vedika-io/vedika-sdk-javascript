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
  ResponseFormat,
  StructuredResponse,
  StructuredResponseSection,
  VoiceQuery,
  VoiceResponse,
  VoiceMetaHeader,
  VoiceResult,
  // Project Dominion types
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
} from './types';

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
export const VERSION = '3.0.0';
export const AUTHOR = 'Vedika Intelligence';
export const HOMEPAGE = 'https://vedika.io';
