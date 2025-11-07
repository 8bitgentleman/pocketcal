/**
 * Multi-Year Holiday Calendar
 * Company holidays and Unispace gift days by year
 */

// Standard holidays that are the same every year
const STANDARD_HOLIDAYS: Record<number, string> = {
  
};

// Year-specific holidays (like Unispace gift days that may vary)
export const HOLIDAYS_2024: Record<number, string> = {
  ...STANDARD_HOLIDAYS,
  101: "New Year's Day",
  115: "MLK Jr. Day",
  527: "Memorial Day",
  619: "Juneteenth",
  703: "Independence Day Eve",
  704: "Independence Day",
  902: "Labor Day",
  1014: "Indigenous People's Day",
  1128: "Thanksgiving",
  1129: "Day after Thanksgiving",
  1225: "Christmas",
  // 2024 Unispace Gift Days
  1223: "Unispace Gift Day",
  1224: "Unispace Gift Day",
  1230: "Unispace Gift Day",
  1231: "Unispace Gift Day"
};

export const HOLIDAYS_2025: Record<number, string> = {
  ...STANDARD_HOLIDAYS,
  // 2025 Unispace Gift Days
  101: "New Year's Day",
  120: "MLK Jr. Day",
  526: "Memorial Day",
  619: "Juneteenth",
  703: "Independence Day Eve",
  704: "Independence Day", 
  901: "Labor Day",
  1013: "Indigenous People's Day",
  1127: "Thanksgiving",
  1128: "Day after Thanksgiving",
  1225: "Christmas",
  1226: "Unispace Gift Day",
  1227: "Unispace Gift Day",
  1230: "Unispace Gift Day",
  1231: "Unispace Gift Day"
};

export const HOLIDAYS_2026: Record<number, string> = {
  ...STANDARD_HOLIDAYS,
  // 2026 Unispace Gift Days (example)
  101: "New Year's Day",
  119: "MLK Jr. Day",
  525: "Memorial Day",
  619: "Juneteenth",
  703: "Independence Day Eve",
  704: "Independence Day", 
  907: "Labor Day",
  1012: "Indigenous People's Day",
  1126: "Thanksgiving",
  1127: "Day after Thanksgiving",
  1225: "Christmas",
};

/**
 * Get holidays for a specific year
 * @param year The year to get holidays for
 * @returns Holiday object for that year, or fallback to 2025
 */
export function getHolidaysForYear(year: number): Record<number, string> {
  switch (year) {
    case 2024: return HOLIDAYS_2024;
    case 2025: return HOLIDAYS_2025;
    case 2026: return HOLIDAYS_2026;
    default: return HOLIDAYS_2025; // fallback to 2025
  }
}

/**
 * Check if a date (MMDD format) is a company holiday for a specific year
 * @param date Date in MMDD format (e.g., 101 for Jan 1st)
 * @param year The year to check (defaults to current year)
 * @returns Holiday name if it's a holiday, null otherwise
 */
export function getHoliday(date: number, year: number = new Date().getFullYear()): string | null {
  const yearHolidays = getHolidaysForYear(year);
  return yearHolidays[date] || null;
}

/**
 * Check if a date (MMDD format) is a company holiday for a specific year
 * @param date Date in MMDD format (e.g., 101 for Jan 1st)
 * @param year The year to check (defaults to current year)
 * @returns True if it's a holiday
 */
export function isHoliday(date: number, year: number = new Date().getFullYear()): boolean {
  const yearHolidays = getHolidaysForYear(year);
  return date in yearHolidays;
}

/**
 * Get all holiday dates as an array of MMDD numbers for a specific year
 * @param year The year to get holidays for (defaults to current year)
 * @returns Array of holiday dates in MMDD format
 */
export function getAllHolidayDates(year: number = new Date().getFullYear()): number[] {
  const yearHolidays = getHolidaysForYear(year);
  return Object.keys(yearHolidays).map(Number);
}

/**
 * Convert ISO date string to MMDD format for holiday lookup
 * @param isoDate ISO date string (YYYY-MM-DD)
 * @returns Date in MMDD format
 */
export function isoDateToMMDD(isoDate: string): number {
  const parts = isoDate.split('-');
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  return month * 100 + day;
}

/**
 * Check if an ISO date is a company holiday
 * @param isoDate ISO date string (YYYY-MM-DD)
 * @returns Holiday name if it's a holiday, null otherwise
 */
export function getHolidayFromISODate(isoDate: string): string | null {
  const mmdd = isoDateToMMDD(isoDate);
  const year = parseInt(isoDate.split('-')[0], 10);
  return getHoliday(mmdd, year);
}

/**
 * Check if an ISO date is a company holiday
 * @param isoDate ISO date string (YYYY-MM-DD)
 * @returns True if it's a holiday
 */
export function isHolidayFromISODate(isoDate: string): boolean {
  const mmdd = isoDateToMMDD(isoDate);
  const year = parseInt(isoDate.split('-')[0], 10);
  return isHoliday(mmdd, year);
}