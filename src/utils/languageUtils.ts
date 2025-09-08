/**
 * Language utilities for transcription tasks
 * Contains OpenAI-compatible language codes and display names
 */

/**
 * Interface for language option
 */
export interface LanguageOption {
  /** OpenAI-compatible language code */
  code: string;
  /** Display name for the language */
  name: string;
  /** Native name of the language */
  nativeName?: string;
}

/**
 * Supported languages for transcription
 * Limited to Chinese, English, and Malay as per requirements
 * These are the exact language codes that OpenAI expects
 */
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "auto", name: "Auto-detect", nativeName: "Automatic" },
  { code: "en", name: "English", nativeName: "English" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
];

/**
 * Default language for transcription (auto-detect)
 */
export const DEFAULT_LANGUAGE: LanguageOption = SUPPORTED_LANGUAGES[0]; // "auto"

/**
 * All supported languages (same as SUPPORTED_LANGUAGES since we only have 4 languages)
 */
export const POPULAR_LANGUAGES: LanguageOption[] = SUPPORTED_LANGUAGES;

/**
 * Get language option by code
 * @param code - Language code
 * @returns Language option or null if not found
 */
export const getLanguageByCode = (code: string): LanguageOption | null => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || null;
};

/**
 * Get display name for a language code
 * @param code - Language code
 * @returns Display name or the code itself if not found
 */
export const getLanguageDisplayName = (code: string): string => {
  const language = getLanguageByCode(code);
  return language ? language.name : code;
};

/**
 * Get native name for a language code
 * @param code - Language code
 * @returns Native name or display name if native name not available
 */
export const getLanguageNativeName = (code: string): string => {
  const language = getLanguageByCode(code);
  return language ? (language.nativeName || language.name) : code;
};

/**
 * Check if a language code is valid
 * @param code - Language code to validate
 * @returns True if the code is supported
 */
export const isValidLanguageCode = (code: string): boolean => {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
};

/**
 * Format language for display (shows both English and native names)
 * @param code - Language code
 * @returns Formatted display string
 */
export const formatLanguageDisplay = (code: string): string => {
  const language = getLanguageByCode(code);
  if (!language) return code;
  
  if (language.nativeName && language.nativeName !== language.name) {
    return `${language.name} (${language.nativeName})`;
  }
  
  return language.name;
};

/**
 * Search languages by name or native name
 * @param query - Search query
 * @returns Array of matching language options
 */
export const searchLanguages = (query: string): LanguageOption[] => {
  if (!query.trim()) return SUPPORTED_LANGUAGES;
  
  const searchTerm = query.toLowerCase().trim();
  
  return SUPPORTED_LANGUAGES.filter(lang => 
    lang.name.toLowerCase().includes(searchTerm) ||
    lang.code.toLowerCase().includes(searchTerm) ||
    (lang.nativeName && lang.nativeName.toLowerCase().includes(searchTerm))
  );
};
