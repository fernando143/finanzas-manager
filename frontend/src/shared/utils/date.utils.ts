/**
 * Date utilities for handling timezone-aware date operations
 * in the Fianzas Manager application (GMT-3 timezone)
 */

/**
 * Creates a Date object representing 12:00 noon in the user's local timezone (GMT-3)
 * from a date string in YYYY-MM-DD format.
 * 
 * This ensures all financial transactions are stored at a consistent
 * time that avoids timezone boundary issues and represents noon in
 * the user's GMT-3 timezone. When the user's system is set to GMT-3,
 * this will automatically create the correct UTC timestamp.
 * 
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object representing 12:00 noon in local timezone (GMT-3)
 * 
 * @example
 * // User's system is in GMT-3 timezone
 * createLocalDate("2025-08-01") // Returns date representing Aug 1, 2025 12:00:00 GMT-3
 * // When sent to API as ISO string: "2025-08-01T15:00:00.000Z" (UTC)
 * // When displayed in browser: Aug 1, 2025 (shows as the correct date)
 */
export const createLocalDate = (dateString: string): Date => {
  // Split the date string into parts
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create a new Date at 12:00 noon in the user's local timezone
  // Since the user is in GMT-3, this will automatically be 12:00 GMT-3
  // JavaScript Date constructor uses local timezone, so no manual offset needed
  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

/**
 * Converts a local Date object to ISO string format for API transmission
 * while preserving the intended date in the user's timezone.
 * 
 * @param date - Date object in local timezone
 * @returns ISO string representing the date adjusted for proper storage
 */
export const toApiDateString = (date: Date): string => {
  return date.toISOString();
};

/**
 * Converts an API date string back to a date string suitable for HTML date inputs
 * Handles conversion from UTC back to local date representation
 * 
 * @param isoString - ISO date string from API (stored as UTC timestamp)
 * @returns Date string in YYYY-MM-DD format for HTML inputs
 */
export const fromApiDateString = (isoString: string): string => {
  const date = new Date(isoString);
  
  // Get the date components in the user's local timezone (GMT-3)
  // The Date object will automatically handle the timezone conversion
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Creates a Date object representing 12:00 noon in local timezone for the current date
 * Useful for default date values in forms
 * 
 * @returns Date object representing today at 12:00 noon in local timezone
 */
export const createLocalNoonToday = (): Date => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  
  // Create date at 12:00 noon in local timezone
  return new Date(year, month, day, 12, 0, 0, 0);
};

/**
 * Formats a date for display in the UI
 * Uses the browser's local timezone (which should be GMT-3)
 * 
 * @param date - Date object or ISO string
 * @param locale - Locale for formatting (defaults to Spanish Argentina for GMT-3)
 * @returns Formatted date string in local timezone
 */
export const formatDisplayDate = (
  date: Date | string, 
  locale: string = 'es-AR'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Formats a date for display in short format
 * Uses the browser's local timezone (which should be GMT-3)
 * 
 * @param date - Date object or ISO string
 * @param locale - Locale for formatting (defaults to Spanish Argentina for GMT-3)
 * @returns Short formatted date string in local timezone
 */
export const formatShortDate = (
  date: Date | string,
  locale: string = 'es-AR'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};