/**
 * Holiday Calendar for 2025
 * Company holidays and Unispace gift days
 */

export const HOLIDAYS_2025: Record<number, string> = {
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
  // Unispace Gift Days
  1226: "Unispace Gift Day",
  1227: "Unispace Gift Day",
  1230: "Unispace Gift Day",
  1231: "Unispace Gift Day"
};

/**
 * Check if a date (MMDD format) is a company holiday
 * @param date Date in MMDD format (e.g., 101 for Jan 1st)
 * @returns Holiday name if it's a holiday, null otherwise
 */
export function getHoliday(date: number): string | null {
  return HOLIDAYS_2025[date] || null;
}

/**
 * Check if a date (MMDD format) is a company holiday
 * @param date Date in MMDD format (e.g., 101 for Jan 1st)
 * @returns True if it's a holiday
 */
export function isHoliday(date: number): boolean {
  return date in HOLIDAYS_2025;
}

/**
 * Get all holiday dates as an array of MMDD numbers
 * @returns Array of holiday dates in MMDD format
 */
export function getAllHolidayDates(): number[] {
  return Object.keys(HOLIDAYS_2025).map(Number);
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
  return getHoliday(mmdd);
}

/**
 * Check if an ISO date is a company holiday
 * @param isoDate ISO date string (YYYY-MM-DD)
 * @returns True if it's a holiday
 */
export function isHolidayFromISODate(isoDate: string): boolean {
  const mmdd = isoDateToMMDD(isoDate);
  return isHoliday(mmdd);
}