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

/**
 * Main client for the Vedika Astrology API
 *
 * The ONLY B2B astrology API with AI-powered chatbot queries.
 *
 * @example
 * ```typescript
 * import { VedikaClient } from 'vedika-sdk';
 *
 * const client = new VedikaClient({ apiKey: 'vk_test_...' });
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

    // SDK-5 (Apr 21, 2026): X-API-Key is DEPRECATED at server level, sunset
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
        'User-Agent': 'vedika-javascript-sdk/3.0.0',
      },
    });

    // Add response interceptor for error handling
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
      const data: any = error.response.data;
      const message = data?.message || error.message;

      switch (status) {
        case 401:
          throw new AuthenticationError(message);
        case 402:
          // SDK-2 (v2.3.1, Apr 21, 2026): Branch on server code field to
          // distinguish expired subscription from genuine wallet underrun.
          // Server emits SUBSCRIPTION_EXPIRED when billing period ended
          // (see server/middleware/request/subscriptionEnforcement.ts:249).
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
    const response = await this.client.post<DashaResponse>('/api/vedika/dasha-periods', {
      birthDetails,
    });

    return response.data;
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
    const response = await this.client.post<YogaResponse>('/api/vedika/yoga-detection', {
      birthDetails,
    });

    return response.data;
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
    const response = await this.client.post<DoshaResponse>('/api/vedika/dosha-analysis', {
      birthDetails,
    });

    return response.data;
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
    const response = await this.client.post<MuhurthaResponse>('/api/vedika/muhurtha', {
      date: query.date,
      location: query.location,
      eventType: query.eventType,
    });

    return response.data;
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
    const response = await this.client.post<NumerologyResponse>('/api/vedika/numerology', {
      name: query.name,
      birthDate: query.birthDate,
    });

    return response.data;
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
    const response = await this.client.post(`/v2/astrology/${chart}`, birthDetails);
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
    const path = period === 'daily' ? `${basePath}/horoscope/${sign}` : `${basePath}/horoscope/${sign}/${period}`;
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

  /** Get Western relationship analysis (synastry/composite) */
  async getWesternRelationship(
    type: WesternRelationshipType | string,
    person1: V2Query,
    person2: V2Query
  ): Promise<Record<string, any>> {
    const response = await this.client.post(`/v2/western/${type}`, { person1, person2 });
    return response.data;
  }

  // ═══════════════════════════════════════════
  // Project Dominion — New Domains
  // ═══════════════════════════════════════════

  /** Tarot domain methods */
  public tarot = {
    /** Get a single card of the day */
    cardOfTheDay: async (): Promise<TarotCard> => {
      const response = await this.client.get<TarotCard>('/v2/tarot/card-of-the-day');
      return response.data;
    },

    /** Draw a tarot spread */
    draw: async (spread: string, question?: string): Promise<TarotReading> => {
      const response = await this.client.post<TarotReading>('/v2/tarot/draw', {
        spread,
        ...(question && { question }),
      });
      return response.data;
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
      const response = await this.client.get<ChineseZodiac>(`/v2/chinese/zodiac/${year}`);
      return response.data;
    },

    /** Get BaZi (Four Pillars of Destiny) chart */
    bazi: async (birthDetails: V2Query): Promise<BaZiChart> => {
      const response = await this.client.post<BaZiChart>('/v2/chinese/bazi', birthDetails);
      return response.data;
    },

    /** Feng Shui sub-domain */
    fengShui: {
      /** Calculate personal Kua number */
      kuaNumber: async (birthYear: number, gender: string): Promise<KuaResult> => {
        const response = await this.client.get<KuaResult>('/v2/chinese/feng-shui/kua', {
          params: { birthYear, gender },
        });
        return response.data;
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
      const response = await this.client.get<Crystal[]>(`/v2/crystals/zodiac/${sign}`);
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
      const response = await this.client.post<HealthResult>('/v2/astrology/health', birthDetails);
      return response.data;
    },
  };

  /** Career astrology domain */
  public career = {
    /** Get career analysis from birth chart */
    analysis: async (birthDetails: V2Query): Promise<CareerResult> => {
      const response = await this.client.post<CareerResult>('/v2/astrology/career', birthDetails);
      return response.data;
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

  /** List all conversations */
  async getConversations(): Promise<Record<string, any>> {
    const response = await this.client.get('/api/v1/conversations');
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
  // SDK-3 (v2.3.1, Apr 21, 2026): typed voice envelope
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
   *   tier: 'vedika-jarvis',
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
