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
 * SDK-1 (v2.3.1, Apr 21, 2026): Added to model forthcoming public-surface
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
  /**
   * Citations to classical sources used by the response. Optional — only
   * returned when the server-side citation-gate is enabled. Empty or
   * missing on non-enterprise tiers.
   */
  citations?: Citation[];
  /** Structured response (present only when responseFormat='json') */
  structuredResponse?: StructuredResponse;
}

/**
 * Voice response envelope (JSON fallback).
 *
 * SDK-3 (v2.3.1, Apr 21, 2026): Types the JSON body returned by
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
 * SDK-3 (v2.3.1, Apr 21, 2026).
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
 * SDK-3 (v2.3.1, Apr 21, 2026).
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
  /** Voice tier — defaults to 'vedika-standard' */
  tier?: 'vedika-standard' | 'vedika-jarvis' | 'vedika-native';
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
// Project Dominion — New Domain Types
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

/** Enhanced question query with V2 options */
export interface EnhancedQuestionQuery extends QuestionQuery {
  /** Astrology system: vedic, western, or kp */
  system?: 'vedic' | 'western' | 'kp';
  /** Speed: standard or fast (fast uses quicker model) */
  speed?: 'standard' | 'fast';
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
