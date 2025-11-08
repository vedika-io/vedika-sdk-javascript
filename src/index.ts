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
} from './types';

export {
  VedikaAPIError,
  AuthenticationError,
  RateLimitError,
  InsufficientCreditsError,
  ValidationError,
  TimeoutError,
  ServerError,
  NetworkError,
} from './exceptions';

// Package metadata
export const VERSION = '1.0.0';
export const AUTHOR = 'Vedika Intelligence';
export const HOMEPAGE = 'https://vedika.io';
