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
} from './types';
import {
  VedikaAPIError,
  AuthenticationError,
  RateLimitError,
  InsufficientCreditsError,
  ValidationError,
  TimeoutError,
  ServerError,
  NetworkError,
} from './exceptions';

/**
 * Main client for the Vedika Astrology API
 *
 * The ONLY B2B astrology API with AI-powered chatbot queries.
 *
 * @example
 * ```typescript
 * import { VedikaClient } from '@vedika-io/sdk';
 *
 * const client = new VedikaClient({ apiKey: 'vk_live_...' });
 *
 * const response = await client.askQuestion({
 *   question: 'What are my career prospects?',
 *   birthDetails: {
 *     datetime: '1990-06-15T14:30:00+05:30',
 *     latitude: 28.6139,
 *     longitude: 77.2090,
 *     timezone: 'Asia/Kolkata'
 *   }
 * });
 * ```
 */
export class VedikaClient {
  private client: AxiosInstance;
  private apiKey: string;
  private defaultLanguage: string;

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

    const baseURL = options.baseUrl || 'https://api.vedika.io';
    const timeout = options.timeout || 60000;

    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'User-Agent': '@vedika-io/sdk/1.0.0',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  /**
   * Handle API errors and convert to appropriate exception types
   */
  private handleError(error: AxiosError): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as { message?: string };
      const message = data?.message || error.message;

      switch (status) {
        case 401:
          throw new AuthenticationError(message);
        case 402:
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
   */
  async askQuestion(query: QuestionQuery): Promise<QuestionResponse> {
    const response = await this.client.post<QuestionResponse>('/api/v1/astrology/query', {
      question: query.question,
      birthDetails: query.birthDetails,
      language: query.language || this.defaultLanguage,
    });

    return response.data;
  }

  /**
   * Stream conversational astrology question response in real-time
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
   */
  async getBirthChart(query: BirthChartQuery): Promise<BirthChart> {
    const response = await this.client.post<BirthChart>('/api/v1/charts/birth', {
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
   */
  async getDashas(birthDetails: BirthDetails): Promise<DashaResponse> {
    const response = await this.client.post<DashaResponse>('/api/vedika/dasha-periods', {
      birthDetails,
    });

    return response.data;
  }

  /**
   * Check marriage compatibility using Ashtakoota matching
   */
  async checkCompatibility(query: CompatibilityQuery): Promise<CompatibilityResponse> {
    const response = await this.client.post<CompatibilityResponse>('/api/v1/compatibility/match', {
      person1: query.person1,
      person2: query.person2,
    });

    return response.data;
  }

  /**
   * Detect 300+ astrological yogas
   */
  async detectYogas(birthDetails: BirthDetails): Promise<YogaResponse> {
    const response = await this.client.post<YogaResponse>('/api/vedika/yoga-detection', {
      birthDetails,
    });

    return response.data;
  }

  /**
   * Analyze doshas (Kaal Sarp, Mangal, Sade Sati, etc.)
   */
  async analyzeDoshas(birthDetails: BirthDetails): Promise<DoshaResponse> {
    const response = await this.client.post<DoshaResponse>('/api/vedika/dosha-analysis', {
      birthDetails,
    });

    return response.data;
  }

  /**
   * Find auspicious times (Muhurtha) for important events
   */
  async getMuhurtha(query: MuhurthaQuery): Promise<MuhurthaResponse> {
    const response = await this.client.post<MuhurthaResponse>('/api/vedika/muhurtha', {
      date: query.date,
      location: query.location,
      eventType: query.eventType,
    });

    return response.data;
  }

  /**
   * Get numerology analysis (37 calculations)
   */
  async getNumerology(query: NumerologyQuery): Promise<NumerologyResponse> {
    const response = await this.client.post<NumerologyResponse>('/api/vedika/numerology', {
      name: query.name,
      birthDate: query.birthDate,
    });

    return response.data;
  }

  /**
   * Process multiple queries in batch for efficiency
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
}
