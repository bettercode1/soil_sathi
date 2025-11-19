import { format, formatDistance, isToday, isYesterday, isThisWeek, isThisYear, type Locale } from "date-fns";
import { enUS } from "date-fns/locale";

// Note: Some locales may not be available in date-fns, using enUS as fallback
const locales: Record<string, Locale> = {
  en: enUS,
  hi: enUS, // Fallback to enUS if not available
  mr: enUS,
  ta: enUS,
  te: enUS,
  bn: enUS,
  pa: enUS,
};

/**
 * Format date for display based on language
 */
export const formatDate = (
  date: Date | string,
  formatStr: string = "MMM dd, yyyy",
  language: string = "en"
): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  const locale = locales[language] || locales.en;
  return format(dateObj, formatStr, { locale });
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (
  date: Date | string,
  language: string = "en"
): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  const locale = locales[language] || locales.en;
  return formatDistance(dateObj, new Date(), { addSuffix: true, locale });
};

/**
 * Format date for calendar display
 */
export const formatCalendarDate = (
  date: Date | string,
  language: string = "en"
): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  const locale = locales[language] || locales.en;

  if (isToday(dateObj)) {
    return "Today";
  }
  if (isYesterday(dateObj)) {
    return "Yesterday";
  }
  if (isThisWeek(dateObj)) {
    return format(dateObj, "EEEE", { locale }); // Day name
  }
  if (isThisYear(dateObj)) {
    return format(dateObj, "MMM dd", { locale });
  }
  return format(dateObj, "MMM dd, yyyy", { locale });
};

/**
 * Format date and time
 */
export const formatDateTime = (
  date: Date | string,
  language: string = "en"
): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  const locale = locales[language] || locales.en;
  return format(dateObj, "MMM dd, yyyy 'at' HH:mm", { locale });
};

/**
 * Format time only
 */
export const formatTime = (
  date: Date | string,
  language: string = "en"
): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  const locale = locales[language] || locales.en;
  return format(dateObj, "HH:mm", { locale });
};

/**
 * Get start of day
 */
export const getStartOfDay = (date: Date | string): Date => {
  const dateObj = date instanceof Date ? date : new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
};

/**
 * Get end of day
 */
export const getEndOfDay = (date: Date | string): Date => {
  const dateObj = date instanceof Date ? date : new Date(date);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
};

/**
 * Add days to date
 */
export const addDays = (date: Date | string, days: number): Date => {
  const dateObj = date instanceof Date ? date : new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
};

/**
 * Check if date is in range
 */
export const isDateInRange = (
  date: Date | string,
  startDate: Date | string,
  endDate: Date | string
): boolean => {
  const dateObj = date instanceof Date ? date : new Date(date);
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  return dateObj >= start && dateObj <= end;
};

