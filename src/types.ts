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
  /** IANA timezone (e.g., "Asia/Kolkata") */
  timezone?: string;
}

/**
 * Response from AI chatbot query (UNIQUE to Vedika!)
 */
export interface QuestionResponse {
  /** Detailed astrological answer from 6 AI agents */
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
  /** API base URL (default: production URL) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 60000) */
  timeout?: number;
  /** Maximum number of retries for failed requests (default: 3) */
  maxRetries?: number;
  /** Enable prompt caching for cost savings (default: true) */
  cacheEnabled?: boolean;
  /** Default language for responses (default: "en") */
  language?: string;
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
